import type { Dirent } from 'node:fs'
import { execFile } from 'node:child_process'
import { createHash, randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import { lstat, mkdir, readdir, readFile, realpath, rename, stat, unlink, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { promisify } from 'node:util'

import { resolveWorkRef } from '../core/work-ref.js'
import { processExists, processIdentityFor } from './process.js'
import { acquireResourceLeases, releaseResourceLeases } from './resources.js'

const execFileAsync = promisify(execFile)
const RECORD_SCHEMA = 1
const MAX_ACTIVE_WORKSPACES = 50
const MAX_WORKSPACE_RECORD_ISSUES = 20

export interface WorkspaceResourceLease {
  resourceId: string
  path: string
  token: string
  ownerPath?: string
}

export interface WorkspaceActivity {
  id: string
  label: string
  pid: number
  processIdentity?: string
  processGroupId?: number
  resources: string[]
  leases: WorkspaceResourceLease[]
  registeredAt: string
}

export interface WorkspaceRecord {
  schema: 1
  workRef: string
  repository: string
  commonDir: string
  sourceWorktree: string
  targetBranch: string
  baseCommit: string
  branch: string
  path: string
  createdAt: string
  updatedAt: string
  activities?: Record<string, WorkspaceActivity>
}

export interface WorkspaceObservation {
  record: WorkspaceRecord
  registered: boolean
  branchExists: boolean
  dirty: string[]
  aheadOfTarget: number
  activeActivityCount: number
  deliveryState: 'landed' | 'unlanded' | 'landed-equivalent'
  cleanupReady: boolean
}

export interface ActiveWorkspaceObservation {
  workRef: string
  branch: string
  targetBranch: string
  dirty: boolean
  commitsAhead: number
  activeActivityCount: number
  deliveryState: WorkspaceObservation['deliveryState']
  cleanupReady: boolean
}

export interface ActiveWorkspaceInspection {
  workspaces: ActiveWorkspaceObservation[]
  issues: Array<{ record: string, message: string }>
  truncated: boolean
}

export interface WorkspacePruneResult {
  workRef: string
  disposition: 'healthy' | 'prune-ready' | 'quarantine-ready' | 'blocked'
  applied: boolean
  recordValid: boolean
  branchExists: boolean
  worktreeExists: boolean
  cachePathExists: boolean
  liveActivityCount: number
  quarantinePath?: string
}

interface GitContext {
  repository: string
  commonDir: string
  sourceWorktree: string
}

interface WorktreeEntry {
  path: string
  branch?: string
  head?: string
}

function cacheRoot(): string {
  return resolve(process.env.XDG_CACHE_HOME || join(homedir(), '.cache'), 'rsp', 'workspaces')
}

async function run(
  command: string,
  args: string[],
  options: { cwd: string, allowFailure?: boolean },
): Promise<{ stdout: string, stderr: string, exitCode: number }> {
  try {
    const result = await execFileAsync(command, args, {
      cwd: options.cwd,
      encoding: 'utf8',
      env: process.env,
      maxBuffer: 10 * 1024 * 1024,
    })
    return { stdout: result.stdout.trim(), stderr: result.stderr.trim(), exitCode: 0 }
  }
  catch (error) {
    const failure = error as NodeJS.ErrnoException & { stdout?: string, stderr?: string, code?: number | string }
    const exitCode = typeof failure.code === 'number' ? failure.code : 1
    if (options.allowFailure) {
      return {
        stdout: String(failure.stdout ?? '').trim(),
        stderr: String(failure.stderr ?? failure.message).trim(),
        exitCode,
      }
    }
    throw new Error(`${command} ${args.join(' ')} failed: ${String(failure.stderr ?? failure.message).trim()}`)
  }
}

async function git(cwd: string, args: string[], allowFailure = false) {
  return run('git', args, { cwd, allowFailure })
}

async function inspectGitContext(cwd = process.cwd()): Promise<GitContext | null> {
  const topLevel = await git(cwd, ['rev-parse', '--show-toplevel'], true)
  if (topLevel.exitCode !== 0)
    return null
  const sourceWorktree = await realpath(topLevel.stdout)
  const rawCommonDir = (await git(sourceWorktree, ['rev-parse', '--git-common-dir'])).stdout
  const commonDir = await realpath(isAbsolute(rawCommonDir) ? rawCommonDir : resolve(sourceWorktree, rawCommonDir))
  const worktrees = await listWorktrees(sourceWorktree)
  const repository = await realpath(worktrees[0]?.path || sourceWorktree)
  return { repository, commonDir, sourceWorktree }
}

async function discoverGitContext(cwd = process.cwd()): Promise<GitContext> {
  const context = await inspectGitContext(cwd)
  if (!context)
    throw new Error('workspace commands require a Git repository')
  return context
}

function recordKey(workRef: string): string {
  return createHash('sha256').update(workRef).digest('hex').slice(0, 20)
}

function recordPath(commonDir: string, workRef: string): string {
  return join(commonDir, 'rsp', 'workspaces', `${recordKey(workRef)}.json`)
}

function branchName(workRef: string): string {
  return `rsp/${workRef}`
}

function workspacePath(repository: string, workRef: string): string {
  const repositoryId = createHash('sha256').update(repository).digest('hex').slice(0, 16)
  return join(cacheRoot(), `${basename(repository)}-${repositoryId}`, ...workRef.split('/'))
}

async function canonicalPath(path: string): Promise<string> {
  let cursor = resolve(path)
  const missing: string[] = []
  while (true) {
    try {
      return join(await realpath(cursor), ...missing.reverse())
    }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT')
        throw error
      const parent = dirname(cursor)
      if (parent === cursor)
        throw error
      missing.push(basename(cursor))
      cursor = parent
    }
  }
}

function isWithin(parent: string, candidate: string): boolean {
  const child = relative(parent, candidate)
  return child === '' || (!child.startsWith('..') && !isAbsolute(child))
}

async function readRecord(commonDir: string, workRef: string): Promise<WorkspaceRecord | null> {
  try {
    const parsed = JSON.parse(await readFile(recordPath(commonDir, workRef), 'utf8')) as WorkspaceRecord
    if (parsed.schema !== RECORD_SCHEMA || parsed.workRef !== workRef)
      throw new Error(`invalid workspace record for ${workRef}`)
    return parsed
  }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT')
      return null
    throw error
  }
}

