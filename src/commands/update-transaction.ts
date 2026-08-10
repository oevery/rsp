import type { Buffer } from 'node:buffer'
import type { BigIntStats } from 'node:fs'
import type { FileHandle } from 'node:fs/promises'
import type { StableDirectoryChain } from '../core/path-identity.js'
import { createHash, randomUUID } from 'node:crypto'
import { constants } from 'node:fs'
import {
  chmod,
  link,
  lstat,
  mkdir,
  mkdtemp,
  open,
  rename,
  rmdir,
  unlink,
} from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve, sep } from 'node:path'
import {
  assertStableDirectoryChain,
  captureStableDirectoryChain,
} from '../core/path-identity.js'

const READ_NO_FOLLOW_FLAGS = constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0)
const WRITE_EXCLUSIVE_NO_FOLLOW_FLAGS = constants.O_WRONLY
  | constants.O_CREAT
  | constants.O_EXCL
  | (constants.O_NOFOLLOW ?? 0)

type PathSnapshot
  = | { kind: 'missing' }
    | {
      kind: 'file'
      content: Buffer
      device: bigint
      inode: bigint
      mode: bigint
      size: bigint
      mtimeNs: bigint
      ctimeNs: bigint
      contentHash: string
    }
    | {
      kind: 'directory'
      device: bigint
      inode: bigint
      mode: bigint
    }

interface JournalEntry {
  path: string
  original: PathSnapshot
  published: PathSnapshot | null
  parentChain: StableDirectoryChain
}

export interface UpdateRollbackTestingHooks {
  /** Internal deterministic race hook; invoked after the outer published-state validation. */
  afterPublishedValidation?: (path: string) => Promise<void>
  /** Internal deterministic race hook; invoked after an exclusive restore destination opens. */
  afterRestoreDestinationOpen?: (path: string) => Promise<void>
}

export interface UpdateRollbackResult {
  restored: string[]
  retainedMutations: string[]
  recoveryPaths: string[]
}

class UpdateRollbackMutationError extends Error {
  constructor(
    message: string,
    public readonly recoveryPaths: string[] = [],
  ) {
    super(message)
    this.name = 'UpdateRollbackMutationError'
  }
}

/**
 * Command-scoped in-memory rollback journal. It records only exact paths the
 * update command owns and refuses to overwrite a concurrently changed target.
 */
export class UpdateRollbackJournal {
  private readonly entries = new Map<string, JournalEntry>()
  private readonly mutationOrder: string[] = []

  constructor(
    private readonly projectRoot = resolve('.'),
    private readonly testing: UpdateRollbackTestingHooks = {},
  ) {}

  async capture(path: string): Promise<void> {
    const absolutePath = this.resolveProjectPath(path)
    if (this.entries.has(absolutePath))
      return
    this.entries.set(absolutePath, {
      path: absolutePath,
      original: await inspectPathSnapshot(absolutePath),
      published: null,
      parentChain: await captureExistingParentChain(
        this.projectRoot,
        absolutePath,
      ),
    })
  }

  async captureDirectoryChain(path: string): Promise<string[]> {
    const absolutePath = this.resolveProjectPath(path)
    const rel = relative(this.projectRoot, absolutePath)
    const captured: string[] = []
    let current = this.projectRoot
    for (const segment of rel === '' ? [] : rel.split(sep)) {
      current = resolve(current, segment)
      await this.capture(current)
      captured.push(current)
    }
    return captured
  }

  async mark(path: string): Promise<void> {
    const absolutePath = this.resolveProjectPath(path)
    const entry = this.entries.get(absolutePath)
    if (!entry)
      throw new Error(`Update rollback journal did not capture ${absolutePath}`)
    entry.published = await inspectPathSnapshot(absolutePath)
    if (!samePathState(entry.original, entry.published)
      && !this.mutationOrder.includes(absolutePath)) {
      this.mutationOrder.push(absolutePath)
    }
  }

  async markAll(paths: string[]): Promise<void> {
    for (const path of paths)
      await this.mark(path)
  }

