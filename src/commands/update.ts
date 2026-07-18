import type { RuntimeDiagnostic } from '../types.js'
import { existsSync } from 'node:fs'
import { readFile, rm, rmdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { OBSOLETE_RSP_RULES_PATH, pc, PKG_ROOT, RSP_DIR, RSP_RULES_PATH } from '../core/config.js'
import { detectProjectName, inspectUnsupportedRules, upsertRspAgentsBlock } from '../core/helpers.js'
import { withRspLock } from '../core/lock.js'
import { buildArchiveIndex } from './archive-index.js'
import { buildSpecsIndex } from './specs-index.js'

const SKILL_REFRESH_HINT = '  Note: if you use the published RSP skill, refresh it too:\n    npx skills add oevery/rsp\n'

export interface UpdateOptions {
  quiet?: boolean
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

/**
 * Refresh RSP project structure after upgrade:
 * - Update bundled rsp-rules.md
 * - Refresh AGENTS.md managed block
 * - Regenerate INDEX files
 */
export async function updateProject(options: UpdateOptions = {}): Promise<UpdateResult> {
  if (!existsSync(RSP_DIR)) {
    console.error(`  ${pc.red('Error:')} RSP is not initialized in this project`)
    console.error(`  ${pc.dim('Run: rsp init')}`)
    process.exit(1)
  }

  return withRspLock('update', async () => {
    let updated = false
    const actions: string[] = []

    const bundledRules = await readFile(join(PKG_ROOT, 'rules', 'rsp-rules.md'), 'utf-8')
    const existingRules = existsSync(RSP_RULES_PATH) ? await readFile(RSP_RULES_PATH, 'utf-8') : null
    if (existingRules !== bundledRules) {
      await writeFile(RSP_RULES_PATH, bundledRules)
      actions.push('rsp-rules.md updated')
      if (!options.quiet)
        console.log(`  ${pc.green('✓')} rsp-rules.md updated`)
      updated = true
    }

    if (existsSync(OBSOLETE_RSP_RULES_PATH)) {
      await rm(OBSOLETE_RSP_RULES_PATH)
      actions.push('obsolete rules/rsp-rules.md removed')
      if (!options.quiet)
        console.log(`  ${pc.green('✓')} obsolete rules/rsp-rules.md removed`)
      updated = true
    }

    try {
      await rmdir(join(RSP_DIR, 'rules'))
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
      for (const path of directories)
        await rmdir(join(RSP_DIR, 'rules', path))
      await rmdir(join(RSP_DIR, 'rules'))
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

    const agentsPath = 'AGENTS.md'
    const projectName = await detectProjectName()
    const baseAgents = existsSync(agentsPath)
      ? await readFile(agentsPath, 'utf-8')
      : `# ${projectName}

`
    const nextAgents = upsertRspAgentsBlock(baseAgents)
    if (!existsSync(agentsPath) || nextAgents.changed) {
      await writeFile(agentsPath, nextAgents.content)
      actions.push('AGENTS.md managed block refreshed')
      if (!options.quiet)
        console.log(`  ${pc.green('✓')} AGENTS.md managed block refreshed`)
      updated = true
    }

    const specsIndexChanged = await buildSpecsIndex({ acquireLock: false, quiet: options.quiet })
    const archiveIndexChanged = await buildArchiveIndex({ acquireLock: false, quiet: options.quiet })
    if (specsIndexChanged || archiveIndexChanged) {
      actions.push('generated indexes rebuilt')
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
  })
}