async function writeRecord(record: WorkspaceRecord): Promise<void> {
  const path = recordPath(record.commonDir, record.workRef)
  await mkdir(dirname(path), { recursive: true })
  const temporary = `${path}.${process.pid}.tmp`
  await writeFile(temporary, `${JSON.stringify(record, null, 2)}\n`, { flag: 'wx' })
  await rename(temporary, path)
}

async function listWorktrees(repository: string): Promise<WorktreeEntry[]> {
  const output = (await git(repository, ['worktree', 'list', '--porcelain'])).stdout
  const entries: WorktreeEntry[] = []
  let current: WorktreeEntry | null = null
  for (const line of output.split('\n')) {
    if (line.startsWith('worktree ')) {
      if (current)
        entries.push(current)
      current = { path: line.slice('worktree '.length) }
    }
    else if (current && line.startsWith('HEAD ')) {
      current.head = line.slice('HEAD '.length)
    }
    else if (current && line.startsWith('branch refs/heads/')) {
      current.branch = line.slice('branch refs/heads/'.length)
    }
  }
  if (current)
    entries.push(current)
  return Promise.all(entries.map(async entry => ({
    ...entry,
    path: await canonicalPath(entry.path),
  })))
}

async function branchExists(repository: string, branch: string): Promise<boolean> {
  return (await git(repository, ['show-ref', '--verify', '--quiet', `refs/heads/${branch}`], true)).exitCode === 0
}

