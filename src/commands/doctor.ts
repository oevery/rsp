import type { CommandRunOptions, RuntimeDiagnostic } from '../types.js'
import type { UpdateOptions } from './update.js'
import { existsSync } from 'node:fs'
import { readdir, readFile, stat } from 'node:fs/promises'
import { basename, join, relative } from 'node:path'

import { hasRspAgentsBlock } from '../core/artifacts.js'
import { inspectChangeGroups } from '../core/change-group.js'
import { clearConfigCache, inspectRspConfig, loadRspConfig, OBSOLETE_RSP_RULES_PATH, pc, RSP_DIR, RSP_RULES_PATH } from '../core/config.js'
import { DEFAULT_DECISION_RECORDS_PATH, resolveDecisionRecordsPath, validateDecisionRecordsFilesystemPath } from '../core/decisions.js'
import { inspectChangeDependencies } from '../core/dependency-plan.js'
import { inspectUnsupportedRules, normalizeLogicalPath, walkMarkdownFiles } from '../core/filesystem.js'
import { inspectManagedFile } from '../core/managed-path.js'
import { emitJson, recordRuntimeDiagnostic, toErrorMessage } from '../core/output.js'
import { GROUP_BRIEF_FILENAME, inspectArchiveTree, inspectFocusTree, inspectWorkTree, resolveWorkRef, WorkRefError } from '../core/work-ref.js'
import { inspectSpecs, specsInspectionComplete } from '../specs/query.js'
import { updateProject, UpdateTransactionError } from './update.js'

interface DoctorCheck {
  status: 'ok' | 'issue' | 'info'
  code?: string
  label: string
  message?: string
  hint?: string
}

interface DoctorResult {
  command: 'doctor'
  ok: boolean
  fixed: string[]
  checks: DoctorCheck[]
  runtime: RuntimeDiagnostic[]
  summary: {
    issues: number
  }
}

export interface DoctorOptions extends CommandRunOptions {
  fix?: boolean
  testing?: UpdateOptions['testing']
}

export async function runDoctor(options: DoctorOptions = {}): Promise<DoctorResult> {
  const fixed: string[] = []
  let repairIssue: string | null = null

  if (options.fix && existsSync(RSP_DIR)) {
    try {
      const update = await updateProject({
        quiet: Boolean(options.json),
        testing: options.testing,
      })
      fixed.push(...update.actions)
    }
    catch (error) {
      if (error instanceof UpdateTransactionError) {
        fixed.push(
          ...error.rollback.retainedMutations.map(path => `partial update mutation retained: ${path}`),
          ...error.rollback.recoveryPaths.map(path => `update recovery copy retained: ${path}`),
        )
      }
      repairIssue = `safe deterministic repair could not run: ${toErrorMessage(error)}`
    }
  }

  const checks: DoctorCheck[] = []
  if (repairIssue) {
    checks.push({
      status: 'issue',
      label: 'safe deterministic repairs completed',
      message: repairIssue,
      hint: 'Resolve the reported configuration or filesystem issue, then run rsp doctor --fix again.',
    })
  }
  const runtime: RuntimeDiagnostic[] = []
  const reportRuntime = (diagnostic: RuntimeDiagnostic) => recordRuntimeDiagnostic(runtime, diagnostic, Boolean(options.verbose) && !options.json)

  const designPath = join(RSP_DIR, 'specs', 'design.md')
  reportCheck(checks, '.rsp exists', existsSync(RSP_DIR), 'Run: rsp init')
  reportFallbackProtocol(checks)
  await reportUnsupportedRules(checks, reportRuntime)
  reportCheck(checks, 'specs/design.md exists', existsSync(designPath), 'Run: rsp init')

  await checkAgents(checks, reportRuntime)
  await checkSpecsTree(checks, reportRuntime)
  await checkArchiveNaming(checks)
  const decisionRecordsConfigValid = await checkConfigSemantics(checks, reportRuntime)
  if (decisionRecordsConfigValid) {
    await checkDecisionRecordsDirectory(checks, reportRuntime)
    await checkInactiveDefaultDecisionRecords(checks, reportRuntime)
  }
  await checkActiveChangeConsistency(checks)
  const result: DoctorResult = {
    command: 'doctor',
    ok: checks.every(check => check.status !== 'issue'),
    fixed,
    checks,
    runtime,
    summary: {
      issues: checks.filter(check => check.status === 'issue').length,
    },
  }

  if (options.json) {
    emitJson(result, options)
    return result
  }

  console.log()
  console.log(`  ${pc.bold('RSP doctor')}`)
  console.log()
  if (fixed.length > 0) {
    console.log(`  ${pc.green('Fixed:')} ${fixed.join(', ')}`)
    console.log()
  }
  else if (options.fix && !repairIssue && existsSync(RSP_DIR)) {
    console.log(`  ${pc.dim('No safe fixes needed.')}`)
    console.log()
  }
  for (const check of checks)
    printDoctorCheck(check)

  if (result.summary.issues === 0)
    console.log(`\n  ${pc.green('✓')} RSP setup looks healthy.\n`)
  else
    console.log(`\n  ${pc.yellow(String(result.summary.issues))} issue(s) detected.\n`)

  return result
}

