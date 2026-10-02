import { randomUUID } from 'node:crypto'
import { lstatSync, mkdirSync, readFileSync, realpathSync } from 'node:fs'
import { basename, dirname, isAbsolute, join, relative, resolve } from 'node:path'
import { setImmediate } from 'node:timers/promises'
import { createOpenCodexAdapter } from '../adapters/opencodex.mjs'
import { cancellationReason } from '../adapters/process.mjs'
import { loadCase } from './cases.mjs'
import { loadConfig } from './config.mjs'
import { harnessIdentity, sourceIdentity } from './execute.mjs'
import { hash, writeJson } from './files.mjs'
import { createProgress } from './progress.mjs'
import { reviewRun } from './review.mjs'

function refuse(kind, message) {
  throw Object.assign(new Error(message), { code: `REASSESS_${kind}` })
}
function readReport(path, name, boundary) {
  try {
    if (typeof path !== 'string' || basename(path) !== name)
      throw new Error('path')
    const full = realpathSync(resolve(path))
    const part = boundary && relative(boundary, full)
    const stat = lstatSync(resolve(path))
    if (!stat.isFile() || (boundary && (part === '..' || part.startsWith('../') || isAbsolute(part))))
      throw new Error('boundary')
    const bytes = readFileSync(full)
    const value = JSON.parse(bytes)
    if (!value || typeof value !== 'object' || Array.isArray(value))
      throw new Error('record')
    return { value, hash: hash(bytes), path: full }
  }
  catch { refuse('REPORT', 'Select readable regular matrix.json and run.json records within the retained bundle.') }
}

// Record consistency is a review warning, not eligibility for reading history.
// No retained command or oracle is executed, and no source record is rewritten.
export function retainedExecution(matrixPath, caseId) {
  const source = readReport(matrixPath, 'matrix.json')
  if (!Array.isArray(source.value.runs))
    refuse('REPORT', 'The selected matrix has no run records.')
  const matches = source.value.runs.filter(item => item?.case === caseId)
  if (matches.length !== 1)
    refuse('SELECTION', 'Select exactly one retained run for the case.')
  const item = matches[0]
  const retained = readReport(item.run, 'run.json', dirname(source.path))
  const run = { ...retained.value, reportDirectory: dirname(retained.path) }
  const warnings = []
  if (run.case !== caseId)
    warnings.push('Recorded case identity differs from the selected matrix member.')
  if (!item.runHash || item.runHash !== retained.hash)
    warnings.push('Original run hash is missing or mismatched; this record does not establish intact original evidence.')
  if (!run.identity?.sharedConfigHash)
    warnings.push('Legacy record lacks current configuration metadata; reviewable but not current-candidate acceptance.')
  if (!run.retainedEvidence)
    warnings.push('Legacy record has only summary artifacts; missing original task text cannot be recovered.')
  if (run.verdict?.status !== 'passed' || run.cancelled || run.result?.cancelled)
    warnings.push('Execution failed, stopped or was incomplete; assess available evidence without assuming success.')
  return { source, retained, run, item, warnings }
}

export function optionalBaseline(matrixPath, caseId) {
  try {
    return retainedExecution(matrixPath, caseId)
  }
  catch (error) {
    if (error.code !== 'REASSESS_SELECTION')
      throw error
    return { warnings: [`Historical matrix has no unique matching case; no comparison evidence for ${caseId}.`] }
  }
}

