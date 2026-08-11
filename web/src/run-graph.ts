import type { ManageRuntimeRunProjection } from '../../src/runtime/manage.js'

export type RunGraphNodeType = 'dispatch' | 'event' | 'receipt'

export interface RunGraphLane {
  id: string
  label: string
  dispatchId: string | null
}

export interface RunGraphNode {
  key: string
  type: RunGraphNodeType
  id: string
  sequence: number
  laneId: string
  actorId: string
  dispatchId: string | null
  kind: string
  summary: string | null
  parentRef: string | null
  parentState: 'none' | 'missing' | 'before' | 'after' | null
  outOfOrder: boolean
  timestamp: string | null
  duplicateCount: number
  conflictCount: number
  terminalState: string | null
}

export interface RunGraphEdge {
  key: string
  sourceKey: string
  targetKey: string
  state: 'before' | 'after'
}

export interface RunGraphModel {
  lanes: RunGraphLane[]
  nodes: RunGraphNode[]
  edges: RunGraphEdge[]
  maxSequence: number
  width: number
  height: number
  summary: {
    dispatches: number
    events: number
    receipts: number
    anomalies: number
  }
}

export const RUN_GRAPH_LABEL_WIDTH = 144
export const RUN_GRAPH_LANE_HEIGHT = 76
export const RUN_GRAPH_SEQUENCE_WIDTH = 88
export const RUN_GRAPH_PLOT_PADDING = 44

