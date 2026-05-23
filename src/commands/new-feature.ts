import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

import { ACTIVE_DIR, ARCHIVES_DIR, pc, RSP_DIR } from '../core/config.js'
import { generateFeatureContent } from '../core/helpers.js'
import { withRspLock } from '../core/lock.js'
import { buildArchiveIndex } from './archive-index.js'

/**
 * Create a new feature file under .rsp/features/<name>.md.
 */
export async function newFeature(name: string, summary = '') {
  if (!name) {
    console.error(`  ${pc.red('Usage:')} rsp new <name> [summary]`)
    process.exit(1)
  }
  if (/^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/.test(name) === false) {
    console.error(`  ${pc.red('Error:')} feature name must be kebab-case with optional subdirectory (lowercase, digits, hyphens, slashes)`)
    process.exit(1)
  }
  if (name === 'init') {
    console.error(`  ${pc.red('Error:')} "init" is a reserved workflow name, not a feature name`)
    process.exit(1)
  }

  const rspRulesPath = join(RSP_DIR, 'rules', 'rsp-rules.md')
  const designPath = join(RSP_DIR, 'specs', 'design.md')
  if (!existsSync(rspRulesPath) || !existsSync(designPath)) {
    console.error(`  ${pc.red('Error:')} RSP is not initialized in this project`)
    console.error(`  ${pc.dim('Run: rsp init')}`)
    process.exit(1)
  }

  return withRspLock('new-feature', async () => {

    const featurePath = join(RSP_DIR, 'features', `${name}.md`)
    await mkdir(dirname(featurePath), { recursive: true })

    const existed = existsSync(featurePath)
    if (!existed) {
      const content = generateFeatureContent(name, summary)
      await writeFile(featurePath, content)
    }

    await mkdir(ACTIVE_DIR, { recursive: true })
    const activeEntry = join(ACTIVE_DIR, name)
    await mkdir(dirname(activeEntry), { recursive: true })
    await writeFile(activeEntry, '')

    if (!existed) {
      const archiveIndex = join(ARCHIVES_DIR, 'INDEX.md')
      if (existsSync(archiveIndex))
        await buildArchiveIndex({ acquireLock: false })
    }

    const label = existed ? 'Using' : pc.green('Created')
    console.log(`  ${label}: ${featurePath}\n  ${pc.dim('active.d')} → ${name}\n`)
  })
}
