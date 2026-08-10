import type { BigIntStats } from 'node:fs'
import type { FileHandle } from 'node:fs/promises'
import type { StableDirectoryChain } from '../core/path-identity.js'
import { Buffer } from 'node:buffer'
import { createHash, randomUUID } from 'node:crypto'
import { constants } from 'node:fs'
import { link, lstat, open, readdir, realpath, rename, unlink } from 'node:fs/promises'

import { dirname, isAbsolute, relative, resolve, sep } from 'node:path'
import { normalizeLogicalPath } from '../core/filesystem.js'
import {
  assertStableDirectoryChain,
  captureStableDirectoryChain,

} from '../core/path-identity.js'
import { SPECS_MAX_FILE_BYTES } from '../specs/model.js'
import {
  inspectSpecs,
  isRecognizedGeneratedSpecsIndex,
  specsInspectionComplete,
} from '../specs/query.js'

const READ_NO_FOLLOW_FLAGS = constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0)
const WRITE_EXCLUSIVE_NO_FOLLOW_FLAGS = constants.O_WRONLY
  | constants.O_CREAT
  | constants.O_EXCL
  | (constants.O_NOFOLLOW ?? 0)
const DEFAULT_FILE_ADAPTER = { link }

interface GeneratedIndexSnapshot {
  projectPath: string
  absolutePath: string
  identity: Pick<BigIntStats, 'dev' | 'ino' | 'size' | 'mode' | 'mtimeNs' | 'ctimeNs'>
  contentHash: string
  parentChain: StableDirectoryChain
}

interface QuarantinedGeneratedIndex extends GeneratedIndexSnapshot {
  quarantinePath: string
  recoveryPath: string | null
}

export interface GeneratedSpecsIndexMigrationPlan {
  inspectionComplete: boolean
  removable: string[]
  ownerControlled: string[]
  diagnostics: string[]
}

export interface GeneratedSpecsIndexMigrationOptions {
  cwd?: string
  afterQuarantine?: (projectPath: string) => Promise<void>
  fileAdapter?: {
    link: typeof link
  }
  testing?: {
    /** Internal deterministic race hook; not part of the packaged CLI contract. */
    afterCopyDestinationOpen?: (destinationPath: string) => Promise<void>
  }
}

export interface GeneratedSpecsIndexRetainedMutation {
  projectPath: string
  quarantineName: string
  contentHash: string
  device: string
  inode: string
  size: string
  mode: string
  lastKnownParentRealPath: string
}

export class GeneratedSpecsIndexMigrationError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly recoveryPaths: string[] = [],
    public readonly retainedMutations: GeneratedSpecsIndexRetainedMutation[] = [],
  ) {
    super(message)
    this.name = 'GeneratedSpecsIndexMigrationError'
  }
}

export async function inspectGeneratedSpecsIndexMigration(
  cwd = process.cwd(),
): Promise<GeneratedSpecsIndexMigrationPlan> {
  const inspection = await inspectSpecs({
    cwd,
    allowMissingDecisionRecords: true,
  })
  const removable = inspection.generatedIndexes
    .filter(index => index.classification === 'safe-removal')
    .map(index => index.path)
    .sort()
  const ownerControlled = inspection.generatedIndexes
    .filter(index => index.classification === 'owner-controlled')
    .map(index => index.path)
    .sort()
  return {
    inspectionComplete: specsInspectionComplete(inspection),
    removable,
    ownerControlled,
    diagnostics: inspection.diagnostics.map(diagnostic => `${diagnostic.path ?? '.rsp/specs'}: ${diagnostic.message}`),
  }
}

