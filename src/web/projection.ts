import type { ArchiveHistoryInspection } from '../history/model.js'
import type {
  ManageRuntimeAttentionItem,
  ManageRuntimeProjectProjection,
  ManageRuntimeRunProjection,
} from '../runtime/manage.js'
import type { SpecsInspection } from '../specs/model.js'
import type { ProjectStatusView } from '../status/model.js'
import type {
  WebHistoryDetailProjection,
  WebHistoryProjection,
  WebManagedAttentionItem,
  WebManagedFreshness,
  WebManagedProjection,
  WebManagedRunDetailProjection,
  WebOverviewProjection,
  WebSnapshot,
  WebSpecsDetailProjection,
  WebSpecsProjection,
  WebSpecsSearchProjection,
} from './model.js'
import type { WebRedactionContext } from './redaction.js'
import { createHash } from 'node:crypto'
import { historyInspectionComplete, queryArchiveHistory, readArchiveHistoryDetail, selectArchiveHistoryRecord } from '../history/query.js'
import {
  parseCurrentSpecsDocument,
  readCurrentSpecsDocument,
  searchSpecsWithSources,
  specsInspectionComplete,
  SpecsQueryError,
} from '../specs/query.js'
import {
  WEB_MAX_DIAGNOSTICS,
  WEB_MAX_HISTORY_RECORDS,
  WEB_MAX_MANAGED_ATTENTION,
  WEB_MAX_MANAGED_RUNS,
  WEB_MAX_MANAGED_TIMELINE,
  WEB_MAX_OVERVIEW_RECORDS,
  WEB_MAX_SPECS_DOCUMENTS,
  WEB_MAX_TEXT_CODE_POINTS,
  WEB_PROJECTION_VERSION,
} from './model.js'
import {
  boundWebText,
  boundWebTextItems,
  findPrivateKeyRanges,
  isWebSensitiveLine,
  mergeWebRedactionContexts,
  redactWebText,
} from './redaction.js'

export function projectWebOverview(
  view: ProjectStatusView,
  context: WebRedactionContext = {},
): WebOverviewProjection {
  const redactionContext = mergeWebRedactionContexts(context, {
    sensitiveUrls: collectProjectIssueUrls(view),
  })
  const recordsByName = new Map(view.records.map(record => [record.output.name, record]))
  const currentWorkRef = view.focused[0]
    ?? view.plan.ready[0]
    ?? view.records[0]?.output.name
    ?? null
  const currentRecord = currentWorkRef ? recordsByName.get(currentWorkRef) : undefined
  const currentNode = currentWorkRef
    ? view.plan.nodes.find(node => node.name === currentWorkRef)
    : undefined
  const currentBlocker = currentWorkRef
    ? view.plan.blocked.find(blocker => blocker.change === currentWorkRef)
    : undefined
  const blockers = [
    ...(currentRecord?.blockerEntries ?? []),
    ...(currentBlocker?.requires.map(required => `Requires ${required}`) ?? []),
    ...(currentBlocker?.external && (currentRecord?.blockerEntries.length ?? 0) === 0
      ? ['Change reports an active external blocker']
      : []),
  ]
  const projectedRecords = view.records.slice(0, WEB_MAX_OVERVIEW_RECORDS).map((record) => {
    const node = view.plan.nodes.find(candidate => candidate.name === record.output.name)
    return {
      workRef: record.output.name,
      goal: record.output.summary ? boundWebText(record.output.summary, 240, redactionContext) : null,
      kind: boundWebText(record.output.kind, 80, redactionContext),
      state: record.output.isFocused
        ? 'focused' as const
        : record.output.isBlocked
          ? 'blocked' as const
          : node?.state === 'ready'
            ? 'ready' as const
            : node?.state === 'waiting'
              ? 'waiting' as const
              : 'open' as const,
      progress: { ...record.output.progress },
    }
  })
  const diagnostics = view.diagnostics.slice(0, WEB_MAX_DIAGNOSTICS).map(diagnostic => ({
    severity: diagnostic.severity,
    code: boundWebText(diagnostic.code, 120, redactionContext),
    message: boundWebText(diagnostic.message, 500, redactionContext),
    ...(diagnostic.change ? { change: boundWebText(diagnostic.change, 200, redactionContext) } : {}),
    ...(safeProjectPath(diagnostic.path) ? { path: safeProjectPath(diagnostic.path) } : {}),
    ...(diagnostic.hint ? { hint: boundWebText(diagnostic.hint, 500, redactionContext) } : {}),
  }))
  return {
    current: {
      workRef: currentWorkRef,
      goal: currentRecord?.output.summary
        ? boundWebText(currentRecord.output.summary, WEB_MAX_TEXT_CODE_POINTS, redactionContext)
        : currentRecord?.title
          ? boundWebText(currentRecord.title, WEB_MAX_TEXT_CODE_POINTS, redactionContext)
          : null,
      state: currentRecord?.output.isFocused
        ? 'focused'
        : currentRecord?.output.isBlocked
          ? 'blocked'
          : currentNode?.state === 'ready'
            ? 'ready'
            : currentNode?.state === 'waiting'
              ? 'waiting'
              : currentRecord
                ? 'open'
                : 'empty',
      blockers: blockers.map(blocker => boundWebText(blocker, 500, redactionContext)).slice(0, 12),
      nextAction: view.nextActions[0] ? boundWebText(view.nextActions[0], 500, redactionContext) : null,
    },
    summary: {
      open: view.summary.total,
      focused: view.summary.focused,
      blocked: view.summary.blocked,
    },
    records: projectedRecords,
    recordsSummary: {
      total: view.records.length,
      returned: projectedRecords.length,
      hasMore: view.records.length > projectedRecords.length,
    },
    diagnostics,
    diagnosticSummary: {
      total: view.diagnostics.length,
      returned: diagnostics.length,
      hasMore: view.diagnostics.length > diagnostics.length,
    },
  }
}

