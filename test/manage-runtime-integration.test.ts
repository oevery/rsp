import type { RuntimeFreshnessIdentity, RuntimeSourceIdentity } from '../src/runtime/model.js'
import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync } from 'node:fs'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { resolveBrokerPaths } from '../src/broker/host.js'
import { discoverBrokerProject } from '../src/broker/project.js'
import { BROKER_PROTOCOL_VERSION } from '../src/broker/protocol.js'
import { startBrokerServer } from '../src/broker/server.js'
import {
  createStoreManageRuntimeCapability,
  discoverBrokerManageRuntimeCapability,
  MANAGE_RUNTIME_CAPABILITY_VERSION,
  MANAGE_RUNTIME_CONTEXT_PACKET_KEY,
  MANAGE_RUNTIME_MAX_ATTENTION_ITEMS,
  MANAGE_RUNTIME_MAX_CONTEXT_BYTES,
  MANAGE_RUNTIME_MAX_PROJECTION_ITEMS,
  projectManageHydration,
  projectUnavailableManageRuntimeAttention,
  useOptionalManageRuntime,
} from '../src/runtime/manage.js'
import { openRuntimeEventStore } from '../src/runtime/store.js'

describe.sequential('managed runtime integration', () => {
  it('records exact managed identities without manufacturing missing or duplicate success', async ({ onTestFinished }) => {
    const fixture = await createRuntimeFixture('observations')
    onTestFinished(fixture.cleanup)
    const store = await openRuntimeEventStore({
      namespacePath: fixture.namespacePath,
      project: fixture.project,
      now: fixture.clock,
    })
    onTestFinished(() => store.close())
    const capability = createStoreManageRuntimeCapability(store, fixture.clock)
    const canonicalControl = Object.freeze({
      acceptance: 'incomplete',
      closeout: 'not-eligible',
      route: 'managed',
    })

    const run = await capability.observeRun({
      runId: 'run-managed-observations',
      runKey: 'goal-rsp-4-runtime',
      workRef: 'rsp-4-runtime/manage-runtime-integration',
      managerId: 'manager-host-1',
      eventId: 'event-run-started',
      idempotencyKey: 'idem-run-started',
      phase: 'implementation',
      authorityRefs: ['AGENTS.md', '.rsp/changes/rsp-4-runtime/manage-runtime-integration.md'],
      evidenceRefs: ['runtime-event-store-archive'],
      observedAt: '2026-08-08T08:00:00.000Z',
    })
    expect(run.event.duplicate).toBe(false)

    await capability.observeDispatch({
      runId: run.run.runId,
      dispatchId: 'dispatch-real-fix-worker',
      idempotencyKey: 'idem-dispatch-real-fix-worker',
      lane: 'fix',
      workerId: 'worker-host-019fe-real',
      objectiveRef: 'task-runtime-adapter',
      evidenceRefs: ['change-task-1'],
      stopBoundary: 'boundary-changed',
      createdAt: '2026-08-08T08:00:01.000Z',
    })
    await capability.observeEvent({
      runId: run.run.runId,
      eventId: 'event-worker-returned',
      idempotencyKey: 'idem-worker-returned',
      kind: 'manage-event',
      actorType: 'worker',
      actorId: 'worker-host-019fe-real',
      dispatchId: 'dispatch-real-fix-worker',
      summary: 'Fix worker returned a structured receipt.',
      evidenceRefs: ['receipt-fix-1'],
      stopBoundary: 'same-scope',
      observedAt: '2026-08-08T08:00:02.000Z',
    })
    const receiptInput = {
      runId: run.run.runId,
      receiptId: 'receipt-real-fix-worker',
      dispatchId: 'dispatch-real-fix-worker',
      eventId: 'event-receipt-real-fix-worker',
      idempotencyKey: 'idem-receipt-real-fix-worker',
      result: 'changed-same-scope',
      actorId: 'worker-host-019fe-real',
      laneObjectiveRef: 'task-runtime-adapter',
      evidenceRefs: ['focused-tests'],
      changedPaths: ['src/runtime/manage.ts'],
      verificationRefs: ['vitest-manage-runtime'],
      stopBoundary: 'same-scope',
      observedAt: '2026-08-08T08:00:03.000Z',
    }
    expect((await capability.observeReceipt(receiptInput)).duplicate).toBe(false)
    expect((await capability.observeReceipt(receiptInput)).duplicate).toBe(true)

    await capability.observeDispatch({
      runId: run.run.runId,
      dispatchId: 'dispatch-required-verify-missing',
      idempotencyKey: 'idem-dispatch-required-verify-missing',
      lane: 'verify',
      workerId: 'worker-host-verify-missing',
      objectiveRef: 'required-independent-verification',
      evidenceRefs: [],
      stopBoundary: 'capability-unavailable',
      createdAt: '2026-08-08T08:00:04.000Z',
    })
    await capability.observeDispatch({
      runId: run.run.runId,
      dispatchId: 'dispatch-boundary-changed',
      idempotencyKey: 'idem-dispatch-boundary-changed',
      lane: 'inspect',
      workerId: 'worker-host-boundary',
      objectiveRef: 'inspect-boundary',
      evidenceRefs: ['scope-baseline'],
      stopBoundary: 'boundary-changed',
      createdAt: '2026-08-08T08:00:05.000Z',
    })
    await capability.observeReceipt({
      runId: run.run.runId,
      receiptId: 'receipt-boundary-changed',
      dispatchId: 'dispatch-boundary-changed',
      eventId: 'event-receipt-boundary-changed',
      idempotencyKey: 'idem-receipt-boundary-changed',
      result: 'boundary-changed',
      actorId: 'worker-host-boundary',
      laneObjectiveRef: 'inspect-boundary',
      evidenceRefs: ['scope-drift'],
      changedPaths: [],
      verificationRefs: [],
      stopBoundary: 'reroute',
      observedAt: '2026-08-08T08:00:06.000Z',
    })
    await capability.observeDispatch({
      runId: run.run.runId,
      dispatchId: 'dispatch-unavailable',
      idempotencyKey: 'idem-dispatch-unavailable',
      lane: 'verify',
      workerId: 'worker-host-unavailable',
      objectiveRef: 'verify-unavailable',
      evidenceRefs: [],
      stopBoundary: 'capability-unavailable',
      createdAt: '2026-08-08T08:00:06.500Z',
    })
    await capability.observeReceipt({
      runId: run.run.runId,
      receiptId: 'receipt-unavailable',
      dispatchId: 'dispatch-unavailable',
      eventId: 'event-receipt-unavailable',
      idempotencyKey: 'idem-receipt-unavailable',
      result: 'unavailable',
      actorId: 'worker-host-unavailable',
      laneObjectiveRef: 'verify-unavailable',
      evidenceRefs: [],
      changedPaths: [],
      verificationRefs: [],
      stopBoundary: 'capability-unavailable',
      observedAt: '2026-08-08T08:00:06.750Z',
    })
    await capability.observeAttention({
      runId: run.run.runId,
      eventId: 'event-attention-runtime',
      idempotencyKey: 'idem-attention-runtime',
      actorType: 'manager',
      actorId: 'manager-host-1',
      attentionKind: 'runtime-observation-failed',
      summary: 'One optional observation failed and did not change the control result.',
      sourceRefs: ['runtime-diagnostic-1'],
      stopBoundary: null,
      observedAt: '2026-08-08T08:00:07.000Z',
    })
    await capability.observePause({
      runId: run.run.runId,
      eventId: 'event-paused',
      idempotencyKey: 'idem-paused',
      actorType: 'manager',
      actorId: 'manager-host-1',
      phase: 'verification',
      summary: 'Workers stopped before pause acknowledgement.',
      stopBoundary: 'explicit-pause',
      observedAt: '2026-08-08T08:00:08.000Z',
    })
    await capability.observeResume({
      runId: run.run.runId,
      eventId: 'event-resumed',
      idempotencyKey: 'idem-resumed',
      actorType: 'manager',
      actorId: 'manager-host-1',
      phase: 'verification',
      summary: 'Authority, status, diff, blockers, and evidence were reread.',
      evidenceRefs: ['authority-reread', 'diff-inspected'],
      stopBoundary: 'same-goal',
      observedAt: '2026-08-08T08:00:09.000Z',
    })
    await capability.observeTerminal({
      runId: run.run.runId,
      eventId: 'event-terminal',
      idempotencyKey: 'idem-terminal',
      actorType: 'manager',
      actorId: 'manager-host-1',
      phase: 'verification',
      summary: 'The host confirmed that this observed run reached its terminal boundary.',
      stopBoundary: 'verification-blocked',
      observedAt: '2026-08-08T08:00:10.000Z',
    })

    await expect(capability.observeReceipt({
      ...receiptInput,
      receiptId: 'receipt-wrong-actor',
      eventId: 'event-receipt-wrong-actor',
      idempotencyKey: 'idem-receipt-wrong-actor',
      actorId: 'worker-host-not-dispatched',
    })).rejects.toMatchObject({ code: 'manage_runtime_receipt_actor_mismatch' })
    await expect(capability.observeEvent({
      runId: run.run.runId,
      eventId: 'event-wrong-worker',
      idempotencyKey: 'idem-event-wrong-worker',
      kind: 'manage-event',
      actorType: 'worker',
      actorId: 'worker-host-not-dispatched',
      dispatchId: 'dispatch-real-fix-worker',
      summary: 'This mismatched worker identity must not be committed.',
    })).rejects.toMatchObject({ code: 'manage_runtime_event_actor_mismatch' })
    await expect(capability.observeEvent({
      runId: run.run.runId,
      eventId: 'event-worker-without-dispatch',
      idempotencyKey: 'idem-worker-without-dispatch',
      kind: 'manage-event',
      actorType: 'worker',
      actorId: 'worker-host-019fe-real',
      summary: 'A worker event without an observed dispatch must fail.',
    })).rejects.toMatchObject({ code: 'manage_runtime_event_dispatch_required' })

    const projection = await capability.projectRun(run.run.runId)
    const attention = await capability.projectAttention(run.run.runId)
    expect(projection).toMatchObject({
      authoritative: false,
      terminalDeliveryObserved: false,
      terminalBoundary: {
        id: 'event-terminal',
        sequence: expect.any(Number),
        type: 'event',
      },
      freshness: {
        projectId: fixture.project.projectId,
        workRef: 'rsp-4-runtime/manage-runtime-integration',
      },
      truncated: false,
    })
    expect(projection.dispatches).toEqual([
      expect.objectContaining({
        dispatchId: 'dispatch-real-fix-worker',
        receiptState: 'received',
        workerId: 'worker-host-019fe-real',
      }),
      expect.objectContaining({
        dispatchId: 'dispatch-required-verify-missing',
        receiptState: 'missing',
        workerId: 'worker-host-verify-missing',
      }),
      expect.objectContaining({
        dispatchId: 'dispatch-boundary-changed',
        receiptResult: 'boundary-changed',
        receiptState: 'received',
        terminalState: 'incomplete',
        workerId: 'worker-host-boundary',
      }),
      expect.objectContaining({
        dispatchId: 'dispatch-unavailable',
        receiptResult: 'unavailable',
        receiptState: 'received',
        terminalState: 'incomplete',
        workerId: 'worker-host-unavailable',
      }),
    ])
    expect(projection.events.filter(event => event.kind === 'manage-paused')).toHaveLength(1)
    expect(projection.events.filter(event => event.kind === 'manage-resumed')).toHaveLength(1)
    expect(attention.items.map(item => item.kind)).toEqual(expect.arrayContaining([
      'boundary-changed',
      'missing-receipt',
      'runtime-attention',
    ]))
    expect(attention.items.every(item => item.sourceRefs.every(source => source.id.length > 0))).toBe(true)
    const retainedProjection = store.projectRun(run.run.runId)
    expect(retainedProjection.receipts).toHaveLength(3)
    const boundaryDispatch = retainedProjection.dispatches.find(
      dispatch => dispatch.dispatchId === 'dispatch-boundary-changed',
    )
    const boundaryReceipt = retainedProjection.receipts.find(
      receipt => receipt.receiptId === 'receipt-boundary-changed',
    )
    const boundaryAttention = attention.items.find(item => item.kind === 'boundary-changed')
    expect(boundaryAttention?.sourceRefs).toEqual([
      {
        type: 'receipt',
        id: 'receipt-boundary-changed',
        sequence: boundaryReceipt?.sequence,
      },
      {
        type: 'dispatch',
        id: 'dispatch-boundary-changed',
        sequence: boundaryDispatch?.sequence,
      },
    ])
    expect(canonicalControl).toEqual({
      acceptance: 'incomplete',
      closeout: 'not-eligible',
      route: 'managed',
    })
  })

  it('keeps delivery scope and delayed dispatch parent state exact when effect IDs collide', async ({ onTestFinished }) => {
    const fixture = await createRuntimeFixture('scoped-delivery-parent')
    onTestFinished(fixture.cleanup)
    const store = await openRuntimeEventStore({
      namespacePath: fixture.namespacePath,
      project: fixture.project,
      now: fixture.clock,
    })
    onTestFinished(() => store.close())
    const capability = createStoreManageRuntimeCapability(store, fixture.clock)
    const run = await capability.observeRun({
      runId: 'run-scoped-delivery-parent',
      runKey: 'scoped-delivery-parent',
      workRef: 'rsp-4-runtime/managed-run-observatory',
      managerId: 'manager-scoped-delivery-parent',
      eventId: 'event-run-started',
      idempotencyKey: 'idem-run-started',
      phase: 'verification',
      authorityRefs: [],
      evidenceRefs: [],
    })
    const dispatch = {
      runId: run.run.runId,
      dispatchId: 'shared-effect-id',
      idempotencyKey: 'idem-shared-dispatch',
      lane: 'verify',
      workerId: 'worker-shared',
      parentEventId: 'event-delayed-parent',
      objectiveRef: 'verify scoped delivery',
      evidenceRefs: [],
      stopBoundary: 'same-scope',
    }
    await capability.observeDispatch(dispatch)
    await capability.observeDispatch(dispatch)
    await expect(capability.observeDispatch({
      ...dispatch,
      objectiveRef: 'conflicting dispatch delivery',
    })).rejects.toMatchObject({
      code: 'runtime_idempotency_conflict',
    })
    await capability.observeEvent({
      runId: run.run.runId,
      eventId: 'shared-effect-id',
      idempotencyKey: 'idem-shared-event',
      kind: 'manage-event',
      actorType: 'manager',
      actorId: 'manager-scoped-delivery-parent',
      summary: 'An event may reuse a dispatch identity in its own scope.',
    })
    await capability.observeReceipt({
      runId: run.run.runId,
      receiptId: 'shared-effect-id',
      dispatchId: 'shared-effect-id',
      eventId: 'event-shared-receipt',
      idempotencyKey: 'idem-shared-receipt',
      result: 'verified',
      actorId: 'worker-shared',
      laneObjectiveRef: 'verify scoped delivery',
      evidenceRefs: [],
      changedPaths: [],
      verificationRefs: [],
      stopBoundary: 'same-scope',
    })
    await capability.observeEvent({
      runId: run.run.runId,
      eventId: 'event-delayed-parent',
      idempotencyKey: 'idem-delayed-parent',
      kind: 'manage-event',
      actorType: 'manager',
      actorId: 'manager-scoped-delivery-parent',
      summary: 'The delayed parent arrived after its dispatch.',
    })
    await capability.observeDispatch({
      runId: run.run.runId,
      dispatchId: 'dispatch-missing-parent',
      idempotencyKey: 'idem-dispatch-missing-parent',
      lane: 'inspect',
      workerId: 'worker-missing-parent',
      parentEventId: 'event-never-arrived',
      objectiveRef: 'inspect missing parent',
      evidenceRefs: [],
      stopBoundary: 'same-scope',
    })

    const projection = await capability.projectRun(run.run.runId)

    expect(projection.dispatches).toEqual(expect.arrayContaining([
      expect.objectContaining({
        dispatchId: 'shared-effect-id',
        parentState: 'after',
        outOfOrder: true,
        deliveryCount: 3,
        duplicateCount: 1,
        conflictCount: 1,
      }),
      expect.objectContaining({
        dispatchId: 'dispatch-missing-parent',
        parentState: 'missing',
        outOfOrder: true,
      }),
    ]))
    expect(projection.events.find(event => event.eventId === 'shared-effect-id')).toMatchObject({
      deliveryCount: 1,
      duplicateCount: 0,
      conflictCount: 0,
    })
    expect(projection.receipts.find(receipt => receipt.receiptId === 'shared-effect-id')).toMatchObject({
      deliveryCount: 1,
      duplicateCount: 0,
      conflictCount: 0,
    })
    expect(projection.timeline).toEqual(expect.arrayContaining([
      expect.objectContaining({
        type: 'dispatch',
        id: 'shared-effect-id',
        parentState: 'after',
        outOfOrder: true,
      }),
      expect.objectContaining({
        type: 'dispatch',
        id: 'dispatch-missing-parent',
        parentState: 'missing',
        outOfOrder: true,
      }),
    ]))
  })

  it('discovers a running Broker explicitly and leaves absent runtime semantically inert', async ({ onTestFinished }) => {
    const fixture = await createRuntimeFixture('broker')
    onTestFinished(fixture.cleanup)
    const paths = resolveBrokerPaths({ root: join(fixture.root, 'broker-cache') })
    let callbackCalled = false
    const absent = await discoverBrokerManageRuntimeCapability({
      paths,
      root: fixture.repository,
    })
    const canonicalControl = Object.freeze({ route: 'managed', acceptance: 'evidence-complete' })
    const absentUse = await useOptionalManageRuntime(absent, async () => {
      callbackCalled = true
      return 'must-not-run'
    })

    expect(absent).toMatchObject({
      available: false,
      diagnostic: { code: 'manage_runtime_broker_absent' },
    })
    expect(absentUse).toMatchObject({
      available: false,
      value: null,
      diagnostic: { code: 'manage_runtime_broker_absent' },
    })
    expect(callbackCalled).toBe(false)
    expect(existsSync(paths.root)).toBe(false)
    if (absent.available)
      throw new Error('Absent Broker unexpectedly exposed managed runtime')
    expect(projectUnavailableManageRuntimeAttention(
      fixture.project.projectId,
      absent.diagnostic,
      fixture.clock,
    )).toMatchObject({
      available: false,
      authoritative: false,
      diagnostic: { code: 'manage_runtime_broker_absent' },
      items: [{
        kind: 'runtime-unavailable',
        sourceRefs: [],
      }],
      truncated: false,
    })

    const broker = await startBrokerServer({
      paths,
      packageVersion: '0.0.0-manage-runtime-fixture',
    })
    onTestFinished(() => broker.close())
    const discovered = await discoverBrokerManageRuntimeCapability({
      paths,
      root: fixture.repository,
    })
    expect(discovered.available).toBe(true)
    if (!discovered.available)
      throw new Error(discovered.diagnostic.message)
    expect(discovered.capability.descriptor.version).toEqual(MANAGE_RUNTIME_CAPABILITY_VERSION)
    expect(BROKER_PROTOCOL_VERSION).toEqual({ major: 1, minor: 2 })

    const observation = await useOptionalManageRuntime(discovered, capability => capability.observeRun({
      runId: 'run-broker-managed',
      runKey: 'run-key-broker-managed',
      workRef: 'rsp-4-runtime/manage-runtime-integration',
      managerId: 'manager-broker',
      eventId: 'event-broker-run',
      idempotencyKey: 'idem-broker-run',
      phase: 'implementation',
      authorityRefs: ['AGENTS.md'],
      evidenceRefs: [],
      observedAt: '2026-08-08T09:00:00.000Z',
    }))
    expect(observation).toMatchObject({
      available: true,
      diagnostic: null,
      value: {
        event: { duplicate: false },
        run: { runId: 'run-broker-managed' },
      },
    })
    expect((await discovered.capability.projectRun('run-broker-managed')).freshness).toMatchObject({
      projectId: fixture.project.projectId,
      sourceSequence: 1,
    })
    const brokerFreshness = currentFreshness(fixture, [
      source('authority-broker', 'authority', 'AGENTS.md', 'authority-broker'),
    ])
    await expect((discovered.capability.hydrateContext as (input: unknown) => Promise<unknown>)({
      runId: 'run-broker-managed',
      freshness: brokerFreshness,
      now: '2099-01-01T00:00:00.000Z',
    })).rejects.toMatchObject({ code: 'manage_runtime_request_invalid' })
    await expect((discovered.capability.saveContext as (input: unknown) => Promise<unknown>)({
      runId: 'run-broker-managed',
      expectedVersion: 0,
      sourceSequence: 1,
      freshness: brokerFreshness,
      data: {
        phase: 'implementation',
        authorityRefs: ['AGENTS.md'],
        decisiveObservations: [],
        blockers: [],
        attention: [],
        evidence: [],
        changedPaths: [],
        nextAction: null,
      },
      updatedAt: '2099-01-01T00:00:00.000Z',
      expiresAt: '2099-01-02T00:00:00.000Z',
    })).rejects.toMatchObject({ code: 'manage_runtime_request_invalid' })
    expect(canonicalControl).toEqual({ route: 'managed', acceptance: 'evidence-complete' })
  })

  it('hydrates only current authority and changed evidence while full rebuild stays equivalent', async ({ onTestFinished }) => {
    const fixture = await createRuntimeFixture('context')
    onTestFinished(fixture.cleanup)
    const store = await openRuntimeEventStore({
      namespacePath: fixture.namespacePath,
      project: fixture.project,
      now: fixture.clock,
    })
    onTestFinished(() => store.close())
    const capability = createStoreManageRuntimeCapability(store, fixture.clock)
    const run = await capability.observeRun({
      runId: 'run-managed-context',
      runKey: 'run-key-managed-context',
      workRef: 'rsp-4-runtime/manage-runtime-integration',
      managerId: 'manager-context',
      eventId: 'event-context-source',
      idempotencyKey: 'idem-context-source',
      phase: 'resume',
      authorityRefs: ['AGENTS.md', '.rsp/changes/rsp-4-runtime/manage-runtime-integration.md'],
      evidenceRefs: ['focused-test'],
      observedAt: '2026-08-08T10:00:00.000Z',
    })
    const authority = source('authority-agents', 'authority', 'AGENTS.md', 'authority-v1')
    const change = source(
      'authority-change',
      'authority',
      '.rsp/changes/rsp-4-runtime/manage-runtime-integration.md',
      'change-v1',
    )
    const unchangedEvidence = source('evidence-contract', 'evidence', 'test/managed-controller-contract.test.ts', 'contract-v1')
    const changingEvidence = source('evidence-runtime', 'evidence', 'test/manage-runtime-integration.test.ts', 'runtime-v1')
    const freshness = currentFreshness(fixture, [authority, change, unchangedEvidence, changingEvidence])
    fixture.setNow('2026-08-08T10:00:01.000Z')
    const saved = await capability.saveContext({
      runId: run.run.runId,
      expectedVersion: 0,
      sourceSequence: run.event.effect.sequence,
      freshness,
      data: {
        phase: 'resume',
        authorityRefs: [authority.path, change.path],
        decisiveObservations: [{
          eventId: run.event.effect.eventId,
          sequence: run.event.effect.sequence,
          summary: 'Selected handoff remained valid.',
        }],
        blockers: [],
        attention: [],
        evidence: [
          { sourceKey: unchangedEvidence.key, summary: 'contract-current' },
          { sourceKey: changingEvidence.key, summary: 'runtime-v1' },
        ],
        changedPaths: ['src/runtime/manage.ts'],
        nextAction: 'Run fixed-scope review.',
      },
    })
    expect(saved.applied).toBe(true)
    expect(saved.checkpoint?.packetKey).toBe(MANAGE_RUNTIME_CONTEXT_PACKET_KEY)

    fixture.setNow('2026-08-08T10:30:00.000Z')
    const fresh = await capability.hydrateContext({
      runId: run.run.runId,
      freshness,
    })
    expect(fresh).toMatchObject({
      currentAuthorityWins: true,
      mode: 'selective',
      reusableEvidenceSourceKeys: ['evidence-contract', 'evidence-runtime'],
      rereadSourceKeys: ['authority-agents', 'authority-change'],
      state: 'fresh',
    })

    const changedRuntimeEvidence = source(
      'evidence-runtime',
      'evidence',
      'test/manage-runtime-integration.test.ts',
      'runtime-v2',
    )
    const targetedFreshness = currentFreshness(
      fixture,
      [authority, change, unchangedEvidence, changedRuntimeEvidence],
    )
    const targeted = await capability.hydrateContext({
      runId: run.run.runId,
      freshness: targetedFreshness,
    })
    expect(targeted).toMatchObject({
      currentAuthorityWins: true,
      mode: 'selective',
      reusableEvidenceSourceKeys: ['evidence-contract'],
      rereadSourceKeys: ['authority-agents', 'authority-change', 'evidence-runtime'],
      staleSourceKeys: ['evidence-runtime'],
      state: 'targeted-reread',
    })
    expect(targeted.packet?.data.evidence).toEqual([
      { sourceKey: 'evidence-contract', summary: 'contract-current' },
    ])

    const selectiveValues = new Map<string, string>([
      ['evidence-contract', targeted.packet!.data.evidence[0]!.summary],
      ['authority-agents', 'authority-current'],
      ['authority-change', 'change-current'],
      ['evidence-runtime', 'runtime-v2'],
    ])
    const fullRereadValues = new Map<string, string>([
      ['authority-agents', 'authority-current'],
      ['authority-change', 'change-current'],
      ['evidence-contract', 'contract-current'],
      ['evidence-runtime', 'runtime-v2'],
    ])
    expect(controlFingerprint(selectiveValues)).toBe(controlFingerprint(fullRereadValues))

    const authorityChanged = source('authority-agents', 'authority', 'AGENTS.md', 'authority-v2')
    const full = await capability.hydrateContext({
      runId: run.run.runId,
      freshness: currentFreshness(
        fixture,
        [authorityChanged, change, unchangedEvidence, changedRuntimeEvidence],
        { authorityHash: sha('authority-hash-v2') },
      ),
    })
    expect(full).toMatchObject({
      currentAuthorityWins: true,
      mode: 'full-reread',
      packet: null,
      reusableEvidenceSourceKeys: [],
      state: 'full-rebuild',
    })
    expect(full.rereadSourceKeys).toEqual([
      'authority-agents',
      'authority-change',
      'evidence-contract',
      'evidence-runtime',
    ])

    const absent = projectManageHydration({
      state: 'absent',
      packet: null,
      reasons: ['context packet is absent'],
      rereadSourceKeys: [],
      staleSourceKeys: [],
    }, targetedFreshness)
    expect(absent).toMatchObject({
      mode: 'full-reread',
      packet: null,
      state: 'absent',
    })
    expect(absent.rereadSourceKeys).toEqual(targetedFreshness.sources.map(item => item.key))

    await expect(capability.saveContext({
      runId: run.run.runId,
      expectedVersion: saved.currentVersion,
      sourceSequence: run.event.effect.sequence,
      freshness,
      data: {
        phase: 'resume',
        authorityRefs: [authority.path, change.path],
        decisiveObservations: [],
        blockers: [],
        attention: [],
        evidence: [{
          sourceKey: unchangedEvidence.key,
          summary: 'x'.repeat(MANAGE_RUNTIME_MAX_CONTEXT_BYTES),
        }],
        changedPaths: [],
        nextAction: null,
      },
    })).rejects.toMatchObject({ code: 'manage_runtime_context_too_large' })

    await expect((capability.saveContext as (input: unknown) => Promise<unknown>)({
      runId: run.run.runId,
      expectedVersion: saved.currentVersion,
      sourceSequence: run.event.effect.sequence,
      freshness,
      data: {
        phase: 'resume',
        authorityRefs: [authority.path, change.path],
        decisiveObservations: [],
        blockers: [],
        attention: [],
        evidence: [],
        changedPaths: [],
        nextAction: null,
      },
      updatedAt: '2099-01-01T00:00:00.000Z',
      expiresAt: '2099-01-02T00:00:00.000Z',
    })).rejects.toMatchObject({ code: 'manage_runtime_request_invalid' })

    const concurrentStore = await openRuntimeEventStore({
      namespacePath: fixture.namespacePath,
      project: fixture.project,
      now: fixture.clock,
    })
    onTestFinished(() => concurrentStore.close())
    const concurrentCapability = createStoreManageRuntimeCapability(concurrentStore, fixture.clock)
    const concurrentRun = await capability.observeRun({
      runId: 'run-managed-context-concurrent',
      runKey: 'run-key-managed-context-concurrent',
      workRef: 'rsp-4-runtime/manage-runtime-integration',
      managerId: 'manager-context-concurrent',
      eventId: 'event-context-concurrent-source',
      idempotencyKey: 'idem-context-concurrent-source',
      phase: 'resume',
      authorityRefs: [authority.path, change.path],
      evidenceRefs: [],
    })
    const observedSourceSequence = concurrentRun.event.effect.sequence
    await concurrentCapability.observeAttention({
      runId: concurrentRun.run.runId,
      eventId: 'event-context-concurrent-later',
      idempotencyKey: 'idem-context-concurrent-later',
      actorType: 'manager',
      actorId: 'manager-context-concurrent',
      attentionKind: 'concurrent-observation',
      summary: 'A second store committed after the context source revision was read.',
    })
    expect(await capability.saveContext({
      runId: concurrentRun.run.runId,
      expectedVersion: 0,
      sourceSequence: observedSourceSequence,
      freshness,
      data: {
        phase: 'resume',
        authorityRefs: [authority.path, change.path],
        decisiveObservations: [{
          eventId: concurrentRun.event.effect.eventId,
          sequence: observedSourceSequence,
          summary: 'This observation preceded the concurrent commit.',
        }],
        blockers: [],
        attention: [],
        evidence: [],
        changedPaths: [],
        nextAction: null,
      },
    })).toEqual({
      applied: false,
      checkpoint: null,
      currentVersion: 0,
    })
    expect(store.getContextPacket(
      concurrentRun.run.runId,
      MANAGE_RUNTIME_CONTEXT_PACKET_KEY,
    )).toBeNull()

    fixture.setNow('2026-08-09T10:00:02.000Z')
    expect(await capability.hydrateContext({
      runId: run.run.runId,
      freshness,
    })).toMatchObject({
      mode: 'full-reread',
      packet: null,
      reasons: ['context packet expired'],
      state: 'full-rebuild',
    })
    await expect((capability.hydrateContext as (input: unknown) => Promise<unknown>)({
      runId: run.run.runId,
      freshness,
      now: '2026-08-08T10:30:00.000Z',
    })).rejects.toMatchObject({ code: 'manage_runtime_request_invalid' })
  })

  it('invalidates context after every later committed observation without advancing duplicates', async ({ onTestFinished }) => {
    for (const boundary of ['dispatch', 'receipt', 'attention', 'pause', 'resume'] as const) {
      const fixture = await createRuntimeFixture(`revision-${boundary}`)
      onTestFinished(fixture.cleanup)
      const store = await openRuntimeEventStore({
        namespacePath: fixture.namespacePath,
        project: fixture.project,
        now: fixture.clock,
      })
      onTestFinished(() => store.close())
      const capability = createStoreManageRuntimeCapability(store, fixture.clock)
      const run = await capability.observeRun({
        runId: `run-revision-${boundary}`,
        runKey: `run-key-revision-${boundary}`,
        workRef: 'rsp-4-runtime/manage-runtime-integration',
        managerId: 'manager-revision',
        eventId: `event-revision-${boundary}-start`,
        idempotencyKey: `idem-revision-${boundary}-start`,
        phase: 'resume',
        authorityRefs: ['AGENTS.md'],
        evidenceRefs: [],
      })
      let sourceSequence = run.event.effect.sequence
      const dispatchInput = {
        runId: run.run.runId,
        dispatchId: `dispatch-revision-${boundary}`,
        idempotencyKey: `idem-dispatch-revision-${boundary}`,
        lane: 'fix',
        workerId: `worker-revision-${boundary}`,
        objectiveRef: 'revision-boundary',
        evidenceRefs: [],
        stopBoundary: 'same-scope',
      }
      if (boundary === 'receipt') {
        const dispatch = await capability.observeDispatch(dispatchInput)
        sourceSequence = dispatch.effect.sequence
      }
      const freshness = currentFreshness(fixture, [
        source('authority-revision', 'authority', 'AGENTS.md', 'authority-revision'),
      ])
      fixture.setNow('2026-08-08T13:00:00.000Z')
      await capability.saveContext({
        runId: run.run.runId,
        expectedVersion: 0,
        sourceSequence,
        freshness,
        data: {
          phase: 'resume',
          authorityRefs: ['AGENTS.md'],
          decisiveObservations: [{
            eventId: run.event.effect.eventId,
            sequence: run.event.effect.sequence,
            summary: 'The selected handoff was current when the packet was saved.',
          }],
          blockers: [],
          attention: [],
          evidence: [],
          changedPaths: [],
          nextAction: null,
        },
      })

      if (boundary === 'dispatch') {
        const first = await capability.observeDispatch(dispatchInput)
        const duplicate = await capability.observeDispatch(dispatchInput)
        expect(first.effect.sequence).toBe(sourceSequence + 1)
        expect(duplicate).toMatchObject({
          duplicate: true,
          effect: { sequence: first.effect.sequence },
        })
      }
      else if (boundary === 'receipt') {
        const receiptInput = {
          runId: run.run.runId,
          receiptId: 'receipt-revision',
          dispatchId: dispatchInput.dispatchId,
          eventId: 'event-receipt-revision',
          idempotencyKey: 'idem-receipt-revision',
          result: 'changed-same-scope',
          actorId: dispatchInput.workerId,
          laneObjectiveRef: 'revision-boundary',
          evidenceRefs: [],
          changedPaths: [],
          verificationRefs: [],
          stopBoundary: 'same-scope',
        }
        const first = await capability.observeReceipt(receiptInput)
        const duplicate = await capability.observeReceipt(receiptInput)
        expect(first.effect.sequence).toBe(sourceSequence + 1)
        expect(duplicate).toMatchObject({
          duplicate: true,
          effect: { sequence: first.effect.sequence },
        })
      }
      else if (boundary === 'attention') {
        await capability.observeAttention({
          runId: run.run.runId,
          eventId: 'event-revision-attention',
          idempotencyKey: 'idem-revision-attention',
          actorType: 'manager',
          actorId: 'manager-revision',
          attentionKind: 'later-observation',
          summary: 'A later attention observation invalidates the packet.',
        })
      }
      else if (boundary === 'pause') {
        await capability.observePause({
          runId: run.run.runId,
          eventId: 'event-revision-pause',
          idempotencyKey: 'idem-revision-pause',
          actorType: 'manager',
          actorId: 'manager-revision',
          phase: 'resume',
          summary: 'A later pause observation invalidates the packet.',
        })
      }
      else {
        await capability.observeResume({
          runId: run.run.runId,
          eventId: 'event-revision-resume',
          idempotencyKey: 'idem-revision-resume',
          actorType: 'manager',
          actorId: 'manager-revision',
          phase: 'resume',
          summary: 'A later resume observation invalidates the packet.',
        })
      }

      const projection = await capability.projectRun(run.run.runId)
      expect(projection.freshness.sourceSequence).toBe(sourceSequence + 1)
      expect(await capability.hydrateContext({
        runId: run.run.runId,
        freshness,
      })).toMatchObject({
        mode: 'full-reread',
        packet: null,
        reasons: ['committed runtime revision changed'],
        state: 'full-rebuild',
      })
    }
  })

  it('observes deterministic fake-host creation order while the absent path preserves the same control result', async ({ onTestFinished }) => {
    const fixture = await createRuntimeFixture('fake-host')
    onTestFinished(fixture.cleanup)
    const store = await openRuntimeEventStore({
      namespacePath: fixture.namespacePath,
      project: fixture.project,
      now: fixture.clock,
    })
    onTestFinished(() => store.close())
    const capability = createStoreManageRuntimeCapability(store, fixture.clock)
    const availableOrder: string[] = []
    const availableControl = await executeFakeManagedHost({
      runtime: {
        available: true,
        capability,
        diagnostic: null,
      },
      order: availableOrder,
    })
    const absentOrder: string[] = []
    const absentControl = await executeFakeManagedHost({
      runtime: {
        available: false,
        capability: null,
        diagnostic: {
          code: 'manage_runtime_broker_absent',
          message: 'Broker is absent',
          action: null,
        },
      },
      order: absentOrder,
    })

    expect(availableControl).toEqual(absentControl)
    expect(availableOrder).toEqual([
      'runtime:run',
      'host:create:start',
      'host:create:complete',
      'runtime:dispatch',
      'host:worker:return',
      'runtime:receipt',
      'runtime:terminal',
    ])
    expect(absentOrder).toEqual([
      'host:create:start',
      'host:create:complete',
      'host:worker:return',
    ])
    expect(await capability.projectRun('run-fake-host')).toMatchObject({
      freshness: { sourceSequence: 4 },
      terminalBoundary: {
        id: 'event-fake-host-terminal',
        sequence: 4,
      },
      terminalDeliveryObserved: true,
    })
    const laterDispatch = await capability.observeDispatch({
      runId: 'run-fake-host',
      dispatchId: 'dispatch-fake-host-later',
      idempotencyKey: 'idem-dispatch-fake-host-later',
      lane: 'verify',
      workerId: 'worker-fake-host-later',
      objectiveRef: 'fake-host-terminal-order',
      evidenceRefs: [],
      stopBoundary: 'same-scope',
    })
    expect(laterDispatch.effect.sequence).toBe(5)
    expect(await capability.projectRun('run-fake-host')).toMatchObject({
      freshness: { sourceSequence: 5 },
      terminalBoundary: { id: 'event-fake-host-terminal', sequence: 4 },
      terminalDeliveryObserved: false,
    })
    const terminalBeforeReceipt = await capability.observeTerminal({
      runId: 'run-fake-host',
      eventId: 'event-fake-host-terminal-before-receipt',
      idempotencyKey: 'idem-fake-host-terminal-before-receipt',
      actorType: 'manager',
      actorId: 'manager-fake-host',
      phase: 'verification',
      summary: 'The host observed a terminal boundary before the later receipt arrived.',
      stopBoundary: 'same-scope',
    })
    expect(terminalBeforeReceipt.effect.sequence).toBe(6)
    expect(await capability.projectRun('run-fake-host')).toMatchObject({
      freshness: { sourceSequence: 6 },
      terminalDeliveryObserved: false,
    })
    const laterReceipt = await capability.observeReceipt({
      runId: 'run-fake-host',
      receiptId: 'receipt-fake-host-later',
      dispatchId: laterDispatch.effect.dispatchId,
      eventId: 'event-receipt-fake-host-later',
      idempotencyKey: 'idem-receipt-fake-host-later',
      result: 'changed-same-scope',
      actorId: laterDispatch.effect.workerId,
      laneObjectiveRef: 'fake-host-terminal-order',
      evidenceRefs: [],
      changedPaths: [],
      verificationRefs: ['fake-host-terminal-order'],
      stopBoundary: 'same-scope',
    })
    expect(laterReceipt.effect.sequence).toBe(7)
    expect(await capability.projectRun('run-fake-host')).toMatchObject({
      freshness: { sourceSequence: 7 },
      terminalBoundary: {
        id: 'event-fake-host-terminal-before-receipt',
        sequence: 6,
      },
      terminalDeliveryObserved: false,
    })
    const currentTerminal = await capability.observeTerminal({
      runId: 'run-fake-host',
      eventId: 'event-fake-host-terminal-current',
      idempotencyKey: 'idem-fake-host-terminal-current',
      actorType: 'manager',
      actorId: 'manager-fake-host',
      phase: 'verification',
      summary: 'The host confirmed the current committed delivery boundary.',
      stopBoundary: 'same-scope',
    })
    expect(currentTerminal.effect.sequence).toBe(8)
    expect(await capability.projectRun('run-fake-host')).toMatchObject({
      freshness: { sourceSequence: 8 },
      terminalBoundary: { id: 'event-fake-host-terminal-current', sequence: 8 },
      terminalDeliveryObserved: true,
    })
    const laterPause = await capability.observePause({
      runId: 'run-fake-host',
      eventId: 'event-fake-host-pause-after-terminal',
      idempotencyKey: 'idem-fake-host-pause-after-terminal',
      actorType: 'manager',
      actorId: 'manager-fake-host',
      phase: 'verification',
      summary: 'A later nonterminal observation invalidates the terminal projection.',
    })
    expect(laterPause.effect.sequence).toBe(9)
    expect(await capability.projectRun('run-fake-host')).toMatchObject({
      freshness: { sourceSequence: 9 },
      terminalBoundary: { id: 'event-fake-host-terminal-current', sequence: 8 },
      terminalDeliveryObserved: false,
    })
    const refreshedTerminal = await capability.observeTerminal({
      runId: 'run-fake-host',
      eventId: 'event-fake-host-terminal-refreshed',
      idempotencyKey: 'idem-fake-host-terminal-refreshed',
      actorType: 'manager',
      actorId: 'manager-fake-host',
      phase: 'verification',
      summary: 'The host confirmed the later committed observation boundary.',
      stopBoundary: 'same-scope',
    })
    expect(refreshedTerminal.effect.sequence).toBe(10)
    expect(await capability.projectRun('run-fake-host')).toMatchObject({
      freshness: { sourceSequence: 10 },
      terminalBoundary: { id: 'event-fake-host-terminal-refreshed', sequence: 10 },
      terminalDeliveryObserved: true,
    })

    await capability.observeRun({
      runId: 'run-fake-host-no-dispatch',
      runKey: 'run-key-fake-host-no-dispatch',
      workRef: 'rsp-4-runtime/manage-runtime-integration',
      managerId: 'manager-fake-host',
      eventId: 'event-fake-host-no-dispatch-start',
      idempotencyKey: 'idem-fake-host-no-dispatch-start',
      phase: 'verification',
      authorityRefs: ['AGENTS.md'],
      evidenceRefs: [],
    })
    await capability.observeTerminal({
      runId: 'run-fake-host-no-dispatch',
      eventId: 'event-fake-host-no-dispatch-terminal',
      idempotencyKey: 'idem-fake-host-no-dispatch-terminal',
      actorType: 'manager',
      actorId: 'manager-fake-host',
      phase: 'verification',
      summary: 'The host ended without creating a worker.',
      stopBoundary: 'capability-unavailable',
    })
    expect(await capability.projectRun('run-fake-host-no-dispatch')).toMatchObject({
      terminalDeliveryObserved: false,
      dispatches: [],
    })
  })

  it('bounds run and attention projections with attributable source references', async ({ onTestFinished }) => {
    const fixture = await createRuntimeFixture('bounds')
    onTestFinished(fixture.cleanup)
    const store = await openRuntimeEventStore({
      namespacePath: fixture.namespacePath,
      project: fixture.project,
      now: fixture.clock,
    })
    onTestFinished(() => store.close())
    const capability = createStoreManageRuntimeCapability(store, fixture.clock)
    const run = await capability.observeRun({
      runId: 'run-managed-bounds',
      runKey: 'run-key-managed-bounds',
      workRef: 'rsp-4-runtime/manage-runtime-integration',
      managerId: 'manager-bounds',
      eventId: 'event-bounds-start',
      idempotencyKey: 'idem-bounds-start',
      phase: 'implementation',
      authorityRefs: ['AGENTS.md'],
      evidenceRefs: [],
      observedAt: '2026-08-08T11:00:00.000Z',
    })
    for (let index = 0; index < MANAGE_RUNTIME_MAX_PROJECTION_ITEMS + 4; index += 1) {
      await capability.observeDispatch({
        runId: run.run.runId,
        dispatchId: `dispatch-bound-${index}`,
        idempotencyKey: `idem-dispatch-bound-${index}`,
        lane: 'inspect',
        workerId: `worker-bound-${index}`,
        objectiveRef: `objective-${index}`,
        evidenceRefs: [],
        stopBoundary: 'receipt-required',
        createdAt: `2026-08-08T11:00:${String(index + 1).padStart(2, '0')}.000Z`,
      })
    }
    const runProjection = await capability.projectRun(run.run.runId, 5)
    const attentionProjection = await capability.projectAttention(run.run.runId, 3)

    expect(runProjection.dispatches).toHaveLength(5)
    expect(runProjection.truncated).toBe(true)
    expect(runProjection.terminalDeliveryObserved).toBe(false)
    expect(runProjection.freshness.sourceSequence).toBe(1 + MANAGE_RUNTIME_MAX_PROJECTION_ITEMS + 4)
    expect(runProjection.dispatches.every(dispatch => dispatch.source.sequence === dispatch.sequence)).toBe(true)
    expect(attentionProjection.items.length).toBeLessThanOrEqual(3)
    expect(attentionProjection.truncated).toBe(true)
    expect(attentionProjection.items.every(item => item.sourceRefs.every(source => (
      ['dispatch', 'event', 'receipt', 'run'].includes(source.type)
    )))).toBe(true)
    expect(MANAGE_RUNTIME_MAX_ATTENTION_ITEMS).toBe(32)
    expect(MANAGE_RUNTIME_MAX_PROJECTION_ITEMS).toBe(32)

    const concurrentStore = await openRuntimeEventStore({
      namespacePath: fixture.namespacePath,
      project: fixture.project,
      now: fixture.clock,
    })
    onTestFinished(() => concurrentStore.close())
    const snapshotRun = await capability.observeRun({
      runId: 'run-managed-snapshot',
      runKey: 'run-key-managed-snapshot',
      workRef: 'rsp-4-runtime/manage-runtime-integration',
      managerId: 'manager-snapshot',
      eventId: 'event-snapshot-start',
      idempotencyKey: 'idem-snapshot-start',
      phase: 'verification',
      authorityRefs: ['AGENTS.md'],
      evidenceRefs: [],
    })
    const originalGetRun = store.getRun.bind(store)
    let interleaved = false
    store.getRun = (runId) => {
      const current = originalGetRun(runId)
      if (runId === snapshotRun.run.runId && !interleaved) {
        interleaved = true
        concurrentStore.appendEvent({
          runId,
          eventId: 'event-snapshot-concurrent',
          idempotencyKey: 'idem-snapshot-concurrent',
          kind: 'manage-attention',
          actorType: 'manager',
          actorId: 'manager-snapshot',
          payload: {
            attentionKind: 'concurrent-observation',
            summary: 'A second store committed after the projection snapshot opened.',
          },
        })
      }
      return current
    }
    let snapshot
    try {
      snapshot = store.projectRun(snapshotRun.run.runId)
    }
    finally {
      store.getRun = originalGetRun
    }
    expect(snapshot.run?.nextSequence).toBe(2)
    expect(snapshot.events.map(event => event.eventId)).toEqual(['event-snapshot-start'])
    expect(concurrentStore.projectRun(snapshotRun.run.runId)).toMatchObject({
      run: { nextSequence: 3 },
      events: [
        { eventId: 'event-snapshot-start', sequence: 1 },
        { eventId: 'event-snapshot-concurrent', sequence: 2 },
      ],
    })
  })
})

