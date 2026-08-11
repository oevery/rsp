import type { DatabaseSync } from 'node:sqlite'
import type { StableDirectoryChain } from '../core/path-identity.js'
import type {
  RuntimeCheckpoint,
  RuntimeCheckpointInput,
  RuntimeCheckpointResult,
  RuntimeCommitResult,
  RuntimeContextEvidence,
  RuntimeContextHydration,
  RuntimeContextObservation,
  RuntimeContextPacket,
  RuntimeContextPacketData,
  RuntimeContextPacketInput,
  RuntimeContextPacketInspection,
  RuntimeContextPacketResult,
  RuntimeDatabaseInspection,
  RuntimeDeliveryStatus,
  RuntimeDispatch,
  RuntimeDispatchInput,
  RuntimeEvent,
  RuntimeEventInput,
  RuntimeFreshnessIdentity,
  RuntimeJson,
  RuntimeProjectIdentity,
  RuntimeProjectProjectionSnapshot,
  RuntimeReceipt,
  RuntimeReceiptInput,
  RuntimeRetentionPolicy,
  RuntimeRetentionResult,
  RuntimeRun,
  RuntimeRunInput,
  RuntimeRunProjection,
  RuntimeSchemaIdentity,
  RuntimeSourceIdentity,
} from './model.js'
import { Buffer } from 'node:buffer'
import { createHash, randomUUID } from 'node:crypto'
import { chmod, link, lstat, mkdir, rename, unlink } from 'node:fs/promises'
import { dirname, isAbsolute, join, resolve } from 'node:path'

import {
  assertStableDirectoryChain,
  captureStableDirectoryChain,
  isPathContained,
} from '../core/path-identity.js'
import { withRuntimeInspectionSnapshot } from './inspection-snapshot.js'
import { inspectRuntimeSchema, migrateRuntimeDatabase } from './migrations.js'
import {
  RUNTIME_BUSY_TIMEOUT_MS,
  RUNTIME_CONTEXT_PACKET_SCHEMA_VERSION,
  RUNTIME_DATABASE_FILENAME,
  RUNTIME_MAX_CHECKPOINT_PAYLOAD_BYTES,
  RUNTIME_MAX_CONTEXT_PACKET_BYTES,
  RUNTIME_MAX_CONTEXT_PACKETS_PER_RUN,
  RUNTIME_MAX_DATABASE_BYTES,
  RUNTIME_MAX_DISPATCHES_PER_RUN,
  RUNTIME_MAX_EVENT_PAYLOAD_BYTES,
  RUNTIME_MAX_EVENTS_PER_RUN,
  RUNTIME_MAX_PROJECTION_EVENTS,
  RUNTIME_MAX_PROJECTION_RUNS,
  RUNTIME_MAX_RECEIPT_PAYLOAD_BYTES,
  RUNTIME_MAX_RUNS,
  RUNTIME_STORE_SCHEMA_VERSION,
  RuntimeStoreError,
} from './model.js'
import { parseRuntimeJson, sanitizeRuntimePayload } from './payload.js'

const MINIMUM_SQLITE_NODE_VERSION = Object.freeze({ major: 22, minor: 13, patch: 0 })
const MAX_IDENTITY_BYTES = 512
const MAX_WORK_REF_BYTES = 1_024
const MAX_PATH_BYTES = 4_096
const MAX_CONTEXT_LIST_ITEMS = 64

export interface OpenRuntimeEventStoreOptions {
  namespacePath: string
  project: RuntimeProjectIdentity
  create?: boolean
  now?: () => Date
}

export interface InspectRuntimeContextPacketsOptions {
  namespacePath: string
  project: RuntimeProjectIdentity
  currentGitHead: string
  sourceHash: (projectRelativePath: string) => Promise<string | null>
  limit?: number
}

export class RuntimeEventStore {
  readonly databasePath: string
  readonly schema: RuntimeSchemaIdentity

  private closed = false

  constructor(
    private readonly database: DatabaseSync,
    readonly namespacePath: string,
    readonly project: RuntimeProjectIdentity,
    schema: RuntimeSchemaIdentity,
    private readonly now: () => Date,
  ) {
    this.databasePath = runtimeDatabasePath(namespacePath)
    this.schema = { ...schema }
  }

  close(): void {
    if (this.closed)
      return
    this.closed = true
    this.database.close()
  }

  ensureRun(input: RuntimeRunInput): RuntimeRun {
    this.assertOpen()
    const runId = runtimeIdentity(input.runId, 'run id')
    const runKey = runtimeIdentity(input.runKey, 'run key')
    const workRef = boundedText(input.workRef, MAX_WORK_REF_BYTES, 'WorkRef')
    const createdAt = validIsoDate(input.createdAt ?? this.now().toISOString(), 'run creation time')
    return withImmediateTransaction(this.database, () => {
      const existing = this.getRun(runId)
      if (existing) {
        if (existing.runKey !== runKey || existing.workRef !== workRef) {
          throw new RuntimeStoreError(
            'runtime_run_identity_conflict',
            `Run ${runId} already exists with a different run key or WorkRef`,
          )
        }
        return existing
      }
      const runCount = integerValue(this.database.prepare('SELECT COUNT(*) AS value FROM runtime_runs').get())
      if (runCount >= RUNTIME_MAX_RUNS) {
        throw new RuntimeStoreError(
          'runtime_retention_required',
          `Runtime database reached the ${RUNTIME_MAX_RUNS} run limit`,
          'Apply runtime retention or dispose this checkout runtime database before creating another run',
        )
      }
      this.database.prepare(`
        INSERT INTO runtime_runs (
          run_id,
          project_id,
          run_key,
          work_ref,
          next_sequence,
          created_at,
          last_observed_at
        ) VALUES (?, ?, ?, ?, 1, ?, ?)
      `).run(runId, this.project.projectId, runKey, workRef, createdAt, createdAt)
      return this.requireRun(runId)
    })
  }

  getRun(runId: string): RuntimeRun | null {
    this.assertOpen()
    const row = this.database.prepare(`
      SELECT run_id, run_key, work_ref, next_sequence, created_at, last_observed_at
      FROM runtime_runs
      WHERE run_id = ?
    `).get(runtimeIdentity(runId, 'run id')) as RuntimeRunRow | undefined
    return row ? runtimeRunFromRow(row) : null
  }

  listRuns(limit = RUNTIME_MAX_PROJECTION_RUNS): {
    runs: RuntimeRun[]
    truncated: boolean
  } {
    this.assertOpen()
    const boundedLimit = positiveBound(limit, RUNTIME_MAX_PROJECTION_RUNS, 'runtime projection run limit')
    const rows = this.database.prepare(`
      SELECT run_id, run_key, work_ref, next_sequence, created_at, last_observed_at
      FROM runtime_runs
      ORDER BY last_observed_at DESC, run_id
      LIMIT ?
    `).all(boundedLimit + 1) as unknown as RuntimeRunRow[]
    return {
      runs: rows.slice(0, boundedLimit).map(runtimeRunFromRow),
      truncated: rows.length > boundedLimit,
    }
  }

