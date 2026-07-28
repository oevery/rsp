import { existsSync } from 'node:fs'
import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

import { CHANGES_DIR, FOCUS_DIR, pc } from '../core/config.js'
import { cleanupEmptyParentDirs, guardRspInitialized } from '../core/helpers.js'
import { withRspLock } from '../core/lock.js'
import { writeManagedFile } from '../core/managed-path.js'
import { normalizeExecutableWorkRef, resolveFocusMarkerPath, resolveWorkRef, WorkRefError } from '../core/work-ref.js'
import { ArchiveHistoryError, historyInspectionComplete, inspectArchiveHistory, selectArchiveHistoryRecord } from '../history/query.js'

export interface ReopenOptions {
  from?: string
  reason: string
}
/** Restore one archived executable Change as focused open work while retaining archive evidence. */
export async function reopenChange(name: string, options: ReopenOptions): Promise<void> {
  if (!name) {
    console.error(`  ${pc.red('Usage:')} rsp reopen <name> --reason <text> [--from <archive-path>]`)
    process.exit(1)
  }
  const reason = options.reason?.trim()
  if (!reason || /[\r\n]/.test(reason)) {
    console.error(`  ${pc.red('Error:')} --reason must be one non-empty line`)
    process.exit(1)
  }
  guardRspInitialized()

  try {
    await withRspLock('reopen-change', async () => {
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
        appendChecklistItem(archivedContent, 'Tasks', `- [ ] Resolve reopened concern: ${reason}`),
        'Verify',
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

      console.log(`  ${pc.green('Reopened:')} ${workRef.name}`)
      console.log(`  ${pc.dim('retained archive')} → ${record.path}`)
      console.log(`  ${pc.dim('focused via focus.d')} → ${workRef.name}`)
      console.log(`  ${pc.cyan('Next:')} refine the reopened Task and Verify evidence, then resolve the concern\n`)

      if (existsSync('.git')) {
        console.log(`  ${pc.cyan('Git delivery:')}`)
        console.log(`    git status --short`)
        console.log(`    Inspect the complete reopen transition; stage and commit only with separate Git authority.`)
        console.log()
      }
    })
  }
  catch (error) {
    if (error instanceof ArchiveHistoryError || error instanceof WorkRefError) {
      console.error(`  ${pc.red('Error:')} ${error.message}`)
      if (error instanceof ArchiveHistoryError) {
        for (const candidate of error.candidates)
          console.error(`    ${candidate}`)
        if (error.candidatesTruncated)
          console.error(`    ... ${error.candidateTotal - error.candidates.length} more`)
      }
      process.exit(1)
    }
    throw error
  }
}

function appendChecklistItem(content: string, heading: 'Tasks' | 'Verify', item: string): string {
  const headings = [...content.matchAll(new RegExp(`^## ${heading}[ \\t]*\\r?$`, 'gm'))]
  if (headings.length !== 1) {
    throw new ArchiveHistoryError(
      'archive_section_invalid',
      `archived Change must contain exactly one required section: ${heading}`,
    )
  }
  const sectionBodyStart = headings[0].index + headings[0][0].length
  const nextHeading = content.indexOf('\n## ', sectionBodyStart)
  const insertAt = nextHeading < 0 ? content.length : nextHeading
  const before = content.slice(0, insertAt)
  const separator = before.endsWith('\n\n') ? '' : before.endsWith('\n') ? '\n' : '\n\n'
  return `${before}${separator}${item}\n${content.slice(insertAt)}`
}
