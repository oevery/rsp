import { Buffer } from 'node:buffer'
import { randomUUID } from 'node:crypto'
import { constants } from 'node:fs'
import { chmod, link, lstat, mkdir, open, rename, unlink } from 'node:fs/promises'
import { dirname } from 'node:path'

import { BrokerError } from './protocol.js'

const MAX_METADATA_BYTES = 64 * 1024

export interface BrokerFileIdentity {
  device: number
  inode: number
}

export interface BrokerStoredJson {
  value: unknown
  file: BrokerFileIdentity
}

export interface BrokerIdentityMutationOptions {
  afterQuarantine?: () => Promise<void>
}

interface BrokerTemporaryJson {
  path: string
}

export async function ensurePrivateDirectory(path: string): Promise<void> {
  await mkdir(path, { recursive: true, mode: 0o700 })
  const value = await lstat(path)
  if (!value.isDirectory() || value.isSymbolicLink())
    throw new BrokerError('broker_cache_invalid', `Broker cache path must be a real directory: ${path}`)
  if (process.platform !== 'win32')
    await chmod(path, 0o700)
}

export async function readBrokerJson(path: string): Promise<BrokerStoredJson | null> {
  let before
  try {
    before = await lstat(path)
  }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT')
      return null
    throw error
  }
  if (!before.isFile() || before.isSymbolicLink())
    throw new BrokerError('broker_metadata_invalid', `Broker metadata must be a regular file: ${path}`)

  const noFollow = typeof constants.O_NOFOLLOW === 'number' ? constants.O_NOFOLLOW : 0
  const handle = await open(path, constants.O_RDONLY | noFollow)
  try {
    const opened = await handle.stat()
    const after = await lstat(path)
    if (!opened.isFile()
      || !after.isFile()
      || after.isSymbolicLink()
      || before.dev !== opened.dev
      || before.ino !== opened.ino
      || after.dev !== opened.dev
      || after.ino !== opened.ino) {
      throw new BrokerError('broker_metadata_changed', `Broker metadata changed while it was being read: ${path}`)
    }
    if (opened.size > MAX_METADATA_BYTES)
      throw new BrokerError('broker_metadata_too_large', `Broker metadata exceeds ${MAX_METADATA_BYTES} bytes: ${path}`)
    const content = await readHandleBounded(handle, MAX_METADATA_BYTES)
    let value: unknown
    try {
      value = JSON.parse(content)
    }
    catch {
      throw new BrokerError('broker_metadata_invalid', `Broker metadata is not valid JSON: ${path}`)
    }
    return {
      value,
      file: { device: opened.dev, inode: opened.ino },
    }
  }
  finally {
    await handle.close()
  }
}

export async function writeBrokerJsonAtomic(path: string, value: unknown): Promise<void> {
  await ensurePrivateDirectory(dirname(path))
  const temporary = await writeTemporaryBrokerJson(path, value)
  try {
    await rename(temporary.path, path)
    if (process.platform !== 'win32')
      await chmod(path, 0o600)
  }
  catch (error) {
    await unlink(temporary.path).catch(() => undefined)
    throw error
  }
}

export async function writeBrokerJsonExclusiveAtomic(
  path: string,
  value: unknown,
  options: {
    beforePublish?: () => Promise<void>
  } = {},
): Promise<boolean> {
  await ensurePrivateDirectory(dirname(path))
  const temporary = await writeTemporaryBrokerJson(path, value)
  try {
    await options.beforePublish?.()
    try {
      await link(temporary.path, path)
    }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EEXIST')
        return false
      throw error
    }
    if (process.platform !== 'win32')
      await chmod(path, 0o600)
    return true
  }
  finally {
    await unlink(temporary.path).catch(() => undefined)
  }
}

