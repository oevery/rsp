import type { CheckResult } from '../../commands/check.js'
import type { DoctorCheck, DoctorResult } from '../../commands/doctor.js'
import type { HistoryDetailResult, HistoryListResult, HistoryResult } from '../../commands/history.js'
import type { ReadyResult } from '../../commands/ready.js'
import type { ShowResult } from '../../commands/show.js'
import type { SpecsResult } from '../../commands/specs.js'
import type { SpecsDirectoryNode, SpecsInspection } from '../../specs/model.js'
import type { ProjectStatusView } from '../../status/model.js'
import type { RuntimeDiagnostic, StatusJsonShape } from '../../types.js'
import { existsSync } from 'node:fs'
import { pc, RSP_DIR } from '../../core/config.js'
import { emitJson } from '../../core/output.js'
import { SPECS_DETAIL_CONTENT_CODE_POINTS } from '../../specs/model.js'
import { printStatusPlain, printStatusRuntimeDiagnostics } from '../../status/plain.js'
import { toStatusJson } from '../../status/v3-json.js'

export interface InspectionPresentationOptions {
  json: boolean
  compact: boolean
  verbose?: boolean
}

export type StatusCliResult
  = { kind: 'view', view: ProjectStatusView }
    | { kind: 'error', output: StatusJsonShape & { error: { code: string, message: string } } }

export function presentStatus(result: StatusCliResult, options: InspectionPresentationOptions): void {
  if (result.kind === 'error') {
    if (options.json)
      emitJson(result.output, options)
    else
      console.error(`  Error: ${result.output.error.message}`)
    return
  }
  if (options.verbose && !options.json)
    printStatusRuntimeDiagnostics(result.view.runtime)
  if (options.json)
    emitJson(toStatusJson(result.view), options)
  else
    printStatusPlain(result.view, { verbose: options.verbose })
}

export function presentShow(result: ShowResult, options: InspectionPresentationOptions): void {
  if (!result.ok) {
    if (options.json) {
      emitJson({ ...result, runtime: [] }, options)
      return
    }
    printRuntimeDiagnostics(result.runtime, options.verbose)
    console.error(`  ${pc.red('Error:')} ${result.error.message}`)
    for (const action of result.nextActions)
      console.error(`  ${pc.dim(action)}`)
    return
  }
  if (options.json) {
    emitJson(result, options)
    return
  }
  printRuntimeDiagnostics(result.runtime, options.verbose)
  const { change, contextPaths, durableReview } = result
  console.log()
  console.log(`  ${pc.bold('Change:')} ${pc.cyan(change.name)}`)
  console.log(`  ${pc.dim('Path:')} ${change.path}`)
  console.log(`  ${pc.dim('Kind:')} ${change.kind}`)
  if (change.issues.length > 0) {
    console.log(`  ${pc.dim('Issues:')}`)
    for (const issue of change.issues)
      console.log(`    ${issue.relation} ${issue.url}`)
  }
  console.log(`  ${pc.dim('Focused:')} ${change.isFocused ? pc.green('yes') : pc.dim('no')}`)
  console.log(`  ${pc.dim('Progress:')} ${change.progress.done}/${change.progress.total}`)
  console.log(`  ${pc.dim('Blockers:')} ${change.blockers ? pc.yellow('yes') : pc.green('no')}`)
  console.log(`  ${pc.dim('Scenarios:')} ${change.scenarioCount}`)
  console.log()
  console.log(`  ${pc.bold('Readiness:')}`)
  console.log(`    ${pc.dim('Incomplete tasks:')} ${change.readiness.incompleteTasks > 0 ? pc.yellow(String(change.readiness.incompleteTasks)) : pc.green('0')}`)
  console.log(`    ${pc.dim('Incomplete required verify:')} ${change.readiness.incompleteRequiredVerify > 0 ? pc.yellow(String(change.readiness.incompleteRequiredVerify)) : pc.green('0')}`)
  console.log(`    ${pc.dim('Optional coverage warnings:')} ${change.readiness.coverageWarnings > 0 ? pc.yellow(String(change.readiness.coverageWarnings)) : pc.green('0')}`)
  console.log(`    ${pc.dim('Completion gate:')} ${change.readiness.completionGate === 'pass' ? pc.green('pass') : pc.red('blocked')}`)
  console.log(`    ${pc.dim('Active blockers:')} ${change.readiness.activeBlockers ? pc.yellow('yes') : pc.green('no')}`)
  console.log(`    ${pc.dim('Missing scenarios:')} ${change.readiness.missingScenarios ? pc.yellow('yes') : pc.green('no')}`)
  console.log(`    ${pc.dim('Deterministic:')} ${change.readiness.deterministic === 'pass' ? pc.green('pass') : pc.yellow('warnings')}`)
  console.log(`    ${pc.dim('Semantic review:')} ${pc.yellow('needed')}`)
  console.log(`    ${pc.dim('Archive ready:')} ${formatArchiveReady(change.readiness.archiveReady)}`)
  console.log()
  console.log(`  ${pc.bold('Context paths:')}`)
  for (const path of contextPaths)
    console.log(`    ${pc.dim(path)}`)
  console.log()
  console.log(`  ${pc.bold('Durable review:')}`)
  printDurableReview(durableReview)
  console.log()
}

