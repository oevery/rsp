import { Buffer } from 'node:buffer'
import { randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, open, rename, unlink } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'
import { TextDecoder } from 'node:util'

import { resolveExecutableChange } from '../core/change-group.js'
import { FOCUS_DIR, MAX_FOCUS_CAPSULE_BYTES, pc } from '../core/config.js'
import { cleanupEmptyParentDirs, guardRspInitialized } from '../core/filesystem.js'
import { withRspLock } from '../core/lock.js'
import { ensureManagedFile, requireManagedFile } from '../core/managed-path.js'
import { resolveFocusMarkerPath, resolveWorkRef, WorkRefError } from '../core/work-ref.js'

interface FocusOptions {
  capsuleFile?: string
}

export async function focusChange(name: string, options: FocusOptions = {}) {
  if (!name) {
    console.error(`  ${pc.red('Usage:')} rsp focus <name>`)
    process.exit(1)
  }
  guardRspInitialized()

  try {
    return await withRspLock('focus-change', async () => {
      const workRef = await resolveExecutableChange(name, { mustExist: true })
      const focusEntry = resolveFocusMarkerPath(workRef)
      await mkdir(FOCUS_DIR, { recursive: true })
      await mkdir(dirname(focusEntry), { recursive: true })
      if (options.capsuleFile === undefined)
        await ensureManagedFile(focusEntry, '', 'focus marker')
      else
        await replaceFocusCapsule(focusEntry, await readCapsule(options.capsuleFile))

      console.log(`  ${pc.green('Focused:')} ${workRef.name}`)
      console.log(`  ${pc.dim('focus.d')} → ${workRef.name}`)
      console.log()
    })
  }
  catch (error) {
    exitWorkRefError(error)
  }
}

async function readCapsule(source: string): Promise<string> {
  const bytes = source === '-'
    ? await readBoundedStdin()
    : await readRegularCapsuleFile(source)
  if (bytes.byteLength > MAX_FOCUS_CAPSULE_BYTES)
    throw new Error(`focus capsule exceeds ${MAX_FOCUS_CAPSULE_BYTES} UTF-8 bytes`)

  let content: string
  try {
    content = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  }
  catch {
    throw new Error('focus capsule must contain valid UTF-8')
  }
  if (Buffer.byteLength(content, 'utf-8') > MAX_FOCUS_CAPSULE_BYTES)
    throw new Error(`focus capsule exceeds ${MAX_FOCUS_CAPSULE_BYTES} UTF-8 bytes`)
  return content
}

async function replaceFocusCapsule(path: string, content: string): Promise<void> {
  requireManagedFile(path, 'focus marker', { allowMissing: true })
  const temporaryPath = join(dirname(path), `.${basename(path)}.${randomUUID()}.tmp`)
  let handle
  try {
    handle = await open(temporaryPath, 'wx')
    await handle.writeFile(content, 'utf-8')
    await handle.close()
    handle = undefined
    requireManagedFile(path, 'focus marker', { allowMissing: true })
    await rename(temporaryPath, path)
  }
  finally {
    await handle?.close().catch(() => {})
    await unlink(temporaryPath).catch((error) => {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT')
        throw error
    })
  }
}

async function readRegularCapsuleFile(path: string): Promise<Buffer> {
  requireManagedFile(path, 'focus capsule input')
  const handle = await open(path, 'r')
  try {
    if (!(await handle.stat()).isFile())
      throw new Error(`focus capsule input must be a regular file: ${path}`)
    return await handle.readFile()
  }
  finally {
    await handle.close()
  }
}

async function readBoundedStdin(): Promise<Buffer> {
  const chunks: Buffer[] = []
  let size = 0
  for await (const chunk of process.stdin) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    size += buffer.byteLength
    if (size > MAX_FOCUS_CAPSULE_BYTES)
      throw new Error(`focus capsule exceeds ${MAX_FOCUS_CAPSULE_BYTES} UTF-8 bytes`)
    chunks.push(buffer)
  }
  return Buffer.concat(chunks, size)
}

export async function unfocusChange(name: string) {
  if (!name) {
    console.error(`  ${pc.red('Usage:')} rsp unfocus <name>`)
    process.exit(1)
  }
  guardRspInitialized()

  try {
    return await withRspLock('unfocus-change', async () => {
      const workRef = resolveWorkRef(name, { executable: false, mustExist: false })
      const focusEntry = resolveFocusMarkerPath(workRef)
      if (!existsSync(focusEntry))
        throw new WorkRefError('focus_marker_not_found', `.rsp/focus.d/${name}`, name)
      await unlink(focusEntry)
      await cleanupEmptyParentDirs(focusEntry, FOCUS_DIR)

      console.log(`  ${pc.green('Unfocused:')} ${workRef.name}`)
      console.log(`  ${pc.dim('focus.d cleared')} → ${workRef.name}`)
      console.log()
    })
  }
  catch (error) {
    exitWorkRefError(error)
  }
}

function exitWorkRefError(error: unknown): never {
  if (error instanceof WorkRefError) {
    if (error.code === 'focus_marker_not_found')
      console.error(`  ${pc.red('Focus marker not found:')} ${error.message}`)
    else
      console.error(`  ${pc.red('Error:')} ${error.message}`)
    process.exit(1)
  }
  throw error
}
