import type { InitArgs } from '../types.js'
import type { SkillUpdateResult } from './skills.js'
import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { generateChangeContent, generateDesignContent, upsertRspAgentsBlock } from '../core/artifacts.js'
import { CHANGES_DIR, clearConfigCache, CONFIG_PATH, FOCUS_DIR, generateConfigTemplate, inspectRspConfig, OBSOLETE_RSP_RULES_PATH, RSP_DIR, RSP_RULES_PATH } from '../core/config.js'
import { resolveDecisionRecordsPath, validateDecisionRecordsFilesystemPath } from '../core/decisions.js'
import { detectProjectName } from '../core/filesystem.js'
import { withRspLock } from '../core/lock.js'
import { requireManagedDirectory, requireManagedFile, resolveManagedDirectoryChain } from '../core/managed-path.js'
import { PROJECT_VERSION_PATH, selectProjectRuntime } from '../core/project-version.js'
import { updateSetupFile } from '../core/setup-files.js'
import { resolveFocusMarkerPath, resolveWorkRef } from '../core/work-ref.js'
import { updatePackagedSkills } from './skills.js'

export { generateConfigTemplate }

export type InitProjectResult
  = | { ok: false, message: string }
    | { ok: true, isNew: boolean, created: boolean, decisionRecordsPath: string, withProjectSetup: boolean, agentsUpdated: boolean, skills: SkillUpdateResult, managedAgents?: string }

export async function initProject(args: InitArgs = {}): Promise<InitProjectResult> {
  const isNew = !existsSync(RSP_DIR)
  const projectName = await detectProjectName()
  const mode = args.agentsMode ?? 'managed'
  if (mode !== 'managed' && mode !== 'print')
    return { ok: false, message: 'unsupported --agents-mode; use managed or print' }

  return withRspLock('init', async () => {
    const runtime = await selectProjectRuntime()
    const { version } = runtime
    const retiredRules = [RSP_RULES_PATH, OBSOLETE_RSP_RULES_PATH].map(path => requireManagedFile(path, 'retired Rules', { allowMissing: true })).some(Boolean)
    if (retiredRules)
      return { ok: false as const, message: 'Retired RSP assets require migration; use the selected target CLI: rsp update' }
    requireManagedFile('AGENTS.md', 'AGENTS.md', { allowMissing: true })
    clearConfigCache()
    const inspection = await inspectRspConfig()
    if (inspection.issues.length)
      throw new Error(inspection.issues.join('; '))
    const decisionRecordsPath = resolveDecisionRecordsPath(inspection.config)
    const pathIssue = await validateDecisionRecordsFilesystemPath(decisionRecordsPath)
    if (pathIssue)
      throw new Error(pathIssue)
    const dirs = [join(RSP_DIR, 'specs'), CHANGES_DIR, FOCUS_DIR, join(RSP_DIR, 'archives'), decisionRecordsPath]
    for (const path of dirs)
      resolveManagedDirectoryChain(process.cwd(), path.split('/'), 'project directory')
    const completed: string[] = []
    async function ensureFile(path: string, content: string) {
      if (await updateSetupFile(path, current => current ?? content))
        completed.push(`created ${path}`)
    }
    try {
      const skills = await updatePackagedSkills()
      completed.push(...skills.installed.map(name => `installed ${name}`), ...skills.replaced.map(name => `updated ${name}`), ...skills.removed.map(name => `removed ${name}`))
      for (const path of dirs) {
        if (!requireManagedDirectory(path, 'project directory', { allowMissing: true })) {
          await mkdir(path, { recursive: true })
          requireManagedDirectory(path, 'project directory')
          completed.push(`created ${path}`)
        }
      }
      await ensureFile(CONFIG_PATH, generateConfigTemplate())
      clearConfigCache()
      await ensureFile(join(RSP_DIR, 'specs/design.md'), generateDesignContent(projectName))
      if ((await readdir(decisionRecordsPath)).length === 0)
        await ensureFile(join(decisionRecordsPath, '.gitkeep'), '')
      await ensureFile(join(CHANGES_DIR, '.gitkeep'), '')
      await ensureFile(join(FOCUS_DIR, '.gitkeep'), '')
      await ensureFile(join(RSP_DIR, '.gitignore'), '# Transient files that should not be committed\n.lock\n')
      if (args.withProjectSetup) {
        const work = resolveWorkRef('project-setup', { executable: true })
        await ensureFile(work.path, generateChangeContent('project-setup'))
        await ensureFile(resolveFocusMarkerPath(work), '')
      }
      const title = projectName.startsWith('@') ? projectName.split('/')[1] || projectName : projectName
      const agentsUpdated = await updateSetupFile('AGENTS.md', current => upsertRspAgentsBlock(current ?? `# ${title}\n\n`, runtime).content)
      if (agentsUpdated)
        completed.push('updated AGENTS.md managed block')
      if (runtime.mode === 'package' && await updateSetupFile(PROJECT_VERSION_PATH, () => `${version}\n`))
        completed.push(`pinned ${version}`)
      return { ok: true as const, isNew, created: completed.length > 0, decisionRecordsPath, withProjectSetup: Boolean(args.withProjectSetup), agentsUpdated, skills, managedAgents: mode === 'print' ? await readFile('AGENTS.md', 'utf8') : undefined }
    }
    catch (error) {
      throw new Error(`Init stopped; completed: ${completed.join(', ') || 'none'}. No rollback was attempted. Fix the cause and rerun init with the same target CLI. ${error instanceof Error ? error.message : String(error)}`, { cause: error })
    }
  })
}
