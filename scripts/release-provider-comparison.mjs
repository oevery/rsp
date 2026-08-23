#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve, sep } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { isDeepStrictEqual } from 'node:util'
import {
  loadManagedControllerBetaPlan,
  summarizeManagedControllerBetaRun,
} from './managed-controller-beta.mjs'
import {
  hashManagedControllerArtifact,
  hashManagedControllerComposition,
  readManagedControllerFlag,
  runManagedControllerEvaluation,
} from './managed-controller-eval.mjs'
import { computeReleaseSourceIdentity } from './release-acceptance.mjs'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const scriptPath = fileURLToPath(import.meta.url)
const code = '`'

function fail(message) {
  throw new Error(`Release provider comparison invalid: ${message}`)
}

function hashContent(content) {
  return createHash('sha256').update(content).digest('hex')
}

function sameJson(left, right) {
  return isDeepStrictEqual(left, right)
}

function isSha256(value) {
  return typeof value === 'string' && /^[a-f0-9]{64}$/u.test(value)
}

function readRegularFile(path, label) {
  if (!existsSync(path))
    fail(`${label} is missing`)
  const stats = lstatSync(path)
  if (stats.isSymbolicLink() || !stats.isFile())
    fail(`${label} must be a regular non-symlink file`)
  return readFileSync(path, 'utf8')
}

function readJsonFile(path, label) {
  try {
    return JSON.parse(readRegularFile(path, label))
  }
  catch (error) {
    if (error instanceof SyntaxError)
      fail(`${label} is not valid JSON`)
    throw error
  }
}

