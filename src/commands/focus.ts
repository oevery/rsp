import { Buffer } from 'node:buffer'
import { randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, open, rename, unlink } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'

import { resolveExecutableChange } from '../core/change-group.js'
import { FOCUS_DIR, MAX_FOCUS_CAPSULE_BYTES, RSP_DIR, RSP_RULES_PATH } from '../core/config.js'
import { cleanupEmptyParentDirs } from '../core/filesystem.js'
import { inspectFocusCapsuleBytes } from '../core/focus-capsule.js'
import { withRspLock } from '../core/lock.js'
import { ensureManagedFile, inspectManagedFile, requireManagedFile } from '../core/managed-path.js'
import { resolveFocusMarkerPath, resolveWorkRef, WorkRefError } from '../core/work-ref.js'

interface FocusOptions {
  capsuleFile?: string
}

export type FocusResult
  = | { ok: true, action: 'focus' | 'unfocus', workRef: string }
    | { ok: false, kind: 'usage' | 'error' | 'not-found', message: string }

export async function focusChange(name: string, options: FocusOptions = {}): Promise<FocusResult> {
  if (!name) {
    return { ok: false, kind: 'usage', message: 'rsp focus <name>' }
  }
  const initialization = inspectInitialization()
  if (initialization)
    return { ok: false, kind: 'error', message: initialization }

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

      return { ok: true, action: 'focus', workRef: workRef.name } as const
    })
  }
  catch (error) {
    return workRefFailure(error)
  }
}

async function readCapsule(source: string): Promise<string> {
  const bytes = source === '-'
    ? await readBoundedStdin()
    : await readRegularCapsuleFile(source)
  const inspection = inspectFocusCapsuleBytes(bytes)
  if (inspection.kind === 'invalid')
    throw new Error(inspection.message)
  if (inspection.kind === 'legacy')
    throw new Error('non-empty focus capsule writes require a valid <!-- rsp-focus:v1 --> capsule')
  return inspection.content
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

export async function unfocusChange(name: string): Promise<FocusResult> {
  if (!name) {
    return { ok: false, kind: 'usage', message: 'rsp unfocus <name>' }
  }
  const initialization = inspectInitialization()
  if (initialization)
    return { ok: false, kind: 'error', message: initialization }

  try {
    return await withRspLock('unfocus-change', async () => {
      const workRef = resolveWorkRef(name, { executable: false, mustExist: false })
      const focusEntry = resolveFocusMarkerPath(workRef)
      if (!existsSync(focusEntry))
        throw new WorkRefError('focus_marker_not_found', `.rsp/focus.d/${name}`, name)
      await unlink(focusEntry)
      await cleanupEmptyParentDirs(focusEntry, FOCUS_DIR)

      return { ok: true, action: 'unfocus', workRef: workRef.name } as const
    })
  }
  catch (error) {
    return workRefFailure(error)
  }
}

function workRefFailure(error: unknown): FocusResult {
  if (error instanceof WorkRefError) {
    if (error.code === 'focus_marker_not_found')
      return { ok: false, kind: 'not-found', message: error.message }
    return { ok: false, kind: 'error', message: error.message }
  }
  throw error
}

function inspectInitialization(): string | undefined {
  const rules = inspectManagedFile(RSP_RULES_PATH, 'fallback protocol', { allowMissing: true })
  const design = inspectManagedFile(`${RSP_DIR}/specs/design.md`, 'design Spec', { allowMissing: true })
  if (!rules.issue && !design.issue && rules.exists && design.exists)
    return undefined
  const initialized = existsSync(RSP_DIR)
  return `${initialized ? 'RSP project requires an update' : 'RSP is not initialized in this project'}\n  ${initialized ? 'Run: rsp update' : 'Run: rsp init'}`
}
