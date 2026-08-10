import type { BigIntStats } from 'node:fs'
import type { FileHandle } from 'node:fs/promises'
import { Buffer } from 'node:buffer'
import { createHash } from 'node:crypto'
import { constants } from 'node:fs'
import { chmod, lstat, mkdir, mkdtemp, open, realpath, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { basename, dirname, join, resolve } from 'node:path'

import {
  assertStableDirectoryChain,
  captureStableDirectoryChain,
} from '../core/path-identity.js'
import {
  RUNTIME_DATABASE_FILENAME,
  RUNTIME_MAX_DATABASE_BYTES,
  RuntimeStoreError,
} from './model.js'

const READ_NO_FOLLOW_FLAGS = constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0)
const WRITE_EXCLUSIVE_NO_FOLLOW_FLAGS = constants.O_WRONLY
  | constants.O_CREAT
  | constants.O_EXCL
  | (constants.O_NOFOLLOW ?? 0)
const COPY_BUFFER_BYTES = 64 * 1024
const RUNTIME_INSPECTION_FILES = [
  RUNTIME_DATABASE_FILENAME,
  `${RUNTIME_DATABASE_FILENAME}-wal`,
  `${RUNTIME_DATABASE_FILENAME}-shm`,
  `${RUNTIME_DATABASE_FILENAME}-journal`,
] as const

interface RuntimeInspectionSource {
  path: string
  identity: RuntimeInspectionFileIdentity
}

interface RuntimeInspectionFileIdentity {
  device: bigint
  inode: bigint
  size: bigint
  mode: bigint
  mtimeNs: bigint
  ctimeNs: bigint
  contentHash: string
}

export interface RuntimeInspectionSnapshot {
  originalNamespacePath: string
  originalDatabasePath: string
  snapshotNamespacePath: string
  snapshotDatabasePath: string
}

export interface RuntimeInspectionSnapshotOptions {
  /** Internal deterministic race hook; not part of the packaged runtime API. */
  afterCopy?: (sourcePath: string) => Promise<void>
}

/**
 * Copy one stable, bounded database plus present sidecars into a private
 * disposable namespace before any path-based SQLite open.
 */
export async function withRuntimeInspectionSnapshot<T>(
  namespaceInput: string,
  action: (snapshot: RuntimeInspectionSnapshot | null) => Promise<T>,
  options: RuntimeInspectionSnapshotOptions = {},
): Promise<T> {
  const namespacePath = resolve(namespaceInput)
  const databasePath = join(namespacePath, RUNTIME_DATABASE_FILENAME)
  const namespaceState = await inspectNamespace(namespacePath)
  if (namespaceState === 'absent')
    return action(null)

  const parentChain = await captureStableDirectoryChain({
    rootPath: dirname(namespacePath),
    targetPath: namespacePath,
    label: 'runtime inspection namespace',
  })
  const sources: RuntimeInspectionSource[] = []
  for (const name of RUNTIME_INSPECTION_FILES) {
    const path = join(namespacePath, name)
    const identity = await inspectRuntimeSource(path, name === RUNTIME_DATABASE_FILENAME)
    if (identity)
      sources.push({ path, identity })
  }
  if (!sources.some(source => source.path === databasePath)) {
    if (sources.length > 0) {
      throw new RuntimeStoreError(
        'runtime_database_invalid',
        'Runtime database sidecars exist without the checkout runtime database',
        'Preserve the namespace for diagnostics and dispose it only through the exact packaged runtime API',
      )
    }
    return action(null)
  }

  const temporaryRoot = await mkdtemp(join(tmpdir(), 'rsp-runtime-inspection-'))
  await chmod(temporaryRoot, 0o700).catch(() => undefined)
  const snapshotNamespacePath = join(temporaryRoot, 'namespace')
  await mkdir(snapshotNamespacePath, { mode: 0o700 })
  try {
    for (const source of sources) {
      await assertStableDirectoryChain(parentChain, 'runtime inspection namespace')
      await copyRuntimeSource(
        source,
        join(snapshotNamespacePath, basename(source.path)),
      )
      await options.afterCopy?.(source.path)
      await assertStableDirectoryChain(parentChain, 'runtime inspection namespace')
    }
    for (const source of sources)
      await assertRuntimeSourceUnchanged(source)
    await assertStableDirectoryChain(parentChain, 'runtime inspection namespace')
    return await action({
      originalNamespacePath: namespacePath,
      originalDatabasePath: databasePath,
      snapshotNamespacePath,
      snapshotDatabasePath: join(snapshotNamespacePath, RUNTIME_DATABASE_FILENAME),
    })
  }
  finally {
    await rm(temporaryRoot, { recursive: true, force: true })
  }
}