async function assertRecordOwnership(
  context: GitContext,
  record: WorkspaceRecord,
  workRef: string,
): Promise<WorktreeEntry> {
  if (record.workRef !== workRef)
    throw new Error(`workspace record WorkRef mismatch: expected ${workRef}, got ${record.workRef}`)
  if (record.branch !== branchName(workRef))
    throw new Error(`workspace record branch mismatch for ${workRef}: ${record.branch}`)
  if (await canonicalPath(record.commonDir) !== context.commonDir)
    throw new Error(`workspace record common Git directory does not belong to this repository: ${record.commonDir}`)
  if (await canonicalPath(record.repository) !== context.repository)
    throw new Error(`workspace record repository does not belong to this repository: ${record.repository}`)

  const worktrees = await listWorktrees(context.repository)
  const expectedPath = await canonicalPath(workspacePath(context.repository, workRef))
  const actualPath = await canonicalPath(record.path)
  const root = await canonicalPath(cacheRoot())
  if (!isWithin(root, actualPath) || actualPath !== expectedPath)
    throw new Error(`workspace record path does not match its owned cache path: ${record.path}`)

  const entry = worktrees.find(item => item.path === actualPath)
  if (!entry)
    throw new Error(`workspace record exists but its worktree is not registered: ${record.path}`)
  if (entry.branch !== record.branch)
    throw new Error(`workspace record branch does not match its registered worktree: ${record.branch}`)
  if (!(await branchExists(context.repository, record.branch)))
    throw new Error(`workspace record branch does not exist: ${record.branch}`)
  if (!(await branchExists(context.repository, record.targetBranch)))
    throw new Error(`workspace record target branch does not exist: ${record.targetBranch}`)
  return entry
}

async function withWorkspaceLock<T>(commonDir: string, operation: string, action: () => Promise<T>): Promise<T> {
  const lockPath = join(commonDir, 'rsp', 'workspace.lock')
  await mkdir(dirname(lockPath), { recursive: true })
  const token = randomUUID()
  const content = `${process.pid}\n${operation}\n${new Date().toISOString()}\n${token}\n`
  let acquired = false
  for (let attempt = 0; attempt < 10 && !acquired; attempt += 1) {
    try {
      await writeFile(lockPath, content, { flag: 'wx' })
      acquired = true
      break
    }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST')
        throw error
    }

    const before = await stat(lockPath).catch(() => null)
    if (!before)
      continue
    const existing = await readFile(lockPath, 'utf8').catch(() => '')
    const pid = Number(existing.split('\n')[0])
    if (Number.isSafeInteger(pid) && pid > 0) {
      try {
        process.kill(pid, 0)
        throw new Error(`workspace lifecycle is locked by pid ${pid}`)
      }
      catch (probe) {
        if (probe instanceof Error && probe.message.startsWith('workspace lifecycle is locked'))
          throw probe
        if ((probe as NodeJS.ErrnoException).code !== 'ESRCH')
          throw probe
      }
    }
    const after = await stat(lockPath).catch(() => null)
    if (!after || before.dev !== after.dev || before.ino !== after.ino)
      continue
    await unlink(lockPath).catch((error) => {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT')
        throw error
    })
  }
  if (!acquired)
    throw new Error('workspace lifecycle lock changed repeatedly; retry the operation')

  try {
    return await action()
  }
  finally {
    const current = await readFile(lockPath, 'utf8').catch(() => '')
    if (current === content)
      await unlink(lockPath).catch(() => undefined)
  }
}

async function copyOwnerState(source: string, destination: string, workRef: string): Promise<void> {
  const ref = resolveWorkRef(workRef, { executable: true, mustExist: true })
  const relativeChangePath = resolve(source, ref.path).slice(`${resolve(source)}/`.length)
  const paths = [relativeChangePath, join('.rsp', 'focus.d', ...workRef.split('/'))]
  if (ref.group)
    paths.push(join('.rsp', 'changes', ref.group, '00-brief.md'))

  for (const relativePath of paths) {
    const sourcePath = join(source, relativePath)
    if (!existsSync(sourcePath))
      continue
    const targetPath = join(destination, relativePath)
    await mkdir(dirname(targetPath), { recursive: true })
    await writeFile(targetPath, await readFile(sourcePath))
  }
}

function statusPath(line: string): string {
  const value = line.startsWith('?? ') || line.startsWith('!! ') || line[2] === ' '
    ? line.slice(3)
    : line[1] === ' '
      ? line.slice(2)
      : line
  const rename = value.lastIndexOf(' -> ')
  return rename >= 0 ? value.slice(rename + 4) : value
}

