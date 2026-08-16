import { execFile, spawn } from 'node:child_process'
import { lstat, readFile } from 'node:fs/promises'
import { promisify } from 'node:util'

import { toErrorMessage } from '../core/output.js'

const execFileAsync = promisify(execFile)

export interface CommitResult {
  ok: boolean
  command: 'commit'
  code?: 'message_file_read_failed' | 'literal_newline_escape' | 'git_operation_in_progress' | 'no_staged_boundary' | 'git_commit_failed' | 'receipt_observation_failed' | 'message_mismatch' | 'commit_boundary_mismatch'
  message?: string
  operation?: string
  commit?: string
  headBefore?: string | null
  headAfter?: string
  storedMessage?: string
  committedPaths?: string[]
  remainingWorktreePaths?: string[]
  preparedLength?: number
  observedLength?: number
}

function messagesMatch(prepared: string, observed: string): boolean {
  if (prepared === observed)
    return true
  if (prepared.endsWith('\n') && prepared.slice(0, -1) === observed)
    return true
  return observed.endsWith('\n') && observed.slice(0, -1) === prepared
}

function extractCommittedMessage(output: string): string {
  const separator = output.indexOf('\0')
  return separator === -1 ? output : output.slice(0, separator)
}

async function readStagedPaths(): Promise<string[]> {
  const { stdout } = await execFileAsync('git', ['diff', '--cached', '--name-only', '--no-renames', '--diff-filter=ACDMRTUXB'], {
    encoding: 'utf8',
  })
  return stdout.split('\n').filter(Boolean)
}

async function readHead(): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync('git', ['rev-parse', '--verify', 'HEAD'], { encoding: 'utf8' })
    return stdout.trim()
  }
  catch {
    return null
  }
}

async function readPathLines(args: string[]): Promise<string[]> {
  const { stdout } = await execFileAsync('git', args, { encoding: 'utf8' })
  return stdout.split('\n').filter(Boolean)
}

async function readCommittedPaths(commit: string): Promise<string[]> {
  return readPathLines(['diff-tree', '--root', '--no-commit-id', '--name-only', '--no-renames', '-r', commit])
}

async function readRemainingWorktreePaths(): Promise<string[]> {
  const [unstaged, staged, untracked] = await Promise.all([
    readPathLines(['diff', '--name-only', '--no-renames', '--diff-filter=ACDMRTUXB']),
    readPathLines(['diff', '--cached', '--name-only', '--no-renames', '--diff-filter=ACDMRTUXB']),
    readPathLines(['ls-files', '--others', '--exclude-standard']),
  ])
  return [...new Set([...unstaged, ...staged, ...untracked])].sort()
}

async function gitPathExists(path: string): Promise<boolean> {
  const { stdout } = await execFileAsync('git', ['rev-parse', '--git-path', path], { encoding: 'utf8' })
  try {
    await lstat(stdout.trim())
    return true
  }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT')
      return false
    throw error
  }
}

async function detectGitOperation(): Promise<string | null> {
  const operations = [
    ['merge', 'MERGE_HEAD'],
    ['cherry-pick', 'CHERRY_PICK_HEAD'],
    ['revert', 'REVERT_HEAD'],
    ['rebase', 'rebase-merge'],
    ['rebase-or-am', 'rebase-apply'],
    ['sequencer', 'sequencer'],
  ] as const
  for (const [operation, path] of operations) {
    if (await gitPathExists(path))
      return operation
  }
  return null
}

function samePaths(expected: string[], observed: string[]): boolean {
  const left = [...expected].sort()
  const right = [...observed].sort()
  return left.length === right.length && left.every((path, index) => path === right[index])
}

