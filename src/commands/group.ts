import { randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import { link, mkdir, readdir, readFile, rename, unlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { generateGroupBriefContent, getGroupReopenEvidence, GROUP_REOPEN_COMPLETION_PREFIX, hasArchivedGroupBrief, inspectChangeGroups } from '../core/change-group.js'
import { CHANGES_DIR, FOCUS_DIR, pc, RSP_DIR } from '../core/config.js'
import { appendDocumentSectionItem, getDocumentSectionBody, getDocumentSections, getDocumentTitles, GROUP_BRIEF_DOCUMENT_SCHEMA, parseRspDocument } from '../core/document-model.js'
import { cleanupEmptyParentDirs, guardRspInitialized } from '../core/filesystem.js'
import { withRspLock } from '../core/lock.js'
import { ManagedPathError, requireManagedDirectory, resolveManagedDirectoryChain } from '../core/managed-path.js'
import { toErrorMessage } from '../core/output.js'
import { normalizeWorkRefSegment, resolveArchiveDirectory, resolveWorkRef, WorkRefError } from '../core/work-ref.js'
import { ArchiveHistoryError, historyInspectionComplete, inspectArchiveHistory, selectArchivedGroupBrief } from '../history/query.js'
import { resolveArchiveName } from './archive.js'

class ChangeGroupError extends Error {
  override name = 'ChangeGroupError'
}

export async function createChangeGroup(name: string, goal = ''): Promise<void> {
  if (!name) {
    console.error(`  ${pc.red('Usage:')} rsp group create <name> [goal]`)
    process.exit(1)
  }
  guardRspInitialized()

  try {
    await withRspLock('create-change-group', async () => {
      const ref = resolveWorkRef(`${name}/brief`)
      if (ref.kind !== 'group-brief')
        throw new WorkRefError('invalid_work_ref', `invalid Change Group name: ${name}`, name)
      const groupName = ref.group
      if (await hasArchivedGroupBrief(groupName))
        throw new ChangeGroupError(`archived Change Group cannot be reopened: ${groupName}`)

      const groupDirectory = resolveManagedDirectoryChain(CHANGES_DIR, [groupName], 'Change Group path')
      await mkdir(groupDirectory, { recursive: true })
      try {
        await writeFile(ref.path, generateGroupBriefContent(groupName, goal), { flag: 'wx' })
      }
      catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'EEXIST')
          throw new ChangeGroupError(`Change Group already exists: ${groupName}`)
        throw error
      }

      console.log(`  ${pc.green('Created Change Group:')} ${groupName}`)
      console.log(`  ${pc.dim('Unfocused Group Brief:')} ${ref.path}`)
      console.log(`  ${pc.cyan('Next:')} fill the brief, then create direct child Changes with rsp create ${groupName}/<change>\n`)
    })
  }
  catch (error) {
    if (error instanceof WorkRefError || error instanceof ChangeGroupError) {
      console.error(`  ${pc.red('Error:')} ${error.message}`)
      process.exit(1)
    }
    throw error
  }
}

