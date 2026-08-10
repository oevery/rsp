import type { BrokerPaths } from './host.js'
import { randomUUID } from 'node:crypto'

import { dirname } from 'node:path'
import { processExists, processIdentityFor } from '../workspace/process.js'
import { BrokerError } from './protocol.js'
import {
  ensurePrivateDirectory,
  readBrokerJson,
  replaceBrokerJsonIfIdentity,
  unlinkBrokerFileIfIdentity,
  writeBrokerJsonExclusiveAtomic,
} from './storage.js'

export interface BrokerStartLockClaim {
  schema: 1
  pid: number
  processIdentity: string
  token: string
  operation: string
  acquiredAt: string
}

export interface BrokerProcessAdapter {
  exists: (pid: number) => boolean
  identity: (pid: number) => Promise<string | null>
}

export interface BrokerStartLockOptions {
  processAdapter?: BrokerProcessAdapter
  timeoutMs?: number
  retryMs?: number
  beforePublish?: () => Promise<void>
}

export const defaultBrokerProcessAdapter: BrokerProcessAdapter = {
  exists: processExists,
  identity: processIdentityFor,
}

export async function withBrokerStartLock<T>(
  paths: BrokerPaths,
  operation: string,
  action: (claim: BrokerStartLockClaim) => Promise<T>,
  options: BrokerStartLockOptions = {},
): Promise<T> {
  const processAdapter = options.processAdapter ?? defaultBrokerProcessAdapter
  const timeoutMs = options.timeoutMs ?? 10_000
  const retryMs = options.retryMs ?? 25
  const currentIdentity = await processAdapter.identity(process.pid)
  if (!currentIdentity)
    throw new BrokerError('broker_process_identity_unavailable', 'Unable to observe the startup client process identity')

  await ensurePrivateDirectory(dirname(paths.startLock))
  const record: BrokerStartLockClaim = {
    schema: 1,
    pid: process.pid,
    processIdentity: currentIdentity,
    token: randomUUID(),
    operation,
    acquiredAt: new Date().toISOString(),
  }
  const deadline = Date.now() + timeoutMs
  let acquired = false
  while (!acquired && Date.now() < deadline) {
    if (await writeBrokerJsonExclusiveAtomic(paths.startLock, record, {
      beforePublish: options.beforePublish,
    })) {
      acquired = true
      break
    }

    const stored = await readBrokerJson(paths.startLock).catch((error) => {
      if (error instanceof BrokerError && error.code === 'broker_metadata_changed')
        return null
      throw error
    })
    if (!stored)
      continue
    const owner = parseBrokerStartLockClaim(stored.value)
    const ownerExists = processAdapter.exists(owner.pid)
    const ownerIdentity = ownerExists ? await processAdapter.identity(owner.pid) : null
    if (!ownerExists || (ownerIdentity !== null && ownerIdentity !== owner.processIdentity)) {
      await unlinkBrokerFileIfIdentity(paths.startLock, stored.file)
      continue
    }
    await delay(retryMs)
  }
  if (!acquired)
    throw new BrokerError('broker_start_lock_timeout', 'Timed out waiting for the Broker singleton startup lock')

  try {
    return await action(record)
  }
  finally {
    const stored = await readBrokerJson(paths.startLock).catch(() => null)
    if (stored) {
      const current = parseBrokerStartLockClaim(stored.value)
      if (sameStartLockClaim(current, record))
        await unlinkBrokerFileIfIdentity(paths.startLock, stored.file)
    }
  }
}

export async function claimBrokerDaemonStart(
  paths: BrokerPaths,
  clientClaim: BrokerStartLockClaim,
  processAdapter: BrokerProcessAdapter = defaultBrokerProcessAdapter,
): Promise<BrokerStartLockClaim> {
  const daemonIdentity = await processAdapter.identity(process.pid)
  if (!daemonIdentity)
    throw new BrokerError('broker_process_identity_unavailable', 'Unable to observe the Broker daemon process identity')
  const stored = await readBrokerJson(paths.startLock)
  if (!stored)
    throw new BrokerError('broker_start_claim_lost', 'Broker startup claim no longer exists')
  const current = parseBrokerStartLockClaim(stored.value)
  if (!sameStartLockClaim(current, clientClaim))
    throw new BrokerError('broker_start_claim_lost', 'Broker startup claim belongs to another startup owner')
  if (!processAdapter.exists(clientClaim.pid))
    throw new BrokerError('broker_start_claim_lost', 'Broker startup client exited before the daemon claimed startup ownership')
  const clientIdentity = await processAdapter.identity(clientClaim.pid)
  if (clientIdentity === null || clientIdentity !== clientClaim.processIdentity)
    throw new BrokerError('broker_start_claim_lost', 'Broker startup client identity changed before daemon ownership transfer')

  const daemonClaim: BrokerStartLockClaim = {
    ...clientClaim,
    pid: process.pid,
    processIdentity: daemonIdentity,
  }
  if (!await replaceBrokerJsonIfIdentity(paths.startLock, stored.file, daemonClaim))
    throw new BrokerError('broker_start_claim_lost', 'Broker startup claim changed during daemon ownership transfer')
  await assertBrokerStartLockClaim(paths, daemonClaim, processAdapter)
  return daemonClaim
}

