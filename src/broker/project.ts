import type { BrokerProjectIdentity } from './protocol.js'
import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { lstat, realpath, stat } from 'node:fs/promises'
import { dirname, isAbsolute, join, relative, resolve } from 'node:path'

import { promisify } from 'node:util'
import { BrokerError } from './protocol.js'

const execFileAsync = promisify(execFile)

export interface BrokerProjectScopedPath {
  relativePath: string
  absolutePath: string
}

interface BrokerProjectPathIdentity {
  path: string
  device: string
  inode: string
}

export interface BrokerProjectPathInspection {
  project: BrokerProjectIdentity
  relativePath: string
  absolutePath: string
  identities: BrokerProjectPathIdentity[]
}

export async function discoverBrokerProject(root = process.cwd()): Promise<BrokerProjectIdentity> {
  const requested = await realpath(resolve(root)).catch((error) => {
    throw new BrokerError('broker_project_not_found', `Unable to resolve project path ${root}: ${errorMessage(error)}`)
  })
  let checkoutRoot: string
  try {
    const result = await execFileAsync('git', ['-C', requested, 'rev-parse', '--show-toplevel'], {
      encoding: 'utf8',
      maxBuffer: 1024 * 1024,
      windowsHide: true,
    })
    checkoutRoot = await realpath(result.stdout.trim())
  }
  catch (error) {
    throw new BrokerError('broker_project_not_checkout', `Broker project must be inside one Git checkout: ${errorMessage(error)}`)
  }

  const value = await stat(checkoutRoot, { bigint: true })
  if (!value.isDirectory())
    throw new BrokerError('broker_project_invalid', `Broker project root must be a directory: ${checkoutRoot}`)
  const filesystem = {
    device: value.dev.toString(),
    inode: value.ino.toString(),
  }
  const projectId = createHash('sha256')
    .update(checkoutRoot)
    .update('\0')
    .update(filesystem.device)
    .update('\0')
    .update(filesystem.inode)
    .digest('hex')
  return {
    projectId,
    root: checkoutRoot,
    filesystem,
  }
}

export async function resolveBrokerProjectPath(
  project: BrokerProjectIdentity,
  projectRelativePath: string,
): Promise<BrokerProjectScopedPath> {
  if (!projectRelativePath
    || projectRelativePath.length > 4096
    || projectRelativePath.includes('\0')
    || projectRelativePath.includes('\\')
    || isAbsolute(projectRelativePath)) {
    throw new BrokerError('broker_project_path_invalid', 'Project paths must be non-empty project-relative POSIX paths')
  }
  const segments = projectRelativePath.split('/')
  if (segments.some(segment => !segment || segment === '.' || segment === '..'))
    throw new BrokerError('broker_project_path_invalid', `Project path contains an unsafe segment: ${projectRelativePath}`)

  const candidate = resolve(project.root, ...segments)
  if (!isWithin(project.root, candidate))
    throw new BrokerError('broker_project_path_escape', `Project path escapes its registered checkout: ${projectRelativePath}`)

  const existingAncestor = await closestExistingAncestor(candidate)
  const canonicalAncestor = await realpath(existingAncestor.logicalPath)
  if (!isWithin(project.root, canonicalAncestor))
    throw new BrokerError('broker_project_path_escape', `Project path resolves outside its registered checkout: ${projectRelativePath}`)

  const missingSuffix = relative(existingAncestor.logicalPath, candidate)
  const canonicalCandidate = missingSuffix ? join(canonicalAncestor, missingSuffix) : canonicalAncestor
  if (!isWithin(project.root, canonicalCandidate))
    throw new BrokerError('broker_project_path_escape', `Project path resolves outside its registered checkout: ${projectRelativePath}`)
  return {
    relativePath: segments.join('/'),
    absolutePath: canonicalCandidate,
  }
}

export async function lstatBrokerProjectPath(
  project: BrokerProjectIdentity,
  projectRelativePath: string,
): Promise<Awaited<ReturnType<typeof lstat>>> {
  return completeBrokerProjectPathInspection(
    await prepareBrokerProjectPathInspection(project, projectRelativePath),
  )
}

export async function prepareBrokerProjectPathInspection(
  project: BrokerProjectIdentity,
  projectRelativePath: string,
): Promise<BrokerProjectPathInspection> {
  const identities = await captureBrokerProjectPathIdentity(project, projectRelativePath)
  const scoped = await resolveBrokerProjectPath(project, projectRelativePath)
  return {
    project,
    relativePath: scoped.relativePath,
    absolutePath: scoped.absolutePath,
    identities,
  }
}

export async function completeBrokerProjectPathInspection(
  inspection: BrokerProjectPathInspection,
): Promise<Awaited<ReturnType<typeof lstat>>> {
  const value = await lstat(inspection.absolutePath)
  const after = await captureBrokerProjectPathIdentity(inspection.project, inspection.relativePath)
  if (!samePathIdentity(inspection.identities, after))
    throw new BrokerError('broker_project_path_changed', `Project path changed while it was being inspected: ${inspection.relativePath}`)
  return value
}

export function brokerProjectNamespace(projectsRoot: string, projectId: string): string {
  if (!/^[a-f0-9]{64}$/u.test(projectId))
    throw new BrokerError('broker_project_id_invalid', `Invalid Broker project identity: ${projectId}`)
  return join(projectsRoot, projectId)
}

function isWithin(parent: string, candidate: string): boolean {
  const child = relative(parent, candidate)
  return child === '' || (!child.startsWith('..') && !isAbsolute(child))
}

async function closestExistingAncestor(path: string): Promise<{ logicalPath: string }> {
  let cursor = path
  while (true) {
    try {
      await lstat(cursor)
      return { logicalPath: cursor }
    }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT')
        throw error
      const parent = dirname(cursor)
      if (parent === cursor)
        throw error
      cursor = parent
    }
  }
}

async function captureBrokerProjectPathIdentity(
  project: BrokerProjectIdentity,
  projectRelativePath: string,
): Promise<BrokerProjectPathIdentity[]> {
  const scoped = await resolveBrokerProjectPath(project, projectRelativePath)
  const identities: BrokerProjectPathIdentity[] = []
  let cursor = project.root
  const segments = scoped.relativePath.split('/')
  for (const segment of ['', ...segments]) {
    if (segment)
      cursor = join(cursor, segment)
    const value = await lstat(cursor, { bigint: true })
    if (value.isSymbolicLink())
      throw new BrokerError('broker_project_path_escape', `Project path crosses a symbolic link: ${projectRelativePath}`)
    identities.push({
      path: cursor,
      device: value.dev.toString(),
      inode: value.ino.toString(),
    })
  }
  const root = identities[0]!
  if (root.device !== project.filesystem.device || root.inode !== project.filesystem.inode)
    throw new BrokerError('broker_project_identity_changed', 'Registered project filesystem identity no longer matches the checkout root')
  return identities
}

function samePathIdentity(
  left: BrokerProjectPathIdentity[],
  right: BrokerProjectPathIdentity[],
): boolean {
  return left.length === right.length
    && left.every((identity, index) => {
      const candidate = right[index]
      return candidate?.path === identity.path
        && candidate.device === identity.device
        && candidate.inode === identity.inode
    })
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