function reportFallbackProtocol(checks: DoctorCheck[]): void {
  const canonical = inspectManagedFile(RSP_RULES_PATH, 'fallback protocol', { allowMissing: true })
  const obsoleteExists = existsSync(OBSOLETE_RSP_RULES_PATH)

  if (canonical.issue) {
    checks.push({
      status: 'issue',
      label: 'rsp-rules.md is a regular managed file',
      message: canonical.issue.message,
      hint: 'Replace the unsupported entry with a project-local regular file, then run: rsp update',
    })
  }
  else if (canonical.exists) {
    checks.push({ status: 'ok', label: 'rsp-rules.md exists' })
  }
  else if (!obsoleteExists) {
    checks.push({
      status: 'issue',
      label: 'rsp-rules.md exists',
      hint: existsSync(RSP_DIR) ? 'Run: rsp update' : 'Run: rsp init',
    })
  }

  if (obsoleteExists) {
    checks.push({
      status: 'issue',
      label: 'obsolete fallback protocol path detected',
      message: 'obsolete fallback protocol path detected',
      hint: 'Run: rsp update',
    })
  }
}

async function reportUnsupportedRules(checks: DoctorCheck[], reportRuntime: (diagnostic: RuntimeDiagnostic) => void): Promise<void> {
  const inspection = await inspectUnsupportedRules()
  for (const diagnostic of inspection.diagnostics)
    reportRuntime(diagnostic)

  if (inspection.diagnostics.length > 0) {
    checks.push({
      status: 'issue',
      label: 'unable to inspect .rsp/rules/',
      message: 'unable to inspect .rsp/rules/; migration status is unknown',
      hint: 'Fix directory access, then run: rsp doctor',
    })
    return
  }

  if (!inspection.directoryRemaining)
    return

  const entries = inspection.entries.map(entry => entry.path)
  checks.push({
    status: 'issue',
    label: 'unsupported .rsp/rules/ entries',
    message: entries.length > 0
      ? `unsupported .rsp/rules/ entries: ${entries.join(', ')}`
      : 'unsupported empty .rsp/rules/ directory remains',
    hint: 'Move stable scoped instructions to the nearest project-owned AGENTS.md, remove obsolete entries, then run rsp update',
  })
}