export async function removeRecognizedGeneratedSpecsIndexes(
  options: GeneratedSpecsIndexMigrationOptions = {},
): Promise<string[]> {
  const cwd = await realpath(resolve(options.cwd ?? process.cwd()))
  const fileAdapter = options.fileAdapter ?? DEFAULT_FILE_ADAPTER
  const plan = await inspectGeneratedSpecsIndexMigration(cwd)
  if (!plan.inspectionComplete || plan.ownerControlled.length > 0) {
    const ownerMessage = plan.ownerControlled.length > 0
      ? ` Owner-controlled reserved path(s): ${plan.ownerControlled.join(', ')}.`
      : ''
    const diagnosticMessage = plan.diagnostics.length > 0
      ? ` ${plan.diagnostics.join('; ')}`
      : ''
    throw new GeneratedSpecsIndexMigrationError(
      'generated_specs_index_owner_review_required',
      `Generated Specs-index migration stopped before mutation.${ownerMessage}${diagnosticMessage}`,
    )
  }
  if (plan.removable.length === 0)
    return []

  const snapshots: GeneratedIndexSnapshot[] = []
  for (const projectPath of plan.removable)
    snapshots.push(await inspectRecognizedGeneratedIndex(cwd, projectPath))

  const quarantined: QuarantinedGeneratedIndex[] = []
  let removalCommitted = false
  try {
    for (const snapshot of snapshots) {
      const quarantinePath = `${snapshot.absolutePath}.${process.pid}.${randomUUID()}.rsp-migration`
      await assertMigrationParent(snapshot, 'quarantine')
      await rename(snapshot.absolutePath, quarantinePath)
      await assertMigrationParent(snapshot, 'quarantine')
      const quarantinedItem: QuarantinedGeneratedIndex = {
        ...snapshot,
        quarantinePath,
        recoveryPath: null,
      }
      quarantined.push(quarantinedItem)
      const quarantinedSnapshot = await inspectRecognizedGeneratedIndexAt(
        cwd,
        snapshot.projectPath,
        quarantinePath,
        snapshot.parentChain,
      )
      if (!sameRenamedSnapshot(snapshot.identity, quarantinedSnapshot.identity)
        || snapshot.contentHash !== quarantinedSnapshot.contentHash) {
        throw new GeneratedSpecsIndexMigrationError(
          'generated_specs_index_changed',
          `Generated Specs index changed before migration: ${snapshot.projectPath}`,
        )
      }
      quarantinedItem.identity = quarantinedSnapshot.identity
      await options.afterQuarantine?.(snapshot.projectPath)
      await assertMigrationParent(quarantinedItem, 'post-quarantine hook')
    }

    for (const item of quarantined)
      await assertMigrationParent(item, 'direct Specs postcheck')
    const after = await inspectSpecs({
      cwd,
      allowMissingDecisionRecords: true,
    })
    if (!specsInspectionComplete(after) || after.generatedIndexes.length > 0) {
      throw new GeneratedSpecsIndexMigrationError(
        'generated_specs_index_postcheck_failed',
        'Specs tree changed while generated indexes were being migrated; no quarantined index was deleted.',
      )
    }
    for (const item of quarantined)
      await assertMigrationParent(item, 'direct Specs postcheck')

    for (const item of quarantined) {
      item.recoveryPath = `${item.quarantinePath}.recovery`
      await materializeVerifiedSnapshot(
        item,
        item.quarantinePath,
        item.recoveryPath,
        fileAdapter,
        options.testing,
      )
    }
    for (const item of quarantined) {
      await assertMigrationParent(item, 'quarantine removal')
      await unlink(item.quarantinePath)
      await assertMigrationParent(item, 'quarantine removal')
    }
    removalCommitted = true
    const cleanupPaths: string[] = []
    for (const item of quarantined) {
      try {
        await assertMigrationParent(item, 'recovery cleanup')
        await unlink(item.recoveryPath!)
        await assertMigrationParent(item, 'recovery cleanup')
        item.recoveryPath = null
      }
      catch {
        cleanupPaths.push(item.recoveryPath!)
      }
    }
    if (cleanupPaths.length > 0) {
      throw new GeneratedSpecsIndexMigrationError(
        'generated_specs_index_cleanup_required',
        `Generated Specs indexes were removed, but recovery-link cleanup requires owner action: ${cleanupPaths.join(', ')}`,
        cleanupPaths,
      )
    }
    return plan.removable
  }
  catch (error) {
    if (removalCommitted)
      throw error
    const recovery = await restoreQuarantinedIndexes(
      quarantined,
      fileAdapter,
      options.testing,
    )
    if (recovery.recoveryPaths.length > 0 || recovery.retainedMutations.length > 0) {
      const retainedMessage = recovery.retainedMutations.length > 0
        ? ` Retained mutation evidence: ${recovery.retainedMutations
          .map(item => `${item.projectPath} (${item.quarantineName}, sha256 ${item.contentHash})`)
          .join(', ')}.`
        : ''
      throw new GeneratedSpecsIndexMigrationError(
        'generated_specs_index_recovery_required',
        `Generated Specs-index migration stopped and preserved recovery evidence.${recovery.recoveryPaths.length > 0 ? ` Accessible recovery copies: ${recovery.recoveryPaths.join(', ')}.` : ''}${retainedMessage}`,
        recovery.recoveryPaths,
        recovery.retainedMutations,
      )
    }
    throw error
  }
}

