import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { pc, PKG_ROOT, RSP_DIR } from '../core/config.js'
import { detectProjectName, upsertRspAgentsBlock } from '../core/helpers.js'
import { withRspLock } from '../core/lock.js'
import { buildArchiveIndex } from './archive-index.js'
import { buildSpecsIndex } from './specs-index.js'

const SKILL_REFRESH_HINT = '  Note: if you use the published RSP skill, refresh it too:\n    npx skills add oevery/rsp\n'

export interface UpdateOptions {
  quiet?: boolean
}

/**
 * Refresh RSP project structure after upgrade:
 * - Update bundled rsp-rules.md
 * - Refresh AGENTS.md managed block
 * - Regenerate INDEX files
 */
export async function updateProject(options: UpdateOptions = {}): Promise<string[]> {
  if (!existsSync(RSP_DIR)) {
    console.error(`  ${pc.red('Error:')} RSP is not initialized in this project`)
    console.error(`  ${pc.dim('Run: rsp init')}`)
    process.exit(1)
  }

  return withRspLock('update', async () => {
    let updated = false
    const actions: string[] = []

    const bundledRules = await readFile(join(PKG_ROOT, 'rules', 'rsp-rules.md'), 'utf-8')
    const rulesPath = join(RSP_DIR, 'rules', 'rsp-rules.md')
    await mkdir(join(RSP_DIR, 'rules'), { recursive: true })
    const existingRules = existsSync(rulesPath) ? await readFile(rulesPath, 'utf-8') : null
    if (existingRules !== bundledRules) {
      await writeFile(rulesPath, bundledRules)
      actions.push('rules/rsp-rules.md updated')
      if (!options.quiet)
        console.log(`  ${pc.green('✓')} rules/rsp-rules.md updated`)
      updated = true
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

    await buildSpecsIndex({ acquireLock: false, quiet: options.quiet })
    await buildArchiveIndex({ acquireLock: false, quiet: options.quiet })
    actions.push('generated indexes rebuilt')

    if (!options.quiet && !updated) {
      console.log(`  ${pc.dim('Already up to date.')}\n`)
      console.log(SKILL_REFRESH_HINT)
    }
    else if (!options.quiet) {
      console.log(`  ${pc.green('Update complete.')}\n`)
      console.log(SKILL_REFRESH_HINT)
    }

    return actions
  })
}