function reportCheck(checks: DoctorCheck[], label: string, ok: boolean, fixHint?: string): void {
  if (ok) {
    checks.push({ status: 'ok', label })
    return
  }
  checks.push({ status: 'issue', label, hint: fixHint })
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

async function checkAgents(checks: DoctorCheck[], reportRuntime: (diagnostic: RuntimeDiagnostic) => void): Promise<void> {
  const inspection = inspectManagedFile('AGENTS.md', 'AGENTS.md', { allowMissing: true })
  if (inspection.issue) {
    checks.push({
      status: 'issue',
      label: 'AGENTS.md is a regular managed file',
      message: inspection.issue.message,
      hint: 'Replace the unsupported entry with a project-local regular file, then run: rsp update',
    })
    return
  }

  if (!inspection.exists) {
    checks.push({ status: 'issue', label: 'AGENTS.md contains managed RSP block', message: 'AGENTS.md missing', hint: 'Run: rsp init' })
    return
  }

  let agents: string
  try {
    agents = await readFile('AGENTS.md', 'utf-8')
  }
  catch (error) {
    reportRuntime({
      code: 'agents_read_failed',
      operation: 'readFile',
      path: 'AGENTS.md',
      message: toErrorMessage(error),
    })
    checks.push({ status: 'issue', label: 'AGENTS.md contains managed RSP block', message: 'AGENTS.md could not be read', hint: 'Check AGENTS.md permissions or recreate it with rsp init' })
    return
  }

  if (hasRspAgentsBlock(agents)) {
    checks.push({ status: 'ok', label: 'AGENTS.md contains managed RSP block' })
    return
  }

  checks.push({ status: 'issue', label: 'AGENTS.md contains managed RSP block', message: 'AGENTS.md missing managed RSP block', hint: 'Run: rsp init' })
}

async function checkSpecsTree(checks: DoctorCheck[], reportRuntime: (diagnostic: RuntimeDiagnostic) => void): Promise<void> {
  try {
    const inspection = await inspectSpecs()
    for (const diagnostic of inspection.runtime)
      reportRuntime(diagnostic)
    if (!specsInspectionComplete(inspection)) {
      checks.push({
        status: 'issue',
        label: 'Specs tree is directly queryable',
        message: inspection.diagnostics.map(diagnostic => diagnostic.message).join('; '),
        hint: 'Resolve the reported Specs path, file, or reserved-content issue, then run rsp doctor again.',
      })
      return
    }
    checks.push({ status: 'ok', label: 'Specs tree is directly queryable' })
    const removable = inspection.generatedIndexes.filter(index => index.classification === 'safe-removal')
    if (removable.length > 0) {
      checks.push({
        status: 'issue',
        code: 'generated_specs_indexes_require_migration',
        label: 'generated Specs indexes are migrated to direct navigation',
        message: `${removable.length} metadata-recognized generated Specs index path(s) remain: ${removable.map(index => index.path).join(', ')}`,
        hint: 'Run: rsp update. It removes only metadata-recognized generated Specs indexes; owner-controlled reserved content remains fail-closed.',
      })
    }
  }
  catch (error) {
    const message = toErrorMessage(error)
    reportRuntime({
      code: 'specs_query_inspection_failed',
      operation: 'inspectSpecs',
      path: '.rsp/specs',
      message,
    })
    checks.push({
      status: 'issue',
      label: 'Specs tree is directly queryable',
      message,
      hint: 'Resolve the reported config or Specs filesystem issue, then run rsp doctor again.',
    })
  }
}

async function checkArchiveNaming(checks: DoctorCheck[]): Promise<void> {
  const archivesDir = join(RSP_DIR, 'archives')
  const inspection = await inspectArchiveTree({ archivesDir })
  if (inspection.diagnostics.length > 0) {
    checks.push({
      status: 'issue',
      label: 'archives use supported managed paths',
      message: inspection.diagnostics.map(diagnostic => diagnostic.message).join('; '),
      hint: 'Keep archives flat or one real group directory deep; remove symlinks and unsupported entries.',
    })
    return
  }
  checks.push({ status: 'ok', label: 'archives use supported managed paths' })

  const invalidFiles = inspection.files
    .map(fp => normalizeLogicalPath(relative(archivesDir, fp)))
    .filter(fp => /^\d{4}-\d{2}-\d{2}_.+\.md$/.test(basename(fp)) === false)

  if (invalidFiles.length === 0) {
    checks.push({ status: 'ok', label: 'archived change files follow the date_name.md convention' })
    return
  }

  checks.push({
    status: 'issue',
    label: 'archived change files follow the date_name.md convention',
    message: `archived change files with invalid names: ${invalidFiles.join(', ')}`,
    hint: 'Rename archive files to YYYY-MM-DD_name.md and run: rsp update',
  })
}

async function checkConfigSemantics(checks: DoctorCheck[], reportRuntime: (diagnostic: RuntimeDiagnostic) => void): Promise<boolean> {
  clearConfigCache()
  let inspection: Awaited<ReturnType<typeof inspectRspConfig>>
  try {
    inspection = await inspectRspConfig()
  }
  catch (error) {
    const message = toErrorMessage(error)
    reportRuntime({
      code: 'invalid_config',
      operation: 'inspectRspConfig',
      path: '.rsp/config.yaml',
      message,
    })
    checks.push({
      status: 'issue',
      code: 'invalid_config',
      label: 'config.yaml semantic checks',
      message,
      hint: 'Fix the reported config file, YAML, or managed-path issue.',
    })
    return false
  }

  for (const issue of inspection.issues) {
    checks.push({
      status: 'issue',
      code: 'invalid_config',
      label: 'config.yaml semantic checks',
      message: issue,
      hint: issue.includes('decisions')
        ? 'Use .rsp/specs/decisions or one project-relative path outside .rsp/.'
        : 'Remove the unsupported field or provide the documented value type.',
    })
  }

  if (inspection.issues.length === 0 && inspection.config.kinds !== undefined)
    checks.push({ status: 'ok', label: 'config.yaml field "kinds" has valid list semantics' })

  return inspection.issues.length === 0
}

async function checkDecisionRecordsDirectory(checks: DoctorCheck[], reportRuntime: (diagnostic: RuntimeDiagnostic) => void): Promise<void> {
  const decisionRecordsPath = resolveDecisionRecordsPath(await loadRspConfig())
  try {
    const filesystemError = await validateDecisionRecordsFilesystemPath(decisionRecordsPath)
    if (filesystemError) {
      checks.push({
        status: 'issue',
        label: `${decisionRecordsPath} is the authoritative Decision Record directory`,
        message: filesystemError,
        hint: 'Choose a project-relative directory that does not escape through a symlink.',
      })
      return
    }
    const info = await stat(decisionRecordsPath)
    if (info.isDirectory())
      await readdir(decisionRecordsPath)
    reportCheck(
      checks,
      `${decisionRecordsPath} is the authoritative Decision Record directory`,
      info.isDirectory(),
      'Run: rsp update',
    )
  }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      reportRuntime({
        code: 'decision_records_path_stat_failed',
        operation: 'stat',
        path: decisionRecordsPath,
        message: toErrorMessage(error),
      })
    }
    checks.push({
      status: 'issue',
      label: `${decisionRecordsPath} is the authoritative Decision Record directory`,
      message: `${decisionRecordsPath} Decision Record directory is missing or unreadable`,
      hint: 'Run: rsp update',
    })
  }
}