export async function prepareWorkspace(workRef: string, options: { targetBranch?: string, allowDirtySource?: boolean } = {}): Promise<{ resumed: boolean, record: WorkspaceRecord }> {
  const ref = resolveWorkRef(workRef, { executable: true, mustExist: true })
  const context = await discoverGitContext()
  return withWorkspaceLock(context.commonDir, `prepare ${workRef}`, async () => {
    const existing = await readRecord(context.commonDir, workRef)
    if (existing) {
      await assertRecordOwnership(context, existing, workRef)
      return { resumed: true, record: existing }
    }

    if (!options.allowDirtySource) {
      const allowed = new Set([
        ref.path,
        join('.rsp', 'focus.d', ...workRef.split('/')),
        ...(ref.group ? [join('.rsp', 'changes', ref.group, '00-brief.md')] : []),
      ])
      const dirtySourcePaths = (await git(context.sourceWorktree, ['status', '--short'])).stdout.split('\n').filter(Boolean).map(statusPath).filter(path => !allowed.has(path)).slice(0, 20)
      if (dirtySourcePaths.length > 0)
        throw new Error(`workspace source checkout has unreviewed dirty paths: ${dirtySourcePaths.join(', ')}`)
    }

    const currentBranch = (await git(context.sourceWorktree, ['branch', '--show-current'])).stdout
    const targetBranch = options.targetBranch || currentBranch
    if (!targetBranch)
      throw new Error('detached HEAD requires --target <branch>')
    if (!(await branchExists(context.repository, targetBranch)))
      throw new Error(`target branch does not exist: ${targetBranch}`)

    const branch = branchName(workRef)
    if (await branchExists(context.repository, branch))
      throw new Error(`branch already exists without an RSP workspace record: ${branch}`)

    const path = workspacePath(context.repository, workRef)
    if (existsSync(path))
      throw new Error(`workspace path already exists without an RSP workspace record: ${path}`)

    const baseCommit = (await git(context.repository, ['rev-parse', targetBranch])).stdout
    const root = await canonicalPath(cacheRoot())
    const ownedPath = await canonicalPath(path)
    if (!isWithin(root, ownedPath))
      throw new Error(`workspace path escapes the RSP cache root: ${path}`)
    await mkdir(dirname(path), { recursive: true })
    let added = false
    try {
      await git(context.repository, ['worktree', 'add', '-b', branch, path, targetBranch])
      added = true
      await copyOwnerState(context.sourceWorktree, path, workRef)
      const now = new Date().toISOString()
      const record: WorkspaceRecord = {
        schema: RECORD_SCHEMA,
        workRef,
        repository: context.repository,
        commonDir: context.commonDir,
        sourceWorktree: context.sourceWorktree,
        targetBranch,
        baseCommit,
        branch,
        path,
        createdAt: now,
        updatedAt: now,
      }
      await writeRecord(record)
      return { resumed: false, record }
    }
    catch (error) {
      if (added) {
        const canonicalWorkspacePath = await canonicalPath(path)
        const entry = (await listWorktrees(context.repository)).find(item =>
          item.path === canonicalWorkspacePath && item.branch === branch,
        )
        if (entry) {
          await git(context.repository, ['worktree', 'remove', '--force', path])
          if (await branchExists(context.repository, branch))
            await git(context.repository, ['branch', '-D', branch])
        }
      }
      throw error
    }
  })
}

export async function observeWorkspace(workRef: string): Promise<WorkspaceObservation> {
  const context = await discoverGitContext()
  const record = await readRecord(context.commonDir, workRef)
  if (!record)
    throw new Error(`workspace not found for ${workRef}`)
  return observeWorkspaceRecord(context, record, workRef)
}