export function presentReady(result: ReadyResult, options: InspectionPresentationOptions): void {
  if (!result.ok) {
    if (options.json && result.kind !== 'usage' && result.kind !== 'read')
      emitJson(publicReadyResult(result), options)
    else if (result.kind === 'usage')
      console.error(`  ${pc.red('Usage:')} ${result.error.message}`)
    else
      console.error(`  ${pc.red('Error:')} ${result.error.message}`)
    return
  }
  if (options.json) {
    emitJson(result, options)
    return
  }
  printRuntimeDiagnostics(result.runtime, options.verbose)
  console.log()
  console.log(`  ${pc.bold('Archive readiness for')} ${pc.cyan(result.change)}`)
  console.log()
  if (result.warnings.length === 0) {
    console.log(`  ${pc.green('✓')} Ready to archive. No deterministic warnings found.\n`)
  }
  else {
    for (const line of result.warnings)
      console.log(`  ${pc.yellow('⚠')} ${line}`)
    console.log()
    console.log(`  ${pc.dim('Review the warnings above before treating this work as fully closed.')}`)
  }
  const { readiness, durableReview } = result
  console.log(`  ${pc.dim('Deterministic readiness:')} ${readiness.deterministic === 'pass' ? pc.green('pass') : pc.yellow('warnings')}`)
  console.log(`  ${pc.dim('Completion gate:')} ${readiness.completionGate === 'pass' ? pc.green('pass') : pc.red('blocked')}`)
  console.log(`  ${pc.dim('Required verification:')} ${readiness.requiredVerify.done}/${readiness.requiredVerify.total}`)
  console.log(`  ${pc.dim('Optional coverage:')} ${readiness.optionalVerify.done}/${readiness.optionalVerify.total}${readiness.coverageWarnings > 0 ? pc.yellow(` · ${readiness.coverageWarnings} warning(s)`) : ''}`)
  console.log(`  ${pc.dim('Semantic review:')} ${pc.yellow('needed')}`)
  console.log(`  ${pc.dim('Archive ready:')} ${formatArchiveReady(readiness.archiveReady)}\n`)
  console.log(`  ${pc.bold('Durable review:')}`)
  printDurableReview(durableReview)
  console.log()
}

