import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { pc, RSP_DIR } from '../core/config.js'
import { featureNameFromPath, parseFrontmatter, walkMarkdownFiles } from '../core/helpers.js'

/**
 * Display feature dependency relationships.
 * With --mermaid, outputs a Mermaid.js graph instead of a table.
 */
export async function showDependencies(mermaid = false) {
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

  if (mermaid) {
    console.log('```mermaid')
    console.log('graph LR')
    const safeId = (s: string) => s.replace(/\//g, '__slash__').replace(/\W/g, '_')
    for (const { name } of records) {
      const id = safeId(name)
      const label = name.replace(/"/g, '#quot;')
      console.log(`    ${id}["${label}"]`)
    }
    for (const { name, deps } of records) {
      const fromId = safeId(name)
      for (const dep of deps) {
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

  for (const { name, deps } of records.sort((a, b) => a.name.localeCompare(b.name))) {
    const depText = deps.length > 0 ? deps.join(', ') : '—'
    const dependentText = (dependents.get(name) || []).length > 0
      ? pc.dim((dependents.get(name) || []).join(', '))
      : '—'
    console.log(`  ${name.padEnd(28)} ${depText.padEnd(28)} ${dependentText}`)
  }

  console.log()
}