async function inspectNamespace(path: string): Promise<'present' | 'absent'> {
  try {
    const value = await lstat(path)
    if (!value.isDirectory() || value.isSymbolicLink()) {
      throw new RuntimeStoreError(
        'runtime_namespace_invalid',
        `Runtime namespace must be a real directory: ${path}`,
      )
    }
    await realpath(path)
    return 'present'
  }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT')
      return 'absent'
    throw error
  }
}

async function inspectRuntimeSource(
  path: string,
  database: boolean,
): Promise<RuntimeInspectionFileIdentity | null> {
  let value: BigIntStats
  try {
    value = await lstat(path, { bigint: true })
  }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT')
      return null
    throw error
  }
  if (!value.isFile() || value.isSymbolicLink()) {
    throw new RuntimeStoreError(
      database ? 'runtime_database_invalid' : 'runtime_sidecar_invalid',
      `${database ? 'Runtime database' : 'Runtime database sidecar'} must be a regular file: ${path}`,
    )
  }
  if (value.size > BigInt(RUNTIME_MAX_DATABASE_BYTES)) {
    throw new RuntimeStoreError(
      database ? 'runtime_database_oversize' : 'runtime_sidecar_oversize',
      `${database ? 'Runtime database' : 'Runtime database sidecar'} exceeds the ${RUNTIME_MAX_DATABASE_BYTES} byte inspection bound: ${path}`,
      'Preserve the namespace for diagnostics and dispose it only through the exact packaged runtime API',
    )
  }
  return {
    device: value.dev,
    inode: value.ino,
    size: value.size,
    mode: value.mode,
    mtimeNs: value.mtimeNs,
    ctimeNs: value.ctimeNs,
    contentHash: '',
  }
}

