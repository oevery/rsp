import { existsSync } from 'node:fs'
import { readFile, stat } from 'node:fs/promises'
import { join, relative } from 'node:path'

import { ACTIVE_DIR, pc, RSP_DIR } from '../core/config.js'
import { countCheckboxes, featureNameFromPath, parseFrontmatter, walkFiles, walkMarkdownFiles } from '../core/helpers.js'

/** Width constants for table columns */
const COL_FEATURE = 30
const COL_STATUS = 16
const COL_AGE = 7
const COL_PROGRESS = 10

/** A single feature record for the status table */
interface StatusRecord {
  name: string
  status: string
  progress: string
  age: string
  depends: string
  isActive: boolean
  isBlocked: boolean
}

/**
 * Display project status: active features, progress, dependencies,
 * blocked items, feature age, and archive trends.
 */
export async function showStatus() {
  const featuresDir = join(RSP_DIR, 'features')

  const activeSet = new Set<string>()

  if (existsSync(ACTIVE_DIR)) {
    try {
      const entries = await walkFiles(ACTIVE_DIR)
      for (const entryPath of entries) {
        const name = relative(ACTIVE_DIR, entryPath)
        activeSet.add(name)
      }
    }
    catch { /* ignore */ }
  }

  const featureFiles = existsSync(featuresDir) ? await walkMarkdownFiles(featuresDir) : []
  const featureMap: Record<string, string> = {}
  for (const fp of featureFiles) {
    const name = featureNameFromPath(featuresDir, fp)
    featureMap[name] = fp
  }

  console.log()
  console.log(`  ${pc.bold('RSP status')}`)
  console.log()

  // Active features line
  if (activeSet.size > 0) {
    console.log(`  ${pc.cyan('Active:')} ${[...activeSet].join(', ')}`)
    console.log()
  }
  else {
    console.log(`  ${pc.dim('No active feature.')} Run: rsp new <name>`)
    console.log()
  }

  // Collect all names
  const allNames = [...new Set([...Object.keys(featureMap), ...activeSet])].sort()
  if (allNames.length === 0) {
    console.log(`  ${pc.dim('No features found.')} Run: rsp new <name>\n`)
    return
  }

  // Parse feature data
  const records: StatusRecord[] = []

  for (const name of allNames) {
    const fp = featureMap[name]
    let status = '—'
    let progress = '—'
    let depends = '—'
    let age = '—'
    const isActive = activeSet.has(name)
    let isBlocked = false

    if (fp) {
      try {
        const content = await readFile(fp, 'utf-8')
        const fm = parseFrontmatter(content)
        status = fm?.status || '—'
        isBlocked = status === 'blocked'
        if (fm?.['depends-on'])
          depends = Array.isArray(fm['depends-on']) ? fm['depends-on'].join(', ') : String(fm['depends-on'])
        const cb = countCheckboxes(content)
        progress = `${cb.done}/${cb.total}`

        // Compute age from file birthtime/mtime (same as getFeatureAge)
        const s = await stat(fp)
        const created = s.birthtime || s.mtime
        const diffMs = Date.now() - created.getTime()
        age = String(Math.floor(diffMs / (1000 * 60 * 60 * 24)))
      }
      catch { /* ignore */ }
    }
    else {
      status = '(missing)'
    }

    records.push({ name, status, progress, age, depends, isActive, isBlocked })
  }

  // Header
  const pad = (s: string, w: number) => s.padEnd(w)
  console.log(`  ${pad('Feature', COL_FEATURE)} ${pad('Status', COL_STATUS)} ${pad('Age(d)', COL_AGE)} ${pad('Progress', COL_PROGRESS)} Depends On`)
  console.log(`  ${'─'.repeat(COL_FEATURE)} ${'─'.repeat(COL_STATUS)} ${'─'.repeat(COL_AGE)} ${'─'.repeat(COL_PROGRESS)} ${'─'.repeat(30)}`)

  let blockedCount = 0

  for (const r of records) {
    const marker = r.isActive ? pc.cyan('*') : ' '
    const namePadded = r.name.padEnd(COL_FEATURE - 1)
    const statusPadded = String(r.status).padEnd(COL_STATUS)
    const agePadded = r.age.padEnd(COL_AGE)
    const progressPadded = r.progress.padEnd(COL_PROGRESS)

    const nameDisplay = r.isBlocked ? pc.yellow(namePadded) : namePadded
    const statusDisplay = r.isBlocked ? pc.yellow(statusPadded) : statusPadded
    const ageDisplay = r.isActive ? pc.cyan(agePadded) : agePadded

    console.log(`  ${marker}${nameDisplay} ${statusDisplay} ${ageDisplay} ${progressPadded} ${r.depends}`)

    if (r.isBlocked)
      blockedCount++
  }

  console.log()

  // Summary block
  const total = records.length
  const doneCount = records.filter(r => r.status === 'done').length

  console.log(`  ${pc.bold('Summary:')} ${total} feature(s), ${activeSet.size} active, ${doneCount} done, ${pc.yellow(String(blockedCount))} blocked`)
  console.log()

  // Archive trend
  await showArchiveTrend()

  // Blocked features highlight
  if (blockedCount > 0) {
    const blocked = records.filter(r => r.isBlocked)
    console.log(`  ${pc.yellow('Blocked:')} ${blocked.map(r => r.name).join(', ')}`)
    console.log()
  }
}

/** Display archive trend: count per month from archive INDEX.md. */
async function showArchiveTrend() {
  const archiveDir = join(RSP_DIR, 'archive')
  const indexPath = join(archiveDir, 'INDEX.md')

  if (!existsSync(indexPath))
    return

  try {
    const content = await readFile(indexPath, 'utf-8')
    const dateRe = /^\| (\d{4}-\d{2})-\d{2} \|/gm
    const counts: Record<string, number> = {}
    let match
    // eslint-disable-next-line no-cond-assign
    while ((match = dateRe.exec(content)) !== null) {
      const month = match[1]
      counts[month] = (counts[month] || 0) + 1
    }

    const months = Object.keys(counts).sort()
    if (months.length === 0)
      return

    console.log(`  ${pc.bold('Archive trend:')}`)
    const bar = months.map((m) => {
      const n = counts[m]
      return pc.dim(`${m} ${'█'.repeat(Math.min(n, 20))} ${n}`)
    }).join('\n  ')
    console.log(`  ${bar}`)
    console.log()
  }
  catch { /* ignore */ }
}