async function inspectRecognizedGeneratedIndex(
  projectRoot: string,
  projectPath: string,
): Promise<GeneratedIndexSnapshot> {
  const absolutePath = resolveProjectPath(projectRoot, projectPath)
  const parentChain = await captureStableDirectoryChain({
    rootPath: projectRoot,
    requiredPath: resolve(projectRoot, '.rsp', 'specs'),
    targetPath: dirname(absolutePath),
    label: `generated Specs index ${projectPath}`,
  })
  return inspectRecognizedGeneratedIndexAt(
    projectRoot,
    projectPath,
    absolutePath,
    parentChain,
  )
}

async function inspectRecognizedGeneratedIndexAt(
  projectRoot: string,
  projectPath: string,
  absolutePath: string,
  parentChain: StableDirectoryChain,
): Promise<GeneratedIndexSnapshot> {
  await assertStableDirectoryChain(parentChain, `generated Specs index ${projectPath}`)
  const before = await lstat(absolutePath, { bigint: true })
  if (!before.isFile() || before.isSymbolicLink())
    throw changed(projectPath)
  const handle = await open(absolutePath, READ_NO_FOLLOW_FLAGS)
  try {
    const opened = await handle.stat({ bigint: true })
    if (!opened.isFile() || !sameSnapshot(before, opened))
      throw changed(projectPath)
    const content = await readBounded(handle, projectPath)
    const after = await handle.stat({ bigint: true })
    if (!sameSnapshot(opened, after))
      throw changed(projectPath)
    const finalPath = await lstat(absolutePath, { bigint: true })
    if (!sameSnapshot(after, finalPath))
      throw changed(projectPath)
    await assertStableDirectoryChain(parentChain, `generated Specs index ${projectPath}`)
    if (!isRecognizedGeneratedSpecsIndex(content, projectPath)) {
      throw new GeneratedSpecsIndexMigrationError(
        'generated_specs_index_owner_review_required',
        `Reserved Specs index is not recognized generated content: ${projectPath}`,
      )
    }
    return {
      projectPath,
      absolutePath,
      identity: snapshot(after),
      contentHash: createHash('sha256').update(content).digest('hex'),
      parentChain,
    }
  }
  finally {
    await handle.close()
  }
}

async function readBounded(handle: FileHandle, projectPath: string): Promise<string> {
  const buffer = Buffer.allocUnsafe(SPECS_MAX_FILE_BYTES + 1)
  let bytes = 0
  while (bytes < buffer.length) {
    const result = await handle.read(buffer, bytes, buffer.length - bytes, bytes)
    if (result.bytesRead === 0)
      break
    bytes += result.bytesRead
  }
  if (bytes > SPECS_MAX_FILE_BYTES) {
    throw new GeneratedSpecsIndexMigrationError(
      'generated_specs_index_too_large',
      `Reserved Specs index exceeds the ${SPECS_MAX_FILE_BYTES}-byte migration limit: ${projectPath}`,
    )
  }
  return buffer.subarray(0, bytes).toString('utf8')
}

