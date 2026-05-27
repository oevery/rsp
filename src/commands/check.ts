import type { CommandDiagnostic, CommandRunOptions, RuntimeDiagnostic } from '../types.js'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join, relative } from 'node:path'

import { CHANGES_DIR, FOCUS_DIR, loadRspConfig, pc, resolveKinds, resolveRequiredSections } from '../core/config.js'
import { changeNameFromPath, detectDeltaSections, getFocusedChangeNames, normalizeLogicalPath, parseFrontmatter, parseScenarios, walkFiles, walkMarkdownFiles } from '../core/helpers.js'
import { emitJson, recordRuntimeDiagnostic, toErrorMessage } from '../core/output.js'

export interface CheckOptions extends CommandRunOptions {
  focused?: boolean
}

interface CheckResult {
  command: 'check'
  ok: boolean
  focused: boolean
  diagnostics: CommandDiagnostic[]
  runtime: RuntimeDiagnostic[]
  summary: {
    changeFiles: number
    errors: number
    warnings: number
  }
}

/**
 * Validate all change files: focus markers, frontmatter fields,
 * required sections, heading consistency, delta markers, and lightweight scenario linting.
 * Uses .rsp/config.yaml for customizable kind values.
 * When focused is true, only currently focused changes are validated.
 */
export async function runCheck(options: CheckOptions = {}): Promise<CheckResult> {
  const config = await loadRspConfig()
  const validKinds = resolveKinds(config)
  const requiredSections = resolveRequiredSections(config)
  const choosePlaceholderRe = /^<choose:/i

  const diagnostics: CommandDiagnostic[] = []
  const runtime: RuntimeDiagnostic[] = []
  const reportRuntime = (diagnostic: RuntimeDiagnostic) => recordRuntimeDiagnostic(runtime, diagnostic, Boolean(options.verbose) && !options.json)
  const addDiagnostic = (diagnostic: CommandDiagnostic) => diagnostics.push(diagnostic)

  let focusedSet: Set<string> = new Set()
  if (options.focused) {
    focusedSet = await getFocusedChangeNames({ onError: reportRuntime })
  }

  if (existsSync(FOCUS_DIR)) {
    const entries = await walkFiles(FOCUS_DIR, { onError: reportRuntime })
    for (const entryPath of entries) {
      const entryContent = normalizeLogicalPath(relative(FOCUS_DIR, entryPath))
      let markerContent = ''
      try {
        markerContent = (await readFile(entryPath, 'utf-8')).trim()
      }
      catch (error) {
        addDiagnostic({
          severity: 'error',
          code: 'focus_marker_read_failed',
          path: `focus.d/${entryContent}`,
          change: entryContent,
          message: 'unable to read focus marker file',
          hint: toErrorMessage(error),
        })
        reportRuntime({
          code: 'focus_marker_read_failed',
          operation: 'readFile',
          path: entryPath,
          message: toErrorMessage(error),
        })
        continue
      }
      if (markerContent) {
        addDiagnostic({
          severity: 'warning',
          code: 'focus_marker_not_empty',
          path: `focus.d/${entryContent}`,
          message: 'should be an empty marker file; path is the source of truth',
        })
      }
      const fp = join(CHANGES_DIR, `${entryContent}.md`)
      if (!existsSync(fp)) {
        addDiagnostic({
          severity: 'error',
          code: 'focused_change_missing',
          path: `focus.d/${entryContent}`,
          change: entryContent,
          message: `focuses "${entryContent}" but changes/${entryContent}.md not found`,
        })
      }
    }
  }

  const allChangeFiles = existsSync(CHANGES_DIR) ? await walkMarkdownFiles(CHANGES_DIR, { onError: reportRuntime }) : []

  const changeFiles = options.focused
    ? allChangeFiles.filter(fp => focusedSet.has(changeNameFromPath(CHANGES_DIR, fp)))
    : allChangeFiles

  if (changeFiles.length === 0) {
    const result: CheckResult = {
      command: 'check',
      ok: diagnostics.every(d => d.severity !== 'error'),
      focused: Boolean(options.focused),
      diagnostics,
      runtime,
      summary: {
        changeFiles: 0,
        errors: diagnostics.filter(d => d.severity === 'error').length,
        warnings: diagnostics.filter(d => d.severity === 'warning').length,
      },
    }
    if (options.json) {
      emitJson(result)
      return result
    }
    console.log()
    console.log(`  ${pc.bold('RSP check')}`)
    if (options.focused)
      console.log(`  ${pc.dim('(focused only)')}`)
    console.log()
    if (diagnostics.length === 0) {
      console.log(`  ${pc.dim('No change files to check.')}\n`)
      return result
    }

    for (const diagnostic of diagnostics) {
      const icon = diagnostic.severity === 'error'
        ? pc.red('✗')
        : diagnostic.severity === 'warning'
          ? pc.yellow('⚠')
          : pc.dim('ℹ')
      const label = diagnostic.change ?? diagnostic.path
      const headline = label ? `${label} — ${diagnostic.message}` : diagnostic.message
      console.log(`  ${icon} ${headline}`)
      for (const detail of diagnostic.details || [])
        console.log(`      ${pc.dim(detail)}`)
      if (diagnostic.hint)
        console.log(`      ${pc.dim(diagnostic.hint)}`)
    }
    console.log()
    console.log(`  ${pc.red(String(result.summary.errors))} error(s), ${pc.yellow(String(result.summary.warnings))} warning(s) in 0 change file(s).\n`)
    return result
  }

  for (const fp of changeFiles) {
    const name = changeNameFromPath(CHANGES_DIR, fp)
    let content: string
    try {
      content = await readFile(fp, 'utf-8')
    }
    catch (error) {
      addDiagnostic({
        severity: 'error',
        code: 'change_read_failed',
        change: name,
        path: fp,
        message: 'unable to read file',
        hint: toErrorMessage(error),
      })
      continue
    }

    let fm = null
    try {
      fm = parseFrontmatter(content)
    }
    catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      addDiagnostic({
        severity: 'error',
        code: 'invalid_frontmatter',
        change: name,
        path: fp,
        message: `invalid YAML frontmatter (${message})`,
      })
      continue
    }

    if (!fm) {
      addDiagnostic({
        severity: 'error',
        code: 'missing_frontmatter',
        change: name,
        path: fp,
        message: 'missing YAML frontmatter',
      })
    }

    for (const section of requiredSections) {
      if (!(new RegExp(`^## ${section}$`, 'm').test(content))) {
        addDiagnostic({
          severity: 'error',
          code: 'missing_section',
          change: name,
          path: fp,
          message: `missing "## ${section}" section`,
        })
      }
    }

    if (fm) {
      if (!('kind' in fm)) {
        addDiagnostic({
          severity: 'error',
          code: 'missing_kind',
          change: name,
          path: fp,
          message: 'missing frontmatter field: kind',
        })
      }
      else if (choosePlaceholderRe.test(String(fm.kind))) {
        addDiagnostic({
          severity: 'error',
          code: 'placeholder_kind',
          change: name,
          path: fp,
          message: `kind still uses the template placeholder; choose one of: ${validKinds.join(', ')}`,
        })
      }
      else if (!validKinds.includes(String(fm.kind))) {
        addDiagnostic({
          severity: 'error',
          code: 'invalid_kind',
          change: name,
          path: fp,
          message: `invalid kind "${fm.kind}" (valid: ${validKinds.join(', ')})`,
        })
      }
    }

    const headingLine = content
      .split('\n')
      .map(line => line.trim())
      .find(line => line.startsWith('# Change:'))
    if (headingLine) {
      const heading = headingLine.slice('# Change:'.length).trim()
      if (heading !== name) {
        addDiagnostic({
          severity: 'error',
          code: 'heading_mismatch',
          change: name,
          path: fp,
          message: `# Change: heading "${heading}" differs from change name`,
        })
      }
    }
    else {
      addDiagnostic({
        severity: 'error',
        code: 'missing_heading',
        change: name,
        path: fp,
        message: 'missing "# Change:" heading',
      })
    }

    const deltas = detectDeltaSections(content)
    if (deltas.added || deltas.modified || deltas.removed) {
      const parts: string[] = []
      if (deltas.added)
        parts.push('ADDED')
      if (deltas.modified)
        parts.push('MODIFIED')
      if (deltas.removed)
        parts.push('REMOVED')
      addDiagnostic({
        severity: 'info',
        code: 'delta_markers_found',
        change: name,
        path: fp,
        message: `delta markers found: ${parts.join(', ')}`,
      })
    }

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
        addDiagnostic({
          severity: 'warning',
          code: 'scenario_format_issues',
          change: name,
          path: fp,
          message: 'scenario format issues',
          details: scenarioIssues,
        })
      }
    }
  }

  const result: CheckResult = {
    command: 'check',
    ok: diagnostics.every(d => d.severity !== 'error'),
    focused: Boolean(options.focused),
    diagnostics,
    runtime,
    summary: {
      changeFiles: changeFiles.length,
      errors: diagnostics.filter(d => d.severity === 'error').length,
      warnings: diagnostics.filter(d => d.severity === 'warning').length,
    },
  }

  if (options.json) {
    emitJson(result)
    return result
  }

  console.log()
  console.log(`  ${pc.bold('RSP check')}`)
  if (options.focused)
    console.log(`  ${pc.dim('(focused only)')}`)
  console.log()

  for (const diagnostic of diagnostics) {
    const icon = diagnostic.severity === 'error'
      ? pc.red('✗')
      : diagnostic.severity === 'warning'
        ? pc.yellow('⚠')
        : pc.dim('ℹ')
    const label = diagnostic.change ?? diagnostic.path
    const headline = label ? `${label} — ${diagnostic.message}` : diagnostic.message
    console.log(`  ${icon} ${headline}`)
    for (const detail of diagnostic.details || [])
      console.log(`      ${pc.dim(detail)}`)
    if (diagnostic.hint)
      console.log(`      ${pc.dim(diagnostic.hint)}`)
  }

  console.log()
  if (result.summary.errors === 0 && result.summary.warnings === 0)
    console.log(`  ${pc.green('✓')} All ${changeFiles.length} change file(s) valid.\n`)
  else
    console.log(`  ${pc.red(String(result.summary.errors))} error(s), ${pc.yellow(String(result.summary.warnings))} warning(s) in ${changeFiles.length} change file(s).\n`)

  return result
}
