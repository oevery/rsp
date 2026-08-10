export interface BrokerVersionIdentity {
  major: number
  minor: number
}

export interface BrokerCompatibilityRequirement {
  protocol: BrokerVersionIdentity
  runtimeSchema: BrokerVersionIdentity
}

export interface BrokerCompatibilityResult {
  compatible: boolean
  reason: 'compatible' | 'protocol-major' | 'protocol-minor' | 'runtime-schema-major' | 'runtime-schema-minor'
  action: string | null
}

export interface BrokerPublicIdentity {
  instanceId: string
  pid: number
  processIdentity: string
  endpoint: string
  protocol: BrokerVersionIdentity
  runtimeSchema: BrokerVersionIdentity
  packageVersion: string
  startedAt: string
}

export interface BrokerDiscoveryRecord extends BrokerPublicIdentity {
  schema: 1
  controlToken: string
}

export interface BrokerHealthResponse {
  ok: true
  broker: BrokerPublicIdentity
}

export interface BrokerProjectFilesystemIdentity {
  device: string
  inode: string
}

export interface BrokerProjectIdentity {
  projectId: string
  root: string
  filesystem: BrokerProjectFilesystemIdentity
}

export interface BrokerProjectSessionPublic {
  projectId: string
  root: string
  filesystem: BrokerProjectFilesystemIdentity
  loadedAt: string
  lastAccessAt: string
}

export interface BrokerProjectRegistrationResponse {
  ok: true
  project: BrokerProjectSessionPublic
  accessToken: string
}

export interface BrokerStatusResponse {
  ok: true
  broker: BrokerPublicIdentity
  sessionCount: number
  sessions: BrokerProjectSessionPublic[]
  sessionsTruncated: boolean
}

export interface BrokerErrorResponse {
  ok: false
  error: {
    code: string
    message: string
  }
}

export const BROKER_DISCOVERY_SCHEMA = 1 as const
export const BROKER_MAX_JSON_RESPONSE_BYTES = 64 * 1024
export const BROKER_PROTOCOL_VERSION: BrokerVersionIdentity = Object.freeze({ major: 1, minor: 2 })
export const BROKER_RUNTIME_SCHEMA_VERSION: BrokerVersionIdentity = Object.freeze({ major: 1, minor: 1 })
export const BROKER_CLIENT_COMPATIBILITY: BrokerCompatibilityRequirement = Object.freeze({
  protocol: BROKER_PROTOCOL_VERSION,
  runtimeSchema: BROKER_RUNTIME_SCHEMA_VERSION,
})

export class BrokerError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'BrokerError'
  }
}

export function evaluateBrokerCompatibility(
  broker: Pick<BrokerPublicIdentity, 'protocol' | 'runtimeSchema'>,
  client: BrokerCompatibilityRequirement = BROKER_CLIENT_COMPATIBILITY,
): BrokerCompatibilityResult {
  if (broker.protocol.major !== client.protocol.major) {
    return {
      compatible: false,
      reason: 'protocol-major',
      action: incompatibleAction(
        `Broker protocol major ${broker.protocol.major} does not match client protocol major ${client.protocol.major}`,
      ),
    }
  }
  if (broker.protocol.minor < client.protocol.minor) {
    return {
      compatible: false,
      reason: 'protocol-minor',
      action: incompatibleAction(
        `Broker protocol ${broker.protocol.major}.${broker.protocol.minor} is older than the client minimum ${client.protocol.major}.${client.protocol.minor}`,
      ),
    }
  }
  if (broker.runtimeSchema.major !== client.runtimeSchema.major) {
    return {
      compatible: false,
      reason: 'runtime-schema-major',
      action: incompatibleAction(
        `Broker runtime schema major ${broker.runtimeSchema.major} does not match client schema major ${client.runtimeSchema.major}`,
      ),
    }
  }
  if (broker.runtimeSchema.minor < client.runtimeSchema.minor) {
    return {
      compatible: false,
      reason: 'runtime-schema-minor',
      action: incompatibleAction(
        `Broker runtime schema ${broker.runtimeSchema.major}.${broker.runtimeSchema.minor} is older than the client minimum ${client.runtimeSchema.major}.${client.runtimeSchema.minor}`,
      ),
    }
  }
  return { compatible: true, reason: 'compatible', action: null }
}

function incompatibleAction(reason: string): string {
  return `${reason}; run "rsp broker stop" with a compatible RSP package, then retry with the intended package version`
}

