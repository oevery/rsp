import type { HistoryDetailOutput, HistoryEvidenceListOutput, HistoryRecordOutput } from '../types.js'
import type { ArchivedGroupBriefRecord, ArchiveHistoryInspection, ArchiveHistoryListResult, ArchiveHistoryQuery, ArchiveHistoryRecord } from './model.js'

import { countCheckboxes, parseScenarios } from '../core/content.js'
import { CHANGE_DOCUMENT_SCHEMA, getDocumentSectionBody, parseRspDocument } from '../core/document-model.js'
import { normalizeWorkRefSegment } from '../core/work-ref.js'
import { readCurrentArchiveFile } from './current-file.js'
import { boundText } from './inspect.js'
import { ArchiveHistoryError, HISTORY_DEFAULT_LIMIT, HISTORY_MAX_EVIDENCE_ITEMS, HISTORY_MAX_LIMIT } from './model.js'

export { inspectArchiveHistory } from './inspect.js'
export type { ArchiveHistoryInspection, ArchiveHistoryListResult, ArchiveHistoryQuery, ArchiveHistoryRecord } from './model.js'
export { ArchiveHistoryError, HISTORY_DEFAULT_LIMIT, HISTORY_MAX_LIMIT } from './model.js'

export function queryArchiveHistory(records: ArchiveHistoryRecord[], query: ArchiveHistoryQuery = {}): ArchiveHistoryListResult {
  validateArchiveHistoryQuery(query)
  const group = query.group === undefined ? undefined : normalizeWorkRefSegment(query.group)
  const limit = query.limit ?? HISTORY_DEFAULT_LIMIT
  const matched = records
    .filter(record => (
      (!query.since || record.date >= query.since)
      && (!query.until || record.date <= query.until)
      && (!query.kind || record.kind === query.kind)
      && (!group || record.group === group)
      && (!query.search || `${record.workRef}\n${record.searchSummary ?? record.summary}`.toLowerCase().includes(query.search.toLowerCase()))
    ))
    .sort(compareHistoryRecords)
  const selected = matched.slice(0, limit)
  return {
    records: selected.map(toOutputRecord),
    summary: {
      matched: matched.length,
      returned: selected.length,
      hasMore: matched.length > selected.length,
    },
  }
}

export function validateArchiveHistoryQuery(query: ArchiveHistoryQuery): void {
  const limit = query.limit ?? HISTORY_DEFAULT_LIMIT
  if (!Number.isInteger(limit) || limit < 1 || limit > HISTORY_MAX_LIMIT)
    throw new ArchiveHistoryError('invalid_history_limit', `history limit must be an integer from 1 through ${HISTORY_MAX_LIMIT}`)
  if (query.since && !isCalendarDate(query.since))
    throw new ArchiveHistoryError('invalid_history_since', 'history since must be a valid YYYY-MM-DD date')
  if (query.until && !isCalendarDate(query.until))
    throw new ArchiveHistoryError('invalid_history_until', 'history until must be a valid YYYY-MM-DD date')
  if (query.since && query.until && query.since > query.until)
    throw new ArchiveHistoryError('invalid_history_date_range', 'history since must be on or before until')
  if (query.kind !== undefined && query.kind.trim() === '')
    throw new ArchiveHistoryError('invalid_history_kind', 'history kind must be non-empty')
  if (query.group !== undefined) {
    try {
      normalizeWorkRefSegment(query.group)
    }
    catch {
      throw new ArchiveHistoryError('invalid_history_group', 'history group must be one safe Unicode segment')
    }
  }
  if (query.search !== undefined && query.search.trim() === '')
    throw new ArchiveHistoryError('invalid_history_search', 'history search must be non-empty')
}

