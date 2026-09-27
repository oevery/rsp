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
async function exercise(id, { mutate, loadForbidden = false, readSkills, readStyle = 'cat', brokenPath = false } = {}) {
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
        const events = []
        for (const skill of readSkills ?? (entry.manifest.activation === 'required' || loadForbidden ? [entry.manifest.skill] : [])) {
          const path = `.agents/skills/${skill}/SKILL.md`
          const source = readFileSync(join(workspace, path), 'utf8')
          const command = readStyle === 'rg' ? `rg -n . ${path}` : readStyle === 'echo' ? `echo cat ${path}` : readStyle === 'opaque' ? 'python private_reader.py' : `cat ${path}`
          const aggregated_output = readStyle === 'rg' ? source.split('\n').map((line, index) => `${index + 1}:${line}`).join('\n') : readStyle === 'echo' ? `cat ${path}` : readStyle === 'opaque' ? '' : source
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
          final = JSON.stringify({ findings: [{ path: 'src/discount.mjs', line: 1, reason: 'Returns the discount amount instead of the discounted price.' }] })
        }
        else if (mode === 'answer') {
          final = JSON.stringify(entry.manifest.expected.answer)
        }
        else {
          final = JSON.stringify({ workRef: 'requested-export', state: mode, next: mode === 'blocked' ? 'ask-owner' : 'verify' })
        }
        mutate?.(workspace)
        events.push({ type: 'turn.completed' })
        return { exitCode: 0, timedOut: false, error: null, durationMs: 1, stderr: '', finalOutput: final, stdout: `${events.map(event => JSON.stringify(event)).join('\n')}\n` }
      },
    },
  })
}

describe('pilot scenario oracle contracts (no model execution)', () => {
  it('grades observed guidance content, not command mentions, and keeps opaque reads inconclusive during replay', async () => {
    for (const readStyle of ['rg', 'echo', 'opaque']) {
      for (const id of ['implement-ready-workflow', 'implement-review-only']) {
        const run = await exercise(id, { readStyle, loadForbidden: true })
        const expected = readStyle === 'rg' ? id === 'implement-ready-workflow' ? 'passed' : 'failed' : 'inconclusive'
        expect(run.activation.status).toBe(expected)
        expect(run.activation.loaded).toBe(readStyle === 'rg' ? true : null)
        expect(run.verdict.status).toBe(expected)
        expect((await replayRun(join(run.reportDirectory, 'run.json'), root)).verdict.status).toBe(expected)
      }
    }
  })

  it.skipIf(process.platform === 'win32')('runs supplied CLI tooling even when the shell PATH contains no Node', async () => {
    const run = await exercise('implement-interrupted-verification', { brokenPath: true })
    expect(run.verdict.status).toBe('passed')
  })

  it('distinguishes unfinished recovery from an owner blocker using real project state', async () => {
    for (const id of ['rsp-resume-existing', 'rsp-owner-decision']) {
      const run = await exercise(id)
      expect(run.verdict.status).toBe('passed')
      expect(run.observation.checks.rspReady.result.readiness.archiveReady).toBe('no')
    }
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
    for (const id of ['rsp-near-intent', 'implement-review-only', 'review-near-intent']) {
      expect((await exercise(id)).verdict.status).toBe('passed')
      expect((await exercise(id, { loadForbidden: true })).verdict).toMatchObject({ status: 'failed', category: 'activation' })
    }
  })
})
