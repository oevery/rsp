import { execFile, spawn } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { promisify } from 'node:util'

import { toErrorMessage } from '../core/output.js'

const execFileAsync = promisify(execFile)

export interface CommitResult {
  ok: boolean
  command: 'commit'
  code?: 'message_file_read_failed' | 'literal_newline_escape' | 'no_staged_boundary' | 'git_commit_failed' | 'message_mismatch'
  message?: string
  commit?: string
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
  const { stdout } = await execFileAsync('git', ['diff', '--cached', '--name-only', '--diff-filter=ACDMRTUXB'], {
    encoding: 'utf8',
  })
  return stdout.split('\n').filter(Boolean)
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

  const commitResult = await runGitCommit(preparedMessage)
  if (!commitResult.ok) {
    return {
      ok: false,
      command: 'commit',
      code: 'git_commit_failed',
      message: commitResult.message,
    }
  }

  let commit: string
  let observedMessage: string
  try {
    const [head, observed] = await Promise.all([
      execFileAsync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }),
      execFileAsync('git', ['show', '-s', '--format=%B%x00', 'HEAD'], { encoding: 'utf8' }),
    ])
    commit = head.stdout.trim()
    observedMessage = extractCommittedMessage(observed.stdout)
  }
  catch (error) {
    return {
      ok: false,
      command: 'commit',
      code: 'message_mismatch',
      message: `commit created but could not observe its complete message: ${toErrorMessage(error)}`,
      preparedLength: preparedMessage.length,
    }
  }

  if (!messagesMatch(preparedMessage, observedMessage)) {
    return {
      ok: false,
      command: 'commit',
      code: 'message_mismatch',
      message: 'committed message differs from the prepared message; stopped without amend or a second commit',
      commit,
      preparedLength: preparedMessage.length,
      observedLength: observedMessage.length,
    }
  }

  return {
    ok: true,
    command: 'commit',
    commit,
  }
}