function gitOutput(repositoryRoot, args, options = {}) {
  return execFileSync('git', ['-C', repositoryRoot, ...args], {
    encoding: options.encoding ?? 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
}

function positiveInteger(value, label, { max = Number.MAX_SAFE_INTEGER, min = 1 } = {}) {
  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed < min || parsed > max)
    fail(`${label} must be an integer from ${min} to ${max}`)
  return parsed
}

function relativePathInside(parent, path) {
  const value = relative(parent, path)
  return value === '' || (value !== '..' && !value.startsWith(`..${sep}`))
}

function resolveGitCommit(repositoryRoot, reference) {
  if (typeof reference !== 'string' || !/^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/u.test(reference))
    fail('baseline ref must be one explicit v-prefixed release tag')
  try {
    return gitOutput(repositoryRoot, ['rev-parse', '--verify', `${reference}^{commit}`]).trim()
  }
  catch {
    fail(`baseline ref does not resolve to a commit: ${reference}`)
  }
}

function extractGitSkills(repositoryRoot, commit, skills, destinationRoot) {
  const sourceRoot = join(destinationRoot, 'skills')
  mkdirSync(sourceRoot, { recursive: true })
  const records = gitOutput(
    repositoryRoot,
    ['ls-tree', '-r', '-z', commit, '--', ...skills.map(skill => `skills/${skill}`)],
    { encoding: 'buffer' },
  ).toString('utf8').split('\0').filter(Boolean)
  if (records.length === 0)
    fail(`baseline commit ${commit} contains none of the required Skills`)
  const observedSkills = new Set()
  for (const record of records) {
    const match = /^(100644|100755) blob [a-f0-9]{40,64}\t(.+)$/u.exec(record)
    if (!match)
      fail(`baseline Skills contain an unsupported Git tree entry: ${record.split('\t').at(-1)}`)
    const repositoryPath = match[2]
    const skill = skills.find(name => repositoryPath === `skills/${name}` || repositoryPath.startsWith(`skills/${name}/`))
    if (!skill)
      fail(`baseline Skills contain an unexpected path: ${repositoryPath}`)
    const destination = resolve(destinationRoot, repositoryPath)
    if (!relativePathInside(destinationRoot, destination))
      fail(`baseline Skill path escapes its snapshot: ${repositoryPath}`)
    mkdirSync(dirname(destination), { recursive: true })
    const content = gitOutput(repositoryRoot, ['show', `${commit}:${repositoryPath}`], { encoding: 'buffer' })
    writeFileSync(destination, content, { mode: match[1] === '100755' ? 0o755 : 0o644 })
    observedSkills.add(skill)
  }
  const missing = skills.filter(skill => !observedSkills.has(skill))
  if (missing.length > 0)
    fail(`baseline commit is missing required Skills: ${missing.join(', ')}`)
  return sourceRoot
}

function withBaselineSnapshot(repositoryRoot, commit, skills, operation) {
  const temporaryRoot = mkdtempSync(join(tmpdir(), 'rsp-release-provider-baseline-'))
  try {
    return operation(extractGitSkills(repositoryRoot, commit, skills, temporaryRoot))
  }
  finally {
    rmSync(temporaryRoot, { force: true, recursive: true })
  }
}

function composition(skillSourceDirectory, skills) {
  return hashManagedControllerComposition(skills.map(name => ({
    name,
    path: join(skillSourceDirectory, name),
  })))
}

function harnessSha256(repositoryRoot, betaPlan) {
  const hash = createHash('sha256')
  for (const path of [
    scriptPath,
    join(repositoryRoot, 'scripts', 'managed-controller-beta.mjs'),
    join(repositoryRoot, 'scripts', 'managed-controller-eval.mjs'),
    join(repositoryRoot, 'scripts', 'skill-evaluation-observability.mjs'),
    betaPlan.path,
  ]) {
    hash.update(relative(repositoryRoot, path))
    hash.update('\0')
    hash.update(readFileSync(path))
    hash.update('\0')
  }
  return hash.digest('hex')
}

export function buildReleaseProviderComparisonPlan(
  repositoryRoot,
  { baselineRef, caseId, repetitions } = {},
) {
  const baselineCommit = resolveGitCommit(repositoryRoot, baselineRef)
  const betaPlan = loadManagedControllerBetaPlan(repositoryRoot, { caseId })
  const configuredCase = betaPlan.provider_comparison_cases.find(entry => entry.case === betaPlan.case)
  const repetitionCount = repetitions === undefined
    ? configuredCase.repetitions
    : positiveInteger(repetitions, 'repetitions', { min: 3, max: 10 })
  const skills = [...betaPlan.product_skill_names]
  const baselineComposition = withBaselineSnapshot(
    repositoryRoot,
    baselineCommit,
    skills,
    source => composition(source, skills),
  )
  const candidateComposition = composition(join(repositoryRoot, 'skills'), skills)
  const candidateSource = computeReleaseSourceIdentity(repositoryRoot)
  return {
    execution: 'serial-paired',
    repetitions: repetitionCount,
    case: betaPlan.case,
    metrics: ['input-tokens', 'cached-input-tokens', 'uncached-input-tokens', 'output-tokens', 'total-tokens', 'tool-calls', 'tool-output-bytes', 'model-invocations', 'elapsed-ms'],
    correctness: ['compliance', 'boundary', 'task-result', 'routing-topology'],
    baseline: {
      ref: baselineRef,
      commit: baselineCommit,
      composition: baselineComposition,
    },
    candidate: {
      commit: candidateSource.commit,
      dirty: candidateSource.dirty,
      fingerprintSha256: candidateSource.fingerprintSha256,
      composition: candidateComposition,
    },
    identities: {
      contractSha256: betaPlan.holdout_manifest_sha256,
      fixtureSha256: betaPlan.base_tree_sha256,
      harnessSha256: harnessSha256(repositoryRoot, betaPlan),
    },
    scheduling: {
      concurrency: 1,
      order: 'alternating-ab-ba',
      maxPairAttempts: repetitionCount + 2,
      maxContaminatedPairReplacements: 2,
    },
    policy: {
      correctnessBeforeEfficiency: true,
      efficiencyThreshold: null,
      unavailableIsPass: false,
    },
    providerExpectations: betaPlan.provider_expectations,
    omissions: [
      'token deltas are provider-backed observations rather than deterministic release acceptance',
      'the comparison isolates Skill composition while sharing the current CLI and evaluation harness',
      'no provider-general, model-general, cost, publication, or release approval claim is made',
    ],
  }
}

export function buildReleaseProviderComparisonMatrixPlans(repositoryRoot, { baselineRef } = {}) {
  const betaPlan = loadManagedControllerBetaPlan(repositoryRoot)
  return betaPlan.provider_comparison_cases.map(entry => buildReleaseProviderComparisonPlan(repositoryRoot, {
    baselineRef,
    caseId: entry.case,
  }))
}

function runClassification(run) {
  if (['eligible', 'infra-contaminated', 'model-failed', 'harness-failed', 'incomplete'].includes(run.classification))
    return run.classification
  if (run.outcome === 'passed')
    return 'eligible'
  if (run.outcome === 'failed')
    return 'model-failed'
  return 'incomplete'
}

function workerComplianceEnforcement(run) {
  return run.worker_compliance_enforcement ?? (run.arm === 'baseline' ? 'diagnostic' : 'required')
}

export function releaseProviderRunCorrectnessPassed(plan, run) {
  if (run.outcome !== 'passed')
    return false
  const workerComplianceFailed = run.worker_compliance?.status === 'failed'
  const workerDiagnosticFailure = run.arm === 'baseline'
    && workerComplianceEnforcement(run) === 'diagnostic'
    && workerComplianceFailed
  if (workerComplianceFailed && !workerDiagnosticFailure)
    return false
  const requiredDimensions = workerDiagnosticFailure
    ? ['task_result']
    : ['compliance', 'boundary', 'task_result']
  return requiredDimensions.every(name => run.dimensions?.[name]?.status === 'passed')
    && (!plan.providerExpectations || run.scenario?.status === 'passed')
}

function releaseProviderRunIdentityPassed(plan, run) {
  const compositionSha256 = run.arm === 'baseline'
    ? plan.baseline.composition.hash
    : plan.candidate.composition.hash
  return run.case === plan.case
    && run.contractSha256 === plan.identities.contractSha256
    && run.compositionSha256 === compositionSha256
}

export function releaseProviderEfficiencyPolicyPassed(report) {
  const workerComplianceFailed = Array.isArray(report?.runs)
    && report.runs.some(run => run.worker_compliance?.status === 'failed')
  return !workerComplianceFailed
    || (report.efficiency?.status === 'not-comparable'
      && report.infrastructure?.efficiencyComparablePairs === 0)
}

function hardCorrectnessFailed(plan, run) {
  if (['infra-contaminated', 'incomplete'].includes(runClassification(run)))
    return false
  return run.outcome === 'failed'
    || (run.outcome === 'passed' && !releaseProviderRunCorrectnessPassed(plan, run))
}

export function classifyProviderAttempt({ infrastructureStatus, outcome, timedOut = false }) {
  if (infrastructureStatus === 'contaminated')
    return 'infra-contaminated'
  if (timedOut || outcome === 'failed')
    return 'model-failed'
  if (outcome === 'passed')
    return 'eligible'
  return 'incomplete'
}

export async function executeSerialProviderPairs({
  maxContaminatedPairReplacements = 2,
  repetitions,
  runArm,
  runCorrectnessPassed = () => true,
}) {
  const runs = []
  const maximumAttempts = repetitions + maxContaminatedPairReplacements
  let pairAttempt = 0
  let targetPair = 1
  let terminalBaselineTarget = null
  while (targetPair <= repetitions && pairAttempt < maximumAttempts) {
    pairAttempt += 1
    const plannedOrder = targetPair % 2 === 1
      ? ['baseline', 'candidate']
      : ['candidate', 'baseline']
    const order = plannedOrder.filter(arm => arm !== 'baseline' || terminalBaselineTarget !== targetPair)
    let contaminated = false
    for (const [index, arm] of order.entries()) {
      const run = await runArm({
        arm,
        order: order.join('-then-'),
        pairAttempt,
        pairId: `pair-attempt-${String(pairAttempt).padStart(2, '0')}`,
        position: index + 1,
        targetPair,
      })
      runs.push(run)
      const classification = runClassification(run)
      if (classification === 'infra-contaminated') {
        contaminated = true
        break
      }
      const correctnessPassed = classification === 'eligible' && runCorrectnessPassed(run)
      const baselineDiagnosticFailure = arm === 'baseline'
        && (classification === 'model-failed' || (classification === 'eligible' && !correctnessPassed))
      if (baselineDiagnosticFailure) {
        terminalBaselineTarget = targetPair
        continue
      }
      if (classification !== 'eligible' || !correctnessPassed)
        return runs
    }
    if (!contaminated) {
      targetPair += 1
      terminalBaselineTarget = null
    }
  }
  return runs
}

function finiteMeasurement(value) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function rounded(value) {
  return Math.round(value * 100) / 100
}

function median(values) {
  const sorted = [...values].sort((left, right) => left - right)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[middle - 1] + sorted[middle]) / 2
    : sorted[middle]
}

function summarizeMeasurements(runs) {
  const fields = {
    input_tokens: run => run.measurements.tokens.input,
    cached_input_tokens: run => run.measurements.tokens.cached_input,
    uncached_input_tokens: run => run.measurements.tokens.uncached_input,
    output_tokens: run => run.measurements.tokens.output,
    total_tokens: run => run.measurements.tokens.total,
    tool_calls: run => run.measurements.tool_calls,
    tool_output_bytes: run => run.measurements.tool_output_bytes,
    model_invocations: run => run.measurements.model_invocations,
    elapsed_ms: run => run.measurements.elapsed_ms,
  }
  return Object.fromEntries(Object.entries(fields).map(([name, select]) => {
    const values = runs.map(select).filter(value => value !== null)
    if (values.length !== runs.length || values.length === 0)
      return [name, { median: null, min: null, max: null, relativeRangePct: null }]
    const center = median(values)
    return [name, {
      median: rounded(center),
      min: Math.min(...values),
      max: Math.max(...values),
      relativeRangePct: center === 0 ? null : rounded(((Math.max(...values) - Math.min(...values)) / center) * 100),
    }]
  }))
}

function percentageDelta(baseline, candidate) {
  return baseline === null || candidate === null || baseline === 0
    ? null
    : rounded(((candidate / baseline) - 1) * 100)
}

