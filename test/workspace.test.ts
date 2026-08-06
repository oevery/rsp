import { execFileSync, spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import { inspectWorkspaceFacts } from '../src/workspace/facts.js'
import { landWorkspace } from '../src/workspace/land.js'
import { disposeWorkspace, observeWorkspace, prepareWorkspace, registerWorkspaceActivity } from '../src/workspace/session.js'

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