  async rollback(): Promise<UpdateRollbackResult> {
    const restored: string[] = []
    const retainedMutations: string[] = []
    const recoveryPaths: string[] = []
    for (const [path, entry] of this.entries) {
      if (entry.published)
        continue
      const current = await inspectPathSnapshot(path).catch(() => null)
      if (current && !samePathState(entry.original, current)) {
        entry.published = current
        if (!this.mutationOrder.includes(path))
          this.mutationOrder.push(path)
      }
    }
    const ordered = [...this.mutationOrder]
      .sort((left, right) => compareRollbackOrder(
        this.entries.get(left)!,
        this.entries.get(right)!,
      ))

    for (const path of ordered) {
      const entry = this.entries.get(path)!
      const published = entry.published
      if (!published)
        continue
      let current: PathSnapshot
      try {
        current = await inspectPathSnapshot(path)
      }
      catch {
        await recordIncompleteRollback(
          this.projectRoot,
          entry,
          retainedMutations,
          recoveryPaths,
        )
        continue
      }
      if (!samePathState(current, published)) {
        await recordIncompleteRollback(
          this.projectRoot,
          entry,
          retainedMutations,
          recoveryPaths,
        )
        continue
      }
      try {
        recoveryPaths.push(...await restorePath(entry, this.testing))
        restored.push(toProjectPath(this.projectRoot, path))
        if (entry.original.kind === 'directory'
          && published.kind === 'missing') {
          await this.refreshDescendantParentChains(path)
        }
      }
      catch (error) {
        if (error instanceof UpdateRollbackMutationError)
          recoveryPaths.push(...error.recoveryPaths)
        await recordIncompleteRollback(
          this.projectRoot,
          entry,
          retainedMutations,
          recoveryPaths,
        )
      }
    }

    return {
      restored,
      retainedMutations: [...new Set(retainedMutations)].sort(),
      recoveryPaths: [...new Set(recoveryPaths)].sort(),
    }
  }

  private resolveProjectPath(path: string): string {
    const absolutePath = resolve(path)
    const rel = relative(this.projectRoot, absolutePath)
    if (rel === '..' || rel.startsWith(`..${sep}`))
      throw new Error(`Update transaction path escapes the project root: ${path}`)
    return absolutePath
  }

  private async refreshDescendantParentChains(restoredDirectory: string): Promise<void> {
    for (const entry of this.entries.values()) {
      const rel = relative(restoredDirectory, entry.path)
      if (rel === '' || rel === '..' || rel.startsWith(`..${sep}`))
        continue
      entry.parentChain = await captureExistingParentChain(
        this.projectRoot,
        entry.path,
      )
    }
  }
}

async function recordIncompleteRollback(
  projectRoot: string,
  entry: JournalEntry,
  retainedMutations: string[],
  recoveryPaths: string[],
): Promise<void> {
  retainedMutations.push(toProjectPath(projectRoot, entry.path))
  const recovery = await persistOriginalRecovery(entry.original).catch(() => null)
  if (recovery)
    recoveryPaths.push(recovery)
}

async function inspectPathSnapshot(path: string): Promise<PathSnapshot> {
  let before: BigIntStats
  try {
    before = await lstat(path, { bigint: true })
  }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT')
      return { kind: 'missing' }
    throw error
  }
  if (before.isSymbolicLink())
    throw new Error(`Update transaction refuses a symlinked path: ${path}`)
  if (before.isDirectory()) {
    return {
      kind: 'directory',
      device: before.dev,
      inode: before.ino,
      mode: before.mode,
    }
  }
  if (!before.isFile())
    throw new Error(`Update transaction requires a regular file or directory: ${path}`)

  const handle = await open(path, READ_NO_FOLLOW_FLAGS)
  try {
    const opened = await handle.stat({ bigint: true })
    if (!sameFileIdentity(before, opened))
      throw new Error(`Update transaction path changed while it was captured: ${path}`)
    const content = await handle.readFile()
    const after = await handle.stat({ bigint: true })
    const finalPath = await lstat(path, { bigint: true })
    if (!sameFileIdentity(opened, after)
      || !sameFileIdentity(after, finalPath)
      || BigInt(content.length) !== after.size) {
      throw new Error(`Update transaction path changed while it was captured: ${path}`)
    }
    return {
      kind: 'file',
      content,
      device: after.dev,
      inode: after.ino,
      mode: after.mode,
      size: after.size,
      mtimeNs: after.mtimeNs,
      ctimeNs: after.ctimeNs,
      contentHash: createHash('sha256').update(content).digest('hex'),
    }
  }
  finally {
    await handle.close()
  }
}