  registerDispatch(input: RuntimeDispatchInput): RuntimeCommitResult<RuntimeDispatch> {
    this.assertOpen()
    const normalized = normalizeDispatchInput(input, this.now)
    const sanitized = sanitizeRuntimePayload(
      normalized.payload,
      RUNTIME_MAX_EVENT_PAYLOAD_BYTES,
      'runtime dispatch payload',
    )
    const presentation = sanitizeRuntimePayload(
      {
        workerDisplayName: normalized.workerDisplayName,
        workerRole: normalized.workerRole,
      },
      2 * 1024,
      'runtime dispatch presentation metadata',
    )
    const presentationValue = runtimeJsonObject(presentation.value)
    const workerDisplayName = runtimeOptionalString(presentationValue.workerDisplayName)
    const workerRole = runtimeOptionalString(presentationValue.workerRole)
    const fingerprint = fingerprintOf([
      normalized.runId,
      normalized.dispatchId,
      normalized.lane,
      normalized.workerId,
      workerDisplayName,
      workerRole,
      normalized.parentEventId,
      sanitized.json,
    ])
    const outcome = withImmediateTransaction(this.database, () => {
      this.requireRun(normalized.runId)
      const idempotency = this.inspectIdempotency(
        normalized.runId,
        'dispatch',
        normalized.idempotencyKey,
        fingerprint,
        normalized.createdAt,
      )
      if (idempotency.kind === 'conflict')
        return idempotency
      if (idempotency.kind === 'duplicate') {
        return {
          kind: 'committed' as const,
          duplicate: true,
          effect: this.requireDispatch(idempotency.effectId),
          deliveryCount: idempotency.deliveryCount,
          duplicateCount: idempotency.duplicateCount,
        }
      }

      const existing = this.getDispatch(normalized.dispatchId)
      if (existing) {
        const row = this.requireDispatchRow(normalized.dispatchId)
        if (row.run_id !== normalized.runId || row.fingerprint !== fingerprint) {
          throw new RuntimeStoreError(
            'runtime_dispatch_identity_conflict',
            `Dispatch ${normalized.dispatchId} already exists with different content`,
          )
        }
        this.insertIdempotencyAlias(
          normalized.runId,
          'dispatch',
          normalized.idempotencyKey,
          normalized.dispatchId,
          fingerprint,
          normalized.createdAt,
        )
        return {
          kind: 'committed' as const,
          duplicate: true,
          effect: existing,
          deliveryCount: 1,
          duplicateCount: 1,
        }
      }

      const dispatchCount = integerValue(this.database.prepare(`
        SELECT COUNT(*) AS value
        FROM runtime_dispatches
        WHERE run_id = ?
      `).get(normalized.runId))
      if (dispatchCount >= RUNTIME_MAX_DISPATCHES_PER_RUN) {
        throw new RuntimeStoreError(
          'runtime_dispatch_limit',
          `Run ${normalized.runId} reached the ${RUNTIME_MAX_DISPATCHES_PER_RUN} dispatch limit`,
        )
      }
      this.assertParentIdentity(normalized.runId, normalized.parentEventId)
      const committedAt = this.now().toISOString()
      const sequence = this.allocateSequence(normalized.runId, committedAt)
      this.database.prepare(`
        INSERT INTO runtime_dispatches (
          dispatch_id,
          run_id,
          sequence,
          lane,
          worker_id,
          worker_display_name,
          worker_role,
          parent_event_id,
          fingerprint,
          payload_json,
          redaction_count,
          created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        normalized.dispatchId,
        normalized.runId,
        sequence,
        normalized.lane,
        normalized.workerId,
        workerDisplayName,
        workerRole,
        normalized.parentEventId,
        fingerprint,
        sanitized.json,
        sanitized.redactionCount + presentation.redactionCount,
        normalized.createdAt,
      )
      this.insertIdempotency(
        normalized.runId,
        'dispatch',
        normalized.idempotencyKey,
        normalized.dispatchId,
        fingerprint,
        normalized.createdAt,
      )
      return {
        kind: 'committed' as const,
        duplicate: false,
        effect: this.requireDispatch(normalized.dispatchId),
        deliveryCount: 1,
        duplicateCount: 0,
      }
    })
    if (outcome.kind === 'conflict')
      throw outcome.error
    return outcome
  }

  appendEvent(input: RuntimeEventInput): RuntimeCommitResult<RuntimeEvent> {
    this.assertOpen()
    const normalized = normalizeEventInput(input, this.now)
    const sanitized = sanitizeRuntimePayload(
      normalized.payload,
      RUNTIME_MAX_EVENT_PAYLOAD_BYTES,
      'runtime event payload',
    )
    const fingerprint = eventFingerprint(normalized, sanitized.json)
    const outcome = withImmediateTransaction(this.database, () => {
      this.requireRun(normalized.runId)
      const idempotency = this.inspectIdempotency(
        normalized.runId,
        'event',
        normalized.idempotencyKey,
        fingerprint,
        normalized.observedAt,
      )
      if (idempotency.kind === 'conflict')
        return idempotency
      if (idempotency.kind === 'duplicate') {
        return {
          kind: 'committed' as const,
          duplicate: true,
          effect: this.requireEvent(idempotency.effectId),
          deliveryCount: idempotency.deliveryCount,
          duplicateCount: idempotency.duplicateCount,
        }
      }

      const existing = this.getEvent(normalized.eventId)
      if (existing) {
        const row = this.requireEventRow(normalized.eventId)
        if (row.run_id !== normalized.runId || row.fingerprint !== fingerprint) {
          throw new RuntimeStoreError(
            'runtime_event_identity_conflict',
            `Event ${normalized.eventId} already exists with different content`,
          )
        }
        this.insertIdempotencyAlias(
          normalized.runId,
          'event',
          normalized.idempotencyKey,
          normalized.eventId,
          fingerprint,
          normalized.observedAt,
        )
        return {
          kind: 'committed' as const,
          duplicate: true,
          effect: existing,
          deliveryCount: 1,
          duplicateCount: 1,
        }
      }

      this.assertEventCapacity(normalized.runId)
      this.assertDispatchIdentity(normalized.runId, normalized.dispatchId)
      this.assertParentIdentity(normalized.runId, normalized.parentEventId)
      this.assertEventIdentityNamespace(normalized.runId, normalized.eventId)
      const committedAt = this.now().toISOString()
      const sequence = this.allocateSequence(normalized.runId, committedAt)
      this.database.prepare(`
        INSERT INTO runtime_events (
          event_id,
          run_id,
          dispatch_id,
          sequence,
          kind,
          actor_type,
          actor_id,
          parent_event_id,
          fingerprint,
          payload_json,
          redaction_count,
          observed_at,
          committed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        normalized.eventId,
        normalized.runId,
        normalized.dispatchId,
        sequence,
        normalized.kind,
        normalized.actorType,
        normalized.actorId,
        normalized.parentEventId,
        fingerprint,
        sanitized.json,
        sanitized.redactionCount,
        normalized.observedAt,
        committedAt,
      )
      this.insertIdempotency(
        normalized.runId,
        'event',
        normalized.idempotencyKey,
        normalized.eventId,
        fingerprint,
        normalized.observedAt,
      )
      return {
        kind: 'committed' as const,
        duplicate: false,
        effect: this.requireEvent(normalized.eventId),
        deliveryCount: 1,
        duplicateCount: 0,
      }
    })
    if (outcome.kind === 'conflict')
      throw outcome.error
    return outcome
  }

  recordReceipt(input: RuntimeReceiptInput): RuntimeCommitResult<RuntimeReceipt> {
    this.assertOpen()
    const normalized = normalizeReceiptInput(input, this.now)
    const sanitized = sanitizeRuntimePayload(
      normalized.payload,
      RUNTIME_MAX_RECEIPT_PAYLOAD_BYTES,
      'runtime receipt payload',
    )
    const fingerprint = fingerprintOf([
      normalized.runId,
      normalized.receiptId,
      normalized.dispatchId,
      normalized.eventId,
      normalized.result,
      normalized.actorId,
      normalized.parentEventId,
      sanitized.json,
    ])
    const outcome = withImmediateTransaction(this.database, () => {
      this.requireRun(normalized.runId)
      this.assertDispatchIdentity(normalized.runId, normalized.dispatchId, true)
      const idempotency = this.inspectIdempotency(
        normalized.runId,
        'receipt',
        normalized.idempotencyKey,
        fingerprint,
        normalized.observedAt,
      )
      if (idempotency.kind === 'conflict')
        return idempotency
      if (idempotency.kind === 'duplicate') {
        return {
          kind: 'committed' as const,
          duplicate: true,
          effect: this.requireReceipt(idempotency.effectId),
          deliveryCount: idempotency.deliveryCount,
          duplicateCount: idempotency.duplicateCount,
        }
      }

      const existing = this.findReceiptIdentity(
        normalized.receiptId,
        normalized.dispatchId,
        normalized.eventId,
      )
      if (existing) {
        if (existing.run_id !== normalized.runId || existing.fingerprint !== fingerprint) {
          throw new RuntimeStoreError(
            'runtime_receipt_identity_conflict',
            `Dispatch ${normalized.dispatchId} already has a different retained receipt`,
          )
        }
        this.insertIdempotencyAlias(
          normalized.runId,
          'receipt',
          normalized.idempotencyKey,
          existing.receipt_id,
          fingerprint,
          normalized.observedAt,
        )
        return {
          kind: 'committed' as const,
          duplicate: true,
          effect: this.requireReceipt(existing.receipt_id),
          deliveryCount: 1,
          duplicateCount: 1,
        }
      }

      if (this.getEvent(normalized.eventId)) {
        throw new RuntimeStoreError(
          'runtime_receipt_event_conflict',
          `Receipt event ${normalized.eventId} already exists without this receipt`,
        )
      }
      this.assertEventCapacity(normalized.runId)
      this.assertParentIdentity(normalized.runId, normalized.parentEventId)
      this.assertEventIdentityNamespace(normalized.runId, normalized.eventId)
      const committedAt = this.now().toISOString()
      const sequence = this.allocateSequence(normalized.runId, committedAt)
      const eventPayload = JSON.stringify({
        receiptId: normalized.receiptId,
        result: normalized.result,
      })
      const eventFingerprintValue = fingerprintOf([
        normalized.runId,
        normalized.eventId,
        normalized.dispatchId,
        'worker-receipt',
        'worker',
        normalized.actorId,
        normalized.parentEventId,
        eventPayload,
      ])
      this.database.prepare(`
        INSERT INTO runtime_events (
          event_id,
          run_id,
          dispatch_id,
          sequence,
          kind,
          actor_type,
          actor_id,
          parent_event_id,
          fingerprint,
          payload_json,
          redaction_count,
          observed_at,
          committed_at
        ) VALUES (?, ?, ?, ?, 'worker-receipt', 'worker', ?, ?, ?, ?, 0, ?, ?)
      `).run(
        normalized.eventId,
        normalized.runId,
        normalized.dispatchId,
        sequence,
        normalized.actorId,
        normalized.parentEventId,
        eventFingerprintValue,
        eventPayload,
        normalized.observedAt,
        committedAt,
      )
      this.database.prepare(`
        INSERT INTO runtime_receipts (
          receipt_id,
          run_id,
          dispatch_id,
          event_id,
          result,
          fingerprint,
          payload_json,
          redaction_count,
          observed_at,
          committed_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        normalized.receiptId,
        normalized.runId,
        normalized.dispatchId,
        normalized.eventId,
        normalized.result,
        fingerprint,
        sanitized.json,
        sanitized.redactionCount,
        normalized.observedAt,
        committedAt,
      )
      this.insertIdempotency(
        normalized.runId,
        'receipt',
        normalized.idempotencyKey,
        normalized.receiptId,
        fingerprint,
        normalized.observedAt,
      )
      return {
        kind: 'committed' as const,
        duplicate: false,
        effect: this.requireReceipt(normalized.receiptId),
        deliveryCount: 1,
        duplicateCount: 0,
      }
    })
    if (outcome.kind === 'conflict')
      throw outcome.error
    return outcome
  }

  getDeliveryStatus(
    runId: string,
    scope: RuntimeDeliveryStatus['scope'],
    idempotencyKey: string,
  ): RuntimeDeliveryStatus | null {
    this.assertOpen()
    const normalizedRunId = runtimeIdentity(runId, 'run id')
    const normalizedKey = runtimeIdentity(idempotencyKey, 'idempotency key')
    const row = this.database.prepare(`
      SELECT
        effect_id,
        delivery_count,
        duplicate_count,
        conflict_count,
        first_delivered_at,
        last_delivered_at
      FROM runtime_idempotency
      WHERE run_id = ?
        AND scope = ?
        AND idempotency_key = ?
    `).get(normalizedRunId, scope, normalizedKey) as RuntimeDeliveryProjectionRow | undefined
    return row
      ? {
          runId: normalizedRunId,
          scope,
          idempotencyKey: normalizedKey,
          effectId: row.effect_id,
          deliveryCount: row.delivery_count,
          duplicateCount: row.duplicate_count,
          conflictCount: row.conflict_count,
          firstDeliveredAt: row.first_delivered_at,
          lastDeliveredAt: row.last_delivered_at,
        }
      : null
  }

  writeCheckpoint(input: RuntimeCheckpointInput): RuntimeCheckpointResult {
    this.assertOpen()
    const runId = runtimeIdentity(input.runId, 'run id')
    const projector = runtimeIdentity(input.projector, 'projector')
    const projectorVersion = runtimeIdentity(input.projectorVersion, 'projector version')
    const expectedVersion = nonNegativeInteger(input.expectedVersion, 'expected checkpoint version')
    const sourceSequence = nonNegativeInteger(input.sourceSequence, 'checkpoint source sequence')
    const updatedAt = validIsoDate(input.updatedAt ?? this.now().toISOString(), 'checkpoint update time')
    const sanitized = sanitizeRuntimePayload(
      input.payload,
      RUNTIME_MAX_CHECKPOINT_PAYLOAD_BYTES,
      'runtime checkpoint payload',
    )
    return withImmediateTransaction(this.database, () => {
      const run = this.requireRun(runId)
      if (sourceSequence >= run.nextSequence) {
        throw new RuntimeStoreError(
          'runtime_checkpoint_sequence_invalid',
          `Checkpoint source sequence ${sourceSequence} is not committed for run ${runId}`,
        )
      }
      const current = this.getCheckpoint(runId, projector)
      if (!current) {
        if (expectedVersion !== 0)
          return { applied: false, checkpoint: null, currentVersion: 0 }
        this.database.prepare(`
          INSERT INTO runtime_checkpoints (
            run_id,
            projector,
            projector_version,
            version,
            source_sequence,
            payload_json,
            redaction_count,
            updated_at
          ) VALUES (?, ?, ?, 1, ?, ?, ?, ?)
        `).run(
          runId,
          projector,
          projectorVersion,
          sourceSequence,
          sanitized.json,
          sanitized.redactionCount,
          updatedAt,
        )
        return {
          applied: true,
          checkpoint: this.getCheckpoint(runId, projector),
          currentVersion: 1,
        }
      }
      if (current.version !== expectedVersion) {
        return {
          applied: false,
          checkpoint: current,
          currentVersion: current.version,
        }
      }
      const nextVersion = current.version + 1
      const result = this.database.prepare(`
        UPDATE runtime_checkpoints
        SET
          projector_version = ?,
          version = ?,
          source_sequence = ?,
          payload_json = ?,
          redaction_count = ?,
          updated_at = ?
        WHERE run_id = ?
          AND projector = ?
          AND version = ?
      `).run(
        projectorVersion,
        nextVersion,
        sourceSequence,
        sanitized.json,
        sanitized.redactionCount,
        updatedAt,
        runId,
        projector,
        expectedVersion,
      )
      if (Number(result.changes) !== 1) {
        const latest = this.getCheckpoint(runId, projector)
        return {
          applied: false,
          checkpoint: latest,
          currentVersion: latest?.version ?? 0,
        }
      }
      return {
        applied: true,
        checkpoint: this.getCheckpoint(runId, projector),
        currentVersion: nextVersion,
      }
    })
  }

  getCheckpoint(runId: string, projector: string): RuntimeCheckpoint | null {
    this.assertOpen()
    const row = this.database.prepare(`
      SELECT
        run_id,
        projector,
        projector_version,
        version,
        source_sequence,
        payload_json,
        redaction_count,
        updated_at
      FROM runtime_checkpoints
      WHERE run_id = ?
        AND projector = ?
    `).get(
      runtimeIdentity(runId, 'run id'),
      runtimeIdentity(projector, 'projector'),
    ) as RuntimeCheckpointRow | undefined
    return row ? runtimeCheckpointFromRow(row) : null
  }

  saveContextPacket(input: RuntimeContextPacketInput): RuntimeContextPacketResult {
    this.assertOpen()
    const normalized = normalizeContextPacketInput(input, this.project, this.now)
    const sanitized = sanitizeRuntimePayload(
      {
        freshness: normalized.freshness,
        data: normalized.data,
      },
      RUNTIME_MAX_CONTEXT_PACKET_BYTES,
      'runtime context packet',
    )
    const sanitizedPacket = sanitized.value as unknown as {
      freshness: RuntimeFreshnessIdentity
      data: RuntimeContextPacketData
    }
    return withImmediateTransaction(this.database, () => {
      const run = this.requireRun(normalized.runId)
      if (run.workRef !== normalized.freshness.workRef) {
        throw new RuntimeStoreError(
          'runtime_context_work_ref_mismatch',
          `Context packet WorkRef does not match run ${normalized.runId}`,
        )
      }
      const current = this.getContextPacket(normalized.runId, normalized.packetKey)
      const committedSequence = run.nextSequence - 1
      if (normalized.sourceSequence !== committedSequence) {
        return {
          applied: false,
          checkpoint: current,
          currentVersion: current?.version ?? 0,
        }
      }
      this.assertContextObservations(
        normalized.runId,
        normalized.sourceSequence,
        normalized.data.decisiveObservations,
      )
      if (!current) {
        if (normalized.expectedVersion !== 0)
          return { applied: false, checkpoint: null, currentVersion: 0 }
        const packetCount = integerValue(this.database.prepare(`
          SELECT COUNT(*) AS value
          FROM runtime_context_packets
          WHERE run_id = ?
        `).get(normalized.runId))
        if (packetCount >= RUNTIME_MAX_CONTEXT_PACKETS_PER_RUN) {
          throw new RuntimeStoreError(
            'runtime_context_packet_limit',
            `Run ${normalized.runId} reached the ${RUNTIME_MAX_CONTEXT_PACKETS_PER_RUN} context packet limit`,
          )
        }
        this.database.prepare(`
          INSERT INTO runtime_context_packets (
            run_id,
            packet_key,
            version,
            source_sequence,
            schema_version,
            freshness_json,
            data_json,
            redaction_count,
            expires_at,
            updated_at
          ) VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?)
        `).run(
          normalized.runId,
          normalized.packetKey,
          normalized.sourceSequence,
          RUNTIME_CONTEXT_PACKET_SCHEMA_VERSION,
          JSON.stringify(sanitizedPacket.freshness),
          JSON.stringify(sanitizedPacket.data),
          sanitized.redactionCount,
          normalized.expiresAt,
          normalized.updatedAt,
        )
        return {
          applied: true,
          checkpoint: this.getContextPacket(normalized.runId, normalized.packetKey),
          currentVersion: 1,
        }
      }
      if (current.version !== normalized.expectedVersion) {
        return {
          applied: false,
          checkpoint: current,
          currentVersion: current.version,
        }
      }
      const nextVersion = current.version + 1
      const result = this.database.prepare(`
        UPDATE runtime_context_packets
        SET
          version = ?,
          source_sequence = ?,
          schema_version = ?,
          freshness_json = ?,
          data_json = ?,
          redaction_count = ?,
          expires_at = ?,
          updated_at = ?
        WHERE run_id = ?
          AND packet_key = ?
          AND version = ?
      `).run(
        nextVersion,
        normalized.sourceSequence,
        RUNTIME_CONTEXT_PACKET_SCHEMA_VERSION,
        JSON.stringify(sanitizedPacket.freshness),
        JSON.stringify(sanitizedPacket.data),
        sanitized.redactionCount,
        normalized.expiresAt,
        normalized.updatedAt,
        normalized.runId,
        normalized.packetKey,
        normalized.expectedVersion,
      )
      if (Number(result.changes) !== 1) {
        const latest = this.getContextPacket(normalized.runId, normalized.packetKey)
        return {
          applied: false,
          checkpoint: latest,
          currentVersion: latest?.version ?? 0,
        }
      }
      return {
        applied: true,
        checkpoint: this.getContextPacket(normalized.runId, normalized.packetKey),
        currentVersion: nextVersion,
      }
    })
  }

  getContextPacket(runId: string, packetKey: string): RuntimeContextPacket | null {
    this.assertOpen()
    const row = this.database.prepare(`
      SELECT
        run_id,
        packet_key,
        version,
        source_sequence,
        schema_version,
        freshness_json,
        data_json,
        redaction_count,
        expires_at,
        updated_at
      FROM runtime_context_packets
      WHERE run_id = ?
        AND packet_key = ?
    `).get(
      runtimeIdentity(runId, 'run id'),
      runtimeIdentity(packetKey, 'context packet key'),
    ) as RuntimeContextPacketRow | undefined
    return row ? runtimeContextPacketFromRow(row) : null
  }

  hydrateContextPacket(
    runId: string,
    packetKey: string,
    currentFreshness: RuntimeFreshnessIdentity,
  ): RuntimeContextHydration {
    this.assertOpen()
    const normalizedRunId = runtimeIdentity(runId, 'run id')
    const packet = this.getContextPacket(normalizedRunId, packetKey)
    if (!packet) {
      return {
        state: 'absent',
        packet: null,
        staleSourceKeys: [],
        rereadSourceKeys: [],
        reasons: ['context packet is absent'],
      }
    }
    const run = this.requireRun(normalizedRunId)
    const committedSequence = run.nextSequence - 1
    const current = normalizeFreshnessIdentity(currentFreshness, this.project)
    const reasons: string[] = []
    const runtimeNow = this.now().getTime()
    const packetUpdatedAt = strictStoredIsoTime(packet.updatedAt)
    if (packet.schemaVersion !== RUNTIME_CONTEXT_PACKET_SCHEMA_VERSION)
      reasons.push('context packet schema changed')
    if (packetUpdatedAt !== null && packetUpdatedAt > runtimeNow)
      reasons.push('context packet update time is in the future')
    if (Date.parse(packet.expiresAt) <= runtimeNow)
      reasons.push('context packet expired')
    if (packet.sourceSequence !== committedSequence)
      reasons.push('committed runtime revision changed')
    if (packet.freshness.projectId !== current.projectId)
      reasons.push('checkout project identity changed')
    if (packet.freshness.checkoutRoot !== current.checkoutRoot)
      reasons.push('checkout root changed')
    if (packet.freshness.workRef !== current.workRef)
      reasons.push('WorkRef changed')
    if (packet.freshness.gitHead !== current.gitHead)
      reasons.push('Git HEAD changed')
    if (packet.freshness.dirtyPathsHash !== current.dirtyPathsHash)
      reasons.push('dirty-path identity changed')
    if (packet.freshness.authorityHash !== current.authorityHash)
      reasons.push('authority identity changed')
    if (reasons.length > 0) {
      return {
        state: 'full-rebuild',
        packet: null,
        staleSourceKeys: packet.freshness.sources.map(source => source.key),
        rereadSourceKeys: current.sources.map(source => source.key),
        reasons,
      }
    }

    const currentSources = new Map(current.sources.map(source => [source.key, source]))
    const packetSources = new Map(packet.freshness.sources.map(source => [source.key, source]))
    const staleSources = packet.freshness.sources.filter((source) => {
      const candidate = currentSources.get(source.key)
      return !candidate || !sameSourceIdentity(source, candidate)
    })
    staleSources.push(...current.sources.filter(source => !packetSources.has(source.key)))
    const staleAuthority = staleSources.filter(source => source.role === 'authority')
    if (staleAuthority.length > 0) {
      return {
        state: 'full-rebuild',
        packet: null,
        staleSourceKeys: staleSources.map(source => source.key),
        rereadSourceKeys: uniqueStrings([
          ...current.sources.filter(source => source.role === 'authority').map(source => source.key),
          ...staleSources.map(source => source.key),
        ]),
        reasons: ['one or more authority sources changed'],
      }
    }

    const authorityKeys = current.sources
      .filter(source => source.role === 'authority')
      .map(source => source.key)
    if (staleSources.length === 0) {
      return {
        state: 'fresh',
        packet,
        staleSourceKeys: [],
        rereadSourceKeys: authorityKeys,
        reasons: [],
      }
    }
    const staleKeys = new Set(staleSources.map(source => source.key))
    const targetedPacket: RuntimeContextPacket = {
      ...packet,
      freshness: {
        ...packet.freshness,
        sources: packet.freshness.sources.filter(source => !staleKeys.has(source.key)),
      },
      data: {
        ...packet.data,
        evidence: packet.data.evidence.filter(item => !staleKeys.has(item.sourceKey)),
      },
    }
    return {
      state: 'targeted-reread',
      packet: targetedPacket,
      staleSourceKeys: [...staleKeys],
      rereadSourceKeys: uniqueStrings([...authorityKeys, ...staleKeys]),
      reasons: ['one or more evidence sources changed'],
    }
  }

  applyRetention(policy: RuntimeRetentionPolicy): RuntimeRetentionResult {
    this.assertOpen()
    if (!Number.isSafeInteger(policy.runMaxAgeMs) || policy.runMaxAgeMs <= 0)
      throw new RuntimeStoreError('runtime_retention_invalid', 'runMaxAgeMs must be a positive integer')
    if (!Number.isSafeInteger(policy.contextMaxAgeMs) || policy.contextMaxAgeMs <= 0)
      throw new RuntimeStoreError('runtime_retention_invalid', 'contextMaxAgeMs must be a positive integer')
    const maxRuns = positiveBound(policy.maxRuns ?? RUNTIME_MAX_RUNS, RUNTIME_MAX_RUNS, 'retained run count')
    const maxContextPackets = positiveBound(
      policy.maxContextPacketsPerRun ?? RUNTIME_MAX_CONTEXT_PACKETS_PER_RUN,
      RUNTIME_MAX_CONTEXT_PACKETS_PER_RUN,
      'retained context packet count',
    )
    const appliedAt = validIsoDate(policy.now ?? this.now().toISOString(), 'retention application time')
    const appliedAtMs = Date.parse(appliedAt)
    const runCutoff = new Date(appliedAtMs - policy.runMaxAgeMs).toISOString()
    const contextCutoff = new Date(appliedAtMs - policy.contextMaxAgeMs).toISOString()
    const result = withImmediateTransaction(this.database, () => {
      let deletedContextPackets = Number(this.database.prepare(`
        DELETE FROM runtime_context_packets
        WHERE expires_at <= ?
           OR updated_at < ?
      `).run(appliedAt, contextCutoff).changes)

      const packetRows = this.database.prepare(`
        SELECT run_id, packet_key
        FROM runtime_context_packets
        ORDER BY run_id, updated_at DESC, packet_key
      `).all() as Array<{ run_id: string, packet_key: string }>
      const packetCounts = new Map<string, number>()
      for (const row of packetRows) {
        const count = packetCounts.get(row.run_id) ?? 0
        packetCounts.set(row.run_id, count + 1)
        if (count < maxContextPackets)
          continue
        deletedContextPackets += Number(this.database.prepare(`
          DELETE FROM runtime_context_packets
          WHERE run_id = ?
            AND packet_key = ?
        `).run(row.run_id, row.packet_key).changes)
      }

      let deletedRuns = Number(this.database.prepare(`
        DELETE FROM runtime_runs
        WHERE last_observed_at < ?
      `).run(runCutoff).changes)
      const excessRuns = this.database.prepare(`
        SELECT run_id
        FROM runtime_runs
        ORDER BY last_observed_at DESC, run_id
        LIMIT -1 OFFSET ?
      `).all(maxRuns) as Array<{ run_id: string }>
      for (const row of excessRuns) {
        deletedRuns += Number(this.database.prepare(`
          DELETE FROM runtime_runs
          WHERE run_id = ?
        `).run(row.run_id).changes)
      }
      const retainedRuns = integerValue(this.database.prepare('SELECT COUNT(*) AS value FROM runtime_runs').get())
      this.database.prepare(`
        INSERT INTO runtime_retention_runs (
          applied_at,
          run_cutoff,
          context_cutoff,
          max_runs,
          max_context_packets_per_run,
          deleted_runs,
          deleted_context_packets
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run(
        appliedAt,
        runCutoff,
        contextCutoff,
        maxRuns,
        maxContextPackets,
        deletedRuns,
        deletedContextPackets,
      )
      return {
        deletedRuns,
        deletedContextPackets,
        retainedRuns,
        appliedAt,
      }
    })
    this.database.exec('PRAGMA wal_checkpoint(PASSIVE)')
    return result
  }

  projectRun(runId: string, eventLimit = RUNTIME_MAX_PROJECTION_EVENTS): RuntimeRunProjection {
    this.assertOpen()
    const boundedLimit = positiveBound(eventLimit, RUNTIME_MAX_PROJECTION_EVENTS, 'runtime projection event limit')
    return withReadTransaction(this.database, () => {
      const run = this.getRun(runId)
      if (!run) {
        return {
          available: true,
          diagnostic: null,
          schema: { ...this.schema },
          run: null,
          events: [],
          eventsTruncated: false,
          dispatches: [],
          dispatchesTruncated: false,
          receipts: [],
          receiptsTruncated: false,
          deliveries: [],
          deliveriesTruncated: false,
        }
      }
      const eventRows = this.database.prepare(`
        SELECT
          event_id,
          run_id,
          dispatch_id,
          sequence,
          kind,
          actor_type,
          actor_id,
          parent_event_id,
          payload_json,
          redaction_count,
          observed_at,
          committed_at
        FROM runtime_events
        WHERE run_id = ?
        ORDER BY sequence
        LIMIT ?
      `).all(run.runId, boundedLimit + 1) as unknown as RuntimeEventProjectionRow[]
      const dispatchRows = this.database.prepare(`
        SELECT
          dispatch.dispatch_id,
          dispatch.run_id,
          dispatch.sequence,
          dispatch.lane,
          dispatch.worker_id,
          dispatch.worker_display_name,
          dispatch.worker_role,
          dispatch.parent_event_id,
          parent.event_id AS retained_parent_event_id,
          parent.sequence AS parent_event_sequence,
          parent.dispatch_id AS parent_dispatch_id,
          parent.actor_type AS parent_actor_type,
          dispatch.payload_json,
          dispatch.redaction_count,
          dispatch.created_at
        FROM runtime_dispatches AS dispatch
        LEFT JOIN runtime_events AS parent
          ON parent.run_id = dispatch.run_id
          AND parent.event_id = dispatch.parent_event_id
        WHERE dispatch.run_id = ?
        ORDER BY dispatch.sequence
        LIMIT ?
      `).all(run.runId, boundedLimit + 1) as unknown as RuntimeDispatchProjectionRow[]
      const receiptRows = this.database.prepare(`
        SELECT
          receipt.receipt_id,
          receipt.run_id,
          receipt.dispatch_id,
          dispatch.sequence AS dispatch_sequence,
          receipt.event_id,
          event.sequence,
          receipt.result,
          receipt.payload_json,
          receipt.redaction_count,
          receipt.observed_at,
          receipt.committed_at
        FROM runtime_receipts AS receipt
        JOIN runtime_dispatches AS dispatch
          ON dispatch.dispatch_id = receipt.dispatch_id
        JOIN runtime_events AS event
          ON event.event_id = receipt.event_id
        WHERE receipt.run_id = ?
        ORDER BY event.sequence
        LIMIT ?
      `).all(run.runId, boundedLimit + 1) as unknown as RuntimeReceiptProjectionRow[]
      const deliveryRows = this.database.prepare(`
        SELECT
          run_id,
          scope,
          idempotency_key,
          effect_id,
          delivery_count,
          duplicate_count,
          conflict_count,
          first_delivered_at,
          last_delivered_at
        FROM runtime_idempotency
        WHERE run_id = ?
        ORDER BY first_delivered_at, scope, effect_id
        LIMIT ?
      `).all(run.runId, boundedLimit + 1) as unknown as RuntimeDeliveryStatusRow[]
      return {
        available: true,
        diagnostic: null,
        schema: { ...this.schema },
        run,
        events: eventRows.slice(0, boundedLimit).map(row => this.runtimeEventFromProjectionRow(row)),
        eventsTruncated: eventRows.length > boundedLimit,
        dispatches: dispatchRows.slice(0, boundedLimit).map(runtimeDispatchFromProjectionRow),
        dispatchesTruncated: dispatchRows.length > boundedLimit,
        receipts: receiptRows.slice(0, boundedLimit).map(runtimeReceiptFromProjectionRow),
        receiptsTruncated: receiptRows.length > boundedLimit,
        deliveries: deliveryRows.slice(0, boundedLimit).map(runtimeDeliveryStatusFromRow),
        deliveriesTruncated: deliveryRows.length > boundedLimit,
      }
    })
  }

  private requireRun(runId: string): RuntimeRun {
    const run = this.getRun(runId)
    if (!run)
      throw new RuntimeStoreError('runtime_run_not_found', `Runtime run ${runId} does not exist`)
    return run
  }

  getDispatchForRun(runId: string, dispatchId: string): RuntimeDispatch | null {
    this.assertOpen()
    const normalizedRunId = runtimeIdentity(runId, 'run id')
    const normalizedDispatchId = runtimeIdentity(dispatchId, 'dispatch id')
    const row = this.database.prepare(`
      SELECT
        dispatch.dispatch_id,
        dispatch.run_id,
        dispatch.sequence,
        dispatch.lane,
        dispatch.worker_id,
        dispatch.worker_display_name,
        dispatch.worker_role,
        dispatch.parent_event_id,
        parent.event_id AS retained_parent_event_id,
        parent.sequence AS parent_event_sequence,
        parent.dispatch_id AS parent_dispatch_id,
        parent.actor_type AS parent_actor_type,
        dispatch.payload_json,
        dispatch.redaction_count,
        dispatch.created_at
      FROM runtime_dispatches AS dispatch
      LEFT JOIN runtime_events AS parent
        ON parent.run_id = dispatch.run_id
        AND parent.event_id = dispatch.parent_event_id
      WHERE dispatch.run_id = ?
        AND dispatch.dispatch_id = ?
    `).get(normalizedRunId, normalizedDispatchId) as RuntimeDispatchProjectionRow | undefined
    return row ? runtimeDispatchFromProjectionRow(row) : null
  }

  private getDispatch(dispatchId: string): RuntimeDispatch | null {
    const row = this.database.prepare(`
      SELECT
        dispatch.dispatch_id,
        dispatch.run_id,
        dispatch.sequence,
        dispatch.lane,
        dispatch.worker_id,
        dispatch.worker_display_name,
        dispatch.worker_role,
        dispatch.parent_event_id,
        parent.event_id AS retained_parent_event_id,
        parent.sequence AS parent_event_sequence,
        parent.dispatch_id AS parent_dispatch_id,
        parent.actor_type AS parent_actor_type,
        dispatch.payload_json,
        dispatch.redaction_count,
        dispatch.created_at
      FROM runtime_dispatches AS dispatch
      LEFT JOIN runtime_events AS parent
        ON parent.run_id = dispatch.run_id
        AND parent.event_id = dispatch.parent_event_id
      WHERE dispatch.dispatch_id = ?
    `).get(runtimeIdentity(dispatchId, 'dispatch id')) as RuntimeDispatchProjectionRow | undefined
    return row ? runtimeDispatchFromProjectionRow(row) : null
  }

  private requireDispatch(dispatchId: string): RuntimeDispatch {
    const dispatch = this.getDispatch(dispatchId)
    if (!dispatch)
      throw new RuntimeStoreError('runtime_dispatch_not_found', `Runtime dispatch ${dispatchId} does not exist`)
    return dispatch
  }

  private requireDispatchRow(dispatchId: string): RuntimeDispatchRow {
    const row = this.database.prepare(`
      SELECT dispatch_id, run_id, sequence, fingerprint
      FROM runtime_dispatches
      WHERE dispatch_id = ?
    `).get(dispatchId) as RuntimeDispatchRow | undefined
    if (!row)
      throw new RuntimeStoreError('runtime_dispatch_not_found', `Runtime dispatch ${dispatchId} does not exist`)
    return row
  }

  private getEvent(eventId: string): RuntimeEvent | null {
    const row = this.database.prepare(`
      SELECT
        event_id,
        run_id,
        dispatch_id,
        sequence,
        kind,
        actor_type,
        actor_id,
        parent_event_id,
        payload_json,
        redaction_count,
        observed_at,
        committed_at
      FROM runtime_events
      WHERE event_id = ?
    `).get(runtimeIdentity(eventId, 'event id')) as RuntimeEventProjectionRow | undefined
    return row ? this.runtimeEventFromProjectionRow(row) : null
  }

  private requireEvent(eventId: string): RuntimeEvent {
    const event = this.getEvent(eventId)
    if (!event)
      throw new RuntimeStoreError('runtime_event_not_found', `Runtime event ${eventId} does not exist`)
    return event
  }

  private requireEventRow(eventId: string): RuntimeEventIdentityRow {
    const row = this.database.prepare(`
      SELECT event_id, run_id, sequence, fingerprint
      FROM runtime_events
      WHERE event_id = ?
    `).get(eventId) as RuntimeEventIdentityRow | undefined
    if (!row)
      throw new RuntimeStoreError('runtime_event_not_found', `Runtime event ${eventId} does not exist`)
    return row
  }

  private findReceiptIdentity(
    receiptId: string,
    dispatchId: string,
    eventId: string,
  ): RuntimeReceiptIdentityRow | null {
    const rows = this.database.prepare(`
      SELECT receipt_id, run_id, dispatch_id, event_id, fingerprint
      FROM runtime_receipts
      WHERE receipt_id = ?
         OR dispatch_id = ?
         OR event_id = ?
    `).all(receiptId, dispatchId, eventId) as unknown as RuntimeReceiptIdentityRow[]
    if (rows.length === 0)
      return null
    const first = rows[0]!
    if (rows.some(row => row.receipt_id !== first.receipt_id)) {
      throw new RuntimeStoreError(
        'runtime_database_corrupt',
        'Runtime receipt identities resolve to multiple canonical rows',
      )
    }
    return first
  }

  private requireReceipt(receiptId: string): RuntimeReceipt {
    const row = this.database.prepare(`
      SELECT
        receipt.receipt_id,
        receipt.run_id,
        receipt.dispatch_id,
        dispatch.sequence AS dispatch_sequence,
        receipt.event_id,
        event.sequence,
        receipt.result,
        receipt.payload_json,
        receipt.redaction_count,
        receipt.observed_at,
        receipt.committed_at
      FROM runtime_receipts AS receipt
      JOIN runtime_dispatches AS dispatch
        ON dispatch.dispatch_id = receipt.dispatch_id
      JOIN runtime_events AS event
        ON event.event_id = receipt.event_id
      WHERE receipt.receipt_id = ?
    `).get(receiptId) as RuntimeReceiptProjectionRow | undefined
    if (!row)
      throw new RuntimeStoreError('runtime_receipt_not_found', `Runtime receipt ${receiptId} does not exist`)
    return runtimeReceiptFromProjectionRow(row)
  }

  private inspectIdempotency(
    runId: string,
    scope: RuntimeIdempotencyScope,
    idempotencyKey: string,
    fingerprint: string,
    deliveredAt: string,
  ): RuntimeIdempotencyOutcome {
    const row = this.database.prepare(`
      SELECT
        effect_id,
        fingerprint,
        delivery_count,
        duplicate_count,
        conflict_count
      FROM runtime_idempotency
      WHERE run_id = ?
        AND scope = ?
        AND idempotency_key = ?
    `).get(runId, scope, idempotencyKey) as RuntimeIdempotencyRow | undefined
    if (!row)
      return { kind: 'new' }
    if (row.fingerprint !== fingerprint) {
      this.database.prepare(`
        UPDATE runtime_idempotency
        SET
          delivery_count = delivery_count + 1,
          conflict_count = conflict_count + 1,
          last_delivered_at = ?
        WHERE run_id = ?
          AND scope = ?
          AND idempotency_key = ?
      `).run(deliveredAt, runId, scope, idempotencyKey)
      return {
        kind: 'conflict',
        error: new RuntimeStoreError(
          'runtime_idempotency_conflict',
          `Idempotency key ${idempotencyKey} was reused with different ${scope} content`,
        ),
      }
    }
    this.database.prepare(`
      UPDATE runtime_idempotency
      SET
        delivery_count = delivery_count + 1,
        duplicate_count = duplicate_count + 1,
        last_delivered_at = ?
      WHERE run_id = ?
        AND scope = ?
        AND idempotency_key = ?
    `).run(deliveredAt, runId, scope, idempotencyKey)
    return {
      kind: 'duplicate',
      effectId: row.effect_id,
      deliveryCount: row.delivery_count + 1,
      duplicateCount: row.duplicate_count + 1,
    }
  }

  private insertIdempotency(
    runId: string,
    scope: RuntimeIdempotencyScope,
    idempotencyKey: string,
    effectId: string,
    fingerprint: string,
    deliveredAt: string,
  ): void {
    this.database.prepare(`
      INSERT INTO runtime_idempotency (
        run_id,
        scope,
        idempotency_key,
        effect_id,
        fingerprint,
        delivery_count,
        duplicate_count,
        conflict_count,
        first_delivered_at,
        last_delivered_at
      ) VALUES (?, ?, ?, ?, ?, 1, 0, 0, ?, ?)
    `).run(
      runId,
      scope,
      idempotencyKey,
      effectId,
      fingerprint,
      deliveredAt,
      deliveredAt,
    )
  }

  private insertIdempotencyAlias(
    runId: string,
    scope: RuntimeIdempotencyScope,
    idempotencyKey: string,
    effectId: string,
    fingerprint: string,
    deliveredAt: string,
  ): void {
    this.database.prepare(`
      INSERT INTO runtime_idempotency (
        run_id,
        scope,
        idempotency_key,
        effect_id,
        fingerprint,
        delivery_count,
        duplicate_count,
        conflict_count,
        first_delivered_at,
        last_delivered_at
      ) VALUES (?, ?, ?, ?, ?, 1, 1, 0, ?, ?)
    `).run(
      runId,
      scope,
      idempotencyKey,
      effectId,
      fingerprint,
      deliveredAt,
      deliveredAt,
    )
  }

  private assertEventCapacity(runId: string): void {
    const eventCount = integerValue(this.database.prepare(`
      SELECT COUNT(*) AS value
      FROM runtime_events
      WHERE run_id = ?
    `).get(runId))
    if (eventCount >= RUNTIME_MAX_EVENTS_PER_RUN) {
      throw new RuntimeStoreError(
        'runtime_event_limit',
        `Run ${runId} reached the ${RUNTIME_MAX_EVENTS_PER_RUN} event limit`,
      )
    }
  }

  private assertDispatchIdentity(
    runId: string,
    dispatchId: string | null,
    required = false,
  ): void {
    if (!dispatchId) {
      if (required)
        throw new RuntimeStoreError('runtime_dispatch_required', `Run ${runId} requires a dispatch identity`)
      return
    }
    const row = this.requireDispatchRow(dispatchId)
    if (row.run_id !== runId) {
      throw new RuntimeStoreError(
        'runtime_dispatch_run_mismatch',
        `Dispatch ${dispatchId} belongs to another runtime run`,
      )
    }
  }

  private assertParentIdentity(runId: string, parentEventId: string | null): void {
    if (!parentEventId)
      return
    const row = this.database.prepare(`
      SELECT run_id
      FROM runtime_events
      WHERE event_id = ?
    `).get(parentEventId) as { run_id: string } | undefined
    if (row && row.run_id !== runId) {
      throw new RuntimeStoreError(
        'runtime_parent_run_mismatch',
        `Parent event ${parentEventId} belongs to another runtime run`,
      )
    }
  }

  private assertEventIdentityNamespace(runId: string, eventId: string): void {
    const reference = this.database.prepare(`
      SELECT run_id
      FROM runtime_events
      WHERE parent_event_id = ?
        AND run_id <> ?
      UNION ALL
      SELECT run_id
      FROM runtime_dispatches
      WHERE parent_event_id = ?
        AND run_id <> ?
      LIMIT 1
    `).get(eventId, runId, eventId, runId) as { run_id: string } | undefined
    if (reference) {
      throw new RuntimeStoreError(
        'runtime_event_identity_conflict',
        `Event ${eventId} is already reserved as a missing parent in another runtime run`,
      )
    }
  }

  private assertContextObservations(
    runId: string,
    sourceSequence: number,
    observations: RuntimeContextObservation[],
  ): void {
    for (const observation of observations) {
      const event = this.database.prepare(`
        SELECT run_id, sequence
        FROM runtime_events
        WHERE event_id = ?
      `).get(observation.eventId) as { run_id: string, sequence: number } | undefined
      if (!event
        || event.run_id !== runId
        || event.sequence !== observation.sequence
        || event.sequence > sourceSequence) {
        throw new RuntimeStoreError(
          'runtime_context_observation_invalid',
          `Context observation ${observation.eventId}@${observation.sequence} is not committed within source sequence ${sourceSequence} for run ${runId}`,
        )
      }
    }
  }

  private allocateSequence(runId: string, committedAt: string): number {
    const run = this.requireRun(runId)
    this.database.prepare(`
      UPDATE runtime_runs
      SET
        next_sequence = next_sequence + 1,
        last_observed_at = ?
      WHERE run_id = ?
        AND next_sequence = ?
    `).run(committedAt, runId, run.nextSequence)
    return run.nextSequence
  }

  private runtimeEventFromProjectionRow(row: RuntimeEventProjectionRow): RuntimeEvent {
    let parentState: RuntimeEvent['parentState'] = 'none'
    if (row.parent_event_id) {
      const parent = this.database.prepare(`
        SELECT run_id, sequence
        FROM runtime_events
        WHERE event_id = ?
      `).get(row.parent_event_id) as { run_id: string, sequence: number } | undefined
      if (!parent)
        parentState = 'missing'
      else if (parent.run_id !== row.run_id)
        throw new RuntimeStoreError('runtime_database_corrupt', 'Runtime event parent crosses run identity')
      else
        parentState = parent.sequence < row.sequence ? 'before' : 'after'
    }
    return {
      runId: row.run_id,
      eventId: row.event_id,
      sequence: row.sequence,
      kind: row.kind,
      actorType: row.actor_type,
      actorId: row.actor_id,
      dispatchId: row.dispatch_id,
      parentEventId: row.parent_event_id,
      parentState,
      outOfOrder: parentState === 'after' || parentState === 'missing',
      payload: parseRuntimeJson(row.payload_json, `event ${row.event_id} payload`),
      redactionCount: row.redaction_count,
      observedAt: row.observed_at,
      committedAt: row.committed_at,
    }
  }

  private assertOpen(): void {
    if (this.closed)
      throw new RuntimeStoreError('runtime_store_closed', 'Runtime event store is closed')
  }
}

export async function openRuntimeEventStore(
  options: OpenRuntimeEventStoreOptions,
): Promise<RuntimeEventStore> {
  const project = normalizeProjectIdentity(options.project)
  const namespacePath = resolve(options.namespacePath)
  const create = options.create !== false
  await ensureRuntimeNamespace(namespacePath, create)
  const databasePath = runtimeDatabasePath(namespacePath)
  const existing = await inspectRuntimeFile(databasePath)
  if (!existing && !create) {
    throw new RuntimeStoreError(
      'runtime_database_absent',
      `Runtime database is absent for checkout ${project.root}`,
    )
  }
  const { DatabaseSync } = await loadNodeSqlite()
  let database: DatabaseSync | null = null
  try {
    database = new DatabaseSync(databasePath, {
      readOnly: false,
      enableForeignKeyConstraints: true,
      enableDoubleQuotedStringLiterals: false,
      allowExtension: false,
    })
    configureWritableDatabase(database)
    const migration = migrateRuntimeDatabase(database, project)
    assertDatabaseIntegrity(database)
    if (process.platform !== 'win32')
      await chmod(databasePath, 0o600)
    return new RuntimeEventStore(
      database,
      namespacePath,
      project,
      migration.schema,
      options.now ?? (() => new Date()),
    )
  }
  catch (error) {
    database?.close()
    throw normalizeRuntimeDatabaseError(error, databasePath)
  }
}

export async function inspectRuntimeDatabase(
  namespacePath: string,
  projectInput: RuntimeProjectIdentity,
): Promise<RuntimeDatabaseInspection> {
  const project = normalizeProjectIdentity(projectInput)
  const resolvedNamespacePath = resolve(namespacePath)
  const databasePath = runtimeDatabasePath(resolvedNamespacePath)
  try {
    return await withRuntimeInspectionSnapshot(resolvedNamespacePath, async (snapshot) => {
      if (!snapshot) {
        return {
          state: 'absent',
          databasePath,
          schema: null,
          diagnostic: null,
        }
      }
      let database: DatabaseSync | null = null
      try {
        const { DatabaseSync } = await loadNodeSqlite()
        database = new DatabaseSync(snapshot.snapshotDatabasePath, {
          readOnly: true,
          enableForeignKeyConstraints: true,
          enableDoubleQuotedStringLiterals: false,
          allowExtension: false,
        })
        database.exec('PRAGMA query_only = ON')
        database.exec(`PRAGMA busy_timeout = ${RUNTIME_BUSY_TIMEOUT_MS}`)
        assertDatabaseIntegrity(database)
        const schema = inspectRuntimeSchema(database, project)
        return {
          state: schema.version === RUNTIME_STORE_SCHEMA_VERSION ? 'ready' : 'migration-required',
          databasePath,
          schema,
          diagnostic: schema.version === RUNTIME_STORE_SCHEMA_VERSION
            ? null
            : {
                code: 'runtime_migration_required',
                message: `Runtime database schema 1.${schema.version} requires migration to 1.${RUNTIME_STORE_SCHEMA_VERSION}`,
                action: 'Open the checkout through a compatible RSP Broker session to migrate it atomically',
              },
        }
      }
      finally {
        database?.close()
      }
    })
  }
  catch (error) {
    return inspectionFromError(databasePath, normalizeRuntimeDatabaseError(error, databasePath))
  }
}

export async function inspectRuntimeContextPackets(
  options: InspectRuntimeContextPacketsOptions,
): Promise<RuntimeContextPacketInspection> {
  const project = normalizeProjectIdentity(options.project)
  const limit = positiveBound(options.limit ?? 32, 100, 'runtime context inspection limit')
  const resolvedNamespacePath = resolve(options.namespacePath)
  const databasePath = runtimeDatabasePath(resolvedNamespacePath)
  try {
    return await withRuntimeInspectionSnapshot(resolvedNamespacePath, async (snapshot) => {
      if (!snapshot) {
        throw new RuntimeStoreError(
          'runtime_database_absent',
          `Runtime database is absent for checkout ${project.root}`,
        )
      }
      let database: DatabaseSync | null = null
      try {
        const { DatabaseSync } = await loadNodeSqlite()
        database = new DatabaseSync(snapshot.snapshotDatabasePath, {
          readOnly: true,
          enableForeignKeyConstraints: true,
          enableDoubleQuotedStringLiterals: false,
          allowExtension: false,
        })
        database.exec('PRAGMA query_only = ON')
        database.exec(`PRAGMA busy_timeout = ${RUNTIME_BUSY_TIMEOUT_MS}`)
        assertDatabaseIntegrity(database)
        const schema = inspectRuntimeSchema(database, project)
        if (schema.version !== RUNTIME_STORE_SCHEMA_VERSION) {
          throw new RuntimeStoreError(
            'runtime_migration_required',
            `Runtime database schema 1.${schema.version} requires migration to 1.${RUNTIME_STORE_SCHEMA_VERSION}`,
            'Open the checkout through a compatible RSP Broker session to migrate it atomically',
          )
        }

        const rows = database.prepare(`
      SELECT
        packets.run_id,
        packets.packet_key,
        packets.version,
        packets.source_sequence,
        packets.schema_version,
        packets.freshness_json,
        packets.data_json,
        packets.redaction_count,
        packets.expires_at,
        packets.updated_at,
        runs.work_ref,
        runs.next_sequence - 1 AS committed_sequence
      FROM runtime_context_packets AS packets
      INNER JOIN runtime_runs AS runs
        ON runs.run_id = packets.run_id
      ORDER BY packets.updated_at DESC, packets.run_id, packets.packet_key
      LIMIT ?
    `).all(limit + 1) as unknown as Array<RuntimeContextPacketRow & {
          work_ref: string
          committed_sequence: number
        }>
        const total = Number((database.prepare(`
      SELECT COUNT(*) AS count
      FROM runtime_context_packets
    `).get() as { count: number | bigint }).count)
        const returnedRows = rows.slice(0, limit)
        const now = Date.now()
        const records = []
        for (const row of returnedRows) {
          const packet = runtimeContextPacketFromRow(row, {
            allowInvalidTimestamps: true,
          })
          const reasons = await inspectContextPacketFreshness({
            packet,
            row,
            project,
            currentGitHead: options.currentGitHead,
            sourceHash: options.sourceHash,
            now,
          })
          const boundedReasons = reasons.slice(0, 8)
          if (reasons.length > boundedReasons.length)
            boundedReasons.push(`${reasons.length - boundedReasons.length} additional freshness reason(s) omitted`)
          records.push({
            runId: packet.runId,
            packetKey: packet.packetKey,
            workRef: row.work_ref,
            state: reasons.length === 0 ? 'fresh' as const : 'stale' as const,
            disposable: true as const,
            reasons: boundedReasons,
            sourceSequence: packet.sourceSequence,
            committedSequence: row.committed_sequence,
            schemaVersion: packet.schemaVersion,
            expiresAt: packet.expiresAt,
            updatedAt: packet.updatedAt,
          })
        }
        return {
          records,
          total,
          returned: records.length,
          hasMore: total > records.length,
        }
      }
      finally {
        database?.close()
      }
    })
  }
  catch (error) {
    throw normalizeRuntimeDatabaseError(error, databasePath)
  }
}

async function inspectContextPacketFreshness(options: {
  packet: RuntimeContextPacket
  row: RuntimeContextPacketRow & {
    work_ref: string
    committed_sequence: number
  }
  project: RuntimeProjectIdentity
  currentGitHead: string
  sourceHash: (projectRelativePath: string) => Promise<string | null>
  now: number
}): Promise<string[]> {
  const reasons: string[] = []
  const updatedAt = strictStoredIsoTime(options.packet.updatedAt)
  const expiresAt = strictStoredIsoTime(options.packet.expiresAt)
  if (updatedAt === null)
    reasons.push('context packet update timestamp is invalid')
  if (expiresAt === null)
    reasons.push('context packet expiration timestamp is invalid')
  if (updatedAt !== null && expiresAt !== null) {
    if (expiresAt <= updatedAt)
      reasons.push('context packet timestamp ordering is invalid')
    if (updatedAt > options.now)
      reasons.push('context packet update time is in the future')
    if (expiresAt <= options.now)
      reasons.push('context packet expired')
  }
  if (options.packet.schemaVersion !== RUNTIME_CONTEXT_PACKET_SCHEMA_VERSION)
    reasons.push('context packet schema changed')
  if (options.packet.sourceSequence !== options.row.committed_sequence)
    reasons.push('committed runtime revision changed')
  if (options.packet.freshness.projectId !== options.project.projectId)
    reasons.push('checkout project identity changed')
  if (options.packet.freshness.checkoutRoot !== options.project.root)
    reasons.push('checkout root changed')
  if (options.packet.freshness.workRef !== options.row.work_ref)
    reasons.push('WorkRef changed')
  if (options.packet.freshness.gitHead !== options.currentGitHead)
    reasons.push('Git HEAD changed')
  for (const source of options.packet.freshness.sources) {
    const hash = await options.sourceHash(source.path)
    if (hash === null)
      reasons.push(`source unavailable: ${source.key}`)
    else if (hash !== source.contentHash)
      reasons.push(`source changed: ${source.key}`)
  }
  return reasons
}

export async function readRuntimeRunProjection(options: {
  namespacePath: string
  project: RuntimeProjectIdentity
  runId: string
  eventLimit?: number
}): Promise<RuntimeRunProjection> {
  const inspection = await inspectRuntimeDatabase(options.namespacePath, options.project)
  if (inspection.state === 'absent' || inspection.state === 'unavailable') {
    return {
      available: false,
      diagnostic: inspection.diagnostic,
      schema: inspection.schema,
      run: null,
      events: [],
      eventsTruncated: false,
      dispatches: [],
      dispatchesTruncated: false,
      receipts: [],
      receiptsTruncated: false,
      deliveries: [],
      deliveriesTruncated: false,
    }
  }
  if (inspection.state === 'incompatible'
    || inspection.state === 'corrupt'
    || inspection.state === 'invalid') {
    return {
      available: false,
      diagnostic: inspection.diagnostic,
      schema: inspection.schema,
      run: null,
      events: [],
      eventsTruncated: false,
      dispatches: [],
      dispatchesTruncated: false,
      receipts: [],
      receiptsTruncated: false,
      deliveries: [],
      deliveriesTruncated: false,
    }
  }
  const store = await openRuntimeEventStore({
    namespacePath: options.namespacePath,
    project: options.project,
    create: false,
  })
  try {
    return store.projectRun(options.runId, options.eventLimit)
  }
  finally {
    store.close()
  }
}

export async function readRuntimeProjectProjectionSnapshot(options: {
  namespacePath: string
  project: RuntimeProjectIdentity
  runLimit?: number
  eventLimit?: number
  now?: () => Date
}): Promise<RuntimeProjectProjectionSnapshot> {
  const project = normalizeProjectIdentity(options.project)
  const namespacePath = resolve(options.namespacePath)
  const databasePath = runtimeDatabasePath(namespacePath)
  const runLimit = positiveBound(
    options.runLimit ?? RUNTIME_MAX_PROJECTION_RUNS,
    RUNTIME_MAX_PROJECTION_RUNS,
    'runtime projection run limit',
  )
  const eventLimit = positiveBound(
    options.eventLimit ?? RUNTIME_MAX_PROJECTION_EVENTS,
    RUNTIME_MAX_PROJECTION_EVENTS,
    'runtime projection event limit',
  )
  try {
    return await withRuntimeInspectionSnapshot(namespacePath, async (snapshot) => {
      if (!snapshot) {
        return {
          state: 'absent',
          schema: null,
          diagnostic: {
            code: 'runtime_database_absent',
            message: 'Managed runtime storage is absent for this checkout',
            action: null,
          },
          runs: [],
          runsTruncated: false,
          projections: [],
        }
      }
      const { DatabaseSync } = await loadNodeSqlite()
      const database = new DatabaseSync(snapshot.snapshotDatabasePath, {
        readOnly: true,
        enableForeignKeyConstraints: true,
        enableDoubleQuotedStringLiterals: false,
        allowExtension: false,
      })
      database.exec('PRAGMA query_only = ON')
      database.exec(`PRAGMA busy_timeout = ${RUNTIME_BUSY_TIMEOUT_MS}`)
      try {
        assertDatabaseIntegrity(database)
        const schema = inspectRuntimeSchema(database, project)
        if (schema.version !== RUNTIME_STORE_SCHEMA_VERSION) {
          return {
            state: 'migration-required',
            schema,
            diagnostic: {
              code: 'runtime_migration_required',
              message: `Runtime database schema 1.${schema.version} requires migration to 1.${RUNTIME_STORE_SCHEMA_VERSION}`,
              action: 'Open the checkout through a compatible RSP Broker session to migrate it atomically',
            },
            runs: [],
            runsTruncated: false,
            projections: [],
          }
        }
        const store = new RuntimeEventStore(
          database,
          snapshot.snapshotNamespacePath,
          project,
          schema,
          options.now ?? (() => new Date()),
        )
        const listed = store.listRuns(runLimit)
        const projections = listed.runs.map(run => store.projectRun(run.runId, eventLimit))
        return {
          state: 'ready',
          schema,
          diagnostic: null,
          runs: listed.runs,
          runsTruncated: listed.truncated,
          projections,
        }
      }
      finally {
        database.close()
      }
    })
  }
  catch (error) {
    const inspection = inspectionFromError(
      databasePath,
      normalizeRuntimeDatabaseError(error, databasePath),
    )
    return {
      state: inspection.state,
      schema: inspection.schema,
      diagnostic: inspection.diagnostic,
      runs: [],
      runsTruncated: false,
      projections: [],
    }
  }
}

export interface RuntimeDisposalOptions {
  testing?: {
    /** Internal deterministic race hook; not part of the packaged API contract. */
    afterNamespaceCapture?: () => Promise<void>
  }
}

export interface RuntimeDisposalScope {
  projectId: string
  cacheRoot: string
  projectsRoot: string
  namespacePath: string
}

export async function disposeRuntimeDatabase(
  scope: RuntimeDisposalScope,
  options: RuntimeDisposalOptions = {},
): Promise<string[]> {
  const cacheRoot = resolve(scope.cacheRoot)
  const projectsRoot = resolve(scope.projectsRoot)
  const root = resolve(scope.namespacePath)
  if (!/^[a-f0-9]{64}$/u.test(scope.projectId)
    || projectsRoot !== join(cacheRoot, 'projects')
    || root !== join(projectsRoot, scope.projectId)
    || !isPathContained(cacheRoot, projectsRoot)
    || !isPathContained(projectsRoot, root)
    || dirname(root) !== projectsRoot) {
    throw new RuntimeStoreError(
      'runtime_disposal_scope_invalid',
      'Runtime disposal target must bind one project identity to its exact cache projects namespace',
    )
  }
  const projectsChain = await captureStableDirectoryChain({
    rootPath: cacheRoot,
    targetPath: projectsRoot,
    requiredPath: projectsRoot,
    label: 'runtime disposal cache root',
  })
  await assertStableDirectoryChain(projectsChain, 'runtime disposal cache root')
  if (!await inspectDisposableRuntimeNamespace(root))
    return []
  const namespaceChain = await captureStableDirectoryChain({
    rootPath: cacheRoot,
    targetPath: root,
    requiredPath: projectsRoot,
    label: 'runtime disposal namespace',
  })
  await options.testing?.afterNamespaceCapture?.()
  await assertStableDirectoryChain(namespaceChain, 'runtime disposal namespace')
  const databasePath = runtimeDatabasePath(root)
  const candidates = [
    databasePath,
    `${databasePath}-wal`,
    `${databasePath}-shm`,
    `${databasePath}-journal`,
  ]
  const removed: string[] = []
  for (const candidate of candidates) {
    await assertStableDirectoryChain(namespaceChain, 'runtime disposal namespace')
    const identity = await inspectDisposableRuntimeFile(candidate)
    if (!identity)
      continue
    await assertStableDirectoryChain(namespaceChain, 'runtime disposal namespace')
    if (await unlinkRuntimeFileIfIdentity(candidate, identity, namespaceChain))
      removed.push(candidate)
  }
  await assertStableDirectoryChain(namespaceChain, 'runtime disposal namespace')
  return removed
}

export function runtimeDatabasePath(namespacePath: string): string {
  return join(resolve(namespacePath), RUNTIME_DATABASE_FILENAME)
}

interface RuntimeRunRow {
  run_id: string
  run_key: string
  work_ref: string
  next_sequence: number
  created_at: string
  last_observed_at: string
}

interface RuntimeDispatchRow {
  dispatch_id: string
  run_id: string
  sequence: number
  fingerprint: string
}

interface RuntimeDispatchProjectionRow {
  dispatch_id: string
  run_id: string
  sequence: number
  lane: string
  worker_id: string
  worker_display_name: string | null
  worker_role: string | null
  parent_event_id: string | null
  retained_parent_event_id: string | null
  parent_event_sequence: number | null
  parent_dispatch_id: string | null
  parent_actor_type: RuntimeEvent['actorType'] | null
  payload_json: string
  redaction_count: number
  created_at: string
}

interface RuntimeEventIdentityRow {
  event_id: string
  run_id: string
  sequence: number
  fingerprint: string
}

interface RuntimeEventProjectionRow {
  event_id: string
  run_id: string
  dispatch_id: string | null
  sequence: number
  kind: string
  actor_type: RuntimeEvent['actorType']
  actor_id: string
  parent_event_id: string | null
  payload_json: string
  redaction_count: number
  observed_at: string
  committed_at: string
}

interface RuntimeReceiptIdentityRow {
  receipt_id: string
  run_id: string
  dispatch_id: string
  event_id: string
  fingerprint: string
}

interface RuntimeReceiptProjectionRow {
  receipt_id: string
  run_id: string
  dispatch_id: string
  dispatch_sequence: number
  event_id: string
  sequence: number
  result: string
  payload_json: string
  redaction_count: number
  observed_at: string
  committed_at: string
}

interface RuntimeCheckpointRow {
  run_id: string
  projector: string
  projector_version: string
  version: number
  source_sequence: number
  payload_json: string
  redaction_count: number
  updated_at: string
}

interface RuntimeContextPacketRow {
  run_id: string
  packet_key: string
  version: number
  source_sequence: number
  schema_version: number
  freshness_json: string
  data_json: string
  redaction_count: number
  expires_at: string
  updated_at: string
}

interface RuntimeIdempotencyRow {
  effect_id: string
  fingerprint: string
  delivery_count: number
  duplicate_count: number
  conflict_count: number
}

interface RuntimeDeliveryProjectionRow {
  effect_id: string
  delivery_count: number
  duplicate_count: number
  conflict_count: number
  first_delivered_at: string
  last_delivered_at: string
}

interface RuntimeDeliveryStatusRow extends RuntimeDeliveryProjectionRow {
  run_id: string
  scope: RuntimeDeliveryStatus['scope']
  idempotency_key: string
}

type RuntimeIdempotencyScope = RuntimeDeliveryStatus['scope']

type RuntimeIdempotencyOutcome
  = | { kind: 'new' }
    | {
      kind: 'duplicate'
      effectId: string
      deliveryCount: number
      duplicateCount: number
    }
    | {
      kind: 'conflict'
      error: RuntimeStoreError
    }

interface NormalizedRuntimeDispatchInput {
  runId: string
  dispatchId: string
  idempotencyKey: string
  lane: string
  workerId: string
  workerDisplayName: string | null
  workerRole: string | null
  parentEventId: string | null
  payload: RuntimeJson
  createdAt: string
}

interface NormalizedRuntimeEventInput {
  runId: string
  eventId: string
  idempotencyKey: string
  kind: string
  actorType: RuntimeEvent['actorType']
  actorId: string
  dispatchId: string | null
  parentEventId: string | null
  payload: RuntimeJson
  observedAt: string
}

interface NormalizedRuntimeReceiptInput {
  runId: string
  receiptId: string
  dispatchId: string
  eventId: string
  idempotencyKey: string
  result: string
  actorId: string
  parentEventId: string | null
  payload: RuntimeJson
  observedAt: string
}

interface NormalizedRuntimeContextPacketInput {
  runId: string
  packetKey: string
  expectedVersion: number
  sourceSequence: number
  freshness: RuntimeFreshnessIdentity
  data: RuntimeContextPacketData
  expiresAt: string
  updatedAt: string
}

interface RuntimeFileIdentity {
  device: number
  inode: number
}

function normalizeDispatchInput(
  input: RuntimeDispatchInput,
  now: () => Date,
): NormalizedRuntimeDispatchInput {
  return {
    runId: runtimeIdentity(input.runId, 'run id'),
    dispatchId: runtimeIdentity(input.dispatchId, 'dispatch id'),
    idempotencyKey: runtimeIdentity(input.idempotencyKey, 'idempotency key'),
    lane: runtimeIdentity(input.lane, 'dispatch lane'),
    workerId: runtimeIdentity(input.workerId, 'worker id'),
    workerDisplayName: optionalRuntimeIdentity(input.workerDisplayName, 'worker display name'),
    workerRole: optionalRuntimeIdentity(input.workerRole, 'worker role'),
    parentEventId: optionalRuntimeIdentity(input.parentEventId, 'parent event id'),
    payload: input.payload ?? {},
    createdAt: validIsoDate(input.createdAt ?? now().toISOString(), 'dispatch creation time'),
  }
}

function normalizeEventInput(
  input: RuntimeEventInput,
  now: () => Date,
): NormalizedRuntimeEventInput {
  if (!['manager', 'worker', 'system'].includes(input.actorType))
    throw new RuntimeStoreError('runtime_actor_invalid', `Unsupported runtime actor type: ${input.actorType}`)
  return {
    runId: runtimeIdentity(input.runId, 'run id'),
    eventId: runtimeIdentity(input.eventId, 'event id'),
    idempotencyKey: runtimeIdentity(input.idempotencyKey, 'idempotency key'),
    kind: runtimeIdentity(input.kind, 'event kind'),
    actorType: input.actorType,
    actorId: runtimeIdentity(input.actorId, 'actor id'),
    dispatchId: optionalRuntimeIdentity(input.dispatchId, 'dispatch id'),
    parentEventId: optionalRuntimeIdentity(input.parentEventId, 'parent event id'),
    payload: input.payload ?? {},
    observedAt: validIsoDate(input.observedAt ?? now().toISOString(), 'event observation time'),
  }
}

function normalizeReceiptInput(
  input: RuntimeReceiptInput,
  now: () => Date,
): NormalizedRuntimeReceiptInput {
  return {
    runId: runtimeIdentity(input.runId, 'run id'),
    receiptId: runtimeIdentity(input.receiptId, 'receipt id'),
    dispatchId: runtimeIdentity(input.dispatchId, 'dispatch id'),
    eventId: runtimeIdentity(input.eventId, 'event id'),
    idempotencyKey: runtimeIdentity(input.idempotencyKey, 'idempotency key'),
    result: runtimeIdentity(input.result, 'receipt result'),
    actorId: runtimeIdentity(input.actorId, 'receipt actor id'),
    parentEventId: optionalRuntimeIdentity(input.parentEventId, 'parent event id'),
    payload: input.payload ?? {},
    observedAt: validIsoDate(input.observedAt ?? now().toISOString(), 'receipt observation time'),
  }
}

function normalizeContextPacketInput(
  input: RuntimeContextPacketInput,
  project: RuntimeProjectIdentity,
  now: () => Date,
): NormalizedRuntimeContextPacketInput {
  const serviceNow = now()
  const updatedAt = validIsoDate(input.updatedAt ?? serviceNow.toISOString(), 'context packet update time')
  if (Date.parse(updatedAt) > serviceNow.getTime()) {
    throw new RuntimeStoreError(
      'runtime_context_time_invalid',
      'Context packet update time cannot be later than the runtime clock',
    )
  }
  const expiresAt = validIsoDate(input.expiresAt, 'context packet expiration time')
  if (Date.parse(expiresAt) <= Date.parse(updatedAt))
    throw new RuntimeStoreError('runtime_context_expiry_invalid', 'Context packet expiration must be after its update time')
  const freshness = normalizeFreshnessIdentity(input.freshness, project)
  const data = normalizeContextData(input.data, freshness.sources)
  return {
    runId: runtimeIdentity(input.runId, 'run id'),
    packetKey: runtimeIdentity(input.packetKey, 'context packet key'),
    expectedVersion: nonNegativeInteger(input.expectedVersion, 'expected context packet version'),
    sourceSequence: nonNegativeInteger(input.sourceSequence, 'context packet source sequence'),
    freshness,
    data,
    expiresAt,
    updatedAt,
  }
}

function normalizeFreshnessIdentity(
  input: RuntimeFreshnessIdentity,
  project: RuntimeProjectIdentity,
): RuntimeFreshnessIdentity {
  const projectId = runtimeProjectId(input.projectId)
  const checkoutRoot = resolve(boundedText(input.checkoutRoot, MAX_PATH_BYTES, 'checkout root'))
  if (projectId !== project.projectId || checkoutRoot !== project.root) {
    throw new RuntimeStoreError(
      'runtime_context_project_mismatch',
      'Context freshness identity does not match the registered checkout',
    )
  }
  if (input.sources.length > MAX_CONTEXT_LIST_ITEMS)
    throw new RuntimeStoreError('runtime_context_bound', `Context packet exceeds ${MAX_CONTEXT_LIST_ITEMS} sources`)
  const sources = input.sources.map(normalizeSourceIdentity)
  if (new Set(sources.map(source => source.key)).size !== sources.length)
    throw new RuntimeStoreError('runtime_context_source_duplicate', 'Context source keys must be unique')
  return {
    projectId,
    checkoutRoot,
    workRef: boundedText(input.workRef, MAX_WORK_REF_BYTES, 'context WorkRef'),
    gitHead: runtimeIdentity(input.gitHead, 'Git HEAD identity'),
    dirtyPathsHash: sha256Identity(input.dirtyPathsHash, 'dirty-path identity'),
    authorityHash: sha256Identity(input.authorityHash, 'authority identity'),
    sources,
  }
}

function normalizeSourceIdentity(input: RuntimeSourceIdentity): RuntimeSourceIdentity {
  if (input.role !== 'authority' && input.role !== 'evidence')
    throw new RuntimeStoreError('runtime_context_source_invalid', `Invalid source role: ${input.role}`)
  return {
    key: runtimeIdentity(input.key, 'context source key'),
    role: input.role,
    path: runtimeRelativePath(input.path, 'context source path'),
    contentHash: sha256Identity(input.contentHash, 'context source content hash'),
    revision: input.revision === undefined || input.revision === null
      ? null
      : runtimeIdentity(input.revision, 'context source revision'),
  }
}

function normalizeContextData(
  input: RuntimeContextPacketData,
  sources: RuntimeSourceIdentity[],
): RuntimeContextPacketData {
  const sourceKeys = new Set(sources.map(source => source.key))
  const authorityRefs = boundedList(input.authorityRefs, 'authority references')
    .map(path => runtimeRelativePath(path, 'authority reference'))
  const authoritySourcePaths = sources
    .filter(source => source.role === 'authority')
    .map(source => source.path)
  if (new Set(authorityRefs).size !== authorityRefs.length
    || new Set(authoritySourcePaths).size !== authoritySourcePaths.length
    || authorityRefs.length !== authoritySourcePaths.length
    || authorityRefs.some(path => !authoritySourcePaths.includes(path))) {
    throw new RuntimeStoreError(
      'runtime_context_authority_mismatch',
      'Context authority references must correspond one-to-one with freshness authority sources',
    )
  }
  const decisiveObservations = boundedList(input.decisiveObservations, 'decisive observations')
    .map(normalizeContextObservation)
  if (new Set(decisiveObservations.map(observation => observation.eventId)).size
    !== decisiveObservations.length) {
    throw new RuntimeStoreError(
      'runtime_context_observation_duplicate',
      'Context decisive observations must use unique committed event identities',
    )
  }
  return {
    phase: runtimeIdentity(input.phase, 'context phase'),
    authorityRefs,
    decisiveObservations,
    blockers: boundedList(input.blockers, 'context blockers')
      .map(value => boundedText(value, 2_048, 'context blocker')),
    attention: boundedList(input.attention, 'context attention')
      .map(value => boundedText(value, 2_048, 'context attention item')),
    evidence: boundedList(input.evidence, 'context evidence')
      .map((item) => {
        const value = normalizeContextEvidence(item)
        if (!sourceKeys.has(value.sourceKey)) {
          throw new RuntimeStoreError(
            'runtime_context_source_missing',
            `Context evidence references unknown source ${value.sourceKey}`,
          )
        }
        return value
      }),
    changedPaths: boundedList(input.changedPaths, 'changed paths')
      .map(path => runtimeRelativePath(path, 'changed path')),
    nextAction: input.nextAction === null
      ? null
      : boundedText(input.nextAction, 4_096, 'context next action'),
  }
}

function normalizeContextObservation(input: RuntimeContextObservation): RuntimeContextObservation {
  return {
    eventId: runtimeIdentity(input.eventId, 'context event id'),
    sequence: positiveInteger(input.sequence, 'context event sequence'),
    summary: boundedText(input.summary, 2_048, 'context observation summary'),
  }
}

function normalizeContextEvidence(input: RuntimeContextEvidence): RuntimeContextEvidence {
  return {
    sourceKey: runtimeIdentity(input.sourceKey, 'context evidence source key'),
    summary: boundedText(input.summary, 2_048, 'context evidence summary'),
  }
}

function runtimeRunFromRow(row: RuntimeRunRow): RuntimeRun {
  return {
    runId: row.run_id,
    runKey: row.run_key,
    workRef: row.work_ref,
    nextSequence: row.next_sequence,
    createdAt: row.created_at,
    lastObservedAt: row.last_observed_at,
  }
}

function runtimeDispatchFromProjectionRow(row: RuntimeDispatchProjectionRow): RuntimeDispatch {
  const relationship = runtimeDispatchRelationship(row)
  return {
    runId: row.run_id,
    dispatchId: row.dispatch_id,
    sequence: row.sequence,
    lane: row.lane,
    workerId: row.worker_id,
    workerDisplayName: row.worker_display_name,
    workerRole: row.worker_role,
    parentEventId: row.parent_event_id,
    parentDispatchId: row.parent_dispatch_id,
    relationship,
    payload: parseRuntimeJson(row.payload_json, `dispatch ${row.dispatch_id} payload`),
    redactionCount: row.redaction_count,
    createdAt: row.created_at,
  }
}

function runtimeDispatchRelationship(
  row: RuntimeDispatchProjectionRow,
): RuntimeDispatch['relationship'] {
  if (!row.parent_event_id)
    return 'root'
  if (!row.retained_parent_event_id)
    return 'missing'
  if (row.parent_event_sequence === null)
    return 'unresolved'
  if (row.parent_dispatch_id === row.dispatch_id)
    return 'same-dispatch'
  if (row.parent_event_sequence >= row.sequence)
    return 'later'
  if (row.parent_dispatch_id)
    return 'resolved'
  if (row.parent_actor_type === 'manager' || row.parent_actor_type === 'system')
    return 'manager-root'
  return 'unresolved'
}

function runtimeJsonObject(value: RuntimeJson): Record<string, RuntimeJson> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? value
    : {}
}

function runtimeOptionalString(value: RuntimeJson | undefined): string | null {
  return typeof value === 'string' ? value : null
}

function runtimeReceiptFromProjectionRow(row: RuntimeReceiptProjectionRow): RuntimeReceipt {
  return {
    runId: row.run_id,
    receiptId: row.receipt_id,
    dispatchId: row.dispatch_id,
    dispatchSequence: row.dispatch_sequence,
    eventId: row.event_id,
    sequence: row.sequence,
    result: row.result,
    payload: parseRuntimeJson(row.payload_json, `receipt ${row.receipt_id} payload`),
    redactionCount: row.redaction_count,
    observedAt: row.observed_at,
    committedAt: row.committed_at,
  }
}

function runtimeDeliveryStatusFromRow(row: RuntimeDeliveryStatusRow): RuntimeDeliveryStatus {
  return {
    runId: row.run_id,
    scope: row.scope,
    idempotencyKey: row.idempotency_key,
    effectId: row.effect_id,
    deliveryCount: row.delivery_count,
    duplicateCount: row.duplicate_count,
    conflictCount: row.conflict_count,
    firstDeliveredAt: row.first_delivered_at,
    lastDeliveredAt: row.last_delivered_at,
  }
}

function runtimeCheckpointFromRow(row: RuntimeCheckpointRow): RuntimeCheckpoint {
  return {
    runId: row.run_id,
    projector: row.projector,
    projectorVersion: row.projector_version,
    version: row.version,
    sourceSequence: row.source_sequence,
    payload: parseRuntimeJson(row.payload_json, `checkpoint ${row.projector} payload`),
    redactionCount: row.redaction_count,
    updatedAt: row.updated_at,
  }
}

function runtimeContextPacketFromRow(
  row: RuntimeContextPacketRow,
  options: { allowInvalidTimestamps?: boolean } = {},
): RuntimeContextPacket {
  const freshness = parseRuntimeJson(
    row.freshness_json,
    `context packet ${row.packet_key} freshness`,
  ) as unknown as RuntimeFreshnessIdentity
  const data = parseRuntimeJson(
    row.data_json,
    `context packet ${row.packet_key} data`,
  ) as unknown as RuntimeContextPacketData
  if (!isObject(freshness)
    || !Array.isArray(freshness.sources)
    || !isObject(data)
    || !Array.isArray(data.evidence)) {
    throw new RuntimeStoreError(
      'runtime_database_corrupt',
      `Context packet ${row.packet_key} has an invalid stored shape`,
    )
  }
  const updatedAt = strictStoredIsoTime(row.updated_at)
  const expiresAt = strictStoredIsoTime(row.expires_at)
  if (!options.allowInvalidTimestamps
    && (updatedAt === null || expiresAt === null || expiresAt <= updatedAt)) {
    throw new RuntimeStoreError(
      'runtime_database_corrupt',
      `Context packet ${row.packet_key} has invalid update or expiration timestamps`,
      'Preserve the database for diagnostics, then dispose only this checkout runtime namespace',
    )
  }
  return {
    runId: row.run_id,
    packetKey: row.packet_key,
    version: row.version,
    sourceSequence: row.source_sequence,
    schemaVersion: row.schema_version,
    freshness,
    data,
    redactionCount: row.redaction_count,
    expiresAt: row.expires_at,
    updatedAt: row.updated_at,
  }
}

function eventFingerprint(input: NormalizedRuntimeEventInput, payloadJson: string): string {
  return fingerprintOf([
    input.runId,
    input.eventId,
    input.kind,
    input.actorType,
    input.actorId,
    input.dispatchId,
    input.parentEventId,
    payloadJson,
  ])
}

function fingerprintOf(parts: Array<string | null>): string {
  const hash = createHash('sha256')
  for (const part of parts) {
    hash.update(part ?? '')
    hash.update('\0')
  }
  return hash.digest('hex')
}

function withImmediateTransaction<T>(database: DatabaseSync, action: () => T): T {
  database.exec('BEGIN IMMEDIATE')
  try {
    const result = action()
    database.exec('COMMIT')
    return result
  }
  catch (error) {
    try {
      database.exec('ROLLBACK')
    }
    catch {
      // Preserve the owning transaction error.
    }
    throw error
  }
}

function withReadTransaction<T>(database: DatabaseSync, action: () => T): T {
  database.exec('BEGIN')
  try {
    const result = action()
    database.exec('COMMIT')
    return result
  }
  catch (error) {
    try {
      database.exec('ROLLBACK')
    }
    catch {
      // Preserve the owning transaction error.
    }
    throw error
  }
}

function configureWritableDatabase(database: DatabaseSync): void {
  database.exec(`PRAGMA busy_timeout = ${RUNTIME_BUSY_TIMEOUT_MS}`)
  database.exec('PRAGMA foreign_keys = ON')
  database.exec('PRAGMA trusted_schema = OFF')
  database.exec('PRAGMA temp_store = MEMORY')
  database.exec('PRAGMA synchronous = NORMAL')
  database.exec('PRAGMA secure_delete = FAST')
  database.exec('PRAGMA wal_autocheckpoint = 1000')
  database.exec('PRAGMA journal_size_limit = 8388608')
  const journalMode = String(firstValue(database.prepare('PRAGMA journal_mode = WAL').get())).toLowerCase()
  if (journalMode !== 'wal')
    throw new RuntimeStoreError('runtime_wal_unavailable', `Runtime database could not enable WAL mode: ${journalMode}`)
  const foreignKeys = Number(firstValue(database.prepare('PRAGMA foreign_keys').get()))
  if (foreignKeys !== 1)
    throw new RuntimeStoreError('runtime_foreign_keys_unavailable', 'Runtime database could not enable foreign keys')
  const pageSize = Number(firstValue(database.prepare('PRAGMA page_size').get()))
  if (!Number.isSafeInteger(pageSize) || pageSize <= 0)
    throw new RuntimeStoreError('runtime_database_invalid', 'Runtime database returned an invalid page size')
  const maxPages = Math.floor(RUNTIME_MAX_DATABASE_BYTES / pageSize)
  database.exec(`PRAGMA max_page_count = ${maxPages}`)
}

function assertDatabaseIntegrity(database: DatabaseSync): void {
  const result = String(firstValue(database.prepare('PRAGMA quick_check(1)').get()))
  if (result !== 'ok') {
    throw new RuntimeStoreError(
      'runtime_database_corrupt',
      `Runtime database integrity check failed: ${result}`,
      'Preserve the database for diagnostics, then dispose only this checkout runtime namespace',
    )
  }
}

async function loadNodeSqlite(): Promise<typeof import('node:sqlite')> {
  if (!supportsNodeSqlite(process.versions.node) || sqliteExplicitlyDisabled()) {
    throw sqliteUnavailableError()
  }
  try {
    const specifier = 'node:sqlite'
    return await import(specifier)
  }
  catch (error) {
    throw new RuntimeStoreError(
      'runtime_sqlite_unavailable',
      `Built-in node:sqlite could not be loaded: ${errorMessage(error)}`,
      'Use Node.js >=22.13.0 without --no-experimental-sqlite; RSP does not install a native SQLite addon',
    )
  }
}

function supportsNodeSqlite(version: string): boolean {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)/u)
  if (!match)
    return false
  const current = {
    major: Number(match[1]),
    minor: Number(match[2]),
    patch: Number(match[3]),
  }
  if (current.major !== MINIMUM_SQLITE_NODE_VERSION.major)
    return current.major > MINIMUM_SQLITE_NODE_VERSION.major
  if (current.minor !== MINIMUM_SQLITE_NODE_VERSION.minor)
    return current.minor > MINIMUM_SQLITE_NODE_VERSION.minor
  return current.patch >= MINIMUM_SQLITE_NODE_VERSION.patch
}