async function restoreQuarantinedIndexes(
  quarantined: QuarantinedGeneratedIndex[],
  fileAdapter: NonNullable<GeneratedSpecsIndexMigrationOptions['fileAdapter']>,
  testing: GeneratedSpecsIndexMigrationOptions['testing'],
): Promise<{
  recoveryPaths: string[]
  retainedMutations: GeneratedSpecsIndexRetainedMutation[]
}> {
  const recoveryPaths: string[] = []
  const retainedMutations: GeneratedSpecsIndexRetainedMutation[] = []
  for (const item of [...quarantined].reverse()) {
    try {
      await assertMigrationParent(item, 'rollback source inspection')
      const sourcePath = await firstExistingPath(item)
      if (!sourcePath) {
        recoveryPaths.push(item.recoveryPath ?? item.quarantinePath)
        continue
      }
      await materializeVerifiedSnapshot(
        item,
        sourcePath,
        item.absolutePath,
        fileAdapter,
        testing,
      )
      await assertMigrationParent(item, 'rollback cleanup')
      await unlink(item.quarantinePath).catch(ignoreMissing)
      if (item.recoveryPath) {
        await assertMigrationParent(item, 'rollback cleanup')
        await unlink(item.recoveryPath).catch(ignoreMissing)
      }
    }
    catch {
      try {
        await assertMigrationParent(item, 'rollback recovery reporting')
        const recoveryPath = await firstExistingPath(item)
        if (recoveryPath)
          recoveryPaths.push(recoveryPath)
        else
          retainedMutations.push(retainedMutationEvidence(item))
      }
      catch {
        const relocated = await findRelocatedRetainedMutation(item).catch(() => null)
        if (relocated)
          recoveryPaths.push(relocated)
        else
          retainedMutations.push(retainedMutationEvidence(item))
      }
    }
  }
  return { recoveryPaths, retainedMutations }
}

async function findRelocatedRetainedMutation(
  item: QuarantinedGeneratedIndex,
): Promise<string | null> {
  const targetName = item.quarantinePath.slice(dirname(item.quarantinePath).length + 1)
  const pending = [item.parentChain.rootPath]
  let inspected = 0
  while (pending.length > 0 && inspected < 4_096) {
    const directory = pending.shift()!
    for (const entry of await readdir(directory, { withFileTypes: true })) {
      inspected += 1
      if (inspected > 4_096)
        return null
      const path = resolve(directory, entry.name)
      if (entry.isSymbolicLink())
        continue
      if (entry.isDirectory()) {
        pending.push(path)
        continue
      }
      if (!entry.isFile() || entry.name !== targetName)
        continue
      const value = await lstat(path, { bigint: true })
      if (value.isFile()
        && !value.isSymbolicLink()
        && value.dev === item.identity.dev
        && value.ino === item.identity.ino) {
        return path
      }
    }
  }
  return null
}

async function firstExistingPath(
  item: QuarantinedGeneratedIndex,
): Promise<string | null> {
  for (const path of [item.quarantinePath, item.recoveryPath]) {
    if (!path) {
      continue
    }
    try {
      await assertMigrationParent(item, 'recovery source inspection')
      await lstat(path)
      return path
    }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT')
        throw error
    }
  }
  return null
}

function ignoreMissing(error: unknown): void {
  if ((error as NodeJS.ErrnoException).code !== 'ENOENT')
    throw error
}

async function materializeVerifiedSnapshot(
  item: GeneratedIndexSnapshot,
  sourcePath: string,
  destinationPath: string,
  fileAdapter: NonNullable<GeneratedSpecsIndexMigrationOptions['fileAdapter']>,
  testing: GeneratedSpecsIndexMigrationOptions['testing'],
): Promise<void> {
  await assertMigrationParent(item, 'snapshot materialization')
  const source = await inspectRecognizedGeneratedIndexAt(
    item.parentChain.rootPath,
    item.projectPath,
    sourcePath,
    item.parentChain,
  )
  if (source.contentHash !== item.contentHash
    || permissionMode(source.identity.mode) !== permissionMode(item.identity.mode)) {
    throw changed(item.projectPath)
  }

  try {
    await fileAdapter.link(sourcePath, destinationPath)
  }
  catch (error) {
    if (!hardLinkUnsupported(error))
      throw error
    await copySnapshotExclusive(
      source,
      destinationPath,
      fileAdapter,
      testing,
    )
  }

  const destination = await inspectRecognizedGeneratedIndexAt(
    item.parentChain.rootPath,
    item.projectPath,
    destinationPath,
    item.parentChain,
  )
  const sourceAfter = await inspectRecognizedGeneratedIndexAt(
    item.parentChain.rootPath,
    item.projectPath,
    sourcePath,
    item.parentChain,
  )
  if (destination.contentHash !== item.contentHash
    || sourceAfter.contentHash !== item.contentHash
    || permissionMode(destination.identity.mode) !== permissionMode(item.identity.mode)
    || permissionMode(sourceAfter.identity.mode) !== permissionMode(item.identity.mode)
    || !sameRenamedSnapshot(source.identity, sourceAfter.identity)) {
    throw changed(item.projectPath)
  }
  await assertMigrationParent(item, 'snapshot materialization')
}

