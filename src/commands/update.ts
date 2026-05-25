import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { pc, PKG_ROOT, RSP_DIR } from '../core/config.js'
import { detectProjectName, upsertRspAgentsBlock } from '../core/helpers.js'
import { withRspLock } from '../core/lock.js'
import { buildArchiveIndex } from './archive-index.js'
import { buildSpecsIndex } from './specs-index.js'

/**
 * Refresh RSP project structure after upgrade:
 * - Update bundled rsp-rules.md
 * - Refresh AGENTS.md managed block
 * - Regenerate INDEX files
 */
export async function updateProject() {
  if (!existsSync(RSP_DIR)) {
    console.log(`  ${pc.red('Error:')} RSP is not initialized. Run: rsp init`)
    process.exit(1)
  }

  return withRspLock('update', async () => {
    let updated = false

    const bundledRules = await readFile(join(PKG_ROOT, 'rules', 'rsp-rules.md'), 'utf-8')
    const rulesPath = join(RSP_DIR, 'rules', 'rsp-rules.md')
    await mkdir(join(RSP_DIR, 'rules'), { recursive: true })
    const existingRules = existsSync(rulesPath) ? await readFile(rulesPath, 'utf-8') : null
    if (existingRules !== bundledRules) {
      await writeFile(rulesPath, bundledRules)
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
      console.log(`  ${pc.green('✓')} AGENTS.md managed block refreshed`)
      updated = true
    }

    await buildSpecsIndex({ acquireLock: false })
    await buildArchiveIndex({ acquireLock: false })

    if (!updated)
      console.log(`  ${pc.dim('Already up to date.')}\n`)
    else
      console.log(`  ${pc.green('Update complete.')}\n`)
  })
}
