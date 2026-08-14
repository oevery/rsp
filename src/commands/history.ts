import type { BoundedCollectionSummary } from '../history/model.js'
import type { ArchiveHistoryQuery } from '../history/query.js'
import type { CommandDiagnostic, HistoryDetailOutput, HistoryRecordOutput, RuntimeDiagnostic } from '../types.js'

import { guardRspInitialized } from '../core/filesystem.js'
import { normalizeExecutableWorkRef, normalizeWorkRefSegment } from '../core/work-ref.js'
import { ArchiveHistoryError, HISTORY_DEFAULT_LIMIT, HISTORY_MAX_LIMIT, historyInspectionComplete, inspectArchiveHistory, queryArchiveHistory, readArchiveHistoryDetail, selectArchiveHistoryRecord } from '../history/query.js'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export interface HistoryCliQuery {
  workRef?: string
  limit?: string
  since?: string
  until?: string
  kind?: string
  group?: string
  search?: string
  positionalCount?: number
}

export interface HistoryListResult {
  command: 'history'
  ok: true
  mode: 'list'
  query: Required<Pick<ArchiveHistoryQuery, 'limit'>> & { since: string | null, until: string | null, kind: string | null, group: string | null, search: string | null }
  records: HistoryRecordOutput[]
  summary: { matched: number, returned: number, hasMore: boolean }
  diagnostics: CommandDiagnostic[]
  diagnosticSummary: BoundedCollectionSummary
  runtime: RuntimeDiagnostic[]
}

export interface HistoryDetailResult {
  command: 'history'
  ok: true
  mode: 'detail'
  query: { workRef: string }
  record: HistoryDetailOutput
  diagnostics: CommandDiagnostic[]
  diagnosticSummary: BoundedCollectionSummary
  runtime: RuntimeDiagnostic[]
}

export interface HistoryErrorResult {
  command: 'history'
  ok: false
  mode: 'list' | 'detail'
  query: HistoryCliQuery
  records: []
  record: null
  diagnostics: CommandDiagnostic[]
  diagnosticSummary: BoundedCollectionSummary
  runtime: RuntimeDiagnostic[]
  error: { code: string, message: string, candidates?: string[], candidateSummary?: BoundedCollectionSummary }
}

export type HistoryResult = HistoryListResult | HistoryDetailResult | HistoryErrorResult

export async function showHistory(input: HistoryCliQuery = {}): Promise<HistoryResult> {
  guardRspInitialized()
  const mode = input.workRef ? 'detail' as const : 'list' as const
  const validation = validateHistoryQuery(input)
  if (!validation.ok)
    return createHistoryError(mode, input, validation.error, [], emptyCollectionSummary(), [])

  const inspection = await inspectArchiveHistory()
  if (!historyInspectionComplete(inspection)) {
    return createHistoryError(mode, input, {
      code: 'archive_inspection_incomplete',
      message: 'archive history inspection is incomplete; resolve the reported diagnostics before querying history',
    }, inspection.diagnostics, inspection.diagnosticSummary, inspection.runtime)
  }

  if (validation.workRef) {
    try {
      const selected = selectArchiveHistoryRecord(inspection.records, { workRef: validation.workRef })
      const record = await readArchiveHistoryDetail(selected)
      const result: HistoryDetailResult = {
        command: 'history',
        ok: true,
        mode: 'detail',
        query: { workRef: validation.workRef },
        record,
        diagnostics: [],
        diagnosticSummary: emptyCollectionSummary(),
        runtime: inspection.runtime,
      }
      return result
    }
    catch (error) {
      if (error instanceof ArchiveHistoryError) {
        return createHistoryError(mode, input, {
          code: error.code,
          message: error.message,
          candidates: error.candidates.length > 0 ? error.candidates : undefined,
          candidateSummary: error.candidateTotal > 0
            ? { total: error.candidateTotal, returned: error.candidates.length, hasMore: error.candidatesTruncated }
            : undefined,
        }, [], emptyCollectionSummary(), inspection.runtime)
      }
      throw error
    }
  }

  const query = validation.query
  const listed = queryArchiveHistory(inspection.records, query)
  const result: HistoryListResult = {
    command: 'history',
    ok: true,
    mode: 'list',
    query: {
      limit: query.limit ?? HISTORY_DEFAULT_LIMIT,
      since: query.since ?? null,
      until: query.until ?? null,
      kind: query.kind ?? null,
      group: query.group ?? null,
      search: query.search ?? null,
    },
    records: listed.records,
    summary: listed.summary,
    diagnostics: [],
    diagnosticSummary: emptyCollectionSummary(),
    runtime: inspection.runtime,
  }
  return result
}

