#!/usr/bin/env node

import { createHash } from 'node:crypto'
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  realpathSync,
  writeFileSync,
} from 'node:fs'
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { parse as parseYaml } from 'yaml'
import {
  evaluateManagedController,
  hashManagedControllerComposition,
  readManagedControllerFlag,
  runManagedControllerEvaluation,
} from './managed-controller-eval.mjs'
import { projectSkillEvaluationObservability } from './skill-evaluation-observability.mjs'

const root = resolve(fileURLToPath(new URL('..', import.meta.url)))

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

function isSameOrInside(parent, candidate) {
  const path = relative(parent, candidate)
  return path === ''
    || (path !== '..' && !path.startsWith(`..${sep}`) && !isAbsolute(path))
}

function resolveLockedProjectFile(projectRoot, path, label) {
  if (typeof path !== 'string' || path.length === 0 || isAbsolute(path))
    throw new Error(`${label} must be a project-relative path`)
  const absoluteProjectRoot = resolve(projectRoot)
  const absolutePath = resolve(absoluteProjectRoot, path)
  const projectRelativePath = relative(absoluteProjectRoot, absolutePath)
  if (projectRelativePath === '..'
    || projectRelativePath.startsWith(`..${sep}`)
    || isAbsolute(projectRelativePath)) {
    throw new Error(`${label} escapes the project root`)
  }
  if (!existsSync(absolutePath))
    throw new Error(`${label} is missing: ${path}`)
  const file = lstatSync(absolutePath)
  if (file.isSymbolicLink() || !file.isFile())
    throw new Error(`${label} must be a regular non-symlink file`)
  const realProjectRoot = realpathSync(absoluteProjectRoot)
  const realPath = realpathSync(absolutePath)
  if (!isSameOrInside(realProjectRoot, realPath))
    throw new Error(`${label} resolves outside the real project root`)
  return realPath
}

function nearestExistingAncestor(path) {
  let current = path
  while (!existsSync(current)) {
    const parent = dirname(current)
    if (parent === current)
      throw new Error(`beta output has no existing ancestor: ${path}`)
    current = parent
  }
  return current
}

function canonicalizeOutputDirectory(outputRoot, retainedDirectories) {
  const absoluteOutput = resolve(outputRoot)
  const existingAncestor = nearestExistingAncestor(absoluteOutput)
  const realAncestor = realpathSync(existingAncestor)
  const realCandidate = resolve(realAncestor, relative(existingAncestor, absoluteOutput))
  const conflictsWithRetained = path => retainedDirectories.some(
    retainedDirectory => isSameOrInside(retainedDirectory, path),
  )
  if (conflictsWithRetained(realCandidate))
    throw new Error('beta output resolves inside prior retained evidence generation')
  mkdirSync(realCandidate, { recursive: true })
  const output = lstatSync(realCandidate)
  if (output.isSymbolicLink() || !output.isDirectory())
    throw new Error('beta output must resolve to a regular directory')
  const realOutput = realpathSync(realCandidate)
  if (conflictsWithRetained(realOutput))
    throw new Error('beta output resolves inside prior retained evidence generation')
  return realOutput
}

function validatePriorRetainedEvidence(projectRoot, entries) {
  if (!Array.isArray(entries) || entries.length !== 2)
    throw new Error('beta prior_retained_evidence must lock report.md and summary.json')
  const paths = new Set()
  const basenames = new Set()
  const evidence = entries.map((entry, index) => {
    if (!entry || typeof entry.path !== 'string' || !/^[a-f0-9]{64}$/.test(entry.sha256))
      throw new Error(`beta prior_retained_evidence[${index}] is invalid`)
    if (paths.has(entry.path))
      throw new Error(`beta prior retained evidence path is duplicated: ${entry.path}`)
    paths.add(entry.path)
    basenames.add(basename(entry.path))
    const absolutePath = resolveLockedProjectFile(
      projectRoot,
      entry.path,
      `beta prior retained evidence ${entry.path}`,
    )
    const hash = hashContent(readFileSync(absolutePath))
    if (hash !== entry.sha256)
      throw new Error(`beta prior retained evidence drifted: ${entry.path} (${hash})`)
    return { path: entry.path, sha256: hash }
  })
  if (JSON.stringify([...basenames].sort()) !== JSON.stringify(['report.md', 'summary.json']))
    throw new Error('beta prior_retained_evidence must lock report.md and summary.json')
  return evidence
}

