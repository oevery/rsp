import { execFileSync, spawnSync } from 'node:child_process'
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'

const repoRoot = fileURLToPath(new URL('../..', import.meta.url))
const temporaryRepositories: string[] = []

function cliPath(): string {
  return join(repoRoot, 'dist', 'cli.mjs')
}

function createRepository(): string {
  const repository = mkdtempSync(join(tmpdir(), 'rsp-commit-transport-'))
  temporaryRepositories.push(repository)
  execFileSync('git', ['init', '-q'], { cwd: repository })
  execFileSync('git', ['config', 'user.name', 'RSP Test'], { cwd: repository })
  execFileSync('git', ['config', 'user.email', 'rsp-test@example.invalid'], { cwd: repository })
  writeFileSync(join(repository, 'tracked.txt'), 'initial\n')
  execFileSync('git', ['add', 'tracked.txt'], { cwd: repository })
  execFileSync('git', ['commit', '-q', '-m', 'test: initial'], { cwd: repository })
  return repository
}

function runCommit(repository: string, messageFile: string, json = true) {
  return spawnSync(process.execPath, [
    cliPath(),
    'commit',
    '--message-file',
    messageFile,
    ...(json ? ['--json'] : []),
  ], {
    cwd: repository,
    encoding: 'utf8',
  })
}

afterEach(() => {
  for (const repository of temporaryRepositories.splice(0))
    rmSync(repository, { force: true, recursive: true })
})

