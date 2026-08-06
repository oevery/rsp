import { execFileSync, spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, realpath, rm, writeFile } from 'node:fs/promises'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { processIdentityFor } from '../src/workspace/process.js'
import { acquireResourceLeases, releaseResourceLeases } from '../src/workspace/resources.js'
import { disposeWorkspace, observeWorkspace, prepareWorkspace, registerWorkspaceActivity, stopWorkspaceActivity } from '../src/workspace/session.js'

let fixtureRoot: string
let repository: string
let previousCwd: string
let previousCacheHome: string | undefined

function git(args: string[], cwd = repository): string {
  return execFileSync('git', args, { cwd, encoding: 'utf8' }).trim()
}

async function writeChange(name: string): Promise<void> {
  await writeFile(join(repository, '.rsp', 'changes', `${name}.md`), `---
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

async function workspaceRecordPath(): Promise<string> {
  const directory = join(repository, '.git', 'rsp', 'workspaces')
  const files = (await readdir(directory)).filter(name => name.endsWith('.json'))
  expect(files).toHaveLength(1)
  return join(directory, files[0]!)
}

async function canBind(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer()
    server.once('error', () => resolve(false))
    server.listen(port, '127.0.0.1', () => {
      server.close(error => resolve(!error))
    })
  })
}

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

async function startServer(workspace: string, port: number) {
  const child = spawn(process.execPath, ['server.mjs', '--port', String(port)], {
    cwd: workspace,
    detached: true,
    stdio: 'ignore',
  })
  child.unref()
  if (!child.pid)
    throw new Error('failed to start fixture server')
  const deadline = Date.now() + 5000
  while (Date.now() < deadline) {
    if (!(await canBind(port)))
      return child
    await new Promise(resolve => setTimeout(resolve, 50))
  }
  process.kill(-child.pid, 'SIGKILL')
  throw new Error(`fixture server did not bind port ${port}`)
}

beforeEach(async () => {
  previousCwd = process.cwd()
  previousCacheHome = process.env.XDG_CACHE_HOME
  fixtureRoot = join(tmpdir(), 'rsp-workspace-safety-test', randomUUID())
  repository = join(fixtureRoot, 'repository')
  process.env.XDG_CACHE_HOME = join(fixtureRoot, 'cache')
  await mkdir(join(repository, '.rsp', 'changes'), { recursive: true })
  await mkdir(join(repository, '.rsp', 'focus.d'), { recursive: true })
  git(['init', '-b', 'main'])
  git(['config', 'user.name', 'RSP Test'])
  git(['config', 'user.email', 'rsp-test@example.invalid'])
  await writeChange('example-change')
  await writeChange('second-change')
  await writeFile(join(repository, 'package.json'), JSON.stringify({
    name: 'workspace-safety-fixture',
    private: true,
    scripts: {
      dev: 'node server.mjs',
    },
  }, null, 2))
  await writeFile(join(repository, '.gitignore'), 'node_modules/\n')
  await writeFile(join(repository, 'server.mjs'), `import { createServer } from 'node:http'
const port = Number(process.argv.at(-1) || process.env.PORT)
createServer((_request, response) => response.end('ok')).listen(port, '127.0.0.1')
`)
  git(['add', '.'])
  git(['commit', '-m', 'test: initialize workspace safety fixture'])
  process.chdir(repository)
})

afterEach(async () => {
  process.chdir(previousCwd)
  if (previousCacheHome === undefined)
    delete process.env.XDG_CACHE_HOME
  else
    process.env.XDG_CACHE_HOME = previousCacheHome
  await rm(fixtureRoot, { recursive: true, force: true })
})

describe.sequential('workspace session safety', () => {
  it('uses the primary repository while preserving the invoking associated worktree as source', async () => {
    const first = await prepareWorkspace('example-change')
    process.chdir(first.record.path)

    const second = await prepareWorkspace('second-change')

    expect(second.record.repository).toBe(await realpath(repository))
    expect(second.record.sourceWorktree).toBe(await realpath(first.record.path))
    expect(second.record.targetBranch).toBe('rsp/example-change')

    process.chdir(second.record.path)
    expect((await observeWorkspace('second-change')).registered).toBe(true)
    expect((await observeWorkspace('example-change')).registered).toBe(true)

    await disposeWorkspace('second-change', { discard: true })
    process.chdir(repository)
    await disposeWorkspace('example-change', { discard: true })
  })

  it('refuses a tampered record instead of removing an unrelated registered worktree', async () => {
    const prepared = await prepareWorkspace('example-change')
    const unrelated = join(fixtureRoot, 'unrelated-worktree')
    git(['worktree', 'add', '-b', 'user-branch', unrelated, 'main'])
    const path = await workspaceRecordPath()
    const record = JSON.parse(await readFile(path, 'utf8')) as Record<string, unknown>
    await writeFile(path, `${JSON.stringify({
      ...record,
      path: unrelated,
      branch: 'user-branch',
    }, null, 2)}\n`)

    await expect(disposeWorkspace('example-change', { discard: true }))
      .rejects
      .toThrow(/branch mismatch|owned cache path/)
    expect(existsSync(unrelated)).toBe(true)
    expect(git(['branch', '--list', 'user-branch'])).toContain('user-branch')
    expect(existsSync(prepared.record.path)).toBe(true)

    await writeFile(path, `${JSON.stringify(record, null, 2)}\n`)
    await disposeWorkspace('example-change', { discard: true })
    git(['worktree', 'remove', '--force', unrelated])
    git(['branch', '-D', 'user-branch'])
  })

  it('recovers a stale lifecycle lock and removes only the recovered lock', async () => {
    const lockPath = join(repository, '.git', 'rsp', 'workspace.lock')
    await mkdir(join(repository, '.git', 'rsp'), { recursive: true })
    await writeFile(lockPath, `2147483647\nstale operation\n2020-01-01T00:00:00.000Z\nstale-token\n`)

    const prepared = await prepareWorkspace('example-change')

    expect(existsSync(lockPath)).toBe(false)
    await disposeWorkspace('example-change', { discard: true })
    expect(existsSync(prepared.record.path)).toBe(false)
  })

  it('rolls back only the worktree and branch created by a failed prepare', async () => {
    await rm(join(repository, '.rsp', 'focus.d', 'example-change'))
    await mkdir(join(repository, '.rsp', 'focus.d', 'example-change'))

    await expect(prepareWorkspace('example-change')).rejects.toThrow()

    expect(git(['branch', '--list', 'rsp/example-change'])).toBe('')
    expect(git(['worktree', 'list', '--porcelain'])).not.toContain('rsp/example-change')
    expect(existsSync(join(repository, '.git', 'rsp', 'workspaces'))).toBe(false)
  })

  it('stops a registered host activity process group and releases its port on disposal', async () => {
    const prepared = await prepareWorkspace('example-change')
    const port = await freePort()
    const child = await startServer(prepared.record.path, port)
    const activity = await registerWorkspaceActivity('example-change', {
      id: 'serve',
      pid: child.pid!,
      processGroupId: child.pid,
      resources: [`tcp:127.0.0.1:${port}`],
    })
    expect(await canBind(port)).toBe(false)

    await disposeWorkspace('example-change')

    expect(await canBind(port)).toBe(true)
    expect(() => process.kill(activity.pid, 0)).toThrow()
  })

  it('stops one registered activity without disposing its workspace', async () => {
    const prepared = await prepareWorkspace('example-change')
    const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
      cwd: prepared.record.path,
      detached: true,
      stdio: 'ignore',
    })
    child.unref()
    const activity = await registerWorkspaceActivity('example-change', {
      id: 'worker',
      pid: child.pid!,
      processGroupId: child.pid,
      resources: ['worker-slot'],
    })

    await stopWorkspaceActivity('example-change', 'worker')

    expect(() => process.kill(activity.pid, 0)).toThrow()
    expect((await observeWorkspace('example-change')).record.activities).toBeUndefined()
    await disposeWorkspace('example-change')
  })

  it('refuses to signal a process when its recorded identity no longer matches', async () => {
    const prepared = await prepareWorkspace('example-change')
    const child = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
      cwd: prepared.record.path,
      detached: true,
      stdio: 'ignore',
    })
    child.unref()
    await registerWorkspaceActivity('example-change', {
      id: 'worker',
      pid: child.pid!,
      processGroupId: child.pid,
      resources: ['worker-slot'],
    })
    const path = await workspaceRecordPath()
    const record = JSON.parse(await readFile(path, 'utf8')) as {
      activities: Record<string, { processIdentity?: string }>
    }
    record.activities.worker!.processIdentity = 'different-process'
    await writeFile(path, `${JSON.stringify(record, null, 2)}\n`)

    await expect(stopWorkspaceActivity('example-change', 'worker'))
      .rejects
      .toThrow('activity process identity changed')
    expect(() => process.kill(child.pid!, 0)).not.toThrow()

    process.kill(-child.pid!, 'SIGKILL')
    const deadline = Date.now() + 5_000
    while (Date.now() < deadline) {
      try {
        process.kill(child.pid!, 0)
        await new Promise(resolve => setTimeout(resolve, 25))
      }
      catch {
        break
      }
    }
    await disposeWorkspace('example-change')
  })

  it('retains an exclusive host resource lease for the activity lifetime', async () => {
    const port = await freePort()
    const first = await prepareWorkspace('example-change')
    const firstChild = await startServer(first.record.path, port)
    await registerWorkspaceActivity('example-change', {
      id: 'serve',
      pid: firstChild.pid!,
      processGroupId: firstChild.pid,
      resources: [`tcp:127.0.0.1:${port}`],
    })
    const second = await prepareWorkspace('second-change', { targetBranch: 'main' })
    const secondChild = spawn(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], {
      cwd: second.record.path,
      detached: true,
      stdio: 'ignore',
    })
    secondChild.unref()

    await expect(registerWorkspaceActivity('second-change', {
      id: 'serve',
      pid: secondChild.pid!,
      processGroupId: secondChild.pid,
      resources: [`tcp:127.0.0.1:${port}`],
    })).rejects.toThrow('exclusive resource is already registered')
    process.kill(-secondChild.pid!, 'SIGTERM')

    await disposeWorkspace('second-change')
    await disposeWorkspace('example-change')
  })

  it('fails closed on a stale resource lease until its recorded owner releases it', async () => {
    const identity = await processIdentityFor(process.pid)
    expect(identity).toBeTruthy()
    const record = {} as Parameters<typeof acquireResourceLeases>[0]
    const resource = 'stale-resource'
    const stale = await acquireResourceLeases(record, [resource], 2147483647, 'stale-process')

    const attempts = await Promise.allSettled([
      acquireResourceLeases(record, [resource], process.pid, identity!),
      acquireResourceLeases(record, [resource], process.pid, identity!),
    ])
    expect(attempts.every(result =>
      result.status === 'rejected'
      && String(result.reason).includes('lease is stale'))).toBe(true)

    await releaseResourceLeases(stale)
    const acquired = await acquireResourceLeases(record, [resource], process.pid, identity!)
    await releaseResourceLeases(acquired)
  })
})
