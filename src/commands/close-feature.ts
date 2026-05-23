import { existsSync } from 'node:fs'
import { mkdir, readdir, readFile, rename, rmdir, unlink } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'

import { ACTIVE_DIR, ARCHIVES_DIR, pc, RSP_DIR } from '../core/config.js'
import { parseFrontmatter, walkMarkdownFiles } from '../core/helpers.js'
import { withRspLock } from '../core/lock.js'
import { buildArchiveIndex } from './archive-index.js'
import { runCheck } from './check.js'

/** Archive a completed feature and clear its active marker. */
export async function closeFeature(name: string) {
  return withRspLock('close-feature', async () => {
    if (!name) {
      console.error(`  ${pc.red('Usage:')} rsp close <name>`)
      process.exit(1)
    }
    if (/^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/.test(name) === false) {
      console.error(`  ${pc.red('Error:')} feature name must be kebab-case with optional subdirectory (lowercase, digits, hyphens, slashes)`)
      process.exit(1)
    }

    const srcPath = join(RSP_DIR, 'features', `${name}.md`)
    if (!existsSync(srcPath)) {
      console.error(`  ${pc.red('Feature not found:')} .rsp/features/${name}.md`)
      process.exit(1)
    }

    const dependents = await findDependents(name)
    if (dependents.length > 0) {
      console.error(`  ${pc.red('Error:')} cannot close "${name}" because it is still referenced by: ${dependents.join(', ')}`)
      console.error(`  ${pc.dim('Remove or update those depends-on entries before archiving this feature.')}`)
      process.exit(1)
    }

    const date = new Date().toISOString().slice(0, 10)
    const dir = dirname(name)
    const base = basename(name)
    const archiveSubdir = dir !== '.' ? join(ARCHIVES_DIR, dir) : ARCHIVES_DIR
    const archiveName = `${date}_${base}.md`

    await mkdir(archiveSubdir, { recursive: true })
    await rename(srcPath, join(archiveSubdir, archiveName))

    let activeCleared = false
    const activeEntry = join(ACTIVE_DIR, name)
    if (existsSync(activeEntry)) {
      await unlink(activeEntry)
      let parent = dirname(activeEntry)
      while (parent !== ACTIVE_DIR) {
        try {
          const remaining = await readdir(parent)
          if (remaining.length === 0)
            await rmdir(parent)
          else
            break
        }
        catch {
          break
        }
        parent = dirname(parent)
      }
      activeCleared = true
    }

    const clearedMsg = activeCleared ? `  ${pc.dim('active.d cleared')}\n` : ''
    console.log(`  ${pc.green('Archived:')} ${archiveName}\n${clearedMsg}`)

    await buildArchiveIndex({ acquireLock: false })
    await runCheckIfHasDependents(name)

    if (existsSync('.git')) {
      const archiveRelPath = dir !== '.' ? join(dir, archiveName) : archiveName
      console.log(`  ${pc.cyan('Git workflow:')}\n`)
      console.log(`    git add .rsp/archives/${archiveRelPath}`)
      console.log(`    git commit -m "feat: complete ${name}"`)
      console.log()
    }
  })
}

async function findDependents(name: string): Promise<string[]> {
  const featuresDir = join(RSP_DIR, 'features')
  const allFeatureFiles = await walkMarkdownFiles(featuresDir)
  const dependents: string[] = []

  for (const fp of allFeatureFiles) {
    const featureName = fp === join(featuresDir, `${name}.md`)
      ? name
      : fp.replace(`${featuresDir}/`, '').replace(/\.md$/, '')

    if (featureName === name)
      continue

    const content = await readFile(fp, 'utf-8')
    const fm = parseFrontmatter(content)
    if (!fm || !fm['depends-on'])
      continue

    const deps = Array.isArray(fm['depends-on']) ? fm['depends-on'] : [fm['depends-on']]
    if (deps.includes(name))
      dependents.push(featureName)
  }

  return dependents.sort()
}

async function runCheckIfHasDependents(name: string) {
  try {
    const hasDependents = (await findDependents(name)).length > 0

    if (hasDependents)
      await runCheck()
  }
  catch {
    console.warn(`  ${pc.dim('⚠ could not verify dependents for')} "${name}"`)
  }
}