function sqliteExplicitlyDisabled(): boolean {
  if (process.execArgv.includes('--no-experimental-sqlite'))
    return true
  return (process.env.NODE_OPTIONS ?? '')
    .split(/\s+/u)
    .includes('--no-experimental-sqlite')
}

function sqliteUnavailableError(): RuntimeStoreError {
  return new RuntimeStoreError(
    'runtime_sqlite_unavailable',
    'Runtime SQLite requires Node.js >=22.13.0 with the experimental node:sqlite module enabled',
    'Remove --no-experimental-sqlite or use ordinary RSP commands without the optional runtime database',
  )
}

async function ensureRuntimeNamespace(path: string, create: boolean): Promise<void> {
  if (create)
    await mkdir(path, { recursive: true, mode: 0o700 })
  let value
  try {
    value = await lstat(path)
  }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new RuntimeStoreError('runtime_namespace_absent', `Runtime namespace does not exist: ${path}`)
    }
    throw error
  }
  if (!value.isDirectory() || value.isSymbolicLink()) {
    throw new RuntimeStoreError(
      'runtime_namespace_invalid',
      `Runtime namespace must be a real directory: ${path}`,
    )
  }
  if (process.platform !== 'win32')
    await chmod(path, 0o700)
}

async function inspectRuntimeFile(path: string): Promise<boolean> {
  try {
    const value = await lstat(path)
    if (!value.isFile() || value.isSymbolicLink()) {
      throw new RuntimeStoreError(
        'runtime_database_invalid',
        `Runtime database must be a regular file: ${path}`,
      )
    }
    return true
  }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT')
      return false
    throw error
  }
}