export function collectProjectIssueUrls(view: ProjectStatusView): string[] {
  return [...new Set(view.records.flatMap(record => record.output.issues?.map(issue => issue.url) ?? []))].sort()
}

export function projectWebSpecs(
  inspection: SpecsInspection,
  context: WebRedactionContext = {},
): WebSpecsProjection {
  if (!specsInspectionComplete(inspection))
    throw new SpecsQueryError('specs_inspection_incomplete', 'Specs inspection is incomplete')
  const redactionContext = mergeWebRedactionContexts(context, {
    checkoutRoots: [inspection.source.root],
  })
  const documents = inspection.documents.slice(0, WEB_MAX_SPECS_DOCUMENTS).map(document => ({
    path: document.path,
    kind: document.kind,
    title: boundWebText(document.title, 300, redactionContext),
    summary: document.summary ? boundWebText(document.summary, 500, redactionContext) : null,
    bytes: document.bytes,
  }))
  return {
    documents,
    summary: {
      total: inspection.documents.length,
      returned: documents.length,
      hasMore: inspection.documents.length > documents.length,
    },
  }
}

export function projectWebHistory(
  inspection: ArchiveHistoryInspection,
  context: WebRedactionContext = {},
): WebHistoryProjection {
  if (!historyInspectionComplete(inspection))
    throw new Error('Archive history inspection is incomplete')
  const redactionContext = mergeWebRedactionContexts(context, {
    sensitiveUrls: collectHistoryIssueUrls(inspection),
  })
  const listed = queryArchiveHistory(inspection.records, { limit: WEB_MAX_HISTORY_RECORDS })
  return {
    records: listed.records.map(record => ({
      date: record.date,
      workRef: record.workRef,
      group: record.group,
      kind: boundWebText(record.kind, 80, redactionContext),
      summary: boundWebText(record.summary, 500, redactionContext),
      summaryTruncated: record.summaryTruncated,
    })),
    summary: {
      total: listed.summary.matched,
      returned: listed.summary.returned,
      hasMore: listed.summary.hasMore,
    },
  }
}

export function createWebSnapshot(input: {
  projectId: string
  generatedAt: string
  specsSource: SpecsInspection['source']
  overview: WebOverviewProjection
  specs: WebSpecsProjection
  history: WebHistoryProjection
  managed: WebManagedProjection
}): WebSnapshot {
  const identities = {
    overview: hashProjection(input.overview),
    specs: hashProjection(input.specs),
    history: hashProjection(input.history),
    managed: hashProjection(input.managed),
  }
  const snapshotCore = {
    projection: WEB_PROJECTION_VERSION,
    generatedAt: input.generatedAt,
    source: {
      projectId: input.projectId,
      gitHead: input.specsSource.gitHead,
      gitBranch: input.specsSource.gitBranch,
      dirty: input.specsSource.dirty,
      identities,
    },
    overview: input.overview,
    specs: input.specs,
    history: input.history,
    managed: input.managed,
  }
  return {
    ...snapshotCore,
    snapshotId: hashProjection(snapshotCore),
  }
}