async function observeWorkspaceRecord(context: GitContext, record: WorkspaceRecord, workRef: string): Promise<WorkspaceObservation> {
  await assertRecordOwnership(context, record, workRef)
  const exists = await branchExists(context.repository, record.branch)
  const dirty = (await git(record.path, ['status', '--short'])).stdout.split('\n').filter(Boolean)
  const aheadRaw = exists
    ? (await git(context.repository, ['rev-list', '--count', `${record.targetBranch}..${record.branch}`], true)).stdout
    : '0'
  const aheadOfTarget = Number(aheadRaw || 0)
  const cherry = exists && aheadOfTarget > 0
    ? (await git(context.repository, ['cherry', record.targetBranch, record.branch], true)).stdout
    : ''
  const unlandedCommits = cherry.split('\n').filter(line => line.startsWith('+ ')).length
  const activityStates = await Promise.all(Object.values(record.activities ?? {}).map(activityIsActive))
  const activeActivityCount = activityStates.filter(Boolean).length
  const deliveryState: WorkspaceObservation['deliveryState'] = aheadOfTarget === 0
    ? 'landed'
    : unlandedCommits === 0
      ? 'landed-equivalent'
      : 'unlanded'
  return {
    record,
    registered: true,
    branchExists: exists,
    dirty,
    aheadOfTarget,
    activeActivityCount,
    deliveryState,
    cleanupReady: dirty.length === 0 && deliveryState !== 'unlanded',
  }
}

async function activityIsActive(activity: WorkspaceActivity): Promise<boolean> {
  if (!processExists(activity.pid))
    return false
  if (!activity.processIdentity)
    return false
  return await processIdentityFor(activity.pid) === activity.processIdentity
}

export async function inspectActiveWorkspaces(): Promise<ActiveWorkspaceInspection> {
  const context = await inspectGitContext()
  if (!context)
    return { workspaces: [], issues: [], truncated: false }

  const directory = join(context.commonDir, 'rsp', 'workspaces')
  let recordEntries: Dirent[]
  try {
    recordEntries = (await readdir(directory, { withFileTypes: true }))
      .filter(entry => entry.name.endsWith('.json'))
      .sort((left, right) => left.name.localeCompare(right.name))
  }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT')
      return { workspaces: [], issues: [], truncated: false }
    return {
      workspaces: [],
      issues: [{ record: 'workspace registry', message: error instanceof Error ? error.message : String(error) }],
      truncated: false,
    }
  }

  const workspaces: ActiveWorkspaceObservation[] = []
  const issues: ActiveWorkspaceInspection['issues'] = []
  let issuesTruncated = false
  for (const entry of recordEntries.slice(0, MAX_ACTIVE_WORKSPACES)) {
    const name = entry.name
    try {
      if (!entry.isFile())
        throw new Error('workspace registry entry is not a regular file')
      const parsed = JSON.parse(await readFile(join(directory, name), 'utf8')) as Partial<WorkspaceRecord>
      if (parsed.schema !== RECORD_SCHEMA || typeof parsed.workRef !== 'string' || name !== `${recordKey(parsed.workRef)}.json`)
        throw new Error('record schema, WorkRef, or registry key is invalid')
      const record = await readRecord(context.commonDir, parsed.workRef)
      if (!record)
        throw new Error('record disappeared during inspection')
      const observation = await observeWorkspaceRecord(context, record, parsed.workRef)
      workspaces.push({
        workRef: record.workRef,
        branch: record.branch,
        targetBranch: record.targetBranch,
        dirty: observation.dirty.length > 0,
        commitsAhead: observation.aheadOfTarget,
        activeActivityCount: observation.activeActivityCount,
        deliveryState: observation.deliveryState,
        cleanupReady: observation.cleanupReady,
      })
    }
    catch (error) {
      if (issues.length < MAX_WORKSPACE_RECORD_ISSUES)
        issues.push({ record: name, message: error instanceof Error ? error.message : String(error) })
      else
        issuesTruncated = true
    }
  }

  return {
    workspaces: workspaces.sort((left, right) => left.workRef.localeCompare(right.workRef)),
    issues,
    truncated: recordEntries.length > MAX_ACTIVE_WORKSPACES || issuesTruncated,
  }
}

export async function updateWorkspaceRecord(workRef: string, update: (record: WorkspaceRecord) => WorkspaceRecord): Promise<WorkspaceRecord> {
  const context = await discoverGitContext()
  return withWorkspaceLock(context.commonDir, `update ${workRef}`, async () => {
    const record = await readRecord(context.commonDir, workRef)
    if (!record)
      throw new Error(`workspace not found for ${workRef}`)
    await assertRecordOwnership(context, record, workRef)
    const next = update({ ...record })
    for (const key of ['schema', 'workRef', 'repository', 'commonDir', 'sourceWorktree', 'targetBranch', 'baseCommit', 'branch', 'path'] as const) {
      if (next[key] !== record[key])
        throw new Error(`workspace record identity field cannot be changed: ${key}`)
    }
    next.updatedAt = new Date().toISOString()
    await writeRecord(next)
    return next
  })
}

