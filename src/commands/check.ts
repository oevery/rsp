import type { CommandDiagnostic, RspConfig, RuntimeDiagnostic } from '../types.js'
import { readFile } from 'node:fs/promises'
import { TextDecoder } from 'node:util'

import { inspectChangeDocument } from '../core/change-document-inspection.js'
import { inspectChangeGroups } from '../core/change-group.js'
import { loadRspConfig, MAX_FOCUS_CAPSULE_BYTES, resolveKinds, resolveRequiredSections } from '../core/config.js'
import { detectDeltaSections, parseScenarios } from '../core/content.js'
import { inspectChangeDependencies } from '../core/dependency-plan.js'
import { toErrorMessage } from '../core/output.js'
import { inspectFocusTree, inspectWorkTree, resolveWorkRef, WorkRefError } from '../core/work-ref.js'

export interface CheckOptions {
  focused?: boolean
}

export interface CheckResult {
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
    return result
  }
  const validKinds = resolveKinds(config)
  const requiredSections = resolveRequiredSections(config)
  const reportRuntime = (diagnostic: RuntimeDiagnostic) => runtime.push(diagnostic)
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
    let markerContent: Uint8Array
    try {
      markerContent = await readFile(entryPath)
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
    if (markerContent.byteLength > MAX_FOCUS_CAPSULE_BYTES) {
      addDiagnostic({
        severity: 'error',
        code: 'focus_capsule_too_large',
        path: `focus.d/${entryContent}`,
        change: entryContent,
        message: `focus capsule exceeds ${MAX_FOCUS_CAPSULE_BYTES} UTF-8 bytes`,
      })
    }
    else {
      try {
        new TextDecoder('utf-8', { fatal: true }).decode(markerContent)
      }
      catch {
        addDiagnostic({
          severity: 'error',
          code: 'focus_capsule_invalid_utf8',
          path: `focus.d/${entryContent}`,
          change: entryContent,
          message: 'focus capsule must contain valid UTF-8',
        })
      }
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

    for (const diagnostic of inspectChangeDocument(content, { name, validKinds, requiredSections }))
      addDiagnostic({ ...diagnostic, change: name, path: fp })

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

  return result
}

function findUnfinishedTemplateLines(content: string): string[] {
  const placeholderRe = /<(?:…|[^>\n]*(?:choose:|one-line|what |why |which |who |how |new |updated |expected |actual |specific |concrete |exact |verifiable |user |capability |behavior |context |action|path|directory|module|subsystem|command|scenario|constraint|requirement|question|uncertainty|implementation)[^>\n]*)>/i
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