export function projectWebManaged(
  projection: ManageRuntimeProjectProjection,
  freshnessByRun: ReadonlyMap<string, WebManagedFreshness>,
  context: WebRedactionContext = {},
): WebManagedProjection {
  const runs = projection.runs.slice(0, WEB_MAX_MANAGED_RUNS).map((run) => {
    const attention = attentionForRun(projection.attention, run)
    return {
      lookupId: managedRunLookupId(run.freshness.projectId, run.run?.runId ?? ''),
      runId: boundWebText(run.run?.runId ?? '', 200, context),
      runKey: boundWebText(run.run?.runKey ?? '', 200, context),
      workRef: boundWebText(run.run?.workRef ?? '', 300, context),
      status: run.status,
      phase: run.phase ? boundWebText(run.phase, 160, context) : null,
      managerId: run.managerId ? boundWebText(run.managerId, 160, context) : null,
      actors: run.actors.length,
      dispatches: run.dispatches.length,
      receipts: run.receipts.length,
      attention: attention.length,
      terminalDeliveryObserved: run.terminalDeliveryObserved,
      lastObservedAt: run.run?.lastObservedAt ?? run.freshness.generatedAt,
      freshness: freshnessByRun.get(run.run?.runId ?? '')
        ?? unavailableManagedFreshness(run.freshness.generatedAt, run.freshness.sourceSequence),
    }
  })
  const attention = projection.attention.slice(0, WEB_MAX_MANAGED_ATTENTION).map(item =>
    projectWebManagedAttention(item, projection.runs, context))
  return {
    state: projection.state,
    available: projection.available,
    authoritative: false,
    diagnostic: projection.diagnostic
      ? {
          code: boundWebText(projection.diagnostic.code, 160, context),
          message: boundWebText(projection.diagnostic.message, 600, context),
          action: projection.diagnostic.action
            ? boundWebText(projection.diagnostic.action, 600, context)
            : null,
        }
      : null,
    generatedAt: projection.generatedAt,
    runs,
    runsSummary: {
      total: projection.runs.length,
      returned: runs.length,
      hasMore: projection.runsTruncated || projection.runs.length > runs.length,
    },
    attention,
    attentionSummary: {
      total: projection.attention.length,
      returned: attention.length,
      hasMore: projection.attentionTruncated || projection.attention.length > attention.length,
    },
  }
}