export function presentCheck(result: CheckResult, options: InspectionPresentationOptions): void {
  if (options.json) {
    emitJson(result, options)
    return
  }
  printRuntimeDiagnostics(result.runtime, options.verbose)
  if (result.summary.changeFiles === 0 && result.diagnostics.length === 1 && result.diagnostics[0].code === 'invalid_config') {
    console.error(`  ${pc.red('Error:')} ${result.diagnostics[0].message}`)
    return
  }
  console.log()
  console.log(`  ${pc.bold('RSP check')}`)
  if (result.focused)
    console.log(`  ${pc.dim('(focused only)')}`)
  console.log()
  if (result.summary.changeFiles === 0 && result.diagnostics.length === 0) {
    console.log(`  ${pc.dim('No change files to check.')}\n`)
    return
  }
  printCheckDiagnostics(result)
  console.log()
  if (result.summary.errors === 0 && result.summary.warnings === 0)
    console.log(`  ${pc.green('✓')} All ${result.summary.changeFiles} change file(s) valid.\n`)
  else
    console.log(`  ${pc.red(String(result.summary.errors))} error(s), ${pc.yellow(String(result.summary.warnings))} warning(s) in ${result.summary.changeFiles} change file(s).\n`)
}

export function presentDoctor(result: DoctorResult, options: InspectionPresentationOptions & { fix: boolean }): void {
  if (options.json) {
    emitJson(result, options)
    return
  }
  printRuntimeDiagnostics(result.runtime, options.verbose)
  console.log()
  console.log(`  ${pc.bold('RSP doctor')}`)
  console.log()
  if (result.fixed.length > 0) {
    console.log(`  ${pc.green('Fixed:')} ${result.fixed.join(', ')}`)
    console.log()
  }
  else if (options.fix && result.checks.every(check => check.message?.startsWith('safe deterministic repair could not run:') !== true) && existsSync(RSP_DIR)) {
    console.log(`  ${pc.dim('No safe fixes needed.')}`)
    console.log()
  }
  for (const check of result.checks)
    printDoctorCheck(check)
  if (result.summary.issues === 0)
    console.log(`\n  ${pc.green('✓')} RSP setup looks healthy.\n`)
  else
    console.log(`\n  ${pc.yellow(String(result.summary.issues))} issue(s) detected.\n`)
}

export function presentHistory(result: HistoryResult, options: InspectionPresentationOptions): void {
  if (options.json) {
    emitJson(result, options)
    return
  }
  if (!result.ok) {
    console.error(`  ${pc.red('Error:')} ${result.error.message}`)
    for (const diagnostic of result.diagnostics)
      console.error(`  ${pc.dim(`${diagnostic.path ?? 'archive'} — ${diagnostic.message}`)}`)
    if (result.diagnosticSummary.hasMore)
      console.error(`  ${pc.dim(`${result.diagnosticSummary.total - result.diagnosticSummary.returned} additional diagnostic(s) omitted`)}`)
    for (const candidate of result.error.candidates ?? [])
      console.error(`  ${pc.dim(candidate)}`)
    if (result.error.candidateSummary?.hasMore)
      console.error(`  ${pc.dim(`${result.error.candidateSummary.total - result.error.candidateSummary.returned} additional candidate(s) omitted`)}`)
    return
  }
  if (result.mode === 'detail')
    printHistoryDetail(result)
  else
    printHistoryList(result)
}

export function presentSpecs(result: SpecsResult, options: InspectionPresentationOptions): void {
  if (options.json) {
    emitJson(result, options)
    return
  }
  if (!result.ok) {
    console.error(`  ${pc.red('Error:')} ${result.error.message}`)
    for (const diagnostic of result.diagnostics)
      console.error(`  ${pc.dim(`${diagnostic.path ?? '.rsp/specs'} — ${diagnostic.message}`)}`)
    if (result.diagnosticSummary.hasMore)
      console.error(`  ${pc.dim(`${result.diagnosticSummary.total - result.diagnosticSummary.returned} additional diagnostic(s) omitted`)}`)
    return
  }
  if (result.mode === 'detail')
    printSpecsDetail(result)
  else if (result.mode === 'search')
    printSpecsSearch(result)
  else
    printSpecsTree(result)
}

function publicReadyResult(result: Extract<ReadyResult, { ok: false }>) {
  const { kind: _kind, ...publicResult } = result
  return publicResult
}

function printRuntimeDiagnostics(runtime: RuntimeDiagnostic[], verbose = false): void {
  if (!verbose)
    return
  for (const diagnostic of runtime)
    console.error(`  ${pc.dim(`[verbose] ${diagnostic.operation} ${diagnostic.path}: ${diagnostic.message}`)}`)
}

