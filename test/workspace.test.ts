import { execFileSync, spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { presentShowWorkspace } from '../src/cli/presenters/workspace.js'
import { showStatus } from '../src/commands/status.js'
import { prepareWorkspaceCommand, showWorkspaceCommand } from '../src/commands/workspace.js'
import { printStatusPlain } from '../src/status/plain.js'
import { toStatusJson } from '../src/status/v3-json.js'
import { inspectWorkspaceFacts } from '../src/workspace/facts.js'
import { landWorkspace } from '../src/workspace/land.js'
import { disposeWorkspace, observeWorkspace, prepareWorkspace, pruneWorkspace, registerWorkspaceActivity, stopWorkspaceActivity } from '../src/workspace/session.js'

let repository: string
let previousCwd: string

async function freePort(): Promise<number> {
  return new Promise((resolve, reject) => {
    const server = createServer()
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      const address = server.address()
      if (!address || typeof address === 'string') {
        server.close()
        reject(new Error('failed to allocate test port'))
        return
      }
      server.close(error => error ? reject(error) : resolve(address.port))
    })
  })
}

async function waitForPort(port: number): Promise<void> {
  const deadline = Date.now() + 5000
  while (Date.now() < deadline) {
    const listening = await new Promise<boolean>((resolve) => {
      const socket = createServer()
      socket.once('error', () => resolve(true))
      socket.listen(port, '127.0.0.1', () => {
        socket.close(() => resolve(false))
      })
    })
    if (listening)
      return
    await new Promise(resolve => setTimeout(resolve, 50))
  }
  throw new Error(`port did not become active: ${port}`)
}

function git(args: string[], cwd = repository): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim()
}

async function writeChange(name = 'example-change') {
  const path = join(repository, '.rsp', 'changes', `${name}.md`)
  await mkdir(join(repository, '.rsp', 'changes'), { recursive: true })
  await mkdir(join(repository, '.rsp', 'focus.d'), { recursive: true })
  await writeFile(path, `---
kind: feature
---

# Change: ${name}

## Proposal
- Outcome: isolated work

## Spec
### ADDED
- Requirement: isolate it

### Acceptance
#### Scenario: isolated
- GIVEN a repository
- WHEN work starts
- THEN it is isolated

## Design
- Approach: use a worktree

## Tasks
- [ ] implement

## Verify
- Automated: tests

## Blockers
- none
`)
  await writeFile(join(repository, '.rsp', 'focus.d', name), '')
}

beforeEach(async () => {
  previousCwd = process.cwd()
  repository = join(tmpdir(), 'rsp-workspace-test', randomUUID())
  await mkdir(repository, { recursive: true })
  git(['init', '-b', 'main'])
  git(['config', 'user.name', 'RSP Test'])
  git(['config', 'user.email', 'rsp-test@example.invalid'])
  await writeChange()
  await writeFile(join(repository, 'owned.txt'), 'base\n')
  await writeFile(join(repository, '.gitignore'), 'node_modules/\n.local-input\n')
  await writeFile(join(repository, 'package.json'), JSON.stringify({
    name: 'workspace-fixture',
    private: true,
    scripts: {
      lint: 'node -e "process.exit(0)"',
      test: 'node -e "process.exit(0)"',
      build: 'node -e "process.exit(0)"',
      dev: 'node server.mjs',
    },
  }, null, 2))
  await writeFile(join(repository, 'server.mjs'), `import { createServer } from 'node:http'
const args = process.argv.slice(2)
const port = Number(args.at(-1) || process.env.PORT)
createServer((_request, response) => response.end('ok')).listen(port, '127.0.0.1')
`)
  git(['add', '.'])
  git(['commit', '-m', 'test: initialize workspace fixture'])
  process.chdir(repository)
})

afterEach(async () => {
  process.chdir(previousCwd)
  await rm(repository, { recursive: true, force: true })
})

