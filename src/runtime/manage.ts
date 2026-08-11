import type { BrokerClientOptions, BrokerProjectConnection } from '../broker/client.js'
import type {
  RuntimeCommitResult,
  RuntimeContextHydration,
  RuntimeContextPacket,
  RuntimeContextPacketData,
  RuntimeContextPacketInput,
  RuntimeContextPacketResult,
  RuntimeDeliveryStatus,
  RuntimeDispatch,
  RuntimeEvent,
  RuntimeFreshnessIdentity,
  RuntimeJson,
  RuntimeProjectIdentity,
  RuntimeProjectProjectionSnapshot,
  RuntimeReceipt,
  RuntimeRun,
  RuntimeRunProjection,
} from './model.js'
import type { RuntimeEventStore } from './store.js'
import { Buffer } from 'node:buffer'
import { isAbsolute } from 'node:path'
import {
  brokerProjectRequest,
  inspectBroker,
  registerBrokerProject,
} from '../broker/client.js'
import { RuntimeStoreError } from './model.js'

export const MANAGE_RUNTIME_CAPABILITY_NAME = 'rsp.manage-runtime'
export const MANAGE_RUNTIME_CAPABILITY_VERSION = Object.freeze({ major: 1, minor: 0 })
export const MANAGE_RUNTIME_CONTEXT_PACKET_KEY = 'manage-resume'
export const MANAGE_RUNTIME_MAX_PROJECTION_ITEMS = 32
export const MANAGE_RUNTIME_MAX_ATTENTION_ITEMS = 32
export const MANAGE_RUNTIME_MAX_CONTEXT_BYTES = 12 * 1024
export const MANAGE_RUNTIME_MAX_CONTEXT_AGE_MS = 24 * 60 * 60 * 1000

const MANAGE_RUNTIME_MAX_REFERENCE_ITEMS = 32
const MANAGE_RUNTIME_MAX_REFERENCE_BYTES = 512
const MANAGE_RUNTIME_MAX_SUMMARY_BYTES = 1_024
const MANAGE_RUNTIME_MAX_PATH_BYTES = 4_096
const MANAGE_RUNTIME_PROJECTION_SCAN_ITEMS = 200
const MANAGE_RUNTIME_EVENT_KINDS = new Set<ManageRuntimeEventKind>([
  'manage-event',
  'manage-attention',
  'manage-paused',
  'manage-resumed',
  'manage-terminal',
])
const MANAGE_RUNTIME_INCOMPLETE_RECEIPT_RESULTS = new Set([
  'boundary-changed',
  'capability-unavailable',
  'unavailable',
])

export interface ManageRuntimeDescriptor {
  name: typeof MANAGE_RUNTIME_CAPABILITY_NAME
  version: {
    major: number
    minor: number
  }
  limits: {
    attentionItems: number
    contextBytes: number
    projectionItems: number
  }
}

export interface ManageRuntimeDiagnostic {
  code: string
  message: string
  action: string | null
}

export type ManageRuntimeDiscovery
  = | {
    available: true
    capability: ManageRuntimeCapability
    diagnostic: null
  }
  | {
    available: false
    capability: null
    diagnostic: ManageRuntimeDiagnostic
  }

export interface ManageRuntimeUseResult<T> {
  available: boolean
  value: T | null
  diagnostic: ManageRuntimeDiagnostic | null
}

export interface ManageRuntimeRunObservationInput {
  runId: string
  runKey: string
  workRef: string
  managerId: string
  eventId: string
  idempotencyKey: string
  phase: string
  authorityRefs: string[]
  evidenceRefs: string[]
  observedAt?: string
}

export interface ManageRuntimeDispatchObservationInput {
  runId: string
  dispatchId: string
  idempotencyKey: string
  lane: string
  workerId: string
  workerDisplayName?: string | null
  workerRole?: string | null
  objectiveRef: string
  evidenceRefs: string[]
  stopBoundary: string
  parentEventId?: string | null
  createdAt?: string
}

export type ManageRuntimeEventKind
  = | 'manage-event'
    | 'manage-attention'
    | 'manage-paused'
    | 'manage-resumed'
    | 'manage-terminal'

export interface ManageRuntimeEventObservationInput {
  runId: string
  eventId: string
  idempotencyKey: string
  kind: ManageRuntimeEventKind
  actorType: 'manager' | 'worker' | 'system'
  actorId: string
  dispatchId?: string | null
  parentEventId?: string | null
  phase?: string
  summary?: string
  evidenceRefs?: string[]
  sourceRefs?: string[]
  stopBoundary?: string | null
  attentionKind?: string
  observedAt?: string
}

export interface ManageRuntimeAttentionObservationInput extends Omit<
  ManageRuntimeEventObservationInput,
  'attentionKind' | 'kind'
> {
  attentionKind: string
}

export interface ManageRuntimePauseObservationInput extends Omit<
  ManageRuntimeEventObservationInput,
  'attentionKind' | 'kind' | 'sourceRefs'
> {
  phase: string
  summary: string
}

export interface ManageRuntimeResumeObservationInput extends Omit<
  ManageRuntimeEventObservationInput,
  'attentionKind' | 'kind' | 'sourceRefs'
> {
  phase: string
  summary: string
}

export interface ManageRuntimeTerminalObservationInput extends Omit<
  ManageRuntimeEventObservationInput,
  'attentionKind' | 'kind' | 'sourceRefs' | 'stopBoundary'
> {
  phase: string
  summary: string
  stopBoundary: string
}

export interface ManageRuntimeReceiptObservationInput {
  runId: string
  receiptId: string
  dispatchId: string
  eventId: string
  idempotencyKey: string
  result: string
  actorId: string
  laneObjectiveRef: string
  evidenceRefs: string[]
  changedPaths: string[]
  verificationRefs: string[]
  stopBoundary: string
  parentEventId?: string | null
  observedAt?: string
}

export interface ManageRuntimeRunObservationResult {
  run: RuntimeRun
  event: RuntimeCommitResult<RuntimeEvent>
}

export interface ManageRuntimeSourceReference {
  type: 'run' | 'dispatch' | 'event' | 'receipt'
  id: string
  sequence: number | null
}

export interface ManageRuntimeProjectedEvent {
  eventId: string
  sequence: number
  kind: string
  actorType: RuntimeEvent['actorType']
  actorId: string
  dispatchId: string | null
  phase: string | null
  summary: string | null
  evidenceRefs: string[]
  sourceRefs: string[]
  stopBoundary: string | null
  parentRef?: string | null
  observedAt?: string
  parentState: RuntimeEvent['parentState']
  outOfOrder: boolean
  deliveryCount: number
  duplicateCount: number
  conflictCount: number
  source: ManageRuntimeSourceReference
}

export interface ManageRuntimeProjectedDispatch {
  dispatchId: string
  sequence: number
  lane: string
  workerId: string
  workerDisplayName: string | null
  workerRole: string | null
  parentRef?: string | null
  parentDispatchId: string | null
  relationship: RuntimeDispatch['relationship']
  createdAt?: string
  parentState: RuntimeEvent['parentState']
  outOfOrder: boolean
  objectiveRef: string | null
  evidenceRefs: string[]
  stopBoundary: string | null
  receiptState: 'received' | 'missing' | 'unknown'
  terminalState: 'safe' | 'incomplete' | 'missing' | 'unknown'
  receiptId: string | null
  receiptResult: string | null
  deliveryCount: number
  duplicateCount: number
  conflictCount: number
  source: ManageRuntimeSourceReference
}

export interface ManageRuntimeProjectedReceipt {
  receiptId: string
  eventId: string
  sequence: number
  dispatchId: string
  actorId: string
  result: string
  laneObjectiveRef: string | null
  evidenceRefs: string[]
  changedPaths: string[]
  verificationRefs: string[]
  stopBoundary: string | null
  parentRef?: string | null
  observedAt?: string
  deliveryCount: number
  duplicateCount: number
  conflictCount: number
  source: ManageRuntimeSourceReference
}

