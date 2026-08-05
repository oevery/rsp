import type { ArchiveTreeInspection } from '../core/work-ref.js'
import type { CommandDiagnostic, IssueRelationship, RuntimeDiagnostic } from '../types.js'
import type { ArchivedGroupBriefRecord, ArchiveHistoryInspection, ArchiveHistoryRecord } from './model.js'
import { readFile } from 'node:fs/promises'
import { basename, dirname, relative } from 'node:path'

import { ARCHIVES_DIR } from '../core/config.js'
import { CHANGE_DOCUMENT_SCHEMA, getDocumentTitles, GROUP_BRIEF_DOCUMENT_SCHEMA, parseRspDocument } from '../core/document-model.js'
import { normalizeLogicalPath, parseFrontmatter } from '../core/helpers.js'
import { parseIssueRelationships } from '../core/issue-relationship.js'
import { toErrorMessage } from '../core/output.js'
import { inspectArchiveTree, isCanonicalExecutableWorkRef, isCanonicalWorkRefSegment } from '../core/work-ref.js'
import { extractChangeSummary } from '../core/work-summary.js'
import { HISTORY_MAX_DIAGNOSTICS, HISTORY_MAX_TEXT_CODE_POINTS } from './model.js'

const ARCHIVE_NAME_RE = /^(\d{4}-\d{2}-\d{2})_(.+)\.md$/

export async function inspectArchiveHistory(options: { archivesDir?: string, archiveTree?: ArchiveTreeInspection } = {}): Promise<ArchiveHistoryInspection> {
  const archivesDir = options.archivesDir ?? ARCHIVES_DIR
  const tree = options.archiveTree ?? await inspectArchiveTree({ archivesDir })
  const diagnostics: CommandDiagnostic[] = tree.diagnostics.map(diagnostic => ({
    severity: 'error',
    code: diagnostic.code,
    path: normalizeOutputPath(diagnostic.path, archivesDir),
    message: diagnostic.message,
  }))
  const runtime: RuntimeDiagnostic[] = []
  const records: ArchiveHistoryRecord[] = []
  const groupBriefs: ArchivedGroupBriefRecord[] = []

  if (!tree.rootExists && tree.diagnostics.length === 0) {
    diagnostics.push({
      severity: 'error',
      code: 'archive_root_missing',
      path: '.rsp/archives',
      message: 'archive root does not exist; run rsp init or rsp update before querying history',
    })
  }

  for (const sourcePath of tree.files) {
    const path = archiveOutputPath(sourcePath, archivesDir)
    let content: string
    try {
      content = await readFile(sourcePath, 'utf-8')
    }
    catch (error) {
      const message = toErrorMessage(error)
      diagnostics.push({ severity: 'error', code: 'archive_read_failed', path, message: `unable to read archived work: ${message}` })
      continue
    }

    const parsed = parseArchiveEntry(sourcePath, path, archivesDir, content)
    if (parsed.diagnostic)
      diagnostics.push(parsed.diagnostic)
    if (parsed.record)
      records.push(parsed.record)
    if (parsed.groupBrief)
      groupBriefs.push(parsed.groupBrief)
  }

  records.sort(compareHistoryRecords)
  groupBriefs.sort(compareArchivedGroupBriefs)
  diagnostics.sort(compareDiagnostics)
  const diagnosticTotal = diagnostics.length
  const boundedDiagnostics = diagnostics.slice(0, HISTORY_MAX_DIAGNOSTICS)
  return {
    rootExists: tree.rootExists,
    records,
    groupBriefs,
    diagnostics: boundedDiagnostics,
    diagnosticSummary: {
      total: diagnosticTotal,
      returned: boundedDiagnostics.length,
      hasMore: diagnosticTotal > boundedDiagnostics.length,
    },
    runtime,
  }
}

