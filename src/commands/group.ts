import { randomUUID } from 'node:crypto'
import { existsSync } from 'node:fs'
import { link, mkdir, readdir, readFile, rename, unlink, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { generateGroupBriefContent, getGroupReopenEvidence, GROUP_REOPEN_COMPLETION_PREFIX, hasArchivedGroupBrief, inspectChangeGroups } from '../core/change-group.js'
import { CHANGES_DIR, FOCUS_DIR, RSP_DIR, RSP_RULES_PATH } from '../core/config.js'
import { appendDocumentSectionItem, getDocumentSectionBody, getDocumentSections, getDocumentTitles, GROUP_BRIEF_DOCUMENT_SCHEMA, parseRspDocument } from '../core/document-model.js'
import { cleanupEmptyParentDirs } from '../core/filesystem.js'
import { withRspLock } from '../core/lock.js'
import { inspectManagedFile, ManagedPathError, requireManagedDirectory, resolveManagedDirectoryChain } from '../core/managed-path.js'
import { toErrorMessage } from '../core/output.js'
import { normalizeWorkRefSegment, resolveArchiveDirectory, resolveWorkRef, WorkRefError } from '../core/work-ref.js'
import { ArchiveHistoryError, historyInspectionComplete, inspectArchiveHistory, selectArchivedGroupBrief } from '../history/query.js'
import { resolveArchiveName } from './archive.js'

class ChangeGroupError extends Error {
  override name = 'ChangeGroupError'
}

export type ChangeGroupResult
  = | { ok: true, action: 'create', groupName: string, path: string }
    | { ok: true, action: 'close', groupName: string, archivePath: string, warnings: string[] }
    | { ok: true, action: 'reopen', groupName: string, archivePath: string, path: string, warnings: string[] }
    | { ok: false, kind: 'usage' | 'error', message: string, candidates: string[], remainingCandidates: number }

export async function createChangeGroup(name: string, goal = ''): Promise<ChangeGroupResult> {
  if (!name) {
    return failure('usage', 'rsp group create <name> [goal]')
  }
  const initialization = inspectInitialization()
  if (initialization)
    return failure('error', initialization)

  try {
    return await withRspLock('create-change-group', async () => {
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

      return { ok: true, action: 'create', groupName, path: ref.path } as const
    })
  }
  catch (error) {
    if (error instanceof WorkRefError || error instanceof ChangeGroupError) {
      return failure('error', error.message)
    }
    throw error
  }
}

export async function closeChangeGroup(name: string): Promise<ChangeGroupResult> {
  if (!name) {
    return failure('usage', 'rsp group close <name>')
  }
  const initialization = inspectInitialization()
  if (initialization)
    return failure('error', initialization)

  try {
    return await withRspLock('close-change-group', async () => {
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
      return { ok: true, action: 'close', groupName, archivePath: join(archiveDirectory, archiveName), warnings } as const
    })
  }
  catch (error) {
    if (error instanceof WorkRefError || error instanceof ChangeGroupError) {
      return failure('error', error.message)
    }
    throw error
  }
}

export interface ReopenChangeGroupOptions {
  from?: string
  reason: string
}

/** Restore one exact archived Group Brief without reopening or focusing any child. */
export async function reopenChangeGroup(name: string, options: ReopenChangeGroupOptions): Promise<ChangeGroupResult> {
  if (!name) {
    return failure('usage', 'rsp group reopen <name> --reason <text> [--from <archive-path>]')
  }
  const reason = options.reason?.trim()
  if (!reason || /[\r\n]/.test(reason)) {
    return failure('error', '--reason must be one non-empty line')
  }
  const initialization = inspectInitialization()
  if (initialization)
    return failure('error', initialization)

  try {
    return await withRspLock('reopen-change-group', async () => {
      const warnings: string[] = []
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
          warnings.push(`temporary reopen file cleanup failed: ${toErrorMessage(error)}`)
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

      return { ok: true, action: 'reopen', groupName, archivePath: record.path, path: ref.path, warnings } as const
    })
  }
  catch (error) {
    if (error instanceof ArchiveHistoryError || error instanceof WorkRefError || error instanceof ChangeGroupError || error instanceof ManagedPathError) {
      return failure(
        'error',
        error.message,
        error instanceof ArchiveHistoryError ? error.candidates : [],
        error instanceof ArchiveHistoryError && error.candidatesTruncated
          ? error.candidateTotal - error.candidates.length
          : 0,
      )
    }
    throw error
  }
}

function failure(kind: 'usage' | 'error', message: string, candidates: string[] = [], remainingCandidates = 0): ChangeGroupResult {
  return { ok: false, kind, message, candidates, remainingCandidates }
}

function inspectInitialization(): string | undefined {
  const rules = inspectManagedFile(RSP_RULES_PATH, 'fallback protocol', { allowMissing: true })
  const design = inspectManagedFile(join(RSP_DIR, 'specs', 'design.md'), 'design Spec', { allowMissing: true })
  if (!rules.issue && !design.issue && rules.exists && design.exists)
    return undefined
  const initialized = existsSync(RSP_DIR)
  return `${initialized ? 'RSP project requires an update' : 'RSP is not initialized in this project'}\n  ${initialized ? 'Run: rsp update' : 'Run: rsp init'}`
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