export function loadManagedControllerBetaPlan(projectRoot = root) {
  const path = join(projectRoot, 'test', 'managed-controller', 'beta', 'manage-orchestration-beta.yaml')
  const plan = parseYaml(readFileSync(path, 'utf8'))
  if (!plan || plan.id !== 'manage-orchestration-beta' || typeof plan.case !== 'string')
    throw new Error('invalid managed-controller beta plan')
  if (JSON.stringify(plan.variants) !== JSON.stringify(['baseline', 'product']))
    throw new Error('beta variants must be baseline then product')
  for (const field of ['observations', 'conclusion_limits']) {
    if (!Array.isArray(plan[field]) || plan[field].length === 0 || plan[field].some(item => typeof item !== 'string'))
      throw new Error(`beta ${field} must be a non-empty string array`)
  }
  const caseDirectory = join(projectRoot, 'test', 'managed-controller', 'holdout', plan.case)
  const manifestPath = join(caseDirectory, 'case.yaml')
  const baseDirectory = join(caseDirectory, 'base')
  if (!existsSync(manifestPath) || !existsSync(baseDirectory))
    throw new Error(`beta holdout ${plan.case} is incomplete`)
  const manifest = parseYaml(readFileSync(manifestPath, 'utf8'))
  const installedSkills = manifest?.installed_skills ?? ['rsp-manage']
  if (!Array.isArray(plan.product_skill_names)
    || plan.product_skill_names.length === 0
    || plan.product_skill_names.some(name => typeof name !== 'string')
    || new Set(plan.product_skill_names).size !== plan.product_skill_names.length) {
    throw new Error('beta product_skill_names must be a non-empty unique string array')
  }
  if (JSON.stringify(plan.product_skill_names) !== JSON.stringify(installedSkills))
    throw new Error('beta product_skill_names must exactly match holdout installed_skills')
  const productComposition = hashManagedControllerComposition(
    plan.product_skill_names.map(name => ({
      name,
      path: join(projectRoot, 'skills', name),
    })),
  )
  if (productComposition.hash !== plan.product_composition_sha256)
    throw new Error(`beta product composition drifted: ${productComposition.hash}`)
  const manifestHash = hashContent(readFileSync(manifestPath))
  const baseTreeHash = hashTree(baseDirectory)
  if (manifestHash !== plan.holdout_manifest_sha256)
    throw new Error(`beta holdout manifest drifted: ${manifestHash}`)
  if (baseTreeHash !== plan.base_tree_sha256)
    throw new Error(`beta holdout base drifted: ${baseTreeHash}`)
  const priorRetainedEvidence = validatePriorRetainedEvidence(
    projectRoot,
    plan.prior_retained_evidence,
  )
  return {
    ...plan,
    base_tree_sha256: baseTreeHash,
    holdout_manifest_sha256: manifestHash,
    path,
    prior_retained_evidence: priorRetainedEvidence,
    product_composition: productComposition,
    product_composition_sha256: productComposition.hash,
  }
}

export function assertManagedControllerBetaOutputBoundary(plan, outputRoot, projectRoot = root) {
  const retainedDirectories = [...new Set(plan.prior_retained_evidence.map((evidence) => {
    const retainedPath = resolveLockedProjectFile(
      projectRoot,
      evidence.path,
      `beta prior retained evidence ${evidence.path}`,
    )
    return dirname(retainedPath)
  }))]
  return canonicalizeOutputDirectory(outputRoot, retainedDirectories)
}

function countAgentVerificationRounds(eventsPath, command) {
  if (!eventsPath || !existsSync(eventsPath))
    return null
  const needle = command.join(' ')
  let count = 0
  for (const line of readFileSync(eventsPath, 'utf8').split('\n').filter(Boolean)) {
    try {
      const event = JSON.parse(line)
      if (event.type === 'item.completed'
        && event.item?.type === 'command_execution'
        && typeof event.item.command === 'string'
        && event.item.command.includes(needle)) {
        count += 1
      }
    }
    catch {}
  }
  return count
}

