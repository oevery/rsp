import type { ArchiveReadinessOutput, RuntimeDiagnostic } from '../types.js'
import { readFile } from 'node:fs/promises'

import { inspectChangeDocument } from '../core/change-document-inspection.js'
import { resolveExecutableChange } from '../core/change-group.js'
import { inspectRspConfig, resolveKinds, resolveRequiredSections } from '../core/config.js'
import { resolveDecisionRecordsPath, validateDecisionRecordsFilesystemPath } from '../core/decisions.js'
import { inspectChangeDependencies } from '../core/dependency-plan.js'
import { guardRspInitialized, normalizeLogicalPath } from '../core/filesystem.js'
import { toErrorMessage } from '../core/output.js'
import { buildDurableReviewGuidance, collectArchiveReadiness, getDurableReviewCandidateTargets, toArchiveReadinessOutput } from '../core/readiness.js'
import { WorkRefError } from '../core/work-ref.js'

export interface ReadySuccessResult {
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

export interface ReadyErrorResult {
  command: 'ready'
  ok: false
  change: string | null
  path: null
  warnings: []
  runtime: RuntimeDiagnostic[]
  error: { code: string, message: string }
  kind: 'usage' | 'resolution' | 'read' | 'config'
}

export type ReadyResult = ReadySuccessResult | ReadyErrorResult

function readyError(name: string, error: ReadyErrorResult['error'], kind: ReadyErrorResult['kind']): ReadyErrorResult {
  return { command: 'ready', ok: false, change: name || null, path: null, warnings: [], runtime: [], error, kind }
}

export async function showReady(name: string): Promise<ReadyResult> {
  if (!name)
    return readyError(name, { code: 'missing_change_name', message: 'rsp ready <name>' }, 'usage')
  guardRspInitialized()

  let workRef
  try {
    workRef = await resolveExecutableChange(name, { mustExist: true })
  }
  catch (error) {
    if (error instanceof WorkRefError)
      return readyError(name, { code: error.code, message: error.message }, 'resolution')
    throw error
  }
  const srcPath = workRef.path

  const runtime: RuntimeDiagnostic[] = []

  let content: string
  try {
    content = await readFile(srcPath, 'utf-8')
  }
  catch {
    return readyError(name, { code: 'change_read_failed', message: `unable to read .rsp/changes/${name}.md` }, 'read')
  }

  let decisionRecordsPath: string
  let configInspection: Awaited<ReturnType<typeof inspectRspConfig>>
  try {
    configInspection = await inspectRspConfig()
    if (configInspection.issues.length > 0)
      return readyError(name, { code: 'invalid_config', message: configInspection.issues.join('; ') }, 'config')
    decisionRecordsPath = resolveDecisionRecordsPath(configInspection.config)
    const filesystemIssue = await validateDecisionRecordsFilesystemPath(decisionRecordsPath)
    if (filesystemIssue)
      return readyError(name, { code: 'invalid_decision_records_path', message: filesystemIssue }, 'config')
  }
  catch (error) {
    return readyError(name, { code: 'invalid_config', message: `.rsp/config.yaml could not be parsed: ${toErrorMessage(error)}` }, 'config')
  }
  const dependencyInspection = await inspectChangeDependencies()
  const readinessDetails = collectArchiveReadiness(content, {
    activeBlockers: dependencyInspection.activeBlockers.get(name),
    documentDiagnostics: inspectChangeDocument(content, {
      name,
      validKinds: resolveKinds(configInspection.config),
      requiredSections: resolveRequiredSections(configInspection.config),
    }),
  })
  const checklist = readinessDetails.warnings
  const readiness = toArchiveReadinessOutput(readinessDetails)
  const durableReview = buildDurableReviewGuidance(getDurableReviewCandidateTargets(), decisionRecordsPath)
  const result: ReadySuccessResult = {
    command: 'ready',
    ok: true,
    change: name,
    path: normalizeLogicalPath(srcPath),
    readiness,
    durableReview,
    warnings: checklist,
    runtime,
  }

  return result
}
