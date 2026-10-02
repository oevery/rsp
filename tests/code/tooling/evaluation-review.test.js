import { spawnSync } from 'node:child_process'
import { chmodSync, copyFileSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, expect, it, vi } from 'vitest'
import { createOpenCodexAdapter } from '../../skills/runner/adapters/opencodex.mjs'
import { runProcess } from '../../skills/runner/adapters/process.mjs'
import { loadConfig } from '../../skills/runner/core/config.mjs'
import { reviewRun } from '../../skills/runner/core/review.mjs'

const temps = []
function temp() {
  const path = mkdtempSync(join(tmpdir(), 'rsp-review-test-'))
  temps.push(path)
  return path
}
afterEach(() => temps.splice(0).forEach(path => rmSync(path, { recursive: true, force: true })))
function record() {
  return { case: 'example', caseSpec: { prompt: 'Check the task.', rubric: [{ name: 'correctness', description: 'Correct task result.' }] }, result: { finalOutput: 'done', stdout: 'command outputs' }, observation: { diff: 'actual diff' } }
}
function answer(status = 'passed') {
  return `# Review\nEvidence: current/run.json.\n\n${String.fromCharCode(96).repeat(3)}json\n${JSON.stringify({ status })}\n${String.fromCharCode(96).repeat(3)}`
}
function fake(output, extraEvents = []) {
  return {
    settings: { provider: 'test', model: 'same-model' },
    workspaces: [],
    async run({ workspace }) {
      this.workspaces.push(workspace)
      return { exitCode: 0, durationMs: 1, finalOutput: output, stderr: '', stdout: [...extraEvents, { type: 'turn.completed', usage: { input_tokens: 10 } }].map(item => JSON.stringify(item)).join('\n') }
    },
  }
}
it('uses native judge read-only mode, reads retained outputs and saves a Markdown report', async () => {
  const dir = temp()
  const bin = join(dir, 'provider')
  copyFileSync('tests/code/tooling/fixtures/provider.mjs', bin)
  chmodSync(bin, 0o755)
  const config = join(dir, 'config.toml')
  writeFileSync(config, 'model_provider = "fixture-provider"\n')
  writeFileSync(join(dir, 'provider-control.json'), JSON.stringify({ largeOutput: true }))
  const adapter = createOpenCodexAdapter({ codexBin: bin, model: 'fixture', effort: 'medium', configFile: config, role: 'judge' })
  const result = await reviewRun(record(), { adapter, outputRoot: dir })
  expect(result).toMatchObject({ status: 'passed', parsed: true, timeoutMs: null, schema: 'agent-review-run-v1' })
  expect(result.attempts).toHaveLength(1)
  expect(result.attempts[0].result.stdout).toBeUndefined()
  expect(result.attempts[0].result.stderr).toBeUndefined()
  expect(readFileSync(join(dirname(result.reportPath), 'events.jsonl')).length).toBeGreaterThan(8 * 1024 * 1024)
  expect(readFileSync(join(dirname(result.reportPath), 'stderr.log')).length).toBe(160 * 65536)
  expect(result.attempts[0].toolCalls).toBeGreaterThan(0)
  expect(readFileSync(result.report, 'utf8')).toContain('current/events.jsonl')
  expect(JSON.parse(readFileSync(result.reportPath)).settings.role).toBe('judge')
})
it('runs one executor and one independent judge using shared configuration without rewriting execution', () => {
  const dir = temp()
  const bin = join(dir, 'provider')
  copyFileSync('tests/code/tooling/fixtures/provider.mjs', bin)
  chmodSync(bin, 0o755)
  const config = join(dir, 'config.toml')
  writeFileSync(config, 'model_provider = "fixture-provider"\n')
  const args = ['tests/skills/runner/cli.mjs', 'run', '--allow-live', '--case', 'preserve-user-files', '--config-file', config, '--codex-bin', bin, '--output-root', dir, '--max-sessions', '2']
  const result = spawnSync(process.execPath, args, { encoding: 'utf8', timeout: 15000 })
  expect(result.status, result.stderr).toBe(0)
  const matrix = JSON.parse(readFileSync(JSON.parse(result.stdout).report))
  expect(matrix).toMatchObject({ status: 'passed', rootSessions: 2, complete: true })
  const run = JSON.parse(readFileSync(matrix.runs[0].run))
  const review = JSON.parse(readFileSync(matrix.runs[0].review))
  const shared = loadConfig()
  expect(run.identity.executor).toMatchObject({ model: shared.executor.model, effort: shared.executor.model_reasoning_effort })
  expect(review.settings).toMatchObject({ model: shared.judge.model, effort: shared.judge.model_reasoning_effort })
  expect(run.semantic.status).toBe('inconclusive')
  const index = JSON.parse(readFileSync(join(dirname(review.reportPath ?? matrix.runs[0].review), 'evidence-index.json')))
  expect(index.current.source.directory).toBe(dirname(matrix.runs[0].run))
  expect(readFileSync(join(index.current.source.directory, 'workspace/src/requested.mjs'), 'utf8')).toContain('true')
  expect(existsSync(join(dirname(matrix.runs[0].run), 'review-packet.json'))).toBe(false)
  expect(spawnSync(process.execPath, [...args, '--model', 'override'], { encoding: 'utf8' }).status).not.toBe(0)
})
it('retains unparsed reports without retries and accepts evidence-reading tool calls', async () => {
  const adapter = fake('# Review\nUseful findings without a status marker.')
  const result = await reviewRun(record(), { adapter, outputRoot: temp() })
  expect(result).toMatchObject({ status: 'inconclusive', parsed: false, category: 'format', reason: 'report-retained-status-unparsed' })
  expect(readFileSync(result.report, 'utf8')).toContain('Useful findings')
  expect(result.attempts).toHaveLength(1)
  expect(adapter.workspaces.every(path => !existsSync(path))).toBe(true)
  const read = await reviewRun(record(), { adapter: fake(answer(), [{ type: 'item.completed', item: { type: 'command_execution', command: 'cat current/run.json', exit_code: 0 } }]), outputRoot: temp() })
  expect(read.status).toBe('passed')
  expect(read.attempts[0].toolCalls).toBe(1)
})
it('preserves negative findings and partial reports without automatic retry', async () => {
  for (const status of ['failed', 'inconclusive']) {
    const result = await reviewRun(record(), { adapter: fake(answer(status)), outputRoot: temp() })
    expect(result.status).toBe(status)
    expect(result.attempts).toHaveLength(1)
  }
  const adapter = fake('Partial findings retained.')
  const original = adapter.run
  adapter.run = async input => ({ ...await original.call(adapter, input), exitCode: 1 })
  const unavailable = await reviewRun(record(), { adapter, outputRoot: temp() })
  expect(unavailable.category).toBe('infrastructure')
  expect(readFileSync(unavailable.report, 'utf8')).toBe('Partial findings retained.')
})
it('saves cancellation without another session or accepting exit zero', async () => {
  for (const boundary of ['before', 'result']) {
    const controller = new AbortController()
    const adapter = fake(answer())
    const original = adapter.run
    adapter.run = vi.fn(async (input) => {
      const result = await original.call(adapter, input)
      controller.abort('SIGTERM')
      return result
    })
    const result = await reviewRun(record(), { adapter, outputRoot: temp(), signal: controller.signal, beforeAttempt: () => {
      if (boundary === 'before')
        controller.abort('SIGTERM')
    } })
    expect(adapter.run).toHaveBeenCalledTimes(boundary === 'before' ? 0 : 1)
    expect(result).toMatchObject({ cancelled: true, cancellationReason: 'SIGTERM', status: 'inconclusive', reason: 'review-cancelled' })
    if (boundary !== 'before') {
      expect(result.attempts[0].result).toMatchObject({ exitCode: 0, cancelled: true })
      expect(readFileSync(result.report, 'utf8')).toContain('# Review')
    }
  }
})
it('does not accept a review when its evidence sink cannot be opened', async () => {
  let calls = 0
  const adapter = {
    settings: { provider: 'local-test', model: 'none' },
    async run({ workspace, outputRoot }) {
      calls++
      const marker = join(outputRoot, 'started')
      const script = `require('node:fs').writeFileSync(${JSON.stringify(marker)}, 'started')`
      const result = await runProcess(process.execPath, ['-e', script], { cwd: workspace, env: {}, input: '', stdoutPath: join(outputRoot, 'missing/events.jsonl') })
      expect(existsSync(marker)).toBe(false)
      return { ...result, finalOutput: answer() }
    },
  }
  const result = await reviewRun(record(), { adapter, outputRoot: temp() })
  expect(result.attempts[0].result).toMatchObject({ error: 'evidence-write-failed', exitCode: null })
  expect(result.status).toBe('inconclusive')
  expect(calls).toBe(1)
  expect(readFileSync(result.report, 'utf8')).toContain('# Review')
})