async function restorePath(
  entry: JournalEntry,
  testing: UpdateRollbackTestingHooks,
): Promise<string[]> {
  const { path, original, published, parentChain } = entry
  if (!published)
    return []

  if (original.kind === 'missing') {
    if (published.kind === 'file') {
      const quarantine = await quarantineExpectedFile(entry, published, testing)
      await unlinkVerifiedQuarantine(quarantine, published, parentChain)
      return []
    }
    if (published.kind === 'directory') {
      const quarantine = await quarantineExpectedDirectory(entry, published, testing)
      await assertStableDirectoryChain(parentChain, 'update rollback directory removal')
      await rmdir(quarantine)
      await assertStableDirectoryChain(parentChain, 'update rollback directory removal')
      return []
    }
    return []
  }

  if (original.kind === 'directory') {
    if (published.kind === 'missing') {
      await assertStableDirectoryChain(parentChain, 'update rollback directory restore')
      await mkdir(path, { mode: Number(permissionMode(original.mode)) })
      if (process.platform !== 'win32')
        await chmod(path, Number(permissionMode(original.mode)))
      return []
    }
    if (published.kind !== 'directory')
      throw new Error(`Update rollback path type changed: ${path}`)
    const current = await inspectPathSnapshot(path)
    if (!samePathState(current, published))
      throw new UpdateRollbackMutationError(`Update rollback directory changed: ${path}`)
    if (process.platform !== 'win32'
      && permissionMode(published.mode) !== permissionMode(original.mode)) {
      await assertStableDirectoryChain(parentChain, 'update rollback directory mode restore')
      await chmod(path, Number(permissionMode(original.mode)))
    }
    return []
  }

  if (published.kind === 'missing') {
    await writeSnapshotExclusive(path, original, parentChain, testing)
    return []
  }
  if (published.kind !== 'file')
    throw new Error(`Update rollback path type changed: ${path}`)

  const quarantine = await quarantineExpectedFile(entry, published, testing)
  try {
    await writeSnapshotExclusive(path, original, parentChain, testing)
  }
  catch (error) {
    const recovery = await restoreQuarantinedFile(
      quarantine,
      path,
      published,
      parentChain,
    )
    if (recovery.length > 0) {
      throw new UpdateRollbackMutationError(
        `Update rollback preserved the current file after restore failure: ${path}`,
        recovery,
      )
    }
    throw error
  }
  await unlinkVerifiedQuarantine(quarantine, published, parentChain)
  return []
}

async function quarantineExpectedFile(
  entry: JournalEntry,
  expected: Extract<PathSnapshot, { kind: 'file' }>,
  testing: UpdateRollbackTestingHooks,
): Promise<string> {
  await testing.afterPublishedValidation?.(entry.path)
  await assertStableDirectoryChain(entry.parentChain, 'update rollback file quarantine')
  const quarantine = `${entry.path}.${process.pid}.${randomUUID()}.rsp-update-current`
  await rename(entry.path, quarantine)
  await assertStableDirectoryChain(entry.parentChain, 'update rollback file quarantine')
  const quarantined = await inspectPathSnapshot(quarantine)
  if (!sameClaimedPathState(quarantined, expected)) {
    const recovery = await restoreQuarantinedPath(
      quarantine,
      entry.path,
      quarantined,
      entry.parentChain,
    )
    throw new UpdateRollbackMutationError(
      `Update rollback refused a concurrently replaced file: ${entry.path}`,
      recovery,
    )
  }
  return quarantine
}

async function quarantineExpectedDirectory(
  entry: JournalEntry,
  expected: Extract<PathSnapshot, { kind: 'directory' }>,
  testing: UpdateRollbackTestingHooks,
): Promise<string> {
  await testing.afterPublishedValidation?.(entry.path)
  await assertStableDirectoryChain(entry.parentChain, 'update rollback directory quarantine')
  const quarantine = `${entry.path}.${process.pid}.${randomUUID()}.rsp-update-current`
  await rename(entry.path, quarantine)
  await assertStableDirectoryChain(entry.parentChain, 'update rollback directory quarantine')
  const quarantined = await inspectPathSnapshot(quarantine)
  if (!sameClaimedPathState(quarantined, expected)) {
    const recovery = await restoreQuarantinedPath(
      quarantine,
      entry.path,
      quarantined,
      entry.parentChain,
    )
    throw new UpdateRollbackMutationError(
      `Update rollback refused a concurrently replaced directory: ${entry.path}`,
      recovery,
    )
  }
  return quarantine
}

async function restoreQuarantinedPath(
  quarantine: string,
  destination: string,
  snapshot: PathSnapshot,
  parentChain: StableDirectoryChain,
): Promise<string[]> {
  if (snapshot.kind === 'file')
    return restoreQuarantinedFile(quarantine, destination, snapshot, parentChain)
  return [quarantine]
}