async function processGroupFor(pid: number): Promise<number | null> {
  if (process.platform === 'win32')
    return null
  const result = await run('ps', ['-o', 'pgid=', '-p', String(pid)], { cwd: process.cwd(), allowFailure: true })
  if (result.exitCode !== 0)
    return null
  const value = Number(result.stdout.trim())
  return Number.isSafeInteger(value) && value > 0 ? value : null
}

function validateActivityId(id: string): string {
  const value = id.trim()
  if (!/^[A-Z\d][\w.-]{0,63}$/i.test(value))
    throw new Error('activity id must match [A-Za-z0-9][A-Za-z0-9._-]{0,63}')
  return value
}

export async function registerWorkspaceActivity(
  workRef: string,
  options: { id: string, label?: string, pid: number, processGroupId?: number, resources?: string[] },
): Promise<WorkspaceActivity> {
  const id = validateActivityId(options.id)
  if (!Number.isSafeInteger(options.pid) || options.pid <= 0)
    throw new Error(`invalid activity pid: ${options.pid}`)
  if (!processExists(options.pid))
    throw new Error(`activity process is not running: ${options.pid}`)
  const initialProcessIdentity = await processIdentityFor(options.pid)
  if (!initialProcessIdentity)
    throw new Error(`activity process identity could not be observed: ${options.pid}`)
  if (options.processGroupId !== undefined) {
    if (!Number.isSafeInteger(options.processGroupId) || options.processGroupId <= 0)
      throw new Error(`invalid activity process group id: ${options.processGroupId}`)
    const observed = await processGroupFor(options.pid)
    if (observed !== options.processGroupId)
      throw new Error(`activity process group mismatch: expected ${options.processGroupId}, observed ${observed ?? 'none'}`)
    const currentGroup = await processGroupFor(process.pid)
    if (observed === currentGroup)
      throw new Error('activity process group must be independent from the registering CLI process')
  }

  const record = await getWorkspaceRecord(workRef)
  const existing = record.activities?.[id]
  if (existing) {
    if (existing.pid === options.pid && processExists(existing.pid)) {
      const observedIdentity = await processIdentityFor(existing.pid)
      if (!existing.processIdentity || observedIdentity !== existing.processIdentity)
        throw new Error(`activity id is already registered with a different process identity: ${id}`)
      const requestedResources = [...new Set((options.resources ?? []).map(value => value.trim()).filter(Boolean))]
      const sameResources = requestedResources.length === existing.resources.length
        && requestedResources.every(resource => existing.resources.includes(resource))
      const sameIdentity = existing.processGroupId === options.processGroupId
        && (options.label === undefined || existing.label === options.label.trim())
        && sameResources
      if (sameIdentity)
        return existing
      throw new Error(`activity id is already registered with different metadata: ${id}`)
    }
    throw new Error(`activity id is already registered: ${id}`)
  }
  const resources = [...new Set((options.resources ?? []).map(value => value.trim()).filter(Boolean))]
  const label = options.label?.trim() || id
  if (label.length > 200 || /[\r\n]/.test(label))
    throw new Error('activity label must be one line of at most 200 characters')
  const processIdentity = await processIdentityFor(options.pid)
  if (!processIdentity || processIdentity !== initialProcessIdentity)
    throw new Error(`activity process identity changed during registration: ${options.pid}`)
  const leases = await acquireResourceLeases(record, resources, options.pid, processIdentity)
  const activity: WorkspaceActivity = {
    id,
    label,
    pid: options.pid,
    processIdentity,
    ...(options.processGroupId === undefined ? {} : { processGroupId: options.processGroupId }),
    resources,
    leases,
    registeredAt: new Date().toISOString(),
  }
  try {
    await updateWorkspaceRecord(workRef, (current) => {
      if (current.activities?.[id])
        throw new Error(`activity id is already registered: ${id}`)
      return {
        ...current,
        activities: { ...current.activities, [id]: activity },
      }
    })
    return activity
  }
  catch (error) {
    await releaseResourceLeases(leases)
    throw error
  }
}