async function checkInactiveDefaultDecisionRecords(checks: DoctorCheck[], reportRuntime: (diagnostic: RuntimeDiagnostic) => void): Promise<void> {
  const decisionRecordsPath = resolveDecisionRecordsPath(await loadRspConfig())
  if (decisionRecordsPath === DEFAULT_DECISION_RECORDS_PATH || !existsSync(DEFAULT_DECISION_RECORDS_PATH))
    return

  let inspectionFailed = false
  const inactiveRecords = (await walkMarkdownFiles(DEFAULT_DECISION_RECORDS_PATH, {
    onError: (diagnostic) => {
      inspectionFailed = true
      reportRuntime(diagnostic)
    },
  }))
    .map(path => normalizeLogicalPath(relative(DEFAULT_DECISION_RECORDS_PATH, path)))
    .sort()

  if (inspectionFailed) {
    checks.push({
      status: 'issue',
      label: 'inactive default Decision Records are inspectable',
      message: `unable to inspect inactive default Decision Records under ${DEFAULT_DECISION_RECORDS_PATH}`,
      hint: 'Restore directory access, then run rsp doctor again.',
    })
    return
  }

  if (inactiveRecords.length === 0)
    return

  checks.push({
    status: 'issue',
    label: 'inactive default Decision Records are migrated',
    message: `inactive default Decision Records: ${inactiveRecords.join(', ')}`,
    hint: `Move lasting rationale to ${decisionRecordsPath}, then remove the inactive files from ${DEFAULT_DECISION_RECORDS_PATH}.`,
  })
}

