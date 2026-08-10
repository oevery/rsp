import type { BigIntStats } from 'node:fs'
import type { FileHandle } from 'node:fs/promises'
import { Buffer } from 'node:buffer'
import { constants } from 'node:fs'
import { lstat, open, realpath } from 'node:fs/promises'
import { isAbsolute, relative, resolve, sep } from 'node:path'
import { ArchiveHistoryError } from './model.js'

const READ_NO_FOLLOW_FLAGS = constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0)

export interface ArchiveFileSnapshot {
  device: bigint
  inode: bigint
  size: bigint
  mtimeNs: bigint
  ctimeNs: bigint
}

export interface CurrentArchiveFile {
  sourcePath: string
  archivesDir: string
  content: string
  bytes: number
  snapshot: ArchiveFileSnapshot
}

export async function readCurrentArchiveFile(options: {
  sourcePath: string
  archivesDir: string
  projectPath: string
  maxFileBytes: number
  expectedSnapshot?: ArchiveFileSnapshot
}): Promise<CurrentArchiveFile> {
  const sourcePath = resolve(options.sourcePath)
  const archivesDir = resolve(options.archivesDir)
  const relativePath = relative(archivesDir, sourcePath)
  if (relativePath === ''
    || relativePath === '..'
    || relativePath.startsWith(`..${sep}`)
    || isAbsolute(relativePath)) {
    throw changed(options.projectPath)
  }

  let inspectedRoot
  let inspected
  let realArchivesDir: string
  try {
    inspectedRoot = await lstat(archivesDir, { bigint: true })
    if (!inspectedRoot.isDirectory())
      throw changed(options.projectPath)
    inspected = await lstat(sourcePath, { bigint: true })
    realArchivesDir = await realpath(archivesDir)
    const resolvedSource = await realpath(sourcePath)
    const expectedSource = resolve(realArchivesDir, relativePath)
    if (!inspected.isFile()
      || resolvedSource !== expectedSource
      || !isContained(realArchivesDir, resolvedSource)) {
      throw changed(options.projectPath)
    }
  }
  catch (error) {
    if (error instanceof ArchiveHistoryError)
      throw error
    if (isPermissionError(error))
      throw readFailed(options.projectPath)
    throw changed(options.projectPath)
  }

  let handle: FileHandle
  try {
    handle = await open(sourcePath, READ_NO_FOLLOW_FLAGS)
  }
  catch (error) {
    if (isPermissionError(error))
      throw readFailed(options.projectPath)
    throw changed(options.projectPath)
  }

  try {
    const opened = await handle.stat({ bigint: true })
    const currentRoot = await realpath(archivesDir)
    const currentSource = await realpath(sourcePath)
    if (!opened.isFile()
      || currentRoot !== realArchivesDir
      || currentSource !== resolve(currentRoot, relativePath)
      || !isContained(currentRoot, currentSource)
      || !sameIdentity(inspected, opened)
      || !sameSnapshot(inspected, opened)) {
      throw changed(options.projectPath)
    }
    if (opened.size > BigInt(options.maxFileBytes))
      throw tooLarge(options.projectPath, options.maxFileBytes)
    if (options.expectedSnapshot !== undefined
      && !sameFileSnapshot(options.expectedSnapshot, opened)) {
      throw changed(options.projectPath)
    }

    const content = await readBoundedArchive(handle, opened, options.projectPath, options.maxFileBytes)
    await validateCurrentArchivePath({
      sourcePath,
      archivesDir,
      relativePath,
      realArchivesDir,
      inspectedRoot,
      finalHandle: content.final,
      projectPath: options.projectPath,
    })
    return {
      sourcePath,
      archivesDir,
      content: content.content,
      bytes: content.bytes,
      snapshot: {
        device: content.final.dev,
        inode: content.final.ino,
        size: content.final.size,
        mtimeNs: content.final.mtimeNs,
        ctimeNs: content.final.ctimeNs,
      },
    }
  }
  catch (error) {
    if (error instanceof ArchiveHistoryError)
      throw error
    throw changed(options.projectPath)
  }
  finally {
    await handle.close()
  }
}

