import type { BigIntStats } from 'node:fs'
import type { FileHandle } from 'node:fs/promises'
import { Buffer } from 'node:buffer'
import { constants } from 'node:fs'
import { lstat, open, realpath } from 'node:fs/promises'
import { dirname, isAbsolute, relative, resolve, sep } from 'node:path'
import { CHANGES_DIR } from '../core/config.js'
import { normalizeLogicalPath } from '../core/filesystem.js'
import { resolveWorkRefPath, WorkRefError } from '../core/work-ref.js'

const READ_NO_FOLLOW_FLAGS = constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0)
const DEFAULT_MAX_FILE_BYTES = 512 * 1024

export interface TuiWorkDocument {
  path: string
  content: string
}

export interface TuiWorkSource {
  document: (path: string) => Promise<TuiWorkDocument>
}

export class WorkDocumentError extends Error {
  constructor(public readonly code: 'work_document_unsafe' | 'work_document_changed' | 'work_document_too_large' | 'work_document_read_failed', message: string) {
    super(message)
    this.name = 'WorkDocumentError'
  }
}

export function createTuiWorkSource(options: { changesDir?: string, maxFileBytes?: number } = {}): TuiWorkSource {
  const changesDir = resolve(options.changesDir ?? CHANGES_DIR)
  const projectRoot = dirname(dirname(changesDir))
  const maxFileBytes = options.maxFileBytes ?? DEFAULT_MAX_FILE_BYTES
  return {
    document: path => readWorkDocument(resolve(path), { changesDir, maxFileBytes, projectRoot }),
  }
}

async function readWorkDocument(sourcePath: string, options: { changesDir: string, maxFileBytes: number, projectRoot: string }): Promise<TuiWorkDocument> {
  const projectPath = normalizeLogicalPath(relative(options.projectRoot, sourcePath))
  try {
    const ref = resolveWorkRefPath(sourcePath, { changesDir: options.changesDir, mustExist: true })
    if (resolve(ref.path) !== sourcePath)
      throw unsafe(projectPath)
  }
  catch (error) {
    if (error instanceof WorkDocumentError)
      throw error
    if (error instanceof WorkRefError)
      throw unsafe(projectPath)
    throw readFailed(projectPath)
  }

  let rootBefore: BigIntStats
  let sourceBefore: BigIntStats
  let realRoot: string
  let realSource: string
  try {
    rootBefore = await lstat(options.changesDir, { bigint: true })
    sourceBefore = await lstat(sourcePath, { bigint: true })
    realRoot = await realpath(options.changesDir)
    realSource = await realpath(sourcePath)
    const expectedRealSource = resolve(realRoot, relative(options.changesDir, sourcePath))
    if (!rootBefore.isDirectory() || !sourceBefore.isFile() || realSource !== expectedRealSource || !isContained(realRoot, realSource))
      throw unsafe(projectPath)
  }
  catch (error) {
    if (error instanceof WorkDocumentError)
      throw error
    throw unsafe(projectPath)
  }

  let handle: FileHandle
  try {
    handle = await open(sourcePath, READ_NO_FOLLOW_FLAGS)
  }
  catch {
    throw unsafe(projectPath)
  }

  try {
    const opened = await handle.stat({ bigint: true })
    if (!opened.isFile() || !sameIdentity(sourceBefore, opened) || !sameSnapshot(sourceBefore, opened))
      throw changed(projectPath)
    if (opened.size > BigInt(options.maxFileBytes))
      throw tooLarge(projectPath, options.maxFileBytes)
    const buffer = Buffer.allocUnsafe(options.maxFileBytes + 1)
    let bytes = 0
    while (bytes < buffer.length) {
      const result = await handle.read(buffer, bytes, buffer.length - bytes, bytes)
      if (result.bytesRead === 0)
        break
      bytes += result.bytesRead
    }
    const final = await handle.stat({ bigint: true })
    if (bytes > options.maxFileBytes || final.size > BigInt(options.maxFileBytes))
      throw tooLarge(projectPath, options.maxFileBytes)
    if (!sameIdentity(opened, final) || !sameSnapshot(opened, final) || final.size !== BigInt(bytes))
      throw changed(projectPath)

    const rootAfter = await lstat(options.changesDir, { bigint: true })
    const sourceAfter = await lstat(sourcePath, { bigint: true })
    const realRootAfter = await realpath(options.changesDir)
    const realSourceAfter = await realpath(sourcePath)
    if (!sameIdentity(rootBefore, rootAfter)
      || realRootAfter !== realRoot
      || realSourceAfter !== realSource
      || !sameIdentity(sourceAfter, final)
      || !sameSnapshot(sourceAfter, final)) {
      throw changed(projectPath)
    }
    return { path: projectPath, content: buffer.subarray(0, bytes).toString('utf8') }
  }
  catch (error) {
    if (error instanceof WorkDocumentError)
      throw error
    throw changed(projectPath)
  }
  finally {
    await handle.close()
  }
}

function sameIdentity(left: { dev: bigint, ino: bigint }, right: { dev: bigint, ino: bigint }): boolean {
  return left.dev === right.dev && left.ino === right.ino
}

function sameSnapshot(left: { size: bigint, mtimeNs: bigint, ctimeNs: bigint }, right: { size: bigint, mtimeNs: bigint, ctimeNs: bigint }): boolean {
  return left.size === right.size && left.mtimeNs === right.mtimeNs && left.ctimeNs === right.ctimeNs
}

function isContained(root: string, path: string): boolean {
  const candidate = relative(root, path)
  return candidate !== '' && candidate !== '..' && !candidate.startsWith(`..${sep}`) && !isAbsolute(candidate)
}

function unsafe(path: string): WorkDocumentError {
  return new WorkDocumentError('work_document_unsafe', `Work document is not an exact readable regular file: ${path}`)
}

function changed(path: string): WorkDocumentError {
  return new WorkDocumentError('work_document_changed', `Work document changed during inspection: ${path}`)
}

function tooLarge(path: string, limit: number): WorkDocumentError {
  return new WorkDocumentError('work_document_too_large', `Work document exceeds the ${limit}-byte limit: ${path}`)
}

function readFailed(path: string): WorkDocumentError {
  return new WorkDocumentError('work_document_read_failed', `Unable to read Work document: ${path}`)
}