async function inspectDisposableRuntimeFile(path: string): Promise<RuntimeFileIdentity | null> {
  try {
    const value = await lstat(path)
    if (!value.isFile() || value.isSymbolicLink()) {
      throw new RuntimeStoreError(
        'runtime_disposal_unsafe',
        `Runtime disposal refused a non-regular file: ${path}`,
      )
    }
    return {
      device: value.dev,
      inode: value.ino,
    }
  }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT')
      return null
    throw error
  }
}

async function inspectDisposableRuntimeNamespace(path: string): Promise<boolean> {
  try {
    const value = await lstat(path)
    if (!value.isDirectory() || value.isSymbolicLink()) {
      throw new RuntimeStoreError(
        'runtime_disposal_unsafe',
        `Runtime disposal namespace must be a real directory: ${path}`,
      )
    }
    return true
  }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT')
      return false
    throw error
  }
}

async function unlinkRuntimeFileIfIdentity(
  path: string,
  expected: RuntimeFileIdentity,
  namespaceChain: StableDirectoryChain,
): Promise<boolean> {
  const quarantine = `${path}.${process.pid}.${randomUUID()}.quarantine`
  await assertStableDirectoryChain(namespaceChain, 'runtime disposal namespace')
  try {
    await rename(path, quarantine)
  }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT')
      return false
    throw error
  }
  await assertStableDirectoryChain(namespaceChain, 'runtime disposal namespace')
  const current = await lstat(quarantine)
  if (!current.isFile()
    || current.isSymbolicLink()
    || current.dev !== expected.device
    || current.ino !== expected.inode) {
    try {
      await link(quarantine, path)
      await unlink(quarantine)
    }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'EEXIST') {
        throw new RuntimeStoreError(
          'runtime_disposal_preserved',
          `Runtime file changed during disposal and was preserved at ${quarantine}`,
        )
      }
      throw error
    }
    return false
  }
  await assertStableDirectoryChain(namespaceChain, 'runtime disposal namespace')
  await unlink(quarantine)
  await assertStableDirectoryChain(namespaceChain, 'runtime disposal namespace')
  return true
}