describe('rsp commit transport', () => {
  it('preserves a multiline body through the public CLI', () => {
    const repository = createRepository()
    const headBefore = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repository, encoding: 'utf8' }).trim()
    writeFileSync(join(repository, 'tracked.txt'), 'changed\n')
    execFileSync('git', ['add', 'tracked.txt'], { cwd: repository })
    writeFileSync(join(repository, 'remaining.txt'), 'unrelated\n')
    const message = 'fix(commit): preserve body\n\n- first bullet\n- second bullet\n- third bullet'
    const messageFile = join(repository, 'message.txt')
    writeFileSync(messageFile, message)

    const result = runCommit(repository, messageFile)
    expect(result.status).toBe(0)
    const receipt = JSON.parse(result.stdout)
    expect(receipt).toMatchObject({
      ok: true,
      command: 'commit',
      headBefore,
      headAfter: receipt.commit,
      storedMessage: message,
      committedPaths: ['tracked.txt'],
      remainingWorktreePaths: ['message.txt', 'remaining.txt'],
    })
    expect(receipt.headAfter).not.toBe(headBefore)
    expect(execFileSync('git', ['show', '-s', '--format=%B', 'HEAD'], { cwd: repository, encoding: 'utf8' }))
      .toBe(`${message}\n`)
    expect(execFileSync('git', ['diff', '--cached', '--name-only'], { cwd: repository, encoding: 'utf8' })).toBe('')
  })

  it('accepts a message file with its own terminal newline', () => {
    const repository = createRepository()
    writeFileSync(join(repository, 'tracked.txt'), 'changed\n')
    execFileSync('git', ['add', 'tracked.txt'], { cwd: repository })
    const message = 'fix(commit): preserve terminal newline\n\n- body remains multiline\n'
    const messageFile = join(repository, 'message.txt')
    writeFileSync(messageFile, message)

    const result = runCommit(repository, messageFile)
    expect(result.status).toBe(0)
    expect(JSON.parse(result.stdout)).toMatchObject({ ok: true, command: 'commit' })
    const commitText = execFileSync('git', ['cat-file', 'commit', 'HEAD'], { cwd: repository, encoding: 'utf8' })
    expect(commitText.endsWith(`\n${message}`)).toBe(true)
  })

  it('observes a staged rename with the same exact path semantics before and after commit', () => {
    const repository = createRepository()
    execFileSync('git', ['mv', 'tracked.txt', 'renamed.txt'], { cwd: repository })
    const message = 'refactor(commit): preserve rename boundary'
    const messageFile = join(repository, 'message.txt')
    writeFileSync(messageFile, message)

    const result = runCommit(repository, messageFile)
    expect(result.status).toBe(0)
    expect(JSON.parse(result.stdout)).toMatchObject({
      ok: true,
      command: 'commit',
      storedMessage: message,
      committedPaths: ['renamed.txt', 'tracked.txt'],
    })
  })

  it('rejects a literal newline escape before invoking Git', () => {
    const repository = createRepository()
    writeFileSync(join(repository, 'tracked.txt'), 'changed\n')
    execFileSync('git', ['add', 'tracked.txt'], { cwd: repository })
    const headBefore = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repository, encoding: 'utf8' }).trim()
    const messageFile = join(repository, 'message.txt')
    writeFileSync(messageFile, 'fix(commit): unsafe\\n- bullet')

    const result = runCommit(repository, messageFile)
    expect(result.status).not.toBe(0)
    expect(JSON.parse(result.stdout)).toMatchObject({ ok: false, code: 'literal_newline_escape' })
    expect(execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repository, encoding: 'utf8' }).trim()).toBe(headBefore)
    expect(execFileSync('git', ['diff', '--cached', '--name-only'], { cwd: repository, encoding: 'utf8' })).toBe('tracked.txt\n')
  })

  it('stops when no staged boundary exists', () => {
    const repository = createRepository()
    const headBefore = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repository, encoding: 'utf8' }).trim()
    const messageFile = join(repository, 'message.txt')
    writeFileSync(messageFile, 'fix(commit): no staged boundary')

    const result = runCommit(repository, messageFile)
    expect(result.status).not.toBe(0)
    expect(JSON.parse(result.stdout)).toMatchObject({ ok: false, code: 'no_staged_boundary' })
    expect(execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repository, encoding: 'utf8' }).trim()).toBe(headBefore)
  })

  it('refuses an in-progress Git operation before invoking commit', () => {
    const repository = createRepository()
    writeFileSync(join(repository, 'tracked.txt'), 'changed\n')
    execFileSync('git', ['add', 'tracked.txt'], { cwd: repository })
    const headBefore = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repository, encoding: 'utf8' }).trim()
    const gitDir = execFileSync('git', ['rev-parse', '--absolute-git-dir'], { cwd: repository, encoding: 'utf8' }).trim()
    writeFileSync(join(gitDir, 'MERGE_HEAD'), `${headBefore}\n`)
    const messageFile = join(repository, 'message.txt')
    writeFileSync(messageFile, 'fix(commit): refuse merge state')

    const result = runCommit(repository, messageFile)
    expect(result.status).not.toBe(0)
    expect(JSON.parse(result.stdout)).toMatchObject({
      ok: false,
      code: 'git_operation_in_progress',
      operation: 'merge',
    })
    expect(execFileSync('git', ['rev-parse', 'HEAD'], { cwd: repository, encoding: 'utf8' }).trim()).toBe(headBefore)
    expect(execFileSync('git', ['diff', '--cached', '--name-only'], { cwd: repository, encoding: 'utf8' })).toBe('tracked.txt\n')
  })

  it('fails closed when a hook changes the committed message', () => {
    const repository = createRepository()
    writeFileSync(join(repository, 'tracked.txt'), 'changed\n')
    execFileSync('git', ['add', 'tracked.txt'], { cwd: repository })
    const hooks = join(repository, 'hooks')
    mkdirSync(hooks)
    const hook = join(hooks, 'commit-msg')
    writeFileSync(hook, '#!/bin/sh\nprintf "\\nmutated" >> "$1"\n')
    chmodSync(hook, 0o755)
    execFileSync('git', ['config', 'core.hooksPath', hooks], { cwd: repository })
    const messageFile = join(repository, 'message.txt')
    writeFileSync(messageFile, 'fix(commit): detect mismatch')

    const result = runCommit(repository, messageFile)
    expect(result.status).not.toBe(0)
    expect(JSON.parse(result.stdout)).toMatchObject({ ok: false, code: 'message_mismatch' })
    expect(execFileSync('git', ['rev-list', '--count', 'HEAD'], { cwd: repository, encoding: 'utf8' }).trim()).toBe('2')
    expect(readFileSync(messageFile, 'utf8')).toBe('fix(commit): detect mismatch')
  })
})