function summarizePairedDeltas(eligiblePairs) {
  const fields = {
    input_tokens: run => run.measurements.tokens.input,
    cached_input_tokens: run => run.measurements.tokens.cached_input,
    uncached_input_tokens: run => run.measurements.tokens.uncached_input,
    output_tokens: run => run.measurements.tokens.output,
    total_tokens: run => run.measurements.tokens.total,
    tool_calls: run => run.measurements.tool_calls,
    tool_output_bytes: run => run.measurements.tool_output_bytes,
    model_invocations: run => run.measurements.model_invocations,
    elapsed_ms: run => run.measurements.elapsed_ms,
  }
  return Object.fromEntries(Object.entries(fields).map(([name, select]) => {
    const pairs = eligiblePairs.map((pair) => {
      const baseline = pair.find(run => run.arm === 'baseline')
      const candidate = pair.find(run => run.arm === 'candidate')
      return {
        pairAttempt: baseline?.pairAttempt ?? candidate?.pairAttempt ?? baseline?.repetition ?? candidate?.repetition,
        targetPair: baseline?.targetPair ?? candidate?.targetPair ?? baseline?.repetition ?? candidate?.repetition,
        deltaPct: percentageDelta(
          finiteMeasurement(baseline ? select(baseline) : null),
          finiteMeasurement(candidate ? select(candidate) : null),
        ),
      }
    })
    const values = pairs.map(pair => pair.deltaPct)
    if (values.length === 0 || values.includes(null))
      return [name, { pairs, median: null, min: null, max: null, range: null }]
    return [name, {
      pairs,
      median: rounded(median(values)),
      min: Math.min(...values),
      max: Math.max(...values),
      range: rounded(Math.max(...values) - Math.min(...values)),
    }]
  }))
}

export function createReleaseProviderComparisonSummary(plan, runs, refreshedPlan = plan) {
  const pairMap = new Map()
  for (const run of runs) {
    const pairId = run.pairId ?? `pair-attempt-${String(run.repetition).padStart(2, '0')}`
    const pair = pairMap.get(pairId) ?? []
    pair.push(run)
    pairMap.set(pairId, pair)
  }
  const pairs = [...pairMap.values()]
  const eligiblePairs = pairs.filter(pair => pair.length === 2
    && new Set(pair.map(run => run.arm)).size === 2
    && pair.every(run => runClassification(run) === 'eligible'
      && releaseProviderRunCorrectnessPassed(plan, run)
      && releaseProviderRunIdentityPassed(plan, run)))
  const contaminatedPairs = pairs.filter(pair => pair.some(run => runClassification(run) === 'infra-contaminated'))
  const failedPairs = pairs.filter(pair => pair.some(run => ['model-failed', 'harness-failed'].includes(runClassification(run))))
  const incompletePairs = pairs.filter(pair => !eligiblePairs.includes(pair)
    && !contaminatedPairs.includes(pair)
    && !failedPairs.includes(pair))
  const replacementPairs = contaminatedPairs.filter((pair) => {
    const pairIndex = pairs.indexOf(pair)
    const targetPair = pair[0]?.targetPair ?? pair[0]?.repetition
    return pairs.slice(pairIndex + 1).some(next => (next[0]?.targetPair ?? next[0]?.repetition) === targetPair)
  })
  const eligibleRuns = eligiblePairs.flat()
  const eligibleCandidateRuns = runs.filter(run => run.arm === 'candidate'
    && runClassification(run) === 'eligible'
    && releaseProviderRunCorrectnessPassed(plan, run)
    && releaseProviderRunIdentityPassed(plan, run))
  const completedCandidateTargets = new Set(eligibleCandidateRuns
    .map(run => run.targetPair ?? run.repetition)
    .filter(targetPair => Number.isInteger(targetPair) && targetPair >= 1 && targetPair <= plan.repetitions))
  const efficiencyBlockedByWorkerCompliance = eligibleRuns.some(run => run.worker_compliance?.status === 'failed')
  const efficiencyPairs = efficiencyBlockedByWorkerCompliance ? [] : eligiblePairs
  const efficiencyRuns = efficiencyPairs.flat()
  const baselineRuns = efficiencyRuns.filter(run => run.arm === 'baseline')
  const candidateRuns = efficiencyRuns.filter(run => run.arm === 'candidate')
  const identityBaselineRuns = runs.filter(run => run.arm === 'baseline' && runClassification(run) === 'eligible')
  const identityCandidateRuns = runs.filter(run => run.arm === 'candidate' && runClassification(run) === 'eligible')
  const identityIssues = []
  const candidateIdentityIssues = []
  for (const run of identityBaselineRuns) {
    if (run.compositionSha256 !== plan.baseline.composition.hash)
      identityIssues.push(`baseline composition drift in repetition ${run.repetition}`)
  }
  for (const run of identityCandidateRuns) {
    if (run.compositionSha256 !== plan.candidate.composition.hash) {
      const issue = `candidate composition drift in repetition ${run.repetition}`
      identityIssues.push(issue)
      candidateIdentityIssues.push(issue)
    }
  }
  for (const run of runs) {
    if (run.case !== plan.case) {
      const issue = `scenario identity drift in repetition ${run.repetition}`
      identityIssues.push(issue)
      if (run.arm === 'candidate')
        candidateIdentityIssues.push(issue)
    }
    if (run.contractSha256 !== plan.identities.contractSha256) {
      const issue = `${run.arm} contract drift in repetition ${run.repetition}`
      identityIssues.push(issue)
      if (run.arm === 'candidate')
        candidateIdentityIssues.push(issue)
    }
  }
  if (JSON.stringify({
    baseline: refreshedPlan.baseline,
    candidate: refreshedPlan.candidate,
    identities: refreshedPlan.identities,
  }) !== JSON.stringify({
    baseline: plan.baseline,
    candidate: plan.candidate,
    identities: plan.identities,
  })) {
    identityIssues.push('comparison identities drifted during execution')
    candidateIdentityIssues.push('comparison identities drifted during execution')
  }
  const candidateCorrectnessFailed = runs.some(run => run.arm === 'candidate' && hardCorrectnessFailed(plan, run))
  const candidateRunCount = completedCandidateTargets.size
  const candidateComplete = candidateRunCount === plan.repetitions
  const baselineDiagnosticFailures = runs.filter(run => run.arm === 'baseline'
    && workerComplianceEnforcement(run) === 'diagnostic'
    && run.worker_compliance?.status === 'failed').length
  const baselineModelFailures = runs.filter(run => run.arm === 'baseline'
    && runClassification(run) === 'model-failed').length
  const comparisonStatus = eligiblePairs.length === plan.repetitions
    ? 'complete'
    : eligiblePairs.length > 0 ? 'partial' : 'unavailable'
  const measurementIncomplete = !efficiencyBlockedByWorkerCompliance && efficiencyRuns.some(run => [
    run.measurements.tokens.input,
    run.measurements.tokens.output,
    run.measurements.tokens.total,
    run.measurements.tool_calls,
    run.measurements.elapsed_ms,
  ].includes(null))
  const baseline = summarizeMeasurements(baselineRuns)
  const candidate = summarizeMeasurements(candidateRuns)
  const deltas = Object.fromEntries(Object.keys(baseline).map(name => [
    name,
    percentageDelta(baseline[name].median, candidate[name].median),
  ]))
  const pairedDeltaPct = summarizePairedDeltas(efficiencyPairs)
  const narrativeWarningRuns = runs.filter(run => run.narrative?.status === 'warning').length
  let verdict = 'passed'
  if (candidateIdentityIssues.length > 0 || candidateCorrectnessFailed)
    verdict = 'failed'
  else if (!candidateComplete)
    verdict = 'unavailable'
  const candidatePassed = verdict === 'passed'
  return {
    verdict,
    execution: plan.execution,
    scheduling: plan.scheduling,
    repetitions: plan.repetitions,
    case: plan.case,
    identities: {
      baseline: plan.baseline,
      candidate: plan.candidate,
      ...plan.identities,
      issues: identityIssues,
    },
    correctness: {
      passed: candidatePassed,
      candidatePassed,
      candidateRuns: candidateRunCount,
      requiredCandidateRuns: plan.repetitions,
      baselineDiagnosticFailures,
      baselineModelFailures,
      requiredDimensions: plan.correctness,
    },
    comparison: {
      status: comparisonStatus,
      eligiblePairs: eligiblePairs.length,
      plannedPairs: plan.repetitions,
    },
    infrastructure: {
      attemptedPairs: pairs.length,
      contaminatedPairs: contaminatedPairs.length,
      eligiblePairs: eligiblePairs.length,
      efficiencyComparablePairs: efficiencyPairs.length,
      incompletePairs: incompletePairs.length,
      replacementPairs: replacementPairs.length,
      status: contaminatedPairs.length > 0 ? 'contamination-observed' : 'no-contamination-observed',
    },
    efficiency: {
      status: efficiencyBlockedByWorkerCompliance
        ? 'not-comparable'
        : comparisonStatus === 'complete' && !measurementIncomplete ? 'observed' : 'not-conclusive',
      threshold: null,
      baseline,
      candidate,
      deltaPct: deltas,
      pairedDeltaPct,
      interpretation: 'diagnostic-only; correctness and boundary evidence take precedence',
    },
    narrative: { warningRuns: narrativeWarningRuns },
    runs,
    omissions: [
      ...plan.omissions,
      ...(measurementIncomplete ? ['one or more required measurements are unavailable'] : []),
      ...(comparisonStatus !== 'complete' ? ['one or more baseline/candidate pairs were unavailable or not eligible for comparison'] : []),
      ...(!candidateComplete ? ['one or more required candidate runs were unavailable or not run'] : []),
      ...(efficiencyBlockedByWorkerCompliance ? ['worker assignment noncompliance makes baseline and candidate efficiency not comparable'] : []),
    ],
  }
}

