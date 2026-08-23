#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, relative, resolve, sep } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { parse as parseYaml } from 'yaml'
import { hashManagedControllerComposition, readManagedControllerFlag, runManagedControllerEvaluation } from './managed-controller-eval.mjs'
import { computeReleaseSourceIdentity } from './release-acceptance.mjs'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
const scriptPath = fileURLToPath(import.meta.url)
const CASE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u

function fail(message) {
  throw new Error(`Release behavior acceptance invalid: ${message}`)
}

function hashContent(content) {
  return createHash('sha256').update(content).digest('hex')
}

function listFiles(directory, current = directory) {
  return readdirSync(current, { withFileTypes: true })
    .flatMap((entry) => {
      const path = join(current, entry.name)
      return entry.isDirectory() ? listFiles(directory, path) : [path]
    })
    .sort()
}

function hashTree(directory) {
  const hash = createHash('sha256')
  for (const path of listFiles(directory)) {
    hash.update(relative(directory, path))
    hash.update('\0')
    hash.update(readFileSync(path))
    hash.update('\0')
  }
  return hash.digest('hex')
}

function gitOutput(repositoryRoot, args, encoding = 'utf8') {
  return execFileSync('git', ['-C', repositoryRoot, ...args], { encoding, stdio: ['ignore', 'pipe', 'pipe'] })
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

function relativePathInside(parent, path) {
  const value = relative(parent, path)
  return value === '' || (value !== '..' && !value.startsWith(`..${sep}`))
}

function extractGitSkills(repositoryRoot, commit, skills, destinationRoot) {
  const sourceRoot = join(destinationRoot, 'skills')
  mkdirSync(sourceRoot, { recursive: true })
  const records = gitOutput(
    repositoryRoot,
    ['ls-tree', '-r', '-z', commit, '--', ...skills.map(skill => `skills/${skill}`)],
    'buffer',
  ).toString('utf8').split('\0').filter(Boolean)
  const observed = new Set()
  for (const record of records) {
    const match = /^(100644|100755) blob [a-f0-9]{40,64}\t(.+)$/u.exec(record)
    if (!match)
      fail(`baseline Skills contain an unsupported Git entry: ${record}`)
    const repositoryPath = match[2]
    const skill = skills.find(name => repositoryPath === `skills/${name}` || repositoryPath.startsWith(`skills/${name}/`))
    if (!skill)
      fail(`baseline Skills contain an unexpected path: ${repositoryPath}`)
    const destination = resolve(destinationRoot, repositoryPath)
    if (!relativePathInside(destinationRoot, destination))
      fail(`baseline Skill path escapes its snapshot: ${repositoryPath}`)
    mkdirSync(dirname(destination), { recursive: true })
    writeFileSync(destination, gitOutput(repositoryRoot, ['show', `${commit}:${repositoryPath}`], 'buffer'), { mode: match[1] === '100755' ? 0o755 : 0o644 })
    observed.add(skill)
  }
  const missing = skills.filter(skill => !observed.has(skill))
  if (missing.length > 0)
    fail(`baseline commit is missing required Skills: ${missing.join(', ')}`)
  return sourceRoot
}

function readManifest(repositoryRoot) {
  const path = join(repositoryRoot, 'evaluation', 'release-behavior', 'release-behavior.yaml')
  const manifest = parseYaml(readFileSync(path, 'utf8'))
  if (!manifest || manifest.id !== 'release-behavior-acceptance' || manifest.execution !== 'serial-fail-fast')
    fail('behavior manifest identity or execution mode is invalid')
  if (!Array.isArray(manifest.cases) || manifest.cases.length === 0)
    fail('behavior manifest must contain cases')
  const ids = new Set()
  for (const entry of manifest.cases) {
    if (!entry || !CASE_ID.test(entry.id ?? '') || !CASE_ID.test(entry.holdout ?? '') || ids.has(entry.id))
      fail('behavior cases must have unique valid ids and holdouts')
    ids.add(entry.id)
    for (const field of ['candidate_repetitions', 'baseline_repetitions']) {
      if (!Number.isInteger(entry[field]) || entry[field] < (field === 'candidate_repetitions' ? 1 : 0) || entry[field] > 5)
        fail(`${entry.id}.${field} is invalid`)
    }
  }
  const candidateRuns = manifest.cases.reduce((total, entry) => total + entry.candidate_repetitions, 0)
  const baselineRuns = manifest.cases.reduce((total, entry) => total + entry.baseline_repetitions, 0)
  if (candidateRuns !== 10 || baselineRuns !== 2)
    fail(`behavior plan must contain exactly 10 candidate and 2 baseline runs, observed ${candidateRuns} and ${baselineRuns}`)
  return { manifest, path }
}

function readHoldout(repositoryRoot, holdout) {
  const directory = join(repositoryRoot, 'evaluation', 'managed-controller', 'holdout', holdout)
  const path = join(directory, 'case.yaml')
  if (!existsSync(path) || lstatSync(path).isSymbolicLink())
    fail(`holdout is missing: ${holdout}`)
  const manifest = parseYaml(readFileSync(path, 'utf8'))
  const skills = manifest?.installed_skills
  if (!manifest || manifest.id !== holdout || !Array.isArray(skills) || skills.length === 0 || !skills.includes('rsp-manage'))
    fail(`holdout must declare installed Skills including rsp-manage: ${holdout}`)
  const baseCase = manifest.base_case ?? holdout
  const baseDirectory = join(repositoryRoot, 'evaluation', 'managed-controller', 'holdout', baseCase, 'base')
  if (!existsSync(baseDirectory) || !lstatSync(baseDirectory).isDirectory())
    fail(`holdout base fixture is missing: ${holdout}`)
  return { baseDirectory, manifest, path, skills }
}

function composition(sourceDirectory, skills) {
  return hashManagedControllerComposition(skills.map(name => ({ name, path: join(sourceDirectory, name) })))
}

function behaviorHarnessSha256(repositoryRoot, manifestPath) {
  const hash = createHash('sha256')
  for (const path of [
    scriptPath,
    join(repositoryRoot, 'scripts', 'release-behavior-evidence-check.mjs'),
    join(repositoryRoot, 'scripts', 'managed-controller-eval.mjs'),
    join(repositoryRoot, 'scripts', 'skill-evaluation-observability.mjs'),
    manifestPath,
  ]) {
    hash.update(relative(repositoryRoot, path))
    hash.update('\0')
    hash.update(readFileSync(path))
    hash.update('\0')
  }
  return hash.digest('hex')
}

export function buildReleaseBehaviorPlan(repositoryRoot = root, { baselineRef, caseId, effort = null, model = null, provider = null } = {}) {
  const baselineCommit = resolveGitCommit(repositoryRoot, baselineRef)
  const { manifest, path } = readManifest(repositoryRoot)
  const selected = caseId ? manifest.cases.filter(entry => entry.id === caseId) : manifest.cases
  if (selected.length === 0)
    fail(`behavior case is not configured: ${caseId}`)
  const holdouts = selected.map(entry => ({ entry, holdout: readHoldout(repositoryRoot, entry.holdout) }))
  const skills = [...new Set(holdouts.flatMap(item => item.holdout.skills))].sort()
  const temporaryRoot = mkdtempSync(join(tmpdir(), 'rsp-release-behavior-plan-'))
  let baselineSkills
  try {
    baselineSkills = extractGitSkills(repositoryRoot, baselineCommit, skills, temporaryRoot)
    const harnessSha256 = behaviorHarnessSha256(repositoryRoot, path)
    const candidateSource = computeReleaseSourceIdentity(repositoryRoot)
    const cases = holdouts.map(({ entry, holdout }) => ({
      id: entry.id,
      holdout: entry.holdout,
      risk: entry.risk,
      candidateRepetitions: entry.candidate_repetitions,
      baselineRepetitions: entry.baseline_repetitions,
      installedSkills: holdout.skills,
      identities: {
        baselineCompositionSha256: composition(baselineSkills, holdout.skills).hash,
        candidateCompositionSha256: composition(join(repositoryRoot, 'skills'), holdout.skills).hash,
        contractSha256: hashContent(readFileSync(holdout.path)),
        fixtureSha256: hashTree(holdout.baseDirectory),
        harnessSha256,
      },
    }))
    return {
      id: manifest.id,
      execution: manifest.execution,
      baseline: { ref: baselineRef, commit: baselineCommit },
      candidate: candidateSource,
      settings: { model, effort, provider },
      counts: { candidateRuns: cases.reduce((total, entry) => total + entry.candidateRepetitions, 0), baselineRuns: cases.reduce((total, entry) => total + entry.baselineRepetitions, 0) },
      diagnostics: manifest.diagnostics,
      policy: manifest.policy,
      cases,
    }
  }
  finally {
    rmSync(temporaryRoot, { force: true, recursive: true })
  }
}

function surfaceText(surface, metadata, final) {
  if (surface.kind === 'final')
    return final
  if (surface.kind === 'commits')
    return (metadata.git?.commits ?? []).map(commit => [commit.subject, ...(commit.body_bullets ?? []), ...Object.entries(commit.trailers ?? {}).map(([key, value]) => `${key}: ${value}`)].join('\n')).join('\n')
  if (surface.kind === 'changed-paths')
    return (metadata.worktree?.changed_paths ?? []).join('\n')
  if (surface.kind === 'file')
    return readWorkspaceSurface(metadata.paths.workspace, surface.path)
  if (surface.kind === 'files')
    return surface.paths.map(path => readWorkspaceSurface(metadata.paths.workspace, path)).join('\n')
  fail(`unknown behavior surface: ${surface.kind}`)
}

function readWorkspaceSurface(workspace, repositoryPath) {
  if (typeof repositoryPath !== 'string' || repositoryPath.length === 0)
    fail('behavior surface path must be a non-empty string')
  const workspaceRoot = resolve(workspace)
  const path = resolve(workspaceRoot, repositoryPath)
  if (!relativePathInside(workspaceRoot, path) || !existsSync(path))
    fail(`behavior surface is unavailable: ${repositoryPath}`)
  const stats = lstatSync(path)
  if (stats.isSymbolicLink() || !stats.isFile())
    fail(`behavior surface must be a regular file: ${repositoryPath}`)
  return readFileSync(path, 'utf8')
}

function includesFolded(body, fragment) {
  return body.toLocaleLowerCase('en-US').includes(String(fragment).toLocaleLowerCase('en-US'))
}

function scoreBehaviorContract(holdout, metadata, final) {
  const contract = holdout.manifest.release_behavior
  if (!contract || typeof contract.dimension !== 'string' || !Array.isArray(contract.surfaces))
    return { status: 'passed', evidence: { dimension: 'managed-controller-contract' } }
  const failures = []
  for (const [index, surface] of contract.surfaces.entries()) {
    let body
    try {
      body = surfaceText(surface, metadata, final)
    }
    catch {
      failures.push(`surface-${index + 1}:missing`)
      continue
    }
    for (const required of surface.required ?? []) {
      if (!includesFolded(body, required))
        failures.push(`surface-${index + 1}:required:${required}`)
    }
    for (const forbidden of surface.forbidden ?? []) {
      if (includesFolded(body, forbidden))
        failures.push(`surface-${index + 1}:forbidden:${forbidden}`)
    }
  }
  return { status: failures.length === 0 ? 'passed' : 'failed', evidence: { dimension: contract.dimension, failures } }
}

function scoreRoute(holdout, metadata) {
  const expected = holdout.manifest.provider_expectations
  if (!expected)
    return { status: 'not-applicable', evidence: null }
  const observations = metadata.agent_reported?.observations
  const observed = observations?.trigger?.evidence
  const workerCount = observations?.worker_dispatch_count
  const passed = observations?.trigger?.status === 'passed'
    && observed?.route === expected.route
    && observed?.mode === expected.mode
    && observed?.dispatch === expected.dispatch
    && Number.isInteger(workerCount)
    && workerCount >= expected.worker_dispatch_count.min
    && workerCount <= expected.worker_dispatch_count.max
  return { status: passed ? 'passed' : 'failed', evidence: { expected, observed: { ...observed, worker_dispatch_count: workerCount ?? null } } }
}

export function classifyReleaseBehaviorExecution(metadata, final) {
  const startupFailed = metadata.exit_code !== 0
    && final.trim() === ''
    && metadata.events?.tool_calls === 0
    && metadata.events?.usage === null
  if (startupFailed)
    return 'harness-failed'
  if (metadata.timed_out)
    return 'model-failed'
  return 'eligible'
}

function sanitizeRun(planCase, arm, repetition, metadata, final, behavior) {
  const route = scoreRoute(behavior.holdout, metadata)
  const dimensions = {
    task_result: { status: metadata.product_result === 'passed' ? 'passed' : 'failed' },
    compliance: { status: metadata.result === 'passed' ? 'passed' : 'failed' },
    boundary: { status: metadata.composition?.stable && (metadata.worktree?.unauthorized_paths ?? []).length === 0 ? 'passed' : 'failed' },
    behavior: scoreBehaviorContract(behavior.holdout, metadata, final),
    structured_route: route,
  }
  const hardPassed = Object.values(dimensions).every(dimension => ['passed', 'not-applicable'].includes(dimension.status))
  const measurements = metadata.observability?.measurements ?? {}
  return {
    case: planCase.id,
    holdout: planCase.holdout,
    arm,
    repetition,
    classification: classifyReleaseBehaviorExecution(metadata, final),
    outcome: hardPassed ? 'passed' : 'failed',
    compositionSha256: arm === 'baseline' ? planCase.identities.baselineCompositionSha256 : planCase.identities.candidateCompositionSha256,
    contractSha256: metadata.contract_sha256,
    finalSha256: metadata.final_hash,
    dimensions,
    diagnostics: {
      elapsedMs: metadata.duration_ms ?? null,
      toolCalls: measurements.tool_calls ?? metadata.events?.tool_calls ?? null,
      tokens: measurements.tokens ?? metadata.events?.usage ?? null,
    },
  }
}

function failedRun(planCase, arm, repetition) {
  return {
    case: planCase.id,
    holdout: planCase.holdout,
    arm,
    repetition,
    classification: 'harness-failed',
    outcome: 'failed',
    compositionSha256: arm === 'baseline' ? planCase.identities.baselineCompositionSha256 : planCase.identities.candidateCompositionSha256,
    contractSha256: planCase.identities.contractSha256,
    dimensions: { harness: { status: 'failed', evidence: 'harness execution failed; inspect local raw diagnostics' } },
    diagnostics: { elapsedMs: null, toolCalls: null, tokens: null },
  }
}

export async function executeReleaseBehaviorCases({ plan, runArm }) {
  const scenarios = []
  let stopped = null
  for (const planCase of plan.cases) {
    const runs = []
    for (let repetition = 1; repetition <= planCase.baselineRepetitions; repetition += 1) {
      const run = await runArm({ arm: 'baseline', planCase, repetition })
      runs.push(run)
      if (run.classification === 'harness-failed') {
        stopped = { case: planCase.id, arm: 'baseline', reason: 'harness-failed' }
        break
      }
    }
    if (!stopped) {
      for (let repetition = 1; repetition <= planCase.candidateRepetitions; repetition += 1) {
        const run = await runArm({ arm: 'candidate', planCase, repetition })
        runs.push(run)
        if (run.classification !== 'eligible' || run.outcome !== 'passed') {
          stopped = { case: planCase.id, arm: 'candidate', reason: run.classification === 'eligible' ? 'hard-dimension-failed' : run.classification }
          break
        }
      }
    }
    scenarios.push({ ...planCase, runs })
    if (stopped)
      break
  }
  const complete = scenarios.length === plan.cases.length
    && scenarios.every(scenario => scenario.runs.filter(run => run.arm === 'candidate' && run.outcome === 'passed').length === scenario.candidateRepetitions)
  return { scenarios, stopped, verdict: complete ? 'passed' : 'failed' }
}

function createRunDirectory(outputRoot, plan) {
  const stamp = new Date().toISOString().replace(/[-:.]/gu, '').replace('Z', 'Z')
  const suffix = plan.cases.length === 1 ? plan.cases[0].id : 'campaign'
  const path = join(outputRoot, `${stamp}-${suffix}-${plan.candidate.fingerprintSha256.slice(0, 12)}`)
  mkdirSync(path, { recursive: false })
  return path
}

export function renderReleaseBehaviorMarkdown(report) {
  const lines = [
    '# Release behavior acceptance',
    '',
    `- Verdict: ${report.verdict}`,
    `- Evidence: ${report.evidenceMode}`,
    `- Baseline: ${report.plan.baseline.ref}`,
    `- Candidate runs: ${report.plan.counts.candidateRuns}`,
    `- Baseline calibration runs: ${report.plan.counts.baselineRuns}`,
    `- Model identity: ${report.plan.settings.model} / ${report.plan.settings.effort} / ${report.plan.settings.provider}`,
    '- Efficiency: diagnostic only; no token, time, or tool-call threshold affects the verdict.',
    '',
    '## Scenarios',
    '',
    ...report.scenarios.flatMap(scenario => [
      `- ${scenario.id}: ${scenario.runs.filter(run => run.arm === 'candidate' && run.outcome === 'passed').length}/${scenario.candidateRepetitions} candidate runs passed; ${scenario.runs.filter(run => run.arm === 'baseline').length}/${scenario.baselineRepetitions} baseline calibrations observed.`,
    ]),
    '',
    'This report grants no commit, archive, push, tag, publication, release approval, or human acceptance authority.',
    '',
  ]
  return lines.join('\n')
}

export async function runReleaseBehaviorAcceptance({
  authFile,
  baselineRef,
  caseId,
  effort,
  isolatedUserContext = false,
  model,
  modelCatalogJson,
  openaiBaseUrl,
  outputRoot = join(root, '.cache', 'release-behavior-acceptance'),
  provider,
  timeoutMs = 600000,
  evaluationRunner = runManagedControllerEvaluation,
} = {}) {
  if (!model || !effort || !provider)
    fail('provider execution requires explicit model, effort, and provider')
  const plan = buildReleaseBehaviorPlan(root, { baselineRef, caseId, effort, model, provider })
  mkdirSync(resolve(outputRoot), { recursive: true })
  const runDirectory = createRunDirectory(resolve(outputRoot), plan)
  const allSkills = [...new Set(plan.cases.flatMap(entry => entry.installedSkills))].sort()
  const baselineSnapshot = join(runDirectory, '.baseline-source')
  const baselineSkills = extractGitSkills(root, plan.baseline.commit, allSkills, baselineSnapshot)
  let result
  try {
    result = await executeReleaseBehaviorCases({
      plan,
      runArm: async ({ arm, planCase, repetition }) => {
        const behavior = { holdout: readHoldout(root, planCase.holdout) }
        try {
          const metadata = await evaluationRunner({
            authFile,
            caseId: planCase.holdout,
            comparisonArm: arm,
            effort,
            isolatedUserContext,
            model,
            modelCatalogJson,
            openaiBaseUrl,
            outputRoot: join(runDirectory, 'raw', planCase.id, `${arm}-${repetition}`),
            provider,
            root,
            skillSourceDirectory: arm === 'baseline' ? baselineSkills : join(root, 'skills'),
            timeoutMs,
            variant: arm === 'baseline' ? 'candidate' : 'product',
          })
          const final = metadata.paths?.final && existsSync(metadata.paths.final) ? readFileSync(metadata.paths.final, 'utf8') : ''
          return sanitizeRun(planCase, arm, repetition, metadata, final, behavior)
        }
        catch {
          return failedRun(planCase, arm, repetition)
        }
      },
    })
  }
  finally {
    rmSync(baselineSnapshot, { force: true, recursive: true })
  }
  const report = { schemaVersion: 1, evidenceMode: 'fresh-provider', sanitized: true, verdict: result.verdict, stopped: result.stopped, plan, scenarios: result.scenarios }
  const jsonPath = join(runDirectory, 'report.json')
  const markdownPath = join(runDirectory, 'report.md')
  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`)
  writeFileSync(markdownPath, renderReleaseBehaviorMarkdown(report))
  return { jsonPath, markdownPath, report }
}

function parseCli(flags) {
  return {
    authFile: readManagedControllerFlag(flags, '--auth-file'),
    baselineRef: readManagedControllerFlag(flags, '--baseline-ref'),
    caseId: readManagedControllerFlag(flags, '--case'),
    effort: readManagedControllerFlag(flags, '--effort'),
    isolatedUserContext: flags.includes('--isolated-user-context'),
    json: flags.includes('--json'),
    model: readManagedControllerFlag(flags, '--model'),
    modelCatalogJson: readManagedControllerFlag(flags, '--model-catalog-json'),
    openaiBaseUrl: readManagedControllerFlag(flags, '--openai-base-url'),
    outputRoot: readManagedControllerFlag(flags, '--output-root'),
    plan: flags.includes('--plan'),
    provider: readManagedControllerFlag(flags, '--provider'),
    timeoutMs: readManagedControllerFlag(flags, '--timeout-ms') ? Number(readManagedControllerFlag(flags, '--timeout-ms')) : undefined,
  }
}

async function main() {
  try {
    const options = parseCli(process.argv.slice(2))
    if (!options.baselineRef)
      fail('--baseline-ref is required')
    if (options.plan) {
      const plan = buildReleaseBehaviorPlan(root, options)
      console.log(options.json ? JSON.stringify(plan, null, 2) : renderReleaseBehaviorMarkdown({ verdict: 'planned', evidenceMode: 'plan-only', plan, scenarios: plan.cases.map(entry => ({ ...entry, runs: [] })) }))
      return
    }
    const result = await runReleaseBehaviorAcceptance(options)
    console.log(options.json ? JSON.stringify({ report: result.jsonPath, verdict: result.report.verdict }, null, 2) : `Release behavior acceptance ${result.report.verdict}: ${result.markdownPath}`)
    if (result.report.verdict !== 'passed')
      process.exitCode = 1
  }
  catch (error) {
    console.error(`Release behavior acceptance failed: ${error.message}`)
    process.exitCode = 1
  }
}

if (process.argv[1] && resolve(process.argv[1]) === scriptPath)
  await main()
