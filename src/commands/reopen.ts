import type { ChangeSectionId } from '../core/document-model.js'
import { existsSync } from 'node:fs'
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

import { CHANGES_DIR, FOCUS_DIR, RSP_DIR, RSP_RULES_PATH } from '../core/config.js'
import { appendDocumentSectionItem, CHANGE_DOCUMENT_SCHEMA, DocumentSectionCardinalityError, parseRspDocument } from '../core/document-model.js'
import { cleanupEmptyParentDirs } from '../core/filesystem.js'
import { withRspLock } from '../core/lock.js'
import { inspectManagedFile, writeManagedFile } from '../core/managed-path.js'
import { normalizeExecutableWorkRef, resolveFocusMarkerPath, resolveWorkRef, WorkRefError } from '../core/work-ref.js'
import { ArchiveHistoryError, historyInspectionComplete, inspectArchiveHistory, selectArchiveHistoryRecord } from '../history/query.js'

export interface ReopenOptions {
  from?: string
  reason: string
}
/** Restore one archived executable Change as focused open work while retaining archive evidence. */
export type ReopenChangeResult
  = | { ok: true, workRef: string, archivePath: string, git: boolean }
    | { ok: false, kind: 'usage' | 'error', message: string, candidates: string[], remainingCandidates: number }

export async function reopenChange(name: string, options: ReopenOptions): Promise<ReopenChangeResult> {
  if (!name) {
    return { ok: false, kind: 'usage', message: 'rsp reopen <name> --reason <text> [--from <archive-path>]', candidates: [], remainingCandidates: 0 }
  }
  const reason = options.reason?.trim()
  if (!reason || /[\r\n]/.test(reason)) {
    return { ok: false, kind: 'error', message: '--reason must be one non-empty line', candidates: [], remainingCandidates: 0 }
  }
  const initialization = inspectInitialization()
  if (initialization)
    return { ok: false, kind: 'error', message: initialization, candidates: [], remainingCandidates: 0 }

  try {
    return await withRspLock('reopen-change', async () => {
      const normalizedName = normalizeExecutableWorkRef(name)
      const inspection = await inspectArchiveHistory()
      if (!historyInspectionComplete(inspection)) {
        throw new ArchiveHistoryError(
          'archive_inspection_incomplete',
          'archive history inspection is incomplete; resolve the reported diagnostics before reopening work',
        )
      }
      const record = selectArchiveHistoryRecord(
        inspection.records,
        options.from ? { path: options.from } : { workRef: normalizedName },
      )
      if (record.workRef !== normalizedName) {
        throw new ArchiveHistoryError(
          'archive_identity_mismatch',
          `selected archive belongs to ${record.workRef}, not ${normalizedName}`,
        )
      }

      let workRef
      try {
        workRef = resolveWorkRef(normalizedName, { executable: true })
      }
      catch (error) {
        if (error instanceof WorkRefError && error.code === 'group_brief_missing') {
          throw new ArchiveHistoryError(
            'archived_group_closed',
            `cannot reopen ${name} because its Change Group is closed; reopen the Group through a separately authorized lifecycle operation first`,
          )
        }
        throw error
      }
      if (existsSync(workRef.path))
        throw new ArchiveHistoryError('open_change_exists', `open Change already exists: ${name}`)

      const focusEntry = resolveFocusMarkerPath(workRef)
      if (existsSync(focusEntry))
        throw new ArchiveHistoryError('focus_marker_exists', `focus marker already exists for non-open Change: ${name}; run rsp doctor`)

      const archivedContent = await readFile(record.sourcePath, 'utf-8')
      const reopenedContent = appendChecklistItem(
        appendChecklistItem(archivedContent, 'tasks', `- [ ] Resolve reopened concern: ${reason}`),
        'verify',
        `- [ ] Verify reopened concern: ${reason}`,
      )

      await mkdir(dirname(workRef.path), { recursive: true })
      let changeCreated = false
      try {
        await writeFile(workRef.path, reopenedContent, { flag: 'wx' })
        changeCreated = true
        await mkdir(FOCUS_DIR, { recursive: true })
        await mkdir(dirname(focusEntry), { recursive: true })
        await writeManagedFile(focusEntry, '', 'focus marker')
      }
      catch (error) {
        if (changeCreated) {
          try {
            await unlink(workRef.path)
            await cleanupEmptyParentDirs(workRef.path, CHANGES_DIR)
          }
          catch {
            // Preserve the original failure; doctor will report any residual path.
          }
        }
        throw error
      }

      return { ok: true, workRef: workRef.name, archivePath: record.path, git: existsSync('.git') }
    })
  }
  catch (error) {
    if (error instanceof ArchiveHistoryError || error instanceof WorkRefError) {
      return {
        ok: false,
        kind: 'error',
        message: error.message,
        candidates: error instanceof ArchiveHistoryError ? error.candidates : [],
        remainingCandidates: error instanceof ArchiveHistoryError && error.candidatesTruncated
          ? error.candidateTotal - error.candidates.length
          : 0,
      }
    }
    throw error
  }
}

function inspectInitialization(): string | undefined {
  const rules = inspectManagedFile(RSP_RULES_PATH, 'fallback protocol', { allowMissing: true })
  const design = inspectManagedFile(`${RSP_DIR}/specs/design.md`, 'design Spec', { allowMissing: true })
  if (!rules.issue && !design.issue && rules.exists && design.exists)
    return undefined
  const initialized = existsSync(RSP_DIR)
  return `${initialized ? 'RSP project requires an update' : 'RSP is not initialized in this project'}\n  ${initialized ? 'Run: rsp update' : 'Run: rsp init'}`
}

function appendChecklistItem(content: string, sectionId: Extract<ChangeSectionId, 'tasks' | 'verify'>, item: string): string {
  try {
    return appendDocumentSectionItem(parseRspDocument(content, CHANGE_DOCUMENT_SCHEMA), sectionId, item)
  }
  catch (error) {
    if (!(error instanceof DocumentSectionCardinalityError))
      throw error
    const heading = CHANGE_DOCUMENT_SCHEMA.sections.find(section => section.id === sectionId)!.heading
    throw new ArchiveHistoryError(
      'archive_section_invalid',
      `archived Change must contain exactly one required section: ${heading}`,
    )
  }
}