function normalizeRuntimeDatabaseError(error: unknown, databasePath: string): RuntimeStoreError {
  if (error instanceof RuntimeStoreError)
    return error
  const message = errorMessage(error)
  if (/database disk image is malformed|file is not a database|database corruption/iu.test(message)) {
    return new RuntimeStoreError(
      'runtime_database_corrupt',
      `Runtime database is corrupt at ${databasePath}: ${message}`,
      'Preserve the database for diagnostics, then dispose only this checkout runtime namespace',
    )
  }
  if (/database is locked|database table is locked|SQLITE_BUSY/iu.test(message)) {
    return new RuntimeStoreError(
      'runtime_database_busy',
      `Runtime database remained busy after ${RUNTIME_BUSY_TIMEOUT_MS} ms: ${databasePath}`,
      'Retry after the active short transaction completes; never hold runtime transactions across external work',
    )
  }
  if (/database or disk is full|SQLITE_FULL/iu.test(message)) {
    return new RuntimeStoreError(
      'runtime_database_bound',
      `Runtime database reached its ${RUNTIME_MAX_DATABASE_BYTES} byte bound`,
      'Apply retention or dispose this checkout runtime database',
    )
  }
  return new RuntimeStoreError(
    'runtime_database_failed',
    `Runtime database operation failed at ${databasePath}: ${message}`,
  )
}