describe.sequential('rsp workspace lifecycle', () => {
  it('blocks workspace preparation when project policy is disabled', async () => {
    await writeFile(join(repository, '.rsp', 'config.yaml'), 'workspace:\n  activation: disabled\n')

    await expect(prepareWorkspaceCommand('example-change')).resolves.toEqual({
      command: 'workspace prepare',
      ok: false,
      error: {
        code: 'workspace_activation_disabled',
        message: 'workspace activation is disabled by project configuration',
      },
    })
    expect(git(['branch', '--list', 'rsp/example-change'])).toBe('')
    expect(existsSync(join(repository, '.git', 'rsp', 'workspaces'))).toBe(false)
  })

  it('prepares and resumes one stable rsp/<workref> workspace', async () => {
    const first = await prepareWorkspace('example-change')
    const second = await prepareWorkspace('example-change')

    expect(first.resumed).toBe(false)
    expect(second.resumed).toBe(true)
    expect(second.record.branch).toBe('rsp/example-change')
    expect(second.record.path).toBe(first.record.path)
    expect((await observeWorkspace('example-change')).registered).toBe(true)

    await disposeWorkspace('example-change')
    expect(existsSync(first.record.path)).toBe(false)
  })

  it('blocks late prepare on source product changes unless they were explicitly reviewed', async () => {
    await writeFile(join(repository, 'owned.txt'), 'already changed\n')

    await expect(prepareWorkspaceCommand('example-change')).resolves.toMatchObject({
      command: 'workspace prepare',
      ok: false,
      error: { code: 'workspace_source_dirty', message: expect.stringContaining('owned.txt') },
    })
    expect(git(['branch', '--list', 'rsp/example-change'])).toBe('')

    const acknowledged = await prepareWorkspaceCommand('example-change', { allowDirtySource: true })
    expect(acknowledged).toMatchObject({ command: 'workspace prepare', ok: true, resumed: false })
    if (acknowledged.ok)
      await disposeWorkspace('example-change')
  })

  it('returns bounded facts without interpreting the project stack', async () => {
    const prepared = await prepareWorkspace('example-change')
    await writeFile(join(prepared.record.path, 'changed.txt'), 'changed\n')
    const facts = await inspectWorkspaceFacts('example-change')

    expect(facts.workspace.workRef).toBe('example-change')
    expect(facts.repository.trackedPaths).toContain('package.json')
    expect(facts.repository.changedPaths).toContain('changed.txt')
    expect(JSON.stringify(facts)).not.toMatch(/node|maven|gradle|mise|compose|nacos/i)

    await disposeWorkspace('example-change', { discard: true })
  })

  it('lands exact commits while preserving disjoint target modifications and cleans up', async () => {
    const prepared = await prepareWorkspace('example-change')
    await writeFile(join(prepared.record.path, 'owned.txt'), 'workspace\n')
    git(['add', 'owned.txt'], prepared.record.path)
    git(['commit', '-m', 'feat: change owned file'], prepared.record.path)
    const commit = git(['rev-parse', 'HEAD'], prepared.record.path)
    await writeFile(join(repository, 'unrelated.txt'), 'keep me\n')

    const result = await landWorkspace('example-change', {
      targetBranch: 'main',
      commits: [commit],
      cleanup: true,
    })

    expect(result.ok).toBe(true)
    expect(result.cleanedUp).toBe(true)
    expect(await readFile(join(repository, 'owned.txt'), 'utf8')).toBe('workspace\n')
    expect(await readFile(join(repository, 'unrelated.txt'), 'utf8')).toBe('keep me\n')
    expect(git(['status', '--short'])).toContain('?? unrelated.txt')
    expect(existsSync(prepared.record.path)).toBe(false)
  })

  it('recovers bounded active workspace facts through ordinary status until Land cleanup', async ({ onTestFinished }) => {
    const prepared = await prepareWorkspace('example-change')
    await writeFile(join(prepared.record.path, 'owned.txt'), 'workspace\n')
    git(['add', 'owned.txt'], prepared.record.path)
    git(['commit', '-m', 'feat: change owned file'], prepared.record.path)
    const commit = git(['rev-parse', 'HEAD'], prepared.record.path)
    await writeFile(join(prepared.record.path, 'pending.txt'), 'dirty\n')

    const port = await freePort()
    const child = spawn(process.execPath, ['server.mjs', '--port', String(port)], {
      cwd: prepared.record.path,
      detached: true,
      stdio: 'ignore',
    })
    child.unref()
    onTestFinished(async () => {
      await stopWorkspaceActivity('example-change', 'serve').catch(() => undefined)
      if (child.pid) {
        try {
          process.kill(-child.pid, 'SIGTERM')
        }
        catch (error) {
          if ((error as NodeJS.ErrnoException).code !== 'ESRCH')
            throw error
        }
      }
      await disposeWorkspace('example-change', { discard: true }).catch(() => undefined)
    })
    await waitForPort(port)
    await registerWorkspaceActivity('example-change', {
      id: 'serve',
      pid: child.pid!,
      processGroupId: child.pid,
      resources: [`tcp:127.0.0.1:${port}`],
    })

    const activeView = await showStatus()
    expect(toStatusJson(activeView).activeWorkspaces).toEqual([{
      workRef: 'example-change',
      branch: 'rsp/example-change',
      targetBranch: 'main',
      dirty: true,
      commitsAhead: 1,
      activeActivityCount: 1,
      deliveryState: 'unlanded',
      cleanupReady: false,
    }])

    const verbose: string[] = []
    const defaultPlain: string[] = []
    const log = console.log
    try {
      console.log = (value = '') => verbose.push(String(value))
      printStatusPlain(activeView, { verbose: true })
      console.log = (value = '') => defaultPlain.push(String(value))
      printStatusPlain(activeView)
    }
    finally {
      console.log = log
    }
    expect(verbose.join('\n')).toContain('Active Workspaces')
    expect(verbose.join('\n')).toContain('example-change · rsp/example-change → main · dirty · 1 commit(s) ahead · 1 active activity')
    expect(defaultPlain.join('\n')).toContain('Active Workspaces')
    expect(defaultPlain.join('\n')).toContain('example-change · unlanded · dirty · inspect required')
    expect(defaultPlain.join('\n')).toContain('Next action: Run: rsp workspace inspect example-change --json')
    expect(defaultPlain.join('\n')).not.toContain(prepared.record.path)

    await stopWorkspaceActivity('example-change', 'serve')
    await rm(join(prepared.record.path, 'pending.txt'))
    const landed = await landWorkspace('example-change', { targetBranch: 'main', commits: [commit], cleanup: true })
    expect(landed.cleanedUp).toBe(true)
    expect(toStatusJson(await showStatus()).activeWorkspaces).toEqual([])
  })

  it('recognizes patch-equivalent landing and allows ordinary cleanup', async () => {
    const prepared = await prepareWorkspace('example-change')
    await writeFile(join(prepared.record.path, 'owned.txt'), 'workspace\n')
    git(['add', 'owned.txt'], prepared.record.path)
    git(['commit', '-m', 'feat: change owned file'], prepared.record.path)
    const commit = git(['rev-parse', 'HEAD'], prepared.record.path)
    await writeFile(join(repository, 'target-only.txt'), 'target\n')
    git(['add', 'target-only.txt'])
    git(['commit', '-m', 'chore: advance target independently'])

    const landed = await landWorkspace('example-change', {
      targetBranch: 'main',
      commits: [commit],
    })
    expect(landed.ok).toBe(true)
    expect(landed.cleanedUp).toBe(false)

    const observation = await observeWorkspace('example-change')
    expect(observation.aheadOfTarget).toBe(1)
    expect(observation.deliveryState).toBe('landed-equivalent')
    expect(observation.cleanupReady).toBe(true)

    const status = toStatusJson(await showStatus())
    expect(status.activeWorkspaces).toEqual([expect.objectContaining({
      workRef: 'example-change',
      deliveryState: 'landed-equivalent',
      cleanupReady: true,
    })])
    expect(status.nextActions[0]).toBe('Run: rsp workspace dispose example-change')

    const directPlain: string[] = []
    const log = console.log
    try {
      console.log = (value = '') => directPlain.push(String(value))
      presentShowWorkspace(await showWorkspaceCommand('example-change'), false)
    }
    finally {
      console.log = log
    }
    expect(directPlain.join('\n')).toContain('delivery: landed-equivalent')
    expect(directPlain.join('\n')).toContain('cleanup ready: yes')
    expect(directPlain.join('\n')).toContain('next action: rsp workspace dispose example-change')

    await disposeWorkspace('example-change')
    expect(existsSync(prepared.record.path)).toBe(false)
  })

  it('separates landed commit delivery from a dirty worktree', async () => {
    const prepared = await prepareWorkspace('example-change')
    await writeFile(join(prepared.record.path, 'pending.txt'), 'dirty\n')

    const observation = await observeWorkspace('example-change')
    expect(observation.deliveryState).toBe('landed')
    expect(observation.cleanupReady).toBe(false)
    const status = toStatusJson(await showStatus())
    expect(status.activeWorkspaces[0]).toMatchObject({ deliveryState: 'landed', dirty: true, cleanupReady: false })

    await disposeWorkspace('example-change', { discard: true })
  })

  it('fails ordinary status visibly and safely for an invalid workspace record', async () => {
    const recordsDir = join(repository, '.git', 'rsp', 'workspaces')
    await mkdir(recordsDir, { recursive: true })
    await writeFile(join(recordsDir, 'broken.json'), '{not-json\n')

    const view = await showStatus()
    const json = toStatusJson(view)
    expect(json.ok).toBe(false)
    expect(json.activeWorkspaces).toEqual([])
    expect(json.diagnostics).toContainEqual(expect.objectContaining({
      severity: 'error',
      code: 'workspace_record_invalid',
      message: 'unable to inspect workspace record broken.json',
    }))

    const lines: string[] = []
    const log = console.log
    try {
      console.log = (value = '') => lines.push(String(value))
      printStatusPlain(view)
    }
    finally {
      console.log = log
    }
    expect(lines.join('\n')).toContain('unable to inspect workspace record broken.json')
    expect(lines.join('\n')).not.toContain(repository)
  })

  it('reports a symlinked json workspace record without following it', async () => {
    const recordsDir = join(repository, '.git', 'rsp', 'workspaces')
    const externalRecord = join(repository, 'external-workspace-record.json')
    await mkdir(recordsDir, { recursive: true })
    await writeFile(externalRecord, '{"secret":"must not be read"}\n')
    await symlink(externalRecord, join(recordsDir, 'external.json'))
    await symlink(externalRecord, join(recordsDir, 'ignored.lock'))

    const json = toStatusJson(await showStatus())
    expect(json.ok).toBe(false)
    expect(json.activeWorkspaces).toEqual([])
    expect(json.diagnostics).toContainEqual(expect.objectContaining({
      severity: 'error',
      code: 'workspace_record_invalid',
      message: 'unable to inspect workspace record external.json',
      hint: 'workspace registry entry is not a regular file',
    }))
    expect(json.runtime).toContainEqual(expect.objectContaining({
      path: '.git/rsp/workspaces/external.json',
      message: 'workspace registry entry is not a regular file',
    }))
    expect(JSON.stringify(json)).not.toContain('must not be read')
    expect(JSON.stringify(json)).not.toContain('ignored.lock')
  })

  it('reports first and applies only mechanically orphaned workspace pruning', async () => {
    const prepared = await prepareWorkspace('example-change')
    git(['worktree', 'remove', '--force', prepared.record.path])
    git(['branch', '-D', prepared.record.branch])

    const report = await pruneWorkspace('example-change')
    expect(report).toMatchObject({ disposition: 'prune-ready', applied: false })
    expect(existsSync(prepared.record.path)).toBe(false)

    const applied = await pruneWorkspace('example-change', { apply: true })
    expect(applied).toMatchObject({ disposition: 'prune-ready', applied: true })
    await expect(observeWorkspace('example-change')).rejects.toThrow('workspace not found')
  })

  it('quarantines rather than deletes an unparsable orphan record', async () => {
    const prepared = await prepareWorkspace('example-change')
    const recordsDir = join(repository, '.git', 'rsp', 'workspaces')
    const recordName = (await readdir(recordsDir)).find(name => name.endsWith('.json'))!
    git(['worktree', 'remove', '--force', prepared.record.path])
    git(['branch', '-D', prepared.record.branch])
    await writeFile(join(recordsDir, recordName), '{broken\n')

    expect(await pruneWorkspace('example-change')).toMatchObject({ disposition: 'quarantine-ready', applied: false })
    const applied = await pruneWorkspace('example-change', { apply: true })
    expect(applied).toMatchObject({ disposition: 'quarantine-ready', applied: true, recordValid: false })
    expect(existsSync(applied.quarantinePath!)).toBe(true)
    expect(await readdir(recordsDir)).not.toContain(recordName)
  })

  it('refuses to prune a present healthy workspace', async () => {
    const prepared = await prepareWorkspace('example-change')
    expect(await pruneWorkspace('example-change')).toMatchObject({ disposition: 'healthy', applied: false })
    await expect(pruneWorkspace('example-change', { apply: true })).rejects.toThrow('workspace prune is not applicable')
    await disposeWorkspace('example-change')
    expect(existsSync(prepared.record.path)).toBe(false)
  })

  it('reports cleanup failure separately after a successful landing', async () => {
    const prepared = await prepareWorkspace('example-change')
    await writeFile(join(prepared.record.path, 'owned.txt'), 'workspace\n')
    git(['add', 'owned.txt'], prepared.record.path)
    git(['commit', '-m', 'feat: change owned file'], prepared.record.path)
    const commit = git(['rev-parse', 'HEAD'], prepared.record.path)
    await writeFile(join(prepared.record.path, 'cleanup-residue.txt'), 'preserve me\n')

    const result = await landWorkspace('example-change', {
      targetBranch: 'main',
      commits: [commit],
      cleanup: true,
    })

    expect(result.ok).toBe(true)
    expect(result.cleanedUp).toBe(false)
    expect(result.cleanupError).toContain('workspace has uncommitted changes')
    expect(await readFile(join(repository, 'owned.txt'), 'utf8')).toBe('workspace\n')
    expect((await observeWorkspace('example-change')).registered).toBe(true)
    expect(existsSync(prepared.record.path)).toBe(true)

    await disposeWorkspace('example-change', { discard: true })
  })

  it('preserves both worktrees when cherry-pick conflicts', async () => {
    const prepared = await prepareWorkspace('example-change')
    await writeFile(join(prepared.record.path, 'owned.txt'), 'workspace\n')
    git(['add', 'owned.txt'], prepared.record.path)
    git(['commit', '-m', 'feat: workspace edit'], prepared.record.path)
    const commit = git(['rev-parse', 'HEAD'], prepared.record.path)

    await writeFile(join(repository, 'owned.txt'), 'target\n')
    git(['add', 'owned.txt'])
    git(['commit', '-m', 'feat: target edit'])

    const result = await landWorkspace('example-change', {
      targetBranch: 'main',
      commits: [commit],
    })

    expect(result.ok).toBe(false)
    expect(result.conflict).toBe(true)
    expect((await observeWorkspace('example-change')).registered).toBe(true)
    expect(existsSync(join(repository, '.git', 'CHERRY_PICK_HEAD'))).toBe(true)

    git(['cherry-pick', '--abort'])
    await disposeWorkspace('example-change', { discard: true })
  })

  it('rejects commits outside the workspace-owned range', async () => {
    await prepareWorkspace('example-change')
    const baseCommit = git(['rev-parse', 'main'])

    await expect(landWorkspace('example-change', {
      targetBranch: 'main',
      commits: [baseCommit],
    })).rejects.toThrow('not owned by the workspace after its recorded base')

    await disposeWorkspace('example-change')
  })

  it('records a host-started activity and stops it during disposal', async () => {
    const prepared = await prepareWorkspace('example-change')
    const port = await freePort()
    const child = spawn(process.execPath, ['server.mjs', '--port', String(port)], {
      cwd: prepared.record.path,
      detached: true,
      stdio: 'ignore',
    })
    child.unref()
    expect(child.pid).toBeTruthy()
    await waitForPort(port)
    const activity = await registerWorkspaceActivity('example-change', {
      id: 'serve',
      label: 'local preview',
      pid: child.pid!,
      processGroupId: child.pid,
      resources: [`tcp:127.0.0.1:${port}`],
    })

    const response = await fetch(`http://127.0.0.1:${port}`)
    expect(await response.text()).toBe('ok')

    await disposeWorkspace('example-change')
    expect(() => process.kill(activity.pid, 0)).toThrow()
    expect(existsSync(prepared.record.path)).toBe(false)
  })
})
