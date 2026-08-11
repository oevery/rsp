export const RUNTIME_DATABASE_FILENAME = 'runtime-v1.sqlite'
export const RUNTIME_STORE_SCHEMA_MAJOR = 1
export const RUNTIME_STORE_SCHEMA_VERSION = 4
export const RUNTIME_CONTEXT_PACKET_SCHEMA_VERSION = 1
export const RUNTIME_BUSY_TIMEOUT_MS = 5_000

export const RUNTIME_MAX_EVENT_PAYLOAD_BYTES = 16 * 1024
export const RUNTIME_MAX_RECEIPT_PAYLOAD_BYTES = 32 * 1024
export const RUNTIME_MAX_CHECKPOINT_PAYLOAD_BYTES = 64 * 1024
export const RUNTIME_MAX_CONTEXT_PACKET_BYTES = 64 * 1024
export const RUNTIME_MAX_DATABASE_BYTES = 64 * 1024 * 1024
export const RUNTIME_MAX_EVENTS_PER_RUN = 10_000
export const RUNTIME_MAX_DISPATCHES_PER_RUN = 2_048
export const RUNTIME_MAX_RUNS = 1_024
export const RUNTIME_MAX_CONTEXT_PACKETS_PER_RUN = 16
export const RUNTIME_MAX_PROJECTION_EVENTS = 200
export const RUNTIME_MAX_PROJECTION_RUNS = 50

export type RuntimeJsonPrimitive = boolean | number | string | null
export type RuntimeJson = RuntimeJsonPrimitive | RuntimeJson[] | { [key: string]: RuntimeJson }

export interface RuntimeProjectIdentity {
  projectId: string
  root: string
  filesystem: {
    device: string
    inode: string
  }
}

export interface RuntimeSchemaIdentity {
  major: number
  version: number
}

export type RuntimeDatabaseState
  = | 'absent'
    | 'ready'
    | 'migration-required'
    | 'unavailable'
    | 'incompatible'
    | 'corrupt'
    | 'invalid'

export interface RuntimeDatabaseInspection {
  state: RuntimeDatabaseState
  databasePath: string
  schema: RuntimeSchemaIdentity | null
  diagnostic: RuntimeDiagnostic | null
}

export type RuntimeContextPacketInspectionState = 'fresh' | 'stale'

export interface RuntimeContextPacketInspectionRecord {
  runId: string
  packetKey: string
  workRef: string
  state: RuntimeContextPacketInspectionState
  disposable: true
  reasons: string[]
  sourceSequence: number
  committedSequence: number
  schemaVersion: number
  expiresAt: string
  updatedAt: string
}

export interface RuntimeContextPacketInspection {
  records: RuntimeContextPacketInspectionRecord[]
  total: number
  returned: number
  hasMore: boolean
}

export interface RuntimeDiagnostic {
  code: string
  message: string
  action: string | null
}

export interface RuntimeRunInput {
  runId: string
  runKey: string
  workRef: string
  createdAt?: string
}

export interface RuntimeRun {
  runId: string
  runKey: string
  workRef: string
  nextSequence: number
  createdAt: string
  lastObservedAt: string
}

export interface RuntimeDispatchInput {
  runId: string
  dispatchId: string
  idempotencyKey: string
  lane: string
  workerId: string
  workerDisplayName?: string | null
  workerRole?: string | null
  parentEventId?: string | null
  payload?: RuntimeJson
  createdAt?: string
}

export type RuntimeDispatchRelationship
  = | 'root'
    | 'manager-root'
    | 'resolved'
    | 'same-dispatch'
    | 'missing'
    | 'later'
    | 'unresolved'

export interface RuntimeDispatch {
  runId: string
  dispatchId: string
  sequence: number
  lane: string
  workerId: string
  workerDisplayName: string | null
  workerRole: string | null
  parentEventId: string | null
  parentDispatchId: string | null
  relationship: RuntimeDispatchRelationship
  payload: RuntimeJson
  redactionCount: number
  createdAt: string
}

export type RuntimeActorType = 'manager' | 'worker' | 'system'

export interface RuntimeEventInput {
  runId: string
  eventId: string
  idempotencyKey: string
  kind: string
  actorType: RuntimeActorType
  actorId: string
  dispatchId?: string | null
  parentEventId?: string | null
  payload?: RuntimeJson
  observedAt?: string
}

export type RuntimeParentState = 'none' | 'missing' | 'before' | 'after'

export interface RuntimeEvent {
  runId: string
  eventId: string
  sequence: number
  kind: string
  actorType: RuntimeActorType
  actorId: string
  dispatchId: string | null
  parentEventId: string | null
  parentState: RuntimeParentState
  outOfOrder: boolean
  payload: RuntimeJson
  redactionCount: number
  observedAt: string
  committedAt: string
}

