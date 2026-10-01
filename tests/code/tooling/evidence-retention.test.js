import { Buffer } from 'node:buffer'
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, expect, it, vi } from 'vitest'
import { loadCase } from '../../skills/runner/core/cases.mjs'
import { runCase } from '../../skills/runner/core/execute.mjs'
import { hash } from '../../skills/runner/core/files.mjs'
import { reviewRun } from '../../skills/runner/core/review.mjs'

const temporary = []
function temp() {
  const dir = mkdtempSync(join(tmpdir(), 'rsp-evidence-retention-'))
  temporary.push(dir)
  return dir
}
afterEach(() => temporary.splice(0).forEach(path => rmSync(path, { recursive: true, force: true })))

it('retains large task text and initial Skill context before cleanup, with explicit safe omissions', async () => {
  const outputRoot = temp()
  const privateFile = join(temp(), 'private.txt')
  writeFileSync(privateFile, 'outside workspace')
  const large = `export const requested = true\n${'// task artifact\n'.repeat(5000)}`
  const entry = loadCase(process.cwd(), 'preserve-user-files')
  const adapter = {
    id: 'local-test',
    settings: { provider: 'fixture', model: 'none', effort: 'none' },
    redact: text => text.replaceAll('synthetic-credential', '[REDACTED]'),
    async run({ workspace }) {
      writeFileSync(join(workspace, 'src/requested.mjs'), large)
      writeFileSync(join(workspace, '.env'), 'TOKEN=synthetic-credential')
      writeFileSync(join(workspace, 'binary.dat'), Buffer.from([0, 1, 2]))
      symlinkSync(privateFile, join(workspace, 'outside-link'))
      return { exitCode: 0, stdout: JSON.stringify({ type: 'item.completed', item: { type: 'command_execution', command: 'echo result', exit_code: 0, aggregated_output: 'synthetic-credential result' } }), stderr: '', finalOutput: 'Task output.', durationMs: 1 }
    },
  }
  const run = await runCase(entry, process.cwd(), { adapter, outputRoot, composition: join(process.cwd(), 'skills') })
  expect(existsSync(run.context.workspace)).toBe(false)
  expect(run.observation.omittedArtifacts).toContain('src/requested.mjs')
  expect(readFileSync(join(run.reportDirectory, 'workspace/src/requested.mjs'), 'utf8')).toBe(large)
  expect(readFileSync(join(run.reportDirectory, 'baseline/.agents/skills/rsp/SKILL.md'), 'utf8')).toContain('name: rsp')
  expect(run.retainedEvidence.workspace.omitted).toEqual(expect.arrayContaining([{ path: '.env', reason: 'sensitive-file' }, { path: 'binary.dat', reason: 'binary' }, { path: 'outside-link', reason: 'link-or-special-file' }]))
  expect(existsSync(join(run.reportDirectory, 'workspace/outside-link'))).toBe(false)
  expect(readFileSync(join(run.reportDirectory, 'events.jsonl'), 'utf8')).toContain('[REDACTED] result')
  const reviewer = {
    settings: { provider: 'local-test', model: 'none' },
    async run({ workspace, prompt }) {
      expect(prompt.length).toBeLessThan(10000)
      expect(readFileSync(join(workspace, 'current/workspace/src/requested.mjs'), 'utf8')).toBe(large)
      expect(readFileSync(join(workspace, 'current/baseline/.agents/skills/rsp/SKILL.md'), 'utf8')).toContain('name: rsp')
      expect(readFileSync(join(workspace, 'current/events.jsonl'), 'utf8')).toContain('[REDACTED] result')
      return { exitCode: 0, stdout: '', stderr: '', finalOutput: `Review: current/workspace/src/requested.mjs is available.\n\n${String.fromCharCode(96).repeat(3)}json\n{"status":"failed"}\n${String.fromCharCode(96).repeat(3)}`, durationMs: 1 }
    },
  }
  const review = await reviewRun(run, { adapter: reviewer, outputRoot })
  expect(review.status).toBe('failed')
  const index = JSON.parse(readFileSync(join(review.reportPath, '..', 'evidence-index.json')))
  expect(index.current.source).toMatchObject({ directory: run.reportDirectory, hash: hash(readFileSync(join(run.reportDirectory, 'run.json'))) })
  expect(readFileSync(join(index.current.source.directory, 'workspace/src/requested.mjs'), 'utf8')).toBe(large)
})

it('records auxiliary baseline retention failure without skipping the executor', async () => {
  const outputRoot = temp()
  const adapter = { id: 'local-test', settings: { provider: 'fixture', model: 'none', effort: 'none' }, run: vi.fn(async () => ({ exitCode: 0, stdout: '', stderr: '', finalOutput: 'Completed.', durationMs: 1 })) }
  const run = await runCase(loadCase(process.cwd(), 'preserve-user-files'), process.cwd(), { adapter, outputRoot, onActivity({ phase }) {
    // Actual filesystem fault: the destination's parent cannot be a directory.
    if (phase === 'composition')
      writeFileSync(join(outputRoot, readdirSync(outputRoot)[0], 'baseline'), 'blocked')
  } })
  expect(adapter.run).toHaveBeenCalledOnce()
  expect(run.retainedEvidence.baseline.omitted).toContainEqual({ path: 'src/requested.mjs', reason: 'unreadable' })
  expect(run.retainedEvidence.workspace.retained).toContain('src/requested.mjs')
})
