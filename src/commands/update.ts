import type { RuntimeDiagnostic } from '../types.js'
import type {
  UpdateRollbackResult,
  UpdateRollbackTestingHooks,
} from './update-transaction.js'
import { existsSync } from 'node:fs'
import { mkdir, readFile, rm, rmdir } from 'node:fs/promises'

import { join } from 'node:path'
import { upsertRspAgentsBlock } from '../core/artifacts.js'
import { CHANGES_DIR, clearConfigCache, CONFIG_PATH, generateConfigTemplate, inspectRspConfig, OBSOLETE_RSP_RULES_PATH, reconcileRspConfigDefaults, RSP_DIR, RSP_RULES_PATH } from '../core/config.js'
import { ensureDecisionRecordsDirectory, resolveDecisionRecordsPath, validateDecisionRecordsFilesystemPath } from '../core/decisions.js'
import { detectProjectName, inspectUnsupportedRules } from '../core/filesystem.js'
import { withRspLock } from '../core/lock.js'
import { ensureManagedFile, inspectManagedDirectory, inspectManagedFile, writeManagedFile } from '../core/managed-path.js'
import { PROJECT_VERSION_PATH, readProjectVersion, selectProjectVersion, writeProjectVersion } from '../core/project-version.js'
import { removeLegacyArchiveIndex } from './archive-index-migration.js'
import {
  inspectGeneratedSpecsIndexMigration,
  removeRecognizedGeneratedSpecsIndexes,
} from './specs-index-migration.js'
import {
  UpdateRollbackJournal,

} from './update-transaction.js'

export interface UpdateOptions {
  adoptVersion?: boolean
  removeLegacyRules?: boolean
  /** Retained for presentation-neutral doctor compatibility; operations never emit output. */
  quiet?: boolean
  /** Internal deterministic failure hooks used only by production-path tests. */
  testing?: {
    afterPreMutations?: () => Promise<void>
    afterSpecsMigration?: () => Promise<void>
    rollback?: UpdateRollbackTestingHooks
  }
}

export interface UpdateResult {
  ok: boolean
  actions: string[]
  updated: boolean
  events: UpdateEvent[]
  migration: {
    inspectionComplete: boolean
    manualMigrationRequired: boolean
    residualEntries: string[]
    diagnostics: RuntimeDiagnostic[]
  }
}

export type UpdateEvent
  = | { type: 'updated', message: string }
    | { type: 'migration-diagnostics', diagnostics: RuntimeDiagnostic[] }
    | { type: 'residual-rules', entries: string[] }
    | { type: 'specs-indexes-removed', paths: string[] }
    | { type: 'legacy-context-map' }
    | { type: 'not-initialized' }

export class UpdateTransactionError extends Error {
  constructor(
    message: string,
    public readonly attemptedActions: string[],
    public readonly rollback: UpdateRollbackResult,
    options: ErrorOptions = {},
  ) {
    super(message, options)
    this.name = 'UpdateTransactionError'
  }
}

/**
 * Refresh RSP project structure after upgrade:
 * - Record the explicitly selected package version and retire selected legacy files
 * - Refresh AGENTS.md managed block
 * - Remove only metadata-recognized generated Specs indexes
 */
