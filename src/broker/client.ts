import type { ChildProcess } from 'node:child_process'
import type { BrokerPaths } from './host.js'
import type { BrokerProcessAdapter, BrokerStartLockClaim } from './lock.js'

import type {
  BrokerCompatibilityRequirement,
  BrokerCompatibilityResult,
  BrokerDiscoveryRecord,
  BrokerProjectRegistrationResponse,
  BrokerPublicIdentity,
  BrokerStatusResponse,
} from './protocol.js'
import type { BrokerFileIdentity } from './storage.js'
import { Buffer } from 'node:buffer'
import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { parseLoopbackEndpoint, resolveBrokerPaths } from './host.js'
import {
  defaultBrokerProcessAdapter,
  serializeBrokerStartLockClaim,
  withBrokerStartLock,
} from './lock.js'
import {
  BROKER_CLIENT_COMPATIBILITY,
  BROKER_MAX_JSON_RESPONSE_BYTES,
  BROKER_PROTOCOL_VERSION,
  BrokerError,
  evaluateBrokerCompatibility,
  isBrokerErrorResponse,
  isBrokerHealthResponse,
  isBrokerProjectRegistrationResponse,
  isBrokerStatusResponse,
  parseBrokerDiscoveryRecord,
} from './protocol.js'
import { readBrokerJson, unlinkBrokerFileIfIdentity } from './storage.js'

export type BrokerInspectionState = 'absent' | 'stale' | 'running' | 'incompatible' | 'unhealthy' | 'invalid'

export interface BrokerInspection {
  state: BrokerInspectionState
  record: BrokerDiscoveryRecord | null
  file: BrokerFileIdentity | null
  compatibility: BrokerCompatibilityResult | null
  reason: string | null
}

export interface BrokerStartResult {
  record: BrokerDiscoveryRecord
  reused: boolean
}

export interface BrokerStopResult {
  stopped: boolean
  staleRecovered: boolean
  record: BrokerDiscoveryRecord | null
}

export interface BrokerRestartResult {
  record: BrokerDiscoveryRecord
  previousRecord: BrokerDiscoveryRecord | null
  restarted: boolean
  staleRecovered: boolean
}

export interface BrokerProjectConnection {
  broker: BrokerDiscoveryRecord
  project: BrokerProjectRegistrationResponse['project']
  accessToken: string
}

export interface BrokerClientOptions {
  paths?: BrokerPaths
  compatibility?: BrokerCompatibilityRequirement
  processAdapter?: BrokerProcessAdapter
  daemonEntry?: string
  startupTimeoutMs?: number
  requestTimeoutMs?: number
}

export async function inspectBroker(options: BrokerClientOptions = {}): Promise<BrokerInspection> {
  const paths = options.paths ?? resolveBrokerPaths()
  const processAdapter = options.processAdapter ?? defaultBrokerProcessAdapter
  let stored
  try {
    stored = await readBrokerJson(paths.discovery)
  }
  catch (error) {
    return {
      state: 'invalid',
      record: null,
      file: null,
      compatibility: null,
      reason: errorMessage(error),
    }
  }
  if (!stored) {
    return {
      state: 'absent',
      record: null,
      file: null,
      compatibility: null,
      reason: null,
    }
  }

  let record: BrokerDiscoveryRecord
  try {
    record = parseBrokerDiscoveryRecord(stored.value)
  }
  catch (error) {
    return {
      state: 'invalid',
      record: null,
      file: stored.file,
      compatibility: null,
      reason: errorMessage(error),
    }
  }

  const exists = processAdapter.exists(record.pid)
  const observedIdentity = exists ? await processAdapter.identity(record.pid) : null
  if (!exists) {
    return {
      state: 'stale',
      record,
      file: stored.file,
      compatibility: null,
      reason: `Recorded Broker pid ${record.pid} is not running`,
    }
  }
  if (observedIdentity === null) {
    return {
      state: 'unhealthy',
      record,
      file: stored.file,
      compatibility: null,
      reason: `Unable to observe the process-start identity for recorded Broker pid ${record.pid}`,
    }
  }
  if (observedIdentity !== record.processIdentity) {
    return {
      state: 'stale',
      record,
      file: stored.file,
      compatibility: null,
      reason: `Recorded Broker pid ${record.pid} has a different process-start identity`,
    }
  }

  try {
    parseLoopbackEndpoint(record.endpoint)
    const health = await brokerRequestJson(record, '/v1/health', {
      method: 'GET',
      timeoutMs: options.requestTimeoutMs,
    })
    if (!isBrokerHealthResponse(health))
      throw new BrokerError('broker_health_invalid', 'Broker health response does not match the public protocol')
    assertHealthOwnership(record, health.broker)
    const afterIdentity = await processAdapter.identity(record.pid)
    if (afterIdentity !== record.processIdentity)
      throw new BrokerError('broker_process_identity_changed', `Broker pid ${record.pid} changed identity during discovery`)
  }
  catch (error) {
    return {
      state: 'unhealthy',
      record,
      file: stored.file,
      compatibility: null,
      reason: errorMessage(error),
    }
  }

  const compatibility = evaluateBrokerCompatibility(
    record,
    options.compatibility ?? BROKER_CLIENT_COMPATIBILITY,
  )
  return {
    state: compatibility.compatible ? 'running' : 'incompatible',
    record,
    file: stored.file,
    compatibility,
    reason: compatibility.action,
  }
}