async function copySnapshotExclusive(
  source: GeneratedIndexSnapshot,
  destinationPath: string,
  fileAdapter: NonNullable<GeneratedSpecsIndexMigrationOptions['fileAdapter']>,
  testing: GeneratedSpecsIndexMigrationOptions['testing'],
): Promise<void> {
  const sourceHandle = await open(source.absolutePath, READ_NO_FOLLOW_FLAGS)
  let destinationHandle: FileHandle | null = null
  let destinationIdentity: GeneratedIndexSnapshot['identity'] | null = null
  try {
    const sourceOpened = await sourceHandle.stat({ bigint: true })
    if (!sameSnapshot(source.identity, sourceOpened))
      throw changed(source.projectPath)
    destinationHandle = await open(
      destinationPath,
      WRITE_EXCLUSIVE_NO_FOLLOW_FLAGS,
      Number(permissionMode(source.identity.mode)),
    )
    const destinationOpened = await destinationHandle.stat({ bigint: true })
    if (!destinationOpened.isFile() || destinationOpened.isSymbolicLink())
      throw changed(source.projectPath)
    destinationIdentity = snapshot(destinationOpened)
    await testing?.afterCopyDestinationOpen?.(destinationPath)
    const hash = createHash('sha256')
    const buffer = Buffer.allocUnsafe(64 * 1024)
    let bytes = 0
    while (bytes <= SPECS_MAX_FILE_BYTES) {
      const read = await sourceHandle.read(buffer, 0, buffer.length, null)
      if (read.bytesRead === 0)
        break
      bytes += read.bytesRead
      if (bytes > SPECS_MAX_FILE_BYTES)
        throw changed(source.projectPath)
      const chunk = buffer.subarray(0, read.bytesRead)
      hash.update(chunk)
      let written = 0
      while (written < chunk.length) {
        const result = await destinationHandle.write(
          chunk,
          written,
          chunk.length - written,
          null,
        )
        written += result.bytesWritten
      }
    }
    if (BigInt(bytes) !== source.identity.size
      || hash.digest('hex') !== source.contentHash) {
      throw changed(source.projectPath)
    }
    await destinationHandle.chmod(Number(permissionMode(source.identity.mode)))
    await destinationHandle.sync()
    const destinationAfter = await destinationHandle.stat({ bigint: true })
    const sourceAfter = await sourceHandle.stat({ bigint: true })
    if (!sameSnapshot(sourceOpened, sourceAfter)
      || !destinationAfter.isFile()
      || destinationAfter.isSymbolicLink()
      || destinationAfter.size !== source.identity.size
      || permissionMode(destinationAfter.mode) !== permissionMode(source.identity.mode)) {
      throw changed(source.projectPath)
    }
  }
  catch (error) {
    await destinationHandle?.close().catch(() => undefined)
    destinationHandle = null
    if (destinationIdentity) {
      await cleanupExclusiveDestination(
        source,
        destinationPath,
        destinationIdentity,
        fileAdapter,
      )
    }
    throw error
  }
  finally {
    await destinationHandle?.close()
    await sourceHandle.close()
  }
}

