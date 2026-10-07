import { Buffer } from 'node:buffer'
import { createHash, randomUUID } from 'node:crypto'
import { constants } from 'node:fs'
import { link, lstat, mkdir, mkdtemp, readdir, readFile, realpath, rename, rm, writeFile } from 'node:fs/promises'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'

export const ID = /^[a-f0-9]{64}$/
export const SLUG = /^[a-z0-9][a-z0-9-]*$/

export class ResearchError extends Error {
  constructor(kind, message, options) {
    super(message, options)
    this.kind = kind
  }
}

export function fail(kind, message) {
  throw new ResearchError(kind, message)
}

export function errorDetails(error) {
  const kind = error instanceof ResearchError ? error.kind : error.code === 'ENOENT' ? 'unavailable' : 'operational-error'
  return { kind, message: error.message }
}

export function hash(bytes) {
  return createHash('sha256').update(bytes).digest('hex')
}

export function canonical(value) {
  if (Array.isArray(value))
    return value.map(canonical)
  if (value && typeof value === 'object')
    return Object.fromEntries(Object.keys(value).sort().map(key => [key, canonical(value[key])]))
  return value
}

export function jsonBytes(value) {
  return Buffer.from(`${JSON.stringify(canonical(value), null, 2)}\n`)
}

export function portablePath(value) {
  if (typeof value !== 'string' || !value || value.includes('\\') || value.includes('\0') || isAbsolute(value) || /^[a-z]:/i.test(value) || value.split('/').some(part => !part || part === '.' || part === '..'))
    fail('invalid', `Unsafe relative path: ${JSON.stringify(value)}`)
  return value
}

export function slug(value) {
  if (typeof value !== 'string' || !SLUG.test(value) || ID.test(value))
    fail('invalid', 'Study/source names must be lowercase kebab-case, not an evidence hash')
  return value
}

export async function exists(path) {
  try {
    await lstat(path)
    return true
  }
  catch (error) {
    if (error.code === 'ENOENT')
      return false
    throw error
  }
}

// Every existing component is checked. Payload paths never follow symlinks.
export async function safePath(root, path) {
  portablePath(path)
  const base = await realpath(root)
  let current = base
  for (const part of path.split('/')) {
    current = join(current, part)
    try {
      if ((await lstat(current)).isSymbolicLink())
        fail('corrupt', `Symlink is not allowed in research storage: ${relative(base, current)}`)
    }
    catch (error) {
      if (error.code !== 'ENOENT')
        throw error
    }
  }
  return current
}

export async function readBytes(root, path) {
  const target = await safePath(root, path)
  const info = await lstat(target)
  if (!info.isFile())
    fail('corrupt', `Expected a regular file: ${path}`)
  return readFile(target, { flag: constants.O_RDONLY | constants.O_NOFOLLOW })
}

export async function readJson(root, path) {
  const bytes = await readBytes(root, path)
  try {
    return { bytes, value: JSON.parse(bytes.toString('utf8')) }
  }
  catch {
    fail('corrupt', `Invalid JSON: ${path}`)
  }
}

export async function entries(root, path) {
  const target = await safePath(root, path)
  try {
    return (await readdir(target)).sort()
  }
  catch (error) {
    if (error.code === 'ENOENT')
      return []
    throw error
  }
}

export async function inventory(root, prefix) {
  const result = []
  async function walk(path) {
    const target = await safePath(root, path)
    const info = await lstat(target)
    if (info.isDirectory()) {
      for (const child of await readdir(target))
        await walk(`${path}/${child}`)
    }
    else if (info.isFile()) {
      result.push(path.slice(prefix.length + 1))
    }
    else {
      fail('corrupt', `Unsupported payload type: ${path}`)
    }
  }
  await walk(prefix)
  return result.sort()
}

export async function ensureDirectory(root, path) {
  const target = await safePath(root, path)
  await mkdir(target, { recursive: true })
  await safePath(root, path)
  return target
}

// Hard-link publication is atomic and cannot replace an existing sealed file.
export async function publishFile(root, path, bytes) {
  const target = await safePath(root, path)
  await ensureDirectory(root, path.slice(0, path.lastIndexOf('/')))
  const temporary = join(dirname(target), `.tmp-${randomUUID()}`)
  try {
    await writeFile(temporary, bytes, { flag: 'wx' })
    try {
      await link(temporary, target)
      return true
    }
    catch (error) {
      if (error.code !== 'EEXIST')
        throw error
      if (!(await readBytes(root, path)).equals(Buffer.from(bytes)))
        fail('corrupt', `Occupied sealed path has different bytes: ${path}`)
      return false
    }
  }
  finally {
    await rm(temporary, { force: true })
  }
}

export async function writeDraft(root, path, bytes, expected) {
  if (expected === undefined)
    return publishNewDraft(root, path, bytes)
  const target = await safePath(root, path)
  if (!(await readBytes(root, path)).equals(expected))
    fail('invalid', 'Draft has unsealed edits; preserve or seal them before revising')
  const temporary = join(dirname(target), `.tmp-${randomUUID()}`)
  try {
    await writeFile(temporary, bytes, { flag: 'wx' })
    if (!(await readBytes(root, path)).equals(expected))
      fail('invalid', 'Draft changed while revising; retry after preserving those edits')
    await rename(temporary, target)
  }
  finally {
    await rm(temporary, { force: true })
  }
}

async function publishNewDraft(root, path, bytes) {
  if (await exists(await safePath(root, path)))
    fail('invalid', `Draft already exists: ${path}`)
  return publishFile(root, path, bytes)
}

// Evidence is assembled privately, then published in one directory rename.
// A lock serializes publishers for the same content id; readers never see staging.
export async function publishBundle(root, id, manifest, files, verifyExisting) {
  const store = await ensureDirectory(root, 'research/evidence')
  const destination = await safePath(root, `research/evidence/${id}`)
  const lock = join(store, `.publish-${id}`)
  try {
    await mkdir(lock)
  }
  catch (error) {
    if (error.code === 'EEXIST')
      fail('operational-error', `Evidence publisher is active or interrupted: ${relative(resolve(root), lock)}; inspect before removing its lock`)
    throw error
  }
  let temporary
  try {
    if (await exists(destination)) {
      await verifyExisting()
      return false
    }
    temporary = await mkdtemp(join(store, '.capture-'))
    await mkdir(join(temporary, 'files'))
    for (const file of files) {
      const target = join(temporary, 'files', portablePath(file.path))
      await mkdir(dirname(target), { recursive: true })
      await writeFile(target, file.bytes, { flag: 'wx' })
    }
    await writeFile(join(temporary, 'manifest.json'), manifest, { flag: 'wx' })
    await rename(temporary, destination)
    return true
  }
  finally {
    if (temporary)
      await rm(temporary, { force: true, recursive: true })
    await rm(lock, { recursive: true })
  }
}
