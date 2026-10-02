import { spawnSync } from 'node:child_process'
import { lstatSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, relative } from 'node:path'
import { expect, it } from 'vitest'
import { loadCase } from '../../skills/runner/core/cases.mjs'
import { prepareWorkspace, runCase } from '../../skills/runner/core/execute.mjs'
import { hash } from '../../skills/runner/core/files.mjs'
import { git } from '../../skills/runner/observers/workspace.mjs'

it.each(['allowed', 'history', 'other'])('checks archive permission against real CLI output: %s', async (mode) => {
  const directory = mkdtempSync(join(tmpdir(), 'rsp-archive-boundary-'))
  try {
    const run = await runCase(loadCase(process.cwd(), 'archive-final-convergence'), process.cwd(), {
      outputRoot: directory,
      adapter: {
        id: 'local-test',
        settings: { provider: 'local-test', model: 'none', effort: 'none' },
        async run({ workspace }) {
          const path = join(workspace, '.rsp/changes/price-update.md')
          writeFileSync(path, readFileSync(path, 'utf8')
            .replace('- [ ] Complete required', '- [x] Complete required')
            .replace('- [ ] .tooling/node', '- [x] .tooling/node'))
          const result = spawnSync(process.execPath, ['.tooling/rsp/bin/rsp.mjs', 'archive', 'price-update'], { cwd: workspace, encoding: 'utf8' })
          if (mode !== 'allowed')
            writeFileSync(join(workspace, '.rsp/archives', mode === 'history' ? '2020-01-01_price-update.md' : '2099-01-01_other.md'), 'unauthorized archive edit')
          return { exitCode: result.status, stdout: JSON.stringify({ type: 'turn.completed' }), stderr: result.stderr + result.stdout, finalOutput: 'Local mechanical control only; final text requires independent judging.' }
        },
      },
    })
    expect(run.result.exitCode, run.result.stderr).toBe(0)
    expect(run.hard.status).toBe(mode === 'allowed' ? 'passed' : 'failed')
    if (mode === 'allowed') {
      expect(run.task.status).toBe('passed')
      expect(run.observation.indexHash).toBe(run.observation.baselineIndexHash)
    }
    else {
      expect(run.hard.failures).toContainEqual({ code: 'unauthorized-path', path: mode === 'history' ? '.rsp/archives/2020-01-01_price-update.md' : '.rsp/archives/2099-01-01_other.md' })
    }
  }
  finally {
    rmSync(directory, { recursive: true, force: true })
  }
})

it('keeps injected tooling out of Git while detecting ignored dependency and new-file mutations', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'rsp-ignored-tooling-'))
  let tracked
  let status
  let dependencyPath
  try {
    const run = await runCase(loadCase(process.cwd(), 'method-required-check-unavailable'), process.cwd(), {
      outputRoot: directory,
      adapter: {
        id: 'local-test',
        settings: { provider: 'local-test', model: 'none', effort: 'none' },
        async run({ workspace }) {
          tracked = git(workspace, ['ls-files', '--', '.tooling/'])
          const dependency = join(workspace, '.tooling/rsp/node_modules/picocolors/package.json')
          dependencyPath = relative(realpathSync(workspace), realpathSync(dependency))
          writeFileSync(dependency, `${readFileSync(dependency, 'utf8')}\n`)
          writeFileSync(join(workspace, '.tooling/unexpected.txt'), 'unauthorized')
          status = git(workspace, ['status', '--short', '--', '.tooling/'])
          return { exitCode: 0, stdout: JSON.stringify({ type: 'turn.completed' }), stderr: '', finalOutput: 'Local boundary control.' }
        },
      },
    })
    expect(tracked?.length).toBe(0)
    expect(status).toBe('')
    expect(run.hard.failures).toEqual(expect.arrayContaining([
      { code: 'unauthorized-path', path: dependencyPath },
      { code: 'unauthorized-path', path: '.tooling/unexpected.txt' },
    ]))
    expect(run.observation.indexHash).toBe(run.observation.baselineIndexHash)
    expect(run.hard.status).toBe('failed')
  }
  finally {
    rmSync(directory, { recursive: true, force: true })
  }
})

it('isolates real project dependencies and restores dirty recovery state in fresh workspaces', async () => {
  const root = process.cwd()
  const entry = loadCase(root, 'real-multimodule-recovery')
  const directory = mkdtempSync(join(tmpdir(), 'rsp-project-check-'))
  const original = readFileSync('node_modules/picocolors/package.json')
  let workspace
  try {
    workspace = prepareWorkspace({ ...entry, manifest: { ...entry.manifest, working_tree: { ...entry.manifest.working_tree, 'dist/user-marker.txt': 'explicit staged fixture' }, staged_paths: [...entry.manifest.staged_paths, 'dist/user-marker.txt'] } }, root)
    expect(git(workspace, ['ls-tree', '-r', '--name-only', 'HEAD', '--', 'node_modules/', 'dist/']).length).toBe(0)
    expect(readFileSync(join(workspace, '.gitignore'), 'utf8')).toBe(git(root, ['show', `${entry.project.commit}:.gitignore`]))
    expect(git(workspace, ['diff', '--cached', '--name-only'])).toContain('dist/user-marker.txt')
    expect(git(workspace, ['check-ignore', 'node_modules/picocolors', 'dist/cli.mjs']).trim().split('\n')).toEqual(['node_modules/picocolors', 'dist/cli.mjs'])
    const physical = realpathSync(workspace)
    const visit = (path) => {
      for (const name of readdirSync(path)) {
        const child = join(path, name)
        const stat = lstatSync(child)
        if (stat.isSymbolicLink())
          expect(realpathSync(child).startsWith(`${physical}/`)).toBe(true)
        else if (stat.isDirectory())
          visit(child)
      }
    }
    visit(join(workspace, 'node_modules'))
    writeFileSync(join(workspace, 'node_modules/picocolors/package.json'), 'isolated edit')
    expect(readFileSync('node_modules/picocolors/package.json')).toEqual(original)
    const adapter = repairAll => ({
      id: 'local-test',
      settings: { provider: 'local-test', model: 'none', effort: 'none' },
      async run({ workspace }) {
        for (const patch of entry.manifest.patches.slice(0, repairAll ? 2 : 1)) {
          const path = join(workspace, patch.path)
          writeFileSync(path, readFileSync(path, 'utf8').replace(patch.after, patch.before))
        }
        return { exitCode: 0, stdout: JSON.stringify({ type: 'turn.completed' }), stderr: '', finalOutput: 'Local oracle control; no model execution.' }
      },
    })
    const partial = await runCase(entry, root, { adapter: adapter(false), outputRoot: directory })
    expect(partial.verdict.status, JSON.stringify({ verdict: partial.verdict, task: partial.task, hard: partial.hard })).toBe('failed')
    const complete = await runCase(entry, root, { adapter: adapter(true), outputRoot: directory })
    expect(complete.verdict.status).toBe('passed')
    expect(complete.identity.dependencies.lockHash).toBe(hash(readFileSync('pnpm-lock.yaml')))
    expect(complete.observation.indexHash).toBe(complete.observation.baselineIndexHash)
    expect(complete.observation.changedPaths).toEqual(['src/core/issue-relationship.ts', 'src/core/path-identity.ts'])
    expect(complete.context.workspace).not.toBe(partial.context.workspace)
  }
  finally {
    if (workspace)
      rmSync(workspace, { recursive: true, force: true, maxRetries: 3 })
    rmSync(directory, { recursive: true, force: true })
  }
}, 60000)