function inspectionFromError(
  databasePath: string,
  error: unknown,
): RuntimeDatabaseInspection {
  const normalized = error instanceof RuntimeStoreError
    ? error
    : normalizeRuntimeDatabaseError(error, databasePath)
  let state: RuntimeDatabaseInspection['state'] = 'invalid'
  if (normalized.code === 'runtime_sqlite_unavailable') {
    state = 'unavailable'
  }
  else if (normalized.code === 'runtime_schema_incompatible'
    || normalized.code === 'runtime_schema_newer'
    || normalized.code === 'runtime_project_identity_mismatch') {
    state = 'incompatible'
  }
  else if (normalized.code === 'runtime_database_corrupt'
    || normalized.code === 'runtime_migration_history_invalid') {
    state = 'corrupt'
  }
  return {
    state,
    databasePath,
    schema: null,
    diagnostic: {
      code: normalized.code,
      message: normalized.message,
      action: normalized.action,
    },
  }
}

function normalizeProjectIdentity(project: RuntimeProjectIdentity): RuntimeProjectIdentity {
  return {
    projectId: runtimeProjectId(project.projectId),
    root: resolve(boundedText(project.root, MAX_PATH_BYTES, 'checkout root')),
    filesystem: {
      device: runtimeIdentity(project.filesystem.device, 'filesystem device'),
      inode: runtimeIdentity(project.filesystem.inode, 'filesystem inode'),
    },
  }
}

