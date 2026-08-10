import type { RuntimeDiagnostic } from '../types.js'
import type {
  UpdateRollbackResult,
  UpdateRollbackTestingHooks,
} from './update-transaction.js'
import { existsSync } from 'node:fs'
import { mkdir, readFile, rm, rmdir } from 'node:fs/promises'

import { join } from 'node:path'
import { upsertRspAgentsBlock } from '../core/artifacts.js'
import { CHANGES_DIR, clearConfigCache, CONFIG_PATH, generateConfigTemplate, inspectRspConfig, OBSOLETE_RSP_RULES_PATH, pc, PKG_ROOT, reconcileRspConfigDefaults, RSP_DIR, RSP_RULES_PATH } from '../core/config.js'
import { ensureDecisionRecordsDirectory, resolveDecisionRecordsPath, validateDecisionRecordsFilesystemPath } from '../core/decisions.js'
import { detectProjectName, inspectUnsupportedRules } from '../core/filesystem.js'
import { withRspLock } from '../core/lock.js'
import { ensureManagedFile, inspectManagedDirectory, inspectManagedFile, writeManagedFile } from '../core/managed-path.js'
import { removeLegacyArchiveIndex } from './archive-index-migration.js'
import {
  inspectGeneratedSpecsIndexMigration,
  removeRecognizedGeneratedSpecsIndexes,
} from './specs-index-migration.js'
import {
  UpdateRollbackJournal,

} from './update-transaction.js'

const SKILL_REFRESH_HINT = '  Note: if you use package-bundled RSP Skills, refresh them too:\n    rsp skills install --dry-run\n    rsp skills install --force\n'

export interface UpdateOptions {
  quiet?: boolean
  /** Internal deterministic failure hooks used only by production-path tests. */
  testing?: {
    afterPreMutations?: () => Promise<void>
    afterSpecsMigration?: () => Promise<void>
    packageRoot?: string
    rollback?: UpdateRollbackTestingHooks
  }
}

export interface UpdateResult {
  actions: string[]
  migration: {
    inspectionComplete: boolean
    manualMigrationRequired: boolean
    residualEntries: string[]
    diagnostics: RuntimeDiagnostic[]
  }
}

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
 * - Update bundled rsp-rules.md
 * - Refresh AGENTS.md managed block
 * - Remove only metadata-recognized generated Specs indexes
 */
