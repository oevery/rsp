// @vitest-environment jsdom

import type { Root } from 'react-dom/client'
import type { WebManagedRunDetailProjection, WebSnapshot } from '../src/web/model.js'
import type { AppState } from '../web/src/state.js'
import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ObservatoryApp } from '../web/src/app.js'
import { buildRunGraphModel, runGraphLaneY } from '../web/src/run-graph.js'
import { buildInvocationTree } from '../web/src/run-tree.js'

const projectId = 'a'.repeat(64)

describe('web react browser lifecycle', () => {
  let root: Root | null = null

  beforeEach(() => {
    document.body.innerHTML = '<main id="app"></main>'
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    })
    ;(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true
  })

  afterEach(async () => {
    if (root) {
      await act(async () => root?.unmount())
      root = null
    }
    vi.useRealTimers()
    vi.restoreAllMocks()
  })
  it('renders only the server-owned Markdown projection and switches to the exact safe source', async () => {
    const fetchMock = vi.spyOn(globalThis, 'fetch')
    const snapshot = fixtureSnapshot()
    const source = '# Safe source\n\n<script>text only</script>\n\n![image](https://images.example/private.png)'
    const state: AppState = {
      locale: 'en',
      view: 'specs',
      loading: false,
      refreshing: false,
      autoRefresh: true,
      stale: false,
      error: null,
      notice: null,
      snapshot,
      detail: {
        mode: 'detail',
        source: snapshot.source,
        document: {
          ...snapshot.specs.documents[0]!,
          content: source,
          contentTruncated: false,
          markdown: {
            bounded: false,
            unsupported: true,
            blocks: [
              {
                type: 'heading',
                depth: 2,
                children: [{ type: 'text', value: 'Readable heading' }],
              },
              {
                type: 'paragraph',
                children: [
                  { type: 'strong', children: [{ type: 'text', value: 'Strong' }] },
                  { type: 'text', value: ' and ' },
                  {
                    type: 'link',
                    href: 'https://docs.example.com/rsp',
                    title: 'Docs',
                    children: [{ type: 'text', value: 'safe link' }],
                  },
                  {
                    type: 'unsupported',
                    reason: 'unsafe-link',
                    children: [{ type: 'text', value: 'unsafe label' }],
                  },
                ],
              },
              { type: 'unsupported', reason: 'html' },
              { type: 'unsupported', reason: 'image' },
            ],
          },
          metadata: {
            kind: 'decision',
            status: 'accepted',
          },
        },
      },
      search: null,
      managedEventId: null,
      managedConnection: 'live',
    }
    root = createRoot(document.querySelector('#app')!)

    await act(async () => {
      root?.render(<ObservatoryApp state={state} />)
    })

    expect(document.querySelector('.markdown-document h2')?.textContent).toBe('Readable heading')
    expect(document.querySelector('.markdown-document strong')?.textContent).toBe('Strong')
    const link = document.querySelector<HTMLAnchorElement>('.markdown-document a')
    expect(link?.getAttribute('href')).toBe('https://docs.example.com/rsp')
    expect(link?.getAttribute('target')).toBe('_blank')
    expect(link?.getAttribute('rel')).toBe('noopener noreferrer')
    expect(link?.getAttribute('referrerpolicy')).toBe('no-referrer')
    expect(document.querySelector('.markdown-document img')).toBeNull()
    expect(document.querySelector('.markdown-document script')).toBeNull()
    expect(document.querySelector('.document-metadata')?.textContent).toContain('Kind: decision')
    expect(document.querySelector('.document-metadata')?.textContent).toContain('Status: accepted')
    expect(document.querySelector('[role="group"][aria-label="Document presentation"]')).not.toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()

    const sourceButton = [...document.querySelectorAll<HTMLButtonElement>('button')]
      .find(button => button.textContent === 'Source')
    await act(async () => sourceButton?.click())
    expect(document.querySelector('[data-document-mode="source"]')?.textContent).toBe(source)
    expect(document.querySelector('[data-document-mode="rendered"]')).toBeNull()

    await act(async () => {
      root?.render(<ObservatoryApp state={{ ...state, locale: 'zh-CN' }} />)
    })
    expect([...document.querySelectorAll('button')].some(button => button.textContent === '源码')).toBe(true)
    expect(fetchMock).not.toHaveBeenCalled()

    const archiveSource = '# Archived Change\n\n- [x] implemented\n\n```sh\npnpm test\n```'
    const historyState: AppState = {
      ...state,
      locale: 'en',
      view: 'history',
      detail: {
        mode: 'detail',
        record: {
          date: '2026-08-10',
          workRef: 'rsp-4-runtime/web-content-presentation',
          group: 'rsp-4-runtime',
          kind: 'feature',
          summary: 'Complete archived presentation',
          summaryTruncated: false,
          scenarioCount: 1,
          checkboxes: {
            tasks: { todo: 0, progress: 0, done: 1, dropped: 0, total: 1 },
            verify: { todo: 0, progress: 0, done: 1, dropped: 0, total: 1 },
          },
          evidence: {
            tasks: { items: ['implemented'], truncated: false },
            verify: { items: ['passed'], truncated: false },
            blockers: { items: [], truncated: false },
          },
        },
        document: {
          path: '.rsp/archives/rsp-4-runtime/2026-08-10_web-content-presentation.md',
          content: archiveSource,
          contentTruncated: false,
          markdown: {
            bounded: false,
            unsupported: false,
            blocks: [{
              type: 'heading',
              depth: 1,
              children: [{ type: 'text', value: 'Archived Change' }],
            }, {
              type: 'list',
              ordered: false,
              start: null,
              items: [{
                checked: true,
                blocks: [{
                  type: 'paragraph',
                  children: [{ type: 'text', value: 'implemented' }],
                }],
              }],
            }, {
              type: 'code',
              language: 'sh',
              value: 'pnpm test',
            }],
          },
        },
      },
    }
    await act(async () => {
      root?.render(<ObservatoryApp state={historyState} />)
    })
    expect(document.querySelector('.history-document .markdown-document h1')?.textContent).toBe('Archived Change')
    expect(document.querySelector('.history-document .task-list-item')).not.toBeNull()
    expect(document.querySelector('.history-metrics')?.textContent).toContain('Tasks 1/1')
    const historySourceButton = [...document.querySelectorAll<HTMLButtonElement>('button')]
      .find(button => button.textContent === 'Source')
    await act(async () => historySourceButton?.click())
    expect(document.querySelector('.history-document [data-document-mode="source"]')?.textContent).toBe(archiveSource)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('defaults to repeated invocation identities and retains synchronized sequence and raw modes', async () => {
    const snapshot = fixtureSnapshot()
    const detail = fixtureRunDetail()
    detail.run.dispatches[0] = {
      ...detail.run.dispatches[0]!,
      duplicateCount: 1,
    }
    snapshot.managed = {
      state: 'ready',
      available: true,
      authoritative: false,
      diagnostic: null,
      generatedAt: detail.freshness.generatedAt,
      runs: [{
        lookupId: 'run-lookup',
        runId: detail.run.run!.runId,
        runKey: detail.run.run!.runKey,
        workRef: detail.run.run!.workRef,
        status: detail.run.status,
        phase: detail.run.phase,
        managerId: detail.run.managerId,
        actors: detail.run.actors.length,
        dispatches: detail.run.dispatches.length,
        receipts: detail.run.receipts.length,
        attention: detail.attention.length,
        terminalDeliveryObserved: false,
        lastObservedAt: detail.run.run!.lastObservedAt,
        freshness: detail.freshness,
      }],
      runsSummary: { total: 1, returned: 1, hasMore: false },
      attention: [],
      attentionSummary: { total: 0, returned: 0, hasMore: false },
    }
    const state: AppState = {
      locale: 'en',
      view: 'runs',
      loading: false,
      refreshing: false,
      autoRefresh: true,
      stale: false,
      error: null,
      notice: null,
      snapshot,
      detail,
      search: null,
      managedEventId: null,
      managedConnection: 'live',
    }
    root = createRoot(document.querySelector('#app')!)

    await act(async () => {
      root?.render(<ObservatoryApp state={state} />)
    })

    expect(document.querySelector('svg[role="group"]')).toBeNull()
    expect(document.querySelector('.run-picker')).toBeNull()
    expect(document.querySelector('.runs-workspace')?.classList).toContain('is-single-run')
    expect(document.querySelector('.run-audit-panel')).not.toBeNull()
    expect(document.querySelectorAll('.invocation-row')).toHaveLength(2)
    const invocationHeader = document.querySelector('.invocation-table-header')
    expect(invocationHeader?.textContent).toContain('Committed sequence')
    expect(invocationHeader?.hasAttribute('aria-hidden')).toBe(false)
    const firstInvocation = document.querySelector<HTMLElement>('[data-dispatch-id="dispatch-a"][role="treeitem"]')
    expect(firstInvocation?.closest('[role="tree"]')).not.toBeNull()
    expect(firstInvocation?.getAttribute('aria-label')).toContain('Call: verification · call 1')
    expect(firstInvocation?.getAttribute('aria-label')).toContain('Worker: silent-panda · worker-shared')
    expect(firstInvocation?.getAttribute('aria-label')).toContain('Result: completed · 1 anomaly/anomalies')
    expect(firstInvocation?.getAttribute('aria-label')).toContain('Committed sequence: #2–6')
    expect(firstInvocation?.getAttribute('aria-label')).toContain('Receipt: Received · verified')
    expect(document.body.textContent).toContain('verification · call 1')
    expect(document.body.textContent).toContain('verification · call 2')
    expect(document.body.textContent).toContain('silent-panda')
    expect(document.querySelector('.run-explorer-summary')?.textContent).toContain('Invocation anomalies requiring attention: 3')
    expect(document.querySelector('.anomaly-navigation')?.textContent).toContain('Anomalous invocation 1/2')
    expect(document.querySelector('.invocation-inspector')?.textContent).toContain('dispatch-a')
    expect(document.querySelector('.invocation-layout')?.classList).toContain('has-inspector')
    await act(async () => {
      document.querySelector<HTMLButtonElement>('[data-action="next-anomaly"]')?.click()
    })
    expect(document.querySelector('.anomaly-navigation')?.textContent).toContain('Anomalous invocation 2/2')
    expect(document.querySelector('.invocation-inspector')?.textContent).toContain('dispatch-b')
    await act(async () => {
      document.querySelector<HTMLButtonElement>('.invocation-inspector-close')?.click()
    })
    expect(document.querySelector('.invocation-inspector')).toBeNull()
    expect(document.querySelector('.invocation-layout')?.classList).not.toContain('has-inspector')
    await act(async () => {
      document.querySelector<HTMLButtonElement>('.run-outcome-action')?.click()
    })
    expect(document.querySelector('.invocation-inspector')?.textContent).toContain('dispatch-a')
    expect(document.querySelector('.invocation-inspector')?.textContent).toContain('worker-shared')

    await act(async () => {
      [...document.querySelectorAll<HTMLButtonElement>('.run-audit-switch button')]
        .find(button => button.textContent === 'Sequence')
        ?.click()
    })
    const sequenceRegion = document.querySelector('#run-view-sequence')
    expect(sequenceRegion?.getAttribute('role')).toBe('region')
    expect(sequenceRegion?.classList).toContain('run-audit-content')
    expect(document.querySelector('svg[role="group"][aria-labelledby="run-graph-title run-graph-summary"]')).not.toBeNull()
    const laneLabels = [...document.querySelectorAll('.run-graph-lane-label span')].map(element => element.textContent)
    expect(laneLabels).toEqual(['manager-parallel', 'dispatch-a', 'dispatch-b'])
    expect(document.querySelector('[data-node-key="dispatch:dispatch-a"] rect')?.getAttribute('x')).toBe('119')
    expect(document.querySelector('[data-node-key="dispatch:dispatch-b"] rect')?.getAttribute('x')).toBe('207')
    expect(document.querySelectorAll('.run-graph-edge')).toHaveLength(5)
    expect(document.querySelector('[data-node-key="event:event-worker-b"]')?.classList).toContain('is-anomaly')
    expect(document.querySelector('[data-node-key="receipt:receipt-a"]')).not.toBeNull()
    expect(document.querySelector('[data-node-key="dispatch:dispatch-a"]')?.getAttribute('role')).toBe('button')
    expect(document.querySelector('[data-node-key="dispatch:dispatch-b"]')?.getAttribute('aria-label')).toContain('dispatch lane dispatch-b')
    expect(document.querySelector('[data-node-key="dispatch:dispatch-b"] .run-graph-terminal')?.textContent).toBe('missing')
    expect(document.querySelector('[data-testid="run-graph-scroll"]')).not.toBeNull()

    expect(document.querySelector('.run-graph-inspector')?.textContent).toContain('dispatch-a')
    expect(document.querySelector('.timeline-item[data-node-key="dispatch:dispatch-a"]')?.classList).toContain('is-selected')

    const dispatchSelect = document.querySelector<HTMLSelectElement>('.run-graph-filters select')
    await act(async () => {
      dispatchSelect!.value = 'dispatch-a'
      dispatchSelect!.dispatchEvent(new Event('change', { bubbles: true }))
    })
    expect(document.querySelector('[data-node-key="dispatch:dispatch-a"]')?.classList).not.toContain('is-filtered')
    expect(document.querySelector('[data-node-key="dispatch:dispatch-b"]')?.classList).toContain('is-filtered')
    expect(document.querySelector('.timeline-item[data-node-key="dispatch:dispatch-b"]')?.classList).toContain('is-filtered')
    expect(document.querySelector('.timeline-item[data-node-key="dispatch:dispatch-b"]')?.textContent).toContain('terminal missing')

    await act(async () => {
      const node = document.querySelector<SVGGElement>('[data-node-key="event:event-worker-a"]')!
      node.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    })
    expect(document.querySelector('.timeline-item[data-node-key="event:event-worker-a"]')?.classList).toContain('is-selected')
    expect(document.body.textContent).toContain('Horizontal position follows committed sequence')

    await act(async () => {
      [...document.querySelectorAll<HTMLButtonElement>('.run-audit-switch button')]
        .find(button => button.textContent === 'Raw events')
        ?.click()
    })
    const rawRegion = document.querySelector('#run-view-raw')
    expect(rawRegion?.getAttribute('role')).toBe('region')
    expect(rawRegion?.classList).toContain('run-audit-content')
    expect(document.querySelectorAll('.raw-event')).toHaveLength(detail.run.timeline.length)
    expect(document.querySelector('.raw-events')?.textContent).toContain('event-worker-a')

    snapshot.managed = {
      ...snapshot.managed,
      runs: [
        ...snapshot.managed.runs,
        {
          ...snapshot.managed.runs[0]!,
          lookupId: 'run-lookup-2',
          runId: 'run-2',
          runKey: 'run-key-2',
          workRef: 'rsp-4-runtime/second-run',
        },
      ],
      runsSummary: { total: 2, returned: 2, hasMore: false },
    }
    await act(async () => {
      root?.render(<ObservatoryApp state={state} />)
    })
    expect(document.querySelector('.run-picker')).not.toBeNull()
    expect(document.querySelectorAll('.run-picker [data-run-id]')).toHaveLength(2)
  })

  it('builds nested invocation relationships without collapsing repeated workers or guessing absent parents', () => {
    const run = fixtureRunDetail().run
    run.dispatches[1] = {
      ...run.dispatches[1]!,
      parentRef: 'event-worker-a',
      parentDispatchId: 'dispatch-a',
      relationship: 'resolved',
      parentState: 'before',
    }
    const nested = buildInvocationTree(run)

    expect(nested.nodes.map(node => ({
      dispatchId: node.dispatchId,
      ordinal: node.workerOrdinal,
      roleOrdinal: node.roleOrdinal,
    }))).toEqual([
      { dispatchId: 'dispatch-a', ordinal: 1, roleOrdinal: 1 },
      { dispatchId: 'dispatch-b', ordinal: 2, roleOrdinal: 2 },
    ])
    expect(nested.roots.map(node => node.dispatchId)).toEqual(['dispatch-a'])
    expect(nested.roots[0]?.children.map(node => node.dispatchId)).toEqual(['dispatch-b'])

    run.dispatches[1] = {
      ...run.dispatches[1]!,
      parentDispatchId: 'dispatch-outside-bound',
      relationship: 'resolved',
    }
    const truncated = buildInvocationTree(run)
    expect(truncated.byDispatchId.get('dispatch-b')?.relationship).toBe('truncated')
    expect(truncated.roots.map(node => node.dispatchId)).toEqual(['dispatch-a', 'dispatch-b'])
  })

  it('retains exact worker lanes when a bounded projection omits the dispatch record', () => {
    const run = fixtureRunDetail().run
    const truncated = {
      ...run,
      dispatches: run.dispatches.filter(dispatch => dispatch.dispatchId !== 'dispatch-b'),
      truncated: true,
    }
    const model = buildRunGraphModel(truncated)
    const workerNode = model.nodes.find(node => node.key === 'event:event-worker-b')!

    expect(model.lanes.map(lane => lane.dispatchId)).toEqual([null, 'dispatch-a', 'dispatch-b'])
    expect(workerNode.laneId).toBe('dispatch:dispatch-b')
    expect(runGraphLaneY(model, workerNode.laneId)).toBeGreaterThan(runGraphLaneY(model, 'manager'))
  })
})

function fixtureSnapshot(): WebSnapshot {
  return {
    projection: { major: 1, minor: 1 },
    snapshotId: 'snapshot-react-lifecycle',
    generatedAt: '2026-08-10T00:00:00.000Z',
    source: {
      projectId,
      gitHead: 'abc123',
      gitBranch: 'main',
      dirty: false,
      identities: {
        overview: 'overview',
        specs: 'specs',
        history: 'history',
        managed: 'managed',
      },
    },
    overview: {
      current: {
        workRef: 'rsp-4-runtime/web-react-foundation',
        goal: 'React lifecycle',
        state: 'ready',
        blockers: [],
        nextAction: null,
      },
      summary: { open: 1, focused: 1, blocked: 0 },
      records: [],
      recordsSummary: { total: 0, returned: 0, hasMore: false },
      diagnostics: [],
      diagnosticSummary: { total: 0, returned: 0, hasMore: false },
    },
    specs: {
      documents: [{
        path: '.rsp/specs/runtime.md',
        kind: 'spec',
        title: 'Runtime',
        summary: 'Runtime contract',
        bytes: 100,
      }],
      summary: { total: 1, returned: 1, hasMore: false },
    },
    history: {
      records: [],
      summary: { total: 0, returned: 0, hasMore: false },
    },
    managed: {
      state: 'absent',
      available: false,
      authoritative: false,
      diagnostic: {
        code: 'runtime_absent',
        message: 'Runtime absent',
        action: null,
      },
      generatedAt: '2026-08-10T00:00:00.000Z',
      runs: [],
      runsSummary: { total: 0, returned: 0, hasMore: false },
      attention: [],
      attentionSummary: { total: 0, returned: 0, hasMore: false },
    },
  }
}

function fixtureRunDetail(): WebManagedRunDetailProjection {
  const eventSource = (id: string, sequence: number) => ({ type: 'event' as const, id, sequence })
  const dispatchSource = (id: string, sequence: number) => ({ type: 'dispatch' as const, id, sequence })
  const receiptSource = (id: string, sequence: number) => ({ type: 'receipt' as const, id, sequence })
  const events = [{
    eventId: 'event-start',
    sequence: 1,
    kind: 'manage-run-started',
    actorType: 'manager' as const,
    actorId: 'manager-parallel',
    dispatchId: null,
    phase: 'implementation',
    summary: 'Parallel work begins',
    evidenceRefs: [],
    sourceRefs: [],
    stopBoundary: null,
    parentRef: null,
    observedAt: '2026-08-10T01:00:00.000Z',
    parentState: 'none' as const,
    outOfOrder: false,
    deliveryCount: 1,
    duplicateCount: 0,
    conflictCount: 0,
    source: eventSource('event-start', 1),
  }, {
    eventId: 'event-worker-a',
    sequence: 4,
    kind: 'worker-progress',
    actorType: 'worker' as const,
    actorId: 'worker-shared',
    dispatchId: 'dispatch-a',
    phase: 'implementation',
    summary: 'Branch A progressed',
    evidenceRefs: [],
    sourceRefs: [],
    stopBoundary: null,
    parentRef: 'event-start',
    observedAt: '2026-08-10T01:00:04.000Z',
    parentState: 'before' as const,
    outOfOrder: false,
    deliveryCount: 1,
    duplicateCount: 0,
    conflictCount: 0,
    source: eventSource('event-worker-a', 4),
  }, {
    eventId: 'event-worker-b',
    sequence: 5,
    kind: 'worker-progress',
    actorType: 'worker' as const,
    actorId: 'worker-shared',
    dispatchId: 'dispatch-b',
    phase: 'implementation',
    summary: 'Branch B references a later parent',
    evidenceRefs: [],
    sourceRefs: [],
    stopBoundary: null,
    parentRef: 'event-late-parent',
    observedAt: '2026-08-10T01:00:05.000Z',
    parentState: 'after' as const,
    outOfOrder: true,
    deliveryCount: 1,
    duplicateCount: 1,
    conflictCount: 0,
    source: eventSource('event-worker-b', 5),
  }, {
    eventId: 'event-late-parent',
    sequence: 7,
    kind: 'manager-observed',
    actorType: 'manager' as const,
    actorId: 'manager-parallel',
    dispatchId: null,
    phase: 'verification',
    summary: 'Late parent observed',
    evidenceRefs: [],
    sourceRefs: [],
    stopBoundary: null,
    parentRef: 'missing-parent',
    observedAt: '2026-08-10T01:00:07.000Z',
    parentState: 'missing' as const,
    outOfOrder: true,
    deliveryCount: 1,
    duplicateCount: 0,
    conflictCount: 1,
    source: eventSource('event-late-parent', 7),
  }]
  const dispatches = [{
    dispatchId: 'dispatch-a',
    sequence: 2,
    lane: 'shared-label',
    workerId: 'worker-shared',
    workerDisplayName: 'silent-panda',
    workerRole: 'verification',
    parentRef: 'event-start',
    parentDispatchId: null,
    relationship: 'manager-root' as const,
    createdAt: '2026-08-10T01:00:02.000Z',
    parentState: 'before' as const,
    outOfOrder: false,
    objectiveRef: 'Parallel branch A',
    evidenceRefs: [],
    stopBoundary: 'same-scope',
    receiptState: 'received' as const,
    terminalState: 'safe' as const,
    receiptId: 'receipt-a',
    receiptResult: 'verified',
    deliveryCount: 1,
    duplicateCount: 0,
    conflictCount: 0,
    source: dispatchSource('dispatch-a', 2),
  }, {
    dispatchId: 'dispatch-b',
    sequence: 3,
    lane: 'shared-label',
    workerId: 'worker-shared',
    workerDisplayName: 'blue-otter',
    workerRole: 'verification',
    parentRef: 'event-start',
    parentDispatchId: null,
    relationship: 'manager-root' as const,
    createdAt: '2026-08-10T01:00:03.000Z',
    parentState: 'before' as const,
    outOfOrder: false,
    objectiveRef: 'Parallel branch B',
    evidenceRefs: [],
    stopBoundary: 'same-scope',
    receiptState: 'missing' as const,
    terminalState: 'missing' as const,
    receiptId: null,
    receiptResult: null,
    deliveryCount: 1,
    duplicateCount: 0,
    conflictCount: 0,
    source: dispatchSource('dispatch-b', 3),
  }]
  const receipt = {
    receiptId: 'receipt-a',
    eventId: 'event-receipt-a',
    sequence: 6,
    dispatchId: 'dispatch-a',
    actorId: 'worker-shared',
    result: 'verified',
    laneObjectiveRef: 'Parallel branch A',
    evidenceRefs: [],
    changedPaths: ['web/src/app.tsx'],
    verificationRefs: ['focused-browser-test'],
    stopBoundary: 'same-scope',
    parentRef: 'event-worker-a',
    observedAt: '2026-08-10T01:00:06.000Z',
    deliveryCount: 1,
    duplicateCount: 0,
    conflictCount: 0,
    source: receiptSource('receipt-a', 6),
  }
  const timeline = [
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
      createdAt: dispatch.createdAt,
      receiptState: dispatch.receiptState,
      terminalState: dispatch.terminalState,
      parentState: dispatch.parentState,
      outOfOrder: dispatch.outOfOrder,
      duplicateCount: dispatch.duplicateCount,
      conflictCount: dispatch.conflictCount,
      source: dispatch.source,
    })),
    {
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
      parentState: 'before' as const,
      outOfOrder: false,
      duplicateCount: 0,
      conflictCount: 0,
      source: receipt.source,
    },
  ].sort((left, right) => left.sequence - right.sequence)
  return {
    mode: 'run-detail',
    run: {
      available: true,
      authoritative: false,
      diagnostic: null,
      freshness: {
        projectId,
        workRef: 'rsp-4-runtime/parallel-run-visualization',
        sourceSequence: 7,
        generatedAt: '2026-08-10T01:00:08.000Z',
      },
      run: {
        runId: 'run-parallel',
        runKey: 'parallel-run',
        workRef: 'rsp-4-runtime/parallel-run-visualization',
        nextSequence: 8,
        createdAt: '2026-08-10T01:00:00.000Z',
        lastObservedAt: '2026-08-10T01:00:07.000Z',
      },
      status: 'observed',
      managerId: 'manager-parallel',
      phase: 'verification',
      authorityRefs: [],
      evidenceRefs: ['focused-browser-test'],
      terminalBoundary: null,
      terminalDeliveryObserved: false,
      actors: [{
        actorType: 'manager',
        actorId: 'manager-parallel',
        dispatchId: null,
        lane: null,
      }, ...dispatches.map(dispatch => ({
        actorType: 'worker' as const,
        actorId: dispatch.workerId,
        dispatchId: dispatch.dispatchId,
        lane: dispatch.lane,
      }))],
      dispatches,
      receipts: [receipt],
      events,
      timeline,
      truncated: false,
    },
    attention: [{
      kind: 'missing-receipt',
      summary: 'Dispatch dispatch-b has no committed receipt',
      dispatchId: 'dispatch-b',
      receiptId: null,
      sourceRefs: [dispatchSource('dispatch-b', 3)],
    }],
    freshness: {
      state: 'current',
      sourceSequence: 7,
      generatedAt: '2026-08-10T01:00:08.000Z',
      reasons: [],
    },
  }
}