export function renderReleaseProviderComparisonMarkdown(summary) {
  const evidenceMode = summary.replay?.mode ?? 'fresh-provider'
  const lines = [
    '# Release Provider Comparison Report',
    '',
    `- Verdict: **${summary.verdict}**`,
    `- Execution: ${code}${summary.execution}${code}`,
    `- Repetitions: ${summary.repetitions}`,
    `- Case: ${code}${summary.case}${code}`,
    `- Baseline: ${code}${summary.identities.baseline.ref}${code} (${code}${summary.identities.baseline.commit}${code})`,
    `- Candidate source: ${code}${summary.identities.candidate.fingerprintSha256}${code}`,
    `- Correctness: ${summary.correctness.passed ? 'passed' : 'not passed'}`,
    `- Candidate gate: ${summary.correctness.candidatePassed ? 'passed' : 'not passed'}`,
    `- Candidate runs: ${summary.correctness.candidateRuns ?? 'unavailable'}/${summary.correctness.requiredCandidateRuns ?? summary.repetitions}`,
    `- Baseline diagnostic failures: ${summary.correctness.baselineDiagnosticFailures}`,
    `- Baseline model failures: ${summary.correctness.baselineModelFailures ?? 0}`,
    `- Comparison completeness: ${summary.comparison?.status ?? (summary.infrastructure.eligiblePairs === summary.repetitions ? 'complete' : 'unavailable')}`,
    `- Eligible pairs: ${summary.infrastructure.eligiblePairs}/${summary.repetitions}`,
    `- Infrastructure-contaminated pairs: ${summary.infrastructure.contaminatedPairs}`,
    `- Evidence mode: ${code}${evidenceMode}${code}`,
    ...(summary.replay
      ? [
          `- Source report SHA-256: ${code}${summary.replay.sourceReportSha256}${code}`,
          `- Source harness SHA-256: ${code}${summary.replay.sourceHarnessSha256}${code}`,
          `- Source candidate commit: ${code}${summary.replay.sourceCandidateCommit ?? 'unavailable'}${code}`,
        ]
      : []),
    '',
    '## Comparison boundary',
    '',
    '- Isolated difference: tagged baseline versus candidate Skill composition',
    '- Shared execution surfaces: current CLI, evaluation harness, and scenario fixture',
    '- Full-package release benchmark: no',
    '- Efficiency interpretation: diagnostic-only',
    '',
    '## Correctness Gate',
    '',
    `- Status: ${summary.correctness.passed ? 'passed' : 'not passed'}`,
    '',
    '## Narrative coverage',
    '',
    `- Warning runs: ${summary.narrative?.warningRuns ?? 0}`,
    '- Interpretation: diagnostic-only; natural-language wording does not override structured or host-observed evidence',
    '',
    '| Pair attempt | Arm | Status | Missing narrative | Forbidden narrative |',
    '| ---: | --- | --- | --- | --- |',
    ...summary.runs.map(run => `| ${run.pairAttempt ?? run.repetition} | ${run.arm} | ${run.narrative?.status ?? 'passed'} | ${run.narrative?.missing?.join(', ') || 'none'} | ${run.narrative?.forbidden_present?.join(', ') || 'none'} |`),
    '',
    '## Efficiency',
    '',
    `- Status: ${summary.efficiency.status}`,
    `- Comparable pairs: ${summary.infrastructure.efficiencyComparablePairs}/${summary.repetitions}`,
    '',
    '| Metric | Baseline | Candidate | Delta | Baseline range | Candidate range |',
    '| --- | ---: | ---: | ---: | ---: | ---: |',
  ]
  for (const metric of Object.keys(summary.efficiency.baseline)) {
    const baseline = summary.efficiency.baseline[metric]
    const candidate = summary.efficiency.candidate[metric]
    const delta = summary.efficiency.deltaPct[metric]
    lines.push(`| ${metric} | ${baseline.median ?? 'unavailable'} | ${candidate.median ?? 'unavailable'} | ${delta === null ? 'unavailable' : `${delta}%`} | ${baseline.relativeRangePct === null ? 'unavailable' : `${baseline.relativeRangePct}%`} | ${candidate.relativeRangePct === null ? 'unavailable' : `${candidate.relativeRangePct}%`} |`)
  }
  lines.push(
    '',
    '## Paired deltas',
    '',
    '| Metric | Pair deltas | Median | Min | Max | Range |',
    '| --- | --- | ---: | ---: | ---: | ---: |',
  )
  for (const [metric, paired] of Object.entries(summary.efficiency.pairedDeltaPct)) {
    const values = paired.pairs
      .map(pair => `${pair.targetPair}:${pair.deltaPct === null ? 'unavailable' : `${pair.deltaPct}%`}`)
      .join(', ') || 'unavailable'
    lines.push(`| ${metric} | ${values} | ${paired.median === null ? 'unavailable' : `${paired.median}%`} | ${paired.min === null ? 'unavailable' : `${paired.min}%`} | ${paired.max === null ? 'unavailable' : `${paired.max}%`} | ${paired.range === null ? 'unavailable' : `${paired.range}%`} |`)
  }
  lines.push(
    '',
    '## Infrastructure Quality',
    '',
    `- Attempted pairs: ${summary.infrastructure.attemptedPairs}`,
    `- Eligible pairs: ${summary.infrastructure.eligiblePairs}`,
    `- Contaminated pairs: ${summary.infrastructure.contaminatedPairs}`,
    `- Replacement pairs: ${summary.infrastructure.replacementPairs}`,
    '',
    '## Paired runs',
    '',
    '| Pair attempt | Target pair | Position | Arm | Classification | Outcome | Failure | Total tokens | Tool calls | Elapsed |',
    '| ---: | ---: | ---: | --- | --- | --- | --- | ---: | ---: | ---: |',
  )
  for (const run of summary.runs) {
    lines.push(`| ${run.pairAttempt ?? run.repetition} | ${run.targetPair ?? run.repetition} | ${run.position ?? 'unavailable'} | ${run.arm} | ${runClassification(run)} | ${run.outcome} | ${run.failure ?? 'none'} | ${run.measurements.tokens.total ?? 'unavailable'} | ${run.measurements.tool_calls ?? 'unavailable'} | ${run.measurements.elapsed_ms ?? 'unavailable'} ms |`)
  }
  lines.push(
    '',
    '## Agent-reported observations',
    '',
    '| Pair attempt | Arm | Trigger | First fix | Corrections | Worker dispatches |',
    '| ---: | --- | --- | --- | ---: | ---: |',
  )
  for (const run of summary.runs) {
    const observations = run.agent_reported?.observations
    lines.push(`| ${run.pairAttempt ?? run.repetition} | ${run.arm} | ${observations?.trigger?.status ?? 'unavailable'} | ${observations?.first_fix_result ?? 'unavailable'} | ${observations?.correction_count ?? 'unavailable'} | ${observations?.worker_dispatch_count ?? 'unavailable'} |`)
  }
  lines.push(
    '',
    '## Worker assignment compliance',
    '',
    '| Pair attempt | Arm | Enforcement | Status | Host dispatches | Expected dispatches | Rejected receipts | Recovered product result | Violations |',
    '| ---: | --- | --- | --- | ---: | ---: | ---: | --- | ---: |',
  )
  for (const run of summary.runs) {
    const worker = run.worker_compliance
    lines.push(`| ${run.pairAttempt ?? run.repetition} | ${run.arm} | ${workerComplianceEnforcement(run)} | ${worker?.status ?? 'unavailable'} | ${worker?.host_dispatch_count ?? 'unavailable'} | ${worker?.expected_dispatch_count ?? 'unavailable'} | ${worker?.receipt_rejection_count ?? 'unavailable'} | ${worker?.recovered_product_result ?? false} | ${worker?.violations?.length ?? 'unavailable'} |`)
  }
  lines.push('', '## Omissions', '')
  for (const omission of summary.omissions)
    lines.push(`- ${omission}`)
  lines.push('', 'Token and latency measurements are diagnostic only and grant no release, publication, or approval authority.', '')
  return lines.join('\n')
}