async function restoreQuarantinedFile(
  quarantine: string,
  destination: string,
  snapshot: Extract<PathSnapshot, { kind: 'file' }>,
  parentChain: StableDirectoryChain,
): Promise<string[]> {
  await assertStableDirectoryChain(parentChain, 'update rollback concurrent-file restore')
  try {
    await link(quarantine, destination)
    const restored = await inspectPathSnapshot(destination)
    const retained = await inspectPathSnapshot(quarantine)
    if (!sameClaimedPathState(restored, snapshot)
      || !sameClaimedPathState(retained, snapshot)) {
      return [quarantine]
    }
    await unlinkVerifiedQuarantine(quarantine, snapshot, parentChain)
    return []
  }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST')
      return [quarantine]
    if (!hardLinkUnsupported(error))
      throw error
  }

  try {
    await writeSnapshotExclusive(destination, snapshot, parentChain, {})
  }
  catch {
    return [quarantine]
  }
  return [quarantine]
}

async function unlinkVerifiedQuarantine(
  quarantine: string,
  expected: Extract<PathSnapshot, { kind: 'file' }>,
  parentChain: StableDirectoryChain,
): Promise<void> {
  await assertStableDirectoryChain(parentChain, 'update rollback quarantine cleanup')
  const current = await inspectPathSnapshot(quarantine)
  if (!sameClaimedPathState(current, expected)) {
    throw new UpdateRollbackMutationError(
      `Update rollback cleanup retained a changed quarantine: ${quarantine}`,
      [quarantine],
    )
  }
  await unlink(quarantine)
  await assertStableDirectoryChain(parentChain, 'update rollback quarantine cleanup')
}

async function writeSnapshotExclusive(
  path: string,
  snapshot: Extract<PathSnapshot, { kind: 'file' }>,
  parentChain: StableDirectoryChain,
  testing: UpdateRollbackTestingHooks,
): Promise<void> {
  let handle: FileHandle | null = null
  let createdIdentity: { device: bigint, inode: bigint } | null = null
  try {
    await assertStableDirectoryChain(parentChain, 'update rollback exclusive restore')
    handle = await open(
      path,
      WRITE_EXCLUSIVE_NO_FOLLOW_FLAGS,
      Number(permissionMode(snapshot.mode)),
    )
    const opened = await handle.stat({ bigint: true })
    if (!opened.isFile() || opened.isSymbolicLink())
      throw new Error(`Update rollback could not open a regular restore file: ${path}`)
    createdIdentity = { device: opened.dev, inode: opened.ino }
    await testing.afterRestoreDestinationOpen?.(path)
    await handle.writeFile(snapshot.content)
    await handle.chmod(Number(permissionMode(snapshot.mode)))
    await handle.sync()
    const value = await handle.stat({ bigint: true })
    if (!value.isFile()
      || value.isSymbolicLink()
      || value.dev !== createdIdentity.device
      || value.ino !== createdIdentity.inode
      || value.size !== snapshot.size
      || permissionMode(value.mode) !== permissionMode(snapshot.mode)) {
      throw new Error(`Update rollback could not validate restored file: ${path}`)
    }
  }
  catch (error) {
    await handle?.close().catch(() => undefined)
    handle = null
    if (createdIdentity) {
      const recovery = await cleanupCreatedFile(
        path,
        createdIdentity,
        parentChain,
      )
      if (recovery.length > 0) {
        throw new UpdateRollbackMutationError(
          `Update rollback exclusive restore preserved a concurrent replacement: ${path}`,
          recovery,
        )
      }
    }
    throw error
  }
  finally {
    await handle?.close()
  }
  await assertStableDirectoryChain(parentChain, 'update rollback exclusive restore')
  const restored = await inspectPathSnapshot(path)
  if (restored.kind !== 'file'
    || restored.contentHash !== snapshot.contentHash
    || permissionMode(restored.mode) !== permissionMode(snapshot.mode)) {
    throw new Error(`Update rollback restored different bytes or mode: ${path}`)
  }
}

async function cleanupCreatedFile(
  path: string,
  expected: { device: bigint, inode: bigint },
  parentChain: StableDirectoryChain,
): Promise<string[]> {
  const quarantine = `${path}.${process.pid}.${randomUUID()}.rsp-update-created`
  await assertStableDirectoryChain(parentChain, 'update rollback exclusive cleanup')
  try {
    await rename(path, quarantine)
  }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT')
      return []
    throw error
  }
  await assertStableDirectoryChain(parentChain, 'update rollback exclusive cleanup')
  const current = await lstat(quarantine, { bigint: true })
  if (current.isFile()
    && !current.isSymbolicLink()
    && current.dev === expected.device
    && current.ino === expected.inode) {
    const finalIdentity = await lstat(quarantine, { bigint: true })
    if (!finalIdentity.isFile()
      || finalIdentity.isSymbolicLink()
      || finalIdentity.dev !== expected.device
      || finalIdentity.ino !== expected.inode) {
      return [quarantine]
    }
    await unlink(quarantine)
    return []
  }
  const snapshot = await inspectPathSnapshot(quarantine)
  return restoreQuarantinedPath(quarantine, path, snapshot, parentChain)
}

