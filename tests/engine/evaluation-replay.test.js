import { spawnSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { createReviewPacket } from '../../evals/graders/semantic-review.mjs'
import { loadCase } from '../../evals/runner/cases.mjs'
import { runCase } from '../../evals/runner/execute.mjs'
import { replayRun } from '../../evals/runner/replay.mjs'
import { compareStatistics, pairedOrder, summarizeValues } from '../../evals/runner/statistics.mjs'

const root = process.cwd()
const temps = []
afterEach(() => {
  for (const path of temps.splice(0))
    rmSync(path, { recursive: true, force: true })
})
function temp() {
  const path = mkdtempSync(join(tmpdir(), 'rsp-replay-test-'))
  temps.push(path)
  return path
}
async function runSource(source) {
  let calls = 0
  const result = await runCase(loadCase(root, 'preserve-user-files'), root, {
    outputRoot: temp(),
    adapter: {
      id: 'local-test',
      settings: { provider: 'local-test', model: 'fixture' },
      async run({ workspace }) {
        calls++
        writeFileSync(join(workspace, 'src/requested.mjs'), source)
        return { exitCode: 0, error: null, timedOut: false, durationMs: 1, stderr: '', finalOutput: 'Updated export.', stdout: `${JSON.stringify({ type: 'turn.completed' })}\n` }
      },
    },
  })
  return { result, getCalls: () => calls }
}

describe('offline evidence and unbiased comparison', () => {
  it('judges exports, not formatting, and replays without contacting the adapter or keeping its workspace', async () => {
    for (const source of ['export const requested=true;\n', '// equivalent export\nconst value = !false; export { value as requested };\n', 'export const requested = false;\n']) {
      const { result, getCalls } = await runSource(source)
      const expected = source.includes('= false') ? 'failed' : 'passed'
      expect(result.verdict.status).toBe(expected)
      const path = join(result.reportDirectory, 'run.json')
      const original = readFileSync(path, 'utf8')
      const replay = await replayRun(path, root)
      expect(replay.verdict.status).toBe(expected)
      expect(replay.matchesOriginal).toBe(true)
      expect(replay.providerInvocations).toBe(0)
      expect(getCalls()).toBe(1)
      expect(readFileSync(path, 'utf8')).toBe(original)
      const command = spawnSync(process.execPath, ['evals/runner/cli.mjs', 'replay', '--report', path], { cwd: root, encoding: 'utf8', timeout: 10000 })
      expect(command.status).toBe(expected === 'passed' ? 0 : 1)
      expect(JSON.parse(command.stdout).providerInvocations).toBe(0)
      writeFileSync(join(result.reportDirectory, 'events.jsonl'), '')
      expect((await replayRun(path, root)).verdict.status).toBe('inconclusive')
    }
  })

  it('bounds nonterminating module probes rather than hanging offline grading', async () => {
    const { result } = await runSource('while (true) {} export const requested=true;')
    expect(result.verdict.status).toBe('inconclusive')
  })

  it('does not disclose installed guidance, loading commands, workspace paths or arm identity in blind packets', () => {
    const packet = (candidate, indexChanged = false) => createReviewPacket({
      prompt: 'Change the requested export.',
      rubric: [{ name: 'correctness', description: 'Correct export.' }],
      workspace: '/tmp/private-run',
      result: { finalOutput: 'Updated export.' },
      observation: {
        changedPaths: ['src/requested.mjs'],
        diff: 'task diff',
        files: { 'src/requested.mjs': 'new', ...(candidate ? { '.agents/skills/rsp/SKILL.md': 'secret-composition' } : {}) },
        baseline: { 'src/requested.mjs': 'old', ...(candidate ? { '.agents/skills/rsp/SKILL.md': 'secret-composition' } : {}) },
        artifacts: { 'src/requested.mjs': 'export const requested=true' },
        omittedArtifacts: [],
        baselineHead: 'private-commit-identity',
        head: 'private-commit-identity',
        baselineIndexHash: candidate ? 'private-candidate-index' : 'private-baseline-index',
        indexHash: indexChanged ? 'changed-index' : candidate ? 'private-candidate-index' : 'private-baseline-index',
        checks: { rspReady: { exitCode: 0, result: { readiness: { completionGate: 'pass', archiveReady: 'yes' }, detail: '/tmp/private-run/check' } } },
      },
      events: { writes: ['src/requested.mjs'], commands: [
        ...(candidate ? [{ command: 'cat /tmp/private-run/.agents/skills/rsp/SKILL.md', exitCode: 0 }] : []),
        { command: 'cat /tmp/private-run/src/requested.mjs', exitCode: 0 },
      ] },
    })
    const a = packet(false)
    const b = packet(true)
    expect(a.evidence).toEqual(b.evidence)
    expect(JSON.stringify(b)).not.toContain('.agents')
    expect(JSON.stringify(b)).not.toContain('private-run')
    expect(JSON.stringify(b)).not.toContain('secret-composition')
    expect(JSON.stringify(b)).not.toContain('private-candidate-index')
    expect(JSON.stringify(b)).not.toContain('private-commit-identity')
    expect(b.evidence.hostGit).toEqual({ headUnchanged: true, indexUnchanged: true })
    expect(packet(true, true).evidence.hostGit.indexUnchanged).toBe(false)
    expect(b.evidence.projectChecks.rspReady.result.readiness).toEqual({ completionGate: 'pass', archiveReady: 'yes' })
    expect(a.id).not.toBe(b.id)
  })

  it('reproduces balanced pair order and keeps missing/failed observations visible in statistics', () => {
    const orders = Array.from({ length: 4 }, (_, i) => pairedOrder('fixed-seed', i + 1))
    expect(orders).toEqual(Array.from({ length: 4 }, (_, i) => pairedOrder('fixed-seed', i + 1)))
    expect(orders.filter(order => order[0] === 'baseline')).toHaveLength(2)
    expect(summarizeValues([10, 20, null])).toMatchObject({ samples: 2, missing: 1, mean: 15 })
    const run = (arm, status, durationMs, repetition) => ({ arm, case: 'sample', repetition, verdict: { status, category: status === 'inconclusive' ? 'infrastructure' : 'none' }, result: { durationMs }, events: { toolCalls: 2, modelInvocations: null } })
    const result = compareStatistics([run('baseline', 'passed', 10, 1), run('candidate', 'passed', 20, 1), run('candidate', 'inconclusive', 30, 2)])
    expect(result.byArm.candidate).toMatchObject({ total: 2, valid: 1, inconclusive: 1, successRate: 1 })
    expect(result.byArm.candidate.metrics.modelInvocations).toMatchObject({ samples: 0, missing: 2, mean: null })
    expect(result.pairedDeltas.durationMs.mean).toBe(10)
  })
})
