import type { BrokerProjectIdentity } from '../broker/protocol.js'
import type { ArchiveHistoryInspection } from '../history/model.js'
import type { ManageRuntimeProjectProjection } from '../runtime/manage.js'
import type {
  WebHistoryDetailProjection,
  WebManagedFreshness,
  WebManagedProjection,
  WebManagedRunDetailProjection,
  WebProjector,
  WebSnapshot,
  WebSpecsDetailProjection,
  WebSpecsSearchProjection,
} from './model.js'
import type { WebRedactionContext } from './redaction.js'
import { join } from 'node:path'
import { lstatBrokerProjectPath } from '../broker/project.js'
import { BrokerError } from '../broker/protocol.js'
import { ARCHIVES_DIR } from '../core/config.js'
import { historyInspectionComplete, inspectArchiveHistory } from '../history/query.js'
import { inspectSpecs, specsInspectionComplete } from '../specs/query.js'
import {
  createWebSnapshot,
  managedRunLookupId,
  projectWebHistory,
  projectWebHistoryDetail,
  projectWebManaged,
  projectWebManagedRunDetail,
  projectWebSpecs,
  projectWebSpecsDetail,
  projectWebSpecsSearch,
} from './projection.js'

export interface WebProjectionService {
  snapshot: (project: BrokerProjectIdentity, managed: ManageRuntimeProjectProjection) => Promise<WebSnapshot>
  specsDetail: (project: BrokerProjectIdentity, path: string) => Promise<WebSpecsDetailProjection>
  specsSearch: (project: BrokerProjectIdentity, literal: string, limit: number) => Promise<WebSpecsSearchProjection>
  historyDetail: (project: BrokerProjectIdentity, lookupId: string) => Promise<WebHistoryDetailProjection>
  runDetail: (
    project: BrokerProjectIdentity,
    managed: ManageRuntimeProjectProjection,
    runId: string,
  ) => Promise<WebManagedRunDetailProjection>
  managed: (
    project: BrokerProjectIdentity,
    managed: ManageRuntimeProjectProjection,
  ) => Promise<WebManagedProjection>
}

export function createWebProjectionService(
  projector: WebProjector,
  now: () => number = Date.now,
): WebProjectionService {
  return {
    async snapshot(project, managed) {
      try {
        const [overviewResult, specsInspection, historyInspection] = await Promise.all([
          projector.overview(project.root),
          inspectSpecs({ cwd: project.root }),
          inspectArchiveHistory({ archivesDir: join(project.root, ARCHIVES_DIR) }),
        ])
        if (!specsInspectionComplete(specsInspection))
          throw new BrokerError('web_specs_unavailable', 'Specs inspection is incomplete')
        if (!historyInspectionComplete(historyInspection))
          throw new BrokerError('web_history_unavailable', 'Archive history inspection is incomplete')
        const redactionContext = projectRedactionContext(project, overviewResult.sensitiveUrls, historyInspection)
        const freshness = await managedFreshness(project, overviewResult.openWorkRefs, managed)
        return createWebSnapshot({
          projectId: project.projectId,
          generatedAt: new Date(now()).toISOString(),
          specsSource: specsInspection.source,
          overview: overviewResult.projection,
          specs: projectWebSpecs(specsInspection, redactionContext),
          history: projectWebHistory(historyInspection, redactionContext),
          managed: projectWebManaged(managed, freshness, redactionContext),
        })
      }
      catch (error) {
        throw asWebProjectionError(error)
      }
    },

    async specsDetail(project, path) {
      try {
        const [inspection, overviewResult, historyInspection] = await Promise.all([
          inspectSpecs({ cwd: project.root }),
          projector.overview(project.root),
          inspectArchiveHistory({ archivesDir: join(project.root, ARCHIVES_DIR) }),
        ])
        if (!historyInspectionComplete(historyInspection))
          throw new BrokerError('web_history_unavailable', 'Archive history inspection is incomplete')
        return await projectWebSpecsDetail(
          inspection,
          path,
          project.projectId,
          projectRedactionContext(project, overviewResult.sensitiveUrls, historyInspection),
        )
      }
      catch (error) {
        throw asWebProjectionError(error)
      }
    },

    async specsSearch(project, literal, limit) {
      try {
        const [inspection, overviewResult, historyInspection] = await Promise.all([
          inspectSpecs({ cwd: project.root }),
          projector.overview(project.root),
          inspectArchiveHistory({ archivesDir: join(project.root, ARCHIVES_DIR) }),
        ])
        if (!historyInspectionComplete(historyInspection))
          throw new BrokerError('web_history_unavailable', 'Archive history inspection is incomplete')
        return await projectWebSpecsSearch(
          inspection,
          literal,
          limit,
          project.projectId,
          projectRedactionContext(project, overviewResult.sensitiveUrls, historyInspection),
        )
      }
      catch (error) {
        throw asWebProjectionError(error)
      }
    },

    async historyDetail(project, lookupId) {
      try {
        const [inspection, overviewResult] = await Promise.all([
          inspectArchiveHistory({
            archivesDir: join(project.root, ARCHIVES_DIR),
          }),
          projector.overview(project.root),
        ])
        if (!historyInspectionComplete(inspection))
          throw new BrokerError('web_history_unavailable', 'Archive history inspection is incomplete')
        return await projectWebHistoryDetail(
          inspection,
          lookupId,
          projectRedactionContext(project, overviewResult.sensitiveUrls, inspection),
        )
      }
      catch (error) {
        throw asWebProjectionError(error)
      }
    },

    async runDetail(project, managed, runId) {
      try {
        const [overviewResult, historyInspection] = await Promise.all([
          projector.overview(project.root),
          inspectArchiveHistory({ archivesDir: join(project.root, ARCHIVES_DIR) }),
        ])
        if (!historyInspectionComplete(historyInspection))
          throw new BrokerError('web_history_unavailable', 'Archive history inspection is incomplete')
        const run = managed.runs.find(candidate =>
          candidate.run
          && managedRunLookupId(project.projectId, candidate.run.runId) === runId)
        if (!run)
          throw new BrokerError('web_managed_run_not_found', 'Managed run was not found in the bounded runtime projection')
        const rawRunId = run.run!.runId
        const attention = managed.attention.filter(item =>
          item.sourceRefs.some(ref => ref.type === 'run' && ref.id === rawRunId)
          || item.sourceRefs.some(ref =>
            run.dispatches.some(dispatch =>
              ref.type === 'dispatch' && dispatch.dispatchId === ref.id)
            || run.receipts.some(receipt =>
              ref.type === 'receipt' && receipt.receiptId === ref.id)
            || run.events.some(event =>
              ref.type === 'event' && event.eventId === ref.id)))
        return projectWebManagedRunDetail(
          run,
          attention,
          (await managedFreshness(project, overviewResult.openWorkRefs, managed)).get(rawRunId)!,
          projectRedactionContext(project, overviewResult.sensitiveUrls, historyInspection),
        )
      }
      catch (error) {
        throw asWebProjectionError(error)
      }
    },

    async managed(project, managed) {
      try {
        const [overviewResult, historyInspection] = await Promise.all([
          projector.overview(project.root),
          inspectArchiveHistory({ archivesDir: join(project.root, ARCHIVES_DIR) }),
        ])
        if (!historyInspectionComplete(historyInspection))
          throw new BrokerError('web_history_unavailable', 'Archive history inspection is incomplete')
        return projectWebManaged(
          managed,
          await managedFreshness(project, overviewResult.openWorkRefs, managed),
          projectRedactionContext(project, overviewResult.sensitiveUrls, historyInspection),
        )
      }
      catch (error) {
        throw asWebProjectionError(error)
      }
    },
  }
}

