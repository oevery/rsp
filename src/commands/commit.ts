import { execFile, spawn } from 'node:child_process'
import { lstat, readFile } from 'node:fs/promises'
import { promisify } from 'node:util'

import { toErrorMessage } from '../core/output.js'

const execFileAsync = promisify(execFile)

export interface CommitResult {
  ok: boolean
  command: 'commit'
  code?: 'message_file_read_failed' | 'git_operation_in_progress' | 'no_staged_boundary' | 'invalid_expected_snapshot' | 'expected_snapshot_mismatch' | 'git_commit_failed' | 'receipt_observation_failed' | 'message_mismatch' | 'commit_boundary_mismatch'
  message?: string
  operation?: string
  commit?: string
  headBefore?: string | null
  headAfter?: string | null
  stagedTree?: string
  committedTree?: string
  parents?: string[]
  attempt: 'not_attempted' | 'succeeded' | 'failed'
  // Git success confirms creation, not that the observed HEAD belongs to this attempt.
  creation: 'not_attempted' | 'confirmed' | 'unknown'
  storedMessage?: string
  committedPaths?: string[]
  remainingWorktreePaths?: string[]
  preparedLength?: number
  observedLength?: number
}

export interface CommitSnapshot {
  expectedHead?: string
  expectedTree?: string
}

function messagesMatch(prepared: string, observed: string): boolean {
  if (prepared === observed)
    return true
  if (prepared.endsWith('\n') && prepared.slice(0, -1) === observed)
    return true
  return observed.endsWith('\n') && observed.slice(0, -1) === prepared
}

async function git(args: string[]): Promise<string> {
  const { stdout } = await execFileAsync('git', ['--no-replace-objects', ...args], { encoding: 'utf8' })
  return stdout
}

function objectId(value: string, oid: RegExp): string {
  const result = value.trim()
  if (!oid.test(result))
    throw new Error('invalid Git object ID')
  return result
}

async function readHead(oid: RegExp): Promise<string | null> {
  try {
    return objectId(await git(['rev-parse', '--verify', 'HEAD^{commit}']), oid)
  }
  catch (error) {
    // Only a missing symbolic branch is unborn; every other inspection failure stops.
    const ref = (await git(['symbolic-ref', '-q', 'HEAD'])).trim()
    if (!ref.startsWith('refs/heads/'))
      throw error
    try {
      await git(['show-ref', '--verify', '--quiet', ref])
    }
    catch (refError) {
      if ((refError as { code?: number }).code === 1)
        return null
      throw refError
    }
    throw error
  }
}

async function readPaths(args: string[]): Promise<string[]> {
  return (await git([...args, '-z'])).split('\0').filter(Boolean)
}

async function readRemainingWorktreePaths(): Promise<string[]> {
  const lists = await Promise.all([
    readPaths(['diff', '--name-only', '--no-renames', '--diff-filter=ACDMRTUXB']),
    readPaths(['diff', '--cached', '--name-only', '--no-renames', '--diff-filter=ACDMRTUXB']),
    readPaths(['ls-files', '--others', '--exclude-standard']),
  ])
  return [...new Set(lists.flat())].sort()
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
    const location = (await git(['rev-parse', '--git-path', path])).trim()
    try {
      await lstat(location)
      return operation
    }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT')
        throw error
    }
  }
  return null
}

function samePaths(expected: string[], observed: string[]): boolean {
  const left = [...expected].sort()
  const right = [...observed].sort()
  return left.length === right.length && left.every((path, index) => path === right[index])
}

async function runGitCommit(message: string): Promise<{ ok: boolean, message?: string }> {
  return await new Promise((resolve) => {
    const child = spawn('git', ['commit', '--cleanup=verbatim', '-F', '-'], { stdio: ['pipe', 'pipe', 'pipe'] })
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
      resolve(code === 0 ? { ok: true } : { ok: false, message: stderr.trim() || stdout.trim() || `git commit exited with code ${code ?? 'unknown'}` })
    })
    // Early Git failure may close stdin before the prepared message is consumed.
    child.stdin.on('error', () => {})
    child.stdin.end(message)
  })
}

