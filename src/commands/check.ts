import type { CommandDiagnostic, CommandRunOptions, RspConfig, RuntimeDiagnostic } from '../types.js'
import { readFile } from 'node:fs/promises'

import { inspectChangeGroups } from '../core/change-group.js'
import { loadRspConfig, pc, resolveKinds, resolveRequiredSections } from '../core/config.js'
import { inspectChangeDependencies } from '../core/dependency-plan.js'
import { detectDeltaSections, parseFrontmatter, parseScenarios } from '../core/helpers.js'
import { emitJson, recordRuntimeDiagnostic, toErrorMessage } from '../core/output.js'
import { inspectFocusTree, inspectWorkTree, resolveWorkRef, WorkRefError } from '../core/work-ref.js'

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
 * required sections, heading consistency, unfinished template text, delta markers,
 * and lightweight scenario linting.
 * Uses .rsp/config.yaml for customizable kind values.
 * When focused is true, only currently focused changes are validated.
 */
export async function runCheck(options: CheckOptions = {}): Promise<CheckResult> {
  const diagnostics: CommandDiagnostic[] = []
  const runtime: RuntimeDiagnostic[] = []
  let config: RspConfig
  try {
    config = await loadRspConfig()
  }
  catch (error) {
    const result: CheckResult = {
      command: 'check',
      ok: false,
      focused: Boolean(options.focused),
      diagnostics: [{ severity: 'error', code: 'invalid_config', path: '.rsp/config.yaml', message: toErrorMessage(error) }],
      runtime,
      summary: { changeFiles: 0, errors: 1, warnings: 0 },
    }
    if (options.json)
      emitJson(result)
    else
      console.error(`  ${pc.red('Error:')} ${toErrorMessage(error)}`)
    return result
  }
  const validKinds = resolveKinds(config)
  const requiredSections = resolveRequiredSections(config)
  const choosePlaceholderRe = /^<choose:/i

  const reportRuntime = (diagnostic: RuntimeDiagnostic) => recordRuntimeDiagnostic(runtime, diagnostic, Boolean(options.verbose) && !options.json)
  const addDiagnostic = (diagnostic: CommandDiagnostic) => diagnostics.push(diagnostic)
  const focusTree = await inspectFocusTree()
  for (const diagnostic of focusTree.diagnostics) {
    addDiagnostic({
      severity: 'error',
      code: diagnostic.code,
      change: diagnostic.input,
      path: diagnostic.path,
      message: diagnostic.message,
    })
  }

  const focusedSet = options.focused
    ? new Set(focusTree.markers.map(marker => marker.name))
    : new Set<string>()

  for (const marker of focusTree.markers) {
    const entryPath = marker.path
    const entryContent = marker.name
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
    try {
      resolveWorkRef(entryContent, { executable: true, mustExist: true })
    }
    catch (error) {
      if (!(error instanceof WorkRefError))
        throw error
      addDiagnostic({
        severity: 'error',
        code: error.code === 'work_ref_not_found' ? 'focused_change_missing' : error.code,
        path: `focus.d/${entryContent}`,
        change: entryContent,
        message: error.code === 'work_ref_not_found'
          ? `focuses "${entryContent}" but changes/${entryContent}.md not found`
          : error.message,
      })
    }
  }

  const workTree = await inspectWorkTree()
  for (const diagnostic of workTree.diagnostics) {
    const inspectionIncomplete = diagnostic.code === 'invalid_work_root' || diagnostic.code === 'work_tree_read_failed'
    if (inspectionIncomplete || !options.focused || focusedSet.has(diagnostic.input)) {
      addDiagnostic({
        severity: 'error',
        code: diagnostic.code,
        change: diagnostic.input,
        path: diagnostic.path,
        message: diagnostic.message,
      })
    }
  }

  const changeRefs = options.focused
    ? workTree.changes.filter(ref => focusedSet.has(ref.name))
    : workTree.changes
  const groupInspection = await inspectChangeGroups({ workTree, focusTree })
  const focusedGroups = new Set(changeRefs.flatMap(ref => ref.group ? [ref.group] : []))
  for (const diagnostic of groupInspection.diagnostics) {
    if (!options.focused || !diagnostic.change || focusedGroups.has(diagnostic.change))
      addDiagnostic(diagnostic)
  }
  const dependencyInspection = await inspectChangeDependencies({ workTree })
  for (const diagnostic of dependencyInspection.diagnostics) {
    if (!options.focused || !diagnostic.change || focusedSet.has(diagnostic.change))
      addDiagnostic(diagnostic)
  }

  if (changeRefs.length === 0) {
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

  for (const ref of changeRefs) {
    const { name, path: fp } = ref
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

    const placeholderLines = findUnfinishedTemplateLines(content)
    if (placeholderLines.length > 0) {
      addDiagnostic({
        severity: 'warning',
        code: 'unfinished_template_placeholders',
        change: name,
        path: fp,
        message: 'unfinished template placeholders found',
        details: placeholderLines,
        hint: 'Replace angle-bracket template text with concrete change details before archiving.',
      })
    }

    const clarificationLines = findUnresolvedClarificationLines(content)
    if (clarificationLines.length > 0) {
      addDiagnostic({
        severity: 'warning',
        code: 'unresolved_clarifications',
        change: name,
        path: fp,
        message: 'unresolved clarification markers found',
        details: clarificationLines,
        hint: 'Resolve or remove clarification markers once the open question is answered.',
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
      changeFiles: changeRefs.length,
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
    console.log(`  ${pc.green('✓')} All ${changeRefs.length} change file(s) valid.\n`)
  else
    console.log(`  ${pc.red(String(result.summary.errors))} error(s), ${pc.yellow(String(result.summary.warnings))} warning(s) in ${changeRefs.length} change file(s).\n`)

  return result
}

function findUnfinishedTemplateLines(content: string): string[] {
  const placeholderRe = /<[^>\n]*(?:choose:|one-line|what |why |which |who |how |new |updated |expected |actual |specific |concrete |exact |verifiable |user |capability |behavior |context |action |path|directory|module|subsystem|command|scenario|constraint|requirement|question|uncertainty|implementation)[^>\n]*>/i
  return collectMatchingLines(content, (line) => {
    const trimmed = stripInlineCodeSpans(line).trim()
    return trimmed.startsWith('<!--') === false && placeholderRe.test(trimmed)
  })
}

function findUnresolvedClarificationLines(content: string): string[] {
  return collectMatchingLines(content, line => /\[(?:NEEDS|TODO|TBD)\s+CLARIFICATION(?::[^\]]*)?\]/i.test(stripInlineCodeSpans(line)))
}

function stripInlineCodeSpans(line: string): string {
  return line.replace(/`[^`]*`/g, '')
}

function collectMatchingLines(content: string, predicate: (line: string) => boolean): string[] {
  const matches: string[] = []
  const lines = content.split('\n')
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index]
    if (predicate(line))
      matches.push(`line ${index + 1}: ${line.trim()}`)
  }
  return matches.slice(0, 10)
}
