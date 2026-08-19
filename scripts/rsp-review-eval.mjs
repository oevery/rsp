#!/usr/bin/env node

import { execFileSync, spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { basename, isAbsolute, join, relative, resolve, sep } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { parse as parseYaml } from 'yaml'

const CASE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const PROVIDER_ID = /^[\w-]+$/
const PIPELINE_STATES = new Set(['blocked', 'clean', 'issues_found', 'skipped'])

function assertContained(parent, child, label) {
  const resolvedParent = resolve(parent)
  const resolvedChild = resolve(child)
  if (resolvedChild !== resolvedParent && !resolvedChild.startsWith(`${resolvedParent}${sep}`))
    throw new Error(`Unsafe ${label}: ${relative(resolvedParent, resolvedChild)}`)
}

function fixtureRoot(root) {
  return join(root, 'evaluation', 'skill-behavior', 'fixtures')
}

function assertRelativeFixturePath(path, label) {
  if (typeof path !== 'string' || path.length === 0 || isAbsolute(path))
    throw new Error(`Invalid ${label}: ${String(path)}`)
  const probeRoot = resolve('/fixture')
  const resolved = resolve(probeRoot, path)
  assertContained(probeRoot, resolved, label)
  if (resolved === probeRoot)
    throw new Error(`Invalid ${label}: ${path}`)
}

function assertNoSymlinkPath(root, target, label) {
  let current = root
  for (const segment of relative(root, target).split(sep)) {
    current = join(current, segment)
    if (existsSync(current) && lstatSync(current).isSymbolicLink())
      throw new Error(`Unsafe ${label}: symlink path component ${relative(root, current)}`)
  }
}

function readCase(root, id) {
  if (!CASE_ID.test(id))
    throw new Error(`Invalid evaluation case id: ${id}`)

  const fixtures = fixtureRoot(root)
  const directory = join(fixtures, id)
  assertContained(fixtures, directory, 'fixture path')
  const casePath = join(directory, 'case.yaml')
  if (!existsSync(casePath))
    throw new Error(`Unknown evaluation case: ${id}`)

  const value = parseYaml(readFileSync(casePath, 'utf8'))
  if (!value || value.id !== id || !Array.isArray(value.tags) || typeof value.request !== 'string')
    throw new Error(`Invalid evaluation case manifest: ${id}`)
  if (!value.expected || !PIPELINE_STATES.has(value.expected.code) || !PIPELINE_STATES.has(value.expected.document))
    throw new Error(`Invalid pipeline expectations: ${id}`)
  if (!Array.isArray(value.expected.observations) || !Array.isArray(value.expected.prohibited_actions))
    throw new Error(`Invalid evaluation expectations: ${id}`)
  if (value.tags.includes('real-world-derived')
    && (value.source_class !== 'real-world-derived' || value.sanitization !== 'independent-reimplementation')) {
    throw new Error(`Invalid real-world fixture provenance: ${id}`)
  }
  if (value.workspace !== undefined) {
    if (!value.workspace || typeof value.workspace !== 'object' || Array.isArray(value.workspace))
      throw new Error(`Invalid workspace operations: ${id}`)
    for (const operation of ['remove', 'stage']) {
      const paths = value.workspace[operation] ?? []
      if (!Array.isArray(paths))
        throw new Error(`Invalid workspace ${operation} paths: ${id}`)
      for (const path of paths)
        assertRelativeFixturePath(path, `workspace ${operation} path`)
    }
  }

  return { directory, value }
}

export function loadEvaluationCases(root) {
  return readdirSync(fixtureRoot(root), { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => readCase(root, entry.name).value)
    .sort((left, right) => left.id.localeCompare(right.id))
}

function git(workspace, args) {
  return execFileSync('git', args, { cwd: workspace, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
}

function hashContent(content) {
  return createHash('sha256').update(content).digest('hex')
}

function hashFile(path) {
  return hashContent(readFileSync(path))
}

const HARNESS_PATH = fileURLToPath(import.meta.url)
const LOADED_HARNESS_HASH = hashFile(HARNESS_PATH)

function listTreeFiles(directory, current = directory) {
  const paths = []
  for (const entry of readdirSync(current, { withFileTypes: true })) {
    if (entry.name === '.git')
      continue
    const path = join(current, entry.name)
    if (entry.isDirectory())
      paths.push(...listTreeFiles(directory, path))
    else
      paths.push(path)
  }
  return paths.sort()
}

function hashTree(directory) {
  const hash = createHash('sha256')
  for (const path of listTreeFiles(directory)) {
    hash.update(relative(directory, path))
    hash.update('\0')
    hash.update(readFileSync(path))
    hash.update('\0')
  }
  return hash.digest('hex')
}

function captureIdentityHash(label, compute, errors) {
  try {
    return compute()
  }
  catch {
    errors.push(`${label} unavailable after execution`)
    return null
  }
}

function executable(codexBin, args) {
  if (codexBin.endsWith('.mjs'))
    return { args: [codexBin, ...args], command: process.execPath }
  return { args, command: codexBin }
}

function commandVersion(codexBin) {
  const invocation = executable(codexBin, ['--version'])
  return execFileSync(invocation.command, invocation.args, { encoding: 'utf8' }).trim()
}

function evaluationConfigArgs({ isolated, provider }) {
  if (isolated && provider)
    throw new Error('Evaluation provider and isolated mode are mutually exclusive')
  if (isolated)
    return ['--ignore-user-config']
  if (provider)
    return ['--config', `model_provider="${provider}"`]
  return []
}

function runCommand({ args, command, cwd, env, input, timeoutMs }) {
  return new Promise((resolveRun) => {
    const child = spawn(command, args, { cwd, env, stdio: ['pipe', 'pipe', 'pipe'] })
    let settled = false
    let stderr = ''
    let stdout = ''
    let timedOut = false
    let forceKill
    let timeout
    const finish = (result) => {
      if (settled)
        return
      settled = true
      clearTimeout(timeout)
      clearTimeout(forceKill)
      resolveRun(result)
    }
    timeout = setTimeout(() => {
      timedOut = true
      child.kill('SIGTERM')
      forceKill = setTimeout(() => child.kill('SIGKILL'), 5_000)
    }, timeoutMs)
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', chunk => stdout += chunk)
    child.stderr.on('data', chunk => stderr += chunk)
    child.on('error', error => finish({ code: null, error, stderr, stdout, timedOut }))
    child.on('close', code => finish({ code, error: null, stderr, stdout, timedOut }))
    child.stdin.end(input)
  })
}

function summarizeEvents(raw) {
  const byItemType = {}
  const byType = {}
  let toolCalls = 0
  let total = 0
  let usage = null
  const toolTypes = new Set(['command_execution', 'computer_tool_call', 'mcp_tool_call', 'tool_call', 'web_search'])

  for (const line of raw.split('\n').filter(Boolean)) {
    let event
    try {
      event = JSON.parse(line)
    }
    catch {
      continue
    }
    total += 1
    const type = typeof event.type === 'string' ? event.type : 'unknown'
    byType[type] = (byType[type] ?? 0) + 1
    const itemType = typeof event.item?.type === 'string' ? event.item.type : null
    if (itemType) {
      byItemType[itemType] = (byItemType[itemType] ?? 0) + 1
      if (type === 'item.completed' && toolTypes.has(itemType))
        toolCalls += 1
    }
    if (type === 'turn.completed' && event.usage)
      usage = event.usage
  }

  return { events: { by_item_type: byItemType, by_type: byType, tool_calls: toolCalls, total }, usage }
}

function median(values) {
  const sorted = [...values].sort((left, right) => left - right)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle]
}

function rounded(value) {
  return Math.round(value * 100) / 100
}

function reviewSkillPath(root) {
  const candidate = join(root, 'research', 'candidates', 'skills', 'rsp-review')
  return existsSync(candidate) ? candidate : join(root, 'skills', 'rsp-review')
}

export function prepareEvaluation({ caseId, outputRoot, root, variant }) {
  if (variant !== 'baseline' && variant !== 'candidate')
    throw new Error(`Unknown evaluation variant: ${variant}`)

  const { directory, value } = readCase(root, caseId)
  const evaluations = resolve(outputRoot ?? join(root, '.cache', 'rsp-review-eval'))
  mkdirSync(evaluations, { recursive: true })
  const workspace = mkdtempSync(join(evaluations, `${caseId}-${variant}-`))
  assertContained(evaluations, workspace, 'evaluation workspace')

  const base = join(directory, 'base')
  if (existsSync(base))
    cpSync(base, workspace, { recursive: true })

  git(workspace, ['init', '--quiet'])
  git(workspace, ['config', 'user.name', 'RSP Evaluation'])
  git(workspace, ['config', 'user.email', 'rsp-eval@example.invalid'])
  git(workspace, ['config', 'status.renames', 'true'])
  git(workspace, ['config', 'diff.renames', 'true'])
  git(workspace, ['add', '--all'])
  git(workspace, ['commit', '--quiet', '--allow-empty', '-m', 'fixture base'])

  const changed = join(directory, 'changed')
  if (existsSync(changed))
    cpSync(changed, workspace, { recursive: true })

  for (const path of value.workspace?.remove ?? []) {
    const target = resolve(workspace, path)
    assertContained(workspace, target, 'workspace remove path')
    assertNoSymlinkPath(workspace, target, 'workspace remove path')
    rmSync(target, { force: true, recursive: true })
  }
  const staged = value.workspace?.stage ?? []
  if (staged.length > 0)
    git(workspace, ['--literal-pathspecs', 'add', '--all', '--', ...staged])

  if (variant === 'candidate') {
    const sourceSkill = reviewSkillPath(root)
    const installedSkill = join(workspace, '.agents', 'skills', 'rsp-review')
    mkdirSync(join(workspace, '.agents', 'skills'), { recursive: true })
    cpSync(sourceSkill, installedSkill, { recursive: true })
  }

  const prompt = [
    variant === 'candidate'
      ? 'Load the rsp-review skill installed in this isolated workspace and follow it exactly.'
      : 'Review this isolated workspace using your normal review behavior; no review skill is installed.',
    'Use HEAD as the immutable comparison point and inspect the current working-tree diff.',
    'Return a report only. Do not edit files, stage, commit, push, publish, delete, or create review artifacts.',
    value.request,
  ].join('\n\n')
  const promptPath = join(evaluations, `${basename(workspace)}.prompt.md`)
  writeFileSync(promptPath, `${prompt}\n`)

  return { case: value, promptPath, variant, workspace }
}

export async function runEvaluation({ caseId, codexBin = 'codex', effort, env = process.env, isolated = false, model, outputRoot, provider, root, timeoutMs = 180_000, variant }) {
  if (!model || !effort)
    throw new Error('Evaluation model and effort are required')
  if (!Number.isInteger(timeoutMs) || timeoutMs <= 0)
    throw new Error(`Invalid evaluation timeout: ${timeoutMs}`)
  if (provider && !PROVIDER_ID.test(provider))
    throw new Error(`Invalid evaluation provider: ${provider}`)
  const configArgs = evaluationConfigArgs({ isolated, provider })

  const evaluations = resolve(outputRoot ?? join(root, '.cache', 'rsp-review-eval'))
  const candidatePath = reviewSkillPath(root)
  const fixturesPath = fixtureRoot(root)
  const sourceIdentity = {
    candidate: hashTree(candidatePath),
    fixture: hashTree(fixturesPath),
    harness: LOADED_HARNESS_HASH,
  }
  const prepared = prepareEvaluation({ caseId, outputRoot: evaluations, root, variant })
  const runId = basename(prepared.workspace)
  const runDirectory = join(evaluations, 'runs', runId)
  mkdirSync(runDirectory, { recursive: true })
  const rawEventsPath = join(runDirectory, 'events.jsonl')
  const finalOutputPath = join(runDirectory, 'final.md')
  const metadataPath = join(runDirectory, 'metadata.json')
  const prompt = readFileSync(prepared.promptPath, 'utf8')
  const installedCandidatePath = join(prepared.workspace, '.agents', 'skills', 'rsp-review')
  const installedCandidateHash = variant === 'candidate' ? hashTree(installedCandidatePath) : null
  const beforeStatus = git(prepared.workspace, ['status', '--porcelain=v1', '--untracked-files=all'])
  const beforeWorkspace = hashTree(prepared.workspace)
  const cliVersion = commandVersion(codexBin)
  const started = new Date()
  const args = [
    'exec',
    '--ephemeral',
    ...configArgs,
    '--sandbox',
    'read-only',
    '--model',
    model,
    '--config',
    `model_reasoning_effort="${effort}"`,
    '--json',
    '--output-last-message',
    finalOutputPath,
    '--cd',
    prepared.workspace,
    '-',
  ]
  const invocation = executable(codexBin, args)
  const executed = await runCommand({ ...invocation, cwd: prepared.workspace, env, input: prompt, timeoutMs })
  const ended = new Date()
  writeFileSync(rawEventsPath, executed.stdout)
  if (executed.stderr)
    writeFileSync(join(runDirectory, 'stderr.log'), executed.stderr)

  const afterStatus = git(prepared.workspace, ['status', '--porcelain=v1', '--untracked-files=all'])
  const afterWorkspace = hashTree(prepared.workspace)
  const summary = summarizeEvents(executed.stdout)
  const mutated = beforeStatus !== afterStatus || beforeWorkspace !== afterWorkspace
  const identityErrors = []
  const sourceIdentityAfter = {
    candidate: captureIdentityHash('candidate source', () => hashTree(candidatePath), identityErrors),
    fixture: captureIdentityHash('fixture source', () => hashTree(fixturesPath), identityErrors),
    harness: captureIdentityHash('harness source', () => hashFile(HARNESS_PATH), identityErrors),
  }
  const identity = {
    candidate_source_stable: sourceIdentity.candidate === sourceIdentityAfter.candidate,
    errors: identityErrors,
    fixture_source_stable: sourceIdentity.fixture === sourceIdentityAfter.fixture,
    harness_source_stable: sourceIdentity.harness === sourceIdentityAfter.harness,
    installed_candidate_matches_source: variant === 'candidate'
      ? installedCandidateHash === sourceIdentity.candidate
      : null,
  }
  identity.stable = identity.candidate_source_stable
    && identity.fixture_source_stable
    && identity.harness_source_stable
    && identity.installed_candidate_matches_source !== false
  const result = executed.code === 0 && existsSync(finalOutputPath) && !mutated && identity.stable ? 'passed' : 'failed'
  const metadata = {
    case: prepared.case,
    duration_ms: ended.getTime() - started.getTime(),
    ended_at: ended.toISOString(),
    events: summary.events,
    exit_code: executed.code,
    hashes: {
      after_workspace: afterWorkspace,
      before_workspace: beforeWorkspace,
      candidate: sourceIdentity.candidate,
      candidate_after: sourceIdentityAfter.candidate,
      final_output: existsSync(finalOutputPath) ? hashFile(finalOutputPath) : null,
      fixture: sourceIdentity.fixture,
      fixture_after: sourceIdentityAfter.fixture,
      harness: sourceIdentity.harness,
      harness_after: sourceIdentityAfter.harness,
      installed_candidate: installedCandidateHash,
      prompt: hashContent(prompt),
    },
    identity,
    paths: {
      final_output: finalOutputPath,
      metadata: metadataPath,
      raw_events: rawEventsPath,
      workspace: prepared.workspace,
    },
    result,
    settings: {
      cli_version: cliVersion,
      config_source: isolated ? 'isolated' : 'user',
      effort,
      model,
      provider: provider ?? null,
      sandbox: 'read-only',
      timeout_ms: timeoutMs,
    },
    started_at: started.toISOString(),
    timed_out: executed.timedOut,
    usage: summary.usage,
    variant,
    worktree: {
      after_status: afterStatus,
      before_status: beforeStatus,
      mutated,
    },
  }
  writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`)
  return metadata
}

export async function runEvaluationMatrix({ caseIds, codexBin = 'codex', effort, env = process.env, isolated = false, model, outputRoot, provider, root, timeoutMs = 180_000 }) {
  if (!model || !effort)
    throw new Error('Evaluation model and effort are required')
  if (provider && !PROVIDER_ID.test(provider))
    throw new Error(`Invalid evaluation provider: ${provider}`)
  evaluationConfigArgs({ isolated, provider })

  const evaluations = resolve(outputRoot ?? join(root, '.cache', 'rsp-review-eval'))
  mkdirSync(evaluations, { recursive: true })
  const available = new Set(loadEvaluationCases(root).map(item => item.id))
  const selected = caseIds ?? [...available]
  for (const id of selected) {
    if (!available.has(id))
      throw new Error(`Unknown evaluation case: ${id}`)
  }

  const started = new Date()
  const runs = []
  for (const caseId of selected) {
    for (const variant of ['baseline', 'candidate']) {
      runs.push(await runEvaluation({ caseId, codexBin, effort, env, isolated, model, outputRoot: evaluations, provider, root, timeoutMs, variant }))
    }
  }
  const ended = new Date()
  const candidateHashes = [...new Set(runs.map(run => run.hashes.candidate))]
  const fixtureHashes = [...new Set(runs.map(run => run.hashes.fixture))]
  const harnessHashes = [...new Set(runs.map(run => run.hashes.harness))]
  const result = runs.every(run => run.result === 'passed')
    && candidateHashes.length === 1
    && fixtureHashes.length === 1
    && harnessHashes.length === 1
    ? 'passed'
    : 'failed'
  const matrixDirectory = join(evaluations, 'matrices')
  mkdirSync(matrixDirectory, { recursive: true })
  const matrixPath = join(matrixDirectory, `${started.toISOString().replaceAll(/[:.]/g, '-')}.json`)
  const matrix = {
    case_ids: selected,
    candidate_hashes: candidateHashes,
    config_source: isolated ? 'isolated' : 'user',
    ended_at: ended.toISOString(),
    effort,
    fixture_hashes: fixtureHashes,
    harness_hashes: harnessHashes,
    metadata_path: matrixPath,
    model,
    provider: provider ?? null,
    result,
    runs,
    started_at: started.toISOString(),
    timeout_ms: timeoutMs,
  }
  writeFileSync(matrixPath, `${JSON.stringify(matrix, null, 2)}\n`)
  return matrix
}

export async function runEvaluationCalibration({ caseIds, codexBin = 'codex', effort, env = process.env, isolated = false, model, outputRoot, provider, repetitions = 3, root, timeoutMs = 180_000 }) {
  if (repetitions !== 3)
    throw new Error(`Cost calibration requires exactly 3 repetitions, received: ${repetitions}`)

  const evaluations = resolve(outputRoot ?? join(root, '.cache', 'rsp-review-eval'))
  const started = new Date()
  const matrices = []
  for (let repetition = 1; repetition <= repetitions; repetition += 1) {
    matrices.push(await runEvaluationMatrix({
      caseIds,
      codexBin,
      effort,
      env,
      isolated,
      model,
      outputRoot: evaluations,
      provider,
      root,
      timeoutMs,
    }))
  }
  const ended = new Date()
  const candidateHashes = [...new Set(matrices.flatMap(matrix => matrix.candidate_hashes))]
  const fixtureHashes = [...new Set(matrices.flatMap(matrix => matrix.fixture_hashes))]
  const harnessHashes = [...new Set(matrices.flatMap(matrix => matrix.harness_hashes))]
  const runs = matrices.flatMap(matrix => matrix.runs)
  const issues = []
  if (candidateHashes.length !== 1)
    issues.push('candidate identity drift')
  if (fixtureHashes.length !== 1)
    issues.push('fixture identity drift')
  if (harnessHashes.length !== 1)
    issues.push('harness identity drift')
  if (matrices.some(matrix => matrix.result !== 'passed'))
    issues.push('matrix process failure')
  if (runs.some(run => !run.usage))
    issues.push('missing usage')
  if (runs.some(run => run.timed_out))
    issues.push('run timeout')
  if (runs.some(run => run.worktree.mutated))
    issues.push('workspace mutation')

  const selectedCaseIds = matrices[0]?.case_ids ?? []
  const cases = selectedCaseIds.map((caseId) => {
    const rawOverheads = []
    const samples = matrices.map((matrix, index) => {
      const baseline = matrix.runs.find(run => run.case.id === caseId && run.variant === 'baseline')
      const candidate = matrix.runs.find(run => run.case.id === caseId && run.variant === 'candidate')
      const valid = baseline?.usage && candidate?.usage
      const overhead = valid ? (candidate.usage.input_tokens / baseline.usage.input_tokens - 1) * 100 : null
      if (overhead !== null)
        rawOverheads.push(overhead)
      return {
        baseline_input_tokens: baseline?.usage?.input_tokens ?? null,
        candidate_input_tokens: candidate?.usage?.input_tokens ?? null,
        overhead_pct: overhead === null ? null : rounded(overhead),
        repetition: index + 1,
      }
    })
    return {
      case_id: caseId,
      median_overhead_pct: rawOverheads.length === repetitions ? rounded(median(rawOverheads)) : null,
      samples,
    }
  })
  const caseMedians = cases.flatMap(item => item.median_overhead_pct === null ? [] : [item.median_overhead_pct])
  const aggregateMedian = caseMedians.length === cases.length ? rounded(median(caseMedians)) : null
  const thresholds = { max_aggregate_median_pct: 30, max_case_median_pct: 50 }
  const costPassed = issues.length === 0
    && aggregateMedian !== null
    && aggregateMedian <= thresholds.max_aggregate_median_pct
    && cases.every(item => item.median_overhead_pct !== null && item.median_overhead_pct <= thresholds.max_case_median_pct)
  const calibrationDirectory = join(evaluations, 'calibrations')
  mkdirSync(calibrationDirectory, { recursive: true })
  const calibrationPath = join(calibrationDirectory, `${started.toISOString().replaceAll(/[:.]/g, '-')}.json`)
  const calibration = {
    candidate_hashes: candidateHashes,
    cases,
    config_source: isolated ? 'isolated' : 'user',
    cost: {
      aggregate_median_overhead_pct: aggregateMedian,
      passed: costPassed,
      thresholds,
    },
    effort,
    ended_at: ended.toISOString(),
    fixture_hashes: fixtureHashes,
    harness_hashes: harnessHashes,
    issues,
    matrices: matrices.map((matrix, index) => ({
      ended_at: matrix.ended_at,
      hash: hashFile(matrix.metadata_path),
      metadata_path: matrix.metadata_path,
      repetition: index + 1,
      result: matrix.result,
      started_at: matrix.started_at,
    })),
    metadata_path: calibrationPath,
    model,
    provider: provider ?? null,
    repetitions,
    result: costPassed ? 'passed' : 'failed',
    started_at: started.toISOString(),
    timeout_ms: timeoutMs,
  }
  writeFileSync(calibrationPath, `${JSON.stringify(calibration, null, 2)}\n`)
  return calibration
}

function flagValue(flags, name) {
  const index = flags.indexOf(name)
  return index >= 0 ? flags[index + 1] : undefined
}

function usage() {
  console.error('Usage:\n  node scripts/rsp-review-eval.mjs prepare <case> <baseline|candidate> [--json]\n  node scripts/rsp-review-eval.mjs run <case> <baseline|candidate> --model <model> --effort <effort> [--provider <provider> | --isolated] [--timeout-ms <ms>] [--json]\n  node scripts/rsp-review-eval.mjs matrix --model <model> --effort <effort> [--provider <provider> | --isolated] [--timeout-ms <ms>] [--json]\n  node scripts/rsp-review-eval.mjs calibrate --model <model> --effort <effort> [--provider <provider> | --isolated] [--timeout-ms <ms>] [--json]')
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  const [command, ...arguments_] = process.argv.slice(2)
  if (!['calibrate', 'matrix', 'prepare', 'run'].includes(command)) {
    usage()
    process.exitCode = 1
  }
  else {
    try {
      const root = process.cwd()
      if (command === 'calibrate') {
        const calibration = await runEvaluationCalibration({
          effort: flagValue(arguments_, '--effort'),
          isolated: arguments_.includes('--isolated'),
          model: flagValue(arguments_, '--model'),
          provider: flagValue(arguments_, '--provider'),
          root,
          timeoutMs: flagValue(arguments_, '--timeout-ms') ? Number(flagValue(arguments_, '--timeout-ms')) : undefined,
        })
        if (arguments_.includes('--json'))
          console.log(JSON.stringify(calibration, null, 2))
        else
          console.log(`Calibration ${calibration.result}: ${calibration.repetitions} repetitions\nMetadata: ${calibration.metadata_path}`)
      }
      else if (command === 'matrix') {
        const matrix = await runEvaluationMatrix({
          effort: flagValue(arguments_, '--effort'),
          isolated: arguments_.includes('--isolated'),
          model: flagValue(arguments_, '--model'),
          provider: flagValue(arguments_, '--provider'),
          root,
          timeoutMs: flagValue(arguments_, '--timeout-ms') ? Number(flagValue(arguments_, '--timeout-ms')) : undefined,
        })
        if (arguments_.includes('--json'))
          console.log(JSON.stringify(matrix, null, 2))
        else
          console.log(`Matrix ${matrix.result}: ${matrix.runs.length} runs\nMetadata: ${matrix.metadata_path}`)
      }
      else if (command === 'prepare') {
        const [caseId, variant, ...flags] = arguments_
        if (!caseId || !variant)
          throw new Error('prepare requires case and variant')
        const prepared = prepareEvaluation({ caseId, root, variant })
        if (flags.includes('--json'))
          console.log(JSON.stringify(prepared, null, 2))
        else
          console.log(`Prepared ${prepared.case.id} (${prepared.variant})\nWorkspace: ${prepared.workspace}\nPrompt: ${prepared.promptPath}`)
      }
      else {
        const [caseId, variant, ...flags] = arguments_
        if (!caseId || !variant)
          throw new Error('run requires case and variant')
        const run = await runEvaluation({
          caseId,
          effort: flagValue(flags, '--effort'),
          isolated: flags.includes('--isolated'),
          model: flagValue(flags, '--model'),
          provider: flagValue(flags, '--provider'),
          root,
          timeoutMs: flagValue(flags, '--timeout-ms') ? Number(flagValue(flags, '--timeout-ms')) : undefined,
          variant,
        })
        if (flags.includes('--json'))
          console.log(JSON.stringify(run, null, 2))
        else
          console.log(`Ran ${run.case.id} (${run.variant}): ${run.result}\nMetadata: ${run.paths.metadata}`)
      }
    }
    catch (error) {
      console.error(error instanceof Error ? error.message : String(error))
      process.exitCode = 1
    }
  }
}
