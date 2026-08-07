import type { ArchiveReadinessOutput, CommandRunOptions, IssueRelationship, RuntimeDiagnostic } from '../types.js'
import { readFile } from 'node:fs/promises'

import { resolveExecutableChange } from '../core/change-group.js'
import { inspectRspConfig, pc } from '../core/config.js'
import { resolveDecisionRecordsPath, validateDecisionRecordsFilesystemPath } from '../core/decisions.js'
import { inspectChangeDependencies } from '../core/dependency-plan.js'
import { CHANGE_DOCUMENT_SCHEMA, getDocumentSectionBody, parseRspDocument } from '../core/document-model.js'
import { buildDurableReviewGuidance, collectArchiveReadiness, countCheckboxes, getDurableReviewCandidateTargets, guardRspInitialized, hasMeaningfulBlockers, normalizeLogicalPath, parseFrontmatter, parseScenarios, toArchiveReadinessOutput } from '../core/helpers.js'
import { IssueRelationshipError, parseIssueRelationships } from '../core/issue-relationship.js'
import { emitJson, recordRuntimeDiagnostic, toErrorMessage } from '../core/output.js'
import { inspectFocusTree, resolveWorkRef, WorkRefError } from '../core/work-ref.js'

interface ShowResult {
  command: 'show'
  ok: true
  change: {
    name: string
    path: string | null
    kind: string
    issues: IssueRelationship[]
    isFocused: boolean
    progress: { done: number, total: number }
    blockers: boolean
    scenarioCount: number
    readiness: ArchiveReadinessOutput
  }
  contextPaths: string[]
  durableReview: {
    required: true
    factDecisions: string[]
    rationaleDecisions: string[]
    factCandidateTargets: string[]
    decisionRecordsPath: string
    note: string
  }
  runtime: RuntimeDiagnostic[]
}

export interface ShowOptions extends CommandRunOptions {
  focused?: boolean
}

function exitShowError(error: { code: string, message: string }, options: ShowOptions): never {
  const nextActions = error.code === 'no_focused_change'
    ? ['Run: rsp status', 'Run: rsp focus <name>', 'Or run: rsp create <name>']
    : []
  if (options.json) {
    emitJson({
      command: 'show',
      ok: false,
      change: null,
      contextPaths: [],
      runtime: [],
      nextActions,
      error,
    }, options)
  }
  else {
    console.error(`  ${pc.red('Error:')} ${error.message}`)
    for (const action of nextActions)
      console.error(`  ${pc.dim(action)}`)
  }
  process.exit(1)
}