async function copyRuntimeSource(
  source: RuntimeInspectionSource,
  destinationPath: string,
): Promise<void> {
  const sourceHandle = await open(source.path, READ_NO_FOLLOW_FLAGS)
  let destinationHandle: FileHandle | null = null
  let destinationCreated = false
  try {
    const opened = await sourceHandle.stat({ bigint: true })
    if (!sameIdentity(source.identity, opened))
      throw runtimeSourceChanged(source.path)
    destinationHandle = await open(
      destinationPath,
      WRITE_EXCLUSIVE_NO_FOLLOW_FLAGS,
      0o600,
    )
    destinationCreated = true
    const hash = createHash('sha256')
    const buffer = Buffer.allocUnsafe(COPY_BUFFER_BYTES)
    let bytes = 0
    while (bytes <= RUNTIME_MAX_DATABASE_BYTES) {
      const read = await sourceHandle.read(buffer, 0, buffer.length, null)
      if (read.bytesRead === 0)
        break
      bytes += read.bytesRead
      if (bytes > RUNTIME_MAX_DATABASE_BYTES)
        throw runtimeSourceChanged(source.path)
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
    await destinationHandle.chmod(0o600)
    await destinationHandle.sync()
    const sourceAfter = await sourceHandle.stat({ bigint: true })
    const destinationAfter = await destinationHandle.stat({ bigint: true })
    const contentHash = hash.digest('hex')
    if (!sameIdentity(opened, sourceAfter)
      || BigInt(bytes) !== source.identity.size
      || !destinationAfter.isFile()
      || destinationAfter.isSymbolicLink()
      || destinationAfter.size !== source.identity.size) {
      throw runtimeSourceChanged(source.path)
    }
    source.identity.contentHash = contentHash
  }
  catch (error) {
    await destinationHandle?.close().catch(() => undefined)
    destinationHandle = null
    if (destinationCreated)
      await rm(destinationPath, { force: true }).catch(() => undefined)
    throw error
  }
  finally {
    await destinationHandle?.close()
    await sourceHandle.close()
  }
  const destinationHash = await hashStableFile(destinationPath, {
    ...source.identity,
    device: 0n,
    inode: 0n,
    mode: 0n,
  }, false)
  if (destinationHash !== source.identity.contentHash)
    throw runtimeSourceChanged(source.path)
  await assertRuntimeSourceUnchanged(source)
}

async function assertRuntimeSourceUnchanged(
  source: RuntimeInspectionSource,
): Promise<void> {
  let value: BigIntStats
  try {
    value = await lstat(source.path, { bigint: true })
  }
  catch {
    throw runtimeSourceChanged(source.path)
  }
  if (!sameIdentity(source.identity, value))
    throw runtimeSourceChanged(source.path)
  if (source.identity.contentHash
    && await hashStableFile(source.path, source.identity, true) !== source.identity.contentHash) {
    throw runtimeSourceChanged(source.path)
  }
}

async function hashStableFile(
  path: string,
  expected: RuntimeInspectionFileIdentity,
  requireIdentity: boolean,
): Promise<string> {
  const handle = await open(path, READ_NO_FOLLOW_FLAGS)
  try {
    const before = await handle.stat({ bigint: true })
    if (!before.isFile()
      || before.isSymbolicLink()
      || before.size !== expected.size
      || (requireIdentity && !sameIdentity(expected, before))) {
      throw runtimeSourceChanged(path)
    }
    const hash = createHash('sha256')
    const buffer = Buffer.allocUnsafe(COPY_BUFFER_BYTES)
    let bytes = 0
    while (bytes <= RUNTIME_MAX_DATABASE_BYTES) {
      const read = await handle.read(buffer, 0, buffer.length, null)
      if (read.bytesRead === 0)
        break
      bytes += read.bytesRead
      if (bytes > RUNTIME_MAX_DATABASE_BYTES)
        throw runtimeSourceChanged(path)
      hash.update(buffer.subarray(0, read.bytesRead))
    }
    const after = await handle.stat({ bigint: true })
    if (BigInt(bytes) !== expected.size
      || before.dev !== after.dev
      || before.ino !== after.ino
      || before.size !== after.size
      || before.mtimeNs !== after.mtimeNs
      || before.ctimeNs !== after.ctimeNs) {
      throw runtimeSourceChanged(path)
    }
    return hash.digest('hex')
  }
  finally {
    await handle.close()
  }
}

function sameIdentity(
  left: Pick<RuntimeInspectionFileIdentity, 'device' | 'inode' | 'size' | 'mode' | 'mtimeNs' | 'ctimeNs'> | BigIntStats,
  right: Pick<RuntimeInspectionFileIdentity, 'device' | 'inode' | 'size' | 'mode' | 'mtimeNs' | 'ctimeNs'> | BigIntStats,
): boolean {
  const leftDevice = 'device' in left ? left.device : left.dev
  const leftInode = 'inode' in left ? left.inode : left.ino
  const rightDevice = 'device' in right ? right.device : right.dev
  const rightInode = 'inode' in right ? right.inode : right.ino
  return leftDevice === rightDevice
    && leftInode === rightInode
    && left.size === right.size
    && left.mode === right.mode
    && left.mtimeNs === right.mtimeNs
    && left.ctimeNs === right.ctimeNs
}

function runtimeSourceChanged(path: string): RuntimeStoreError {
  return new RuntimeStoreError(
    'runtime_database_changed',
    `Runtime database or sidecar changed during read-only inspection: ${path}`,
    'Retry after the active runtime transaction completes; do not inspect through a replaced path',
  )
}