export async function commitFromMessageFile(messageFile: string, snapshot: CommitSnapshot = {}): Promise<CommitResult> {
  const receipt: CommitResult = { ok: false, command: 'commit', attempt: 'not_attempted', creation: 'not_attempted' }
  const stop = (code: CommitResult['code'], message: string): CommitResult => ({ ...receipt, ok: false, code, message })
  let preparedMessage: string
  try {
    preparedMessage = await readFile(messageFile, 'utf8')
  }
  catch (error) {
    return stop('message_file_read_failed', `unable to read message file: ${toErrorMessage(error)}`)
  }
  let oid: RegExp
  try {
    const format = (await git(['rev-parse', '--show-object-format'])).trim()
    if (format !== 'sha1' && format !== 'sha256')
      throw new Error('unsupported Git object format')
    oid = new RegExp(format === 'sha1' ? '^[0-9a-f]{40}$' : '^[0-9a-f]{64}$')
  }
  catch (error) {
    return stop('receipt_observation_failed', `unable to inspect Git object format: ${toErrorMessage(error)}`)
  }
  const { expectedHead, expectedTree } = snapshot
  if ((expectedHead !== undefined || expectedTree !== undefined)
    && (expectedHead === undefined || expectedTree === undefined || (expectedHead !== 'unborn' && !oid.test(expectedHead)) || !oid.test(expectedTree))) {
    return stop('invalid_expected_snapshot', 'expected-head and expected-tree must be supplied together as full object IDs (expected-head may be unborn)')
  }

  try {
    const operation = await detectGitOperation()
    if (operation) {
      receipt.operation = operation
      return stop('git_operation_in_progress', `refusing to commit while Git operation is in progress: ${operation}`)
    }
  }
  catch (error) {
    return stop('git_operation_in_progress', `unable to verify current Git operation state: ${toErrorMessage(error)}`)
  }

  let stagedPaths: string[]
  try {
    stagedPaths = await readPaths(['diff', '--cached', '--name-only', '--no-renames', '--diff-filter=ACDMRTUXB'])
  }
  catch (error) {
    return stop('no_staged_boundary', `unable to inspect staged boundary: ${toErrorMessage(error)}`)
  }
  if (stagedPaths.length === 0)
    return stop('no_staged_boundary', 'no staged boundary exists')

  try {
    receipt.headBefore = await readHead(oid)
    receipt.stagedTree = objectId(await git(['write-tree']), oid)
    if (expectedHead !== undefined && (expectedHead !== (receipt.headBefore ?? 'unborn') || expectedTree !== receipt.stagedTree))
      return stop('expected_snapshot_mismatch', 'HEAD or index tree differs from the supplied reviewed snapshot; no commit attempted')
    // These snapshots are not cross-process locks. Recheck just before attempting Git.
    if (await readHead(oid) !== receipt.headBefore || objectId(await git(['write-tree']), oid) !== receipt.stagedTree)
      return stop('expected_snapshot_mismatch', 'HEAD or index tree changed while inspecting the boundary; no commit attempted')
  }
  catch (error) {
    return stop('receipt_observation_failed', `unable to inspect HEAD/index before commit: ${toErrorMessage(error)}`)
  }

  const result = await runGitCommit(preparedMessage)
  receipt.attempt = result.ok ? 'succeeded' : 'failed'
  receipt.creation = result.ok ? 'confirmed' : 'unknown'
  try {
    const observedHead = await readHead(oid)
    receipt.headAfter = observedHead
    if (observedHead !== null) {
      receipt.commit = observedHead
      // One immutable object supplies the exact message, tree and actual parents.
      const object = await git(['cat-file', 'commit', observedHead])
      const separator = object.indexOf('\n\n')
      if (separator < 0)
        throw new Error('invalid commit object')
      const headers = object.slice(0, separator).split('\n')
      if (!headers[0]?.startsWith('tree '))
        throw new Error('missing commit tree')
      receipt.committedTree = objectId(headers[0].slice(5), oid)
      receipt.parents = headers.filter(line => line.startsWith('parent ')).map(line => objectId(line.slice(7), oid))
      receipt.storedMessage = object.slice(separator + 2)
      receipt.committedPaths = await readPaths(['diff-tree', '--root', '--no-commit-id', '--name-only', '--no-renames', '-r', observedHead])
    }
    receipt.remainingWorktreePaths = await readRemainingWorktreePaths()
    receipt.headAfter = await readHead(oid)
    if (receipt.headAfter !== observedHead)
      return stop('commit_boundary_mismatch', 'HEAD changed while collecting the immutable commit receipt; stopped without retry or amend')
    if (!result.ok) {
      if (observedHead !== receipt.headBefore)
        return stop('commit_boundary_mismatch', `git commit failed but HEAD changed; observed effects require inspection, not retry: ${result.message}`)
      return stop('git_commit_failed', `${result.message ?? 'git commit failed'}; hook effects cannot be ruled out, do not retry automatically`)
    }
    const expectedParents = receipt.headBefore === null ? [] : [receipt.headBefore!]
    if (observedHead === null || observedHead === receipt.headBefore || receipt.committedTree !== receipt.stagedTree
      || !samePaths(expectedParents, receipt.parents ?? []) || !samePaths(stagedPaths, receipt.committedPaths ?? [])) {
      return stop('commit_boundary_mismatch', 'observed commit tree, parents or paths differ from the captured boundary; stopped without retry or amend')
    }
    if (!messagesMatch(preparedMessage, receipt.storedMessage!)) {
      receipt.preparedLength = preparedMessage.length
      receipt.observedLength = receipt.storedMessage!.length
      return stop('message_mismatch', 'committed message differs from the prepared message; stopped without amend or a second commit')
    }
  }
  catch (error) {
    return stop('receipt_observation_failed', `Git was attempted but its complete effects could not be observed; do not retry automatically: ${toErrorMessage(error)}`)
  }
  return { ...receipt, ok: true }
}