async function persistOriginalRecovery(
  original: PathSnapshot,
): Promise<string | null> {
  if (original.kind !== 'file')
    return null
  const recoveryRoot = await mkdtemp(join(tmpdir(), 'rsp-update-recovery-'))
  if (process.platform !== 'win32')
    await chmod(recoveryRoot, 0o700)
  const recovery = join(recoveryRoot, 'snapshot')
  const parentChain = await captureStableDirectoryChain({
    rootPath: recoveryRoot,
    targetPath: recoveryRoot,
    label: 'update rollback recovery root',
  })
  await writeSnapshotExclusive(recovery, original, parentChain, {})
  return recovery
}

async function captureExistingParentChain(
  projectRoot: string,
  path: string,
): Promise<StableDirectoryChain> {
  let parent = dirname(path)
  while (true) {
    const rel = relative(projectRoot, parent)
    if (rel === '..' || rel.startsWith(`..${sep}`))
      throw new Error(`Update transaction parent escapes the project root: ${path}`)
    try {
      const value = await lstat(parent)
      if (!value.isDirectory() || value.isSymbolicLink())
        throw new Error(`Update transaction parent must be a real directory: ${parent}`)
      break
    }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT')
        throw error
      if (parent === projectRoot)
        throw error
      parent = dirname(parent)
    }
  }
  return captureStableDirectoryChain({
    rootPath: projectRoot,
    targetPath: parent,
    label: `update transaction ${path}`,
  })
}

function samePathState(left: PathSnapshot, right: PathSnapshot): boolean {
  if (left.kind !== right.kind)
    return false
  if (left.kind === 'missing')
    return true
  if (left.kind === 'directory' && right.kind === 'directory') {
    return left.device === right.device
      && left.inode === right.inode
      && permissionMode(left.mode) === permissionMode(right.mode)
  }
  if (left.kind === 'file' && right.kind === 'file') {
    return left.device === right.device
      && left.inode === right.inode
      && left.size === right.size
      && left.mtimeNs === right.mtimeNs
      && left.ctimeNs === right.ctimeNs
      && permissionMode(left.mode) === permissionMode(right.mode)
      && left.contentHash === right.contentHash
  }
  return false
}

function compareRollbackOrder(left: JournalEntry, right: JournalEntry): number {
  const leftRestoresDeleted = left.original.kind !== 'missing'
    && left.published?.kind === 'missing'
  const rightRestoresDeleted = right.original.kind !== 'missing'
    && right.published?.kind === 'missing'
  if (leftRestoresDeleted !== rightRestoresDeleted)
    return leftRestoresDeleted ? -1 : 1
  if (leftRestoresDeleted)
    return pathDepth(left.path) - pathDepth(right.path)
  return pathDepth(right.path) - pathDepth(left.path)
}

function sameClaimedPathState(left: PathSnapshot, right: PathSnapshot): boolean {
  if (left.kind !== right.kind)
    return false
  if (left.kind === 'missing')
    return true
  if (left.kind === 'directory' && right.kind === 'directory') {
    return left.device === right.device
      && left.inode === right.inode
      && permissionMode(left.mode) === permissionMode(right.mode)
  }
  if (left.kind === 'file' && right.kind === 'file') {
    return left.device === right.device
      && left.inode === right.inode
      && left.size === right.size
      && permissionMode(left.mode) === permissionMode(right.mode)
      && left.contentHash === right.contentHash
  }
  return false
}

function sameFileIdentity(left: BigIntStats, right: BigIntStats): boolean {
  return left.isFile()
    && right.isFile()
    && !left.isSymbolicLink()
    && !right.isSymbolicLink()
    && left.dev === right.dev
    && left.ino === right.ino
    && left.size === right.size
    && left.mtimeNs === right.mtimeNs
    && left.ctimeNs === right.ctimeNs
}

function hardLinkUnsupported(error: unknown): boolean {
  return ['EXDEV', 'ENOSYS', 'ENOTSUP', 'EOPNOTSUPP', 'EPERM']
    .includes((error as NodeJS.ErrnoException).code ?? '')
}

function permissionMode(mode: bigint): bigint {
  return mode & 0o777n
}

function pathDepth(path: string): number {
  return path.split(sep).length
}

function toProjectPath(projectRoot: string, path: string): string {
  return relative(projectRoot, path).split(sep).join('/')
}