export async function stopWorkspaceActivity(workRef: string, activityId: string): Promise<WorkspaceActivity> {
  const id = validateActivityId(activityId)
  const record = await getWorkspaceRecord(workRef)
  const activity = record.activities?.[id]
  if (!activity)
    throw new Error(`workspace activity not found: ${id}`)
  await stopActivityProcess(activity.pid, activity.processGroupId, activity.processIdentity)
  await releaseResourceLeases(activity.leases)
  await updateWorkspaceRecord(workRef, (current) => {
    const activities = { ...current.activities }
    delete activities[id]
    return {
      ...current,
      ...(Object.keys(activities).length === 0 ? { activities: undefined } : { activities }),
    }
  })
  return activity
}

export async function disposeWorkspace(workRef: string, options: { discard?: boolean, landed?: boolean } = {}): Promise<WorkspaceRecord> {
  const context = await discoverGitContext()
  return withWorkspaceLock(context.commonDir, `dispose ${workRef}`, async () => {
    const observation = await observeWorkspace(workRef)
    const { record } = observation
    if (!options.discard && observation.dirty.length > 0)
      throw new Error(`workspace has uncommitted changes: ${observation.dirty.join(', ')}`)
    if (!options.discard && !options.landed && observation.deliveryState === 'unlanded')
      throw new Error(`workspace has ${observation.aheadOfTarget} commit(s) not present on ${record.targetBranch}`)
    for (const activity of Object.values(record.activities ?? {})) {
      await stopActivityProcess(activity.pid, activity.processGroupId, activity.processIdentity)
      await releaseResourceLeases(activity.leases)
    }

    const args = ['worktree', 'remove']
    if (options.discard)
      args.push('--force')
    args.push(record.path)
    await git(context.repository, args)
    if (observation.branchExists)
      await git(context.repository, ['branch', options.discard || options.landed || observation.deliveryState === 'landed-equivalent' ? '-D' : '-d', record.branch])
    await unlink(recordPath(record.commonDir, workRef))
    return record
  })
}

export async function getWorkspaceRecord(workRef: string): Promise<WorkspaceRecord> {
  const context = await discoverGitContext()
  const record = await readRecord(context.commonDir, workRef)
  if (!record)
    throw new Error(`workspace not found for ${workRef}`)
  await assertRecordOwnership(context, record, workRef)
  return record
}

export async function pruneWorkspace(workRef: string, options: { apply?: boolean } = {}): Promise<WorkspacePruneResult> {
  resolveWorkRef(workRef, { executable: true })
  const context = await discoverGitContext()
  return withWorkspaceLock(context.commonDir, `prune ${workRef}`, async () => {
    const path = recordPath(context.commonDir, workRef)
    const entry = await lstat(path).catch(() => null)
    if (!entry)
      throw new Error(`workspace not found for ${workRef}`)
    if (!entry.isFile() || entry.isSymbolicLink())
      throw new Error(`workspace prune record is not a regular file: ${workRef}`)

    const expectedBranch = branchName(workRef)
    const expectedPath = await canonicalPath(workspacePath(context.repository, workRef))
    const worktrees = await listWorktrees(context.repository)
    const branchExistsNow = await branchExists(context.repository, expectedBranch)
    const worktreeExists = worktrees.some(item => item.branch === expectedBranch || item.path === expectedPath)
    const cachePathExists = existsSync(expectedPath)
    let record: WorkspaceRecord | null = null
    try {
      const candidate = JSON.parse(await readFile(path, 'utf8')) as WorkspaceRecord
      if (candidate.schema === RECORD_SCHEMA && candidate.workRef === workRef && candidate.branch === expectedBranch)
        record = candidate
    }
    catch {}
    const activityStates = record
      ? await Promise.all(Object.values(record.activities ?? {}).map(activityIsActive))
      : []
    const liveActivityCount = activityStates.filter(Boolean).length
    const fullyPresent = Boolean(record && branchExistsNow && worktreeExists && cachePathExists)
    const fullyAbsent = !branchExistsNow && !worktreeExists && !cachePathExists && liveActivityCount === 0
    const disposition: WorkspacePruneResult['disposition'] = fullyPresent
      ? 'healthy'
      : fullyAbsent
        ? record ? 'prune-ready' : 'quarantine-ready'
        : 'blocked'
    let quarantinePath: string | undefined

    if (options.apply && disposition === 'prune-ready' && record) {
      for (const activity of Object.values(record.activities ?? {}))
        await releaseResourceLeases(activity.leases)
      await unlink(path)
    }
    else if (options.apply && disposition === 'quarantine-ready') {
      const directory = join(context.commonDir, 'rsp', 'workspaces-quarantine')
      await mkdir(directory, { recursive: true })
      quarantinePath = join(directory, `${recordKey(workRef)}.${Date.now()}.json`)
      await rename(path, quarantinePath)
    }
    else if (options.apply && (disposition === 'blocked' || disposition === 'healthy')) {
      throw new Error(`workspace prune is not applicable to a healthy or ambiguous workspace: ${workRef}`)
    }

    return {
      workRef,
      disposition,
      applied: Boolean(options.apply && disposition !== 'blocked'),
      recordValid: Boolean(record),
      branchExists: branchExistsNow,
      worktreeExists,
      cachePathExists,
      liveActivityCount,
      ...(quarantinePath ? { quarantinePath } : {}),
    }
  })
}