export async function startBroker(options: BrokerClientOptions = {}): Promise<BrokerStartResult> {
  const paths = options.paths ?? resolveBrokerPaths()
  const before = await inspectBroker({ ...options, paths })
  if (before.state === 'running')
    return { record: before.record!, reused: true }
  assertStartableInspection(before)

  return withBrokerStartLock(paths, 'start', async (claim) => {
    const current = await inspectBroker({ ...options, paths })
    if (current.state === 'running')
      return { record: current.record!, reused: true }
    assertStartableInspection(current)
    if (current.state === 'stale') {
      if (!current.file || !await unlinkBrokerFileIfIdentity(paths.discovery, current.file))
        throw new BrokerError('broker_stale_record_changed', 'Stale Broker discovery metadata changed before recovery')
    }

    return {
      record: await startFreshBroker(paths, claim, options),
      reused: false,
    }
  }, {
    processAdapter: options.processAdapter,
    timeoutMs: options.startupTimeoutMs,
  })
}

export async function getBrokerStatus(
  record: BrokerDiscoveryRecord,
  options: Pick<BrokerClientOptions, 'requestTimeoutMs'> = {},
): Promise<BrokerStatusResponse> {
  const value = await brokerRequestJson(record, '/v1/status', {
    method: 'GET',
    timeoutMs: options.requestTimeoutMs,
  })
  if (!isBrokerStatusResponse(value))
    throw new BrokerError('broker_status_invalid', 'Broker status response does not match the public protocol')
  assertHealthOwnership(record, value.broker)
  return value
}

export async function stopBroker(options: BrokerClientOptions = {}): Promise<BrokerStopResult> {
  const paths = options.paths ?? resolveBrokerPaths()
  const processAdapter = options.processAdapter ?? defaultBrokerProcessAdapter
  return withBrokerStartLock(paths, 'stop', async () => {
    const inspection = await inspectBroker({ ...options, paths })
    return stopInspectedBroker(paths, inspection, processAdapter, options)
  }, {
    processAdapter: options.processAdapter,
    timeoutMs: options.startupTimeoutMs,
  })
}

export async function restartBroker(options: BrokerClientOptions = {}): Promise<BrokerRestartResult> {
  const paths = options.paths ?? resolveBrokerPaths()
  const processAdapter = options.processAdapter ?? defaultBrokerProcessAdapter
  return withBrokerStartLock(paths, 'restart', async (claim) => {
    const inspection = await inspectBroker({ ...options, paths })
    const stopped = await stopInspectedBroker(paths, inspection, processAdapter, options, {
      allowSameProtocolMajor: true,
    })
    const record = await startFreshBroker(paths, claim, options)
    return {
      record,
      previousRecord: stopped.record,
      restarted: stopped.stopped,
      staleRecovered: stopped.staleRecovered,
    }
  }, {
    processAdapter: options.processAdapter,
    timeoutMs: options.startupTimeoutMs,
  })
}

export async function registerBrokerProject(
  record: BrokerDiscoveryRecord,
  root = process.cwd(),
  options: Pick<BrokerClientOptions, 'requestTimeoutMs'> = {},
): Promise<BrokerProjectConnection> {
  const value = await brokerRequestJson(record, '/v1/projects/register', {
    method: 'POST',
    body: { root },
    timeoutMs: options.requestTimeoutMs,
  })
  if (!isBrokerProjectRegistrationResponse(value))
    throw new BrokerError('broker_project_registration_invalid', 'Broker project registration response does not match the public protocol')
  return {
    broker: record,
    project: value.project,
    accessToken: value.accessToken,
  }
}

export async function ensureBrokerProjectSession(
  root = process.cwd(),
  options: BrokerClientOptions = {},
): Promise<BrokerProjectConnection> {
  const started = await startBroker(options)
  return registerBrokerProject(started.record, root, options)
}