export function publicBrokerIdentity(record: BrokerDiscoveryRecord): BrokerPublicIdentity {
  const {
    instanceId,
    pid,
    processIdentity,
    endpoint,
    protocol,
    runtimeSchema,
    packageVersion,
    startedAt,
  } = record
  return {
    instanceId,
    pid,
    processIdentity,
    endpoint,
    protocol: { ...protocol },
    runtimeSchema: { ...runtimeSchema },
    packageVersion,
    startedAt,
  }
}

export function isBrokerErrorResponse(value: unknown): value is BrokerErrorResponse {
  if (!isObject(value) || value.ok !== false || !isObject(value.error))
    return false
  return typeof value.error.code === 'string' && typeof value.error.message === 'string'
}

export function isBrokerHealthResponse(value: unknown): value is BrokerHealthResponse {
  return isObject(value)
    && value.ok === true
    && isBrokerPublicIdentity(value.broker)
}

export function isBrokerProjectRegistrationResponse(value: unknown): value is BrokerProjectRegistrationResponse {
  return isObject(value)
    && value.ok === true
    && typeof value.accessToken === 'string'
    && value.accessToken.length >= 32
    && isBrokerProjectSessionPublic(value.project)
}

export function isBrokerStatusResponse(value: unknown): value is BrokerStatusResponse {
  return isObject(value)
    && value.ok === true
    && isBrokerPublicIdentity(value.broker)
    && Number.isSafeInteger(value.sessionCount)
    && Number(value.sessionCount) >= 0
    && Array.isArray(value.sessions)
    && value.sessions.every(isBrokerProjectSessionPublic)
    && value.sessions.length <= Number(value.sessionCount)
    && typeof value.sessionsTruncated === 'boolean'
    && value.sessionsTruncated === (value.sessions.length < Number(value.sessionCount))
}

export function parseBrokerDiscoveryRecord(value: unknown): BrokerDiscoveryRecord {
  if (!isObject(value) || value.schema !== BROKER_DISCOVERY_SCHEMA)
    throw new BrokerError('broker_discovery_invalid', 'Broker discovery metadata has an unsupported schema')
  const raw = value as Record<string, unknown>
  if (!isBrokerPublicIdentity(raw))
    throw new BrokerError('broker_discovery_invalid', 'Broker discovery metadata has invalid process or protocol identity')
  const controlToken = raw.controlToken
  if (typeof controlToken !== 'string' || controlToken.length < 32 || controlToken.length > 512)
    throw new BrokerError('broker_discovery_invalid', 'Broker discovery metadata has an invalid control token')
  return {
    schema: BROKER_DISCOVERY_SCHEMA,
    instanceId: value.instanceId,
    pid: value.pid,
    processIdentity: value.processIdentity,
    endpoint: value.endpoint,
    protocol: { ...value.protocol },
    runtimeSchema: { ...value.runtimeSchema },
    packageVersion: value.packageVersion,
    startedAt: value.startedAt,
    controlToken,
  }
}

function isBrokerPublicIdentity(value: unknown): value is BrokerPublicIdentity {
  if (!isObject(value))
    return false
  return isSafeIdentity(value.instanceId, 200)
    && Number.isSafeInteger(value.pid)
    && Number(value.pid) > 0
    && isSafeIdentity(value.processIdentity, 512)
    && isSafeIdentity(value.endpoint, 512)
    && isVersionIdentity(value.protocol)
    && isVersionIdentity(value.runtimeSchema)
    && isSafeIdentity(value.packageVersion, 200)
    && isIsoDate(value.startedAt)
}

function isBrokerProjectSessionPublic(value: unknown): value is BrokerProjectSessionPublic {
  return isObject(value)
    && /^[a-f0-9]{64}$/u.test(String(value.projectId))
    && typeof value.root === 'string'
    && value.root.length > 0
    && value.root.length <= 4096
    && isObject(value.filesystem)
    && isSafeIdentity(value.filesystem.device, 128)
    && isSafeIdentity(value.filesystem.inode, 128)
    && isIsoDate(value.loadedAt)
    && isIsoDate(value.lastAccessAt)
}

function isVersionIdentity(value: unknown): value is BrokerVersionIdentity {
  return isObject(value)
    && Number.isSafeInteger(value.major)
    && Number(value.major) >= 0
    && Number.isSafeInteger(value.minor)
    && Number(value.minor) >= 0
}

function isIsoDate(value: unknown): value is string {
  return typeof value === 'string'
    && value.length <= 100
    && Number.isFinite(Date.parse(value))
}

function isSafeIdentity(value: unknown, maximum: number): value is string {
  return typeof value === 'string'
    && value.length > 0
    && value.length <= maximum
    && !/[\r\n\0]/u.test(value)
}

function isObject(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