export async function findTargetWorktree(record: WorkspaceRecord, targetBranch: string): Promise<string> {
  const entry = (await listWorktrees(record.repository)).find(item => item.branch === targetBranch)
  if (!entry)
    throw new Error(`target branch is not checked out in a worktree: ${targetBranch}`)
  return entry.path
}

export async function runGit(cwd: string, args: string[], allowFailure = false) {
  return git(cwd, args, allowFailure)
}

export async function stopActivityProcess(pid: number, processGroupId?: number, processIdentity?: string): Promise<void> {
  if (!Number.isInteger(pid) || pid <= 0)
    return

  const processGroupExists = async (): Promise<boolean> => {
    if (process.platform === 'win32' || !processGroupId)
      return false
    const result = await run('ps', ['-axo', 'pgid='], { cwd: process.cwd(), allowFailure: true })
    return result.exitCode === 0
      && result.stdout.split('\n').some(line => Number(line.trim()) === processGroupId)
  }

  const targetExists = async (): Promise<boolean> => processExists(pid) || await processGroupExists()

  const assertProcessIdentity = async (): Promise<void> => {
    if (!(await targetExists()))
      return
    if (!processIdentity)
      throw new Error(`activity process identity is missing for pid ${pid}; refusing to signal it`)
    const observed = await processIdentityFor(pid)
    if (!observed)
      throw new Error(`activity process identity cannot be verified for pid ${pid}; refusing to signal its process group`)
    if (observed !== processIdentity)
      throw new Error(`activity process identity changed for pid ${pid}; refusing to signal an unrelated process`)
  }

  const signal = async (value: NodeJS.Signals): Promise<boolean> => {
    if (!(await targetExists()))
      return false
    await assertProcessIdentity()
    if (await processGroupExists()) {
      try {
        process.kill(-processGroupId!, value)
        return true
      }
      catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ESRCH')
          throw error
      }
    }
    try {
      process.kill(pid, value)
      return true
    }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ESRCH')
        return false
      throw error
    }
  }

  if (!(await targetExists()))
    return
  if (!(await signal('SIGTERM')))
    return
  const deadline = Date.now() + 3_000
  while (Date.now() < deadline) {
    if (!(await processGroupExists()) && !processExists(pid))
      return
    await new Promise(resolve => setTimeout(resolve, 50))
  }
  await signal('SIGKILL')
}

/** @deprecated use stopActivityProcess */
export const stopPreview = stopActivityProcess

export async function assertRegularDirectory(path: string): Promise<void> {
  const value = await stat(path)
  if (!value.isDirectory())
    throw new Error(`workspace path is not a directory: ${path}`)
}