export function projectWebManagedRunDetail(
  run: ManageRuntimeRunProjection,
  attention: ManageRuntimeAttentionItem[],
  freshness: WebManagedFreshness,
  context: WebRedactionContext = {},
): WebManagedRunDetailProjection {
  const safeRun: ManageRuntimeRunProjection = {
    ...run,
    freshness: {
      ...run.freshness,
      workRef: run.freshness.workRef
        ? boundWebText(run.freshness.workRef, 300, context)
        : null,
    },
    run: run.run
      ? {
          ...run.run,
          runId: boundWebText(run.run.runId, 200, context),
          runKey: boundWebText(run.run.runKey, 200, context),
          workRef: boundWebText(run.run.workRef, 300, context),
        }
      : null,
    diagnostic: run.diagnostic
      ? {
          code: boundWebText(run.diagnostic.code, 160, context),
          message: boundWebText(run.diagnostic.message, 600, context),
          action: run.diagnostic.action ? boundWebText(run.diagnostic.action, 600, context) : null,
        }
      : null,
    managerId: run.managerId ? boundWebText(run.managerId, 160, context) : null,
    phase: run.phase ? boundWebText(run.phase, 160, context) : null,
    authorityRefs: boundedManagedItems(run.authorityRefs, context),
    evidenceRefs: boundedManagedItems(run.evidenceRefs, context),
    terminalBoundary: run.terminalBoundary
      ? projectManagedSourceReference(run.terminalBoundary, context)
      : null,
    actors: run.actors.map(actor => ({
      ...actor,
      actorId: boundWebText(actor.actorId, 160, context),
      dispatchId: actor.dispatchId ? boundWebText(actor.dispatchId, 200, context) : null,
      lane: actor.lane ? boundWebText(actor.lane, 160, context) : null,
    })),
    dispatches: run.dispatches.map(dispatch => ({
      ...dispatch,
      dispatchId: boundWebText(dispatch.dispatchId, 200, context),
      lane: boundWebText(dispatch.lane, 160, context),
      workerId: boundWebText(dispatch.workerId, 160, context),
      objectiveRef: dispatch.objectiveRef ? boundWebText(dispatch.objectiveRef, 500, context) : null,
      evidenceRefs: boundedManagedItems(dispatch.evidenceRefs, context),
      stopBoundary: dispatch.stopBoundary ? boundWebText(dispatch.stopBoundary, 500, context) : null,
      receiptId: dispatch.receiptId ? boundWebText(dispatch.receiptId, 200, context) : null,
      receiptResult: dispatch.receiptResult ? boundWebText(dispatch.receiptResult, 160, context) : null,
      source: projectManagedSourceReference(dispatch.source, context),
    })),
    receipts: run.receipts.map(receipt => ({
      ...receipt,
      receiptId: boundWebText(receipt.receiptId, 200, context),
      eventId: boundWebText(receipt.eventId, 200, context),
      dispatchId: boundWebText(receipt.dispatchId, 200, context),
      actorId: boundWebText(receipt.actorId, 160, context),
      result: boundWebText(receipt.result, 160, context),
      laneObjectiveRef: receipt.laneObjectiveRef ? boundWebText(receipt.laneObjectiveRef, 500, context) : null,
      evidenceRefs: boundedManagedItems(receipt.evidenceRefs, context),
      changedPaths: receipt.changedPaths.map(path => safeProjectPath(path) ?? '[REDACTED]'),
      verificationRefs: boundedManagedItems(receipt.verificationRefs, context),
      stopBoundary: receipt.stopBoundary ? boundWebText(receipt.stopBoundary, 500, context) : null,
      source: projectManagedSourceReference(receipt.source, context),
    })),
    events: run.events.map(event => ({
      ...event,
      eventId: boundWebText(event.eventId, 200, context),
      actorId: boundWebText(event.actorId, 160, context),
      dispatchId: event.dispatchId ? boundWebText(event.dispatchId, 200, context) : null,
      phase: event.phase ? boundWebText(event.phase, 160, context) : null,
      summary: event.summary ? boundWebText(event.summary, 600, context) : null,
      evidenceRefs: boundedManagedItems(event.evidenceRefs, context),
      sourceRefs: boundedManagedItems(event.sourceRefs, context),
      stopBoundary: event.stopBoundary ? boundWebText(event.stopBoundary, 500, context) : null,
      source: projectManagedSourceReference(event.source, context),
    })),
    timeline: run.timeline.slice(0, WEB_MAX_MANAGED_TIMELINE).map(item => ({
      ...item,
      id: boundWebText(item.id, 200, context),
      actorId: boundWebText(item.actorId, 160, context),
      dispatchId: item.dispatchId ? boundWebText(item.dispatchId, 200, context) : null,
      kind: boundWebText(item.kind, 160, context),
      summary: item.summary ? boundWebText(item.summary, 600, context) : null,
      source: projectManagedSourceReference(item.source, context),
    })),
    truncated: run.truncated || run.timeline.length > WEB_MAX_MANAGED_TIMELINE,
  }
  return {
    mode: 'run-detail',
    run: safeRun,
    attention: attention.slice(0, WEB_MAX_MANAGED_ATTENTION).map(item => ({
      ...item,
      dispatchId: item.dispatchId ? boundWebText(item.dispatchId, 200, context) : null,
      receiptId: item.receiptId ? boundWebText(item.receiptId, 200, context) : null,
      summary: boundWebText(item.summary, 600, context),
      sourceRefs: item.sourceRefs.map(ref => projectManagedSourceReference(ref, context)),
    })),
    freshness,
  }
}

export function managedRunLookupId(projectId: string, runId: string): string {
  return createHash('sha256')
    .update(projectId)
    .update('\0')
    .update(runId)
    .digest('hex')
}

function projectWebManagedAttention(
  item: ManageRuntimeAttentionItem,
  runs: ManageRuntimeRunProjection[],
  context: WebRedactionContext,
): WebManagedAttentionItem {
  const matchedRun = runs.find(run =>
    item.sourceRefs.some(ref => ref.type === 'run'
      ? ref.id === run.run?.runId
      : run.run?.runId && (
        run.dispatches.some(dispatch => ref.type === 'dispatch' && dispatch.dispatchId === ref.id)
        || run.receipts.some(receipt => ref.type === 'receipt' && receipt.receiptId === ref.id)
        || run.events.some(event => ref.type === 'event' && event.eventId === ref.id)
      )))?.run?.runId ?? null
  return {
    ...item,
    runId: matchedRun ? boundWebText(matchedRun, 200, context) : null,
    runLookupId: matchedRun
      ? managedRunLookupId(
          runs.find(run => run.run?.runId === matchedRun)!.freshness.projectId,
          matchedRun,
        )
      : null,
    dispatchId: item.dispatchId ? boundWebText(item.dispatchId, 200, context) : null,
    receiptId: item.receiptId ? boundWebText(item.receiptId, 200, context) : null,
    summary: boundWebText(item.summary, 600, context),
    sourceRefs: item.sourceRefs.map(ref => projectManagedSourceReference(ref, context)),
  }
}

