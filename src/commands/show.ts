import type { ArchiveReadinessOutput, IssueRelationship, RuntimeDiagnostic } from '../types.js'
import { readFile } from 'node:fs/promises'

import { resolveExecutableChange } from '../core/change-group.js'
import { inspectRspConfig } from '../core/config.js'
import { countCheckboxes, hasMeaningfulBlockers, parseFrontmatter, parseScenarios } from '../core/content.js'
import { resolveDecisionRecordsPath, validateDecisionRecordsFilesystemPath } from '../core/decisions.js'
import { inspectChangeDependencies } from '../core/dependency-plan.js'
import { CHANGE_DOCUMENT_SCHEMA, getDocumentSectionBody, parseRspDocument } from '../core/document-model.js'
import { guardRspInitialized, normalizeLogicalPath } from '../core/filesystem.js'
import { IssueRelationshipError, parseIssueRelationships } from '../core/issue-relationship.js'
import { toErrorMessage } from '../core/output.js'
import { buildDurableReviewGuidance, collectArchiveReadiness, getDurableReviewCandidateTargets, toArchiveReadinessOutput } from '../core/readiness.js'
import { inspectFocusTree, resolveWorkRef, WorkRefError } from '../core/work-ref.js'

export interface ShowSuccessResult {
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

export interface ShowOptions {
  focused?: boolean
}

export interface ShowErrorResult {
  command: 'show'
  ok: false
  change: null
  contextPaths: []
  runtime: RuntimeDiagnostic[]
  nextActions: string[]
  error: { code: string, message: string }
}

export type ShowResult = ShowSuccessResult | ShowErrorResult

function showError(error: { code: string, message: string }, runtime: RuntimeDiagnostic[] = []): ShowErrorResult {
  const nextActions = error.code === 'no_focused_change'
    ? ['Run: rsp status', 'Run: rsp focus <name>', 'Or run: rsp create <name>']
    : []
  return { command: 'show', ok: false, change: null, contextPaths: [], runtime, nextActions, error }
}

export async function showChange(nameOrFocused: string | undefined, options: ShowOptions = {}): Promise<ShowResult> {
  const runtime: RuntimeDiagnostic[] = []
  const reportRuntime = (diagnostic: RuntimeDiagnostic) => runtime.push(diagnostic)

  guardRspInitialized()
  const focusTree = await inspectFocusTree()
  if (focusTree.diagnostics.length > 0) {
    const diagnostic = focusTree.diagnostics[0]
    return showError({ code: diagnostic.code, message: diagnostic.message }, runtime)
  }
  const focused = new Set(focusTree.markers.map(marker => marker.name))

  let name: string

  if (options.focused) {
    if (focused.size === 0) {
      return showError({ code: 'no_focused_change', message: 'no focused change exists' }, runtime)
    }
    if (focused.size > 1) {
      return showError({
        code: 'multiple_focused_changes',
        message: `multiple focused changes exist (${[...focused].join(', ')}). Specify a name or focus exactly one change.`,
      }, runtime)
    }
    name = [...focused][0]
  }
  else if (nameOrFocused) {
    name = nameOrFocused
  }
  else {
    return showError({ code: 'missing_change_name', message: 'Usage: rsp show <name|--focused> [--json] [--verbose]' }, runtime)
  }

  let workRef
  try {
    workRef = await resolveExecutableChange(name, { mustExist: true })
  }
  catch (error) {
    if (error instanceof WorkRefError)
      return showError({ code: error.code, message: error.message }, runtime)
    throw error
  }
  const srcPath = workRef.path

  let content: string
  try {
    content = await readFile(srcPath, 'utf-8')
  }
  catch {
    return showError({ code: 'change_read_failed', message: `unable to read .rsp/changes/${name}.md` }, runtime)
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
      return showError({ code: error.code, message: error.message }, runtime)
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
      return showError({ code: 'invalid_config', message: configInspection.issues.join('; ') }, runtime)
    decisionRecordsPath = resolveDecisionRecordsPath(configInspection.config)
    const filesystemIssue = await validateDecisionRecordsFilesystemPath(decisionRecordsPath)
    if (filesystemIssue)
      return showError({ code: 'invalid_decision_records_path', message: filesystemIssue }, runtime)
  }
  catch (error) {
    return showError({ code: 'invalid_config', message: `.rsp/config.yaml could not be parsed: ${toErrorMessage(error)}` }, runtime)
  }
  const groupContextPaths = workRef.group
    ? [normalizeLogicalPath(resolveWorkRef(`${workRef.group}/brief`, { mustExist: true }).path)]
    : []
  const contextPaths = [...groupContextPaths, ...factCandidateTargets, decisionRecordsPath]
  const durableReview = buildDurableReviewGuidance(factCandidateTargets, decisionRecordsPath)
  const result: ShowSuccessResult = {
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

  return result
}