export interface ManageRuntimeProjectedActor {
  actorType: 'manager' | 'worker'
  actorId: string
  dispatchId: string | null
  lane: string | null
}

export interface ManageRuntimeTimelineItem {
  type: 'dispatch' | 'event' | 'receipt'
  id: string
  sequence: number
  actorType: RuntimeEvent['actorType']
  actorId: string
  dispatchId: string | null
  kind: string
  summary: string | null
  parentRef?: string | null
  parentDispatchId?: string | null
  relationship?: RuntimeDispatch['relationship']
  workerDisplayName?: string | null
  workerRole?: string | null
  createdAt?: string
  observedAt?: string
  receiptState?: ManageRuntimeProjectedDispatch['receiptState']
  terminalState?: ManageRuntimeProjectedDispatch['terminalState']
  parentState: RuntimeEvent['parentState'] | null
  outOfOrder: boolean
  duplicateCount: number
  conflictCount: number
  source: ManageRuntimeSourceReference
}

export interface ManageRuntimeProjectionFreshness {
  projectId: string
  workRef: string | null
  sourceSequence: number
  generatedAt: string
}

export interface ManageRuntimeRunProjection {
  available: boolean
  authoritative: false
  diagnostic: ManageRuntimeDiagnostic | null
  freshness: ManageRuntimeProjectionFreshness
  run: RuntimeRun | null
  status: 'absent' | 'observed' | 'paused' | 'terminal-observed'
  managerId: string | null
  phase: string | null
  authorityRefs: string[]
  evidenceRefs: string[]
  terminalBoundary: ManageRuntimeSourceReference | null
  terminalDeliveryObserved: boolean
  actors: ManageRuntimeProjectedActor[]
  dispatches: ManageRuntimeProjectedDispatch[]
  receipts: ManageRuntimeProjectedReceipt[]
  events: ManageRuntimeProjectedEvent[]
  timeline: ManageRuntimeTimelineItem[]
  truncated: boolean
}

export type ManageRuntimeAttentionKind
  = | 'boundary-changed'
    | 'missing-receipt'
    | 'projection-truncated'
    | 'runtime-attention'
    | 'runtime-unavailable'

export interface ManageRuntimeAttentionItem {
  kind: ManageRuntimeAttentionKind
  summary: string
  dispatchId: string | null
  receiptId: string | null
  sourceRefs: ManageRuntimeSourceReference[]
}

export interface ManageRuntimeAttentionProjection {
  available: boolean
  authoritative: false
  diagnostic: ManageRuntimeDiagnostic | null
  freshness: ManageRuntimeProjectionFreshness
  items: ManageRuntimeAttentionItem[]
  truncated: boolean
}

export interface ManageRuntimeProjectProjection {
  state: RuntimeProjectProjectionSnapshot['state']
  available: boolean
  authoritative: false
  diagnostic: ManageRuntimeDiagnostic | null
  generatedAt: string
  runs: ManageRuntimeRunProjection[]
  runsTruncated: boolean
  attention: ManageRuntimeAttentionItem[]
  attentionTruncated: boolean
}

export interface ManageRuntimeContextInput extends Omit<
  RuntimeContextPacketInput,
  'expiresAt' | 'packetKey' | 'updatedAt'
> {}

export interface ManageRuntimeHydrationRequest {
  runId: string
  freshness: RuntimeFreshnessIdentity
}

export interface ManageRuntimeHydrationProjection {
  state: RuntimeContextHydration['state'] | 'unavailable'
  mode: 'selective' | 'full-reread'
  packet: RuntimeContextPacket | null
  reusableEvidenceSourceKeys: string[]
  rereadSourceKeys: string[]
  staleSourceKeys: string[]
  reasons: string[]
  currentAuthorityWins: true
}

export interface ManageRuntimeCapability {
  descriptor: ManageRuntimeDescriptor
  project: RuntimeProjectIdentity
  observeRun: (input: ManageRuntimeRunObservationInput) => Promise<ManageRuntimeRunObservationResult>
  observeDispatch: (input: ManageRuntimeDispatchObservationInput) => Promise<RuntimeCommitResult<RuntimeDispatch>>
  observeEvent: (input: ManageRuntimeEventObservationInput) => Promise<RuntimeCommitResult<RuntimeEvent>>
  observeReceipt: (input: ManageRuntimeReceiptObservationInput) => Promise<RuntimeCommitResult<RuntimeReceipt>>
  observeAttention: (input: ManageRuntimeAttentionObservationInput) => Promise<RuntimeCommitResult<RuntimeEvent>>
  observePause: (input: ManageRuntimePauseObservationInput) => Promise<RuntimeCommitResult<RuntimeEvent>>
  observeResume: (input: ManageRuntimeResumeObservationInput) => Promise<RuntimeCommitResult<RuntimeEvent>>
  observeTerminal: (input: ManageRuntimeTerminalObservationInput) => Promise<RuntimeCommitResult<RuntimeEvent>>
  projectRun: (runId: string, limit?: number) => Promise<ManageRuntimeRunProjection>
  projectAttention: (runId: string, limit?: number) => Promise<ManageRuntimeAttentionProjection>
  saveContext: (input: ManageRuntimeContextInput) => Promise<RuntimeContextPacketResult>
  hydrateContext: (input: ManageRuntimeHydrationRequest) => Promise<ManageRuntimeHydrationProjection>
}

export type ManageRuntimeServiceRequest
  = | { operation: 'observe-run', input: ManageRuntimeRunObservationInput }
    | { operation: 'observe-dispatch', input: ManageRuntimeDispatchObservationInput }
    | { operation: 'observe-event', input: ManageRuntimeEventObservationInput }
    | { operation: 'observe-receipt', input: ManageRuntimeReceiptObservationInput }
    | { operation: 'project-run', input: { runId: string, limit?: number } }
    | { operation: 'project-attention', input: { runId: string, limit?: number } }
    | { operation: 'save-context', input: ManageRuntimeContextInput }
    | { operation: 'hydrate-context', input: ManageRuntimeHydrationRequest }

export interface DiscoverBrokerManageRuntimeOptions extends BrokerClientOptions {
  root?: string
}

export const MANAGE_RUNTIME_DESCRIPTOR: ManageRuntimeDescriptor = Object.freeze({
  name: MANAGE_RUNTIME_CAPABILITY_NAME,
  version: { ...MANAGE_RUNTIME_CAPABILITY_VERSION },
  limits: {
    attentionItems: MANAGE_RUNTIME_MAX_ATTENTION_ITEMS,
    contextBytes: MANAGE_RUNTIME_MAX_CONTEXT_BYTES,
    projectionItems: MANAGE_RUNTIME_MAX_PROJECTION_ITEMS,
  },
})

export async function useOptionalManageRuntime<T>(
  discovery: ManageRuntimeDiscovery,
  operation: (capability: ManageRuntimeCapability) => Promise<T>,
): Promise<ManageRuntimeUseResult<T>> {
  if (!discovery.available) {
    return {
      available: false,
      value: null,
      diagnostic: discovery.diagnostic,
    }
  }
  try {
    return {
      available: true,
      value: await operation(discovery.capability),
      diagnostic: null,
    }
  }
  catch (error) {
    return {
      available: true,
      value: null,
      diagnostic: diagnosticFromError(error),
    }
  }
}

export function createStoreManageRuntimeCapability(
  store: RuntimeEventStore,
  now: () => Date = () => new Date(),
): ManageRuntimeCapability {
  const execute = async (request: ManageRuntimeServiceRequest) =>
    executeManageRuntimeServiceRequest(store, request, now)
  return createManageRuntimeCapability(store.project, execute)
}