function createRunDirectory(outputRoot, plan) {
  mkdirSync(outputRoot, { recursive: true })
  const timestamp = new Date().toISOString().replace(/[-:.]/gu, '')
  const directory = join(outputRoot, `${timestamp}-${plan.case}-${plan.baseline.commit.slice(0, 10)}-${process.pid}`)
  mkdirSync(directory)
  return directory
}

function sanitizedRun(arm, schedule, summary, metadata) {
  const observation = summary.observability
  const agentReported = summary.agent_reported
  const observedInfrastructure = metadata.events?.infrastructure
  const timedOut = metadata.timed_out === true
  const contaminated = observedInfrastructure?.status === 'contaminated'
  const classification = classifyProviderAttempt({
    infrastructureStatus: observedInfrastructure?.status,
    outcome: summary.outcome,
    timedOut,
  })
  return {
    case: metadata.case_id,
    repetition: schedule.pairAttempt,
    ...schedule,
    arm,
    classification,
    outcome: summary.outcome,
    completion: summary.completion,
    compositionSha256: metadata.composition?.installed_before?.hash ?? null,
    contractSha256: metadata.contract_sha256 ?? null,
    observationSha256: summary.observation_sha256,
    agent_reported: agentReported,
    dimensions: observation.dimensions,
    resources: observation.resources,
    worker_compliance: observation.worker_compliance ?? null,
    worker_compliance_enforcement: metadata.worker_compliance_enforcement ?? workerComplianceEnforcement({ arm }),
    measurements: {
      corrections: finiteMeasurement(agentReported?.observations.correction_count ?? observation.measurements.corrections),
      first_fix_result: agentReported?.observations.first_fix_result ?? observation.measurements.first_fix_result,
      worker_dispatch_count: finiteMeasurement(agentReported?.observations.worker_dispatch_count ?? observation.measurements.worker_dispatch_count),
      tool_calls: finiteMeasurement(observation.measurements.tool_calls),
      tool_output_bytes: finiteMeasurement(observation.measurements.tool_output_bytes),
      model_invocations: finiteMeasurement(observation.measurements.model_invocations),
      elapsed_ms: finiteMeasurement(observation.measurements.elapsed_ms),
      tokens: {
        cache_write_input: finiteMeasurement(observation.measurements.tokens.cache_write_input),
        cached_input: finiteMeasurement(observation.measurements.tokens.cached_input),
        input: finiteMeasurement(observation.measurements.tokens.input),
        output: finiteMeasurement(observation.measurements.tokens.output),
        reasoning_output: finiteMeasurement(observation.measurements.tokens.reasoning_output),
        total: finiteMeasurement(observation.measurements.tokens.total),
        uncached_input: finiteMeasurement(observation.measurements.tokens.uncached_input),
      },
    },
    infrastructure: {
      categories: observedInfrastructure?.categories ?? [],
      retryCount: finiteMeasurement(observedInfrastructure?.retry_count),
      status: contaminated ? 'contaminated' : 'no-contamination-observed',
    },
    scenario: summary.provider_expectation,
    narrative: {
      missing: summary.output_contract?.narrative_missing ?? [],
      forbidden_present: summary.output_contract?.narrative_forbidden_present ?? [],
      status: (summary.output_contract?.narrative_missing?.length ?? 0) > 0
        || (summary.output_contract?.narrative_forbidden_present?.length ?? 0) > 0
        ? 'warning'
        : 'passed',
    },
    omissions: summary.omissions,
  }
}

