import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'

const repoRoot = fileURLToPath(new URL('..', import.meta.url))
const temporaryRepositories: string[] = []

function cliPath(): string {
  return join(repoRoot, 'dist', 'cli.mjs')
}

function createRepository(): string {
  const repository = mkdtempSync(join(tmpdir(), 'rsp-workspace-json-error-'))
  temporaryRepositories.push(repository)
  execFileSync('git', ['init', '-q', '-b', 'main'], { cwd: repository })
  execFileSync('git', ['config', 'user.name', 'RSP Test'], { cwd: repository })
  execFileSync('git', ['config', 'user.email', 'rsp-test@example.invalid'], { cwd: repository })
  execFileSync(process.execPath, [cliPath(), 'init'], { cwd: repository })
  execFileSync(process.execPath, [
    cliPath(),
    'create',
    'json-error',
    'Workspace JSON error fixture',
    '--kind=fix',
  ], { cwd: repository })
  execFileSync('git', ['add', '.'], { cwd: repository })
  execFileSync('git', ['commit', '-q', '-m', 'test: initialize workspace JSON error fixture'], { cwd: repository })
  return repository
}

function runCli(repository: string, args: string[]) {
  return spawnSync(process.execPath, [cliPath(), ...args], {
    cwd: repository,
    encoding: 'utf8',
  })
}

afterEach(() => {
  for (const repository of temporaryRepositories.splice(0))
    rmSync(repository, { force: true, recursive: true })
})

describe('workspace JSON errors', () => {
  it('emits a structured error when disposing a dirty workspace', () => {
    const repository = createRepository()
    execFileSync(process.execPath, [cliPath(), 'workspace', 'prepare', 'json-error', '--target', 'main'], { cwd: repository })
    const workspacePath = JSON.parse(runCli(repository, ['workspace', 'status', 'json-error', '--json']).stdout).workspace.record.path
    writeFileSync(join(workspacePath, 'dirty.txt'), 'dirty\n')

    const result = runCli(repository, ['workspace', 'dispose', 'json-error', '--json'])
    expect(result.status).toBe(1)
    expect(result.stderr).toBe('')
    expect(result.stdout).not.toContain(' at file:')

    const output = JSON.parse(result.stdout)
    expect(output).toMatchObject({
      command: 'workspace dispose',
      ok: false,
      error: {
        code: 'workspace_dirty',
        message: expect.stringContaining('uncommitted changes'),
      },
    })

    const cleanup = runCli(repository, ['workspace', 'dispose', 'json-error', '--discard', '--json'])
    expect(cleanup.status).toBe(0)
  })

  it('emits a structured error when a workspace is missing', () => {
    const repository = createRepository()
    const result = runCli(repository, ['workspace', 'status', 'missing-workspace', '--json'])

    expect(result.status).toBe(1)
    expect(result.stderr).toBe('')
    expect(result.stdout).not.toContain(' at file:')

    expect(JSON.parse(result.stdout)).toMatchObject({
      command: 'workspace status',
      ok: false,
      error: {
        code: 'workspace_not_found',
        message: 'workspace not found for missing-workspace',
      },
    })
  })
})
