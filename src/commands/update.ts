import type { RuntimeDiagnostic } from '../types.js'
import type { SkillUpdateResult } from './skills.js'
import { existsSync } from 'node:fs'
import { readFile, unlink } from 'node:fs/promises'
import { join } from 'node:path'
import { upsertRspAgentsBlock } from '../core/artifacts.js'
import { clearConfigCache, inspectRspConfig, OBSOLETE_RSP_RULES_PATH, RSP_DIR, RSP_RULES_PATH } from '../core/config.js'
import { detectProjectName, inspectUnsupportedRules } from '../core/filesystem.js'
import { withRspLock } from '../core/lock.js'
import { requireManagedFile, resolveManagedDirectoryChain } from '../core/managed-path.js'
import { PROJECT_VERSION_PATH, readProjectVersion, selectProjectVersion } from '../core/project-version.js'
import { updateSetupFile } from '../core/setup-files.js'
import { isLegacyArchiveIndex } from './archive-index-migration.js'
import { updatePackagedSkills } from './skills.js'
import { inspectGeneratedSpecsIndexMigration, removeGeneratedSpecsIndex } from './specs-index-migration.js'

export interface UpdateOptions { dryRun?: boolean }
export interface UpdateResult {
  ok: boolean
  actions: string[]
  updated: boolean
  skills?: SkillUpdateResult
  events: UpdateEvent[]
  migration: { inspectionComplete: boolean, manualMigrationRequired: boolean, residualEntries: string[], diagnostics: RuntimeDiagnostic[] }
}
export type UpdateEvent
  = | { type: 'updated', message: string }
    | { type: 'migration-diagnostics', diagnostics: RuntimeDiagnostic[] }
    | { type: 'residual-rules', entries: string[] }
    | { type: 'legacy-context-map' }
    | { type: 'not-initialized' }

export async function updateProject(options: UpdateOptions = {}): Promise<UpdateResult> {
  if (!existsSync(RSP_DIR))
    return { ok: false, actions: [], updated: false, events: [{ type: 'not-initialized' }], migration: { inspectionComplete: false, manualMigrationRequired: false, residualEntries: [], diagnostics: [] } }

  const execute = async (): Promise<UpdateResult> => {
    const version = await selectProjectVersion('update')
    clearConfigCache()
    const config = await inspectRspConfig()
    if (config.issues.length)
      throw new Error(config.issues.join('; '))
    resolveManagedDirectoryChain(process.cwd(), [RSP_DIR, 'rules'], 'retired Rules parent')
    const retired = [RSP_RULES_PATH, OBSOLETE_RSP_RULES_PATH].filter(path => requireManagedFile(path, 'retired Rules', { allowMissing: true }))
    const rules = await inspectUnsupportedRules()
    const migration = { inspectionComplete: rules.diagnostics.length === 0, manualMigrationRequired: rules.entries.length > 0, residualEntries: rules.entries.map(entry => entry.path), diagnostics: rules.diagnostics }
    if (!migration.inspectionComplete)
      return { ok: false, actions: [], updated: false, events: [{ type: 'migration-diagnostics', diagnostics: rules.diagnostics }], migration }
    requireManagedFile('AGENTS.md', 'AGENTS.md', { allowMissing: true })
    resolveManagedDirectoryChain(process.cwd(), [RSP_DIR, 'archives'], 'archive parent')
    requireManagedFile(join(RSP_DIR, 'archives/INDEX.md'), 'archive index', { allowMissing: true })
    const plan = await inspectGeneratedSpecsIndexMigration()
    if (!plan.inspectionComplete || plan.ownerControlled.length)
      throw new Error(`Generated Specs-index migration requires owner review before update: ${[...plan.ownerControlled, ...plan.diagnostics].join('; ')}`)
    const projectName = await detectProjectName()
    const agents = requireManagedFile('AGENTS.md', 'AGENTS.md', { allowMissing: true }) ? await readFile('AGENTS.md', 'utf8') : null
    const refreshAgents = (current: string | null) => upsertRspAgentsBlock(current ?? `# ${projectName}\n\n`, version).content
    const removeArchive = await isLegacyArchiveIndex()
    const actions: string[] = []
    const events: UpdateEvent[] = []
    if (existsSync('CONTEXT-MAP.md'))
      events.push({ type: 'legacy-context-map' })
    if (migration.residualEntries.length)
      events.push({ type: 'residual-rules', entries: migration.residualEntries })
    const record = (message: string) => {
      actions.push(message)
      events.push({ type: 'updated', message })
    }
    try {
      const skills = await updatePackagedSkills({ dryRun: options.dryRun })
      for (const name of skills.installed) record(`Skill installed: ${name}`)
      for (const name of skills.replaced) record(`Skill updated: ${name}`)
      for (const name of skills.removed) record(`retired Skill removed: ${name}`)
      if (options.dryRun) {
        actions.push(...retired.map(path => `retired Rules file removed: ${path}`), ...plan.removable.map(path => `generated Specs index removed: ${path}`))
        if (removeArchive)
          actions.push('legacy Archive Index removed')
        if (refreshAgents(agents) !== agents)
          actions.push('AGENTS.md managed block refreshed')
        if (await readProjectVersion() !== version)
          actions.push(`project CLI pinned to ${version}`)
        return { ok: true, actions, updated: false, skills, events: [], migration }
      }
      for (const path of retired) {
        if (requireManagedFile(path, 'retired Rules', { allowMissing: true })) {
          await unlink(path)
          record(`retired Rules file removed: ${path}`)
        }
      }
      for (const path of plan.removable) {
        if (await removeGeneratedSpecsIndex(path))
          record(`generated Specs index removed: ${path}`)
      }
      if (await isLegacyArchiveIndex()) {
        await unlink(join(RSP_DIR, 'archives/INDEX.md'))
        record('legacy Archive Index removed')
      }
      if (await updateSetupFile('AGENTS.md', refreshAgents))
        record('AGENTS.md managed block refreshed')
      if (await updateSetupFile(PROJECT_VERSION_PATH, () => `${version}\n`))
        record(`project CLI pinned to ${version}`)
      return { ok: true, actions, updated: actions.length > 0, skills, events, migration }
    }
    catch (error) {
      throw new Error(`Update stopped; completed: ${actions.join(', ') || 'none'}. No rollback was attempted. Fix the cause and rerun update with the same target CLI. ${error instanceof Error ? error.message : String(error)}`, { cause: error })
    }
  }
  return options.dryRun ? execute() : withRspLock('update', execute)
}