export async function brokerProjectRequest(
  connection: BrokerProjectConnection,
  path: string,
  options: { method?: 'GET' | 'POST', origin?: string, body?: unknown, requestTimeoutMs?: number } = {},
): Promise<unknown> {
  return brokerRequestJson(connection.broker, path, {
    method: options.method ?? 'GET',
    token: connection.accessToken,
    origin: options.origin,
    body: options.body,
    timeoutMs: options.requestTimeoutMs,
  })
}

async function spawnBrokerDaemon(
  paths: BrokerPaths,
  claim: BrokerStartLockClaim,
  daemonEntry?: string,
): Promise<ChildProcess> {
  const entry = daemonEntry
    ?? process.env.RSP_BROKER_DAEMON_ENTRY
    ?? fileURLToPath(new URL('./broker-daemon.mjs', import.meta.url))
  const sqliteDisableFlag = process.execArgv.includes('--no-experimental-sqlite')
    ? ['--no-experimental-sqlite']
    : []
  const child = spawn(process.execPath, [...sqliteDisableFlag, entry], {
    detached: true,
    env: {
      ...process.env,
      RSP_BROKER_CACHE_HOME: paths.root,
      RSP_BROKER_STARTUP_CLAIM: serializeBrokerStartLockClaim(claim),
    },
    stdio: 'ignore',
    windowsHide: true,
  })
  await new Promise<void>((resolve, reject) => {
    child.once('error', reject)
    child.once('spawn', resolve)
  })
  child.unref()
  return child
}

async function startFreshBroker(
  paths: BrokerPaths,
  claim: BrokerStartLockClaim,
  options: BrokerClientOptions,
): Promise<BrokerDiscoveryRecord> {
  const child = await spawnBrokerDaemon(paths, claim, options.daemonEntry)
  if (!child.pid)
    throw new BrokerError('broker_start_failed', 'Broker process started without an observable pid')
  const deadline = Date.now() + (options.startupTimeoutMs ?? 10_000)
  while (Date.now() < deadline) {
    const inspection = await inspectBroker({ ...options, paths })
    if (inspection.state === 'running') {
      if (inspection.record?.pid !== child.pid)
        throw new BrokerError('broker_start_record_changed', 'Broker discovery metadata changed to another owner during startup')
      return inspection.record
    }
    if (inspection.state === 'incompatible')
      throw incompatibleError(inspection)
    if (inspection.state === 'invalid' || inspection.state === 'unhealthy')
      throw new BrokerError(`broker_${inspection.state}`, inspection.reason ?? `Broker became ${inspection.state} during startup`)
    await delay(25)
  }
  throw new BrokerError('broker_start_timeout', 'Broker process did not publish a healthy owned loopback endpoint before timeout')
}

async function stopInspectedBroker(
  paths: BrokerPaths,
  inspection: BrokerInspection,
  processAdapter: BrokerProcessAdapter,
  options: BrokerClientOptions,
  restartOptions: { allowSameProtocolMajor?: boolean } = {},
): Promise<BrokerStopResult> {
  if (inspection.state === 'absent')
    return { stopped: false, staleRecovered: false, record: null }
  if (inspection.state === 'stale') {
    if (!inspection.file || !await unlinkBrokerFileIfIdentity(paths.discovery, inspection.file))
      throw new BrokerError('broker_stale_record_changed', 'Stale Broker discovery metadata changed before recovery')
    return { stopped: false, staleRecovered: true, record: inspection.record }
  }
  if (inspection.state === 'incompatible') {
    const requiredMajor = options.compatibility?.protocol.major ?? BROKER_PROTOCOL_VERSION.major
    if (!restartOptions.allowSameProtocolMajor
      || !inspection.record
      || inspection.record.protocol.major !== requiredMajor) {
      throw incompatibleError(inspection)
    }
  }
  else if (inspection.state !== 'running') {
    throw new BrokerError(`broker_${inspection.state}`, inspection.reason ?? `Broker is ${inspection.state}`)
  }
  if (!inspection.record)
    throw new BrokerError('broker_invalid', 'Broker inspection did not retain one verified owner')

  const response = await brokerRequestJson(inspection.record, '/v1/control/stop', {
    method: 'POST',
    timeoutMs: options.requestTimeoutMs,
  })
  if (!isObject(response) || response.ok !== true || response.stopping !== true)
    throw new BrokerError('broker_stop_invalid', 'Broker stop response does not match the public protocol')
  const deadline = Date.now() + (options.startupTimeoutMs ?? 10_000)
  while (Date.now() < deadline) {
    const current = await readBrokerJson(paths.discovery).catch(() => null)
    if (!current)
      return { stopped: true, staleRecovered: false, record: inspection.record }
    const currentRecord = parseBrokerDiscoveryRecord(current.value)
    if (currentRecord.instanceId !== inspection.record.instanceId
      || currentRecord.pid !== inspection.record.pid
      || currentRecord.processIdentity !== inspection.record.processIdentity) {
      throw new BrokerError('broker_stop_record_changed', 'Broker discovery metadata changed to another owner during shutdown')
    }
    if (!processAdapter.exists(inspection.record.pid)) {
      await unlinkBrokerFileIfIdentity(paths.discovery, current.file)
      return { stopped: true, staleRecovered: false, record: inspection.record }
    }
    const currentIdentity = await processAdapter.identity(inspection.record.pid)
    if (currentIdentity !== null && currentIdentity !== inspection.record.processIdentity) {
      await unlinkBrokerFileIfIdentity(paths.discovery, current.file)
      return { stopped: true, staleRecovered: false, record: inspection.record }
    }
    await delay(25)
  }
  throw new BrokerError('broker_stop_timeout', 'Broker acknowledged shutdown but its owned discovery metadata remained present')
}