function validateHistoryQuery(input: HistoryCliQuery): { ok: true, query: ArchiveHistoryQuery, workRef?: string } | { ok: false, error: { code: string, message: string } } {
  if ((input.positionalCount ?? (input.workRef ? 1 : 0)) > 1)
    return invalid('history_positional_args_unsupported', 'history accepts at most one positional WorkRef')
  if (input.workRef) {
    let workRef
    try {
      workRef = normalizeExecutableWorkRef(input.workRef)
    }
    catch {
      return invalid('invalid_history_work_ref', 'history WorkRef must be a flat or one-Group-level executable Change identity')
    }
    if (input.limit !== undefined || input.since !== undefined || input.until !== undefined || input.kind !== undefined || input.group !== undefined || input.search !== undefined)
      return invalid('history_detail_filters_unsupported', 'list filters cannot be combined with an exact history detail lookup')
    return { ok: true, query: {}, workRef }
  }

  const limit = input.limit === undefined ? HISTORY_DEFAULT_LIMIT : Number(input.limit)
  if ((input.limit !== undefined && !/^[1-9]\d*$/.test(input.limit)) || !Number.isInteger(limit) || limit < 1 || limit > HISTORY_MAX_LIMIT)
    return invalid('invalid_history_limit', `--limit must be an integer from 1 through ${HISTORY_MAX_LIMIT}`)
  if (input.since && !isCalendarDate(input.since))
    return invalid('invalid_history_since', '--since must be a valid YYYY-MM-DD date')
  if (input.until && !isCalendarDate(input.until))
    return invalid('invalid_history_until', '--until must be a valid YYYY-MM-DD date')
  if (input.since && input.until && input.since > input.until)
    return invalid('invalid_history_date_range', '--since must be on or before --until')
  if (input.kind !== undefined && input.kind.trim() === '')
    return invalid('invalid_history_kind', '--kind must be a non-empty exact historical kind')
  let group = input.group
  if (group !== undefined) {
    try {
      group = normalizeWorkRefSegment(group)
    }
    catch {
      return invalid('invalid_history_group', '--group must be one safe Unicode Group name')
    }
  }
  if (input.search !== undefined && input.search.trim() === '')
    return invalid('invalid_history_search', '--search must be non-empty')

  return {
    ok: true,
    query: {
      limit,
      since: input.since,
      until: input.until,
      kind: input.kind?.trim(),
      group,
      search: input.search?.trim(),
    },
  }
}

function invalid(code: string, message: string): { ok: false, error: { code: string, message: string } } {
  return { ok: false, error: { code, message } }
}

function isCalendarDate(value: string): boolean {
  if (!DATE_RE.test(value))
    return false
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

function createHistoryError(
  mode: 'list' | 'detail',
  query: HistoryCliQuery,
  error: { code: string, message: string, candidates?: string[], candidateSummary?: BoundedCollectionSummary },
  diagnostics: CommandDiagnostic[],
  diagnosticSummary: BoundedCollectionSummary,
  runtime: RuntimeDiagnostic[],
): HistoryErrorResult {
  const result: HistoryErrorResult = {
    command: 'history',
    ok: false,
    mode,
    query,
    records: [],
    record: null,
    diagnostics,
    diagnosticSummary,
    runtime,
    error: {
      code: error.code,
      message: error.message,
      ...(error.candidates && { candidates: error.candidates }),
      ...(error.candidateSummary && { candidateSummary: error.candidateSummary }),
    },
  }
  return result
}

function emptyCollectionSummary(): BoundedCollectionSummary {
  return { total: 0, returned: 0, hasMore: false }
}