export async function discoverBrokerManageRuntimeCapability(
  options: DiscoverBrokerManageRuntimeOptions = {},
): Promise<ManageRuntimeDiscovery> {
  const inspection = await inspectBroker(options)
  if (inspection.state !== 'running' || !inspection.record) {
    return {
      available: false,
      capability: null,
      diagnostic: {
        code: `manage_runtime_broker_${inspection.state}`,
        message: inspection.reason ?? `Compatible Broker is ${inspection.state}`,
        action: inspection.compatibility?.action ?? null,
      },
    }
  }
  try {
    const connection = await registerBrokerProject(
      inspection.record,
      options.root ?? process.cwd(),
      options,
    )
    const descriptorResponse = await brokerProjectRequest(
      connection,
      manageRuntimeCapabilityPath(connection),
      { requestTimeoutMs: options.requestTimeoutMs },
    )
    const descriptor = parseCapabilityResponse(descriptorResponse)
    if (descriptor.version.major !== MANAGE_RUNTIME_CAPABILITY_VERSION.major
      || descriptor.version.minor < MANAGE_RUNTIME_CAPABILITY_VERSION.minor) {
      return {
        available: false,
        capability: null,
        diagnostic: {
          code: 'manage_runtime_capability_incompatible',
          message: `Managed runtime capability ${descriptor.version.major}.${descriptor.version.minor} is incompatible`,
          action: 'Run rsp broker restart with the intended package, then retry managed runtime discovery',
        },
      }
    }
    return {
      available: true,
      capability: createBrokerManageRuntimeCapability(connection, descriptor, options.requestTimeoutMs),
      diagnostic: null,
    }
  }
  catch (error) {
    return {
      available: false,
      capability: null,
      diagnostic: diagnosticFromError(error),
    }
  }
}

export function executeManageRuntimeServiceRequest(
  store: RuntimeEventStore,
  requestInput: unknown,
  now: () => Date = () => new Date(),
): unknown {
  const request = normalizeServiceRequest(requestInput)
  switch (request.operation) {
    case 'observe-run':
      return observeRun(store, request.input)
    case 'observe-dispatch':
      return observeDispatch(store, request.input)
    case 'observe-event':
      return observeEvent(store, request.input)
    case 'observe-receipt':
      return observeReceipt(store, request.input)
    case 'project-run':
      return projectManageRun(store, request.input.runId, request.input.limit, now)
    case 'project-attention':
      return projectManageAttention(store, request.input.runId, request.input.limit, now)
    case 'save-context':
      return saveManageContext(store, request.input, now)
    case 'hydrate-context':
      return projectManageHydration(
        store.hydrateContextPacket(
          request.input.runId,
          MANAGE_RUNTIME_CONTEXT_PACKET_KEY,
          request.input.freshness,
        ),
        request.input.freshness,
      )
  }
}

export function projectManageRun(
  store: RuntimeEventStore,
  runIdInput: string,
  limitInput = MANAGE_RUNTIME_MAX_PROJECTION_ITEMS,
  now: () => Date = () => new Date(),
): ManageRuntimeRunProjection {
  const runId = boundedIdentity(runIdInput, 'run id')
  const limit = projectionLimit(limitInput, MANAGE_RUNTIME_MAX_PROJECTION_ITEMS)
  const projection = store.projectRun(runId, MANAGE_RUNTIME_PROJECTION_SCAN_ITEMS)
  return projectManageRunSnapshot(store.project.projectId, projection, limit, now)
}

export function projectManageRunSnapshot(
  projectId: string,
  projection: RuntimeRunProjection,
  limit: number,
  now: () => Date,
): ManageRuntimeRunProjection {
  const sourceSequence = projection.run ? projection.run.nextSequence - 1 : 0
  const deliveriesByEffect = new Map(
    projection.deliveries.map(delivery => [deliveryKey(delivery.scope, delivery.effectId), delivery]),
  )
  const receiptsByDispatch = new Map(projection.receipts.map(receipt => [receipt.dispatchId, receipt]))
  const dispatches = projection.dispatches.slice(0, limit).map((dispatch) => {
    const receipt = receiptsByDispatch.get(dispatch.dispatchId)
    const payload = runtimeObject(dispatch.payload)
    const delivery = deliveriesByEffect.get(deliveryKey('dispatch', dispatch.dispatchId))
    const parentState = dispatchParentState(dispatch.relationship)
    const receiptState = receipt
      ? 'received'
      : projection.receiptsTruncated ? 'unknown' : 'missing'
    return {
      dispatchId: dispatch.dispatchId,
      sequence: dispatch.sequence,
      lane: dispatch.lane,
      workerId: dispatch.workerId,
      workerDisplayName: dispatch.workerDisplayName,
      workerRole: dispatch.workerRole,
      parentRef: dispatch.parentEventId,
      parentDispatchId: dispatch.parentDispatchId,
      relationship: dispatch.relationship,
      createdAt: dispatch.createdAt,
      parentState,
      outOfOrder: parentState === 'after' || parentState === 'missing',
      objectiveRef: boundedOptionalString(payload.objectiveRef),
      evidenceRefs: projectedStringList(payload.evidenceRefs),
      stopBoundary: boundedOptionalString(payload.stopBoundary),
      receiptState,
      terminalState: receipt
        ? MANAGE_RUNTIME_INCOMPLETE_RECEIPT_RESULTS.has(receipt.result) ? 'incomplete' : 'safe'
        : projection.receiptsTruncated ? 'unknown' : 'missing',
      receiptId: receipt?.receiptId ?? null,
      receiptResult: receipt?.result ?? null,
      deliveryCount: delivery?.deliveryCount ?? 1,
      duplicateCount: delivery?.duplicateCount ?? 0,
      conflictCount: delivery?.conflictCount ?? 0,
      source: sourceReference('dispatch', dispatch.dispatchId, dispatch.sequence),
    } satisfies ManageRuntimeProjectedDispatch
  })
  const events = projection.events
    .filter(event => event.kind !== 'worker-receipt')
    .slice(0, limit)
    .map(event => projectEvent(event, deliveriesByEffect.get(deliveryKey('event', event.eventId))))
  const receipts = projection.receipts.slice(0, limit).map((receipt) => {
    const payload = runtimeObject(receipt.payload)
    const event = projection.events.find(candidate => candidate.eventId === receipt.eventId)
    const delivery = deliveriesByEffect.get(deliveryKey('receipt', receipt.receiptId))
    return {
      receiptId: receipt.receiptId,
      eventId: receipt.eventId,
      sequence: receipt.sequence,
      dispatchId: receipt.dispatchId,
      actorId: event?.actorId ?? '',
      result: receipt.result,
      laneObjectiveRef: boundedOptionalString(payload.laneObjectiveRef),
      evidenceRefs: projectedStringList(payload.evidenceRefs),
      changedPaths: projectedStringList(payload.changedPaths),
      verificationRefs: projectedStringList(payload.verificationRefs),
      stopBoundary: boundedOptionalString(payload.stopBoundary),
      parentRef: event?.parentEventId ?? null,
      observedAt: receipt.observedAt,
      deliveryCount: delivery?.deliveryCount ?? 1,
      duplicateCount: delivery?.duplicateCount ?? 0,
      conflictCount: delivery?.conflictCount ?? 0,
      source: sourceReference('receipt', receipt.receiptId, receipt.sequence),
    } satisfies ManageRuntimeProjectedReceipt
  })
  const terminalEvent = [...projection.events]
    .reverse()
    .find(event => event.kind === 'manage-terminal') ?? null
  const truncated = projection.eventsTruncated
    || projection.dispatchesTruncated
    || projection.receiptsTruncated
    || projection.deliveriesTruncated
    || projection.events.length > limit
    || projection.dispatches.length > limit
  return {
    available: projection.available,
    authoritative: false,
    diagnostic: projection.diagnostic,
    freshness: {
      projectId,
      workRef: projection.run?.workRef ?? null,
      sourceSequence,
      generatedAt: now().toISOString(),
    },
    run: projection.run,
    status: projection.run === null
      ? 'absent'
      : terminalEvent
        ? 'terminal-observed'
        : [...projection.events].reverse().some(event => event.kind === 'manage-paused')
            ? 'paused'
            : 'observed',
    managerId: projection.events.find(event => event.kind === 'manage-run-started')?.actorId ?? null,
    phase: latestProjectedPhase(projection.events),
    authorityRefs: projectedStringList(runtimeObject(
      projection.events.find(event => event.kind === 'manage-run-started')?.payload ?? {},
    ).authorityRefs),
    evidenceRefs: uniqueStrings([
      ...projectedStringList(runtimeObject(
        projection.events.find(event => event.kind === 'manage-run-started')?.payload ?? {},
      ).evidenceRefs),
      ...dispatches.flatMap(dispatch => dispatch.evidenceRefs),
      ...receipts.flatMap(receipt => receipt.evidenceRefs),
      ...events.flatMap(event => event.evidenceRefs),
    ]).slice(0, MANAGE_RUNTIME_MAX_REFERENCE_ITEMS),
    terminalBoundary: terminalEvent
      ? sourceReference('event', terminalEvent.eventId, terminalEvent.sequence)
      : null,
    terminalDeliveryObserved: Boolean(
      projection.run
      && terminalEvent
      && terminalEvent.sequence === sourceSequence
      && !truncated
      && dispatches.length > 0
      && dispatches.every(dispatch => dispatch.terminalState === 'safe'),
    ),
    actors: projectActors(projection, dispatches),
    dispatches,
    receipts,
    events,
    timeline: projectTimeline(projection, dispatches, receipts, events).slice(0, limit),
    truncated,
  }
}