async function runGitCommit(message: string): Promise<{ ok: true, stdout: string } | { ok: false, message: string }> {
  return await new Promise((resolve) => {
    const child = spawn('git', ['commit', '--cleanup=verbatim', '-F', '-'], {
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    let stdout = ''
    let stderr = ''
    let settled = false

    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', chunk => stdout += chunk)
    child.stderr.on('data', chunk => stderr += chunk)
    child.on('error', (error) => {
      if (!settled) {
        settled = true
        resolve({ ok: false, message: toErrorMessage(error) })
      }
    })
    child.on('close', (code) => {
      if (settled)
        return
      settled = true
      if (code === 0)
        resolve({ ok: true, stdout })
      else
        resolve({ ok: false, message: stderr.trim() || stdout.trim() || `git commit exited with code ${code ?? 'unknown'}` })
    })
    child.stdin.end(message)
  })
}

export async function commitFromMessageFile(messageFile: string): Promise<CommitResult> {
  let preparedMessage: string
  try {
    preparedMessage = await readFile(messageFile, 'utf8')
  }
  catch (error) {
    return {
      ok: false,
      command: 'commit',
      code: 'message_file_read_failed',
      message: `unable to read message file: ${toErrorMessage(error)}`,
    }
  }

  if (preparedMessage.includes('\\n')) {
    return {
      ok: false,
      command: 'commit',
      code: 'literal_newline_escape',
      message: 'message file contains literal \\\\n; use actual line breaks',
    }
  }

  let operation: string | null
  try {
    operation = await detectGitOperation()
  }
  catch (error) {
    return {
      ok: false,
      command: 'commit',
      code: 'git_operation_in_progress',
      message: `unable to verify current Git operation state: ${toErrorMessage(error)}`,
    }
  }
  if (operation) {
    return {
      ok: false,
      command: 'commit',
      code: 'git_operation_in_progress',
      operation,
      message: `refusing to commit while Git operation is in progress: ${operation}`,
    }
  }

  let stagedPaths: string[]
  try {
    stagedPaths = await readStagedPaths()
  }
  catch (error) {
    return {
      ok: false,
      command: 'commit',
      code: 'no_staged_boundary',
      message: `unable to inspect staged boundary: ${toErrorMessage(error)}`,
    }
  }
  if (stagedPaths.length === 0) {
    return {
      ok: false,
      command: 'commit',
      code: 'no_staged_boundary',
      message: 'no staged boundary exists',
    }
  }

  const headBefore = await readHead()

  const commitResult = await runGitCommit(preparedMessage)
  if (!commitResult.ok) {
    return {
      ok: false,
      command: 'commit',
      code: 'git_commit_failed',
      message: commitResult.message,
    }
  }

  let headAfter: string
  let observedMessage: string
  let committedPaths: string[]
  let remainingWorktreePaths: string[]
  try {
    const [head, observed] = await Promise.all([
      execFileAsync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }),
      execFileAsync('git', ['show', '-s', '--format=%B%x00', 'HEAD'], { encoding: 'utf8' }),
    ])
    headAfter = head.stdout.trim()
    observedMessage = extractCommittedMessage(observed.stdout)
    ;[committedPaths, remainingWorktreePaths] = await Promise.all([
      readCommittedPaths(headAfter),
      readRemainingWorktreePaths(),
    ])
  }
  catch (error) {
    return {
      ok: false,
      command: 'commit',
      code: 'receipt_observation_failed',
      message: `commit created but its complete receipt could not be observed: ${toErrorMessage(error)}`,
      headBefore,
      preparedLength: preparedMessage.length,
    }
  }

  if (!messagesMatch(preparedMessage, observedMessage)) {
    return {
      ok: false,
      command: 'commit',
      code: 'message_mismatch',
      message: 'committed message differs from the prepared message; stopped without amend or a second commit',
      commit: headAfter,
      headBefore,
      headAfter,
      storedMessage: observedMessage,
      committedPaths,
      remainingWorktreePaths,
      preparedLength: preparedMessage.length,
      observedLength: observedMessage.length,
    }
  }

  if (!samePaths(stagedPaths, committedPaths)) {
    return {
      ok: false,
      command: 'commit',
      code: 'commit_boundary_mismatch',
      message: 'committed paths differ from the reviewed staged boundary; stopped without amend or a second commit',
      commit: headAfter,
      headBefore,
      headAfter,
      storedMessage: observedMessage,
      committedPaths,
      remainingWorktreePaths,
    }
  }

  return {
    ok: true,
    command: 'commit',
    commit: headAfter,
    headBefore,
    headAfter,
    storedMessage: observedMessage,
    committedPaths,
    remainingWorktreePaths,
  }
}