function sanitizedFailedRun(arm, schedule, plan, error) {
  const message = error instanceof Error ? error.message : String(error)
  const receiptInvalid = message.includes('evaluation receipt')
  const infrastructureFailure = /\b(?:429|502|503|504|ECONNRESET|ECONNREFUSED|ENOTFOUND|EAI_AGAIN|ETIMEDOUT|rate[ -]?limit|too many requests|bad gateway|service unavailable|gateway timeout|connection reset|connection refused|network unreachable|socket hang up|timed out)\b/iu.test(message)
  return {
    case: plan.case,
    repetition: schedule.pairAttempt,
    ...schedule,
    arm,
    classification: infrastructureFailure ? 'infra-contaminated' : receiptInvalid ? 'model-failed' : 'incomplete',
    outcome: receiptInvalid ? 'failed' : 'unavailable',
    completion: 'evaluation-unavailable',
    compositionSha256: arm === 'baseline' ? plan.baseline.composition.hash : plan.candidate.composition.hash,
    contractSha256: plan.identities.contractSha256,
    observationSha256: null,
    dimensions: {
      trigger: { status: 'not-observed' },
      compliance: { status: 'not-observed' },
      boundary: { status: 'not-observed' },
      task_result: { status: 'not-observed' },
    },
    resources: {
      expected_resources: null,
      observed_resources: null,
      unexpected_resources: null,
      missing_resources: null,
    },
    measurements: {
      corrections: null,
      first_fix_result: null,
      worker_dispatch_count: null,
      tool_calls: null,
      tool_output_bytes: null,
      model_invocations: null,
      elapsed_ms: null,
      tokens: { cache_write_input: null, cached_input: null, input: null, output: null, reasoning_output: null, total: null, uncached_input: null },
    },
    infrastructure: {
      categories: infrastructureFailure ? ['provider-transport'] : [],
      retryCount: null,
      status: infrastructureFailure ? 'contaminated' : 'no-contamination-observed',
    },
    scenario: plan.providerExpectations
      ? { expected: plan.providerExpectations, observed: null, status: 'failed' }
      : null,
    worker_compliance: null,
    worker_compliance_enforcement: workerComplianceEnforcement({ arm }),
    failure: receiptInvalid ? 'invalid-evaluation-receipt' : infrastructureFailure ? 'provider-transport-unavailable' : 'provider-execution-unavailable',
    omissions: ['provider execution did not produce validated structured evaluation metadata'],
  }
}

function validateReplaySourceReport(source, plan) {
  if (!source || typeof source !== 'object'
    || source.verdict !== 'passed'
    || source.execution !== 'serial-paired'
    || source.case !== plan.case
    || source.repetitions !== plan.repetitions
    || source.correctness?.passed !== true
    || source.infrastructure?.attemptedPairs !== plan.repetitions
    || source.infrastructure?.eligiblePairs !== plan.repetitions
    || source.infrastructure?.contaminatedPairs !== 0
    || source.infrastructure?.incompletePairs !== 0
    || source.infrastructure?.replacementPairs !== 0
    || !Array.isArray(source.identities?.issues)
    || source.identities.issues.length !== 0) {
    fail('replay source must be one complete passed comparison without contamination or replacement attempts')
  }
  const identities = [
    ['baseline ref', source.identities.baseline?.ref, plan.baseline.ref],
    ['baseline commit', source.identities.baseline?.commit, plan.baseline.commit],
    ['baseline composition', source.identities.baseline?.composition?.hash, plan.baseline.composition.hash],
    ['candidate composition', source.identities.candidate?.composition?.hash, plan.candidate.composition.hash],
    ['contract', source.identities.contractSha256, plan.identities.contractSha256],
    ['fixture', source.identities.fixtureSha256, plan.identities.fixtureSha256],
  ]
  for (const [label, observed, expected] of identities) {
    if (observed !== expected)
      fail(`replay source ${label} does not match the current plan`)
  }
  if (!isSha256(source.identities.harnessSha256))
    fail('replay source harness identity is missing')
  if (!Array.isArray(source.runs) || source.runs.length !== plan.repetitions * 2)
    fail('replay source must contain exactly two eligible runs per target pair')
  const expectedRuns = new Set()
  for (let targetPair = 1; targetPair <= plan.repetitions; targetPair += 1) {
    expectedRuns.add(`baseline:${targetPair}`)
    expectedRuns.add(`candidate:${targetPair}`)
  }
  for (const run of source.runs) {
    const key = `${run.arm}:${run.targetPair}`
    if (!expectedRuns.delete(key)
      || run.pairAttempt !== run.targetPair
      || run.repetition !== run.pairAttempt
      || run.pairId !== `pair-attempt-${String(run.pairAttempt).padStart(2, '0')}`
      || run.position !== (run.targetPair % 2 === 1
        ? run.arm === 'baseline' ? 1 : 2
        : run.arm === 'candidate' ? 1 : 2)
      || runClassification(run) !== 'eligible'
      || !releaseProviderRunCorrectnessPassed(plan, run)
      || run.contractSha256 !== plan.identities.contractSha256
      || run.compositionSha256 !== (run.arm === 'baseline' ? plan.baseline.composition.hash : plan.candidate.composition.hash)
      || !isSha256(run.observationSha256)) {
      fail('replay source contains an incomplete, duplicate, or mismatched run')
    }
  }
  if (expectedRuns.size > 0)
    fail('replay source is missing one or more paired runs')
  if (!releaseProviderEfficiencyPolicyPassed(source))
    fail('replay source compares efficiency despite worker assignment noncompliance')
}