function attentionForRun(
  attention: ManageRuntimeAttentionItem[],
  run: ManageRuntimeRunProjection,
): ManageRuntimeAttentionItem[] {
  if (!run.run)
    return []
  return attention.filter(item => item.sourceRefs.some(ref =>
    (ref.type === 'run' && ref.id === run.run?.runId)
    || run.dispatches.some(dispatch => ref.type === 'dispatch' && ref.id === dispatch.dispatchId)
    || run.receipts.some(receipt => ref.type === 'receipt' && ref.id === receipt.receiptId)
    || run.events.some(event => ref.type === 'event' && ref.id === event.eventId)))
}

function boundedManagedItems(items: string[], context: WebRedactionContext): string[] {
  return boundWebTextItems(items.slice(0, 32), 500, context)
}

function projectManagedSourceReference(
  reference: ManageRuntimeAttentionItem['sourceRefs'][number],
  context: WebRedactionContext,
): ManageRuntimeAttentionItem['sourceRefs'][number] {
  return {
    ...reference,
    id: boundWebText(reference.id, 200, context),
  }
}

function unavailableManagedFreshness(
  generatedAt: string,
  sourceSequence: number,
): WebManagedFreshness {
  return {
    state: 'unavailable',
    sourceSequence,
    generatedAt,
    reasons: ['Current repository relationship was not inspected'],
  }
}

export async function projectWebSpecsDetail(
  inspection: SpecsInspection,
  path: string,
  projectId: string,
  context: WebRedactionContext = {},
): Promise<WebSpecsDetailProjection> {
  assertCompleteSpecsInspection(inspection)
  const current = await readCurrentSpecsDocument(inspection, path)
  const redactionContext = mergeWebRedactionContexts(context, {
    checkoutRoots: [inspection.source.root],
  })
  const sourceContent = current.content.replace(/\0/gu, '')
  const safeContent = redactWebText(sourceContent, redactionContext)
  const safeDocument = parseCurrentSpecsDocument(
    safeContent,
    current.bytes,
    current.path,
    current.kind,
  )
  const contentLimit = inspection.limits.detailContentCodePoints
  const contentTruncated = [...sourceContent].length > contentLimit
    || [...safeContent].length > contentLimit
  const document = {
    path: safeDocument.path,
    kind: safeDocument.kind,
    title: boundWebText(safeDocument.title, 300, redactionContext),
    summary: safeDocument.summary ? boundWebText(safeDocument.summary, 500, redactionContext) : null,
    bytes: safeDocument.bytes,
    content: boundWebText(safeContent, contentLimit, redactionContext),
    contentTruncated,
  }
  return {
    mode: 'detail',
    source: detailSource(projectId, inspection.source, hashProjection(document)),
    document,
  }
}

export async function projectWebSpecsSearch(
  inspection: SpecsInspection,
  literal: string,
  limit: number,
  projectId: string,
  context: WebRedactionContext = {},
): Promise<WebSpecsSearchProjection> {
  assertCompleteSpecsInspection(inspection)
  const searched = await searchSpecsWithSources(inspection, literal, {
    limit,
    excerptCodePoints: 240,
  })
  const redactionContext = mergeWebRedactionContexts(context, {
    checkoutRoots: [inspection.source.root],
  })
  const safeDocuments = new Map<string, ReturnType<typeof parseCurrentSpecsDocument>>()
  const rangesByPath = new Map<string, ReturnType<typeof findPrivateKeyRanges>>()
  const matches = searched.result.matches.map((match) => {
    const current = searched.documents.get(match.path)
    if (!current)
      throw new SpecsQueryError('specs_document_changed', 'Specs search source changed during projection')
    let ranges = rangesByPath.get(match.path)
    if (!ranges) {
      ranges = findPrivateKeyRanges(current.content)
      rangesByPath.set(match.path, ranges)
    }
    let safeDocument = safeDocuments.get(match.path)
    if (!safeDocument) {
      const safeContent = redactWebText(current.content.replace(/\0/gu, ''), redactionContext)
      safeDocument = parseCurrentSpecsDocument(
        safeContent,
        current.bytes,
        current.path,
        current.kind,
      )
      safeDocuments.set(match.path, safeDocument)
    }
    const headingLine = activeHeadingLine(current.content, match.line)
    const sensitiveMatch = isWebSensitiveLine(ranges, match.line)
    const sensitiveHeading = headingLine !== null && isWebSensitiveLine(ranges, headingLine)
    return {
      path: match.path,
      kind: match.kind,
      title: boundWebText(safeDocument.title, 300, redactionContext),
      heading: match.heading && !sensitiveHeading
        ? boundWebText(match.heading, 300, redactionContext)
        : null,
      line: match.line,
      excerpt: sensitiveMatch
        ? '[REDACTED]'
        : boundWebText(match.excerpt, 500, redactionContext),
    }
  })
  return {
    mode: 'search',
    source: detailSource(projectId, inspection.source, hashProjection(matches)),
    query: {
      literal: boundWebText(literal, 200, redactionContext),
      limit,
    },
    matches,
    summary: searched.result.summary,
  }
}