function runtimeProjectId(value: string): string {
  if (!/^[a-f0-9]{64}$/u.test(value))
    throw new RuntimeStoreError('runtime_project_id_invalid', `Invalid runtime project identity: ${value}`)
  return value
}

function runtimeIdentity(value: string, label: string): string {
  return boundedText(value, MAX_IDENTITY_BYTES, label)
}

function optionalRuntimeIdentity(value: string | null | undefined, label: string): string | null {
  return value === null || value === undefined ? null : runtimeIdentity(value, label)
}

function boundedText(value: string, maximumBytes: number, label: string): string {
  if (typeof value !== 'string'
    || value.length === 0
    || Buffer.byteLength(value) > maximumBytes
    || /[\0\r\n]/u.test(value)) {
    throw new RuntimeStoreError(
      'runtime_identity_invalid',
      `${label} must be a non-empty single-line string of at most ${maximumBytes} bytes`,
    )
  }
  return value
}

function runtimeRelativePath(value: string, label: string): string {
  boundedText(value, MAX_PATH_BYTES, label)
  if (isAbsolute(value) || value.includes('\\')) {
    throw new RuntimeStoreError(
      'runtime_path_invalid',
      `${label} must be a project-relative POSIX path`,
    )
  }
  const segments = value.split('/')
  if (segments.some(segment => !segment || segment === '.' || segment === '..')) {
    throw new RuntimeStoreError(
      'runtime_path_invalid',
      `${label} contains an unsafe path segment`,
    )
  }
  return segments.join('/')
}

