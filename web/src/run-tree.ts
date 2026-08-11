import type {
  ManageRuntimeProjectedDispatch,
  ManageRuntimeProjectedEvent,
  ManageRuntimeProjectedReceipt,
  ManageRuntimeRunProjection,
} from '../../src/runtime/manage.js'

export type InvocationTreeRelationship
  = ManageRuntimeProjectedDispatch['relationship']
    | 'truncated'

export interface InvocationTreeNode {
  dispatchId: string
  dispatch: ManageRuntimeProjectedDispatch
  parentDispatchId: string | null
  relationship: InvocationTreeRelationship
  workerOrdinal: number
  workerTotal: number
  roleOrdinal: number | null
  roleTotal: number | null
  callOrdinal: number
  events: ManageRuntimeProjectedEvent[]
  receipts: ManageRuntimeProjectedReceipt[]
  sequenceStart: number
  sequenceEnd: number
  anomalyCount: number
  children: InvocationTreeNode[]
}

export interface InvocationTreeModel {
  roots: InvocationTreeNode[]
  nodes: InvocationTreeNode[]
  byDispatchId: Map<string, InvocationTreeNode>
  summary: {
    invocations: number
    repeated: number
    nested: number
    anomalies: number
  }
}

export function buildInvocationTree(
  run: ManageRuntimeRunProjection,
): InvocationTreeModel {
  const dispatches = [...run.dispatches].sort(compareDispatch)
  const workerTotals = countBy(dispatches, dispatch => dispatch.workerId)
  const roleTotals = countBy(
    dispatches.filter(dispatch => dispatch.workerRole),
    dispatch => dispatch.workerRole!,
  )
  const workerOrdinals = new Map<string, number>()
  const roleOrdinals = new Map<string, number>()
  const byDispatchId = new Map<string, InvocationTreeNode>()

  for (const dispatch of dispatches) {
    const events = run.events
      .filter(event => event.dispatchId === dispatch.dispatchId)
      .sort(compareObservation)
    const receipts = run.receipts
      .filter(receipt => receipt.dispatchId === dispatch.dispatchId)
      .sort(compareObservation)
    const workerOrdinal = nextOrdinal(workerOrdinals, dispatch.workerId)
    const roleOrdinal = dispatch.workerRole
      ? nextOrdinal(roleOrdinals, dispatch.workerRole)
      : null
    const sequences = [
      dispatch.sequence,
      ...events.map(event => event.sequence),
      ...receipts.map(receipt => receipt.sequence),
    ]
    const relationship = normalizedRelationship(dispatch)
    byDispatchId.set(dispatch.dispatchId, {
      dispatchId: dispatch.dispatchId,
      dispatch,
      parentDispatchId: dispatch.parentDispatchId,
      relationship,
      workerOrdinal,
      workerTotal: workerTotals.get(dispatch.workerId) ?? 1,
      roleOrdinal,
      roleTotal: dispatch.workerRole ? roleTotals.get(dispatch.workerRole) ?? 1 : null,
      callOrdinal: roleOrdinal ?? workerOrdinal,
      events,
      receipts,
      sequenceStart: Math.min(...sequences),
      sequenceEnd: Math.max(...sequences),
      anomalyCount: invocationAnomalyCount(dispatch, events, receipts),
      children: [],
    })
  }

  const roots: InvocationTreeNode[] = []
  for (const node of byDispatchId.values()) {
    const parent = node.relationship === 'resolved' && node.parentDispatchId
      ? byDispatchId.get(node.parentDispatchId)
      : null
    if (parent) {
      parent.children.push(node)
      continue
    }
    if (node.relationship === 'resolved' && node.parentDispatchId)
      node.relationship = 'truncated'
    roots.push(node)
  }
  for (const node of byDispatchId.values())
    node.children.sort(compareNode)
  roots.sort(compareNode)

  const nodes = [...byDispatchId.values()].sort(compareNode)
  return {
    roots,
    nodes,
    byDispatchId,
    summary: {
      invocations: nodes.length,
      repeated: nodes.filter(node => node.workerTotal > 1 || (node.roleTotal ?? 0) > 1).length,
      nested: nodes.filter(node => node.relationship === 'resolved').length,
      anomalies: nodes.reduce((total, node) => total + node.anomalyCount, 0),
    },
  }
}

function normalizedRelationship(
  dispatch: ManageRuntimeProjectedDispatch,
): InvocationTreeRelationship {
  return dispatch.relationship ?? (
    dispatch.parentDispatchId
      ? 'resolved'
      : dispatch.parentRef
        ? dispatch.parentState === 'after'
          ? 'later'
          : dispatch.parentState === 'missing'
            ? 'missing'
            : 'unresolved'
        : 'root'
  )
}

function invocationAnomalyCount(
  dispatch: ManageRuntimeProjectedDispatch,
  events: ManageRuntimeProjectedEvent[],
  receipts: ManageRuntimeProjectedReceipt[],
): number {
  const relationshipAnomaly = ['missing', 'later', 'same-dispatch', 'unresolved', 'truncated']
    .includes(normalizedRelationship(dispatch))
    ? 1
    : 0
  return relationshipAnomaly
    + dispatch.duplicateCount
    + dispatch.conflictCount
    + events.reduce((total, event) =>
      total
      + (event.outOfOrder ? 1 : 0)
      + event.duplicateCount
      + event.conflictCount, 0)
    + receipts.reduce((total, receipt) =>
      total + receipt.duplicateCount + receipt.conflictCount, 0)
}

function countBy<T>(items: T[], key: (item: T) => string): Map<string, number> {
  const counts = new Map<string, number>()
  for (const item of items) {
    const identity = key(item)
    counts.set(identity, (counts.get(identity) ?? 0) + 1)
  }
  return counts
}

function nextOrdinal(counts: Map<string, number>, identity: string): number {
  const ordinal = (counts.get(identity) ?? 0) + 1
  counts.set(identity, ordinal)
  return ordinal
}

function compareDispatch(
  left: ManageRuntimeProjectedDispatch,
  right: ManageRuntimeProjectedDispatch,
): number {
  return left.sequence - right.sequence || left.dispatchId.localeCompare(right.dispatchId)
}

function compareObservation(
  left: { sequence: number, eventId?: string, receiptId?: string },
  right: { sequence: number, eventId?: string, receiptId?: string },
): number {
  const leftId = left.eventId ?? left.receiptId ?? ''
  const rightId = right.eventId ?? right.receiptId ?? ''
  return left.sequence - right.sequence || leftId.localeCompare(rightId)
}

function compareNode(left: InvocationTreeNode, right: InvocationTreeNode): number {
  return compareDispatch(left.dispatch, right.dispatch)
}