function replayRunMetadata(sourceDirectory, sourceRun, plan, betaPlan) {
  const pairAttempt = sourceRun.pairAttempt ?? sourceRun.repetition
  const runsRoot = join(sourceDirectory, 'raw', `pair-attempt-${String(pairAttempt).padStart(2, '0')}`, 'runs')
  if (!existsSync(runsRoot) || lstatSync(runsRoot).isSymbolicLink() || !lstatSync(runsRoot).isDirectory())
    fail(`replay raw runs are missing for pair attempt ${pairAttempt}`)
  const expectedVariant = sourceRun.arm === 'baseline' ? 'candidate' : 'product'
  const candidates = readdirSync(runsRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => join(runsRoot, entry.name, 'metadata.json'))
    .filter(existsSync)
    .map((metadataPath) => {
      const metadata = readJsonFile(metadataPath, `replay metadata for pair attempt ${pairAttempt}`)
      return { metadata, metadataPath }
    })
    .filter(entry => entry.metadata.variant === expectedVariant)
  if (candidates.length !== 1)
    fail(`replay pair attempt ${pairAttempt} must contain exactly one ${sourceRun.arm} metadata record`)
  const { metadata, metadataPath } = candidates[0]
  if (metadata.case_id !== plan.case
    || metadata.result !== 'passed'
    || metadata.timed_out === true
    || metadata.contract_sha256 !== plan.identities.contractSha256
    || metadata.composition?.installed_before?.hash !== sourceRun.compositionSha256
    || metadata.composition?.installed_after?.hash !== sourceRun.compositionSha256
    || metadata.composition?.stable !== true
    || metadata.events?.infrastructure?.status !== 'no-contamination-observed'
    || metadata.verification?.passed !== true
    || metadata.observation_sha256 !== sourceRun.observationSha256) {
    fail(`replay metadata does not match the sanitized ${sourceRun.arm} run for pair attempt ${pairAttempt}`)
  }
  const runDirectory = dirname(metadataPath)
  const eventsPath = join(runDirectory, 'events.jsonl')
  const finalPath = join(runDirectory, 'final.md')
  readRegularFile(eventsPath, `replay events for pair attempt ${pairAttempt}`)
  const final = readRegularFile(finalPath, `replay final response for pair attempt ${pairAttempt}`)
  if (hashManagedControllerArtifact(final) !== metadata.final_hash)
    fail(`replay final response hash does not match for pair attempt ${pairAttempt}`)
  const replayMetadata = {
    ...metadata,
    paths: { ...metadata.paths, events: eventsPath, final: finalPath, metadata: metadataPath },
  }
  const summarized = summarizeManagedControllerBetaRun(betaPlan, replayMetadata, final)
  const replayed = sanitizedRun(sourceRun.arm, {
    order: sourceRun.order,
    pairAttempt,
    pairId: sourceRun.pairId,
    position: sourceRun.position,
    targetPair: sourceRun.targetPair,
  }, summarized, replayMetadata)
  const replayChecks = [
    ['classification', replayed.classification, 'eligible'],
    ['outcome', replayed.outcome, 'passed'],
    ['observation identity', replayed.observationSha256, sourceRun.observationSha256],
    ...(sourceRun.agent_reported == null
      ? []
      : [['agent-reported evidence', replayed.agent_reported, sourceRun.agent_reported]]),
    ['dimensions', replayed.dimensions, sourceRun.dimensions],
    ['worker compliance', replayed.worker_compliance, sourceRun.worker_compliance ?? null],
    ['worker compliance enforcement', replayed.worker_compliance_enforcement, sourceRun.worker_compliance_enforcement ?? workerComplianceEnforcement(sourceRun)],
    ['resources', replayed.resources, sourceRun.resources],
    ['infrastructure', replayed.infrastructure, sourceRun.infrastructure],
    ['input tokens', replayed.measurements.tokens.input, sourceRun.measurements?.tokens?.input],
    ['cached input tokens', replayed.measurements.tokens.cached_input, sourceRun.measurements?.tokens?.cached_input],
    ['uncached input tokens', replayed.measurements.tokens.uncached_input, sourceRun.measurements?.tokens?.uncached_input],
    ['output tokens', replayed.measurements.tokens.output, sourceRun.measurements?.tokens?.output],
    ['reasoning output tokens', replayed.measurements.tokens.reasoning_output, sourceRun.measurements?.tokens?.reasoning_output],
    ['total tokens', replayed.measurements.tokens.total, sourceRun.measurements?.tokens?.total],
    ['tool calls', replayed.measurements.tool_calls, sourceRun.measurements?.tool_calls],
    ['tool output bytes', replayed.measurements.tool_output_bytes, sourceRun.measurements?.tool_output_bytes],
    ['model invocations', replayed.measurements.model_invocations, sourceRun.measurements?.model_invocations],
    ['elapsed time', replayed.measurements.elapsed_ms, sourceRun.measurements?.elapsed_ms],
  ]
  const mismatch = replayChecks.find(([, observed, expected]) => !sameJson(observed, expected))
  if (mismatch)
    fail(`replay ${mismatch[0]} does not match the validated sanitized ${sourceRun.arm} run for pair attempt ${pairAttempt}`)
  return replayed
}

export function replayReleaseProviderComparison({
  baselineRef,
  caseId,
  outputRoot = join(root, '.cache', 'release-provider-comparison'),
  repetitions,
  sourceReportPath,
} = {}) {
  if (typeof sourceReportPath !== 'string' || sourceReportPath.length === 0)
    fail('replay source report path is required')
  const plan = buildReleaseProviderComparisonPlan(root, { baselineRef, caseId, repetitions })
  const resolvedSourceReport = resolve(sourceReportPath)
  const sourceContent = readRegularFile(resolvedSourceReport, 'replay source report')
  let source
  try {
    source = JSON.parse(sourceContent)
  }
  catch {
    fail('replay source report is not valid JSON')
  }
  validateReplaySourceReport(source, plan)
  const betaPlan = loadManagedControllerBetaPlan(root, { caseId: plan.case })
  const sourceDirectory = dirname(resolvedSourceReport)
  const runs = source.runs.map(run => replayRunMetadata(sourceDirectory, run, plan, betaPlan))
  const refreshedPlan = buildReleaseProviderComparisonPlan(root, { baselineRef, caseId: plan.case, repetitions })
  const summary = {
    ...createReleaseProviderComparisonSummary(plan, runs, refreshedPlan),
    replay: {
      mode: 'deterministic-replay',
      sourceCandidateCommit: source.identities.candidate?.commit ?? null,
      sourceHarnessSha256: source.identities.harnessSha256,
      sourceReportSha256: hashContent(sourceContent),
    },
  }
  summary.omissions.push('provider execution was not repeated; the report was deterministically replayed from validated local raw evidence')
  const runDirectory = createRunDirectory(resolve(outputRoot), plan)
  const jsonPath = join(runDirectory, 'report.json')
  const markdownPath = join(runDirectory, 'report.md')
  writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`)
  writeFileSync(markdownPath, renderReleaseProviderComparisonMarkdown(summary))
  return { jsonPath, markdownPath, summary }
}

export async function runReleaseProviderComparison({
  authFile,
  baselineRef,
  caseId,
  effort,
  isolatedUserContext = false,
  model,
  modelCatalogJson,
  openaiBaseUrl,
  outputRoot = join(root, '.cache', 'release-provider-comparison'),
  provider,
  repetitions,
  timeoutMs = 600000,
  evaluationRunner = runManagedControllerEvaluation,
} = {}) {
  const plan = buildReleaseProviderComparisonPlan(root, { baselineRef, caseId, repetitions })
  const betaPlan = loadManagedControllerBetaPlan(root, { caseId: plan.case })
  const runDirectory = createRunDirectory(resolve(outputRoot), plan)
  const baselineSnapshotRoot = join(runDirectory, '.baseline-source')
  const baselineSkills = extractGitSkills(root, plan.baseline.commit, betaPlan.product_skill_names, baselineSnapshotRoot)
  let runs = []
  try {
    const arms = {
      baseline: { source: baselineSkills, variant: 'candidate' },
      candidate: { source: join(root, 'skills'), variant: 'product' },
    }
    runs = await executeSerialProviderPairs({
      maxContaminatedPairReplacements: plan.scheduling.maxContaminatedPairReplacements,
      repetitions: plan.repetitions,
      runCorrectnessPassed: run => releaseProviderRunCorrectnessPassed(plan, run)
        && releaseProviderRunIdentityPassed(plan, run),
      runArm: async (schedule) => {
        const arm = arms[schedule.arm]
        let metadata
        try {
          metadata = await evaluationRunner({
            authFile,
            caseId: plan.case,
            comparisonArm: schedule.arm,
            effort,
            isolatedUserContext,
            model,
            modelCatalogJson,
            openaiBaseUrl,
            outputRoot: join(runDirectory, 'raw', `pair-attempt-${String(schedule.pairAttempt).padStart(2, '0')}`),
            provider,
            root,
            skillSourceDirectory: arm.source,
            timeoutMs,
            variant: arm.variant,
          })
        }
        catch (error) {
          return sanitizedFailedRun(schedule.arm, schedule, plan, error)
        }
        const final = metadata.paths?.final && existsSync(metadata.paths.final)
          ? readFileSync(metadata.paths.final, 'utf8')
          : ''
        const summarized = summarizeManagedControllerBetaRun(betaPlan, metadata, final)
        return sanitizedRun(schedule.arm, schedule, summarized, metadata)
      },
    })
  }
  finally {
    rmSync(baselineSnapshotRoot, { force: true, recursive: true })
  }
  const refreshedPlan = buildReleaseProviderComparisonPlan(root, { baselineRef, caseId: plan.case, repetitions })
  const summary = createReleaseProviderComparisonSummary(plan, runs, refreshedPlan)
  const jsonPath = join(runDirectory, 'report.json')
  const markdownPath = join(runDirectory, 'report.md')
  writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`)
  writeFileSync(markdownPath, renderReleaseProviderComparisonMarkdown(summary))
  return { jsonPath, markdownPath, summary }
}