function printCheckDiagnostics(result: CheckResult): void {
  for (const diagnostic of result.diagnostics) {
    const icon = diagnostic.severity === 'error' ? pc.red('✗') : diagnostic.severity === 'warning' ? pc.yellow('⚠') : pc.dim('ℹ')
    const label = diagnostic.change ?? diagnostic.path
    const headline = label ? `${label} — ${diagnostic.message}` : diagnostic.message
    console.log(`  ${icon} ${headline}`)
    for (const detail of diagnostic.details || [])
      console.log(`      ${pc.dim(detail)}`)
    if (diagnostic.hint)
      console.log(`      ${pc.dim(diagnostic.hint)}`)
  }
}

function printDoctorCheck(check: DoctorCheck): void {
  if (check.status === 'ok') {
    console.log(`  ${pc.green('✓')} ${check.label}`)
    return
  }
  if (check.status === 'info') {
    console.log(`  ${pc.dim(`Info: ${check.message || check.label}`)}`)
    if (check.hint)
      console.log(`    ${pc.dim(check.hint)}`)
    return
  }
  console.log(`  ${pc.yellow('!')} ${check.message || check.label}`)
  if (check.hint)
    console.log(`    ${pc.dim(check.hint)}`)
}

function printHistoryList(result: HistoryListResult): void {
  console.log()
  console.log(`  ${pc.bold('Archived Changes')}`)
  console.log()
  if (result.records.length === 0) {
    console.log(`  ${pc.dim('No archived Changes match the query.')}\n`)
    return
  }
  for (const record of result.records) {
    console.log(`  ${pc.dim(record.date)}  ${pc.cyan(record.workRef)}  ${pc.dim(`[${record.kind}]`)}`)
    console.log(`    ${record.summary}${record.summaryTruncated ? '…' : ''}`)
    console.log(`    ${pc.dim(record.path)}`)
  }
  console.log()
  console.log(`  ${pc.dim(`${result.summary.returned}/${result.summary.matched} matching archive(s) returned${result.summary.hasMore ? '; narrow filters or raise --limit for more' : ''}.`)}\n`)
}

function printHistoryDetail(result: HistoryDetailResult): void {
  const record = result.record
  console.log()
  console.log(`  ${pc.bold('Archived Change:')} ${pc.cyan(record.workRef)}`)
  console.log(`  ${pc.dim('Date:')} ${record.date}`)
  console.log(`  ${pc.dim('Kind:')} ${record.kind}`)
  console.log(`  ${pc.dim('Path:')} ${record.path}`)
  console.log(`  ${pc.dim('Summary:')} ${record.summary}${record.summaryTruncated ? '…' : ''}`)
  if ((record.issues?.length ?? 0) > 0) {
    console.log(`  ${pc.dim('Issues:')}`)
    for (const issue of record.issues ?? [])
      console.log(`    ${issue.relation} ${issue.url}`)
  }
  console.log(`  ${pc.dim('Scenarios:')} ${record.scenarioCount}`)
  console.log(`  ${pc.dim('Tasks:')} ${record.checkboxes.tasks.done}/${record.checkboxes.tasks.total}`)
  console.log(`  ${pc.dim('Verify:')} ${record.checkboxes.verify.done}/${record.checkboxes.verify.total}`)
  for (const [label, evidence] of Object.entries(record.evidence)) {
    console.log()
    console.log(`  ${pc.bold(`${label[0].toUpperCase()}${label.slice(1)}:`)}`)
    if (evidence.items.length === 0)
      console.log(`    ${pc.dim('none')}`)
    else
      evidence.items.forEach(item => console.log(`    ${item}`))
    if (evidence.truncated)
      console.log(`    ${pc.dim('(truncated)')}`)
  }
  console.log()
}