export async function assertBrokerStartLockClaim(
  paths: BrokerPaths,
  expected: BrokerStartLockClaim,
  processAdapter: BrokerProcessAdapter = defaultBrokerProcessAdapter,
): Promise<void> {
  const stored = await readBrokerJson(paths.startLock)
  if (!stored)
    throw new BrokerError('broker_start_claim_lost', 'Broker startup claim no longer exists')
  const current = parseBrokerStartLockClaim(stored.value)
  if (!sameStartLockClaim(current, expected))
    throw new BrokerError('broker_start_claim_lost', 'Broker startup claim belongs to another owner')
  if (!processAdapter.exists(expected.pid))
    throw new BrokerError('broker_start_claim_lost', 'Broker startup claim owner is no longer running')
  const identity = await processAdapter.identity(expected.pid)
  if (identity === null || identity !== expected.processIdentity)
    throw new BrokerError('broker_start_claim_lost', 'Broker startup claim owner identity changed')
}

export async function releaseBrokerStartLockClaim(
  paths: BrokerPaths,
  expected: BrokerStartLockClaim,
): Promise<boolean> {
  const stored = await readBrokerJson(paths.startLock).catch(() => null)
  if (!stored)
    return false
  const current = parseBrokerStartLockClaim(stored.value)
  if (!sameStartLockClaim(current, expected))
    return false
  return unlinkBrokerFileIfIdentity(paths.startLock, stored.file)
}

export function serializeBrokerStartLockClaim(claim: BrokerStartLockClaim): string {
  return JSON.stringify(claim)
}

export function parseBrokerStartLockClaim(value: unknown): BrokerStartLockClaim {
  if (!isObject(value)
    || value.schema !== 1
    || !Number.isSafeInteger(value.pid)
    || Number(value.pid) <= 0
    || !safeLine(value.processIdentity, 512)
    || !safeLine(value.token, 200)
    || !safeLine(value.operation, 200)
    || !safeLine(value.acquiredAt, 100)
    || !Number.isFinite(Date.parse(value.acquiredAt))) {
    throw new BrokerError(
      'broker_start_lock_invalid',
      'Broker startup lock metadata is invalid; remove it only after confirming that no Broker startup is running',
    )
  }
  return {
    schema: 1,
    pid: value.pid,
    processIdentity: value.processIdentity,
    token: value.token,
    operation: value.operation,
    acquiredAt: value.acquiredAt,
  }
}

export function parseBrokerStartLockClaimEnvironment(value: string | undefined): BrokerStartLockClaim {
  if (!value || value.length > 4096)
    throw new BrokerError('broker_start_claim_missing', 'Broker daemon requires one bounded startup claim')
  let parsed: unknown
  try {
    parsed = JSON.parse(value)
  }
  catch {
    throw new BrokerError('broker_start_claim_invalid', 'Broker daemon startup claim is not valid JSON')
  }
  return parseBrokerStartLockClaim(parsed)
}

function sameStartLockClaim(first: BrokerStartLockClaim, second: BrokerStartLockClaim): boolean {
  return first.schema === second.schema
    && first.pid === second.pid
    && first.processIdentity === second.processIdentity
    && first.token === second.token
    && first.operation === second.operation
    && first.acquiredAt === second.acquiredAt
}

function isObject(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function safeLine(value: unknown, maximum: number): value is string {
  return typeof value === 'string'
    && value.length > 0
    && value.length <= maximum
    && !/[\r\n\0]/u.test(value)
}

function delay(milliseconds: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}
