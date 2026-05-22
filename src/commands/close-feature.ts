import { existsSync } from 'node:fs'
import { appendFile, mkdir, readdir, readFile, rename, rmdir, unlink, writeFile } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'

import { ACTIVE_DIR, pc, RSP_DIR } from '../core/config.js'
import { parseFrontmatter, walkMarkdownFiles } from '../core/helpers.js'
import { withRspLock } from '../core/lock.js'
import { buildArchiveIndex } from './archive-index.js'
import { runCheck } from './check.js'

/**
 * Archive a completed feature: moves the feature file to .rsp/archive/,
 * clears active markers, updates archive index, and optionally
 * appends the extracted spec summary to .rsp/spec/INDEX.md.
 */
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

    const date = new Date().toISOString().slice(0, 10)
    const dir = dirname(name)
    const base = basename(name)
    const archiveSubdir = dir !== '.' ? join(RSP_DIR, 'archive', dir) : join(RSP_DIR, 'archive')
    const archiveName = `${date}_${base}.md`

    await mkdir(archiveSubdir, { recursive: true })
    await rename(srcPath, join(archiveSubdir, archiveName))

    let activeCleared = false
    const activeEntry = join(ACTIVE_DIR, name)
    if (existsSync(activeEntry)) {
      await unlink(activeEntry)
      // Clean up empty parent directories
      let parent = dirname(activeEntry)
      while (parent !== ACTIVE_DIR) {
        try {
          const remaining = await readdir(parent)
          if (remaining.length === 0)
            await rmdir(parent)
          else
            break
        }
        catch { break }
        parent = dirname(parent)
      }
      activeCleared = true
    }

    const clearedMsg = activeCleared ? `  ${pc.dim('active.d cleared')}\n` : ''

    console.log(`  ${pc.green('Archived:')} ${archiveName}\n${clearedMsg}`)

    await buildArchiveIndex({ acquireLock: false })

    // Run check if the feature has dependents (check depends-on across all features)
    await runCheckIfHasDependents(name)

    // Append extracted spec summary to spec INDEX
    await updateSpecIndex(name, date)

    if (existsSync('.git')) {
      const archiveRelPath = dir !== '.' ? join(dir, archiveName) : archiveName
      console.log(`  ${pc.cyan('Git workflow:')}\n`)
      console.log(`    git add .rsp/archive/${archiveRelPath}`)
      console.log(`    git commit -m "feat: complete ${name}"`)
      console.log()
    }
  })
}

/** Check if any remaining feature depends on the archived one, and run validation. */
async function runCheckIfHasDependents(name: string) {
  try {
    const featuresDir = join(RSP_DIR, 'features')
    const allFeatureFiles = await walkMarkdownFiles(featuresDir)
    let hasDependents = false
    for (const fp of allFeatureFiles) {
      const content = await readFile(fp, 'utf-8')
      const fm = parseFrontmatter(content)
      if (!fm || !fm['depends-on'])
        continue
      const deps = Array.isArray(fm['depends-on']) ? fm['depends-on'] : [fm['depends-on']]
      if (deps.includes(name)) {
        hasDependents = true
        break
      }
    }
    if (hasDependents)
      await runCheck()
  }
  catch {
    console.warn(`  ${pc.dim('⚠ could not verify dependents for')} "${name}"`)
  }
}
async function updateSpecIndex(name: string, date: string) {
  const specIndexPath = join(RSP_DIR, 'spec', 'INDEX.md')
  const archiveDir = join(RSP_DIR, 'archive')
  const escaped = name.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')
  const lineRe = new RegExp(`^\\| \\d{4}-\\d{2}-\\d{2} \\| ${escaped} \\|`, 'm')
  const archiveFile = (await (async () => {
    try {
      const entries = await walkMarkdownFiles(archiveDir)
      return entries.find(fp => basename(fp).startsWith(`${date}_`) && basename(fp).endsWith('.md'))
    }
    catch { return null }
  })())

  let summary = '—'
  if (archiveFile) {
    try {
      const content = await readFile(join(archiveDir, archiveFile), 'utf-8')
      // eslint-disable-next-line regexp/no-super-linear-backtracking
      const m = content.match(/^## Spec[\s\S]*?\n- Summary:[ \t]*([^\n]+)$/m)
      if (m)
        summary = m[1].trim()
    }
    catch { /* ignore parse errors */ }
  }

  const line = `| ${date} | ${name} | ${summary} |\n`

  try {
    let existing = ''
    if (existsSync(specIndexPath))
      existing = await readFile(specIndexPath, 'utf-8')

    if (lineRe.test(existing))
      return

    if (!existing.includes('| Date | Feature | Summary |')) {
      await writeFile(specIndexPath, `# Spec Index\n\n| Date | Feature | Summary |\n|------|---------|---------|\n${line}\n`)
    }
    else {
      await appendFile(specIndexPath, line)
    }
  }
  catch { /* best effort */ }
}