export async function updateProject(options: UpdateOptions = {}): Promise<UpdateResult> {
  if (!existsSync(RSP_DIR)) {
    console.error(`  ${pc.red('Error:')} RSP is not initialized in this project`)
    console.error(`  ${pc.dim('Run: rsp init')}`)
    process.exit(1)
  }

  return withRspLock('update', async () => {
    const agentsPath = 'AGENTS.md'
    const agentsInspection = inspectManagedFile(agentsPath, 'AGENTS.md', { allowMissing: true })
    if (agentsInspection.issue)
      throw agentsInspection.issue

    let updated = false
    const actions: string[] = []

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
        if (!options.quiet)
          console.log(`  ${pc.green('✓')} config.yaml ${detail}`)
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
        if (!options.quiet)
          console.log(`  ${pc.green('✓')} changes/ directory restored`)
        updated = true
      }
      const archivesInspection = inspectManagedDirectory(join(RSP_DIR, 'archives'), 'archive root', { allowMissing: true })
      if (archivesInspection.issue)
        throw archivesInspection.issue

      const bundledRules = await readFile(join(options.testing?.packageRoot ?? PKG_ROOT, 'rules', 'rsp-rules.md'), 'utf-8')
      const rulesInspection = inspectManagedFile(RSP_RULES_PATH, 'fallback protocol', { allowMissing: true })
      if (rulesInspection.issue)
        throw rulesInspection.issue
      const existingRules = rulesInspection.exists ? await readFile(RSP_RULES_PATH, 'utf-8') : null
      if (existingRules !== bundledRules) {
        await rollbackJournal.capture(RSP_RULES_PATH)
        await writeManagedFile(RSP_RULES_PATH, bundledRules, 'fallback protocol')
        await rollbackJournal.mark(RSP_RULES_PATH)
        actions.push('rsp-rules.md updated')
        if (!options.quiet)
          console.log(`  ${pc.green('✓')} rsp-rules.md updated`)
        updated = true
      }

      if (existsSync(OBSOLETE_RSP_RULES_PATH)) {
        await rollbackJournal.capture(OBSOLETE_RSP_RULES_PATH)
        await rm(OBSOLETE_RSP_RULES_PATH)
        await rollbackJournal.mark(OBSOLETE_RSP_RULES_PATH)
        actions.push('obsolete rules/rsp-rules.md removed')
        if (!options.quiet)
          console.log(`  ${pc.green('✓')} obsolete rules/rsp-rules.md removed`)
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
        if (!options.quiet)
          console.log(`  ${pc.green('✓')} empty rules directory tree removed`)
        updated = true
        inspection = await inspectUnsupportedRules()
      }

      const residualEntries = inspection.entries.map(entry => entry.path)
      if (!options.quiet && inspection.diagnostics.length > 0) {
        console.log(`  ${pc.red('Error:')} migration inspection incomplete:`)
        for (const diagnostic of inspection.diagnostics)
          console.log(`    ${diagnostic.path}: ${diagnostic.message}`)
        console.log(`  ${pc.dim('Fix access to .rsp/rules/, then run rsp update again.')}`)
        console.log()
      }
      if (!options.quiet && residualEntries.length > 0) {
        console.log(`  ${pc.yellow('Warning:')} these entries are no longer read by RSP:`)
        for (const path of residualEntries)
          console.log(`    .rsp/rules/${path}`)
        console.log(`  ${pc.dim('Move stable scoped instructions to the nearest project-owned AGENTS.md, then remove the old files.')}`)
        console.log(`  ${pc.dim('Run: rsp doctor')}`)
        console.log()
      }

      const projectName = await detectProjectName()
      const baseAgents = agentsInspection.exists
        ? await readFile(agentsPath, 'utf-8')
        : `# ${projectName}

`
      const nextAgents = upsertRspAgentsBlock(baseAgents)
      if (!agentsInspection.exists || nextAgents.changed) {
        await rollbackJournal.capture(agentsPath)
        await writeManagedFile(agentsPath, nextAgents.content, 'AGENTS.md')
        await rollbackJournal.mark(agentsPath)
        actions.push('AGENTS.md managed block refreshed')
        if (!options.quiet)
          console.log(`  ${pc.green('✓')} AGENTS.md managed block refreshed`)
        updated = true
      }

      const decisionRecordsDirectoryChain = await rollbackJournal.captureDirectoryChain(decisionRecordsPath)
      const decisionRecordsPlaceholder = join(decisionRecordsPath, '.gitkeep')
      await rollbackJournal.capture(decisionRecordsPlaceholder)
      if (await ensureDecisionRecordsDirectory(decisionRecordsPath)) {
        await rollbackJournal.mark(decisionRecordsPlaceholder)
        await rollbackJournal.markAll(decisionRecordsDirectoryChain)
        actions.push(`Decision Record directory ensured: ${decisionRecordsPath}`)
        if (!options.quiet)
          console.log(`  ${pc.green('✓')} Decision Record directory ensured: ${decisionRecordsPath}`)
        updated = true
      }

      const legacyArchiveIndexPath = join(RSP_DIR, 'archives', 'INDEX.md')
      await rollbackJournal.capture(legacyArchiveIndexPath)
      if (await removeLegacyArchiveIndex()) {
        await rollbackJournal.mark(legacyArchiveIndexPath)
        actions.push('legacy Archive Index removed')
        if (!options.quiet)
          console.log(`  ${pc.green('✓')} legacy Archive Index removed`)
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
        if (!options.quiet) {
          console.log(`  ${pc.green('✓')} generated Specs indexes removed`)
          for (const path of removedSpecsIndexes)
            console.log(`    ${path}`)
        }
        updated = true
      }

      if (!options.quiet && inspection.diagnostics.length > 0) {
        console.log(`  ${pc.red('Managed update incomplete; migration inspection failed.')}\n`)
        console.log(SKILL_REFRESH_HINT)
      }
      else if (!options.quiet && residualEntries.length > 0) {
        console.log(`  ${pc.yellow(updated ? 'Managed update complete; manual migration remains.' : 'Managed files are up to date; manual migration remains.')}\n`)
        console.log(SKILL_REFRESH_HINT)
      }
      else if (!options.quiet && !updated) {
        console.log(`  ${pc.dim('Already up to date.')}\n`)
        console.log(SKILL_REFRESH_HINT)
      }
      else if (!options.quiet) {
        console.log(`  ${pc.green('Update complete.')}\n`)
        console.log(SKILL_REFRESH_HINT)
      }

      return {
        actions,
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
