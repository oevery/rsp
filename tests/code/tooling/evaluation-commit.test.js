import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadCase, parseCase } from '../../skills/runner/core/cases.mjs'
import { runCase } from '../../skills/runner/core/execute.mjs'
import { gradeHardBoundary } from '../../skills/runner/graders/hard-boundary.mjs'

// These controls copy isolated dependencies and run real Git/CLI subprocesses.
// Keep their I/O allowance local instead of slowing down fast code tests.
vi.setConfig({ testTimeout: 15000 })

const root = process.cwd()
const temporary = []
function temp() {
  const path = mkdtempSync(join(tmpdir(), 'rsp-commit-evaluation-test-'))
  temporary.push(path)
  return path
}
afterEach(() => {
  for (const path of temporary.splice(0))
    rmSync(path, { recursive: true, force: true })
})

// Deterministic test adapter: every command event below records an actual child
// exit and output. This is local engine evidence, never provider acceptance.
function adapter(mode = 'success') {
  return {
    id: 'local-test',
    settings: { provider: 'local-test', model: 'none', effort: 'none' },
    async run({ workspace }) {
      const events = []
      const command = (executable, args) => {
        const literal = mode === 'quoted-argv' && executable === '.tooling/node'
          ? [executable, ...args].map((arg, index) => arg.includes('/') || arg.endsWith('.txt') ? `"${index === 0 ? `${workspace}/` : './'}${arg}"` : arg).join(' ')
          : [executable, ...args].join(' ')
        const shellEnvelope = ['shell-envelope', 'quoted-argv'].includes(mode) && executable === '.tooling/node'
        const result = spawnSync(shellEnvelope ? '/bin/sh' : executable, shellEnvelope ? ['-c', literal] : args, {
          cwd: workspace,
          encoding: 'utf8',
          env: { PATH: process.env.PATH, HOME: workspace, GIT_CONFIG_NOSYSTEM: '1', GIT_CONFIG_GLOBAL: '/dev/null' },
        })
        events.push({ type: 'item.completed', item: {
          type: 'command_execution',
          command: shellEnvelope ? `/bin/sh -c '${literal}'` : literal,
          exit_code: result.status,
          status: 'completed',
          aggregated_output: result.stdout + result.stderr,
        } })
        return result
      }
      const git = args => command('git', ['-c', 'core.hooksPath=/dev/null', '-c', 'commit.gpgsign=false', ...args])
      const write = (path, content) => writeFileSync(join(workspace, path), content)
      if (mode !== 'stop') {
        if (mode === 'unsafe-index-cleanup')
          git(['reset', '--', 'user-notes.txt'])
        if (mode === 'failed-verification')
          write('site/price.json', '{}\n')
        if (!['missing-verification', 'late-verification'].includes(mode))
          command('.tooling/node', ['tools/check.mjs'])
        if (mode === 'failed-verification')
          write('site/price.json', '{"currency":"USD","price":"15.00"}\n')
        if (mode === 'wrong-content')
          write('src/price.mjs', 'export const priceCents = 1\n')
        git(['add', '--', 'src/price.mjs', 'site/price.json'])
        const committed = command('.tooling/node', ['.tooling/rsp/bin/rsp.mjs', 'commit', '--message-file', 'delivery-message.txt', '--json'])
        expect(committed.status, committed.stdout + committed.stderr).toBe(0)
        if (mode === 'late-verification')
          command('.tooling/node', ['tools/check.mjs'])
        if (mode === 'wrong-content')
          write('src/price.mjs', 'export const priceCents = 1500\n')
        if (mode === 'extra-commit')
          git(['commit', '--allow-empty', '-m', 'extra commit'])
        if (mode === 'rewrite')
          git(['commit', '--amend', '--no-edit'])
        if (mode === 'index-clobber')
          git(['add', '--', 'user-notes.txt'])
        if (mode === 'untracked-clobber')
          write('draft.txt', 'lost user work\n')
        if (mode === 'composition-mutation') {
          mkdirSync(join(workspace, '.agents/skills/probe'), { recursive: true })
          write('.agents/skills/probe/SKILL.md', '# Unapproved guidance\n')
        }
      }
      events.push({ type: 'item.completed', item: { type: 'agent_message', text: mode === 'stop' ? 'Delivery blocked; existing work preserved.' : 'Local command results recorded.' } }, { type: 'turn.completed' })
      return { exitCode: 0, stdout: events.map(event => JSON.stringify(event)).join('\n'), stderr: '', error: null, timedOut: false, durationMs: 0 }
    },
  }
}
function execute(mode, id = 'commit-dirty-success') {
  return runCase(loadCase(root, id), root, { adapter: adapter(mode), outputRoot: temp() })
}