export async function replaceBrokerJsonIfIdentity(
  path: string,
  expected: BrokerFileIdentity,
  value: unknown,
): Promise<boolean> {
  await ensurePrivateDirectory(dirname(path))
  const temporary = await writeTemporaryBrokerJson(path, value)
  const quarantine = quarantinePath(path)
  try {
    const moved = await quarantineBrokerPath(path, quarantine)
    if (!moved)
      return false
    const quarantined = await lstat(quarantine)
    if (!isExpectedRegularFile(quarantined, expected)) {
      await restoreQuarantinedBrokerPath(path, quarantine)
      return false
    }
    try {
      await link(temporary.path, path)
    }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST')
        throw error
      await unlink(quarantine)
      return false
    }
    if (process.platform !== 'win32')
      await chmod(path, 0o600)
    await unlink(quarantine)
    return true
  }
  finally {
    await unlink(temporary.path).catch(() => undefined)
  }
}

export async function unlinkBrokerFileIfIdentity(
  path: string,
  expected: BrokerFileIdentity,
  options: BrokerIdentityMutationOptions = {},
): Promise<boolean> {
  const quarantine = quarantinePath(path)
  const moved = await quarantineBrokerPath(path, quarantine)
  if (!moved)
    return false
  await options.afterQuarantine?.()
  const quarantined = await lstat(quarantine)
  if (!isExpectedRegularFile(quarantined, expected)) {
    await restoreQuarantinedBrokerPath(path, quarantine)
    return false
  }
  await unlink(quarantine)
  return true
}

async function writeTemporaryBrokerJson(path: string, value: unknown): Promise<BrokerTemporaryJson> {
  const content = `${JSON.stringify(value, null, 2)}\n`
  if (Buffer.byteLength(content) > MAX_METADATA_BYTES)
    throw new BrokerError('broker_metadata_too_large', `Broker metadata exceeds ${MAX_METADATA_BYTES} bytes: ${path}`)
  const temporary = `${path}.${process.pid}.${randomUUID()}.tmp`
  const handle = await open(temporary, 'wx', 0o600)
  try {
    await handle.writeFile(content, 'utf8')
    await handle.sync()
  }
  catch (error) {
    await handle.close().catch(() => undefined)
    await unlink(temporary).catch(() => undefined)
    throw error
  }
  await handle.close()
  return { path: temporary }
}

async function quarantineBrokerPath(path: string, quarantine: string): Promise<boolean> {
  try {
    await rename(path, quarantine)
    return true
  }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT')
      return false
    throw error
  }
}

async function restoreQuarantinedBrokerPath(path: string, quarantine: string): Promise<void> {
  try {
    await link(quarantine, path)
  }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'EEXIST')
      return
    throw new BrokerError(
      'broker_metadata_preserved',
      `Broker metadata changed during identity-scoped cleanup and was preserved at ${quarantine}`,
    )
  }
  await unlink(quarantine)
}

function quarantinePath(path: string): string {
  return `${path}.${process.pid}.${randomUUID()}.quarantine`
}

function isExpectedRegularFile(
  value: Awaited<ReturnType<typeof lstat>>,
  expected: BrokerFileIdentity,
): boolean {
  return value.isFile()
    && !value.isSymbolicLink()
    && value.dev === expected.device
    && value.ino === expected.inode
}

async function readHandleBounded(handle: Awaited<ReturnType<typeof open>>, maximum: number): Promise<string> {
  const chunks: Buffer[] = []
  let total = 0
  while (total <= maximum) {
    const remaining = maximum + 1 - total
    const buffer = Buffer.allocUnsafe(Math.min(64 * 1024, remaining))
    const { bytesRead } = await handle.read(buffer, 0, buffer.length, null)
    if (bytesRead === 0)
      break
    chunks.push(buffer.subarray(0, bytesRead))
    total += bytesRead
  }
  if (total > maximum)
    throw new BrokerError('broker_metadata_too_large', `Broker metadata exceeds ${maximum} bytes`)
  return Buffer.concat(chunks, total).toString('utf8')
}