function hasUnavailableCapabilityError(eventsPath) {
  if (!eventsPath || !existsSync(eventsPath))
    return false
  const unavailablePattern = /usage limit|rate limit|quota|model .* unavailable/iu
  for (const line of readFileSync(eventsPath, 'utf8').split('\n').filter(Boolean)) {
    try {
      const event = JSON.parse(line)
      const message = event.type === 'turn.failed'
        ? event.error?.message
        : event.type === 'item.completed' && event.item?.type === 'error'
          ? event.item.message
          : null
      if (typeof message === 'string' && unavailablePattern.test(message))
        return true
    }
    catch {}
  }
  return false
}

export function summarizeManagedControllerBetaRun(plan, metadata, final) {
  const verificationCommand = ['npm', 'test']
  const agentVerificationRounds = countAgentVerificationRounds(metadata.paths?.events, verificationCommand)
  const capabilityUnavailable = hasUnavailableCapabilityError(metadata.paths?.events)
  const receiverBoundary = /\breceiver\b/iu.test(final)
    && !/receiver-device acceptance passed/iu.test(final)
  const outcome = capabilityUnavailable ? 'unavailable' : metadata.result
  const observability = projectSkillEvaluationObservability({
    corrections: metadata.corrections,
    elapsedMs: metadata.duration_ms,
    outcome,
    outputContract: metadata.output,
    toolCalls: metadata.events?.tool_calls,
    unauthorizedPaths: metadata.worktree?.unauthorized_paths,
    usage: metadata.events?.usage,
  })
  return {
    variant: metadata.variant,
    outcome,
    completion: capabilityUnavailable
      ? 'not-observed'
      : metadata.result === 'passed' ? 'contract-passed' : 'contract-failed',
    first_fix_result: null,
    worker_dispatch_count: null,
    tool_calls: metadata.events?.tool_calls ?? null,
    verification_rounds: {
      agent_observed: agentVerificationRounds,
      harness: 1,
      harness_passed: metadata.verification?.passed ?? false,
    },
    elapsed_ms: metadata.duration_ms ?? null,
    human_intervention_outcome: receiverBoundary ? 'required-after-automated-work' : 'not-observed',
    omissions: [
      'first-fix result is not emitted as a structured event',
      'worker dispatches are not distinguishable from aggregate tool calls',
      ...(agentVerificationRounds === null ? ['agent verification rounds are unavailable'] : []),
      ...(capabilityUnavailable ? ['model execution capability is unavailable'] : []),
      ...(final ? [] : ['final response was not produced']),
    ],
    output_contract: metadata.output,
    recovery_contract: metadata.recovery ?? null,
    unauthorized_paths: metadata.worktree?.unauthorized_paths ?? [],
    observability,
  }
}

export function summarizeManagedControllerBetaComparison(runs) {
  const incompleteRun = runs.find(run => ['unavailable', 'not-run'].includes(run.outcome))
  return incompleteRun
    ? {
        status: 'incomplete',
        reason: incompleteRun.outcome === 'not-run'
          ? `${incompleteRun.variant} was not run`
          : `${incompleteRun.variant} was unavailable`,
      }
    : {
        status: 'complete',
        reason: null,
      }
}

export function createManagedControllerBetaSummary(plan, deterministic, runs) {
  return {
    id: plan.id,
    case: plan.case,
    plan_hash: hashContent(readFileSync(plan.path)),
    holdout_manifest_sha256: plan.holdout_manifest_sha256,
    base_tree_sha256: plan.base_tree_sha256,
    product_composition: plan.product_composition,
    deterministic_contracts: {
      passed: deterministic.every(item => item.passed),
      cases: deterministic.length,
    },
    runs,
    comparison: summarizeManagedControllerBetaComparison(runs),
    conclusion_limits: plan.conclusion_limits,
  }
}