async function checkActiveChangeConsistency(checks: DoctorCheck[]): Promise<void> {
  const workTree = await inspectWorkTree()
  const focusTree = await inspectFocusTree()
  const groupInspection = await inspectChangeGroups({ workTree, focusTree })
  const dependencyInspection = await inspectChangeDependencies({ workTree })
  const changeNames = new Set(workTree.changes.map(ref => ref.name))
  const structureIssues = workTree.diagnostics.map(diagnostic => diagnostic.message)
  structureIssues.push(...focusTree.diagnostics.map(diagnostic => diagnostic.message))
  const rawFocusNames = new Set(focusTree.markers.map(marker => marker.name))
  const focusNames = new Set<string>()
  for (const name of rawFocusNames) {
    try {
      focusNames.add(resolveWorkRef(name, { executable: true }).name)
    }
    catch (error) {
      if (!(error instanceof WorkRefError))
        throw error
      structureIssues.push(`focus.d/${name}: ${error.message}`)
    }
  }

  const uniqueStructureIssues = [...new Set(structureIssues)]
  if (uniqueStructureIssues.length === 0) {
    checks.push({ status: 'ok', label: 'open work uses supported WorkRef shapes' })
  }
  else {
    checks.push({
      status: 'issue',
      label: 'open work uses supported WorkRef shapes',
      message: uniqueStructureIssues.join('; '),
      hint: 'Keep work flat or use one group directory with direct Change files. Use rsp unfocus <group>/brief to clear an accidental Group Brief marker.',
    })
  }

  const groupStructureIssues = workTree.diagnostics
    .filter(diagnostic => diagnostic.code === 'group_brief_missing' || diagnostic.path.endsWith(`/${GROUP_BRIEF_FILENAME}`))
    .map(diagnostic => diagnostic.message)
  const groupIssues = [
    ...groupInspection.diagnostics.filter(diagnostic => diagnostic.severity === 'error').map(diagnostic => diagnostic.message),
    ...groupStructureIssues,
  ]
  const groupWarnings = groupInspection.diagnostics.filter(diagnostic => diagnostic.severity === 'warning')
  if (groupIssues.length === 0) {
    checks.push({ status: 'ok', label: 'Change Group contracts are valid' })
  }
  else {
    checks.push({
      status: 'issue',
      label: 'Change Group contracts are valid',
      message: [...new Set(groupIssues)].join('; '),
      hint: `Keep one ${GROUP_BRIEF_FILENAME} per group and make its Slices list match direct open or archived child Changes.`,
    })
  }
  if (groupWarnings.length > 0) {
    checks.push({
      status: 'info',
      label: 'Change Group completion guidance',
      message: [...new Set(groupWarnings.map(diagnostic => diagnostic.message))].join('; '),
    })
  }

  const dependencyIssues = dependencyInspection.diagnostics.filter(diagnostic => diagnostic.severity === 'error')
  if (dependencyIssues.length === 0) {
    checks.push({ status: 'ok', label: 'Change dependency graph is valid' })
  }
  else {
    checks.push({
      status: 'issue',
      label: 'Change dependency graph is valid',
      message: [...new Set(dependencyIssues.map(diagnostic => diagnostic.message))].join('; '),
      hint: 'Use exact existing Change WorkRefs, remove self-dependencies, and break dependency cycles.',
    })
  }

  const missingChangeFiles = [...focusNames].filter(name => !changeNames.has(name))
  const unfocusedChangeFiles = [...changeNames].filter(name => !focusNames.has(name))

  if (missingChangeFiles.length === 0) {
    checks.push({ status: 'ok', label: 'every focus marker maps to a change file' })
  }
  else {
    checks.push({
      status: 'issue',
      label: 'every focus marker maps to a change file',
      message: `focus markers without matching change files: ${missingChangeFiles.join(', ')}`,
      hint: 'Run: remove stale files in .rsp/focus.d/ or recreate the change with rsp create <name>',
    })
  }

  if (unfocusedChangeFiles.length === 0) {
    checks.push({ status: 'ok', label: 'focus markers are consistent with open changes' })
  }
  else {
    const preview = unfocusedChangeFiles.slice(0, 5).join(', ')
    const extra = unfocusedChangeFiles.length > 5 ? ` (+${unfocusedChangeFiles.length - 5} more)` : ''
    checks.push({
      status: 'info',
      label: 'focus markers are consistent with open changes',
      message: `unfocused open changes: ${preview}${extra}`,
      hint: 'Only changes listed in .rsp/focus.d/ are currently focused. Use rsp focus <name> to foreground one.',
    })
  }
}