function sha256Identity(value: string, label: string): string {
  if (!/^[a-f0-9]{64}$/u.test(value))
    throw new RuntimeStoreError('runtime_hash_invalid', `${label} must be one lowercase SHA-256 identity`)
  return value
}

function validIsoDate(value: string, label: string): string {
  if (typeof value !== 'string' || value.length > 100 || !Number.isFinite(Date.parse(value)))
    throw new RuntimeStoreError('runtime_time_invalid', `${label} must be an ISO-compatible timestamp`)
  return new Date(value).toISOString()
}

function strictStoredIsoTime(value: string): number | null {
  if (typeof value !== 'string' || value.length > 100)
    return null
  const parsed = Date.parse(value)
  if (!Number.isFinite(parsed))
    return null
  try {
    return new Date(parsed).toISOString() === value ? parsed : null
  }
  catch {
    return null
  }
}

function nonNegativeInteger(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value < 0)
    throw new RuntimeStoreError('runtime_integer_invalid', `${label} must be a non-negative safe integer`)
  return value
}

function positiveInteger(value: number, label: string): number {
  if (!Number.isSafeInteger(value) || value < 1)
    throw new RuntimeStoreError('runtime_integer_invalid', `${label} must be a positive safe integer`)
  return value
}

function positiveBound(value: number, maximum: number, label: string): number {
  const normalized = positiveInteger(value, label)
  if (normalized > maximum)
    throw new RuntimeStoreError('runtime_bound_invalid', `${label} cannot exceed ${maximum}`)
  return normalized
}

function boundedList<T>(value: T[], label: string): T[] {
  if (!Array.isArray(value) || value.length > MAX_CONTEXT_LIST_ITEMS) {
    throw new RuntimeStoreError(
      'runtime_context_bound',
      `${label} cannot exceed ${MAX_CONTEXT_LIST_ITEMS} items`,
    )
  }
  return value
}

function sameSourceIdentity(first: RuntimeSourceIdentity, second: RuntimeSourceIdentity): boolean {
  return first.key === second.key
    && first.role === second.role
    && first.path === second.path
    && first.contentHash === second.contentHash
    && (first.revision ?? null) === (second.revision ?? null)
}

function uniqueStrings(values: Iterable<string>): string[] {
  return [...new Set(values)]
}

function integerValue(row: unknown): number {
  const value = Number(firstValue(row))
  if (!Number.isSafeInteger(value) || value < 0)
    throw new RuntimeStoreError('runtime_database_corrupt', 'Runtime database returned an invalid integer')
  return value
}

function firstValue(row: unknown): unknown {
  if (!isObject(row))
    throw new RuntimeStoreError('runtime_database_corrupt', 'Runtime database returned an invalid row')
  const values = Object.values(row)
  if (values.length === 0)
    throw new RuntimeStoreError('runtime_database_corrupt', 'Runtime database returned an empty row')
  return values[0]
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
