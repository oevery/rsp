import { lstatSync } from 'node:fs'
import { readdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

export interface ManagedDirectoryInspection {
  exists: boolean
  issue: ManagedPathError | null
}

export interface ManagedFileTreeInspection {
  rootExists: boolean
  files: string[]
  issues: ManagedPathError[]
}

export interface ManagedFileInspection {
  exists: boolean
  issue: ManagedPathError | null
}

export class ManagedPathError extends Error {
  constructor(
    public readonly path: string,
    message: string,
  ) {
    super(message)
    this.name = 'ManagedPathError'
  }
}

/** Inspect one managed directory without following a symlink. */
export function inspectManagedDirectory(path: string, label: string, options: { allowMissing?: boolean } = {}): ManagedDirectoryInspection {
  try {
    const stats = lstatSync(path)
    if (stats.isDirectory())
      return { exists: true, issue: null }
    return {
      exists: true,
      issue: new ManagedPathError(path, `${label} must be a real directory: ${path}`),
    }
  }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      if (options.allowMissing)
        return { exists: false, issue: null }
      return {
        exists: false,
        issue: new ManagedPathError(path, `${label} must be a real directory: ${path}`),
      }
    }
    const message = error instanceof Error ? error.message : String(error)
    return {
      exists: false,
      issue: new ManagedPathError(path, `unable to inspect ${label} ${path}: ${message}`),
    }
  }
}

/** Require one managed directory and return whether it already exists. */
export function requireManagedDirectory(path: string, label: string, options: { allowMissing?: boolean } = {}): boolean {
  const inspection = inspectManagedDirectory(path, label, options)
  if (inspection.issue)
    throw inspection.issue
  return inspection.exists
}

/** Inspect one managed file without following a symlink. */
export function inspectManagedFile(path: string, label: string, options: { allowMissing?: boolean } = {}): ManagedFileInspection {
  try {
    const stats = lstatSync(path)
    if (stats.isFile())
      return { exists: true, issue: null }
    return {
      exists: true,
      issue: new ManagedPathError(path, `${label} must be a regular file: ${path}`),
    }
  }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      if (options.allowMissing)
        return { exists: false, issue: null }
      return {
        exists: false,
        issue: new ManagedPathError(path, `${label} must be a regular file: ${path}`),
      }
    }
    const message = error instanceof Error ? error.message : String(error)
    return {
      exists: false,
      issue: new ManagedPathError(path, `unable to inspect ${label} ${path}: ${message}`),
    }
  }
}

/** Require one managed file and return whether it already exists. */
export function requireManagedFile(path: string, label: string, options: { allowMissing?: boolean } = {}): boolean {
  const inspection = inspectManagedFile(path, label, options)
  if (inspection.issue)
    throw inspection.issue
  return inspection.exists
}

/** Create a missing managed file without replacing an existing regular file. */
export async function ensureManagedFile(path: string, content: string, label: string): Promise<boolean> {
  if (requireManagedFile(path, label, { allowMissing: true }))
    return false
  await writeFile(path, content, { flag: 'wx' })
  return true
}

/** Create or replace one managed regular file without following an existing symlink. */
export async function writeManagedFile(path: string, content: string, label: string): Promise<void> {
  const exists = requireManagedFile(path, label, { allowMissing: true })
  if (exists)
    await writeFile(path, content)
  else
    await writeFile(path, content, { flag: 'wx' })
}

/** Validate every existing directory in a project-owned relative parent chain. */
export function resolveManagedDirectoryChain(root: string, segments: string[], label: string): string {
  requireManagedDirectory(root, `${label} root`)
  let current = root
  for (const segment of segments) {
    if (!segment || segment === '.' || segment === '..' || segment.includes('/') || segment.includes('\\'))
      throw new ManagedPathError(current, `${label} contains an invalid directory segment: ${segment}`)
    current = join(current, segment)
    requireManagedDirectory(current, label, { allowMissing: true })
  }
  return current
}

/** Recursively collect regular files without following symlinked entries. */
export async function inspectManagedFileTree(root: string, label: string, options: { allowMissing?: boolean } = {}): Promise<ManagedFileTreeInspection> {
  const result: ManagedFileTreeInspection = { rootExists: false, files: [], issues: [] }
  const rootInspection = inspectManagedDirectory(root, `${label} root`, options)
  if (rootInspection.issue) {
    result.issues.push(rootInspection.issue)
    return result
  }
  if (!rootInspection.exists)
    return result
  result.rootExists = true
  await collectManagedFiles(root, label, result)
  result.files.sort()
  return result
}

async function collectManagedFiles(directory: string, label: string, result: ManagedFileTreeInspection): Promise<void> {
  let entries
  try {
    entries = await readdir(directory, { withFileTypes: true })
  }
  catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    result.issues.push(new ManagedPathError(directory, `unable to inspect the ${label} tree at ${directory}: ${message}`))
    return
  }

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name.startsWith('.'))
      continue
    const path = join(directory, entry.name)
    if (entry.isDirectory()) {
      await collectManagedFiles(path, label, result)
      continue
    }
    if (entry.isFile()) {
      result.files.push(path)
      continue
    }
    result.issues.push(new ManagedPathError(path, `unsupported entry in the ${label} tree: ${path}`))
  }
}