async function createRuntimeFixture(name: string) {
  const root = await mkdtemp(join(tmpdir(), `rsp-manage-runtime-${name}-`))
  const repository = join(root, 'repository')
  const namespacePath = join(root, 'runtime')
  await mkdir(repository, { recursive: true })
  await writeFile(join(repository, 'README.md'), `${name}\n`)
  execFileSync('git', ['init', '--quiet'], { cwd: repository })
  execFileSync('git', ['config', 'user.name', 'RSP Runtime Test'], { cwd: repository })
  execFileSync('git', ['config', 'user.email', 'rsp-runtime@example.invalid'], { cwd: repository })
  execFileSync('git', ['add', 'README.md'], { cwd: repository })
  execFileSync('git', ['commit', '--quiet', '-m', `fixture: ${name}`], { cwd: repository })
  const project = await discoverBrokerProject(repository)
  let currentTime = Date.parse('2026-08-08T12:00:00.000Z')
  return {
    root,
    repository,
    namespacePath,
    project,
    clock: () => new Date(currentTime),
    setNow: (value: string) => {
      currentTime = Date.parse(value)
    },
    cleanup: () => rm(root, { force: true, recursive: true }),
  }
}

async function executeFakeManagedHost(input: {
  runtime: Parameters<typeof useOptionalManageRuntime>[0]
  order: string[]
}) {
  const canonicalControl = Object.freeze({
    acceptance: 'evidence-complete',
    closeout: 'not-eligible',
    route: 'managed',
  })
  await useOptionalManageRuntime(input.runtime, async (capability) => {
    input.order.push('runtime:run')
    await capability.observeRun({
      runId: 'run-fake-host',
      runKey: 'run-key-fake-host',
      workRef: 'rsp-4-runtime/manage-runtime-integration',
      managerId: 'manager-fake-host',
      eventId: 'event-fake-host-start',
      idempotencyKey: 'idem-fake-host-start',
      phase: 'implementation',
      authorityRefs: ['AGENTS.md'],
      evidenceRefs: [],
    })
  })
  input.order.push('host:create:start')
  const worker = {
    dispatchId: 'dispatch-fake-host-created',
    workerId: 'worker-fake-host-created',
  }
  input.order.push('host:create:complete')
  await useOptionalManageRuntime(input.runtime, async (capability) => {
    input.order.push('runtime:dispatch')
    await capability.observeDispatch({
      runId: 'run-fake-host',
      dispatchId: worker.dispatchId,
      idempotencyKey: 'idem-dispatch-fake-host-created',
      lane: 'fix',
      workerId: worker.workerId,
      objectiveRef: 'fake-host-order',
      evidenceRefs: [],
      stopBoundary: 'same-scope',
    })
  })
  input.order.push('host:worker:return')
  await useOptionalManageRuntime(input.runtime, async (capability) => {
    input.order.push('runtime:receipt')
    await capability.observeReceipt({
      runId: 'run-fake-host',
      receiptId: 'receipt-fake-host-created',
      dispatchId: worker.dispatchId,
      eventId: 'event-receipt-fake-host-created',
      idempotencyKey: 'idem-receipt-fake-host-created',
      result: 'changed-same-scope',
      actorId: worker.workerId,
      laneObjectiveRef: 'fake-host-order',
      evidenceRefs: [],
      changedPaths: ['src/runtime/manage.ts'],
      verificationRefs: ['fake-host-harness'],
      stopBoundary: 'same-scope',
    })
    input.order.push('runtime:terminal')
    await capability.observeTerminal({
      runId: 'run-fake-host',
      eventId: 'event-fake-host-terminal',
      idempotencyKey: 'idem-fake-host-terminal',
      actorType: 'manager',
      actorId: 'manager-fake-host',
      phase: 'verification',
      summary: 'The fake host confirmed its terminal delivery boundary.',
      stopBoundary: 'same-scope',
    })
  })
  return canonicalControl
}

function source(
  key: string,
  role: RuntimeSourceIdentity['role'],
  path: string,
  content: string,
): RuntimeSourceIdentity {
  return {
    key,
    role,
    path,
    contentHash: sha(content),
    revision: null,
  }
}

function currentFreshness(
  fixture: Awaited<ReturnType<typeof createRuntimeFixture>>,
  sources: RuntimeSourceIdentity[],
  overrides: Partial<RuntimeFreshnessIdentity> = {},
): RuntimeFreshnessIdentity {
  return {
    projectId: fixture.project.projectId,
    checkoutRoot: fixture.project.root,
    workRef: 'rsp-4-runtime/manage-runtime-integration',
    gitHead: '0123456789abcdef0123456789abcdef01234567',
    dirtyPathsHash: sha('dirty-paths'),
    authorityHash: sha('authority-hash-v1'),
    sources,
    ...overrides,
  }
}

function controlFingerprint(values: Map<string, string>): string {
  return sha([...values.entries()].sort(([left], [right]) => left.localeCompare(right)))
}

function sha(value: unknown): string {
  return createHash('sha256').update(
    typeof value === 'string' ? value : JSON.stringify(value),
  ).digest('hex')
}