export function projectManageAttention(
  store: RuntimeEventStore,
  runIdInput: string,
  limitInput = MANAGE_RUNTIME_MAX_ATTENTION_ITEMS,
  now: () => Date = () => new Date(),
): ManageRuntimeAttentionProjection {
  const limit = projectionLimit(limitInput, MANAGE_RUNTIME_MAX_ATTENTION_ITEMS)
  const runId = boundedIdentity(runIdInput, 'run id')
  const raw = store.projectRun(runId, MANAGE_RUNTIME_PROJECTION_SCAN_ITEMS)
  const run = projectManageRunSnapshot(store.project.projectId, raw, MANAGE_RUNTIME_MAX_PROJECTION_ITEMS, now)
  return projectManageAttentionSnapshot(run, raw, limit)
}

export function projectManageAttentionSnapshot(
  run: ManageRuntimeRunProjection,
  raw: RuntimeRunProjection,
  limit = MANAGE_RUNTIME_MAX_ATTENTION_ITEMS,
): ManageRuntimeAttentionProjection {
  const items: ManageRuntimeAttentionItem[] = []
  for (const dispatch of run.dispatches) {
    if (dispatch.receiptState !== 'missing')
      continue
    items.push({
      kind: 'missing-receipt',
      summary: `Dispatch ${dispatch.dispatchId} has no committed receipt`,
      dispatchId: dispatch.dispatchId,
      receiptId: null,
      sourceRefs: [dispatch.source],
    })
  }
  for (const receipt of raw.receipts) {
    if (receipt.result !== 'boundary-changed')
      continue
    items.push({
      kind: 'boundary-changed',
      summary: `Receipt ${receipt.receiptId} reported boundary-changed`,
      dispatchId: receipt.dispatchId,
      receiptId: receipt.receiptId,
      sourceRefs: [
        sourceReference('receipt', receipt.receiptId, receipt.sequence),
        sourceReference('dispatch', receipt.dispatchId, receipt.dispatchSequence),
      ],
    })
  }
  for (const event of raw.events) {
    if (event.kind !== 'manage-attention')
      continue
    const payload = runtimeObject(event.payload)
    items.push({
      kind: 'runtime-attention',
      summary: boundedOptionalString(payload.summary) ?? `Runtime attention ${event.eventId}`,
      dispatchId: event.dispatchId,
      receiptId: null,
      sourceRefs: [
        sourceReference('event', event.eventId, event.sequence),
      ],
    })
  }
  if (run.truncated) {
    items.push({
      kind: 'projection-truncated',
      summary: 'Managed runtime projection is truncated; current authority must be reread',
      dispatchId: null,
      receiptId: null,
      sourceRefs: run.run
        ? [sourceReference('run', run.run.runId, run.freshness.sourceSequence)]
        : [],
    })
  }
  return {
    available: run.available,
    authoritative: false,
    diagnostic: run.diagnostic,
    freshness: run.freshness,
    items: items.slice(0, limit),
    truncated: run.truncated || items.length > limit,
  }
}

export function projectManageProjectSnapshot(
  projectId: string,
  snapshot: RuntimeProjectProjectionSnapshot,
  now: () => Date = () => new Date(),
): ManageRuntimeProjectProjection {
  const generatedAt = now().toISOString()
  if (snapshot.state !== 'ready') {
    const diagnostic = snapshot.diagnostic ?? {
      code: `runtime_${snapshot.state}`,
      message: `Managed runtime is ${snapshot.state}`,
      action: null,
    }
    return {
      state: snapshot.state,
      available: false,
      authoritative: false,
      diagnostic,
      generatedAt,
      runs: [],
      runsTruncated: false,
      attention: [{
        kind: 'runtime-unavailable',
        summary: diagnostic.message,
        dispatchId: null,
        receiptId: null,
        sourceRefs: [],
      }],
      attentionTruncated: false,
    }
  }
  const runs = snapshot.projections.map(projection =>
    projectManageRunSnapshot(projectId, projection, MANAGE_RUNTIME_MAX_PROJECTION_ITEMS, now))
  const attention = snapshot.projections.flatMap((projection, index) =>
    projectManageAttentionSnapshot(runs[index]!, projection).items)
  return {
    state: snapshot.state,
    available: true,
    authoritative: false,
    diagnostic: null,
    generatedAt,
    runs,
    runsTruncated: snapshot.runsTruncated,
    attention: attention.slice(0, MANAGE_RUNTIME_MAX_ATTENTION_ITEMS),
    attentionTruncated: snapshot.runsTruncated || attention.length > MANAGE_RUNTIME_MAX_ATTENTION_ITEMS,
  }
}

export function projectUnavailableManageRuntimeAttention(
  projectId: string,
  diagnostic: ManageRuntimeDiagnostic,
  now: () => Date = () => new Date(),
): ManageRuntimeAttentionProjection {
  return {
    available: false,
    authoritative: false,
    diagnostic,
    freshness: {
      projectId,
      workRef: null,
      sourceSequence: 0,
      generatedAt: now().toISOString(),
    },
    items: [{
      kind: 'runtime-unavailable',
      summary: diagnostic.message,
      dispatchId: null,
      receiptId: null,
      sourceRefs: [],
    }],
    truncated: false,
  }
}

export function projectManageHydration(
  hydration: RuntimeContextHydration,
  currentFreshness: RuntimeFreshnessIdentity,
): ManageRuntimeHydrationProjection {
  const fullReread = hydration.state === 'absent' || hydration.state === 'full-rebuild'
  const rereadSourceKeys = fullReread
    ? currentFreshness.sources.map(source => source.key)
    : hydration.rereadSourceKeys
  const reread = new Set(rereadSourceKeys)
  const reusableEvidenceSourceKeys = hydration.packet
    ? hydration.packet.freshness.sources
        .filter(source => source.role === 'evidence' && !reread.has(source.key))
        .map(source => source.key)
    : []
  return {
    state: hydration.state,
    mode: fullReread ? 'full-reread' : 'selective',
    packet: hydration.packet,
    reusableEvidenceSourceKeys,
    rereadSourceKeys: uniqueStrings(rereadSourceKeys),
    staleSourceKeys: uniqueStrings(hydration.staleSourceKeys),
    reasons: [...hydration.reasons],
    currentAuthorityWins: true,
  }
}