export async function updateProject(options: UpdateOptions = {}): Promise<UpdateResult> {
  if (!existsSync(RSP_DIR)) {
    return {
      ok: false,
      actions: [],
      updated: false,
      events: [{ type: 'not-initialized' }],
      migration: { inspectionComplete: false, manualMigrationRequired: false, residualEntries: [], diagnostics: [] },
    }
  }

  return withRspLock('update', async () => {
    const version = await selectProjectVersion(options.adoptVersion)
    const legacyDirectory = inspectManagedDirectory(join(RSP_DIR, 'rules'), 'legacy Rules root', { allowMissing: true })
    if (legacyDirectory.issue)
      throw legacyDirectory.issue
    const retiredFiles = [RSP_RULES_PATH, OBSOLETE_RSP_RULES_PATH].filter((path) => {
      const inspection = inspectManagedFile(path, 'retired Rules file', { allowMissing: true })
      if (inspection.issue)
        throw inspection.issue
      return inspection.exists
    })
    if (retiredFiles.length > 0 && !options.removeLegacyRules)
      throw new Error(`Retired Rules files require explicit removal: ${retiredFiles.join(', ')}. Preserve any custom content, then run update --remove-legacy-rules. Skills are now the only workflow.`)
    const rulesPreflight = await inspectUnsupportedRules()
    if (rulesPreflight.diagnostics.length > 0) {
      return {
        ok: false,
        actions: [],
        updated: false,
        events: [{ type: 'migration-diagnostics', diagnostics: rulesPreflight.diagnostics }],
        migration: {
          inspectionComplete: false,
          manualMigrationRequired: rulesPreflight.directoryRemaining,
          residualEntries: rulesPreflight.entries.map(entry => entry.path),
          diagnostics: rulesPreflight.diagnostics,
        },
      }
    }
    const agentsPath = 'AGENTS.md'
    const agentsInspection = inspectManagedFile(agentsPath, 'AGENTS.md', { allowMissing: true })
    if (agentsInspection.issue)
      throw agentsInspection.issue

    let updated = false
    const actions: string[] = []
    const events: UpdateEvent[] = []
    if (existsSync('CONTEXT-MAP.md'))
      events.push({ type: 'legacy-context-map' })

    clearConfigCache()
    const configInspection = await inspectRspConfig()
    if (configInspection.issues.length > 0)
      throw new Error(configInspection.issues.join('; '))
    const decisionRecordsPath = resolveDecisionRecordsPath(configInspection.config)
    const decisionRecordsFilesystemIssue = await validateDecisionRecordsFilesystemPath(decisionRecordsPath)
    if (decisionRecordsFilesystemIssue)
      throw new Error(decisionRecordsFilesystemIssue)
    const specsMigrationPlan = await inspectGeneratedSpecsIndexMigration()
    if (!specsMigrationPlan.inspectionComplete || specsMigrationPlan.ownerControlled.length > 0) {
      const ownerMessage = specsMigrationPlan.ownerControlled.length > 0
        ? ` Owner-controlled reserved path(s): ${specsMigrationPlan.ownerControlled.join(', ')}.`
        : ''
      const diagnosticMessage = specsMigrationPlan.diagnostics.length > 0
        ? ` ${specsMigrationPlan.diagnostics.join('; ')}`
        : ''
      throw new Error(`Generated Specs-index migration requires owner review before update.${ownerMessage}${diagnosticMessage}`)
    }

    const rollbackJournal = new UpdateRollbackJournal(
      process.cwd(),
      options.testing?.rollback,
    )
    try {
      const configFileInspection = inspectManagedFile(CONFIG_PATH, 'config file', { allowMissing: true })
      if (configFileInspection.issue)
        throw configFileInspection.issue
      const configContent = configFileInspection.exists ? await readFile(CONFIG_PATH, 'utf-8') : null
      const reconciledConfig = configContent === null
        ? { content: generateConfigTemplate(), added: ['all defaults'], changed: true }
        : reconcileRspConfigDefaults(configContent)
      if (reconciledConfig.changed) {
        await rollbackJournal.capture(CONFIG_PATH)
        await writeManagedFile(CONFIG_PATH, reconciledConfig.content, 'config file')
        await rollbackJournal.mark(CONFIG_PATH)
        const detail = reconciledConfig.added.length > 0
          ? `defaults added: ${reconciledConfig.added.join(', ')}`
          : 'generated layout normalized'
        actions.push(`config.yaml ${detail}`)
        events.push({ type: 'updated', message: `config.yaml ${detail}` })
        updated = true
      }

      const changesInspection = inspectManagedDirectory(CHANGES_DIR, 'open work root', { allowMissing: true })
      if (changesInspection.issue)
        throw changesInspection.issue
      if (!changesInspection.exists) {
        const changesDirectoryChain = await rollbackJournal.captureDirectoryChain(CHANGES_DIR)
        const changesPlaceholder = join(CHANGES_DIR, '.gitkeep')
        await rollbackJournal.capture(changesPlaceholder)
        await mkdir(CHANGES_DIR, { recursive: true })
        await ensureManagedFile(changesPlaceholder, '', 'changes placeholder')
        await rollbackJournal.mark(changesPlaceholder)
        await rollbackJournal.markAll(changesDirectoryChain)
        actions.push('changes/ directory restored')
        events.push({ type: 'updated', message: 'changes/ directory restored' })
        updated = true
      }
      const archivesInspection = inspectManagedDirectory(join(RSP_DIR, 'archives'), 'archive root', { allowMissing: true })
      if (archivesInspection.issue)
        throw archivesInspection.issue

      for (const path of retiredFiles) {
        await rollbackJournal.capture(path)
        await rm(path)
        await rollbackJournal.mark(path)
        actions.push(`retired Rules file removed: ${path}`)
        events.push({ type: 'updated', message: `retired Rules file removed: ${path}` })
        updated = true
      }

      try {
        const rulesRoot = join(RSP_DIR, 'rules')
        await rollbackJournal.capture(rulesRoot)
        await rmdir(rulesRoot)
        await rollbackJournal.mark(rulesRoot)
        actions.push('empty rules directory removed')
        updated = true
      }
      catch (error) {
        if (!['ENOENT', 'ENOTEMPTY'].includes((error as NodeJS.ErrnoException).code || ''))
          throw error
      }

      let inspection = await inspectUnsupportedRules()
      if (inspection.diagnostics.length === 0 && inspection.directoryRemaining && inspection.entries.every(entry => entry.kind === 'directory')) {
        const directories = inspection.entries
          .map(entry => entry.path)
          .sort((left, right) => right.split('/').length - left.split('/').length)
        for (const path of directories) {
          const directoryPath = join(RSP_DIR, 'rules', path)
          await rollbackJournal.capture(directoryPath)
          await rmdir(directoryPath)
          await rollbackJournal.mark(directoryPath)
        }
        const rulesRoot = join(RSP_DIR, 'rules')
        await rollbackJournal.capture(rulesRoot)
        await rmdir(rulesRoot)
        await rollbackJournal.mark(rulesRoot)
        actions.push('empty rules directory tree removed')
        events.push({ type: 'updated', message: 'empty rules directory tree removed' })
        updated = true
        inspection = await inspectUnsupportedRules()
      }

      const residualEntries = inspection.entries.map(entry => entry.path)
      if (inspection.diagnostics.length > 0)
        throw new Error(`Legacy Rules inspection became incomplete during update: ${inspection.diagnostics.map(diagnostic => `${diagnostic.path}: ${diagnostic.message}`).join('; ')}`)
      if (residualEntries.length > 0)
        events.push({ type: 'residual-rules', entries: residualEntries })

      const projectName = await detectProjectName()
      const baseAgents = agentsInspection.exists
        ? await readFile(agentsPath, 'utf-8')
        : `# ${projectName}

`
      const nextAgents = upsertRspAgentsBlock(baseAgents, version)
      if (!agentsInspection.exists || nextAgents.changed) {
        await rollbackJournal.capture(agentsPath)
        await writeManagedFile(agentsPath, nextAgents.content, 'AGENTS.md')
        await rollbackJournal.mark(agentsPath)
        actions.push('AGENTS.md managed block refreshed')
        events.push({ type: 'updated', message: 'AGENTS.md managed block refreshed' })
        updated = true
      }

      const decisionRecordsDirectoryChain = await rollbackJournal.captureDirectoryChain(decisionRecordsPath)
      const decisionRecordsPlaceholder = join(decisionRecordsPath, '.gitkeep')
      await rollbackJournal.capture(decisionRecordsPlaceholder)
      if (await ensureDecisionRecordsDirectory(decisionRecordsPath)) {
        await rollbackJournal.mark(decisionRecordsPlaceholder)
        await rollbackJournal.markAll(decisionRecordsDirectoryChain)
        actions.push(`Decision Record directory ensured: ${decisionRecordsPath}`)
        events.push({ type: 'updated', message: `Decision Record directory ensured: ${decisionRecordsPath}` })
        updated = true
      }

      const legacyArchiveIndexPath = join(RSP_DIR, 'archives', 'INDEX.md')
      await rollbackJournal.capture(legacyArchiveIndexPath)
      if (await removeLegacyArchiveIndex()) {
        await rollbackJournal.mark(legacyArchiveIndexPath)
        actions.push('legacy Archive Index removed')
        events.push({ type: 'updated', message: 'legacy Archive Index removed' })
        updated = true
      }

      for (const path of specsMigrationPlan.removable)
        await rollbackJournal.capture(path)
      await options.testing?.afterPreMutations?.()
      const removedSpecsIndexes = await removeRecognizedGeneratedSpecsIndexes()
      for (const path of specsMigrationPlan.removable)
        await rollbackJournal.mark(path)
      await options.testing?.afterSpecsMigration?.()
      if (removedSpecsIndexes.length > 0) {
        actions.push(`generated Specs indexes removed: ${removedSpecsIndexes.join(', ')}`)
        events.push({ type: 'specs-indexes-removed', paths: removedSpecsIndexes })
        updated = true
      }

      if (await readProjectVersion() !== version) {
        await rollbackJournal.capture(PROJECT_VERSION_PATH)
        await writeProjectVersion(version)
        await rollbackJournal.mark(PROJECT_VERSION_PATH)
        actions.push(`project CLI pinned to ${version}`)
        events.push({ type: 'updated', message: `project CLI pinned to ${version}` })
        updated = true
      }

      return {
        ok: inspection.diagnostics.length === 0,
        actions,
        updated,
        events,
        migration: {
          inspectionComplete: inspection.diagnostics.length === 0,
          manualMigrationRequired: inspection.directoryRemaining,
          residualEntries,
          diagnostics: inspection.diagnostics,
        },
      }
    }
    catch (error) {
      const rollback = await rollbackJournal.rollback()
      clearConfigCache()
      if (rollback.retainedMutations.length > 0 || rollback.recoveryPaths.length > 0) {
        throw new UpdateTransactionError(
          `RSP update failed and could not fully restore its command-scoped mutations: ${error instanceof Error ? error.message : String(error)}`,
          actions,
          rollback,
          { cause: error },
        )
      }
      throw error
    }
  })
}
