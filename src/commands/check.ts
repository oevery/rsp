import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join, relative } from 'node:path'

import { ACTIVE_DIR, loadRspConfig, pc, resolvePriorities, resolveRequiredSections, resolveStatuses, RSP_DIR } from '../core/config.js'
import { detectCycles, detectDeltaSections, featureNameFromPath, parseFrontmatter, parseScenarios, walkFiles, walkMarkdownFiles } from '../core/helpers.js'

/**
 * Validate all feature files: active references, frontmatter fields,
 * required sections, heading consistency, dependencies, delta markers,
 * and scenario structure. Uses .rsp/config.yaml for customizable rules.
 */
export async function runCheck() {
  const featuresDir = join(RSP_DIR, 'features')
  const config = await loadRspConfig()
  const validStatuses = resolveStatuses(config)
  const validPriorities = resolvePriorities(config)
  const requiredSections = resolveRequiredSections(config)

  let errors = 0
  let warnings = 0

  console.log()
  console.log(`  ${pc.bold('RSP check')}`)
  console.log()

  // Check active.d/ references
  if (existsSync(ACTIVE_DIR)) {
    const entries = await walkFiles(ACTIVE_DIR)
    for (const entryPath of entries) {
      const entryContent = relative(ACTIVE_DIR, entryPath)
      const markerContent = (await readFile(entryPath, 'utf-8')).trim()
      if (markerContent) {
        console.log(`  ${pc.yellow('⚠')} active.d/${entryContent} should be an empty marker file; path is the source of truth`)
        warnings++
      }
      const fp = join(featuresDir, `${entryContent}.md`)
      if (!existsSync(fp)) {
        console.log(`  ${pc.red('✗')} active.d/${entryContent} points to "${entryContent}" but features/${entryContent}.md not found`)
        errors++
      }
    }
  }

  const featureFiles = existsSync(featuresDir) ? await walkMarkdownFiles(featuresDir) : []
  if (featureFiles.length === 0) {
    console.log(`  ${pc.dim('No feature files to check.')}\n`)
    return 0
  }

  const allDeps = new Map<string, string[]>()

  for (const fp of featureFiles) {
    const name = featureNameFromPath(featuresDir, fp)
    let content: string
    try {
      content = await readFile(fp, 'utf-8')
    }
    catch {
      console.log(`  ${pc.red('✗')} ${name} — unable to read file`)
      errors++
      continue
    }
    const fm = parseFrontmatter(content)

    // Frontmatter presence
    if (!fm) {
      console.log(`  ${pc.red('✗')} ${name} — missing YAML frontmatter`)
      errors++
    }

    // Required sections (from config or defaults)
    for (const section of requiredSections) {
      if (!(new RegExp(`^## ${section}$`, 'm').test(content))) {
        console.log(`  ${pc.red('✗')} ${name} — missing "## ${section}" section`)
        errors++
      }
    }

    // Frontmatter field validation
    if (fm) {
      if (!('status' in fm)) {
        console.log(`  ${pc.red('✗')} ${name} — missing frontmatter field: status`)
        errors++
      }
      else if (!validStatuses.includes(String(fm.status))) {
        console.log(`  ${pc.red('✗')} ${name} — invalid status "${fm.status}" (valid: ${validStatuses.join(', ')})`)
        errors++
      }

      if (!('priority' in fm)) {
        console.log(`  ${pc.red('✗')} ${name} — missing frontmatter field: priority`)
        errors++
      }
      else if (!validPriorities.includes(String(fm.priority))) {
        console.log(`  ${pc.red('✗')} ${name} — invalid priority "${fm.priority}" (valid: ${validPriorities.join(', ')})`)
        errors++
      }
    }

    // Heading consistency
    // eslint-disable-next-line regexp/no-super-linear-backtracking
    const headingMatch = content.match(/^# Feature:[ \t]*([^\n]+)$/m)
    if (headingMatch) {
      const heading = headingMatch[1].trim()
      if (heading !== name) {
        console.log(`  ${pc.red('✗')} ${name} — # Feature: heading "${heading}" differs from feature name`)
        errors++
      }
    }
    else {
      console.log(`  ${pc.red('✗')} ${name} — missing "# Feature:" heading`)
      errors++
    }

    // Delta section detection (informational warning if mixed)
    const deltas = detectDeltaSections(content)
    if (deltas.added || deltas.modified || deltas.removed) {
      const parts: string[] = []
      if (deltas.added)
        parts.push('ADDED')
      if (deltas.modified)
        parts.push('MODIFIED')
      if (deltas.removed)
        parts.push('REMOVED')
      console.log(`  ${pc.dim('ℹ')} ${name} — delta markers found: ${parts.join(', ')}`)
    }

    // Scenario validation (check format quality)
    const scenarios = parseScenarios(content)
    if (scenarios.length > 0) {
      const scenarioIssues: string[] = []
      for (const s of scenarios) {
        const hasGiven = s.steps.some(st => /^GIVEN/i.test(st))
        const hasWhen = s.steps.some(st => /^WHEN/i.test(st))
        const hasThen = s.steps.some(st => /^THEN/i.test(st))
        const missing: string[] = []
        if (!hasGiven)
          missing.push('GIVEN')
        if (!hasWhen)
          missing.push('WHEN')
        if (!hasThen)
          missing.push('THEN')
        if (missing.length > 0)
          scenarioIssues.push(`"${s.heading}" missing ${missing.join('/')}`)
      }
      if (scenarioIssues.length > 0) {
        console.log(`  ${pc.yellow('⚠')} ${name} — scenario format issues:`)
        for (const issue of scenarioIssues)
          console.log(`      ${pc.dim(issue)}`)
        warnings++
      }
    }

    // Dependency validation
    if (fm && fm['depends-on']) {
      const deps = Array.isArray(fm['depends-on']) ? fm['depends-on'] : [fm['depends-on']]
      const seen = new Set<string>()
      for (const dep of deps) {
        if (dep === name) {
          console.log(`  ${pc.red('✗')} ${name} — depends on itself`)
          errors++
          continue
        }
        if (seen.has(dep)) {
          console.log(`  ${pc.red('✗')} ${name} — duplicate dependency "${dep}"`)
          errors++
          continue
        }
        seen.add(dep)
        allDeps.set(name, [...(allDeps.get(name) || []), dep])
        const depFp = join(featuresDir, `${dep}.md`)
        if (!existsSync(depFp)) {
          console.log(`  ${pc.red('✗')} ${name} — depends on "${dep}" but features/${dep}.md not found`)
          errors++
        }
      }
    }
  }

  // Cycle detection (DFS on dependency graph)
  const cycles = detectCycles(allDeps)
  for (const cycle of cycles) {
    console.log(`  ${pc.red('✗')} circular dependency: ${cycle.join(' → ')}`)
    errors++
  }

  console.log()
  if (errors === 0 && warnings === 0)
    console.log(`  ${pc.green('✓')} All ${featureFiles.length} feature file(s) valid.\n`)
  else
    console.log(`  ${pc.red(String(errors))} error(s), ${pc.yellow(String(warnings))} warning(s) in ${featureFiles.length} feature file(s).\n`)

  return errors
}