async function cleanupExclusiveDestination(
  source: GeneratedIndexSnapshot,
  destinationPath: string,
  expected: GeneratedIndexSnapshot['identity'],
  fileAdapter: NonNullable<GeneratedSpecsIndexMigrationOptions['fileAdapter']>,
): Promise<void> {
  const quarantinePath = `${destinationPath}.${process.pid}.${randomUUID()}.rsp-copy-cleanup`
  await assertMigrationParent(source, 'exclusive-copy cleanup')
  try {
    await rename(destinationPath, quarantinePath)
  }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT')
      return
    throw error
  }
  await assertMigrationParent(source, 'exclusive-copy cleanup')
  const quarantined = await lstat(quarantinePath, { bigint: true })
  if (quarantined.isFile()
    && !quarantined.isSymbolicLink()
    && quarantined.dev === expected.dev
    && quarantined.ino === expected.ino) {
    const finalIdentity = await lstat(quarantinePath, { bigint: true })
    if (!finalIdentity.isFile()
      || finalIdentity.isSymbolicLink()
      || finalIdentity.dev !== expected.dev
      || finalIdentity.ino !== expected.ino) {
      throw new GeneratedSpecsIndexMigrationError(
        'generated_specs_index_copy_cleanup_required',
        `Exclusive-copy cleanup retained a changed file: ${quarantinePath}`,
        [quarantinePath],
      )
    }
    await unlink(quarantinePath)
    return
  }

  try {
    await fileAdapter.link(quarantinePath, destinationPath)
    await unlink(quarantinePath)
    throw new GeneratedSpecsIndexMigrationError(
      'generated_specs_index_copy_replaced',
      `Exclusive-copy cleanup preserved a concurrent replacement at ${destinationPath}`,
    )
  }
  catch (error) {
    if (error instanceof GeneratedSpecsIndexMigrationError)
      throw error
    if (!hardLinkUnsupported(error)
      && (error as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw error
    }
  }

  if ((await lstat(destinationPath).catch(() => null)) === null)
    await copyConcurrentReplacementExclusive(quarantinePath, destinationPath)
  throw new GeneratedSpecsIndexMigrationError(
    'generated_specs_index_copy_cleanup_required',
    `Exclusive-copy cleanup preserved a concurrent replacement and retained its original inode at ${quarantinePath}`,
    [quarantinePath],
  )
}

async function copyConcurrentReplacementExclusive(
  sourcePath: string,
  destinationPath: string,
): Promise<void> {
  const sourceHandle = await open(sourcePath, READ_NO_FOLLOW_FLAGS)
  let destinationHandle: FileHandle | null = null
  try {
    const sourceBefore = await sourceHandle.stat({ bigint: true })
    if (!sourceBefore.isFile()
      || sourceBefore.isSymbolicLink()
      || sourceBefore.size > BigInt(SPECS_MAX_FILE_BYTES)) {
      return
    }
    destinationHandle = await open(
      destinationPath,
      WRITE_EXCLUSIVE_NO_FOLLOW_FLAGS,
      Number(permissionMode(sourceBefore.mode)),
    )
    const buffer = Buffer.allocUnsafe(64 * 1024)
    let bytes = 0
    while (bytes <= SPECS_MAX_FILE_BYTES) {
      const read = await sourceHandle.read(buffer, 0, buffer.length, null)
      if (read.bytesRead === 0)
        break
      bytes += read.bytesRead
      if (bytes > SPECS_MAX_FILE_BYTES)
        return
      let written = 0
      while (written < read.bytesRead) {
        const result = await destinationHandle.write(
          buffer,
          written,
          read.bytesRead - written,
          null,
        )
        written += result.bytesWritten
      }
    }
    await destinationHandle.chmod(Number(permissionMode(sourceBefore.mode)))
    await destinationHandle.sync()
    const sourceAfter = await sourceHandle.stat({ bigint: true })
    const destinationAfter = await destinationHandle.stat({ bigint: true })
    if (!sameSnapshot(sourceBefore, sourceAfter)
      || destinationAfter.size !== sourceBefore.size
      || permissionMode(destinationAfter.mode) !== permissionMode(sourceBefore.mode)) {
      throw new GeneratedSpecsIndexMigrationError(
        'generated_specs_index_copy_cleanup_required',
        `Concurrent replacement could not be restored byte-for-byte: ${sourcePath}`,
        [sourcePath],
      )
    }
  }
  finally {
    await destinationHandle?.close()
    await sourceHandle.close()
  }
}