export function selectArchiveHistoryRecord(records: ArchiveHistoryRecord[], selector: { workRef: string } | { path: string }): ArchiveHistoryRecord {
  const matches = 'path' in selector
    ? records.filter(record => record.path === selector.path)
    : records.filter(record => record.workRef === selector.workRef)
  const identity = 'path' in selector ? selector.path : selector.workRef
  if (matches.length === 0)
    throw new ArchiveHistoryError('archive_not_found', `archived Change not found: ${identity}`)
  if (matches.length > 1) {
    const candidates = matches.map(record => record.path).sort()
    throw new ArchiveHistoryError('archive_ambiguous', `multiple archives match WorkRef ${identity}`, candidates)
  }
  return matches[0]
}

export function selectArchivedGroupBrief(records: ArchivedGroupBriefRecord[], selector: { group: string } | { path: string }): ArchivedGroupBriefRecord {
  const matches = 'path' in selector
    ? records.filter(record => record.path === selector.path)
    : records.filter(record => record.group === selector.group)
  const identity = 'path' in selector ? selector.path : selector.group
  if (matches.length === 0)
    throw new ArchiveHistoryError('archive_not_found', `archived Change Group not found: ${identity}`)
  if (matches.length > 1) {
    const candidates = matches.map(record => record.path).sort()
    throw new ArchiveHistoryError('archive_ambiguous', `multiple archives match Change Group ${identity}`, candidates)
  }
  return matches[0]
}

export async function readArchiveHistoryDetail(record: ArchiveHistoryRecord): Promise<HistoryDetailOutput> {
  let content
  try {
    content = (await readCurrentArchiveFile({
      sourcePath: record.sourcePath,
      archivesDir: record.archivesDir,
      projectPath: record.path,
      maxFileBytes: record.maxFileBytes,
      expectedSnapshot: record.sourceSnapshot,
    })).content
  }
  catch (error) {
    if (error instanceof ArchiveHistoryError)
      throw error
    throw new ArchiveHistoryError('archive_read_failed', `unable to read archived Change ${record.path}: ${error instanceof Error ? error.message : String(error)}`)
  }

  const document = parseRspDocument(content, CHANGE_DOCUMENT_SCHEMA)
  const tasks = getDocumentSectionBody(document, 'tasks')
  const verify = getDocumentSectionBody(document, 'verify')
  const blockers = getDocumentSectionBody(document, 'blockers')
  return {
    ...toOutputRecord(record),
    scenarioCount: parseScenarios(content).length,
    checkboxes: {
      tasks: countCheckboxes(tasks),
      verify: countCheckboxes(verify),
    },
    evidence: {
      tasks: boundEvidence(tasks),
      verify: boundEvidence(verify),
      blockers: boundEvidence(blockers, true),
    },
  }
}

export function historyInspectionComplete(inspection: ArchiveHistoryInspection): boolean {
  return inspection.diagnostics.every(diagnostic => diagnostic.severity !== 'error')
}

function toOutputRecord(record: ArchiveHistoryRecord): HistoryRecordOutput {
  const {
    searchSummary: _searchSummary,
    sourcePath: _sourcePath,
    archivesDir: _archivesDir,
    sourceSnapshot: _sourceSnapshot,
    maxFileBytes: _maxFileBytes,
    ...output
  } = record
  return output
}

function boundEvidence(section: string, omitNone = false): HistoryEvidenceListOutput {
  const rawItems = section
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .filter(line => !omitNone || (!/^[-*]\s*(?:none)?$/i.test(line) && !/^none$/i.test(line)))
  const boundedItems = rawItems.slice(0, HISTORY_MAX_EVIDENCE_ITEMS).map(item => boundText(item))
  return {
    items: boundedItems.map(item => item.value),
    truncated: rawItems.length > HISTORY_MAX_EVIDENCE_ITEMS || boundedItems.some(item => item.truncated),
  }
}

function isCalendarDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

function compareHistoryRecords(left: ArchiveHistoryRecord, right: ArchiveHistoryRecord): number {
  return right.date.localeCompare(left.date)
    || left.workRef.localeCompare(right.workRef)
    || left.path.localeCompare(right.path)
}