export async function closeChangeGroup(name: string): Promise<void> {
  if (!name) {
    console.error(`  ${pc.red('Usage:')} rsp group close <name>`)
    process.exit(1)
  }
  guardRspInitialized()

  try {
    await withRspLock('close-change-group', async () => {
      const ref = resolveWorkRef(`${name}/brief`, { mustExist: true })
      if (ref.kind !== 'group-brief')
        throw new ChangeGroupError(`invalid Change Group name: ${name}`)

      const inspection = await inspectChangeGroups()
      const groupName = ref.group
      const group = inspection.groups.find(candidate => candidate.name === groupName)
      if (!group)
        throw new ChangeGroupError(`Change Group not found: ${groupName}`)
      const reasons = collectCloseReasons(group, inspection.diagnostics.filter(diagnostic => diagnostic.change === groupName && diagnostic.severity === 'error').map(diagnostic => diagnostic.message))
      if (reasons.length > 0)
        throw new ChangeGroupError(`Change Group "${groupName}" is not ready to close: ${reasons.join('; ')}`)

      const archiveDirectory = resolveArchiveDirectory(ref)
      const date = new Date().toISOString().slice(0, 10)
      const archiveName = resolveArchiveName(archiveDirectory, date, 'brief')
      await mkdir(archiveDirectory, { recursive: true })
      await rename(ref.path, join(archiveDirectory, archiveName))
      const warnings: string[] = []
      try {
        await cleanupEmptyParentDirs(ref.path, CHANGES_DIR)
      }
      catch (error) {
        warnings.push(`changes directory cleanup failed: ${toErrorMessage(error)}`)
      }
      console.log(`  ${pc.green('Closed Change Group:')} ${groupName}`)
      console.log(`  ${pc.dim('Archived Group Brief:')} ${join(archiveDirectory, archiveName)}\n`)
      for (const warning of warnings)
        console.log(`  ${pc.yellow('⚠')} ${warning}`)
      if (warnings.length > 0)
        console.log(`  ${pc.yellow('Group close completed, but follow-up cleanup was only partially successful.')}\n`)
    })
  }
  catch (error) {
    if (error instanceof WorkRefError || error instanceof ChangeGroupError) {
      console.error(`  ${pc.red('Error:')} ${error.message}`)
      process.exit(1)
    }
    throw error
  }
}

export interface ReopenChangeGroupOptions {
  from?: string
  reason: string
}