function printSpecsTree(result: Extract<SpecsResult, { ok: true, mode: 'tree' }>): void {
  console.log()
  console.log(`  ${pc.bold('Specs')}`)
  console.log(`  ${pc.dim('Checkout:')} ${formatSource(result.source)}`)
  console.log()
  printDirectory(result.tree, 1)
  console.log()
  console.log(`  ${pc.bold('Decision Records')}`)
  printDirectory(result.decisionRecords, 1)
  if (result.generatedIndexes.length > 0) {
    console.log()
    console.log(`  ${pc.dim(`${result.generatedIndexes.length} recognized or reserved generated-index path(s) classified for migration.`)}`)
  }
  console.log()
}

function printDirectory(node: SpecsDirectoryNode, depth: number): void {
  const indent = '  '.repeat(depth)
  if (node.documents.length === 0 && node.directories.length === 0) {
    console.log(`${indent}${pc.dim('(empty)')}`)
    return
  }
  for (const document of node.documents) {
    const detail = document.summary ? `${document.title} — ${document.summary}` : document.title
    console.log(`${indent}${pc.cyan(document.path)} ${pc.dim(`[${document.kind}]`)} — ${detail}`)
  }
  for (const directory of node.directories) {
    console.log(`${indent}${pc.bold(`${directory.name}/`)}`)
    printDirectory(directory, depth + 1)
  }
}

function printSpecsDetail(result: Extract<SpecsResult, { ok: true, mode: 'detail' }>): void {
  console.log()
  console.log(`  ${pc.bold(result.document.title)}`)
  console.log(`  ${pc.dim('Path:')} ${result.document.path}`)
  console.log(`  ${pc.dim('Kind:')} ${result.document.kind}`)
  console.log(`  ${pc.dim('Checkout:')} ${formatSource(result.source)}`)
  if (result.document.contentTruncated)
    console.log(`  ${pc.dim(`Content is bounded to ${SPECS_DETAIL_CONTENT_CODE_POINTS} code points.`)}`)
  console.log()
  console.log(result.document.content)
  if (!result.document.content.endsWith('\n'))
    console.log()
}

function printSpecsSearch(result: Extract<SpecsResult, { ok: true, mode: 'search' }>): void {
  console.log()
  console.log(`  ${pc.bold('Specs search:')} ${result.query.literal}`)
  console.log(`  ${pc.dim('Checkout:')} ${formatSource(result.source)}`)
  console.log()
  if (result.matches.length === 0) {
    console.log(`  ${pc.dim('No matching Specs content.')}\n`)
    return
  }
  for (const match of result.matches) {
    console.log(`  ${pc.cyan(`${match.path}:${match.line}`)} ${pc.dim(`[${match.kind}]`)}`)
    console.log(`    ${match.title}`)
    if (match.heading)
      console.log(`    ${pc.dim(match.heading)}`)
    console.log(`    ${match.excerpt}`)
  }
  console.log()
  console.log(`  ${pc.dim(`${result.summary.returned}/${result.summary.matched} match(es) returned from ${result.summary.searched} document(s).`)}\n`)
}

function formatSource(source: SpecsInspection['source']): string {
  const revision = source.gitHead ? source.gitHead.slice(0, 12) : 'no-git'
  const state = source.dirty === null ? 'unknown' : source.dirty ? 'dirty' : 'clean'
  return `${revision} ${state} (${source.root})`
}

function printDurableReview(review: {
  factDecisions: string[]
  rationaleDecisions: string[]
  factCandidateTargets: string[]
  decisionRecordsPath: string
  note: string
}): void {
  console.log(`    ${pc.dim('Current-fact options:')} ${review.factDecisions.join(' | ')}`)
  console.log(`    ${pc.dim('Rationale options:')} ${review.rationaleDecisions.join(' | ')}`)
  console.log(`    ${pc.dim('Current-fact targets:')} ${review.factCandidateTargets.join(', ')}`)
  console.log(`    ${pc.dim('Decision Record path:')} ${review.decisionRecordsPath}`)
  console.log(`    ${pc.dim(review.note)}`)
}

function formatArchiveReady(value: 'yes' | 'judgment' | 'no'): string {
  return value === 'yes' ? pc.green('yes') : pc.yellow(value)
}