async function readBoundedArchive(
  handle: FileHandle,
  opened: BigIntStats,
  projectPath: string,
  maxFileBytes: number,
): Promise<{ content: string, bytes: number, final: BigIntStats }> {
  const buffer = Buffer.allocUnsafe(maxFileBytes + 1)
  let bytes = 0
  while (bytes < buffer.length) {
    const result = await handle.read(buffer, bytes, buffer.length - bytes, bytes)
    if (result.bytesRead === 0)
      break
    bytes += result.bytesRead
  }
  const final = await handle.stat({ bigint: true })
  if (bytes > maxFileBytes || final.size > BigInt(maxFileBytes))
    throw tooLarge(projectPath, maxFileBytes)
  if (!sameIdentity(opened, final)
    || !sameSnapshot(opened, final)
    || final.size !== BigInt(bytes)) {
    throw changed(projectPath)
  }
  return {
    content: buffer.subarray(0, bytes).toString('utf-8'),
    bytes,
    final,
  }
}

async function validateCurrentArchivePath(options: {
  sourcePath: string
  archivesDir: string
  relativePath: string
  realArchivesDir: string
  inspectedRoot: BigIntStats
  finalHandle: BigIntStats
  projectPath: string
}): Promise<void> {
  const currentRoot = await lstat(options.archivesDir, { bigint: true })
  const currentSource = await lstat(options.sourcePath, { bigint: true })
  const realCurrentRoot = await realpath(options.archivesDir)
  const realCurrentSource = await realpath(options.sourcePath)
  if (!currentRoot.isDirectory()
    || !currentSource.isFile()
    || !sameIdentity(options.inspectedRoot, currentRoot)
    || realCurrentRoot !== options.realArchivesDir
    || realCurrentSource !== resolve(realCurrentRoot, options.relativePath)
    || !isContained(realCurrentRoot, realCurrentSource)
    || !sameIdentity(currentSource, options.finalHandle)
    || !sameSnapshot(currentSource, options.finalHandle)) {
    throw changed(options.projectPath)
  }
}

function sameIdentity(
  left: { dev: bigint, ino: bigint },
  right: { dev: bigint, ino: bigint },
): boolean {
  return left.dev === right.dev && left.ino === right.ino
}

function sameSnapshot(
  left: { size: bigint, mtimeNs: bigint, ctimeNs: bigint },
  right: { size: bigint, mtimeNs: bigint, ctimeNs: bigint },
): boolean {
  return left.size === right.size
    && left.mtimeNs === right.mtimeNs
    && left.ctimeNs === right.ctimeNs
}

function sameFileSnapshot(
  left: ArchiveFileSnapshot,
  right: BigIntStats,
): boolean {
  return left.device === right.dev
    && left.inode === right.ino
    && left.size === right.size
    && left.mtimeNs === right.mtimeNs
    && left.ctimeNs === right.ctimeNs
}

function isContained(root: string, path: string): boolean {
  const candidate = relative(root, path)
  return candidate !== ''
    && candidate !== '..'
    && !candidate.startsWith(`..${sep}`)
    && !isAbsolute(candidate)
}

function changed(projectPath: string): ArchiveHistoryError {
  return new ArchiveHistoryError(
    'archive_file_changed',
    `archived Change is no longer the inspected readable regular file: ${projectPath}`,
  )
}

function tooLarge(projectPath: string, maxFileBytes: number): ArchiveHistoryError {
  return new ArchiveHistoryError(
    'archive_file_too_large',
    `archived Change exceeds the ${maxFileBytes}-byte inspection limit: ${projectPath}`,
  )
}

function readFailed(projectPath: string): ArchiveHistoryError {
  return new ArchiveHistoryError(
    'archive_read_failed',
    `unable to read archived Change ${projectPath}`,
  )
}

function isPermissionError(error: unknown): boolean {
  const code = (error as NodeJS.ErrnoException).code
  return code === 'EACCES' || code === 'EPERM'
}
