import type { ChildProcess } from 'node:child_process'
import type {
  RuntimeContextPacketData,
  RuntimeFreshnessIdentity,
  RuntimeProjectIdentity,
} from '../src/runtime/model.js'
import type { RuntimeEventStore } from '../src/runtime/store.js'
import { spawn, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, readFileSync } from 'node:fs'
import { mkdir, mkdtemp, rm, stat, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import process from 'node:process'
import { DatabaseSync } from 'node:sqlite'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'

import { resolveBrokerPaths } from '../src/broker/host.js'
import {
  BROKER_PROTOCOL_VERSION,
  BROKER_RUNTIME_SCHEMA_VERSION,
  evaluateBrokerCompatibility,
} from '../src/broker/protocol.js'
import { BrokerProjectSessions } from '../src/broker/sessions.js'
import { migrateRuntimeDatabase } from '../src/runtime/migrations.js'
import {
  RUNTIME_MAX_CONTEXT_PACKET_BYTES,
  RUNTIME_STORE_SCHEMA_VERSION,
} from '../src/runtime/model.js'
import { sanitizeRuntimePayload } from '../src/runtime/payload.js'
import {
  disposeRuntimeDatabase,
  inspectRuntimeDatabase,
  openRuntimeEventStore,
  readRuntimeRunProjection,
  runtimeDatabasePath,
} from '../src/runtime/store.js'

const repositoryRoot = fileURLToPath(new URL('..', import.meta.url))
const builtCli = join(repositoryRoot, 'dist', 'cli.mjs')
const builtRuntimeEntry = pathToFileURL(join(repositoryRoot, 'dist', 'runtime-store.mjs')).href
const workerEntry = join(repositoryRoot, 'test', 'runtime-event-store-worker.mjs')
const liveWorkers = new Set<ChildProcess>()

interface WorkerResult {
  status: number | null
  stdout: string
  stderr: string
  value: Record<string, any>
}

interface WorkerLaunch {
  child: ChildProcess
  readyPath: string
  result: Promise<WorkerResult>
}

afterEach(async () => {
  const workers = [...liveWorkers]
  liveWorkers.clear()
  await Promise.all(workers.map(async (child) => {
    if (child.exitCode !== null || child.signalCode !== null)
      return
    child.kill('SIGKILL')
    await waitForChildExit(child)
  }))
})

describe.sequential('runtime event store', () => {
  it('commits concurrent duplicate events and receipts once without losing sequence values', async ({ onTestFinished }) => {
    requireBuiltRuntime()
    const fixture = await mkdtemp(join(tmpdir(), 'rsp-runtime-concurrent-'))
    const namespacePath = join(fixture, 'runtime')
    const project = await runtimeProject(fixture, 'concurrent')
    onTestFinished(() => rm(fixture, { force: true, recursive: true }))
    const run = {
      runId: 'run-concurrent',
      runKey: 'run-key-concurrent',
      workRef: 'rsp-4-runtime/runtime-event-store',
      createdAt: '2026-08-08T01:00:00.000Z',
    }
    const dispatch = {
      runId: run.runId,
      dispatchId: 'dispatch-concurrent',
      idempotencyKey: 'dispatch-key-concurrent',
      lane: 'runtime',
      workerId: 'worker-concurrent',
      createdAt: '2026-08-08T01:00:01.000Z',
    }
    const initial = await openRuntimeEventStore({ namespacePath, project })
    initial.ensureRun(run)
    initial.registerDispatch(dispatch)
    initial.close()

    const duplicateEvent = {
      runId: run.runId,
      eventId: 'event-duplicate',
      idempotencyKey: 'event-key-duplicate',
      kind: 'worker-progress',
      actorType: 'worker' as const,
      actorId: 'worker-concurrent',
      dispatchId: dispatch.dispatchId,
      payload: { summary: 'one committed effect' },
      observedAt: '2026-08-08T01:00:02.000Z',
    }
    const duplicateEventResults = await runConcurrentWorkers(
      fixture,
      'duplicate-event',
      Array.from({ length: 8 }, () => ({
        command: 'append',
        configuration: {
          runtimeEntry: builtRuntimeEntry,
          namespacePath,
          project,
          run,
          event: duplicateEvent,
        },
      })),
    )
    expect(duplicateEventResults.filter(result => result.value.duplicate === false)).toHaveLength(1)
    expect(duplicateEventResults.filter(result => result.value.duplicate === true)).toHaveLength(7)
    expect(new Set(duplicateEventResults.map(result => result.value.effect.sequence))).toEqual(new Set([2]))

    const distinctEventCount = 12
    const distinctEventResults = await runConcurrentWorkers(
      fixture,
      'distinct-events',
      Array.from({ length: distinctEventCount }, (_, index) => ({
        command: 'append',
        configuration: {
          runtimeEntry: builtRuntimeEntry,
          namespacePath,
          project,
          run,
          event: {
            runId: run.runId,
            eventId: `event-distinct-${index}`,
            idempotencyKey: `event-key-distinct-${index}`,
            kind: 'worker-progress',
            actorType: 'worker',
            actorId: `worker-${index}`,
            payload: { index },
            observedAt: `2026-08-08T01:01:${String(index).padStart(2, '0')}.000Z`,
          },
        },
      })),
    )
    expect(distinctEventResults.every(result => result.value.duplicate === false)).toBe(true)

    const duplicateReceipt = {
      runId: run.runId,
      receiptId: 'receipt-duplicate',
      dispatchId: dispatch.dispatchId,
      eventId: 'event-receipt-duplicate',
      idempotencyKey: 'receipt-key-duplicate',
      result: 'changed-same-scope',
      actorId: 'worker-concurrent',
      payload: { summary: 'receipt retained once' },
      observedAt: '2026-08-08T01:02:00.000Z',
    }
    const duplicateReceiptResults = await runConcurrentWorkers(
      fixture,
      'duplicate-receipt',
      Array.from({ length: 8 }, () => ({
        command: 'receipt',
        configuration: {
          runtimeEntry: builtRuntimeEntry,
          namespacePath,
          project,
          receipt: duplicateReceipt,
        },
      })),
    )
    expect(duplicateReceiptResults.filter(result => result.value.duplicate === false)).toHaveLength(1)
    expect(duplicateReceiptResults.filter(result => result.value.duplicate === true)).toHaveLength(7)

    const store = await openRuntimeEventStore({ namespacePath, project, create: false })
    onTestFinished(() => store.close())
    const projection = store.projectRun(run.runId)
    const expectedEventCount = 1 + distinctEventCount + 1
    expect(projection.events).toHaveLength(expectedEventCount)
    expect(projection.receipts).toHaveLength(1)
    expect(projection.events.map(event => event.sequence)).toEqual(
      Array.from({ length: expectedEventCount }, (_, index) => index + 2),
    )
    expect(projection.dispatches).toEqual([
      expect.objectContaining({ dispatchId: dispatch.dispatchId, sequence: 1 }),
    ])
    expect(new Set(projection.events.map(event => event.eventId))).toHaveLength(expectedEventCount)
    expect(store.getDeliveryStatus(run.runId, 'event', duplicateEvent.idempotencyKey)).toMatchObject({
      deliveryCount: 8,
      duplicateCount: 7,
      conflictCount: 0,
      effectId: duplicateEvent.eventId,
    })
    expect(store.getDeliveryStatus(run.runId, 'receipt', duplicateReceipt.idempotencyKey)).toMatchObject({
      deliveryCount: 8,
      duplicateCount: 7,
      conflictCount: 0,
      effectId: duplicateReceipt.receiptId,
    })
  }, 30_000)

  it('applies one concurrent checkpoint CAS and preserves out-of-order parent identity', async ({ onTestFinished }) => {
    requireBuiltRuntime()
    const fixture = await mkdtemp(join(tmpdir(), 'rsp-runtime-checkpoint-'))
    const namespacePath = join(fixture, 'runtime')
    const project = await runtimeProject(fixture, 'checkpoint')
    onTestFinished(() => rm(fixture, { force: true, recursive: true }))
    const run = {
      runId: 'run-checkpoint',
      runKey: 'run-key-checkpoint',
      workRef: 'rsp-4-runtime/runtime-event-store',
      createdAt: '2026-08-08T02:00:00.000Z',
    }
    const store = await openRuntimeEventStore({ namespacePath, project })
    store.ensureRun(run)
    const child = store.appendEvent({
      runId: run.runId,
      eventId: 'event-child',
      idempotencyKey: 'event-key-child',
      kind: 'worker-returned',
      actorType: 'worker',
      actorId: 'worker-child',
      parentEventId: 'event-parent',
      observedAt: '2026-08-08T02:00:01.000Z',
    })
    const parent = store.appendEvent({
      runId: run.runId,
      eventId: 'event-parent',
      idempotencyKey: 'event-key-parent',
      kind: 'manager-dispatched',
      actorType: 'manager',
      actorId: 'manager',
      observedAt: '2026-08-08T01:59:59.000Z',
    })
    expect(child.effect.sequence).toBe(1)
    expect(parent.effect.sequence).toBe(2)
    store.close()

    const checkpointResults = await runConcurrentWorkers(
      fixture,
      'checkpoint-cas',
      [
        { candidate: 'first' },
        { candidate: 'second' },
      ].map(({ candidate }) => ({
        command: 'checkpoint',
        configuration: {
          runtimeEntry: builtRuntimeEntry,
          namespacePath,
          project,
          checkpoint: {
            runId: run.runId,
            projector: 'run-snapshot',
            projectorVersion: '1',
            expectedVersion: 0,
            sourceSequence: 2,
            payload: { candidate },
            updatedAt: '2026-08-08T02:00:03.000Z',
          },
        },
      })),
    )
    expect(checkpointResults.filter(result => result.value.applied === true)).toHaveLength(1)
    expect(checkpointResults.filter(result => result.value.applied === false)).toHaveLength(1)

    const recovered = await openRuntimeEventStore({ namespacePath, project, create: false })
    onTestFinished(() => recovered.close())
    const checkpoint = recovered.getCheckpoint(run.runId, 'run-snapshot')
    expect(checkpoint).toMatchObject({
      version: 1,
      sourceSequence: 2,
    })
    expect(['first', 'second']).toContain((checkpoint?.payload as Record<string, unknown>).candidate)
    const projection = recovered.projectRun(run.runId)
    expect(projection.events[0]).toMatchObject({
      eventId: 'event-child',
      parentEventId: 'event-parent',
      parentState: 'after',
      outOfOrder: true,
    })
    expect(projection.events[1]).toMatchObject({
      eventId: 'event-parent',
      parentState: 'none',
      outOfOrder: false,
    })
  }, 30_000)

  it('keeps delayed parent identities inside the run that first referenced them', async ({ onTestFinished }) => {
    const fixture = await mkdtemp(join(tmpdir(), 'rsp-runtime-parent-namespace-'))
    const namespacePath = join(fixture, 'runtime')
    const project = await runtimeProject(fixture, 'parent-namespace')
    onTestFinished(() => rm(fixture, { force: true, recursive: true }))
    const store = await openRuntimeEventStore({ namespacePath, project })
    onTestFinished(() => store.close())
    for (const run of [
      { runId: 'run-parent-a', runKey: 'run-key-parent-a' },
      { runId: 'run-parent-b', runKey: 'run-key-parent-b' },
    ]) {
      store.ensureRun({
        ...run,
        workRef: 'rsp-4-runtime/runtime-event-store',
      })
    }

    store.appendEvent({
      runId: 'run-parent-a',
      eventId: 'event-child-a',
      idempotencyKey: 'event-key-child-a',
      kind: 'worker-returned',
      actorType: 'worker',
      actorId: 'worker-a',
      parentEventId: 'event-late-parent',
    })
    expect(() => store.appendEvent({
      runId: 'run-parent-b',
      eventId: 'event-late-parent',
      idempotencyKey: 'event-key-cross-run-parent',
      kind: 'manager-dispatched',
      actorType: 'manager',
      actorId: 'manager-b',
    })).toThrow(expect.objectContaining({ code: 'runtime_event_identity_conflict' }))
    expect(store.projectRun('run-parent-a').events[0]).toMatchObject({
      eventId: 'event-child-a',
      parentState: 'missing',
      outOfOrder: true,
    })

    store.registerDispatch({
      runId: 'run-parent-a',
      dispatchId: 'dispatch-parent-a',
      idempotencyKey: 'dispatch-key-parent-a',
      lane: 'runtime',
      workerId: 'worker-a',
      parentEventId: 'event-late-receipt-parent',
    })
    store.registerDispatch({
      runId: 'run-parent-b',
      dispatchId: 'dispatch-parent-b',
      idempotencyKey: 'dispatch-key-parent-b',
      lane: 'runtime',
      workerId: 'worker-b',
    })
    expect(() => store.recordReceipt({
      runId: 'run-parent-b',
      receiptId: 'receipt-cross-run-parent',
      dispatchId: 'dispatch-parent-b',
      eventId: 'event-late-receipt-parent',
      idempotencyKey: 'receipt-key-cross-run-parent',
      result: 'changed-same-scope',
      actorId: 'worker-b',
    })).toThrow(expect.objectContaining({ code: 'runtime_event_identity_conflict' }))
    expect(store.getRun('run-parent-b')).toMatchObject({ nextSequence: 2 })

    store.appendEvent({
      runId: 'run-parent-a',
      eventId: 'event-late-parent',
      idempotencyKey: 'event-key-late-parent',
      kind: 'manager-dispatched',
      actorType: 'manager',
      actorId: 'manager-a',
    })
    store.appendEvent({
      runId: 'run-parent-a',
      eventId: 'event-late-receipt-parent',
      idempotencyKey: 'event-key-late-receipt-parent',
      kind: 'manager-dispatched',
      actorType: 'manager',
      actorId: 'manager-a',
    })
    expect(store.projectRun('run-parent-a').events[0]).toMatchObject({
      eventId: 'event-child-a',
      parentState: 'after',
      outOfOrder: true,
    })
  })

  it('migrates older schemas to the current version and fails closed for newer, incomplete, and corrupt databases', async ({ onTestFinished }) => {
    const fixture = await mkdtemp(join(tmpdir(), 'rsp-runtime-migrations-'))
    const project = await runtimeProject(fixture, 'migrations')
    onTestFinished(() => rm(fixture, { force: true, recursive: true }))

    const v1Namespace = join(fixture, 'v1')
    await createRuntimeSchema(v1Namespace, project, 1)
    expect(await inspectRuntimeDatabase(v1Namespace, project)).toMatchObject({
      state: 'migration-required',
      schema: { major: 1, version: 1 },
      diagnostic: { code: 'runtime_migration_required' },
    })
    const migrated = await openRuntimeEventStore({ namespacePath: v1Namespace, project, create: false })
    expect(migrated.schema).toEqual({ major: 1, version: RUNTIME_STORE_SCHEMA_VERSION })
    migrated.close()
    expect(await inspectRuntimeDatabase(v1Namespace, project)).toMatchObject({
      state: 'ready',
      schema: { major: 1, version: RUNTIME_STORE_SCHEMA_VERSION },
    })

    const v2Namespace = join(fixture, 'v2-dispatch-sequence')
    await createRuntimeSchema(v2Namespace, project, 2)
    mutateRuntimeDatabase(v2Namespace, (database) => {
      database.prepare(`
        INSERT INTO runtime_runs (
          run_id,
          project_id,
          run_key,
          work_ref,
          next_sequence,
          created_at,
          last_observed_at
        ) VALUES (?, ?, ?, ?, 2, ?, ?)
      `).run(
        'run-v2-sequence',
        project.projectId,
        'run-key-v2-sequence',
        'rsp-4-runtime/runtime-event-store',
        '2026-08-08T00:00:00.000Z',
        '2026-08-08T00:00:01.000Z',
      )
      database.prepare(`
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
        ) VALUES (?, ?, NULL, 1, ?, 'manager', ?, NULL, ?, '{}', 0, ?, ?)
      `).run(
        'event-v2-sequence',
        'run-v2-sequence',
        'manage-run-started',
        'manager-v2-sequence',
        sha256('event-v2-sequence'),
        '2026-08-08T00:00:01.000Z',
        '2026-08-08T00:00:01.000Z',
      )
      database.prepare(`
        INSERT INTO runtime_dispatches (
          dispatch_id,
          run_id,
          lane,
          worker_id,
          parent_event_id,
          fingerprint,
          payload_json,
          redaction_count,
          created_at
        ) VALUES (?, ?, ?, ?, NULL, ?, '{}', 0, ?)
      `).run(
        'dispatch-v2-sequence',
        'run-v2-sequence',
        'fix',
        'worker-v2-sequence',
        sha256('dispatch-v2-sequence'),
        '2026-08-08T00:00:02.000Z',
      )
    })
    const migratedV2 = await openRuntimeEventStore({
      namespacePath: v2Namespace,
      project,
      create: false,
    })
    expect(migratedV2.projectRun('run-v2-sequence')).toMatchObject({
      run: { nextSequence: 3 },
      events: [{ eventId: 'event-v2-sequence', sequence: 1 }],
      dispatches: [{ dispatchId: 'dispatch-v2-sequence', sequence: 2 }],
    })
    migratedV2.close()

    const newerNamespace = join(fixture, 'newer-major')
    await createRuntimeSchema(newerNamespace, project, RUNTIME_STORE_SCHEMA_VERSION)
    mutateRuntimeDatabase(newerNamespace, (database) => {
      database.prepare('UPDATE runtime_metadata SET schema_major = 2 WHERE singleton = 1').run()
    })
    expect(await inspectRuntimeDatabase(newerNamespace, project)).toMatchObject({
      state: 'incompatible',
      diagnostic: { code: 'runtime_schema_incompatible' },
    })
    await expect(openRuntimeEventStore({
      namespacePath: newerNamespace,
      project,
      create: false,
    })).rejects.toMatchObject({ code: 'runtime_schema_incompatible' })

    const newerVersionNamespace = join(fixture, 'newer-version')
    await createRuntimeSchema(newerVersionNamespace, project, RUNTIME_STORE_SCHEMA_VERSION)
    mutateRuntimeDatabase(newerVersionNamespace, (database) => {
      const futureVersion = RUNTIME_STORE_SCHEMA_VERSION + 1
      database.prepare(`
        INSERT INTO runtime_migrations (version, name, applied_at)
        VALUES (?, 'future-compatible-step', '2026-08-08T00:00:01.000Z')
      `).run(futureVersion)
      database.prepare(`
        UPDATE runtime_metadata
        SET schema_version = ?, migrated_at = '2026-08-08T00:00:01.000Z'
        WHERE singleton = 1
      `).run(futureVersion)
    })
    expect(await inspectRuntimeDatabase(newerVersionNamespace, project)).toMatchObject({
      state: 'incompatible',
      diagnostic: {
        code: 'runtime_schema_newer',
        action: 'Stop the older package and use an RSP package compatible with this runtime database',
      },
    })
    await expect(openRuntimeEventStore({
      namespacePath: newerVersionNamespace,
      project,
      create: false,
    })).rejects.toMatchObject({
      code: 'runtime_schema_newer',
      action: 'Stop the older package and use an RSP package compatible with this runtime database',
    })

    const incompleteNamespace = join(fixture, 'incomplete')
    await createRuntimeSchema(incompleteNamespace, project, RUNTIME_STORE_SCHEMA_VERSION)
    mutateRuntimeDatabase(incompleteNamespace, (database) => {
      database.prepare('DELETE FROM runtime_migrations WHERE version = 2').run()
    })
    expect(await inspectRuntimeDatabase(incompleteNamespace, project)).toMatchObject({
      state: 'corrupt',
      diagnostic: { code: 'runtime_migration_history_invalid' },
    })

    const corruptNamespace = join(fixture, 'corrupt')
    await mkdir(corruptNamespace, { recursive: true })
    await writeFile(runtimeDatabasePath(corruptNamespace), 'not a sqlite database')
    expect(await inspectRuntimeDatabase(corruptNamespace, project)).toMatchObject({
      state: 'corrupt',
      diagnostic: { code: 'runtime_database_corrupt' },
    })
  })

  it('recovers committed WAL data after process exit and remains disposable with no-database projection', async ({ onTestFinished }) => {
    requireBuiltRuntime()
    const fixture = await mkdtemp(join(tmpdir(), 'rsp-runtime-crash-'))
    const project = await runtimeProject(fixture, 'crash')
    const projectsRoot = join(fixture, 'projects')
    const namespacePath = join(projectsRoot, project.projectId)
    onTestFinished(() => rm(fixture, { force: true, recursive: true }))
    const run = {
      runId: 'run-crash',
      runKey: 'run-key-crash',
      workRef: 'rsp-4-runtime/runtime-event-store',
      createdAt: '2026-08-08T03:00:00.000Z',
    }
    const crashResult = await runOneWorker(fixture, 'crash', 'crash-write', {
      runtimeEntry: builtRuntimeEntry,
      namespacePath,
      project,
      run,
      event: {
        runId: run.runId,
        eventId: 'event-before-crash',
        idempotencyKey: 'event-key-before-crash',
        kind: 'worker-committed',
        actorType: 'worker',
        actorId: 'worker-crash',
        payload: { committed: true },
        observedAt: '2026-08-08T03:00:01.000Z',
      },
    })
    expect(crashResult.status, crashResult.stderr).toBe(0)

    const recovered = await openRuntimeEventStore({ namespacePath, project, create: false })
    expect(recovered.projectRun(run.runId).events).toEqual([
      expect.objectContaining({
        eventId: 'event-before-crash',
        sequence: 1,
        payload: { committed: true },
      }),
    ])
    recovered.close()

    const removed = await disposeRuntimeDatabase({
      projectId: project.projectId,
      cacheRoot: fixture,
      projectsRoot,
      namespacePath,
    })
    expect(removed).toContain(runtimeDatabasePath(namespacePath))
    expect(existsSync(runtimeDatabasePath(namespacePath))).toBe(false)
    expect(await readRuntimeRunProjection({
      namespacePath,
      project,
      runId: run.runId,
    })).toEqual({
      available: false,
      diagnostic: null,
      schema: null,
      run: null,
      events: [],
      eventsTruncated: false,
      dispatches: [],
      dispatchesTruncated: false,
      receipts: [],
      receiptsTruncated: false,
      deliveries: [],
      deliveriesTruncated: false,
    })
  }, 20_000)

  it('binds each database to one project identity and one namespace', async ({ onTestFinished }) => {
    const fixture = await mkdtemp(join(tmpdir(), 'rsp-runtime-identity-'))
    const firstNamespace = join(fixture, 'first')
    const secondNamespace = join(fixture, 'second')
    const firstProject = await runtimeProject(fixture, 'first-project')
    const secondProject = {
      ...firstProject,
      projectId: sha256('second-project'),
    }
    onTestFinished(() => rm(fixture, { force: true, recursive: true }))

    const first = await openRuntimeEventStore({ namespacePath: firstNamespace, project: firstProject })
    first.ensureRun({
      runId: 'run-first',
      runKey: 'run-key-first',
      workRef: 'rsp-4-runtime/runtime-event-store',
    })
    first.close()

    await expect(openRuntimeEventStore({
      namespacePath: firstNamespace,
      project: secondProject,
      create: false,
    })).rejects.toMatchObject({ code: 'runtime_project_identity_mismatch' })
    expect(await inspectRuntimeDatabase(firstNamespace, secondProject)).toMatchObject({
      state: 'incompatible',
      diagnostic: { code: 'runtime_project_identity_mismatch' },
    })

    const second = await openRuntimeEventStore({ namespacePath: secondNamespace, project: secondProject })
    expect(second.getRun('run-first')).toBeNull()
    second.close()
    expect(runtimeDatabasePath(firstNamespace)).not.toBe(runtimeDatabasePath(secondNamespace))
  })

  it('hydrates fresh context, targets changed evidence, and rebuilds changed authority or checkout state', async ({ onTestFinished }) => {
    const fixture = await mkdtemp(join(tmpdir(), 'rsp-runtime-context-'))
    const namespacePath = join(fixture, 'runtime')
    const project = await runtimeProject(fixture, 'context')
    let currentTime = Date.parse('2026-08-08T04:00:02.000Z')
    onTestFinished(() => rm(fixture, { force: true, recursive: true }))
    const store = await openRuntimeEventStore({
      namespacePath,
      project,
      now: () => new Date(currentTime),
    })
    onTestFinished(() => store.close())
    store.ensureRun({
      runId: 'run-context',
      runKey: 'run-key-context',
      workRef: 'rsp-4-runtime/runtime-event-store',
      createdAt: '2026-08-08T04:00:00.000Z',
    })
    store.appendEvent({
      runId: 'run-context',
      eventId: 'event-context',
      idempotencyKey: 'event-key-context',
      kind: 'manager-observed',
      actorType: 'manager',
      actorId: 'manager',
      observedAt: '2026-08-08T04:00:01.000Z',
    })
    const freshness = runtimeFreshness(project)
    const data = runtimeContextData()
    expect(store.saveContextPacket({
      runId: 'run-context',
      packetKey: 'continuation',
      expectedVersion: 0,
      sourceSequence: 1,
      freshness,
      data,
      updatedAt: '2026-08-08T04:00:02.000Z',
      expiresAt: '2026-08-09T04:00:02.000Z',
    })).toMatchObject({ applied: true, currentVersion: 1 })

    currentTime = Date.parse('2026-08-08T05:00:00.000Z')
    expect(store.hydrateContextPacket(
      'run-context',
      'continuation',
      freshness,
    )).toMatchObject({
      state: 'fresh',
      staleSourceKeys: [],
      rereadSourceKeys: ['authority'],
      reasons: [],
      packet: { packetKey: 'continuation' },
    })

    const changedEvidence = {
      ...freshness,
      sources: freshness.sources.map(source => source.key === 'evidence'
        ? { ...source, contentHash: sha256('changed-evidence') }
        : source),
    }
    const targeted = store.hydrateContextPacket(
      'run-context',
      'continuation',
      changedEvidence,
    )
    expect(targeted).toMatchObject({
      state: 'targeted-reread',
      staleSourceKeys: ['evidence'],
      rereadSourceKeys: ['authority', 'evidence'],
      reasons: ['one or more evidence sources changed'],
    })
    expect(targeted.packet?.data.evidence).toEqual([])

    const addedEvidence = {
      ...freshness,
      sources: [
        ...freshness.sources,
        {
          key: 'new-evidence',
          role: 'evidence' as const,
          path: 'test/new-evidence.txt',
          contentHash: sha256('new-evidence'),
          revision: null,
        },
      ],
    }
    expect(store.hydrateContextPacket(
      'run-context',
      'continuation',
      addedEvidence,
    )).toMatchObject({
      state: 'targeted-reread',
      staleSourceKeys: ['new-evidence'],
      rereadSourceKeys: ['authority', 'new-evidence'],
    })

    const changedAuthority = {
      ...freshness,
      sources: freshness.sources.map(source => source.key === 'authority'
        ? { ...source, contentHash: sha256('changed-authority') }
        : source),
    }
    expect(store.hydrateContextPacket(
      'run-context',
      'continuation',
      changedAuthority,
    )).toMatchObject({
      state: 'full-rebuild',
      packet: null,
      staleSourceKeys: ['authority'],
      reasons: ['one or more authority sources changed'],
    })

    expect(store.hydrateContextPacket(
      'run-context',
      'continuation',
      { ...freshness, gitHead: 'changed-head' },
    )).toMatchObject({
      state: 'full-rebuild',
      packet: null,
      reasons: ['Git HEAD changed'],
    })
  })

  it('rejects context packets with incomplete authority or uncommitted decisive observations', async ({ onTestFinished }) => {
    const fixture = await mkdtemp(join(tmpdir(), 'rsp-runtime-context-validation-'))
    const namespacePath = join(fixture, 'runtime')
    const project = await runtimeProject(fixture, 'context-validation')
    onTestFinished(() => rm(fixture, { force: true, recursive: true }))
    const store = await openRuntimeEventStore({ namespacePath, project })
    onTestFinished(() => store.close())
    store.ensureRun({
      runId: 'run-context-validation',
      runKey: 'run-key-context-validation',
      workRef: 'rsp-4-runtime/runtime-event-store',
    })
    store.appendEvent({
      runId: 'run-context-validation',
      eventId: 'event-context-validation',
      idempotencyKey: 'event-key-context-validation',
      kind: 'manager-observed',
      actorType: 'manager',
      actorId: 'manager',
    })
    store.appendEvent({
      runId: 'run-context-validation',
      eventId: 'event-context-after-source',
      idempotencyKey: 'event-key-context-after-source',
      kind: 'manager-observed',
      actorType: 'manager',
      actorId: 'manager',
    })
    store.ensureRun({
      runId: 'run-context-other',
      runKey: 'run-key-context-other',
      workRef: 'rsp-4-runtime/runtime-event-store',
    })
    store.appendEvent({
      runId: 'run-context-other',
      eventId: 'event-context-other',
      idempotencyKey: 'event-key-context-other',
      kind: 'manager-observed',
      actorType: 'manager',
      actorId: 'manager',
    })
    const input = {
      runId: 'run-context-validation',
      expectedVersion: 0,
      sourceSequence: 2,
      freshness: runtimeFreshness(project),
      updatedAt: '2026-08-08T05:00:00.000Z',
      expiresAt: '2026-08-09T05:00:00.000Z',
    }
    expect(() => store.saveContextPacket({
      ...input,
      packetKey: 'missing-authority',
      data: {
        ...runtimeContextData(),
        authorityRefs: [],
        decisiveObservations: [{
          eventId: 'event-context-validation',
          sequence: 1,
          summary: 'Committed current-run observation.',
        }],
      },
    })).toThrow(expect.objectContaining({ code: 'runtime_context_authority_mismatch' }))
    for (const [packetKey, decisiveObservations] of [
      ['unknown-observation', [{
        eventId: 'event-context-ghost',
        sequence: 1,
        summary: 'This observation was never committed.',
      }]],
      ['wrong-sequence', [{
        eventId: 'event-context-validation',
        sequence: 2,
        summary: 'The sequence does not match the committed event.',
      }]],
      ['other-run-observation', [{
        eventId: 'event-context-other',
        sequence: 1,
        summary: 'The event belongs to another runtime run.',
      }]],
    ] as const) {
      expect(() => store.saveContextPacket({
        ...input,
        packetKey,
        data: {
          ...runtimeContextData(),
          decisiveObservations: [...decisiveObservations],
        },
      })).toThrow(expect.objectContaining({ code: 'runtime_context_observation_invalid' }))
    }
    expect(store.saveContextPacket({
      ...input,
      packetKey: 'after-source-sequence',
      sourceSequence: 1,
      data: {
        ...runtimeContextData(),
        decisiveObservations: [{
          eventId: 'event-context-after-source',
          sequence: 2,
          summary: 'The event was committed after the stale packet source sequence.',
        }],
      },
    })).toEqual({
      applied: false,
      checkpoint: null,
      currentVersion: 0,
    })
  })

  it('preserves non-credential sk-prefixed context while redacting OpenAI credentials', async ({ onTestFinished }) => {
    const fixture = await mkdtemp(join(tmpdir(), 'rsp-runtime-context-sk-redaction-'))
    const namespacePath = join(fixture, 'runtime')
    const project = await runtimeProject(fixture, 'context-sk-redaction')
    let currentTime = Date.parse('2026-08-08T05:00:00.000Z')
    onTestFinished(() => rm(fixture, { force: true, recursive: true }))
    const store = await openRuntimeEventStore({
      namespacePath,
      project,
      now: () => new Date(currentTime),
    })
    onTestFinished(() => store.close())
    store.ensureRun({
      runId: 'run-context-sk-redaction',
      runKey: 'run-key-context-sk-redaction',
      workRef: 'rsp-4-runtime/runtime-event-store',
    })
    store.appendEvent({
      runId: 'run-context-sk-redaction',
      eventId: 'event-context-sk-redaction',
      idempotencyKey: 'event-key-context-sk-redaction',
      kind: 'manager-observed',
      actorType: 'manager',
      actorId: 'manager',
    })

    const ordinarySkText = 'sk-RUNTIMEOBSERVATION20260808ABCDEFGHIJ'
    const authorityPath = `authority/${ordinarySkText}.md`
    const baseFreshness = runtimeFreshness(project)
    const freshness = {
      ...baseFreshness,
      sources: baseFreshness.sources.map(source => source.role === 'authority'
        ? { ...source, path: authorityPath }
        : source),
    }
    const ordinaryData: RuntimeContextPacketData = {
      ...runtimeContextData('event-context-sk-redaction'),
      authorityRefs: [authorityPath],
      decisiveObservations: [{
        eventId: 'event-context-sk-redaction',
        sequence: 1,
        summary: ordinarySkText,
      }],
      nextAction: `Review ${ordinarySkText}.`,
    }
    expect(store.saveContextPacket({
      runId: 'run-context-sk-redaction',
      packetKey: 'ordinary-sk-text',
      expectedVersion: 0,
      sourceSequence: 1,
      freshness,
      data: ordinaryData,
      updatedAt: '2026-08-08T05:00:00.000Z',
      expiresAt: '2026-08-09T05:00:00.000Z',
    })).toMatchObject({ applied: true })
    expect(store.getContextPacket('run-context-sk-redaction', 'ordinary-sk-text')).toMatchObject({
      freshness: {
        sources: [
          expect.objectContaining({ path: authorityPath }),
          expect.any(Object),
        ],
      },
      data: {
        authorityRefs: [authorityPath],
        decisiveObservations: [
          expect.objectContaining({ summary: ordinarySkText }),
        ],
        nextAction: `Review ${ordinarySkText}.`,
      },
      redactionCount: 0,
    })
    currentTime = Date.parse('2026-08-08T06:00:00.000Z')
    expect(store.hydrateContextPacket(
      'run-context-sk-redaction',
      'ordinary-sk-text',
      freshness,
    )).toMatchObject({
      state: 'fresh',
      staleSourceKeys: [],
      rereadSourceKeys: ['authority'],
    })

    const openAiCredential = 'sk-proj-A1b2C3d4E5f6G7h8J9k0LmNoPqRsTuVw'
    currentTime = Date.parse('2026-08-08T06:00:01.000Z')
    expect(store.saveContextPacket({
      runId: 'run-context-sk-redaction',
      packetKey: 'openai-credential',
      expectedVersion: 0,
      sourceSequence: 1,
      freshness,
      data: {
        ...ordinaryData,
        decisiveObservations: [{
          eventId: 'event-context-sk-redaction',
          sequence: 1,
          summary: openAiCredential,
        }],
      },
      updatedAt: '2026-08-08T06:00:01.000Z',
      expiresAt: '2026-08-09T06:00:01.000Z',
    })).toMatchObject({ applied: true })
    expect(store.getContextPacket('run-context-sk-redaction', 'openai-credential')).toMatchObject({
      data: {
        decisiveObservations: [
          expect.objectContaining({ summary: '[REDACTED]' }),
        ],
      },
      redactionCount: 1,
    })
    expect(store.hydrateContextPacket(
      'run-context-sk-redaction',
      'openai-credential',
      freshness,
    )).toMatchObject({ state: 'fresh' })
  })

  it('enforces context packet list and byte bounds', async ({ onTestFinished }) => {
    const fixture = await mkdtemp(join(tmpdir(), 'rsp-runtime-context-bounds-'))
    const namespacePath = join(fixture, 'runtime')
    const project = await runtimeProject(fixture, 'context-bounds')
    onTestFinished(() => rm(fixture, { force: true, recursive: true }))
    const store = await openRuntimeEventStore({ namespacePath, project })
    onTestFinished(() => store.close())
    store.ensureRun({
      runId: 'run-context-bounds',
      runKey: 'run-key-context-bounds',
      workRef: 'rsp-4-runtime/runtime-event-store',
    })
    store.appendEvent({
      runId: 'run-context-bounds',
      eventId: 'event-context-bounds',
      idempotencyKey: 'event-key-context-bounds',
      kind: 'manager-observed',
      actorType: 'manager',
      actorId: 'manager',
    })
    const input = {
      runId: 'run-context-bounds',
      expectedVersion: 0,
      sourceSequence: 1,
      freshness: runtimeFreshness(project),
      updatedAt: '2026-08-08T05:00:00.000Z',
      expiresAt: '2026-08-09T05:00:00.000Z',
    }
    expect(() => store.saveContextPacket({
      ...input,
      packetKey: 'too-many-items',
      data: {
        ...runtimeContextData(),
        authorityRefs: Array.from({ length: 65 }, (_, index) => `authority/${index}.md`),
      },
    })).toThrow(expect.objectContaining({ code: 'runtime_context_bound' }))
    expect(() => store.saveContextPacket({
      ...input,
      packetKey: 'too-many-bytes',
      data: {
        ...runtimeContextData(),
        blockers: Array.from({ length: 40 }, (_, index) => `${index}-${'x'.repeat(2_040)}`),
      },
    })).toThrow(expect.objectContaining({ code: 'runtime_payload_too_large' }))
    expect(RUNTIME_MAX_CONTEXT_PACKET_BYTES).toBe(64 * 1024)
  })

  it('rejects prohibited payloads and redacts sensitive keys and value patterns within bounds', () => {
    expect(() => sanitizeRuntimePayload(
      { prompt: 'do not retain this' },
      16 * 1024,
      'test payload',
    )).toThrow(expect.objectContaining({ code: 'runtime_payload_prohibited' }))
    expect(() => sanitizeRuntimePayload(
      { nested: { hiddenReasoning: 'not runtime data' } },
      16 * 1024,
      'test payload',
    )).toThrow(expect.objectContaining({ code: 'runtime_payload_prohibited' }))

    const keyed = sanitizeRuntimePayload({
      apiToken: 'fake-sensitive-value',
      summary: 'safe',
    }, 16 * 1024, 'test payload')
    expect(keyed.value).toEqual({
      apiToken: '[REDACTED]',
      summary: 'safe',
    })
    expect(keyed.redactionCount).toBe(1)

    const valuePatterns = [
      'Bearer abcdefghijk',
      'ghp_abcdefghijklmnop',
      'AKIAABCDEFGHIJKLMNOP',
      'sk-proj-A1b2C3d4E5f6G7h8J9k0LmNoPqRsTuVw',
      'sk-svcacct-Z9y8X7w6V5u4T3s2R1q0PoNmLkJiHgFe',
      'sk-A1b2C3d4E5f6G7h8J9k0LmNoPqRsTuVwXyZ',
      `sk_live_${'b'.repeat(24)}`,
      `npm_${'c'.repeat(36)}`,
      `xoxb-${'1'.repeat(12)}-${'d'.repeat(24)}`,
      `glpat-${'e'.repeat(24)}`,
      `AIza${'f'.repeat(35)}`,
      'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJyc3AtdGVzdCJ9.c2lnbmF0dXJlLXNoYXBl',
      '-----BEGIN PRIVATE KEY-----',
      'password=fake-sensitive-value',
      'https://fake-user:fake-password@example.invalid/path',
    ]
    for (const value of valuePatterns) {
      expect(sanitizeRuntimePayload(
        { summary: value },
        16 * 1024,
        'test payload',
      )).toMatchObject({
        value: { summary: '[REDACTED]' },
        redactionCount: 1,
      })
    }
    for (const value of [
      'sk-proj-example',
      'sk-runtime-event-store-review-scope',
      'npm_package_name',
      'xoxb-example',
      'eyJ is a JSON-object prefix, not a complete JWT',
    ]) {
      expect(sanitizeRuntimePayload(
        { summary: value },
        16 * 1024,
        'test payload',
      )).toMatchObject({
        value: { summary: value },
        redactionCount: 0,
      })
    }

    expect(() => sanitizeRuntimePayload(
      { summary: 'x'.repeat(128) },
      64,
      'test payload',
    )).toThrow(expect.objectContaining({ code: 'runtime_payload_too_large' }))
    expect(() => sanitizeRuntimePayload(
      nestedPayload(10),
      16 * 1024,
      'test payload',
    )).toThrow(expect.objectContaining({ code: 'runtime_payload_invalid' }))
  })

  it('applies bounded retention to expired context and old or excess runs', async ({ onTestFinished }) => {
    const fixture = await mkdtemp(join(tmpdir(), 'rsp-runtime-retention-'))
    const namespacePath = join(fixture, 'runtime')
    const project = await runtimeProject(fixture, 'retention')
    let currentTime = Date.parse('2026-07-01T00:00:00.000Z')
    onTestFinished(() => rm(fixture, { force: true, recursive: true }))
    const store = await openRuntimeEventStore({
      namespacePath,
      project,
      now: () => new Date(currentTime),
    })
    onTestFinished(() => store.close())

    store.ensureRun({
      runId: 'run-old',
      runKey: 'run-key-old',
      workRef: 'rsp-4-runtime/runtime-event-store',
    })
    store.appendEvent({
      runId: 'run-old',
      eventId: 'event-old',
      idempotencyKey: 'event-key-old',
      kind: 'manager-observed',
      actorType: 'manager',
      actorId: 'manager',
    })
    currentTime = Date.parse('2026-07-01T00:00:01.000Z')
    store.saveContextPacket({
      runId: 'run-old',
      packetKey: 'old',
      expectedVersion: 0,
      sourceSequence: 1,
      freshness: runtimeFreshness(project),
      data: runtimeContextData('event-old'),
      updatedAt: '2026-07-01T00:00:01.000Z',
      expiresAt: '2026-07-02T00:00:01.000Z',
    })

    currentTime = Date.parse('2026-08-08T00:00:00.000Z')
    store.ensureRun({
      runId: 'run-recent',
      runKey: 'run-key-recent',
      workRef: 'rsp-4-runtime/runtime-event-store',
    })
    store.appendEvent({
      runId: 'run-recent',
      eventId: 'event-recent',
      idempotencyKey: 'event-key-recent',
      kind: 'manager-observed',
      actorType: 'manager',
      actorId: 'manager',
    })
    for (const [packetKey, updatedAt] of [
      ['recent-a', '2026-08-07T00:00:00.000Z'],
      ['recent-b', '2026-08-08T00:00:00.000Z'],
    ] as const) {
      store.saveContextPacket({
        runId: 'run-recent',
        packetKey,
        expectedVersion: 0,
        sourceSequence: 1,
        freshness: runtimeFreshness(project),
        data: runtimeContextData('event-recent'),
        updatedAt,
        expiresAt: '2026-08-09T00:00:00.000Z',
      })
    }

    expect(store.applyRetention({
      now: '2026-08-08T01:00:00.000Z',
      runMaxAgeMs: 30 * 24 * 60 * 60 * 1000,
      contextMaxAgeMs: 10 * 24 * 60 * 60 * 1000,
      maxRuns: 10,
      maxContextPacketsPerRun: 1,
    })).toEqual({
      deletedRuns: 1,
      deletedContextPackets: 2,
      retainedRuns: 1,
      appliedAt: '2026-08-08T01:00:00.000Z',
    })
    expect(store.getRun('run-old')).toBeNull()
    expect(store.getRun('run-recent')).not.toBeNull()
    expect(store.getContextPacket('run-recent', 'recent-a')).toBeNull()
    expect(store.getContextPacket('run-recent', 'recent-b')).not.toBeNull()
  })

  it('opens and closes the runtime lazily through the Broker session adapter', async ({ onTestFinished }) => {
    const fixture = await mkdtemp(join(tmpdir(), 'rsp-runtime-broker-adapter-'))
    const repository = join(fixture, 'repository')
    const paths = resolveBrokerPaths({ root: join(fixture, 'broker-cache') })
    await initializeGitRepository(repository)
    let currentTime = Date.parse('2026-08-08T06:00:00.000Z')
    const sessions = new BrokerProjectSessions(paths, 10, () => currentTime)
    onTestFinished(async () => {
      sessions.close()
      await rm(fixture, { force: true, recursive: true })
    })

    const registration = await sessions.register(repository)
    const namespacePath = sessions.namespaceFor(
      registration.project.projectId,
      registration.accessToken,
    )
    expect(existsSync(runtimeDatabasePath(namespacePath))).toBe(false)
    expect(await sessions.inspectRuntimeFor(
      registration.project.projectId,
      registration.accessToken,
    )).toMatchObject({ state: 'absent' })

    const [first, second] = await Promise.all([
      sessions.runtimeFor(registration.project.projectId, registration.accessToken),
      sessions.runtimeFor(registration.project.projectId, registration.accessToken),
    ])
    expect(first).toBe(second)
    first.ensureRun({
      runId: 'run-broker-adapter',
      runKey: 'run-key-broker-adapter',
      workRef: 'rsp-4-runtime/runtime-event-store',
    })
    expect(existsSync(runtimeDatabasePath(namespacePath))).toBe(true)

    currentTime += 10
    expect(sessions.sweep()).toEqual([registration.project.projectId])
    expect(() => first.getRun('run-broker-adapter'))
      .toThrow(expect.objectContaining({ code: 'runtime_store_closed' }))

    const resumed = await sessions.register(repository)
    expect(resumed.accessToken).not.toBe(registration.accessToken)
    expect(await sessions.inspectRuntimeFor(
      resumed.project.projectId,
      resumed.accessToken,
    )).toMatchObject({
      state: 'ready',
      schema: { major: 1, version: RUNTIME_STORE_SCHEMA_VERSION },
    })
    const removed = await sessions.disposeRuntimeFor(
      resumed.project.projectId,
      resumed.accessToken,
    )
    expect(removed).toContain(runtimeDatabasePath(namespacePath))
    expect(await sessions.inspectRuntimeFor(
      resumed.project.projectId,
      resumed.accessToken,
    )).toMatchObject({ state: 'absent' })
  })

  it('serializes Broker runtime opening and disposal before reopening', async ({ onTestFinished }) => {
    const fixture = await mkdtemp(join(tmpdir(), 'rsp-runtime-broker-disposal-'))
    const repository = join(fixture, 'repository')
    const paths = resolveBrokerPaths({ root: join(fixture, 'broker-cache') })
    await initializeGitRepository(repository)
    const operationOrder: string[] = []
    let releaseFirstOpen!: () => void
    const firstOpenGate = new Promise<void>((resolve) => {
      releaseFirstOpen = resolve
    })
    let openCount = 0
    const sessions = new BrokerProjectSessions(paths, 60_000, Date.now, {
      open: async () => {
        openCount += 1
        const currentOpen = openCount
        operationOrder.push(`open-${currentOpen}-started`)
        if (currentOpen === 1)
          await firstOpenGate
        operationOrder.push(`open-${currentOpen}-finished`)
        let closed = false
        return {
          close() {
            if (closed)
              return
            closed = true
            operationOrder.push(`store-${currentOpen}-closed`)
          },
        } as RuntimeEventStore
      },
      inspect: inspectRuntimeDatabase,
      dispose: async () => {
        operationOrder.push('database-disposed')
        return ['runtime-v1.sqlite']
      },
    })
    onTestFinished(async () => {
      sessions.close()
      await rm(fixture, { force: true, recursive: true })
    })

    const registration = await sessions.register(repository)
    const projectId = registration.project.projectId
    const accessToken = registration.accessToken
    const firstOpening = sessions.runtimeFor(projectId, accessToken)
    const disposal = sessions.disposeRuntimeFor(projectId, accessToken)
    const reopening = sessions.runtimeFor(projectId, accessToken)
    await Promise.resolve()
    expect(openCount).toBe(1)

    releaseFirstOpen()
    const [first, removed, reopened] = await Promise.all([
      firstOpening,
      disposal,
      reopening,
    ])
    expect(first).not.toBe(reopened)
    expect(removed).toEqual(['runtime-v1.sqlite'])
    expect(openCount).toBe(2)
    expect(operationOrder.indexOf('store-1-closed'))
      .toBeLessThan(operationOrder.indexOf('database-disposed'))
    expect(operationOrder.indexOf('database-disposed'))
      .toBeLessThan(operationOrder.indexOf('open-2-started'))
  })

  it('keeps runtime schema 1.1 compatibility directional and explicit', () => {
    expect(BROKER_RUNTIME_SCHEMA_VERSION).toEqual({ major: 1, minor: 1 })
    expect(evaluateBrokerCompatibility({
      protocol: BROKER_PROTOCOL_VERSION,
      runtimeSchema: { major: 1, minor: 0 },
    })).toMatchObject({
      compatible: false,
      reason: 'runtime-schema-minor',
    })
    expect(evaluateBrokerCompatibility({
      protocol: BROKER_PROTOCOL_VERSION,
      runtimeSchema: { major: 1, minor: 2 },
    })).toEqual({
      compatible: true,
      reason: 'compatible',
      action: null,
    })
  })

  it('keeps ordinary CLI usable and runtime opening fail-closed when node:sqlite is disabled', async ({ onTestFinished }) => {
    requireBuiltRuntime()
    const fixture = await mkdtemp(join(tmpdir(), 'rsp-runtime-disabled-'))
    const projectRoot = join(fixture, 'project')
    const namespacePath = join(fixture, 'runtime')
    const brokerCache = join(fixture, 'broker-cache')
    await mkdir(projectRoot)
    await mkdir(namespacePath)
    const project = await runtimeProject(projectRoot, 'disabled')
    onTestFinished(() => rm(fixture, { force: true, recursive: true }))
    const environment = {
      ...process.env,
      RSP_BROKER_CACHE_HOME: brokerCache,
    }

    const init = spawnSync(process.execPath, [
      '--no-experimental-sqlite',
      builtCli,
      'init',
    ], {
      cwd: projectRoot,
      encoding: 'utf8',
      env: environment,
    })
    expect(init.status, init.stderr || init.stdout).toBe(0)
    const status = spawnSync(process.execPath, [
      '--no-experimental-sqlite',
      builtCli,
      'status',
      '--json',
    ], {
      cwd: projectRoot,
      encoding: 'utf8',
      env: environment,
    })
    expect(status.status, status.stderr || status.stdout).toBe(0)
    expect(JSON.parse(status.stdout)).toMatchObject({ command: 'status', ok: true })
    expect(existsSync(brokerCache)).toBe(false)

    const disabledRuntime = spawnSync(process.execPath, [
      '--no-experimental-sqlite',
      '--input-type=module',
      '--eval',
      [
        `const runtime = await import(${JSON.stringify(builtRuntimeEntry)})`,
        `const options = JSON.parse(process.env.RSP_RUNTIME_DISABLED_OPTIONS)`,
        'try {',
        '  await runtime.openRuntimeEventStore(options)',
        '  process.stdout.write(JSON.stringify({ opened: true }))',
        '} catch (error) {',
        '  process.stdout.write(JSON.stringify({ code: error.code, action: error.action }))',
        '}',
      ].join('\n'),
    ], {
      cwd: fixture,
      encoding: 'utf8',
      env: {
        ...process.env,
        RSP_RUNTIME_DISABLED_OPTIONS: JSON.stringify({ namespacePath, project }),
      },
    })
    expect(disabledRuntime.status, disabledRuntime.stderr || disabledRuntime.stdout).toBe(0)
    expect(JSON.parse(disabledRuntime.stdout)).toMatchObject({
      code: 'runtime_sqlite_unavailable',
    })
    expect(existsSync(runtimeDatabasePath(namespacePath))).toBe(false)

    const manifest = JSON.parse(readFileSync(join(repositoryRoot, 'package.json'), 'utf8')) as {
      engines: { node: string }
    }
    expect(manifest.engines.node).toBe('>=22.13.0')
    expect(nodeVersionAtLeast(process.versions.node, 22, 13, 0)).toBe(true)
  }, 20_000)
})

async function runtimeProject(root: string, seed: string): Promise<RuntimeProjectIdentity> {
  const identity = await stat(root)
  return {
    projectId: sha256(`${seed}:${root}:${identity.dev}:${identity.ino}`),
    root,
    filesystem: {
      device: String(identity.dev),
      inode: String(identity.ino),
    },
  }
}

function runtimeFreshness(project: RuntimeProjectIdentity): RuntimeFreshnessIdentity {
  return {
    projectId: project.projectId,
    checkoutRoot: project.root,
    workRef: 'rsp-4-runtime/runtime-event-store',
    gitHead: '0123456789abcdef',
    dirtyPathsHash: sha256('dirty-paths'),
    authorityHash: sha256('authority-set'),
    sources: [
      {
        key: 'authority',
        role: 'authority',
        path: '.rsp/changes/rsp-4-runtime/runtime-event-store.md',
        contentHash: sha256('authority-source'),
        revision: 'working-tree',
      },
      {
        key: 'evidence',
        role: 'evidence',
        path: 'test/runtime-event-store.test.ts',
        contentHash: sha256('evidence-source'),
        revision: null,
      },
    ],
  }
}

function runtimeContextData(eventId = 'event-context'): RuntimeContextPacketData {
  return {
    phase: 'implement',
    authorityRefs: ['.rsp/changes/rsp-4-runtime/runtime-event-store.md'],
    decisiveObservations: [
      {
        eventId,
        sequence: 1,
        summary: 'Runtime event store behavior is under focused verification.',
      },
    ],
    blockers: [],
    attention: [],
    evidence: [
      {
        sourceKey: 'evidence',
        summary: 'Focused runtime tests exercise the current implementation.',
      },
    ],
    changedPaths: ['src/runtime/store.ts'],
    nextAction: 'Run the fixed-scope review after fresh verification.',
  }
}

async function createRuntimeSchema(
  namespacePath: string,
  project: RuntimeProjectIdentity,
  targetVersion: number,
): Promise<void> {
  await mkdir(namespacePath, { recursive: true })
  const database = new DatabaseSync(runtimeDatabasePath(namespacePath))
  try {
    migrateRuntimeDatabase(database, project, {
      now: '2026-08-08T00:00:00.000Z',
      targetVersion,
    })
  }
  finally {
    database.close()
  }
}

function mutateRuntimeDatabase(
  namespacePath: string,
  action: (database: DatabaseSync) => void,
): void {
  const database = new DatabaseSync(runtimeDatabasePath(namespacePath))
  try {
    action(database)
  }
  finally {
    database.close()
  }
}

async function runConcurrentWorkers(
  fixture: string,
  label: string,
  requests: Array<{
    command: string
    configuration: Record<string, unknown>
  }>,
): Promise<WorkerResult[]> {
  const startPath = join(fixture, `${label}.start`)
  const launches: WorkerLaunch[] = []
  for (let index = 0; index < requests.length; index += 1) {
    const request = requests[index]!
    launches.push(await launchWorker(
      fixture,
      `${label}-${index}`,
      request.command,
      {
        ...request.configuration,
        startPath,
      },
    ))
  }
  await waitForPaths(launches.map(launch => launch.readyPath))
  await writeFile(startPath, 'start\n')
  return Promise.all(launches.map(launch => launch.result))
}

async function runOneWorker(
  fixture: string,
  label: string,
  command: string,
  configuration: Record<string, unknown>,
): Promise<WorkerResult> {
  const launch = await launchWorker(fixture, label, command, configuration)
  return launch.result
}

async function launchWorker(
  fixture: string,
  label: string,
  command: string,
  configuration: Record<string, unknown>,
): Promise<WorkerLaunch> {
  const configurationPath = join(fixture, `${label}.json`)
  const readyPath = join(fixture, `${label}.ready`)
  await writeFile(configurationPath, `${JSON.stringify({
    ...configuration,
    readyPath,
  })}\n`)
  const child = spawn(process.execPath, [
    '--no-warnings',
    workerEntry,
    command,
    configurationPath,
  ], {
    cwd: repositoryRoot,
    env: process.env,
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  liveWorkers.add(child)
  let stdout = ''
  let stderr = ''
  child.stdout?.setEncoding('utf8')
  child.stderr?.setEncoding('utf8')
  child.stdout?.on('data', chunk => stdout += chunk)
  child.stderr?.on('data', chunk => stderr += chunk)
  const result = new Promise<WorkerResult>((resolveResult, rejectResult) => {
    child.once('error', rejectResult)
    child.once('close', (status) => {
      liveWorkers.delete(child)
      if (status !== 0) {
        rejectResult(new Error(
          `Runtime worker ${label} exited ${status}: ${stderr || stdout}`,
        ))
        return
      }
      try {
        resolveResult({
          status,
          stdout,
          stderr,
          value: JSON.parse(stdout) as Record<string, any>,
        })
      }
      catch (error) {
        rejectResult(new Error(
          `Runtime worker ${label} returned invalid JSON: ${stdout}; ${String(error)}`,
        ))
      }
    })
  })
  return { child, readyPath, result }
}

async function waitForPaths(paths: string[], timeoutMs = 5_000): Promise<void> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (paths.every(path => existsSync(path)))
      return
    await delay(10)
  }
  const missing = paths.filter(path => !existsSync(path))
  throw new Error(`Runtime workers did not become ready: ${missing.join(', ')}`)
}

function waitForChildExit(child: ChildProcess): Promise<void> {
  if (child.exitCode !== null || child.signalCode !== null)
    return Promise.resolve()
  return new Promise(resolveExit => child.once('close', () => resolveExit()))
}

function nestedPayload(depth: number): Record<string, unknown> {
  let value: Record<string, unknown> = { leaf: true }
  for (let index = 0; index < depth; index += 1)
    value = { nested: value }
  return value
}

async function initializeGitRepository(root: string): Promise<void> {
  await mkdir(root, { recursive: true })
  const result = spawnSync('git', [
    '-c',
    'user.name=RSP Runtime Test',
    '-c',
    'user.email=rsp-runtime-test@example.invalid',
    'init',
    '--quiet',
  ], {
    cwd: root,
    encoding: 'utf8',
  })
  if (result.status !== 0)
    throw new Error(result.stderr || result.stdout)
  await writeFile(join(root, 'README.md'), '# Runtime fixture\n')
  for (const args of [
    ['add', 'README.md'],
    [
      '-c',
      'user.name=RSP Runtime Test',
      '-c',
      'user.email=rsp-runtime-test@example.invalid',
      'commit',
      '--quiet',
      '-m',
      'test: initialize runtime fixture',
    ],
  ]) {
    const command = spawnSync('git', args, {
      cwd: root,
      encoding: 'utf8',
    })
    if (command.status !== 0)
      throw new Error(command.stderr || command.stdout)
  }
}

function nodeVersionAtLeast(
  value: string,
  major: number,
  minor: number,
  patch: number,
): boolean {
  const match = value.match(/^(\d+)\.(\d+)\.(\d+)/u)
  if (!match)
    return false
  const current = [Number(match[1]), Number(match[2]), Number(match[3])]
  const expected = [major, minor, patch]
  for (let index = 0; index < current.length; index += 1) {
    if (current[index]! !== expected[index]!)
      return current[index]! > expected[index]!
  }
  return true
}

function requireBuiltRuntime(): void {
  if (!existsSync(fileURLToPath(builtRuntimeEntry)) || !existsSync(builtCli)) {
    throw new Error(
      'Runtime event store process tests require fresh dist output; run mise exec -- pnpm run build first',
    )
  }
}

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex')
}

function delay(milliseconds: number): Promise<void> {
  return new Promise(resolveDelay => setTimeout(resolveDelay, milliseconds))
}