/** Restore one exact archived Group Brief without reopening or focusing any child. */
export async function reopenChangeGroup(name: string, options: ReopenChangeGroupOptions): Promise<void> {
  if (!name) {
    console.error(`  ${pc.red('Usage:')} rsp group reopen <name> --reason <text> [--from <archive-path>]`)
    process.exit(1)
  }
  const reason = options.reason?.trim()
  if (!reason || /[\r\n]/.test(reason)) {
    console.error(`  ${pc.red('Error:')} --reason must be one non-empty line`)
    process.exit(1)
  }
  guardRspInitialized()

  try {
    await withRspLock('reopen-change-group', async () => {
      const groupName = normalizeWorkRefSegment(name)
      await requireEmptyGroupRecoverySubtree(join(CHANGES_DIR, groupName), `Change Group work subtree for ${groupName}`)
      await requireEmptyGroupRecoverySubtree(join(FOCUS_DIR, groupName), `Change Group focus subtree for ${groupName}`)
      const ref = resolveWorkRef(`${groupName}/brief`)
      if (ref.kind !== 'group-brief')
        throw new ChangeGroupError(`invalid Change Group name: ${name}`)
      const inspection = await inspectArchiveHistory()
      if (!historyInspectionComplete(inspection)) {
        throw new ArchiveHistoryError(
          'archive_inspection_incomplete',
          'archive history inspection is incomplete; resolve the reported diagnostics before reopening a Change Group',
        )
      }
      const record = selectArchivedGroupBrief(
        inspection.groupBriefs,
        options.from ? { path: options.from } : { group: groupName },
      )
      if (record.group !== groupName) {
        throw new ArchiveHistoryError(
          'archive_identity_mismatch',
          `selected archived Change Group belongs to ${record.group}, not ${groupName}`,
        )
      }
      if (existsSync(ref.path))
        throw new ArchiveHistoryError('open_group_exists', `open Change Group already exists: ${groupName}`)

      const archivedContent = await readFile(record.sourcePath, 'utf-8')
      const document = parseRspDocument(archivedContent, GROUP_BRIEF_DOCUMENT_SCHEMA)
      validateArchivedGroupBrief(document, groupName)
      const evidenceKey = `${GROUP_REOPEN_COMPLETION_PREFIX} \`${record.path}\`: ${reason}`
      const retainedEvidence = new Set<string>()
      for (const retained of inspection.groupBriefs.filter(candidate => candidate.group === groupName)) {
        const content = retained.sourcePath === record.sourcePath ? archivedContent : await readFile(retained.sourcePath, 'utf-8')
        for (const item of getGroupReopenEvidence(content))
          retainedEvidence.add(item.key)
      }
      if (retainedEvidence.has(evidenceKey)) {
        throw new ArchiveHistoryError(
          'archive_reopen_evidence_replayed',
          `reopen evidence already exists in retained Change Group history; choose a fresh reason or a different exact archive: ${record.path}`,
        )
      }
      const reopenedContent = appendDocumentSectionItem(
        document,
        'completionConditions',
        `- [ ] ${evidenceKey}`,
      )

      const groupDirectory = resolveManagedDirectoryChain(CHANGES_DIR, [groupName], 'Change Group path')
      await mkdir(groupDirectory, { recursive: true })
      const temporaryPath = join(RSP_DIR, `.group-reopen-${process.pid}-${randomUUID()}.tmp`)
      let mutationError: unknown
      try {
        await writeFile(temporaryPath, reopenedContent, { flag: 'wx' })
        await link(temporaryPath, ref.path)
      }
      catch (error) {
        mutationError = error
      }
      try {
        await unlink(temporaryPath)
      }
      catch (error) {
        if (!mutationError)
          console.log(`  ${pc.yellow('⚠')} temporary reopen file cleanup failed: ${toErrorMessage(error)}`)
      }
      if (mutationError) {
        try {
          await cleanupEmptyParentDirs(ref.path, CHANGES_DIR)
        }
        catch {
          // Preserve the original failure; doctor will report any residual path.
        }
        if ((mutationError as NodeJS.ErrnoException).code === 'EEXIST')
          throw new ArchiveHistoryError('open_group_exists', `open Change Group already exists: ${groupName}`)
        throw mutationError
      }

      console.log(`  ${pc.green('Reopened Change Group:')} ${groupName}`)
      console.log(`  ${pc.dim('retained archive')} → ${record.path}`)
      console.log(`  ${pc.dim('unfocused Group Brief')} → ${ref.path}`)
      console.log(`  ${pc.cyan('Next:')} run rsp reopen ${groupName}/<change> --reason <text> only for an incomplete archived child\n`)
    })
  }
  catch (error) {
    if (error instanceof ArchiveHistoryError || error instanceof WorkRefError || error instanceof ChangeGroupError || error instanceof ManagedPathError) {
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

async function requireEmptyGroupRecoverySubtree(path: string, label: string): Promise<void> {
  if (!requireManagedDirectory(path, label, { allowMissing: true }))
    return
  let entries
  try {
    entries = await readdir(path)
  }
  catch (error) {
    throw new ChangeGroupError(`unable to inspect ${label}: ${toErrorMessage(error)}`)
  }
  if (entries.length > 0)
    throw new ChangeGroupError(`${label} must be absent or empty before reopen; found: ${entries.sort().join(', ')}`)
}

function validateArchivedGroupBrief(document: ReturnType<typeof parseRspDocument>, group: string): void {
  const titles = getDocumentTitles(document, 'identity')
  if (titles.length !== 1 || titles[0] !== group)
    throw new ArchiveHistoryError('archive_heading_invalid', `archived Change Group must contain exactly one canonical identity heading for ${group}`)
  for (const section of GROUP_BRIEF_DOCUMENT_SCHEMA.sections) {
    const matches = getDocumentSections(document, section.id)
    if (matches.length !== 1 || !matches[0].canonical || !getDocumentSectionBody(document, section.id)) {
      throw new ArchiveHistoryError(
        'archive_section_invalid',
        `archived Change Group must contain exactly one canonical required section: ${section.heading}`,
      )
    }
  }
}

function collectCloseReasons(group: Awaited<ReturnType<typeof inspectChangeGroups>>['groups'][number], errors: string[]): string[] {
  const reasons = [...errors, ...group.warnings]
  const open = group.slices.filter(slice => slice.state === 'open').map(slice => slice.name)
  const missing = group.slices.filter(slice => slice.state === 'missing').map(slice => slice.name)
  if (open.length > 0)
    reasons.push(`open slices: ${open.join(', ')}`)
  if (missing.length > 0)
    reasons.push(`missing slices: ${missing.join(', ')}`)
  if (group.completion.total === 0)
    reasons.push('no completion conditions are declared')
  else if (group.completion.done !== group.completion.total)
    reasons.push(`completion conditions incomplete: ${group.completion.done}/${group.completion.total}`)
  if (group.blockers)
    reasons.push('active group blockers remain')
  return [...new Set(reasons)]
}