export async function reassess(root, opts) {
  if (!opts.matrix || !opts.case || opts.case.includes(',') || opts.suite)
    refuse('SELECTION', 'Select one --matrix and one --case, not a suite.')
  const maxSessions = Number(opts['max-sessions'])
  if (opts['allow-live'] && (!opts['config-file'] || !Number.isInteger(maxSessions) || maxSessions < 1))
    refuse('PERMISSION', 'Judging requires --allow-live, --config-file and a positive --max-sessions budget.')
  if (opts['timeout-ms'] !== undefined)
    refuse('OPTION', 'Model total deadlines are not supported.')
  const timeoutMs = null
  const original = retainedExecution(opts.matrix, opts.case)
  const { source, retained, run, warnings } = original
  const comparison = opts.baseline ? optionalBaseline(opts.baseline, opts.case) : null
  if (comparison)
    warnings.push(...comparison.warnings.map(message => `Baseline: ${message}`))
  try {
    if (loadCase(root, opts.case).inputHash !== run.identity?.caseHash || sourceIdentity(root) !== run.identity?.sourceHash)
      warnings.push('Current case or source differs from the execution; this is historical review, not current-candidate acceptance.')
  }
  catch { warnings.push('Current case/source identity is unavailable; assess the recorded task only.') }
  const config = loadConfig()
  const outputRoot = join(resolve(opts['output-root'] ?? join(root, 'tests/skills/reports/reassessments')), randomUUID())
  mkdirSync(outputRoot, { recursive: true, mode: 0o700 })
  const reportPath = join(outputRoot, 'lineage.json')
  const lineage = { schema: 'skill-reassessment-v2', status: 'preview', mode: opts['allow-live'] ? 'judge' : 'offline', timeoutMs, sourceMatrix: source.path, sourceMatrixHash: source.hash, originalRun: retained.path, originalRunHash: retained.hash, originalExecutionIdentity: run.identity ?? null, currentHarnessHash: harnessIdentity(root), currentConfigHash: config.hash, judgeConfig: config.judge, ...(comparison?.run && { baselineMatrix: comparison.source.path, baselineMatrixHash: comparison.source.hash, baselineRun: comparison.retained.path, baselineRunHash: comparison.retained.hash }), warnings, case: opts.case, rootSessions: 0, executorSessions: 0, cancelled: false, cancellationReason: null, evidenceScope: 'Historical execution review, not a fresh execution or current-candidate acceptance.' }
  const save = () => writeJson(reportPath, lineage)
  save()
  if (!opts['allow-live'])
    return { report: reportPath, status: 'preview', warnings, rootSessions: 0, executorSessions: 0 }
  const controller = new AbortController()
  const { signal } = controller
  const interrupt = () => controller.abort('SIGINT')
  const terminate = () => controller.abort('SIGTERM')
  process.on('SIGINT', interrupt)
  process.on('SIGTERM', terminate)
  const progress = createProgress(outputRoot)
  progress.activity({ caseId: opts.case, role: 'judge', phase: 'review', state: 'observing' })
  try {
    await setImmediate()
    signal.throwIfAborted()
    const adapter = createOpenCodexAdapter({ configFile: opts['config-file'], authFile: opts['auth-file'], codexBin: opts['codex-bin'], role: 'judge' })
    lineage.reviewerSettings = adapter.settings
    const review = await reviewRun(run, { adapter, outputRoot, signal, baseline: comparison?.run, warnings, onActivity: progress.activity, beforeAttempt() {
      lineage.rootSessions++
      save()
    }, onProgress(report) {
      lineage.review = report.reportPath
      lineage.reviewHash = hash(readFileSync(report.reportPath))
      save()
    } })
    lineage.status = review.status
    lineage.reviewReport = review.report
    lineage.parsed = review.parsed
  }
  catch {
    lineage.status = 'inconclusive'
    lineage.reason = 'REASSESS_UNAVAILABLE'
  }
  finally {
    await setImmediate()
    if (signal.aborted) {
      lineage.cancelled = true
      lineage.cancellationReason = cancellationReason(signal)
      lineage.status = 'inconclusive'
    }
    try {
      progress.finish()
      lineage.progressError = progress.error
      save()
    }
    finally {
      process.removeListener('SIGINT', interrupt)
      process.removeListener('SIGTERM', terminate)
    }
  }
  return { report: reportPath, reviewReport: lineage.reviewReport, status: lineage.status, rootSessions: lineage.rootSessions, executorSessions: 0 }
}