function parseArchiveEntry(sourcePath: string, path: string, archivesDir: string, content: string): { record?: ArchiveHistoryRecord, groupBrief?: ArchivedGroupBriefRecord, diagnostic?: CommandDiagnostic } {
  const nameMatch = basename(sourcePath).match(ARCHIVE_NAME_RE)
  if (!nameMatch || !isCalendarDate(nameMatch[1])) {
    return { diagnostic: errorDiagnostic('archive_name_invalid', path, 'archive filename must use a valid YYYY-MM-DD_name.md date') }
  }
  const date = nameMatch[1]
  const archiveStem = nameMatch[2]
  const relativeDirectory = normalizeLogicalPath(relative(archivesDir, dirname(sourcePath)))
  const archiveGroup = relativeDirectory === '.' || relativeDirectory === '' ? null : relativeDirectory
  if (archiveGroup && !isCanonicalWorkRefSegment(archiveGroup))
    return { diagnostic: errorDiagnostic('archive_identity_mismatch', path, 'archive group path is not a valid one-segment Group identity') }

  const changeDocument = parseRspDocument(content, CHANGE_DOCUMENT_SCHEMA)
  const groupDocument = parseRspDocument(content, GROUP_BRIEF_DOCUMENT_SCHEMA)
  const changeHeadings = getDocumentTitles(changeDocument, 'identity')
  const groupHeadings = getDocumentTitles(groupDocument, 'identity')
  if (changeHeadings.length + groupHeadings.length !== 1) {
    return { diagnostic: errorDiagnostic('archive_heading_invalid', path, 'archive must contain exactly one Change or Change Group identity heading') }
  }

  let frontmatter
  try {
    frontmatter = parseFrontmatter(content)
  }
  catch (error) {
    return { diagnostic: errorDiagnostic('archive_frontmatter_invalid', path, `archive frontmatter could not be parsed: ${toErrorMessage(error)}`) }
  }
  if (typeof frontmatter?.kind !== 'string' || frontmatter.kind.trim() === '')
    return { diagnostic: errorDiagnostic('archive_kind_invalid', path, 'archive frontmatter must declare a non-empty kind') }

  if (groupHeadings.length === 1) {
    const group = groupHeadings[0]
    if (!archiveGroup || group !== archiveGroup || frontmatter.kind !== 'group' || !matchesArchiveStem(archiveStem, 'brief')) {
      return { diagnostic: errorDiagnostic('archive_identity_mismatch', path, `archived Change Group identity ${group} does not match its archive path`) }
    }
    return { groupBrief: { date, group, path, sourcePath } }
  }

  let issues: IssueRelationship[] | undefined
  if ('issues' in frontmatter) {
    try {
      issues = parseIssueRelationships(frontmatter)
    }
    catch {
      // Archives predate the v1 issue schema and are immutable. Preserve their
      // history record while treating unrecognized issue metadata as opaque.
      issues = undefined
    }
  }

  const workRef = changeHeadings[0]
  const segments = workRef.split('/')
  if (segments.length === 2 && (segments[1] === 'brief' || segments[1] === '00-brief')) {
    return { diagnostic: errorDiagnostic('archive_work_ref_invalid', path, `archived executable Change uses reserved Group Brief identity: ${workRef}`) }
  }
  const expectedGroup = segments.length === 2 ? segments[0] : null
  const expectedBase = segments.at(-1)!
  if (!isCanonicalExecutableWorkRef(workRef) || expectedGroup !== archiveGroup || !matchesArchiveStem(archiveStem, expectedBase)) {
    return { diagnostic: errorDiagnostic('archive_identity_mismatch', path, `archived Change identity ${workRef} does not match its archive path`) }
  }

  const rawSummary = extractChangeSummary(content, changeDocument, { preservePlaceholder: true })
  if (!rawSummary)
    return { diagnostic: errorDiagnostic('archive_summary_missing', path, 'archived Change must contain frontmatter summary, Proposal Outcome, or Proposal Summary') }
  const summary = boundText(rawSummary)
  return {
    record: {
      date,
      workRef,
      group: expectedGroup,
      kind: frontmatter.kind.trim(),
      summary: summary.value,
      summaryTruncated: summary.truncated,
      path,
      ...(issues === undefined ? {} : { issues }),
      sourcePath,
      searchSummary: rawSummary,
    },
  }
}

export function boundText(value: string): { value: string, truncated: boolean } {
  const codePoints = [...value]
  return codePoints.length > HISTORY_MAX_TEXT_CODE_POINTS
    ? { value: codePoints.slice(0, HISTORY_MAX_TEXT_CODE_POINTS).join(''), truncated: true }
    : { value, truncated: false }
}

function matchesArchiveStem(stem: string, identityBase: string): boolean {
  return stem === identityBase || new RegExp(`^${escapeRegExp(identityBase)}-(?:[2-9]|[1-9]\\d+)$`).test(stem)
}

function isCalendarDate(value: string): boolean {
  const parsed = new Date(`${value}T00:00:00.000Z`)
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value
}

function archiveOutputPath(sourcePath: string, archivesDir: string): string {
  return `.rsp/archives/${normalizeLogicalPath(relative(archivesDir, sourcePath))}`
}

function normalizeOutputPath(path: string, archivesDir: string): string {
  const relativePath = normalizeLogicalPath(relative(archivesDir, path))
  return relativePath === '' ? '.rsp/archives' : `.rsp/archives/${relativePath}`
}

function errorDiagnostic(code: string, path: string, message: string): CommandDiagnostic {
  return { severity: 'error', code, path, message }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function compareHistoryRecords(left: ArchiveHistoryRecord, right: ArchiveHistoryRecord): number {
  return right.date.localeCompare(left.date)
    || left.workRef.localeCompare(right.workRef)
    || left.path.localeCompare(right.path)
}

function compareArchivedGroupBriefs(left: ArchivedGroupBriefRecord, right: ArchivedGroupBriefRecord): number {
  return right.date.localeCompare(left.date)
    || left.group.localeCompare(right.group)
    || left.path.localeCompare(right.path)
}

function compareDiagnostics(left: CommandDiagnostic, right: CommandDiagnostic): number {
  return (left.path ?? '').localeCompare(right.path ?? '')
    || left.code.localeCompare(right.code)
    || left.message.localeCompare(right.message)
}