export function buildRunGraphModel(run: ManageRuntimeRunProjection): RunGraphModel {
  const dispatches = [...run.dispatches].sort((left, right) =>
    left.sequence - right.sequence || left.dispatchId.localeCompare(right.dispatchId))
  const dispatchSequence = new Map(dispatches.map(dispatch => [dispatch.dispatchId, dispatch.sequence]))
  for (const event of run.events) {
    if (event.dispatchId && !dispatchSequence.has(event.dispatchId))
      dispatchSequence.set(event.dispatchId, event.sequence)
  }
  for (const receipt of run.receipts) {
    const current = dispatchSequence.get(receipt.dispatchId)
    if (current === undefined || receipt.sequence < current)
      dispatchSequence.set(receipt.dispatchId, receipt.sequence)
  }
  const retainedDispatchIds = [...dispatchSequence]
    .sort((left, right) => left[1] - right[1] || left[0].localeCompare(right[0]))
    .map(([dispatchId]) => dispatchId)
  const lanes: RunGraphLane[] = [
    {
      id: 'manager',
      label: run.managerId || 'manager',
      dispatchId: null,
    },
    ...retainedDispatchIds.map(dispatchId => ({
      id: dispatchLaneId(dispatchId),
      label: dispatchId,
      dispatchId,
    })),
  ]
  const nodes: RunGraphNode[] = [
    ...dispatches.map(dispatch => ({
      key: nodeKey('dispatch', dispatch.dispatchId),
      type: 'dispatch' as const,
      id: dispatch.dispatchId,
      sequence: dispatch.sequence,
      laneId: dispatchLaneId(dispatch.dispatchId),
      actorId: dispatch.workerId,
      dispatchId: dispatch.dispatchId,
      kind: 'dispatch-observed',
      summary: dispatch.objectiveRef,
      parentRef: dispatch.parentRef ?? null,
      parentState: dispatch.parentState,
      outOfOrder: dispatch.outOfOrder,
      timestamp: dispatch.createdAt ?? null,
      duplicateCount: dispatch.duplicateCount,
      conflictCount: dispatch.conflictCount,
      terminalState: dispatch.terminalState,
    })),
    ...run.events.map(event => ({
      key: nodeKey('event', event.eventId),
      type: 'event' as const,
      id: event.eventId,
      sequence: event.sequence,
      laneId: event.dispatchId ? dispatchLaneId(event.dispatchId) : 'manager',
      actorId: event.actorId,
      dispatchId: event.dispatchId,
      kind: event.kind,
      summary: event.summary,
      parentRef: event.parentRef ?? null,
      parentState: event.parentState,
      outOfOrder: event.outOfOrder,
      timestamp: event.observedAt ?? null,
      duplicateCount: event.duplicateCount,
      conflictCount: event.conflictCount,
      terminalState: null,
    })),
    ...run.receipts.map(receipt => ({
      key: nodeKey('receipt', receipt.receiptId),
      type: 'receipt' as const,
      id: receipt.receiptId,
      sequence: receipt.sequence,
      laneId: dispatchLaneId(receipt.dispatchId),
      actorId: receipt.actorId,
      dispatchId: receipt.dispatchId,
      kind: 'worker-receipt',
      summary: receipt.result,
      parentRef: receipt.parentRef ?? null,
      parentState: receipt.parentRef ? parentStateFor(run, receipt.parentRef, receipt.sequence) : null,
      outOfOrder: receipt.parentRef
        ? (
            parentStateFor(run, receipt.parentRef, receipt.sequence) === 'missing'
            || parentStateFor(run, receipt.parentRef, receipt.sequence) === 'after'
          )
        : false,
      timestamp: receipt.observedAt ?? null,
      duplicateCount: receipt.duplicateCount,
      conflictCount: receipt.conflictCount,
      terminalState: receipt.result,
    })),
  ].sort((left, right) =>
    left.sequence - right.sequence
    || nodeTypeRank(left.type) - nodeTypeRank(right.type)
    || left.id.localeCompare(right.id))
  const eventsById = new Map(
    nodes
      .filter((node): node is RunGraphNode & { type: 'event' } => node.type === 'event')
      .map(node => [node.id, node]),
  )
  const edges = nodes.flatMap((node): RunGraphEdge[] => {
    if (!node.parentRef)
      return []
    const parent = eventsById.get(node.parentRef)
    if (!parent)
      return []
    return [{
      key: `${parent.key}->${node.key}`,
      sourceKey: parent.key,
      targetKey: node.key,
      state: parent.sequence < node.sequence ? 'before' : 'after',
    }]
  })
  const maxSequence = Math.max(1, ...nodes.map(node => node.sequence))
  return {
    lanes,
    nodes,
    edges,
    maxSequence,
    width: Math.max(720, RUN_GRAPH_PLOT_PADDING * 2 + maxSequence * RUN_GRAPH_SEQUENCE_WIDTH),
    height: Math.max(RUN_GRAPH_LANE_HEIGHT, lanes.length * RUN_GRAPH_LANE_HEIGHT),
    summary: {
      dispatches: dispatches.length,
      events: run.events.length,
      receipts: run.receipts.length,
      anomalies: nodes.filter(node => node.parentState === 'missing' || node.parentState === 'after').length,
    },
  }
}

export function runGraphNodeX(sequence: number): number {
  return RUN_GRAPH_PLOT_PADDING + (sequence - 1) * RUN_GRAPH_SEQUENCE_WIDTH
}

export function runGraphLaneY(model: RunGraphModel, laneId: string): number {
  const index = model.lanes.findIndex(lane => lane.id === laneId)
  if (index < 0)
    throw new Error(`Run graph node references missing lane ${laneId}`)
  return index * RUN_GRAPH_LANE_HEIGHT + RUN_GRAPH_LANE_HEIGHT / 2
}

export function nodeKey(type: RunGraphNodeType, id: string): string {
  return `${type}:${id}`
}

function dispatchLaneId(dispatchId: string): string {
  return `dispatch:${dispatchId}`
}

function nodeTypeRank(type: RunGraphNodeType): number {
  return { dispatch: 0, event: 1, receipt: 2 }[type]
}

function parentStateFor(
  run: ManageRuntimeRunProjection,
  parentRef: string,
  sequence: number,
): 'missing' | 'before' | 'after' {
  const parent = run.events.find(event => event.eventId === parentRef)
  if (!parent)
    return 'missing'
  return parent.sequence < sequence ? 'before' : 'after'
}