export async function runReleaseProviderComparisonMatrix({
  baselineRef,
  scenarioRunner = runReleaseProviderComparison,
  ...options
} = {}) {
  const plans = buildReleaseProviderComparisonMatrixPlans(root, { baselineRef })
  const results = []
  let failedCase = null
  let failure = null
  for (const plan of plans) {
    const result = await scenarioRunner({
      ...options,
      baselineRef,
      caseId: plan.case,
      repetitions: undefined,
    })
    results.push(result)
    const identitiesMatch = result.summary?.case === plan.case
      && result.summary?.repetitions === plan.repetitions
      && result.summary?.identities?.baseline?.ref === plan.baseline.ref
      && result.summary?.identities?.baseline?.commit === plan.baseline.commit
      && result.summary?.identities?.baseline?.composition?.hash === plan.baseline.composition.hash
      && result.summary?.identities?.candidate?.composition?.hash === plan.candidate.composition.hash
      && result.summary?.identities?.contractSha256 === plan.identities.contractSha256
      && result.summary?.identities?.fixtureSha256 === plan.identities.fixtureSha256
      && result.summary?.identities?.harnessSha256 === plan.identities.harnessSha256
    if (result.summary.verdict !== 'passed' || !identitiesMatch) {
      failedCase = plan.case
      failure = result.summary.verdict !== 'passed'
        ? 'scenario-failed'
        : 'scenario-identity-drift'
      break
    }
  }
  return {
    failedCase,
    failure,
    results,
    scenariosCompleted: results.length,
    scenariosPlanned: plans.length,
    verdict: failure === null && results.length === plans.length
      ? 'passed'
      : 'failed',
  }
}

async function main() {
  const flags = process.argv.slice(2)
  const baselineRef = readManagedControllerFlag(flags, '--baseline-ref')
  const caseId = readManagedControllerFlag(flags, '--case')
  const repetitions = readManagedControllerFlag(flags, '--repetitions')
  const matrix = flags.includes('--matrix')
  const replayReport = readManagedControllerFlag(flags, '--replay-report')
  if (!baselineRef)
    fail('--baseline-ref is required')
  if (matrix && (caseId || repetitions || replayReport))
    fail('--matrix cannot be combined with --case, --repetitions, or --replay-report')
  if (flags.includes('--plan')) {
    if (matrix) {
      const plans = buildReleaseProviderComparisonMatrixPlans(root, { baselineRef })
      process.stdout.write(`${JSON.stringify({
        execution: 'serial-scenario-matrix',
        scenarios: plans,
        totalPairs: plans.reduce((total, plan) => total + plan.repetitions, 0),
      }, null, 2)}\n`)
      return
    }
    const plan = buildReleaseProviderComparisonPlan(root, { baselineRef, caseId, repetitions })
    process.stdout.write(flags.includes('--json') ? `${JSON.stringify(plan, null, 2)}\n` : `${renderReleaseProviderComparisonMarkdown(createReleaseProviderComparisonSummary(plan, []))}\n`)
    return
  }
  if (replayReport) {
    if (flags.includes('--plan'))
      fail('--replay-report cannot be combined with --plan')
    for (const flag of ['--auth-file', '--effort', '--isolated-user-context', '--model', '--model-catalog-json', '--openai-base-url', '--provider', '--timeout-ms']) {
      if (flags.includes(flag))
        fail(`--replay-report cannot be combined with provider execution option ${flag}`)
    }
    const result = replayReleaseProviderComparison({
      baselineRef,
      caseId,
      outputRoot: readManagedControllerFlag(flags, '--output-root'),
      repetitions,
      sourceReportPath: replayReport,
    })
    process.stdout.write(`${JSON.stringify({
      verdict: result.summary.verdict,
      replay: result.summary.replay,
      report: result.markdownPath,
      json: result.jsonPath,
    }, null, 2)}\n`)
    if (result.summary.verdict !== 'passed')
      process.exitCode = 1
    return
  }
  const model = readManagedControllerFlag(flags, '--model')
  const effort = readManagedControllerFlag(flags, '--effort')
  if (!model || !effort)
    fail('--model and --effort are required for provider execution')
  const providerOptions = {
    authFile: readManagedControllerFlag(flags, '--auth-file'),
    baselineRef,
    effort,
    isolatedUserContext: flags.includes('--isolated-user-context'),
    model,
    modelCatalogJson: readManagedControllerFlag(flags, '--model-catalog-json'),
    openaiBaseUrl: readManagedControllerFlag(flags, '--openai-base-url'),
    outputRoot: readManagedControllerFlag(flags, '--output-root'),
    provider: readManagedControllerFlag(flags, '--provider'),
    timeoutMs: positiveInteger(readManagedControllerFlag(flags, '--timeout-ms') ?? 600000, 'timeout-ms'),
  }
  if (matrix) {
    const campaign = await runReleaseProviderComparisonMatrix(providerOptions)
    process.stdout.write(`${JSON.stringify({
      verdict: campaign.verdict,
      failedCase: campaign.failedCase,
      failure: campaign.failure,
      scenariosCompleted: campaign.scenariosCompleted,
      scenariosPlanned: campaign.scenariosPlanned,
      reports: campaign.results.map(result => ({
        case: result.summary.case,
        json: result.jsonPath,
        report: result.markdownPath,
        verdict: result.summary.verdict,
      })),
    }, null, 2)}\n`)
    if (campaign.verdict !== 'passed')
      process.exitCode = 1
    return
  }
  const result = await runReleaseProviderComparison({
    ...providerOptions,
    caseId,
    repetitions,
  })
  process.stdout.write(`${JSON.stringify({
    verdict: result.summary.verdict,
    report: result.markdownPath,
    json: result.jsonPath,
  }, null, 2)}\n`)
  if (result.summary.verdict !== 'passed')
    process.exitCode = 1
}

if (process.argv[1] && resolve(process.argv[1]) === scriptPath) {
  main().catch((error) => {
    console.error(error.message)
    process.exitCode = 1
  })
}
