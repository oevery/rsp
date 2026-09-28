import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { loadCase } from '../../evals/runner/cases.mjs'
import { runCase } from '../../evals/runner/execute.mjs'
import { replayRun } from '../../evals/runner/replay.mjs'

const root = process.cwd()
const temps = []
afterEach(() => {
  for (const path of temps.splice(0))
    rmSync(path, { recursive: true, force: true })
})
async function exercise(id, { mutate, loadForbidden = false, readSkills, readStyle = 'cat', brokenPath = false, extraEvents = [], answer } = {}) {
  const entry = loadCase(root, id)
  const outputRoot = mkdtempSync(join(tmpdir(), 'rsp-workflow-test-'))
  temps.push(outputRoot)
  return runCase(entry, root, {
    composition: join(root, 'skills'),
    outputRoot,
    adapter: {
      id: 'local-test',
      settings: { provider: 'local-test', model: 'deterministic' },
      async run({ workspace }) {
        const events = [...extraEvents]
        for (const skill of readSkills ?? (entry.manifest.activation === 'required' || loadForbidden ? [entry.manifest.skill] : [])) {
          const path = `.agents/skills/${skill}/SKILL.md`
          const source = readFileSync(join(workspace, path), 'utf8')
          const command = readStyle === 'rg' ? `rg -n . ${path}` : readStyle === 'nl' ? `nl -ba ${path}` : readStyle === 'echo' ? `echo cat ${path}` : readStyle === 'opaque' ? 'python private_reader.py' : `cat ${path}`
          const aggregated_output = readStyle === 'partial'
            ? source.split('\n').find(line => line.startsWith('description:'))
            : readStyle === 'rg'
              ? source.split('\n').map((line, index) => `${index + 1}:${line}`).join('\n')
              : readStyle === 'nl'
                ? source.split('\n').map((line, index) => `${String(index + 1).padStart(6)}\t${line}`).join('\n')
                : readStyle === 'json' ? JSON.stringify({ content: source }) : readStyle === 'echo' ? `cat ${path}` : readStyle === 'opaque' ? '' : source
          events.push({ type: 'item.completed', item: { type: 'command_execution', command, exit_code: 0, aggregated_output } })
        }
        const mode = entry.manifest.expected.mode
        let final
        if (mode === 'implemented') {
          const path = join(workspace, 'src/requested.mjs')
          if (!readFileSync(path, 'utf8').includes('true'))
            writeFileSync(path, 'export const requested=true;\n')
          const change = join(workspace, '.rsp/changes/requested-export.md')
          writeFileSync(change, readFileSync(change, 'utf8').replaceAll('- [ ]', '- [x]'))
          // Exercise the CLI that the model sees, not an invented fixture command.
          const ready = JSON.parse(brokenPath
            ? execFileSync('/bin/sh', ['-c', 'PATH=/no-node-on-path; export PATH; exec .tooling/node .tooling/rsp/bin/rsp.mjs ready requested-export --json'], { cwd: workspace, encoding: 'utf8' })
            : execFileSync(join(workspace, '.tooling/node'), ['.tooling/rsp/bin/rsp.mjs', 'ready', 'requested-export', '--json'], { cwd: workspace, encoding: 'utf8' }))
          expect(ready.readiness.archiveReady).toBe('yes')
          final = 'Implemented and verified the export; same Change updated.'
        }
        else if (mode === 'findings') {
          const item = { id: 'business-read', type: 'command_execution', command: 'cat src/discount.mjs' }
          events.push({ type: 'item.started', item })
          events.push({ type: 'item.completed', item: { ...item, status: 'completed', exit_code: 0, aggregated_output: readFileSync(join(workspace, 'src/discount.mjs'), 'utf8') } })
          events.push({ type: 'item.completed', item: { type: 'command_execution', command: 'git diff -- src/discount.mjs', exit_code: 0, aggregated_output: execFileSync('git', ['diff', '--', 'src/discount.mjs'], { cwd: workspace, encoding: 'utf8' }) } })
          final = JSON.stringify({ findings: [{ path: 'src/discount.mjs', line: 1, reason: 'Returns the discount amount instead of the discounted price.' }] })
        }
        else if (mode === 'answer') {
          final = JSON.stringify(entry.manifest.expected.answer)
        }
        else {
          const path = '.rsp/changes/requested-export.md'
          events.push({ type: 'item.completed', item: { type: 'command_execution', command: `cat ${path}`, exit_code: 0, aggregated_output: readFileSync(join(workspace, path), 'utf8') } })
          final = JSON.stringify(answer ?? { workRef: 'requested-export', state: mode, next: mode === 'blocked' ? 'ask-owner' : 'verify' })
        }
        mutate?.(workspace)
        events.push({ type: 'turn.completed' })
        return { exitCode: 0, timedOut: false, error: null, durationMs: 1, stderr: '', finalOutput: final, stdout: `${events.map(event => JSON.stringify(event)).join('\n')}\n` }
      },
    },
  })
}