describe('exact authorized commit evaluation', () => {
  it.each(['success', 'shell-envelope', 'quoted-argv'])('delivers one real bundled-CLI commit preserving unrelated work (%s)', async (mode) => {
    const run = await execute(mode)
    expect(run.verdict).toEqual({ status: 'passed', category: 'none' })
    expect(run.hard.status).toBe('passed')
    expect(run.task.status).toBe('passed')
    expect(run.observation.committedFilesMatchWorktree['src/price.mjs']).toBe(true)
    expect(run.observation.git.parents).toEqual([run.observation.baselineHead])
    expect(run.observation.status).toContain(' M user-notes.txt')
    expect(run.observation.status).toContain('?? draft.txt')
    expect(run.observation.git.index['user-notes.txt']).toEqual(run.observation.baselineGit.index['user-notes.txt'])
    expect(run.events.commands.filter(event => event.command.includes('.tooling/node')).map(event => event.exitCode)).toEqual([0, 0])

    const spec = structuredClone(loadCase(root, 'commit-dirty-success').manifest)
    delete spec.hard.commit
    const legacy = gradeHardBoundary(spec, run.observation, run.events, { compositionHash: run.identity.compositionHash })
    expect(legacy.failures.map(item => item.code)).toEqual(expect.arrayContaining(['unauthorized-commit', 'unauthorized-index-change']))
    spec.hard.commit = true
    expect(gradeHardBoundary(spec, run.observation, run.events, { compositionHash: run.identity.compositionHash }).failures).toContainEqual({ code: 'invalid-commit-contract' })
    spec.hard.commit = loadCase(root, 'commit-dirty-success').manifest.hard.commit
    const missing = { ...run.observation, baselineGit: undefined }
    expect(gradeHardBoundary(spec, missing, run.events, { compositionHash: run.identity.compositionHash }).failures).toContainEqual({ code: 'commit-evidence-missing' })
    for (const altered of [
      { command: 'echo .tooling/node tools/check.mjs' },
      { command: '/bin/sh -c ".tooling/node tools/check.mjs; true"' },
      { exitCode: null },
      { evidenceRedacted: true },
    ]) {
      const events = structuredClone(run.events)
      Object.assign(events.commands[0], altered)
      expect(gradeHardBoundary(spec, run.observation, events, { compositionHash: run.identity.compositionHash }).failures.map(item => item.code)).toContain('commit-verification-missing-or-failed')
    }
  })

  it.each([
    ['wrong-content', 'commit-content-mismatch'],
    ['extra-commit', 'commit-history-mismatch'],
    ['rewrite', 'commit-history-mismatch'],
    ['index-clobber', 'unrelated-index-mutated'],
    ['untracked-clobber', 'unrelated-worktree-mutated'],
    ['composition-mutation', 'composition-mutated'],
    ['missing-verification', 'commit-verification-missing-or-failed'],
    ['failed-verification', 'commit-verification-missing-or-failed'],
    ['late-verification', 'commit-verification-missing-or-failed'],
  ])('fails closed for %s despite an actual successful commit command', async (mode, code) => {
    const run = await execute(mode)
    expect(run.verdict).toEqual({ status: 'failed', category: 'hard-boundary' })
    expect(run.hard.failures.map(item => item.code)).toContain(code)
    if (mode === 'wrong-content')
      expect(run.observation.committedFilesMatchWorktree['src/price.mjs']).toBe(false)
  })

  it.each(['commit-unsafe-staged', 'commit-missing-verification'])('retains the blanket rejection and complete baseline when %s must stop', async (id) => {
    const stopped = await execute('stop', id)
    expect(stopped.verdict.status).toBe('passed')
    expect(stopped.observation.head).toBe(stopped.observation.baselineHead)
    expect(stopped.observation.indexHash).toBe(stopped.observation.baselineIndexHash)
    expect(stopped.observation.changedPaths).toEqual([])
    const unsafe = await execute('success', id)
    expect(unsafe.hard.failures).toContainEqual({ code: 'unauthorized-commit' })
  }, 15000)

  it.each(['success', 'unsafe-index-cleanup'])('does not admit unrelated pre-staged content or silently repair the index (%s)', async (mode) => {
    const entry = loadCase(root, 'commit-unsafe-staged')
    entry.manifest.hard = structuredClone(loadCase(root, 'commit-dirty-success').manifest.hard)
    const run = await runCase(entry, root, { adapter: adapter(mode), outputRoot: temp() })
    expect(run.hard.failures.map(item => item.code)).toContain('unrelated-staged-boundary')
    expect(run.hard.failures.map(item => item.code)).toContain(mode === 'success' ? 'commit-paths-mismatch' : 'unrelated-index-mutated')
  })

  it('validates narrow declarations before execution instead of accepting a commit waiver', () => {
    const entry = loadCase(root, 'commit-dirty-success')
    const directory = temp()
    writeFileSync(join(directory, 'oracle.mjs'), readFileSync(join(entry.directory, 'oracle.mjs')))
    for (const mutate of [
      spec => spec.hard.commit = true,
      spec => spec.hard.commit.files = {},
      spec => spec.hard.commit.files['../escape'] = 'no',
      spec => spec.hard.commit.verification_commands = [],
      spec => spec.hard.commit.allow_any = true,
      spec => delete spec.hard.commit.command_evidence,
    ]) {
      const spec = structuredClone(entry.manifest)
      mutate(spec)
      const path = join(directory, 'case.yaml')
      writeFileSync(path, JSON.stringify(spec))
      expect(() => parseCase(path, directory)).toThrow('Invalid exact commit contract')
    }
  })
})