function retainedMutationEvidence(
  item: QuarantinedGeneratedIndex,
): GeneratedSpecsIndexRetainedMutation {
  return {
    projectPath: item.projectPath,
    quarantineName: item.quarantinePath.slice(dirname(item.quarantinePath).length + 1),
    contentHash: item.contentHash,
    device: String(item.identity.dev),
    inode: String(item.identity.ino),
    size: String(item.identity.size),
    mode: permissionMode(item.identity.mode).toString(8),
    lastKnownParentRealPath: item.parentChain.entries.at(-1)!.realPath,
  }
}

async function assertMigrationParent(
  item: Pick<GeneratedIndexSnapshot, 'projectPath' | 'parentChain'>,
  operation: string,
): Promise<void> {
  try {
    await assertStableDirectoryChain(
      item.parentChain,
      `generated Specs index ${item.projectPath} ${operation}`,
    )
  }
  catch (error) {
    throw new GeneratedSpecsIndexMigrationError(
      'generated_specs_index_parent_changed',
      `Generated Specs-index migration stopped because a managed parent changed before ${operation}: ${item.projectPath}. ${error instanceof Error ? error.message : String(error)}`,
    )
  }
}

function hardLinkUnsupported(error: unknown): boolean {
  return ['EXDEV', 'ENOSYS', 'ENOTSUP', 'EOPNOTSUPP', 'EPERM']
    .includes((error as NodeJS.ErrnoException).code ?? '')
}

function permissionMode(mode: bigint): bigint {
  return mode & 0o777n
}

function resolveProjectPath(projectRoot: string, projectPath: string): string {
  const normalized = normalizeLogicalPath(projectPath)
  const absolutePath = resolve(projectRoot, ...normalized.split('/'))
  const candidate = relative(projectRoot, absolutePath)
  if (normalized === ''
    || isAbsolute(projectPath)
    || candidate === ''
    || candidate === '..'
    || candidate.startsWith(`..${sep}`)
    || isAbsolute(candidate)
    || dirname(normalized) === '.') {
    throw new GeneratedSpecsIndexMigrationError(
      'generated_specs_index_path_invalid',
      `Generated Specs-index path is outside the managed Specs tree: ${projectPath}`,
    )
  }
  return absolutePath
}

function changed(projectPath: string): GeneratedSpecsIndexMigrationError {
  return new GeneratedSpecsIndexMigrationError(
    'generated_specs_index_changed',
    `Generated Specs index changed before migration: ${projectPath}`,
  )
}

function snapshot(value: BigIntStats): GeneratedIndexSnapshot['identity'] {
  return {
    dev: value.dev,
    ino: value.ino,
    size: value.size,
    mode: value.mode,
    mtimeNs: value.mtimeNs,
    ctimeNs: value.ctimeNs,
  }
}

function sameSnapshot(
  left: Pick<BigIntStats, 'dev' | 'ino' | 'size' | 'mode' | 'mtimeNs' | 'ctimeNs'>,
  right: Pick<BigIntStats, 'dev' | 'ino' | 'size' | 'mode' | 'mtimeNs' | 'ctimeNs'>,
): boolean {
  return left.dev === right.dev
    && left.ino === right.ino
    && left.size === right.size
    && left.mode === right.mode
    && left.mtimeNs === right.mtimeNs
    && left.ctimeNs === right.ctimeNs
}

function sameRenamedSnapshot(
  left: Pick<BigIntStats, 'dev' | 'ino' | 'size' | 'mode' | 'mtimeNs'>,
  right: Pick<BigIntStats, 'dev' | 'ino' | 'size' | 'mode' | 'mtimeNs'>,
): boolean {
  return left.dev === right.dev
    && left.ino === right.ino
    && left.size === right.size
    && left.mode === right.mode
    && left.mtimeNs === right.mtimeNs
}
