import { spawnSync } from 'node:child_process'
import { chmodSync, copyFileSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { afterEach, expect, it } from 'vitest'
import { createOpenCodexAdapter } from '../../evals/adapters/opencodex.mjs'
import { runProcess } from '../../evals/adapters/process.mjs'
import { hash } from '../../evals/runner/files.mjs'
import { reviewPacket } from '../../evals/runner/review.mjs'

const temps = []
function temp() {
  const path = mkdtempSync(join(tmpdir(), 'rsp-review-test-'))
  temps.push(path)
  return path
}
afterEach(() => temps.splice(0).forEach(path => rmSync(path, { recursive: true, force: true })))
function packet() {
  const body = { schema: 'semantic-review-v2', id: 'blind', prompt: 'Check the task.', rubric: [{ name: 'correctness', description: 'Correct task result.' }], evidence: { finalOutput: 'done', omittedArtifacts: [] } }
  return { ...body, packetHash: hash(body) }
}
function answer(status = 'pass') {
  return JSON.stringify({ dimensions: [{ name: 'correctness', status, reason: 'Specific supplied evidence.', evidence: ['finalOutput'] }] })
}
function fake(outputs, extraEvents = []) {
  const workspaces = []
  return {
    settings: { provider: 'test', model: 'same-model' },
    workspaces,
    async run({ workspace }) {
      workspaces.push(workspace)
      return { exitCode: 0, durationMs: 1, finalOutput: outputs.shift(), stderr: '', stdout: [...extraEvents, { type: 'turn.completed', usage: { input_tokens: 10 } }].map(item => JSON.stringify(item)).join('\n') }
    },
  }
}

it('passes the schema through the real adapter and host-binds review metadata', async () => {
  const dir = temp()
  const bin = join(dir, 'provider')
  copyFileSync('tests/engine/fixtures/provider.mjs', bin)
  chmodSync(bin, 0o755)
  const config = join(dir, 'config.toml')
  writeFileSync(config, 'model_provider = "fixture-provider"\n')
  const adapter = createOpenCodexAdapter({ codexBin: bin, model: 'fixture', effort: 'medium', configFile: config })
  const result = await reviewPacket(packet(), { adapter, outputRoot: dir })
  expect(result.status).toBe('passed')
  expect(result.attempts).toHaveLength(1)
  expect(result.decision).toMatchObject({ packetHash: packet().packetHash, reviewer: { provider: 'fixture-provider', model: 'fixture' }, reviewContext: { fresh: true, blindPacketOnly: true } })
  expect(JSON.parse(readFileSync(result.reportPath))).toMatchObject({ schemaHash: hash(result.outputSchema) })
})

it('defaults live review to astra/low while retaining explicit overrides', () => {
  const dir = temp()
  const bin = join(dir, 'provider')
  copyFileSync('tests/engine/fixtures/provider.mjs', bin)
  chmodSync(bin, 0o755)
  const config = join(dir, 'config.toml')
  const input = join(dir, 'packet.json')
  writeFileSync(config, `model_provider = "fixture-provider"${String.fromCharCode(10)}`)
  writeFileSync(input, JSON.stringify(packet()))
  for (const override of [false, true]) {
    const args = ['evals/runner/cli.mjs', 'review-live', '--allow-live', '--packet', input, '--config-file', config, '--codex-bin', bin, '--output-root', dir]
    if (override)
      args.push('--model', 'explicit-reviewer', '--effort', 'medium')
    const result = spawnSync(process.execPath, args, { encoding: 'utf8', timeout: 10000 })
    expect(result.status).toBe(0)
    const report = JSON.parse(readFileSync(JSON.parse(result.stdout).report))
    expect(report.settings).toMatchObject({ model: override ? 'explicit-reviewer' : 'AI-HUB/gpt-6-astra', effort: override ? 'medium' : 'low' })
  }
})

it('retries only invalid format once, preserves failures and uses fresh workspaces', async () => {
  const adapter = fake(['broken JSON', answer()])
  const result = await reviewPacket(packet(), { adapter, outputRoot: temp() })
  expect(result.status).toBe('passed')
  expect(result.attempts[0]).toMatchObject({ formatError: 'invalid JSON', result: { finalOutput: 'broken JSON' } })
  expect(new Set(adapter.workspaces).size).toBe(2)
  expect(adapter.workspaces.every(path => !existsSync(path))).toBe(true)
  const failed = await reviewPacket(packet(), { adapter: fake(['bad', 'bad', answer()]), outputRoot: temp() })
  expect(failed).toMatchObject({ status: 'inconclusive', category: 'format' })
  expect(failed.attempts).toHaveLength(2)
  expect(failed.decision).toBeUndefined()
})

it('does not retry valid negative verdicts, unavailable execution or contaminated context', async () => {
  for (const status of ['fail', 'inconclusive']) {
    const result = await reviewPacket(packet(), { adapter: fake([answer(status)]), outputRoot: temp() })
    expect(result.status).toBe(status === 'fail' ? 'failed' : 'inconclusive')
    expect(result.attempts).toHaveLength(1)
  }
  const contaminated = await reviewPacket(packet(), { adapter: fake([answer()], [{ type: 'item.completed', item: { type: 'command_execution', command: 'cat private', exit_code: 0 } }]), outputRoot: temp() })
  expect(contaminated.category).toBe('context-or-evidence')
  expect(contaminated.decision).toBeUndefined()
  expect(contaminated.attempts).toHaveLength(1)
  const adapter = fake([])
  adapter.run = async () => ({ exitCode: 1, stdout: '', stderr: 'unsupported schema' })
  const unavailable = await reviewPacket(packet(), { adapter, outputRoot: temp() })
  expect(unavailable.category).toBe('infrastructure')
  expect(unavailable.attempts).toHaveLength(1)
})

it.skipIf(process.platform === 'win32')('rejects output-limited review even with a complete event, valid JSON and a zero exit code', async () => {
  let calls = 0
  const adapter = {
    settings: { provider: 'local-test', model: 'none' },
    async run({ workspace }) {
      calls++
      const script = `
process.on('SIGTERM', () => process.exit(0))
console.log(JSON.stringify({ type: 'turn.completed' }))
setInterval(() => process.stderr.write('x'.repeat(65536)), 1)
`
      return { ...await runProcess(process.execPath, ['-e', script], { cwd: workspace, env: {}, input: '', timeoutMs: 5000 }), finalOutput: answer() }
    },
  }
  const result = await reviewPacket(packet(), { adapter, outputRoot: temp() })
  expect(result.attempts[0].result).toMatchObject({ outputLimited: true, exitCode: 0, timedOut: false })
  expect(result).toMatchObject({ status: 'inconclusive', category: 'infrastructure' })
  expect(calls).toBe(1)
  expect(result.decision).toBeUndefined()
  expect(existsSync(join(dirname(result.reportPath), 'decisions.json'))).toBe(false)
})