function createManageRuntimeCapability(
  project: RuntimeProjectIdentity,
  execute: (request: ManageRuntimeServiceRequest) => Promise<any>,
  descriptor: ManageRuntimeDescriptor = MANAGE_RUNTIME_DESCRIPTOR,
): ManageRuntimeCapability {
  const observeEvent = (input: ManageRuntimeEventObservationInput) =>
    execute({ operation: 'observe-event', input })
  return {
    descriptor,
    project,
    observeRun: input => execute({ operation: 'observe-run', input }),
    observeDispatch: input => execute({ operation: 'observe-dispatch', input }),
    observeEvent,
    observeReceipt: input => execute({ operation: 'observe-receipt', input }),
    observeAttention: input => observeEvent({ ...input, kind: 'manage-attention' }),
    observePause: input => observeEvent({ ...input, kind: 'manage-paused' }),
    observeResume: input => observeEvent({ ...input, kind: 'manage-resumed' }),
    observeTerminal: input => observeEvent({ ...input, kind: 'manage-terminal' }),
    projectRun: (runId, limit) => execute({
      operation: 'project-run',
      input: { runId, ...(limit === undefined ? {} : { limit }) },
    }),
    projectAttention: (runId, limit) => execute({
      operation: 'project-attention',
      input: { runId, ...(limit === undefined ? {} : { limit }) },
    }),
    saveContext: input => execute({ operation: 'save-context', input }),
    hydrateContext: input => execute({ operation: 'hydrate-context', input }),
  }
}

function createBrokerManageRuntimeCapability(
  connection: BrokerProjectConnection,
  descriptor: ManageRuntimeDescriptor,
  requestTimeoutMs?: number,
): ManageRuntimeCapability {
  return createManageRuntimeCapability(connection.project, async (request) => {
    const value = await brokerProjectRequest(
      connection,
      manageRuntimeServicePath(connection),
      {
        method: 'POST',
        body: request,
        requestTimeoutMs,
      },
    )
    return parseServiceResponse(value)
  }, descriptor)
}

function observeRun(
  store: RuntimeEventStore,
  input: ManageRuntimeRunObservationInput,
): ManageRuntimeRunObservationResult {
  const normalized = normalizeRunObservation(input)
  const run = store.ensureRun({
    runId: normalized.runId,
    runKey: normalized.runKey,
    workRef: normalized.workRef,
    createdAt: normalized.observedAt,
  })
  const event = store.appendEvent({
    runId: normalized.runId,
    eventId: normalized.eventId,
    idempotencyKey: normalized.idempotencyKey,
    kind: 'manage-run-started',
    actorType: 'manager',
    actorId: normalized.managerId,
    payload: {
      phase: normalized.phase,
      authorityRefs: normalized.authorityRefs,
      evidenceRefs: normalized.evidenceRefs,
    },
    observedAt: normalized.observedAt,
  })
  return { run, event }
}

function observeDispatch(
  store: RuntimeEventStore,
  input: ManageRuntimeDispatchObservationInput,
): RuntimeCommitResult<RuntimeDispatch> {
  const normalized = normalizeDispatchObservation(input)
  return store.registerDispatch({
    runId: normalized.runId,
    dispatchId: normalized.dispatchId,
    idempotencyKey: normalized.idempotencyKey,
    lane: normalized.lane,
    workerId: normalized.workerId,
    workerDisplayName: normalized.workerDisplayName,
    workerRole: normalized.workerRole,
    parentEventId: normalized.parentEventId,
    payload: {
      objectiveRef: normalized.objectiveRef,
      evidenceRefs: normalized.evidenceRefs,
      stopBoundary: normalized.stopBoundary,
    },
    createdAt: normalized.createdAt,
  })
}

function observeEvent(
  store: RuntimeEventStore,
  input: ManageRuntimeEventObservationInput,
): RuntimeCommitResult<RuntimeEvent> {
  const normalized = normalizeEventObservation(input)
  if (normalized.actorType === 'worker') {
    if (!normalized.dispatchId) {
      throw new RuntimeStoreError(
        'manage_runtime_event_dispatch_required',
        'Worker events require an exact observed dispatch identity',
      )
    }
    const dispatch = store.getDispatchForRun(normalized.runId, normalized.dispatchId)
    if (!dispatch) {
      throw new RuntimeStoreError(
        'manage_runtime_event_dispatch_missing',
        `Worker event dispatch ${normalized.dispatchId} was not observed`,
      )
    }
    if (dispatch.workerId !== normalized.actorId) {
      throw new RuntimeStoreError(
        'manage_runtime_event_actor_mismatch',
        `Worker event actor does not match dispatch ${normalized.dispatchId}`,
      )
    }
  }
  return store.appendEvent({
    runId: normalized.runId,
    eventId: normalized.eventId,
    idempotencyKey: normalized.idempotencyKey,
    kind: normalized.kind,
    actorType: normalized.actorType,
    actorId: normalized.actorId,
    dispatchId: normalized.dispatchId,
    parentEventId: normalized.parentEventId,
    payload: compactJsonObject({
      phase: normalized.phase,
      summary: normalized.summary,
      evidenceRefs: normalized.evidenceRefs,
      sourceRefs: normalized.sourceRefs,
      stopBoundary: normalized.stopBoundary,
      attentionKind: normalized.attentionKind,
    }),
    observedAt: normalized.observedAt,
  })
}

function observeReceipt(
  store: RuntimeEventStore,
  input: ManageRuntimeReceiptObservationInput,
): RuntimeCommitResult<RuntimeReceipt> {
  const normalized = normalizeReceiptObservation(input)
  const dispatch = store.getDispatchForRun(normalized.runId, normalized.dispatchId)
  if (!dispatch) {
    throw new RuntimeStoreError(
      'manage_runtime_receipt_dispatch_missing',
      `Receipt dispatch ${normalized.dispatchId} was not observed`,
    )
  }
  if (dispatch.workerId !== normalized.actorId) {
    throw new RuntimeStoreError(
      'manage_runtime_receipt_actor_mismatch',
      `Receipt actor does not match dispatch ${normalized.dispatchId}`,
    )
  }
  return store.recordReceipt({
    runId: normalized.runId,
    receiptId: normalized.receiptId,
    dispatchId: normalized.dispatchId,
    eventId: normalized.eventId,
    idempotencyKey: normalized.idempotencyKey,
    result: normalized.result,
    actorId: normalized.actorId,
    parentEventId: normalized.parentEventId,
    payload: {
      laneObjectiveRef: normalized.laneObjectiveRef,
      evidenceRefs: normalized.evidenceRefs,
      changedPaths: normalized.changedPaths,
      verificationRefs: normalized.verificationRefs,
      stopBoundary: normalized.stopBoundary,
    },
    observedAt: normalized.observedAt,
  })
}

function saveManageContext(
  store: RuntimeEventStore,
  input: ManageRuntimeContextInput,
  now: () => Date,
): RuntimeContextPacketResult {
  const updatedAt = now()
  const packet: RuntimeContextPacketInput = {
    ...input,
    packetKey: MANAGE_RUNTIME_CONTEXT_PACKET_KEY,
    updatedAt: updatedAt.toISOString(),
    expiresAt: new Date(updatedAt.getTime() + MANAGE_RUNTIME_MAX_CONTEXT_AGE_MS).toISOString(),
  }
  assertManageContextBounds(packet)
  return store.saveContextPacket(packet)
}

function normalizeServiceRequest(value: unknown): ManageRuntimeServiceRequest {
  const request = exactObject(value, ['input', 'operation'], ['input', 'operation'], 'managed runtime request')
  const operation = requiredString(request.operation, 'managed runtime operation')
  const input = request.input
  switch (operation) {
    case 'observe-run':
      return { operation, input: normalizeRunObservation(input) }
    case 'observe-dispatch':
      return { operation, input: normalizeDispatchObservation(input) }
    case 'observe-event':
      return { operation, input: normalizeEventObservation(input) }
    case 'observe-receipt':
      return { operation, input: normalizeReceiptObservation(input) }
    case 'project-run':
    case 'project-attention': {
      const projection = exactObject(input, ['limit', 'runId'], ['runId'], `${operation} input`)
      return {
        operation,
        input: {
          runId: boundedIdentity(projection.runId, 'run id'),
          ...(projection.limit === undefined
            ? {}
            : { limit: projectionLimit(projection.limit, operation === 'project-run' ? MANAGE_RUNTIME_MAX_PROJECTION_ITEMS : MANAGE_RUNTIME_MAX_ATTENTION_ITEMS) }),
        },
      }
    }
    case 'save-context':
      return { operation, input: normalizeContextInput(input) }
    case 'hydrate-context':
      return { operation, input: normalizeHydrationRequest(input) }
    default:
      throw new RuntimeStoreError(
        'manage_runtime_operation_invalid',
        `Unsupported managed runtime operation: ${operation}`,
      )
  }
}