async function brokerRequestJson(
  record: BrokerDiscoveryRecord,
  path: string,
  options: {
    method: 'GET' | 'POST'
    token?: string
    origin?: string
    body?: unknown
    timeoutMs?: number
  },
): Promise<unknown> {
  const endpoint = parseLoopbackEndpoint(record.endpoint)
  const headers: Record<string, string> = {
    Authorization: `Bearer ${options.token ?? record.controlToken}`,
    Accept: 'application/json',
  }
  if (options.origin)
    headers.Origin = options.origin
  if (options.body !== undefined)
    headers['Content-Type'] = 'application/json'
  let response: Response
  try {
    response = await fetch(`${endpoint.endpoint}${path}`, {
      method: options.method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
      redirect: 'error',
      signal: AbortSignal.timeout(options.timeoutMs ?? 1_000),
    })
  }
  catch (error) {
    throw new BrokerError('broker_request_failed', `Broker endpoint request failed: ${errorMessage(error)}`)
  }
  const value = await readResponseJson(response)
  if (!response.ok) {
    if (isBrokerErrorResponse(value))
      throw new BrokerError(value.error.code, value.error.message)
    throw new BrokerError('broker_request_failed', `Broker endpoint returned HTTP ${response.status}`)
  }
  return value
}

async function readResponseJson(response: Response): Promise<unknown> {
  if (!response.body)
    throw new BrokerError('broker_response_invalid', 'Broker endpoint returned an empty response')
  const reader = response.body.getReader()
  const chunks: Uint8Array[] = []
  let total = 0
  while (true) {
    const { done, value } = await reader.read()
    if (done)
      break
    total += value.byteLength
    if (total > BROKER_MAX_JSON_RESPONSE_BYTES) {
      await reader.cancel()
      throw new BrokerError(
        'broker_response_too_large',
        `Broker response exceeds ${BROKER_MAX_JSON_RESPONSE_BYTES} bytes`,
      )
    }
    chunks.push(value)
  }
  const content = Buffer.concat(chunks.map(chunk => Buffer.from(chunk)), total).toString('utf8')
  try {
    return JSON.parse(content)
  }
  catch {
    throw new BrokerError('broker_response_invalid', 'Broker endpoint returned invalid JSON')
  }
}

function assertHealthOwnership(
  expected: BrokerDiscoveryRecord,
  observed: BrokerPublicIdentity,
): void {
  if (observed.instanceId !== expected.instanceId
    || observed.pid !== expected.pid
    || observed.processIdentity !== expected.processIdentity
    || observed.endpoint !== expected.endpoint
    || observed.protocol.major !== expected.protocol.major
    || observed.protocol.minor !== expected.protocol.minor
    || observed.runtimeSchema.major !== expected.runtimeSchema.major
    || observed.runtimeSchema.minor !== expected.runtimeSchema.minor
    || observed.packageVersion !== expected.packageVersion
    || observed.startedAt !== expected.startedAt) {
    throw new BrokerError('broker_endpoint_owner_mismatch', 'Broker health response does not belong to the recorded process and endpoint')
  }
}

function assertStartableInspection(inspection: BrokerInspection): void {
  if (inspection.state === 'absent' || inspection.state === 'stale')
    return
  if (inspection.state === 'incompatible')
    throw incompatibleError(inspection)
  throw new BrokerError(`broker_${inspection.state}`, inspection.reason ?? `Broker is ${inspection.state}`)
}

function incompatibleError(inspection: BrokerInspection): BrokerError {
  return new BrokerError(
    'broker_incompatible',
    inspection.compatibility?.action
    ?? inspection.reason
    ?? 'Broker protocol or runtime schema is incompatible with this client',
  )
}

function isObject(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

function delay(milliseconds: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}
