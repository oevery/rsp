import type { BigIntStats } from 'node:fs'
import { lstat, realpath } from 'node:fs/promises'
import { isAbsolute, relative, resolve, sep } from 'node:path'

interface StableDirectoryIdentity {
  path: string
  realPath: string
  device: bigint
  inode: bigint
}

export interface StableDirectoryChain {
  rootPath: string
  targetPath: string
  requiredPath: string | null
  entries: StableDirectoryIdentity[]
}

export class StablePathIdentityError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'StablePathIdentityError'
  }
}

/**
 * Capture every real directory from one trusted boundary through an existing
 * target parent. No directory in the logical chain may be a symlink.
 */
export async function captureStableDirectoryChain(options: {
  rootPath: string
  targetPath: string
  requiredPath?: string
  label: string
}): Promise<StableDirectoryChain> {
  const rootPath = resolve(options.rootPath)
  const targetPath = resolve(options.targetPath)
  const requiredPath = options.requiredPath === undefined
    ? null
    : resolve(options.requiredPath)
  const targetRelative = containedRelative(rootPath, targetPath)
  if (targetRelative === null) {
    throw new StablePathIdentityError(
      'stable_path_outside_root',
      `${options.label} target must stay inside ${rootPath}: ${targetPath}`,
    )
  }
  if (requiredPath !== null) {
    if (containedRelative(rootPath, requiredPath) === null
      || containedRelative(requiredPath, targetPath) === null) {
      throw new StablePathIdentityError(
        'stable_path_outside_required_root',
        `${options.label} target must stay inside ${requiredPath}: ${targetPath}`,
      )
    }
  }

  const logicalPaths = [rootPath]
  if (targetRelative !== '') {
    let current = rootPath
    for (const segment of targetRelative.split(sep)) {
      current = resolve(current, segment)
      logicalPaths.push(current)
    }
  }

  const entries: StableDirectoryIdentity[] = []
  let rootRealPath: string | null = null
  let requiredRealPath: string | null = null
  for (const path of logicalPaths) {
    let value: BigIntStats
    let resolvedPath: string
    try {
      value = await lstat(path, { bigint: true })
      resolvedPath = await realpath(path)
    }
    catch (error) {
      throw new StablePathIdentityError(
        'stable_path_inspection_failed',
        `${options.label} parent chain could not be inspected at ${path}: ${errorMessage(error)}`,
      )
    }
    if (!value.isDirectory() || value.isSymbolicLink()) {
      throw new StablePathIdentityError(
        'stable_path_not_real_directory',
        `${options.label} parent chain must contain only real directories: ${path}`,
      )
    }
    rootRealPath ??= resolvedPath
    if (containedRelative(rootRealPath, resolvedPath) === null) {
      throw new StablePathIdentityError(
        'stable_path_real_containment_failed',
        `${options.label} parent chain resolves outside ${rootRealPath}: ${path}`,
      )
    }
    if (requiredPath === path)
      requiredRealPath = resolvedPath
    entries.push({
      path,
      realPath: resolvedPath,
      device: value.dev,
      inode: value.ino,
    })
  }

  if (requiredPath !== null) {
    const target = entries.at(-1)!
    if (requiredRealPath === null
      || containedRelative(requiredRealPath, target.realPath) === null) {
      throw new StablePathIdentityError(
        'stable_path_required_containment_failed',
        `${options.label} parent chain no longer resolves inside ${requiredPath}`,
      )
    }
  }

  return {
    rootPath,
    targetPath,
    requiredPath,
    entries,
  }
}

/** Revalidate realpath plus device/inode for the complete captured chain. */
export async function assertStableDirectoryChain(
  expected: StableDirectoryChain,
  label: string,
): Promise<void> {
  const current = await captureStableDirectoryChain({
    rootPath: expected.rootPath,
    targetPath: expected.targetPath,
    requiredPath: expected.requiredPath ?? undefined,
    label,
  })
  if (current.entries.length !== expected.entries.length)
    throw changed(label, expected.targetPath)
  for (let index = 0; index < expected.entries.length; index += 1) {
    const before = expected.entries[index]!
    const after = current.entries[index]!
    if (before.path !== after.path
      || before.realPath !== after.realPath
      || before.device !== after.device
      || before.inode !== after.inode) {
      throw changed(label, before.path)
    }
  }
}

export function isPathContained(rootPath: string, candidatePath: string): boolean {
  return containedRelative(resolve(rootPath), resolve(candidatePath)) !== null
}

function containedRelative(rootPath: string, candidatePath: string): string | null {
  const candidate = relative(rootPath, candidatePath)
  if (candidate === ''
    || (candidate !== '..'
      && !candidate.startsWith(`..${sep}`)
      && !isAbsolute(candidate))) {
    return candidate
  }
  return null
}

function changed(label: string, path: string): StablePathIdentityError {
  return new StablePathIdentityError(
    'stable_path_identity_changed',
    `${label} parent identity changed before the filesystem operation: ${path}`,
  )
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