function normalizeRunObservation(value: unknown): ManageRuntimeRunObservationInput {
  const input = exactObject(
    value,
    ['authorityRefs', 'eventId', 'evidenceRefs', 'idempotencyKey', 'managerId', 'observedAt', 'phase', 'runId', 'runKey', 'workRef'],
    ['authorityRefs', 'eventId', 'evidenceRefs', 'idempotencyKey', 'managerId', 'phase', 'runId', 'runKey', 'workRef'],
    'managed run observation',
  )
  return {
    runId: boundedIdentity(input.runId, 'run id'),
    runKey: boundedIdentity(input.runKey, 'run key'),
    workRef: boundedIdentity(input.workRef, 'WorkRef', 1_024),
    managerId: boundedIdentity(input.managerId, 'manager id'),
    eventId: boundedIdentity(input.eventId, 'event id'),
    idempotencyKey: boundedIdentity(input.idempotencyKey, 'idempotency key'),
    phase: boundedIdentity(input.phase, 'managed phase'),
    authorityRefs: referenceList(input.authorityRefs, 'authority references'),
    evidenceRefs: referenceList(input.evidenceRefs, 'evidence references'),
    ...(input.observedAt === undefined ? {} : { observedAt: validIsoDate(input.observedAt, 'observation time') }),
  }
}

function normalizeDispatchObservation(value: unknown): ManageRuntimeDispatchObservationInput {
  const input = exactObject(
    value,
    ['createdAt', 'dispatchId', 'evidenceRefs', 'idempotencyKey', 'lane', 'objectiveRef', 'parentEventId', 'runId', 'stopBoundary', 'workerDisplayName', 'workerId', 'workerRole'],
    ['dispatchId', 'evidenceRefs', 'idempotencyKey', 'lane', 'objectiveRef', 'runId', 'stopBoundary', 'workerId'],
    'managed dispatch observation',
  )
  return {
    runId: boundedIdentity(input.runId, 'run id'),
    dispatchId: boundedIdentity(input.dispatchId, 'dispatch id'),
    idempotencyKey: boundedIdentity(input.idempotencyKey, 'idempotency key'),
    lane: boundedIdentity(input.lane, 'lane'),
    workerId: boundedIdentity(input.workerId, 'worker id'),
    workerDisplayName: optionalIdentity(input.workerDisplayName, 'worker display name'),
    workerRole: optionalIdentity(input.workerRole, 'worker role'),
    objectiveRef: boundedReference(input.objectiveRef, 'objective reference'),
    evidenceRefs: referenceList(input.evidenceRefs, 'evidence references'),
    stopBoundary: boundedReference(input.stopBoundary, 'stop boundary'),
    parentEventId: optionalIdentity(input.parentEventId, 'parent event id'),
    ...(input.createdAt === undefined ? {} : { createdAt: validIsoDate(input.createdAt, 'dispatch creation time') }),
  }
}

function normalizeEventObservation(value: unknown): ManageRuntimeEventObservationInput {
  const input = exactObject(
    value,
    ['actorId', 'actorType', 'attentionKind', 'dispatchId', 'eventId', 'evidenceRefs', 'idempotencyKey', 'kind', 'observedAt', 'parentEventId', 'phase', 'runId', 'sourceRefs', 'stopBoundary', 'summary'],
    ['actorId', 'actorType', 'eventId', 'idempotencyKey', 'kind', 'runId'],
    'managed event observation',
  )
  const kind = requiredString(input.kind, 'event kind') as ManageRuntimeEventKind
  if (!MANAGE_RUNTIME_EVENT_KINDS.has(kind))
    throw new RuntimeStoreError('manage_runtime_event_kind_invalid', `Unsupported managed event kind: ${kind}`)
  const actorType = requiredString(input.actorType, 'actor type')
  if (!['manager', 'worker', 'system'].includes(actorType))
    throw new RuntimeStoreError('manage_runtime_actor_invalid', `Unsupported managed actor type: ${actorType}`)
  const normalized: ManageRuntimeEventObservationInput = {
    runId: boundedIdentity(input.runId, 'run id'),
    eventId: boundedIdentity(input.eventId, 'event id'),
    idempotencyKey: boundedIdentity(input.idempotencyKey, 'idempotency key'),
    kind,
    actorType: actorType as ManageRuntimeEventObservationInput['actorType'],
    actorId: boundedIdentity(input.actorId, 'actor id'),
    dispatchId: optionalIdentity(input.dispatchId, 'dispatch id'),
    parentEventId: optionalIdentity(input.parentEventId, 'parent event id'),
    stopBoundary: input.stopBoundary === null ? null : optionalReference(input.stopBoundary, 'stop boundary'),
  }
  if (input.phase !== undefined)
    normalized.phase = boundedIdentity(input.phase, 'managed phase')
  if (input.summary !== undefined)
    normalized.summary = boundedReference(input.summary, 'event summary', MANAGE_RUNTIME_MAX_SUMMARY_BYTES)
  if (input.evidenceRefs !== undefined)
    normalized.evidenceRefs = referenceList(input.evidenceRefs, 'evidence references')
  if (input.sourceRefs !== undefined)
    normalized.sourceRefs = referenceList(input.sourceRefs, 'source references')
  if (input.attentionKind !== undefined)
    normalized.attentionKind = boundedIdentity(input.attentionKind, 'attention kind')
  if (input.observedAt !== undefined)
    normalized.observedAt = validIsoDate(input.observedAt, 'observation time')
  if (kind === 'manage-attention' && (!normalized.attentionKind || !normalized.summary)) {
    throw new RuntimeStoreError(
      'manage_runtime_attention_invalid',
      'Managed attention requires an exact attention kind and bounded summary',
    )
  }
  if ((kind === 'manage-paused' || kind === 'manage-resumed' || kind === 'manage-terminal')
    && (!normalized.phase || !normalized.summary)) {
    throw new RuntimeStoreError(
      'manage_runtime_resume_invalid',
      `${kind} requires an exact phase and bounded summary`,
    )
  }
  if (kind === 'manage-terminal' && (normalized.actorType === 'worker' || !normalized.stopBoundary)) {
    throw new RuntimeStoreError(
      'manage_runtime_terminal_invalid',
      'Managed terminal observation requires a manager or system actor and an exact stop boundary',
    )
  }
  return normalized
}

function normalizeReceiptObservation(value: unknown): ManageRuntimeReceiptObservationInput {
  const input = exactObject(
    value,
    ['actorId', 'changedPaths', 'dispatchId', 'eventId', 'evidenceRefs', 'idempotencyKey', 'laneObjectiveRef', 'observedAt', 'parentEventId', 'receiptId', 'result', 'runId', 'stopBoundary', 'verificationRefs'],
    ['actorId', 'changedPaths', 'dispatchId', 'eventId', 'evidenceRefs', 'idempotencyKey', 'laneObjectiveRef', 'receiptId', 'result', 'runId', 'stopBoundary', 'verificationRefs'],
    'managed receipt observation',
  )
  return {
    runId: boundedIdentity(input.runId, 'run id'),
    receiptId: boundedIdentity(input.receiptId, 'receipt id'),
    dispatchId: boundedIdentity(input.dispatchId, 'dispatch id'),
    eventId: boundedIdentity(input.eventId, 'event id'),
    idempotencyKey: boundedIdentity(input.idempotencyKey, 'idempotency key'),
    result: boundedIdentity(input.result, 'receipt result'),
    actorId: boundedIdentity(input.actorId, 'receipt actor id'),
    laneObjectiveRef: boundedReference(input.laneObjectiveRef, 'lane objective reference'),
    evidenceRefs: referenceList(input.evidenceRefs, 'evidence references'),
    changedPaths: projectPathList(input.changedPaths, 'changed paths'),
    verificationRefs: referenceList(input.verificationRefs, 'verification references'),
    stopBoundary: boundedReference(input.stopBoundary, 'stop boundary'),
    parentEventId: optionalIdentity(input.parentEventId, 'parent event id'),
    ...(input.observedAt === undefined ? {} : { observedAt: validIsoDate(input.observedAt, 'observation time') }),
  }
}