export async function projectWebHistoryDetail(
  inspection: ArchiveHistoryInspection,
  workRef: string,
  context: WebRedactionContext = {},
): Promise<WebHistoryDetailProjection> {
  if (!historyInspectionComplete(inspection))
    throw new Error('Archive history inspection is incomplete')
  const selected = selectArchiveHistoryRecord(inspection.records, { workRef })
  const record = await readArchiveHistoryDetail(selected)
  const redactionContext = mergeWebRedactionContexts(context, {
    sensitiveUrls: collectHistoryIssueUrls(inspection),
  })
  return {
    mode: 'detail',
    record: {
      date: record.date,
      workRef: record.workRef,
      group: record.group,
      kind: boundWebText(record.kind, 80, redactionContext),
      summary: boundWebText(record.summary, 500, redactionContext),
      summaryTruncated: record.summaryTruncated,
      scenarioCount: record.scenarioCount,
      checkboxes: record.checkboxes,
      evidence: {
        tasks: redactEvidence(record.evidence.tasks, redactionContext),
        verify: redactEvidence(record.evidence.verify, redactionContext),
        blockers: redactEvidence(record.evidence.blockers, redactionContext),
      },
    },
  }
}

function detailSource(
  projectId: string,
  source: SpecsInspection['source'],
  identity: string,
): WebSnapshot['source'] {
  return {
    projectId,
    gitHead: source.gitHead,
    gitBranch: source.gitBranch,
    dirty: source.dirty,
    identities: {
      overview: identity,
      specs: identity,
      history: identity,
      managed: identity,
    },
  }
}

function redactEvidence(
  evidence: { items: string[], truncated: boolean },
  context: WebRedactionContext,
) {
  return {
    items: boundWebTextItems(evidence.items, 500, context),
    truncated: evidence.truncated,
  }
}

function collectHistoryIssueUrls(inspection: ArchiveHistoryInspection): string[] {
  return [...new Set(inspection.records.flatMap(record => record.issues?.map(issue => issue.url) ?? []))].sort()
}

function assertCompleteSpecsInspection(inspection: SpecsInspection): void {
  if (!specsInspectionComplete(inspection))
    throw new SpecsQueryError('specs_inspection_incomplete', 'Specs inspection is incomplete')
}

function activeHeadingLine(content: string, matchLine: number): number | null {
  const lines = content.split(/\r?\n/)
  let headingLine: number | null = null
  for (let index = 0; index < Math.min(matchLine, lines.length); index++) {
    if (/^#{1,6}\s+\S/u.test(lines[index]))
      headingLine = index + 1
  }
  return headingLine
}

function hashProjection(value: unknown): string {
  return createHash('sha256').update(JSON.stringify(value)).digest('hex')
}

function safeProjectPath(path: string | undefined): string | undefined {
  if (!path)
    return undefined
  if (path.includes('\\'))
    return undefined
  const normalized = path.replace(/\\/gu, '/')
  const segments = normalized.split('/')
  if (!normalized.startsWith('/')
    && !/^[A-Za-z]:\//u.test(normalized)
    && segments.every(segment => segment !== '' && segment !== '.' && segment !== '..')) {
    return normalized
  }
  const marker = normalized.indexOf('/.rsp/')
  if (normalized.startsWith('.rsp/'))
    return normalized
  if (marker >= 0)
    return normalized.slice(marker + 1)
  return undefined
}
