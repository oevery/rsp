#!/usr/bin/env node

import { createHash } from 'node:crypto'
import { existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { parseArgs } from 'node:util'
import { parse as parseYaml } from 'yaml'
import { runManagedControllerEvaluation } from '../../scripts/managed-controller-eval.mjs'

const repositoryRoot = fileURLToPath(new URL('../..', import.meta.url))
const layers = { behavior: 'behaviors', workflow: 'workflows' }

function layerRoot(root, kind) {
  if (!Object.hasOwn(layers, kind))
    throw new Error('Choose behavior or workflow')
  return join(root, 'verification', 'evaluations', layers[kind])
}

export function listEvaluationCases(root, kind) {
  return readdirSync(layerRoot(root, kind), { withFileTypes: true })
    .filter(entry => entry.isDirectory() && existsSync(join(layerRoot(root, kind), entry.name, 'case.yaml')))
    .map(entry => entry.name)
    .sort()
}

export function loadEvaluationCase(root, kind, caseId) {
  if (!listEvaluationCases(root, kind).includes(caseId))
    throw new Error(`Unknown ${kind} case: ${caseId}`)
  const directory = join(layerRoot(root, kind), caseId)
  const manifestPath = join(directory, 'case.yaml')
  if (lstatSync(manifestPath).isSymbolicLink())
    throw new Error('Case manifest must not be a symlink')
  const manifest = parseYaml(readFileSync(manifestPath, 'utf8'))
  if (manifest?.id !== caseId || typeof manifest.request !== 'string' || !manifest.request.trim())
    throw new Error(`Invalid case: ${caseId}`)
  const fixture = resolve(directory, manifest.fixture ?? 'base')
  const allowed = realpathSync(join(root, 'verification', 'evaluations'))
  if (!realpathSync(fixture).startsWith(`${allowed}${sep}`) || !lstatSync(fixture).isDirectory())
    throw new Error('Fixture must be a directory inside verification/evaluations')
  return { directory, manifest, fixture }
}

export function planEvaluation(root, kind, caseId) {
  const { directory, manifest, fixture } = loadEvaluationCase(root, kind, caseId)
  return {
    kind,
    case: caseId,
    goal: manifest.goal ?? manifest.request,
    directory: relative(root, directory),
    fixture: relative(root, fixture),
    verification: manifest.verification,
    rubric: manifest.rubric ?? [],
    execution: 'not-run',
    acceptance: 'inconclusive',
  }
}

export function evaluationExitCode(reports) {
  if (reports.some(report => report.acceptance === 'failed'))
    return 1
  return reports.every(report => report.execution === 'completed' && report.acceptance === 'passed') ? 0 : 2
}

export async function executeEvaluation({ root = repositoryRoot, kind, caseId, repetitions = 1, runner = runManagedControllerEvaluation, ...settings }) {
  if (!Number.isInteger(repetitions) || repetitions < 1 || repetitions > 10)
    throw new Error('Repetitions must be between 1 and 10')
  const plan = planEvaluation(root, kind, caseId)
  const harnessHash = createHash('sha256')
  for (const path of [new URL(import.meta.url), new URL('./provider-outcome.mjs', import.meta.url), new URL('../../scripts/managed-controller-eval.mjs', import.meta.url)])
    harnessHash.update(readFileSync(path))
  const artifacts = join(root, 'verification', 'artifacts', 'evaluations')
  mkdirSync(artifacts, { recursive: true })
  const outputRoot = mkdtempSync(join(artifacts, `${kind}-${caseId}-`))
  const reports = []
  for (let repetition = 1; repetition <= repetitions; repetition++) {
    let metadata
    try {
      metadata = await runner({
        ...settings,
        root,
        caseId,
        caseDirectory: resolve(root, plan.directory),
        outputRoot,
        variant: 'product',
        evaluationMode: 'outcome',
      })
    }
    catch {
      // An adapter exception supplies no observed behavior and may contain credentials.
      metadata = { outcome: { execution: 'evidence-insufficient', acceptance: 'inconclusive', warnings: ['Runner returned no observation; inspect local diagnostics before retrying'] } }
    }
    reports.push({
      repetition,
      ...(metadata.outcome ?? { execution: 'evidence-insufficient', acceptance: 'inconclusive', warnings: ['Runner supplied no outcome evidence'] }),
      metadata: metadata.paths?.metadata ? relative(root, metadata.paths.metadata) : null,
    })
    // A failed sample is evidence, not a reason to retry until green.
    if (reports.at(-1).acceptance === 'failed' || reports.at(-1).execution !== 'completed')
      break
  }
  const report = { ...plan, execution: undefined, acceptance: undefined, harness_sha256: harnessHash.digest('hex'), settings: { model: settings.model ?? null, effort: settings.effort ?? null, provider: settings.provider ?? null }, planned: repetitions, executed: reports.length, runs: reports }
  const path = join(outputRoot, 'report.json')
  writeFileSync(path, `${JSON.stringify(report, null, 2)}\n`)
  writeFileSync(join(outputRoot, 'report.md'), [
    '# Provider evaluation',
    '',
    `Case: ${kind}/${caseId}`,
    `Goal: ${plan.goal}`,
    `Samples: ${reports.length}/${repetitions}`,
    '',
    ...reports.flatMap(run => [
      `## Sample ${run.repetition}`,
      '',
      `Execution: ${run.execution}`,
      `Acceptance: ${run.acceptance}`,
      `Evidence: ${run.metadata ?? 'unavailable'}`,
      ...(run.failures ?? []).map(failure => `- Failure: ${failure}`),
      ...(run.warnings ?? []).map(warning => `- ${warning}`),
      '',
    ]),
    ...(plan.rubric.length ? ['## Semantic review required', '', ...plan.rubric.map(criterion => `- ${criterion}`), ''] : []),
    'No release, publication, or human acceptance is implied.',
    '',
  ].join('\n'))
  return { ...report, report: relative(root, path), exitCode: evaluationExitCode(reports) }
}

export async function main(argv = process.argv.slice(2), root = repositoryRoot) {
  const [kind, ...args] = argv
  const { values } = parseArgs({ args: args.filter(arg => arg !== '--'), options: {
    'case': { type: 'string' },
    'list': { type: 'boolean' },
    'plan': { type: 'boolean' },
    'run': { type: 'boolean' },
    'json': { type: 'boolean' },
    'model': { type: 'string' },
    'effort': { type: 'string' },
    'provider': { type: 'string', default: 'config' },
    'timeout-ms': { type: 'string', default: '600000' },
    'repetitions': { type: 'string', default: '1' },
    'codex-bin': { type: 'string', default: 'codex' },
    'auth-file': { type: 'string' },
    'model-catalog-json': { type: 'string' },
    'openai-base-url': { type: 'string' },
  } })
  if (values.run && (values.list || values.plan))
    throw new Error('--run cannot be combined with --list or --plan')
  if (!values.case) {
    if (values.run)
      throw new Error('--run requires one explicit --case')
    return { kind, cases: listEvaluationCases(root, kind), execution: 'not-run' }
  }
  if (!values.run)
    return planEvaluation(root, kind, values.case)
  for (const key of ['model', 'effort', 'auth-file', 'model-catalog-json', 'openai-base-url']) {
    if (!values[key])
      throw new Error(`--run requires --${key} for isolated provider execution`)
  }
  const timeoutMs = Number(values['timeout-ms'])
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 3600000)
    throw new Error('--timeout-ms must be between 1 and 3600000')
  return executeEvaluation({
    root,
    kind,
    caseId: values.case,
    repetitions: Number(values.repetitions),
    model: values.model,
    effort: values.effort,
    provider: values.provider,
    timeoutMs,
    codexBin: values['codex-bin'],
    authFile: values['auth-file'],
    modelCatalogJson: values['model-catalog-json'],
    openaiBaseUrl: values['openai-base-url'],
    isolatedUserContext: true,
  })
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().then((result) => {
    process.stdout.write(`${JSON.stringify(result, null, 2)}\n`)
    process.exitCode = result.exitCode ?? 0
  }).catch((error) => {
    process.stderr.write(`Evaluation could not run: ${error.message}\n`)
    process.exitCode = 2
  })
}
