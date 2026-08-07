import type { ArchiveReadinessOutput, CommandRunOptions, RuntimeDiagnostic } from '../types.js'
import { readFile } from 'node:fs/promises'

import { resolveExecutableChange } from '../core/change-group.js'
import { inspectRspConfig, pc } from '../core/config.js'
import { resolveDecisionRecordsPath, validateDecisionRecordsFilesystemPath } from '../core/decisions.js'
import { inspectChangeDependencies } from '../core/dependency-plan.js'
import { buildDurableReviewGuidance, collectArchiveReadiness, getDurableReviewCandidateTargets, guardRspInitialized, normalizeLogicalPath, toArchiveReadinessOutput } from '../core/helpers.js'
import { emitJson, toErrorMessage } from '../core/output.js'
import { WorkRefError } from '../core/work-ref.js'

interface ReadyResult {
  command: 'ready'
  ok: true
  change: string
  path: string | null
  readiness: ArchiveReadinessOutput
  durableReview: {
    required: true
    factDecisions: string[]
    rationaleDecisions: string[]
    factCandidateTargets: string[]
    decisionRecordsPath: string
    note: string
  }
  warnings: string[]
  runtime: RuntimeDiagnostic[]
}

function exitReadyError(name: string, error: { code: string, message: string }, options: CommandRunOptions): never {
  if (options.json) {
    emitJson({
      command: 'ready',
      ok: false,
      change: name || null,
      path: null,
      warnings: [],
      runtime: [],
      error,
    }, options)
  }
  else {
    console.error(`  ${pc.red('Error:')} ${error.message}`)
  }
  process.exit(1)
}

export async function showReady(name: string, options: CommandRunOptions = {}): Promise<ReadyResult> {
  if (!name) {
    console.error(`  ${pc.red('Usage:')} rsp ready <name>`)
    process.exit(1)
  }
  guardRspInitialized()

  let workRef
  try {
    workRef = await resolveExecutableChange(name, { mustExist: true })
  }
  catch (error) {
    if (error instanceof WorkRefError)
      exitReadyError(name, { code: error.code, message: error.message }, options)
    throw error
  }
  const srcPath = workRef.path

  const runtime: RuntimeDiagnostic[] = []

  let content: string
  try {
    content = await readFile(srcPath, 'utf-8')
  }
  catch {
    console.error(`  ${pc.red('Error:')} unable to read .rsp/changes/${name}.md`)
    process.exit(1)
  }

  const dependencyInspection = await inspectChangeDependencies()
  const readinessDetails = collectArchiveReadiness(content, {
    activeBlockers: dependencyInspection.activeBlockers.get(name),
  })
  const checklist = readinessDetails.warnings
  const readiness = toArchiveReadinessOutput(readinessDetails)
  let decisionRecordsPath: string
  try {
    const configInspection = await inspectRspConfig()
    if (configInspection.issues.length > 0)
      exitReadyError(name, { code: 'invalid_config', message: configInspection.issues.join('; ') }, options)
    decisionRecordsPath = resolveDecisionRecordsPath(configInspection.config)
    const filesystemIssue = await validateDecisionRecordsFilesystemPath(decisionRecordsPath)
    if (filesystemIssue)
      exitReadyError(name, { code: 'invalid_decision_records_path', message: filesystemIssue }, options)
  }
  catch (error) {
    exitReadyError(name, { code: 'invalid_config', message: `.rsp/config.yaml could not be parsed: ${toErrorMessage(error)}` }, options)
  }
  const durableReview = buildDurableReviewGuidance(getDurableReviewCandidateTargets(), decisionRecordsPath)
  const result: ReadyResult = {
    command: 'ready',
    ok: true,
    change: name,
    path: normalizeLogicalPath(srcPath),
    readiness,
    durableReview,
    warnings: checklist,
    runtime,
  }

  if (options.json) {
    emitJson(result, options)
    return result
  }

  console.log()
  console.log(`  ${pc.bold('Archive readiness for')} ${pc.cyan(name)}`)
  console.log()

  if (checklist.length === 0) {
    console.log(`  ${pc.green('✓')} Ready to archive. No deterministic warnings found.\n`)
  }
  else {
    for (const line of checklist)
      console.log(`  ${pc.yellow('⚠')} ${line}`)
    console.log()
    console.log(`  ${pc.dim('Review the warnings above before treating this work as fully closed.')}`)
  }

  console.log(`  ${pc.dim('Deterministic readiness:')} ${readiness.deterministic === 'pass' ? pc.green('pass') : pc.yellow('warnings')}`)
  console.log(`  ${pc.dim('Completion gate:')} ${readiness.completionGate === 'pass' ? pc.green('pass') : pc.red('blocked')}`)
  console.log(`  ${pc.dim('Required verification:')} ${readiness.requiredVerify.done}/${readiness.requiredVerify.total}`)
  console.log(`  ${pc.dim('Optional coverage:')} ${readiness.optionalVerify.done}/${readiness.optionalVerify.total}${readiness.coverageWarnings > 0 ? pc.yellow(` · ${readiness.coverageWarnings} warning(s)`) : ''}`)
  console.log(`  ${pc.dim('Semantic review:')} ${pc.yellow('needed')}`)
  console.log(`  ${pc.dim('Archive ready:')} ${formatArchiveReady(readiness.archiveReady)}\n`)
  console.log(`  ${pc.bold('Durable review:')}`)
  console.log(`    ${pc.dim('Current-fact options:')} ${durableReview.factDecisions.join(' | ')}`)
  console.log(`    ${pc.dim('Rationale options:')} ${durableReview.rationaleDecisions.join(' | ')}`)
  console.log(`    ${pc.dim('Current-fact targets:')} ${durableReview.factCandidateTargets.join(', ')}`)
  console.log(`    ${pc.dim('Decision Record path:')} ${durableReview.decisionRecordsPath}`)
  console.log(`    ${pc.dim(durableReview.note)}\n`)
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