async function managedFreshness(
  project: BrokerProjectIdentity,
  openWorkRefs: Awaited<ReturnType<WebProjector['overview']>>['openWorkRefs'],
  managed: ManageRuntimeProjectProjection,
): Promise<Map<string, WebManagedFreshness>> {
  const current = new Set(openWorkRefs)
  const entries = await Promise.all(managed.runs.flatMap(async (run) => {
    if (!run.run)
      return []
    const reasons: string[] = []
    if (run.freshness.projectId !== project.projectId)
      reasons.push('Run project identity does not match the current checkout')
    if (run.freshness.sourceSequence !== run.run.nextSequence - 1)
      reasons.push('Run source sequence does not match the retained runtime revision')
    if (!current.has(run.run.workRef))
      reasons.push('Run WorkRef is not present in the current open project projection')
    const references = [
      ...run.authorityRefs,
      ...run.receipts.flatMap(receipt => receipt.changedPaths),
    ]
    let unavailable = 0
    let unsafe = 0
    await Promise.all(references.map(async (reference) => {
      if (!safeRelativeReference(reference)) {
        unsafe += 1
        return
      }
      try {
        await lstatBrokerProjectPath(project, reference)
      }
      catch {
        unavailable += 1
      }
    }))
    if (unsafe > 0)
      reasons.push(`${unsafe} repository reference(s) are outside project-relative bounds`)
    if (unavailable > 0)
      reasons.push(`${unavailable} repository reference(s) are unavailable in the current checkout`)
    return [[run.run.runId, {
      state: reasons.length === 0 ? 'current' as const : 'stale' as const,
      sourceSequence: run.freshness.sourceSequence,
      generatedAt: run.freshness.generatedAt,
      reasons,
    }] satisfies [string, WebManagedFreshness]]
  }))
  return new Map(entries.flat())
}

function safeRelativeReference(reference: string): boolean {
  if (!reference
    || reference.startsWith('/')
    || /^[A-Za-z]:\//u.test(reference)
    || reference.includes('\\')) {
    return false
  }
  return reference.split('/').every(segment => segment !== '' && segment !== '.' && segment !== '..')
}

function projectRedactionContext(
  project: BrokerProjectIdentity,
  openIssueUrls: string[],
  historyInspection: ArchiveHistoryInspection,
): WebRedactionContext {
  return {
    checkoutRoots: [project.root],
    sensitiveUrls: [
      ...openIssueUrls,
      ...historyInspection.records.flatMap(record => record.issues?.map(issue => issue.url) ?? []),
    ],
  }
}

function asWebProjectionError(error: unknown): BrokerError {
  if (error instanceof BrokerError)
    return error
  const code = isErrorWithCode(error) ? error.code : 'web_projection_failed'
  if (code.startsWith('specs_'))
    return new BrokerError(code, 'Unable to derive the requested Specs projection')
  if (code.startsWith('archive_') || code.startsWith('history_'))
    return new BrokerError(code, 'Unable to derive the requested history projection')
  return new BrokerError('web_projection_failed', 'Unable to derive the requested Web projection')
}

function isErrorWithCode(error: unknown): error is Error & { code: string } {
  return error instanceof Error && 'code' in error && typeof error.code === 'string'
}
