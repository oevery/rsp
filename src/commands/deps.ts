import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { pc, RSP_DIR } from '../core/config.js'
import { featureNameFromPath, parseFrontmatter, walkMarkdownFiles } from '../core/helpers.js'

interface DepsOptions {
  mermaid?: boolean
  focus?: string
  reverse?: string
}

/**
 * Display feature dependency relationships.
 * With --mermaid, outputs a Mermaid.js graph instead of a table.
 */
export async function showDependencies(options: boolean | DepsOptions = false) {
  const resolved = typeof options === 'boolean' ? { mermaid: options } : options
  const mermaid = Boolean(resolved.mermaid)
  const focus = resolved.focus?.trim()
  const reverse = resolved.reverse?.trim()

  if (focus && reverse)
    throw new Error('Use either --focus or --reverse, not both')

  const featuresDir = join(RSP_DIR, 'features')
  const featureFiles = existsSync(featuresDir) ? await walkMarkdownFiles(featuresDir) : []

  console.log()
  console.log(`  ${pc.bold('RSP dependencies')}`)
  console.log()

  if (featureFiles.length === 0) {
    console.log(`  ${pc.dim('No features found.')}\n`)
    return
  }

  interface DepRecord {
    name: string
    deps: string[]
  }
  const records: DepRecord[] = []
  const dependents = new Map<string, string[]>()

  for (const fp of featureFiles) {
    const name = featureNameFromPath(featuresDir, fp)
    let content: string
    try {
      content = await readFile(fp, 'utf-8')
    }
    catch {
      continue
    }
    const fm = parseFrontmatter(content)
    const depsRaw = fm?.['depends-on']
      ? (Array.isArray(fm['depends-on']) ? fm['depends-on'] : [fm['depends-on']])
      : []
    const deps = depsRaw.filter(Boolean)
    records.push({ name, deps })

    for (const dep of deps) {
      const list = dependents.get(dep) || []
      list.push(name)
      dependents.set(dep, list)
    }
  }

  let visibleRecords = [...records]
  if (focus) {
    const related = new Set<string>([focus])
    const target = records.find(record => record.name === focus)
    if (target) {
      for (const dep of target.deps)
        related.add(dep)
    }
    for (const dependent of dependents.get(focus) || [])
      related.add(dependent)
    visibleRecords = records.filter(record => related.has(record.name))
  }
  else if (reverse) {
    const related = new Set<string>(dependents.get(reverse) || [])
    visibleRecords = records.filter(record => related.has(record.name))
  }

  if ((focus || reverse) && visibleRecords.length === 0) {
    console.log(`  ${pc.dim('No dependency matches found for the current filter.')}\n`)
    return
  }

  if (mermaid) {
    console.log('```mermaid')
    console.log('graph LR')
    const safeId = (s: string) => s.replace(/\//g, '__slash__').replace(/\W/g, '_')
    for (const { name } of visibleRecords) {
      const id = safeId(name)
      const label = name.replace(/"/g, '#quot;')
      console.log(`    ${id}["${label}"]`)
    }
    const visibleNames = new Set(visibleRecords.map(record => record.name))
    for (const { name, deps } of visibleRecords) {
      const fromId = safeId(name)
      for (const dep of deps) {
        if (!visibleNames.has(dep))
          continue
        const toId = safeId(dep)
        console.log(`    ${fromId} --> ${toId}`)
      }
    }
    console.log('```')
    console.log()
    return
  }

  // Table output
  console.log(`  ${'Feature'.padEnd(28)} ${'Depends On'.padEnd(28)} Dependents`)
  console.log(`  ${'─'.repeat(28)} ${'─'.repeat(28)} ──────────`)

  for (const { name, deps } of visibleRecords.sort((a, b) => a.name.localeCompare(b.name))) {
    const depText = deps.length > 0 ? deps.join(', ') : '—'
    const dependentText = (dependents.get(name) || []).length > 0
      ? pc.dim((dependents.get(name) || []).join(', '))
      : '—'
    console.log(`  ${name.padEnd(28)} ${depText.padEnd(28)} ${dependentText}`)
  }

  console.log()
}