export async function showChange(nameOrFocused: string | undefined, options: ShowOptions = {}): Promise<ShowResult> {
  const runtime: RuntimeDiagnostic[] = []
  const reportRuntime = (diagnostic: RuntimeDiagnostic) => recordRuntimeDiagnostic(runtime, diagnostic, Boolean(options.verbose) && !options.json)

  guardRspInitialized()
  const focusTree = await inspectFocusTree()
  if (focusTree.diagnostics.length > 0) {
    const diagnostic = focusTree.diagnostics[0]
    exitShowError({ code: diagnostic.code, message: diagnostic.message }, options)
  }
  const focused = new Set(focusTree.markers.map(marker => marker.name))

  let name: string

  if (options.focused) {
    if (focused.size === 0) {
      exitShowError({ code: 'no_focused_change', message: 'no focused change exists' }, options)
    }
    if (focused.size > 1) {
      exitShowError({
        code: 'multiple_focused_changes',
        message: `multiple focused changes exist (${[...focused].join(', ')}). Specify a name or focus exactly one change.`,
      }, options)
    }
    name = [...focused][0]
  }
  else if (nameOrFocused) {
    name = nameOrFocused
  }
  else {
    exitShowError({ code: 'missing_change_name', message: 'Usage: rsp show <name|--focused> [--json] [--verbose]' }, options)
  }

  let workRef
  try {
    workRef = await resolveExecutableChange(name, { mustExist: true })
  }
  catch (error) {
    if (error instanceof WorkRefError)
      exitShowError({ code: error.code, message: error.message }, options)
    throw error
  }
  const srcPath = workRef.path

  let content: string
  try {
    content = await readFile(srcPath, 'utf-8')
  }
  catch {
    exitShowError({ code: 'change_read_failed', message: `unable to read .rsp/changes/${name}.md` }, options)
  }

  let kind = '—'
  let issues: IssueRelationship[] = []
  try {
    const fm = parseFrontmatter(content)
    kind = fm?.kind ? String(fm.kind) : '—'
    issues = parseIssueRelationships(fm)
  }
  catch (error) {
    if (error instanceof IssueRelationshipError)
      exitShowError({ code: error.code, message: error.message }, options)
    kind = '(invalid)'
    reportRuntime({
      code: 'frontmatter_parse_failed',
      operation: 'parseFrontmatter',
      path: srcPath,
      message: toErrorMessage(error),
    })
  }

  const isFocused = focused.has(name)

  const dependencyInspection = await inspectChangeDependencies()
  const blockers = dependencyInspection.activeBlockers.get(name) ?? hasMeaningfulBlockers(content)
  const scenarios = parseScenarios(content)
  const readinessDetails = collectArchiveReadiness(content, { activeBlockers: blockers })
  const document = parseRspDocument(content, CHANGE_DOCUMENT_SCHEMA)
  const taskCheckboxes = countCheckboxes(getDocumentSectionBody(document, 'tasks'))
  const progress = {
    done: taskCheckboxes.done + readinessDetails.verifyCriticality.required.done,
    total: taskCheckboxes.total + readinessDetails.verifyCriticality.required.total,
  }

  const readiness = toArchiveReadinessOutput(readinessDetails)

  const factCandidateTargets = getDurableReviewCandidateTargets()
  let decisionRecordsPath: string
  try {
    const configInspection = await inspectRspConfig()
    if (configInspection.issues.length > 0)
      exitShowError({ code: 'invalid_config', message: configInspection.issues.join('; ') }, options)
    decisionRecordsPath = resolveDecisionRecordsPath(configInspection.config)
    const filesystemIssue = await validateDecisionRecordsFilesystemPath(decisionRecordsPath)
    if (filesystemIssue)
      exitShowError({ code: 'invalid_decision_records_path', message: filesystemIssue }, options)
  }
  catch (error) {
    exitShowError({ code: 'invalid_config', message: `.rsp/config.yaml could not be parsed: ${toErrorMessage(error)}` }, options)
  }
  const groupContextPaths = workRef.group
    ? [normalizeLogicalPath(resolveWorkRef(`${workRef.group}/brief`, { mustExist: true }).path)]
    : []
  const contextPaths = [...groupContextPaths, ...factCandidateTargets, decisionRecordsPath]
  const durableReview = buildDurableReviewGuidance(factCandidateTargets, decisionRecordsPath)
  const result: ShowResult = {
    command: 'show',
    ok: true,
    change: {
      name,
      path: normalizeLogicalPath(srcPath),
      kind,
      issues,
      isFocused,
      progress,
      blockers,
      scenarioCount: scenarios.length,
      readiness,
    },
    contextPaths,
    durableReview,
    runtime,
  }

  if (options.json) {
    emitJson(result, options)
    return result
  }

  console.log()
  console.log(`  ${pc.bold('Change:')} ${pc.cyan(name)}`)
  console.log(`  ${pc.dim('Path:')} ${normalizeLogicalPath(srcPath)}`)
  console.log(`  ${pc.dim('Kind:')} ${kind}`)
  if (issues.length > 0) {
    console.log(`  ${pc.dim('Issues:')}`)
    for (const issue of issues)
      console.log(`    ${issue.relation} ${issue.url}`)
  }
  console.log(`  ${pc.dim('Focused:')} ${isFocused ? pc.green('yes') : pc.dim('no')}`)
  console.log(`  ${pc.dim('Progress:')} ${progress.done}/${progress.total}`)
  console.log(`  ${pc.dim('Blockers:')} ${blockers ? pc.yellow('yes') : pc.green('no')}`)
  console.log(`  ${pc.dim('Scenarios:')} ${scenarios.length}`)
  console.log()
  console.log(`  ${pc.bold('Readiness:')}`)
  console.log(`    ${pc.dim('Incomplete tasks:')} ${readiness.incompleteTasks > 0 ? pc.yellow(String(readiness.incompleteTasks)) : pc.green('0')}`)
  console.log(`    ${pc.dim('Incomplete required verify:')} ${readiness.incompleteRequiredVerify > 0 ? pc.yellow(String(readiness.incompleteRequiredVerify)) : pc.green('0')}`)
  console.log(`    ${pc.dim('Optional coverage warnings:')} ${readiness.coverageWarnings > 0 ? pc.yellow(String(readiness.coverageWarnings)) : pc.green('0')}`)
  console.log(`    ${pc.dim('Completion gate:')} ${readiness.completionGate === 'pass' ? pc.green('pass') : pc.red('blocked')}`)
  console.log(`    ${pc.dim('Active blockers:')} ${readiness.activeBlockers ? pc.yellow('yes') : pc.green('no')}`)
  console.log(`    ${pc.dim('Missing scenarios:')} ${readiness.missingScenarios ? pc.yellow('yes') : pc.green('no')}`)
  console.log(`    ${pc.dim('Deterministic:')} ${readiness.deterministic === 'pass' ? pc.green('pass') : pc.yellow('warnings')}`)
  console.log(`    ${pc.dim('Semantic review:')} ${pc.yellow('needed')}`)
  console.log(`    ${pc.dim('Archive ready:')} ${formatArchiveReady(readiness.archiveReady)}`)
  console.log()
  console.log(`  ${pc.bold('Context paths:')}`)
  for (const cp of contextPaths)
    console.log(`    ${pc.dim(cp)}`)
  console.log()
  console.log(`  ${pc.bold('Durable review:')}`)
  console.log(`    ${pc.dim('Current-fact options:')} ${durableReview.factDecisions.join(' | ')}`)
  console.log(`    ${pc.dim('Rationale options:')} ${durableReview.rationaleDecisions.join(' | ')}`)
  console.log(`    ${pc.dim('Current-fact targets:')} ${durableReview.factCandidateTargets.join(', ')}`)
  console.log(`    ${pc.dim('Decision Record path:')} ${durableReview.decisionRecordsPath}`)
  console.log(`    ${pc.dim(durableReview.note)}`)
  console.log()
  return result
}

function formatArchiveReady(value: 'yes' | 'judgment' | 'no'): string {
  switch (value) {
    case 'yes':
      return pc.green('yes')
    case 'no':
      return pc.yellow('no')
    case 'judgment':
      return pc.yellow('judgment')
  }
}