function normalizeContextInput(value: unknown): ManageRuntimeContextInput {
  const input = exactObject(
    value,
    ['data', 'expectedVersion', 'freshness', 'runId', 'sourceSequence'],
    ['data', 'expectedVersion', 'freshness', 'runId', 'sourceSequence'],
    'managed context packet',
  )
  return {
    runId: boundedIdentity(input.runId, 'run id'),
    expectedVersion: nonNegativeInteger(input.expectedVersion, 'expected context version'),
    sourceSequence: nonNegativeInteger(input.sourceSequence, 'context source sequence'),
    freshness: input.freshness as RuntimeFreshnessIdentity,
    data: input.data as RuntimeContextPacketData,
  }
}

function normalizeHydrationRequest(value: unknown): ManageRuntimeHydrationRequest {
  const input = exactObject(
    value,
    ['freshness', 'runId'],
    ['freshness', 'runId'],
    'managed hydration request',
  )
  return {
    runId: boundedIdentity(input.runId, 'run id'),
    freshness: input.freshness as RuntimeFreshnessIdentity,
  }
}

function assertManageContextBounds(input: RuntimeContextPacketInput): void {
  const updatedAt = Date.parse(input.updatedAt ?? '')
  const expiresAt = Date.parse(input.expiresAt)
  if (!Number.isFinite(updatedAt) || !Number.isFinite(expiresAt)
    || expiresAt <= updatedAt
    || expiresAt - updatedAt > MANAGE_RUNTIME_MAX_CONTEXT_AGE_MS) {
    throw new RuntimeStoreError(
      'manage_runtime_context_expiry_invalid',
      `Managed context expiry must be after update time and within ${MANAGE_RUNTIME_MAX_CONTEXT_AGE_MS} milliseconds`,
    )
  }
  const data = input.data
  assertListBound(data.authorityRefs, 16, 'authority references')
  assertListBound(data.decisiveObservations, 16, 'decisive observations')
  assertListBound(data.blockers, 16, 'blockers')
  assertListBound(data.attention, 16, 'attention')
  assertListBound(data.evidence, 32, 'evidence')
  assertListBound(data.changedPaths, 64, 'changed paths')
  assertListBound(input.freshness.sources, 64, 'freshness sources')
  const bytes = Buffer.byteLength(JSON.stringify({
    ...input,
    packetKey: MANAGE_RUNTIME_CONTEXT_PACKET_KEY,
  }))
  if (bytes > MANAGE_RUNTIME_MAX_CONTEXT_BYTES) {
    throw new RuntimeStoreError(
      'manage_runtime_context_too_large',
      `Managed context packet exceeds ${MANAGE_RUNTIME_MAX_CONTEXT_BYTES} bytes`,
    )
  }
}

function projectEvent(
  event: RuntimeEvent,
  delivery?: RuntimeDeliveryStatus,
): ManageRuntimeProjectedEvent {
  const payload = runtimeObject(event.payload)
  return {
    eventId: event.eventId,
    sequence: event.sequence,
    kind: event.kind,
    actorType: event.actorType,
    actorId: event.actorId,
    dispatchId: event.dispatchId,
    phase: boundedOptionalString(payload.phase),
    summary: boundedOptionalString(payload.summary),
    evidenceRefs: projectedStringList(payload.evidenceRefs),
    sourceRefs: projectedStringList(payload.sourceRefs),
    stopBoundary: boundedOptionalString(payload.stopBoundary),
    parentRef: event.parentEventId,
    observedAt: event.observedAt,
    parentState: event.parentState,
    outOfOrder: event.outOfOrder,
    deliveryCount: delivery?.deliveryCount ?? 1,
    duplicateCount: delivery?.duplicateCount ?? 0,
    conflictCount: delivery?.conflictCount ?? 0,
    source: sourceReference('event', event.eventId, event.sequence),
  }
}

function projectedStringList(value: RuntimeJson | undefined): string[] {
  if (!Array.isArray(value))
    return []
  return value
    .filter((item): item is string => typeof item === 'string')
    .slice(0, MANAGE_RUNTIME_MAX_REFERENCE_ITEMS)
    .map(item => item.slice(0, MANAGE_RUNTIME_MAX_REFERENCE_BYTES))
}

function latestProjectedPhase(events: RuntimeEvent[]): string | null {
  for (let index = events.length - 1; index >= 0; index--) {
    const phase = boundedOptionalString(runtimeObject(events[index]!.payload).phase)
    if (phase)
      return phase
  }
  return null
}

function projectActors(
  projection: RuntimeRunProjection,
  dispatches: ManageRuntimeProjectedDispatch[],
): ManageRuntimeProjectedActor[] {
  const actors: ManageRuntimeProjectedActor[] = []
  const managerId = projection.events.find(event => event.kind === 'manage-run-started')?.actorId
  if (managerId) {
    actors.push({
      actorType: 'manager',
      actorId: managerId,
      dispatchId: null,
      lane: null,
    })
  }
  for (const dispatch of dispatches) {
    actors.push({
      actorType: 'worker',
      actorId: dispatch.workerId,
      dispatchId: dispatch.dispatchId,
      lane: dispatch.lane,
    })
  }
  return actors
}

function projectTimeline(
  projection: RuntimeRunProjection,
  dispatches: ManageRuntimeProjectedDispatch[],
  receipts: ManageRuntimeProjectedReceipt[],
  events: ManageRuntimeProjectedEvent[],
): ManageRuntimeTimelineItem[] {
  const items: ManageRuntimeTimelineItem[] = [
    ...dispatches.map(dispatch => ({
      type: 'dispatch' as const,
      id: dispatch.dispatchId,
      sequence: dispatch.sequence,
      actorType: 'worker' as const,
      actorId: dispatch.workerId,
      dispatchId: dispatch.dispatchId,
      kind: 'dispatch-observed',
      summary: dispatch.objectiveRef,
      parentRef: dispatch.parentRef,
      parentDispatchId: dispatch.parentDispatchId,
      relationship: dispatch.relationship,
      workerDisplayName: dispatch.workerDisplayName,
      workerRole: dispatch.workerRole,
      createdAt: dispatch.createdAt,
      receiptState: dispatch.receiptState,
      terminalState: dispatch.terminalState,
      parentState: dispatch.parentState,
      outOfOrder: dispatch.outOfOrder,
      duplicateCount: dispatch.duplicateCount,
      conflictCount: dispatch.conflictCount,
      source: dispatch.source,
    })),
    ...events.map(event => ({
      type: 'event' as const,
      id: event.eventId,
      sequence: event.sequence,
      actorType: event.actorType,
      actorId: event.actorId,
      dispatchId: event.dispatchId,
      kind: event.kind,
      summary: event.summary,
      parentRef: event.parentRef,
      observedAt: event.observedAt,
      parentState: event.parentState,
      outOfOrder: event.outOfOrder,
      duplicateCount: event.duplicateCount,
      conflictCount: event.conflictCount,
      source: event.source,
    })),
    ...receipts.map(receipt => ({
      type: 'receipt' as const,
      id: receipt.receiptId,
      sequence: receipt.sequence,
      actorType: 'worker' as const,
      actorId: receipt.actorId,
      dispatchId: receipt.dispatchId,
      kind: 'worker-receipt',
      summary: receipt.result,
      parentRef: receipt.parentRef,
      observedAt: receipt.observedAt,
      receiptState: 'received' as const,
      terminalState: dispatches.find(dispatch => dispatch.dispatchId === receipt.dispatchId)?.terminalState ?? 'unknown',
      parentState: projection.events.find(event => event.eventId === receipt.eventId)?.parentState ?? null,
      outOfOrder: projection.events.find(event => event.eventId === receipt.eventId)?.outOfOrder ?? false,
      duplicateCount: receipt.duplicateCount,
      conflictCount: receipt.conflictCount,
      source: receipt.source,
    })),
  ]
  const rank = { dispatch: 0, event: 1, receipt: 2 } as const
  return items.sort((left, right) =>
    left.sequence - right.sequence
    || rank[left.type] - rank[right.type]
    || left.id.localeCompare(right.id))
}

