#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve, sep } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import {
  loadManagedControllerBetaPlan,
  summarizeManagedControllerBetaRun,
} from './managed-controller-beta.mjs'
import {
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
  { baselineRef, repetitions = 3 } = {},
) {
  const repetitionCount = positiveInteger(repetitions, 'repetitions', { min: 3, max: 10 })
  const baselineCommit = resolveGitCommit(repositoryRoot, baselineRef)
  const betaPlan = loadManagedControllerBetaPlan(repositoryRoot)
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
    metrics: ['input-tokens', 'output-tokens', 'total-tokens', 'tool-calls', 'elapsed-ms'],
    correctness: ['compliance', 'boundary', 'task-result'],
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
    policy: {
      correctnessBeforeEfficiency: true,
      efficiencyThreshold: null,
      unavailableIsPass: false,
    },
    omissions: [
      'token deltas are provider-backed observations rather than deterministic release acceptance',
      'the comparison isolates Skill composition while sharing the current CLI and evaluation harness',
      'no provider-general, model-general, cost, publication, or release approval claim is made',
    ],
  }
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
    output_tokens: run => run.measurements.tokens.output,
    total_tokens: run => run.measurements.tokens.total,
    tool_calls: run => run.measurements.tool_calls,
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

export function createReleaseProviderComparisonSummary(plan, runs, refreshedPlan = plan) {
  const baselineRuns = runs.filter(run => run.arm === 'baseline')
  const candidateRuns = runs.filter(run => run.arm === 'candidate')
  const identityIssues = []
  for (const run of baselineRuns) {
    if (run.compositionSha256 !== plan.baseline.composition.hash)
      identityIssues.push(`baseline composition drift in repetition ${run.repetition}`)
  }
  for (const run of candidateRuns) {
    if (run.compositionSha256 !== plan.candidate.composition.hash)
      identityIssues.push(`candidate composition drift in repetition ${run.repetition}`)
  }
  for (const run of runs) {
    if (run.contractSha256 !== plan.identities.contractSha256)
      identityIssues.push(`${run.arm} contract drift in repetition ${run.repetition}`)
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
  }
  const correctnessFailed = runs.some(run => run.outcome === 'failed'
    || (run.outcome === 'passed'
      && ['compliance', 'boundary', 'task_result'].some(name => run.dimensions[name]?.status !== 'passed')))
  const unavailable = runs.some(run => ['unavailable', 'not-run'].includes(run.outcome))
    || baselineRuns.length !== plan.repetitions
    || candidateRuns.length !== plan.repetitions
  const measurementIncomplete = runs.some(run => [
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
  let verdict = 'passed'
  if (identityIssues.length > 0 || correctnessFailed)
    verdict = 'failed'
  else if (unavailable)
    verdict = 'unavailable'
  else if (measurementIncomplete)
    verdict = 'incomplete'
  return {
    verdict,
    execution: plan.execution,
    repetitions: plan.repetitions,
    case: plan.case,
    identities: {
      baseline: plan.baseline,
      candidate: plan.candidate,
      ...plan.identities,
      issues: identityIssues,
    },
    correctness: {
      passed: !correctnessFailed && !unavailable && identityIssues.length === 0,
      requiredDimensions: plan.correctness,
    },
    efficiency: {
      status: verdict === 'passed' ? 'observed' : 'not-conclusive',
      threshold: null,
      baseline,
      candidate,
      deltaPct: deltas,
      interpretation: 'diagnostic-only; correctness and boundary evidence take precedence',
    },
    runs,
    omissions: [
      ...plan.omissions,
      ...(measurementIncomplete ? ['one or more required measurements are unavailable'] : []),
      ...(unavailable ? ['one or more paired provider runs were unavailable or not run'] : []),
    ],
  }
}

export function renderReleaseProviderComparisonMarkdown(summary) {
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
    '',
    '## Median measurements',
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
  lines.push('', '## Paired runs', '', '| Repetition | Arm | Outcome | Failure | Total tokens | Tool calls | Elapsed |', '| ---: | --- | --- | --- | ---: | ---: | ---: |')
  for (const run of summary.runs) {
    lines.push(`| ${run.repetition} | ${run.arm} | ${run.outcome} | ${run.failure ?? 'none'} | ${run.measurements.tokens.total ?? 'unavailable'} | ${run.measurements.tool_calls ?? 'unavailable'} | ${run.measurements.elapsed_ms ?? 'unavailable'} ms |`)
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
  const directory = join(outputRoot, `${timestamp}-${plan.baseline.commit.slice(0, 10)}-${process.pid}`)
  mkdirSync(directory)
  return directory
}

function sanitizedRun(arm, repetition, summary, metadata) {
  const observation = summary.observability
  return {
    repetition,
    arm,
    outcome: summary.outcome,
    completion: summary.completion,
    compositionSha256: metadata.composition?.installed_before?.hash ?? null,
    contractSha256: metadata.contract_sha256 ?? null,
    observationSha256: summary.observation_sha256,
    dimensions: observation.dimensions,
    measurements: {
      corrections: finiteMeasurement(observation.measurements.corrections),
      first_fix_result: observation.measurements.first_fix_result,
      worker_dispatch_count: finiteMeasurement(observation.measurements.worker_dispatch_count),
      tool_calls: finiteMeasurement(observation.measurements.tool_calls),
      elapsed_ms: finiteMeasurement(observation.measurements.elapsed_ms),
      tokens: {
        input: finiteMeasurement(observation.measurements.tokens.input),
        output: finiteMeasurement(observation.measurements.tokens.output),
        total: finiteMeasurement(observation.measurements.tokens.total),
      },
    },
    omissions: summary.omissions,
  }
}

function sanitizedFailedRun(arm, repetition, plan, error) {
  const message = error instanceof Error ? error.message : String(error)
  const receiptInvalid = message.includes('evaluation receipt')
  return {
    repetition,
    arm,
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
    measurements: {
      corrections: null,
      first_fix_result: null,
      worker_dispatch_count: null,
      tool_calls: null,
      elapsed_ms: null,
      tokens: { input: null, output: null, total: null },
    },
    failure: receiptInvalid ? 'invalid-evaluation-receipt' : 'provider-execution-unavailable',
    omissions: ['provider execution did not produce validated structured evaluation metadata'],
  }
}

export async function runReleaseProviderComparison({
  authFile,
  baselineRef,
  effort,
  isolatedUserContext = false,
  model,
  modelCatalogJson,
  openaiBaseUrl,
  outputRoot = join(root, '.cache', 'release-provider-comparison'),
  provider,
  repetitions = 3,
  timeoutMs = 600000,
  evaluationRunner = runManagedControllerEvaluation,
} = {}) {
  const plan = buildReleaseProviderComparisonPlan(root, { baselineRef, repetitions })
  const betaPlan = loadManagedControllerBetaPlan(root)
  const runDirectory = createRunDirectory(resolve(outputRoot), plan)
  const baselineSnapshotRoot = join(runDirectory, '.baseline-source')
  const baselineSkills = extractGitSkills(root, plan.baseline.commit, betaPlan.product_skill_names, baselineSnapshotRoot)
  const runs = []
  try {
    for (let repetition = 1; repetition <= plan.repetitions; repetition += 1) {
      for (const arm of [
        { name: 'baseline', source: baselineSkills, variant: 'candidate' },
        { name: 'candidate', source: join(root, 'skills'), variant: 'product' },
      ]) {
        let metadata
        try {
          metadata = await evaluationRunner({
            authFile,
            caseId: plan.case,
            effort,
            isolatedUserContext,
            model,
            modelCatalogJson,
            openaiBaseUrl,
            outputRoot: join(runDirectory, 'raw', `repetition-${String(repetition).padStart(2, '0')}`),
            provider,
            root,
            skillSourceDirectory: arm.source,
            timeoutMs,
            variant: arm.variant,
          })
        }
        catch (error) {
          runs.push(sanitizedFailedRun(arm.name, repetition, plan, error))
          break
        }
        const final = metadata.paths?.final && existsSync(metadata.paths.final)
          ? readFileSync(metadata.paths.final, 'utf8')
          : ''
        const summarized = summarizeManagedControllerBetaRun(betaPlan, metadata, final)
        runs.push(sanitizedRun(arm.name, repetition, summarized, metadata))
        if (summarized.outcome !== 'passed')
          break
      }
      if (runs.at(-1)?.outcome !== 'passed')
        break
    }
  }
  finally {
    rmSync(baselineSnapshotRoot, { force: true, recursive: true })
  }
  const refreshedPlan = buildReleaseProviderComparisonPlan(root, { baselineRef, repetitions })
  const summary = createReleaseProviderComparisonSummary(plan, runs, refreshedPlan)
  const jsonPath = join(runDirectory, 'report.json')
  const markdownPath = join(runDirectory, 'report.md')
  writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`)
  writeFileSync(markdownPath, renderReleaseProviderComparisonMarkdown(summary))
  return { jsonPath, markdownPath, summary }
}

async function main() {
  const flags = process.argv.slice(2)
  const baselineRef = readManagedControllerFlag(flags, '--baseline-ref')
  const repetitions = readManagedControllerFlag(flags, '--repetitions') ?? 3
  if (!baselineRef)
    fail('--baseline-ref is required')
  const plan = buildReleaseProviderComparisonPlan(root, { baselineRef, repetitions })
  if (flags.includes('--plan')) {
    process.stdout.write(flags.includes('--json') ? `${JSON.stringify(plan, null, 2)}\n` : `${renderReleaseProviderComparisonMarkdown(createReleaseProviderComparisonSummary(plan, []))}\n`)
    return
  }
  const model = readManagedControllerFlag(flags, '--model')
  const effort = readManagedControllerFlag(flags, '--effort')
  if (!model || !effort)
    fail('--model and --effort are required for provider execution')
  const result = await runReleaseProviderComparison({
    authFile: readManagedControllerFlag(flags, '--auth-file'),
    baselineRef,
    effort,
    isolatedUserContext: flags.includes('--isolated-user-context'),
    model,
    modelCatalogJson: readManagedControllerFlag(flags, '--model-catalog-json'),
    openaiBaseUrl: readManagedControllerFlag(flags, '--openai-base-url'),
    outputRoot: readManagedControllerFlag(flags, '--output-root'),
    provider: readManagedControllerFlag(flags, '--provider'),
    repetitions,
    timeoutMs: positiveInteger(readManagedControllerFlag(flags, '--timeout-ms') ?? 600000, 'timeout-ms'),
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
