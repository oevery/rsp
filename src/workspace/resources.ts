import type { WorkspaceRecord, WorkspaceResourceLease } from './session.js'
import { createHash, randomUUID } from 'node:crypto'
import { link, mkdir, readFile, stat, unlink, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join, resolve } from 'node:path'

import { processExists, processIdentityFor } from './process.js'

function leaseRoot(): string {
  return resolve(process.env.XDG_CACHE_HOME || join(homedir(), '.cache'), 'rsp', 'resource-leases')
}

function validateResourceId(resourceId: string): string {
  const value = resourceId.trim()
  if (!value || value.length > 512 || /[\r\n]/.test(value))
    throw new Error('resource id must be one non-empty line of at most 512 characters')
  return value
}

function leasePath(resourceId: string): string {
  const key = createHash('sha256').update(resourceId).digest('hex')
  return join(leaseRoot(), `${key}.lock`)
}

function ownerLeasePath(resourceId: string, token: string): string {
  const key = createHash('sha256').update(resourceId).digest('hex')
  return join(leaseRoot(), `${key}.${token}.lease`)
}

function releaseGuardPath(resourceId: string): string {
  const key = createHash('sha256').update(resourceId).digest('hex')
  return join(leaseRoot(), `${key}.release`)
}

interface LeaseContent {
  ownerPid: number
  ownerIdentity?: string
  token: string
  resourceId: string
}

function parseLease(content: string): LeaseContent | null {
  const lines = content.split('\n')
  const ownerPid = Number(lines[0])
  if (!Number.isSafeInteger(ownerPid) || ownerPid <= 0)
    return null
  if (lines.length >= 5) {
    return {
      ownerPid,
      ownerIdentity: lines[1] || undefined,
      token: lines[2] || '',
      resourceId: lines[3] || '',
    }
  }
  return {
    ownerPid,
    token: lines[1] || '',
    resourceId: lines[2] || '',
  }
}

async function sameFile(firstPath: string, secondPath: string): Promise<boolean> {
  const [first, second] = await Promise.all([
    stat(firstPath).catch(() => null),
    stat(secondPath).catch(() => null),
  ])
  return Boolean(first && second && first.dev === second.dev && first.ino === second.ino)
}

async function acquire(
  resourceId: string,
  ownerPid: number,
  ownerIdentity: string,
): Promise<WorkspaceResourceLease> {
  const normalized = validateResourceId(resourceId)
  const path = leasePath(normalized)
  const token = randomUUID()
  const ownerPath = ownerLeasePath(normalized, token)
  const guardPath = releaseGuardPath(normalized)
  const content = `${ownerPid}\n${ownerIdentity}\n${token}\n${normalized}\n`
  await mkdir(dirname(path), { recursive: true })
  await writeFile(ownerPath, content, { flag: 'wx' })
  try {
    for (let attempt = 0; attempt < 20; attempt += 1) {
      if (await stat(guardPath).catch(() => null)) {
        await new Promise(resolve => setTimeout(resolve, 10))
        continue
      }
      try {
        await link(ownerPath, path)
        return { resourceId: normalized, path, token, ownerPath }
      }
      catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'EEXIST')
          throw error
        const lease = parseLease(await readFile(path, 'utf8').catch(() => ''))
        if (!lease)
          throw new Error(`exclusive resource lease is invalid: ${normalized}`)
        if (processExists(lease.ownerPid)) {
          const observedIdentity = lease.ownerIdentity
            ? await processIdentityFor(lease.ownerPid)
            : undefined
          if (!lease.ownerIdentity || observedIdentity === lease.ownerIdentity)
            throw new Error(`exclusive resource is already registered: ${normalized}`)
        }
        throw new Error(`exclusive resource lease is stale; stop or dispose its recorded activity before retrying: ${normalized}`)
      }
    }
    throw new Error(`exclusive resource release is still in progress: ${normalized}`)
  }
  catch (error) {
    await unlink(ownerPath).catch(() => undefined)
    throw error
  }
}

async function release(lease: WorkspaceResourceLease): Promise<void> {
  const normalized = validateResourceId(lease.resourceId)
  const expectedPath = leasePath(normalized)
  const expectedOwnerPath = ownerLeasePath(normalized, lease.token)
  if (lease.path !== expectedPath || lease.ownerPath !== expectedOwnerPath)
    throw new Error(`resource lease ownership metadata is invalid: ${normalized}`)
  const guardPath = releaseGuardPath(normalized)

  let ownsGuard = false
  for (let attempt = 0; attempt < 20; attempt += 1) {
    try {
      await link(expectedOwnerPath, guardPath)
      ownsGuard = true
      break
    }
    catch (error) {
      const code = (error as NodeJS.ErrnoException).code
      if (code === 'ENOENT') {
        if (!(await stat(expectedPath).catch(() => null)))
          return
        throw new Error(`resource lease owner file is missing: ${normalized}`)
      }
      if (code !== 'EEXIST')
        throw error
      await new Promise(resolve => setTimeout(resolve, 10))
    }
  }
  if (!ownsGuard)
    throw new Error(`resource lease release is already in progress: ${normalized}`)

  try {
    if (await sameFile(expectedPath, expectedOwnerPath))
      await unlink(expectedPath).catch(() => undefined)
  }
  finally {
    if (await sameFile(guardPath, expectedOwnerPath))
      await unlink(guardPath).catch(() => undefined)
    await unlink(expectedOwnerPath).catch(() => undefined)
  }
}

export async function acquireResourceLeases(
  _record: WorkspaceRecord,
  resourceIds: string[],
  ownerPid: number,
  ownerIdentity: string,
): Promise<WorkspaceResourceLease[]> {
  if (!Number.isSafeInteger(ownerPid) || ownerPid <= 0)
    throw new Error(`invalid resource owner pid: ${ownerPid}`)
  if (!ownerIdentity)
    throw new Error('resource owner process identity is required')
  const leases: WorkspaceResourceLease[] = []
  try {
    for (const resourceId of [...new Set(resourceIds)])
      leases.push(await acquire(resourceId, ownerPid, ownerIdentity))
    return leases
  }
  catch (error) {
    await releaseResourceLeases(leases)
    throw error
  }
}

export async function releaseResourceLeases(leases: WorkspaceResourceLease[]): Promise<void> {
  for (const lease of leases)
    await release(lease)
}