export async function runManagedControllerBeta({
  authFile,
  effort,
  isolatedUserContext = false,
  model,
  modelCatalogJson,
  openaiBaseUrl,
  outputRoot,
  provider,
  timeoutMs = 300000,
} = {}) {
  const plan = loadManagedControllerBetaPlan(root)
  const planHash = hashContent(readFileSync(plan.path))
  const safeOutputRoot = assertManagedControllerBetaOutputBoundary(plan, outputRoot, root)
  const deterministic = evaluateManagedController(root)
  if (!deterministic.every(item => item.passed))
    throw new Error('deterministic managed-controller contracts failed; beta holdout was not run')
  const rawRoot = join(safeOutputRoot, 'raw')
  const runs = []
  for (const variant of plan.variants) {
    const metadata = await runManagedControllerEvaluation({
      authFile,
      caseId: plan.case,
      effort,
      isolatedUserContext,
      model,
      modelCatalogJson,
      openaiBaseUrl,
      outputRoot: rawRoot,
      provider,
      root,
      timeoutMs,
      variant,
    })
    const final = existsSync(metadata.paths.final) ? readFileSync(metadata.paths.final, 'utf8') : ''
    const run = summarizeManagedControllerBetaRun(plan, metadata, final)
    runs.push(run)
    if (run.outcome === 'unavailable') {
      for (const pendingVariant of plan.variants.slice(runs.length)) {
        runs.push({
          variant: pendingVariant,
          outcome: 'not-run',
          completion: 'not-observed',
          first_fix_result: null,
          worker_dispatch_count: null,
          tool_calls: null,
          verification_rounds: {
            agent_observed: null,
            harness: 0,
            harness_passed: false,
          },
          elapsed_ms: null,
          human_intervention_outcome: 'not-observed',
          omissions: ['shared model execution capability was unavailable in the preceding run'],
          output_contract: null,
          recovery_contract: null,
          unauthorized_paths: [],
          observability: projectSkillEvaluationObservability({ outcome: 'not-run' }),
        })
      }
      break
    }
  }
  const refreshedPlan = loadManagedControllerBetaPlan(root)
  if (hashContent(readFileSync(refreshedPlan.path)) !== planHash)
    throw new Error('beta plan drifted during evaluation')
  const summary = createManagedControllerBetaSummary(plan, deterministic, runs)
  const summaryPath = join(safeOutputRoot, 'summary.json')
  writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`)
  return { summary, summaryPath }
}

async function main() {
  const [command, ...flags] = process.argv.slice(2)
  if (command === 'contract') {
    console.log(JSON.stringify(loadManagedControllerBetaPlan(root), null, 2))
    return
  }
  if (command === 'run') {
    const authFile = readManagedControllerFlag(flags, '--auth-file')
    const model = readManagedControllerFlag(flags, '--model')
    const effort = readManagedControllerFlag(flags, '--effort')
    const isolatedUserContext = flags.includes('--isolated-user-context')
    const modelCatalogJson = readManagedControllerFlag(flags, '--model-catalog-json')
    const openaiBaseUrl = readManagedControllerFlag(flags, '--openai-base-url')
    const provider = readManagedControllerFlag(flags, '--provider')
    const outputRoot = resolve(readManagedControllerFlag(flags, '--output-root')
      ?? join(root, '.cache', 'rsp-manage-beta-2026-08-04'))
    const timeoutMs = Number(readManagedControllerFlag(flags, '--timeout-ms') ?? 300000)
    if (!model || !effort)
      throw new Error('--model and --effort are required')
    const result = await runManagedControllerBeta({
      authFile,
      effort,
      isolatedUserContext,
      model,
      modelCatalogJson,
      openaiBaseUrl,
      outputRoot,
      provider,
      timeoutMs,
    })
    console.log(JSON.stringify({
      result: result.summary.runs.some(run => ['unavailable', 'not-run'].includes(run.outcome))
        ? 'unavailable'
        : result.summary.runs.every(run => run.outcome === 'passed') ? 'passed' : 'observed-failure',
      summary_path: result.summaryPath,
    }, null, 2))
    return
  }
  throw new Error(`usage: ${basename(process.argv[1])} contract | run --model <model> --effort <effort> [--provider <id>] [--isolated-user-context --auth-file <path> --openai-base-url <url> --model-catalog-json <path>] [--output-root <path>]`)
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