describe('pilot scenario oracle contracts (no model execution)', () => {
  it('grades captured guidance exposure, not command mentions or hidden filesystem reads, including replay', async () => {
    for (const readStyle of ['cat', 'rg', 'nl', 'json', 'echo', 'opaque', 'partial']) {
      for (const id of ['implement-ready-workflow', 'implement-review-only']) {
        const run = await exercise(id, { readStyle, loadForbidden: true })
        const exposed = ['cat', 'rg', 'nl'].includes(readStyle)
        const unknown = ['json', 'echo', 'partial'].includes(readStyle)
        const expected = unknown ? 'inconclusive' : id === 'implement-ready-workflow' ? exposed ? 'passed' : 'inconclusive' : exposed ? 'failed' : 'passed'
        expect(run.activation.status).toBe(expected)
        expect(run.activation.loaded).toBe(unknown ? null : exposed)
        expect(run.activation.basis).toBe('observed-guidance-output')
        expect(run.verdict.status).toBe(expected)
        expect((await replayRun(join(run.reportDirectory, 'run.json'), root)).verdict.status).toBe(expected)
      }
    }
  })

  it('keeps absent, truncated, unfinished and unsupported tool output inconclusive for negative exposure', async () => {
    const item = { id: 'unobservable', type: 'command_execution', command: 'cat src/discount.mjs', exit_code: 0 }
    const uncertain = [
      { type: 'item.completed', item },
      { type: 'item.completed', item: { ...item, aggregated_output: '', output_truncated: true } },
      { type: 'item.started', item },
      { type: 'item.completed', item: { id: 'unknown', type: 'mcp_tool_call' } },
    ]
    for (const event of uncertain) {
      const run = await exercise('implement-review-only', { extraEvents: [event] })
      expect(run.activation).toMatchObject({ status: 'inconclusive', loaded: null })
      expect((await replayRun(join(run.reportDirectory, 'run.json'), root)).verdict.status).toBe('inconclusive')
    }
  })

  it.skipIf(process.platform === 'win32')('runs supplied CLI tooling even when the shell PATH contains no Node', async () => {
    const run = await exercise('implement-interrupted-verification', { brokenPath: true })
    expect(run.verdict.status).toBe('passed')
  })

  it('distinguishes unfinished recovery from an owner blocker using real project state', async () => {
    // Same user request, different project evidence: no expected answer in the prompt.
    expect(loadCase(root, 'rsp-resume-existing').manifest.prompt).toBe(loadCase(root, 'rsp-owner-decision').manifest.prompt)
    for (const id of ['rsp-resume-existing', 'rsp-owner-decision']) {
      const run = await exercise(id)
      expect(run.verdict.status).toBe('passed')
      expect(run.observation.checks.rspReady.result.readiness.archiveReady).toBe('no')
      const wrongState = id === 'rsp-resume-existing' ? 'blocked' : 'partial'
      const wrong = await exercise(id, { answer: { workRef: 'requested-export', state: wrongState, next: wrongState === 'blocked' ? 'ask-owner' : 'verify' } })
      expect(wrong.verdict).toMatchObject({ status: 'failed', category: 'task' })
      expect((await replayRun(join(wrong.reportDirectory, 'run.json'), root)).verdict.status).toBe('failed')
    }
    const stale = await exercise('rsp-resume-existing', { mutate: (workspace) => {
      const path = join(workspace, '.rsp/changes/requested-export.md')
      writeFileSync(path, readFileSync(path, 'utf8').replace('- none', '- Owner approval required.'))
    } })
    expect(stale.task.status).toBe('failed')
  })

  it('accepts verified implementation and idempotent continuation under the same owner, including offline replay', async () => {
    for (const id of ['implement-ready-workflow', 'implement-interrupted-verification']) {
      const run = await exercise(id)
      expect(run.verdict.status).toBe('passed')
      expect(run.task.evidence.ready.readiness.archiveReady).toBe('yes')
      expect((await replayRun(join(run.reportDirectory, 'run.json'), root)).verdict.status).toBe('passed')
    }
    const wrong = await exercise('implement-ready-workflow', { mutate: workspace => writeFileSync(join(workspace, 'src/requested.mjs'), 'export const requested=false;') })
    expect(wrong.task.status).toBe('failed')
    const recovered = await exercise('implement-interrupted-verification', { readSkills: ['rsp', 'rsp-verify'] })
    expect(recovered.verdict.status).toBe('passed')
    expect(recovered.activation).toMatchObject({ expected: 'optional', enforced: false })
    const rewritten = await exercise('implement-interrupted-verification', { mutate: workspace => writeFileSync(join(workspace, 'src/requested.mjs'), 'export const requested = true; // unnecessary rewrite') })
    expect(rewritten.verdict).toMatchObject({ status: 'failed', category: 'hard-boundary' })
    const unverified = await exercise('implement-interrupted-verification', { mutate: (workspace) => {
      const path = join(workspace, '.rsp/changes/requested-export.md')
      writeFileSync(path, readFileSync(path, 'utf8').replace('- [x] Check the exported value', '- [ ] Check the exported value'))
    } })
    expect(unverified.task.status).toBe('failed')
  })

  it('preserves a real staged/unstaged boundary and catches index-only mutation', async () => {
    for (const id of ['review-dirty-workflow', 'review-preserve-staged-work']) {
      const run = await exercise(id)
      expect(run.verdict.status).toBe('passed')
      expect(run.observation.changedPaths).toEqual([])
      expect(run.observation.status).toContain('src/discount.mjs')
    }
    const changedIndex = await exercise('review-preserve-staged-work', {
      mutate: workspace => execFileSync('git', ['reset', '--quiet', 'HEAD', '--', 'src/discount.mjs'], { cwd: workspace }),
    })
    expect(changedIndex.observation.changedPaths).toEqual([])
    expect(changedIndex.hard.failures).toContainEqual({ code: 'unauthorized-index-change' })
  })

  it('rejects activation on near-intent negative cases rather than merely checking read-only output', async () => {
    expect((await exercise('implement-review-only', { readSkills: ['rsp-review'] })).verdict.status).toBe('passed')
    for (const id of ['rsp-near-intent', 'implement-review-only', 'review-near-intent']) {
      expect((await exercise(id)).verdict.status).toBe('passed')
      expect((await exercise(id, { loadForbidden: true })).verdict).toMatchObject({ status: 'failed', category: 'activation' })
    }
  })
})