function deliveryKey(
  scope: RuntimeDeliveryStatus['scope'],
  effectId: string,
): string {
  return `${scope}\0${effectId}`
}

function dispatchParentState(
  relationship: RuntimeDispatch['relationship'],
): RuntimeEvent['parentState'] {
  switch (relationship) {
    case 'root':
      return 'none'
    case 'missing':
      return 'missing'
    case 'later':
      return 'after'
    case 'manager-root':
    case 'resolved':
    case 'same-dispatch':
    case 'unresolved':
      return 'before'
  }
}

function sourceReference(
  type: ManageRuntimeSourceReference['type'],
  id: string,
  sequence: number | null,
): ManageRuntimeSourceReference {
  return { type, id, sequence }
}

function manageRuntimeCapabilityPath(connection: BrokerProjectConnection): string {
  return `/v1/projects/${connection.project.projectId}/runtime/manage/capability`
}

function manageRuntimeServicePath(connection: BrokerProjectConnection): string {
  return `/v1/projects/${connection.project.projectId}/runtime/manage`
}

function parseCapabilityResponse(value: unknown): ManageRuntimeDescriptor {
  const response = exactObject(value, ['capability', 'ok'], ['capability', 'ok'], 'managed runtime capability response')
  if (response.ok !== true)
    throw new RuntimeStoreError('manage_runtime_response_invalid', 'Managed runtime capability response is not successful')
  const descriptor = response.capability as ManageRuntimeDescriptor
  if (descriptor?.name !== MANAGE_RUNTIME_CAPABILITY_NAME
    || !Number.isSafeInteger(descriptor.version?.major)
    || !Number.isSafeInteger(descriptor.version?.minor)) {
    throw new RuntimeStoreError('manage_runtime_response_invalid', 'Managed runtime capability response is invalid')
  }
  return descriptor
}

function parseServiceResponse(value: unknown): unknown {
  const response = exactObject(value, ['capability', 'ok', 'result'], ['capability', 'ok', 'result'], 'managed runtime service response')
  if (response.ok !== true)
    throw new RuntimeStoreError('manage_runtime_response_invalid', 'Managed runtime service response is not successful')
  parseCapabilityResponse({ ok: true, capability: response.capability })
  return response.result
}

function diagnosticFromError(error: unknown): ManageRuntimeDiagnostic {
  const candidate = error as { action?: unknown, code?: unknown, message?: unknown }
  return {
    code: typeof candidate?.code === 'string'
      ? boundedDiagnostic(candidate.code, 'manage_runtime_failed') ?? 'manage_runtime_failed'
      : 'manage_runtime_failed',
    message: typeof candidate?.message === 'string'
      ? boundedDiagnostic(candidate.message, 'Managed runtime operation failed') ?? 'Managed runtime operation failed'
      : 'Managed runtime operation failed',
    action: typeof candidate?.action === 'string'
      ? boundedDiagnostic(candidate.action, null)
      : null,
  }
}

function boundedDiagnostic(value: string, fallback: string | null): string | null {
  const sanitized = value.replace(/[\0\r\n]+/gu, ' ').trim()
  return sanitized ? sanitized.slice(0, 1_024) : fallback
}

function exactObject(
  value: unknown,
  allowedKeys: string[],
  requiredKeys: string[],
  label: string,
): Record<string, any> {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    throw new RuntimeStoreError('manage_runtime_request_invalid', `${label} must be an object`)
  const object = value as Record<string, unknown>
  const keys = Object.keys(object)
  if (keys.some(key => !allowedKeys.includes(key)) || requiredKeys.some(key => !(key in object)))
    throw new RuntimeStoreError('manage_runtime_request_invalid', `${label} fields do not match the capability contract`)
  return object
}

function requiredString(value: unknown, label: string): string {
  if (typeof value !== 'string')
    throw new RuntimeStoreError('manage_runtime_request_invalid', `${label} must be a string`)
  return value
}

function boundedIdentity(value: unknown, label: string, maximumBytes = 512): string {
  const string = requiredString(value, label)
  if (!string || Buffer.byteLength(string) > maximumBytes || /[\0\r\n]/u.test(string))
    throw new RuntimeStoreError('manage_runtime_request_invalid', `${label} is invalid`)
  return string
}

function optionalIdentity(value: unknown, label: string): string | null {
  return value === undefined || value === null ? null : boundedIdentity(value, label)
}

function boundedReference(value: unknown, label: string, maximumBytes = MANAGE_RUNTIME_MAX_REFERENCE_BYTES): string {
  return boundedIdentity(value, label, maximumBytes)
}

function optionalReference(value: unknown, label: string): string | undefined {
  return value === undefined ? undefined : boundedReference(value, label)
}

function referenceList(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.length > MANAGE_RUNTIME_MAX_REFERENCE_ITEMS)
    throw new RuntimeStoreError('manage_runtime_request_invalid', `${label} exceed the managed runtime bound`)
  const result = value.map(item => boundedReference(item, label))
  if (new Set(result).size !== result.length)
    throw new RuntimeStoreError('manage_runtime_request_invalid', `${label} must be unique`)
  return result
}

function projectPathList(value: unknown, label: string): string[] {
  return referenceList(value, label).map(item => projectPath(item, label))
}

function projectPath(value: string, label: string): string {
  if (Buffer.byteLength(value) > MANAGE_RUNTIME_MAX_PATH_BYTES
    || isAbsolute(value)
    || value.includes('\\')
    || value.split('/').some(segment => !segment || segment === '.' || segment === '..')) {
    throw new RuntimeStoreError('manage_runtime_request_invalid', `${label} must be project-relative POSIX paths`)
  }
  return value
}

function validIsoDate(value: unknown, label: string): string {
  const string = requiredString(value, label)
  const time = Date.parse(string)
  if (!Number.isFinite(time))
    throw new RuntimeStoreError('manage_runtime_request_invalid', `${label} must be an ISO-compatible timestamp`)
  return new Date(time).toISOString()
}

function nonNegativeInteger(value: unknown, label: string): number {
  if (!Number.isSafeInteger(value) || Number(value) < 0)
    throw new RuntimeStoreError('manage_runtime_request_invalid', `${label} must be a non-negative integer`)
  return Number(value)
}

function projectionLimit(value: unknown, maximum: number): number {
  if (!Number.isSafeInteger(value) || Number(value) < 1 || Number(value) > maximum)
    throw new RuntimeStoreError('manage_runtime_request_invalid', `Projection limit must be from 1 through ${maximum}`)
  return Number(value)
}

function assertListBound(value: unknown, maximum: number, label: string): void {
  if (!Array.isArray(value) || value.length > maximum)
    throw new RuntimeStoreError('manage_runtime_context_bound', `Managed context ${label} exceed ${maximum} items`)
}

function compactJsonObject(value: Record<string, unknown>): RuntimeJson {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined && item !== null),
  ) as RuntimeJson
}

function runtimeObject(value: RuntimeJson): Record<string, RuntimeJson> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value
    : {}
}

function boundedOptionalString(value: RuntimeJson | undefined): string | null {
  return typeof value === 'string'
    ? value.slice(0, MANAGE_RUNTIME_MAX_SUMMARY_BYTES)
    : null
}

function uniqueStrings(values: string[]): string[] {
  return [...new Set(values)]
}