export interface RuntimeReceiptInput {
  runId: string
  receiptId: string
  dispatchId: string
  eventId: string
  idempotencyKey: string
  result: string
  actorId: string
  parentEventId?: string | null
  payload?: RuntimeJson
  observedAt?: string
}

export interface RuntimeReceipt {
  runId: string
  receiptId: string
  dispatchId: string
  dispatchSequence: number
  eventId: string
  sequence: number
  result: string
  payload: RuntimeJson
  redactionCount: number
  observedAt: string
  committedAt: string
}

export interface RuntimeCommitResult<T> {
  effect: T
  duplicate: boolean
  deliveryCount: number
  duplicateCount: number
}

export interface RuntimeDeliveryStatus {
  runId: string
  scope: 'dispatch' | 'event' | 'receipt'
  idempotencyKey: string
  effectId: string
  deliveryCount: number
  duplicateCount: number
  conflictCount: number
  firstDeliveredAt: string
  lastDeliveredAt: string
}

export interface RuntimeCheckpointInput {
  runId: string
  projector: string
  projectorVersion: string
  expectedVersion: number
  sourceSequence: number
  payload: RuntimeJson
  updatedAt?: string
}

export interface RuntimeCheckpoint {
  runId: string
  projector: string
  projectorVersion: string
  version: number
  sourceSequence: number
  payload: RuntimeJson
  redactionCount: number
  updatedAt: string
}

export interface RuntimeCheckpointResult {
  applied: boolean
  checkpoint: RuntimeCheckpoint | null
  currentVersion: number
}

export type RuntimeSourceRole = 'authority' | 'evidence'

export interface RuntimeSourceIdentity {
  key: string
  role: RuntimeSourceRole
  path: string
  contentHash: string
  revision?: string | null
}

export interface RuntimeFreshnessIdentity {
  projectId: string
  checkoutRoot: string
  workRef: string
  gitHead: string
  dirtyPathsHash: string
  authorityHash: string
  sources: RuntimeSourceIdentity[]
}

export interface RuntimeContextObservation {
  eventId: string
  sequence: number
  summary: string
}

export interface RuntimeContextEvidence {
  sourceKey: string
  summary: string
}

export interface RuntimeContextPacketData {
  phase: string
  authorityRefs: string[]
  decisiveObservations: RuntimeContextObservation[]
  blockers: string[]
  attention: string[]
  evidence: RuntimeContextEvidence[]
  changedPaths: string[]
  nextAction: string | null
}

export interface RuntimeContextPacketInput {
  runId: string
  packetKey: string
  expectedVersion: number
  sourceSequence: number
  freshness: RuntimeFreshnessIdentity
  data: RuntimeContextPacketData
  expiresAt: string
  updatedAt?: string
}

export interface RuntimeContextPacket {
  runId: string
  packetKey: string
  version: number
  sourceSequence: number
  schemaVersion: number
  freshness: RuntimeFreshnessIdentity
  data: RuntimeContextPacketData
  redactionCount: number
  expiresAt: string
  updatedAt: string
}

export interface RuntimeContextPacketResult {
  applied: boolean
  checkpoint: RuntimeContextPacket | null
  currentVersion: number
}

export type RuntimeContextHydrationState = 'absent' | 'fresh' | 'targeted-reread' | 'full-rebuild'

export interface RuntimeContextHydration {
  state: RuntimeContextHydrationState
  packet: RuntimeContextPacket | null
  staleSourceKeys: string[]
  rereadSourceKeys: string[]
  reasons: string[]
}

export interface RuntimeRetentionPolicy {
  now?: string
  runMaxAgeMs: number
  contextMaxAgeMs: number
  maxRuns?: number
  maxContextPacketsPerRun?: number
}

export interface RuntimeRetentionResult {
  deletedRuns: number
  deletedContextPackets: number
  retainedRuns: number
  appliedAt: string
}

export interface RuntimeRunProjection {
  available: boolean
  diagnostic: RuntimeDiagnostic | null
  schema: RuntimeSchemaIdentity | null
  run: RuntimeRun | null
  events: RuntimeEvent[]
  eventsTruncated: boolean
  dispatches: RuntimeDispatch[]
  dispatchesTruncated: boolean
  receipts: RuntimeReceipt[]
  receiptsTruncated: boolean
  deliveries: RuntimeDeliveryStatus[]
  deliveriesTruncated: boolean
}

export interface RuntimeProjectProjectionSnapshot {
  state: RuntimeDatabaseState
  schema: RuntimeSchemaIdentity | null
  diagnostic: RuntimeDiagnostic | null
  runs: RuntimeRun[]
  runsTruncated: boolean
  projections: RuntimeRunProjection[]
}

export class RuntimeStoreError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly action: string | null = null,
  ) {
    super(message)
    this.name = 'RuntimeStoreError'
  }
}
