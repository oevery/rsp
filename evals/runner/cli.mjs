#!/usr/bin/env node
import { readFileSync } from 'node:fs'
import { basename, dirname, join, resolve } from 'node:path'
import process from 'node:process'
import { createOpenCodexAdapter } from '../adapters/opencodex.mjs'
import { loadTaskOracle } from '../graders/task-result.mjs'
import { loadCalibration, scoreCalibration } from './calibration.mjs'
import { applyReviews, reviewCampaign, runCampaign } from './campaign.mjs'
import { discoverCases, loadCase } from './cases.mjs'
import { compareCase, summarizeEvaluation } from './compare.mjs'
import { runCase } from './execute.mjs'
import { writeJson } from './files.mjs'
import { loadHoldout } from './holdout.mjs'
import { replayRun, revalidateCampaign } from './replay.mjs'
import { reviewBatch } from './review-batch.mjs'
import { reviewPacket } from './review.mjs'
import { readReleaseSuite } from './suite.mjs'

const root = process.cwd()
const valued = new Set(['case', 'role', 'model', 'effort', 'config-file', 'auth-file', 'codex-bin', 'baseline-skills', 'candidate-skills', 'repetitions', 'timeout-ms', 'holdout-registry', 'holdout-root', 'report', 'decisions', 'seed', 'packet', 'output-root', 'resume', 'max-sessions', 'max-tokens'])
function parse(args) {
  const options = {}
  for (let index = 0; index < args.length; index++) {
    if (args[index] === '--')
      continue
    const key = args[index].replace(/^--/u, '')
    if (key === 'allow-live' || key === 'require-worker') {
      options[key] = true
    }
    else if (args[index].startsWith('--') && valued.has(key) && args[index + 1] && !args[index + 1].startsWith('--')) {
      options[key] = args[++index]
    }
    else {
      throw new Error(`Unknown or incomplete option: ${args[index]}`)
    }
  }
  return options
}
function print(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`)
}
function positive(value, fallback) {
  const number = value === undefined ? fallback : Number(value)
  if (!Number.isInteger(number) || number <= 0)
    throw new Error('Expected a positive integer')
  return number
}
async function main(args) {
  const command = args.shift() ?? 'list'
  const options = parse(args)
  if (options['require-worker'] && !['run', 'compare', 'campaign', 'preflight'].includes(command))
    throw new Error('Required-worker mode applies only to execution/preflight')
  if (options['require-worker']) {
    print({ status: 'unavailable', reason: 'required-worker dispatch is unproven by the single-turn runner', providerInvocations: 0, requiredWorkerAvailable: 'unknown' })
    process.exitCode = 1
    return
  }
  if (command === 'preflight') {
    if (options['allow-live'])
      throw new Error('Preflight is offline')
    const adapter = createOpenCodexAdapter({ role: options.role ?? 'implementer', model: options.model, effort: options.effort, configFile: options['config-file'], authFile: options['auth-file'], codexBin: options['codex-bin'] })
    const result = adapter.preflight()
    print(result)
    process.exitCode = result.status === 'passed' ? 0 : 1
    return
  }
  if (command === 'list') {
    print(discoverCases(root).map(entry => ({ id: entry.id, kind: entry.manifest.kind, skill: entry.manifest.skill })))
    return
  }
  if (command === 'plan') {
    const entries = options.case ? options.case.split(',').map(id => loadCase(root, id)) : discoverCases(root)
    const repetitions = positive(options.repetitions, 2)
    print({ cases: entries.map(entry => ({ ...entry.manifest, inputHash: entry.inputHash })), repetitions, plannedSessions: entries.length * repetitions * 2, maxSessions: options['max-sessions'] === undefined ? null : positive(options['max-sessions']), maxTokens: options['max-tokens'] === undefined ? null : positive(options['max-tokens']), execution: 'not-run', providerInvocations: 0 })
    return
  }
  if (command === 'check') {
    const entries = options.case ? [loadCase(root, options.case)] : discoverCases(root)
    const checks = []
    for (const entry of entries) {
      const oracle = await loadTaskOracle(entry)
      checks.push({ id: entry.id, ...(await oracle.check({ case: entry.manifest, directory: entry.directory, root })) })
    }
    const suite = readReleaseSuite(root)
    const available = new Set(discoverCases(root).map(entry => entry.id))
    const missingRequiredCases = (suite?.publicCases ?? []).filter(id => !available.has(id))
    const passed = checks.length > 0 && checks.every(check => check.status === 'passed') && missingRequiredCases.length === 0
    print({ mode: 'schema-and-oracle-check', status: passed ? 'passed' : 'failed', cases: checks, missingRequiredCases, behavioralAcceptance: 'not-run' })
    process.exitCode = passed ? 0 : 1
    return
  }
  if (command === 'review') {
    if (!options.report || !options.decisions)
      throw new Error('Review requires --report and --decisions')
    const result = reviewCampaign(resolve(options.report), resolve(options.decisions))
    print(result)
    process.exitCode = result.summary.status === 'passed' ? 0 : 1
    return
  }
  if (command === 'replay' || command === 'revalidate') {
    if (!options.report)
      throw new Error('Replay requires --report pointing to a run.json')
    if (Boolean(options['holdout-registry']) !== Boolean(options['holdout-root']))
      throw new Error('Private replay requires both holdout inputs')
    const entries = options['holdout-registry'] ? [...discoverCases(root), ...loadHoldout(root, resolve(options['holdout-registry']), resolve(options['holdout-root']))] : undefined
    const result = command === 'replay' ? await replayRun(resolve(options.report), root, entries) : await revalidateCampaign(resolve(options.report), root, entries)
    print(result)
    process.exitCode = (result.verdict?.status === 'passed' || result.results?.every(r => r.verdict.status === 'passed')) ? 0 : 1
    return
  }
  if (command === 'calibration-plan') {
    const suite = loadCalibration(root)
    print({ suiteHash: suite.suiteHash, cases: suite.cases.map(c => ({ id: c.id, expected: c.expected })), providerInvocations: 0 })
    return
  }
  if (command === 'review-batch' || command === 'calibrate') {
    if (!options['allow-live'] || !options['max-sessions'])
      throw new Error('Batch review requires --allow-live and --max-sessions')
    const campaign = command === 'review-batch' && options.report ? JSON.parse(readFileSync(resolve(options.report), 'utf8')) : null
    const calibration = command === 'calibrate' ? loadCalibration(root) : null
    if (!campaign && !calibration)
      throw new Error('Review batch requires --report')
    const packets = calibration ? calibration.cases.map(c => c.packet) : campaign.comparisons.flatMap(c => c.runs.map(r => r.packet))
    if (packets.some(p => !p))
      throw new Error('Campaign has missing review packets')
    const result = await reviewBatch(packets, {
      adapter: createOpenCodexAdapter({ role: 'reviewer', model: options.model, effort: options.effort, configFile: options['config-file'], authFile: options['auth-file'], codexBin: options['codex-bin'] }),
      outputRoot: resolve(options['output-root'] ?? join(root, 'evals/reports')),
      resume: options.resume && resolve(options.resume),
      initialDecisions: options.decisions ? JSON.parse(readFileSync(resolve(options.decisions), 'utf8')) : [],
      maxSessions: positive(options['max-sessions']),
      maxTokens: options['max-tokens'] === undefined ? undefined : positive(options['max-tokens']),
      timeoutMs: positive(options['timeout-ms'], 180000),
    })
    const decisions = JSON.parse(readFileSync(join(dirname(result.reportPath), 'decisions.json'), 'utf8'))
    let scored
    let reviewedPath
    if (calibration) {
      scored = scoreCalibration(calibration, decisions)
      writeJson(join(dirname(result.reportPath), 'calibration.json'), scored)
    }
    else if (result.complete) {
      reviewedPath = `${resolve(options.report)}.${basename(dirname(result.reportPath))}.reviewed.json`
      writeJson(reviewedPath, applyReviews(campaign, decisions))
    }
    print({ report: result.reportPath, complete: result.complete, status: scored?.status ?? result.status, usage: result.usage, stopReason: result.stopReason, reviewedPath, calibration: scored })
    process.exitCode = (scored?.status ?? result.status) === 'passed' ? 0 : 1
    return
  }
  if (command === 'review-live') {
    if (!options['allow-live'] || !options.packet)
      throw new Error('Live review requires --allow-live and --packet')
    const result = await reviewPacket(JSON.parse(readFileSync(resolve(options.packet), 'utf8')), {
      adapter: createOpenCodexAdapter({ role: 'reviewer', model: options.model, effort: options.effort, configFile: options['config-file'], authFile: options['auth-file'], codexBin: options['codex-bin'] }),
      outputRoot: resolve(options['output-root'] ?? join(root, 'evals/reports')),
      timeoutMs: positive(options['timeout-ms'], 180000),
    })
    print({ report: result.reportPath, status: result.status, category: result.category, attempts: result.attempts.length })
    process.exitCode = result.status === 'passed' ? 0 : 1
    return
  }
  if (!['run', 'compare', 'campaign'].includes(command))
    throw new Error('Expected list, plan, check, preflight, run, compare, campaign, review, review-live or replay')
  if (!options['allow-live'])
    throw new Error('External execution requires explicit --allow-live')
  if (command === 'campaign' && !options['max-sessions'])
    throw new Error('Campaign requires an explicit --max-sessions budget')
  if (command !== 'campaign' && (options.resume || options['max-sessions'] || options['max-tokens']))
    throw new Error('Use campaign for bounded or resumable paired execution')
  if (command !== 'run' && !options['baseline-skills'])
    throw new Error('Specify --baseline-skills <directory|none> explicitly')
  if (Boolean(options['holdout-registry']) !== Boolean(options['holdout-root']))
    throw new Error('Holdout requires both registry and private root')
  const resumed = options.resume ? JSON.parse(readFileSync(resolve(options.resume), 'utf8')) : null
  const selectedIds = options.case ? options.case.split(',') : resumed?.plan.cases.filter(c => c.visibility === 'public').map(c => c.id)
  const entries = selectedIds ? selectedIds.map(id => loadCase(root, id)) : discoverCases(root)
  if (options['holdout-registry'])
    entries.push(...loadHoldout(root, resolve(options['holdout-registry']), resolve(options['holdout-root'])))
  const execution = {
    adapter: createOpenCodexAdapter({ role: options.role ?? 'implementer', model: options.model, effort: options.effort, configFile: options['config-file'], authFile: options['auth-file'], codexBin: options['codex-bin'] }),
    candidateComposition: resolve(options['candidate-skills'] ?? join(root, 'skills')),
    baselineComposition: !options['baseline-skills'] || options['baseline-skills'] === 'none' ? null : resolve(options['baseline-skills']),
    repetitions: positive(options.repetitions, resumed?.plan.repetitions ?? 2),
    seed: options.seed,
    timeoutMs: positive(options['timeout-ms'], resumed?.plan.timeoutMs ?? 600000),
    resume: options.resume && resolve(options.resume),
    outputRoot: options['output-root'] && resolve(options['output-root']),
    maxSessions: options['max-sessions'] === undefined ? undefined : positive(options['max-sessions']),
    maxTokens: options['max-tokens'] === undefined ? undefined : positive(options['max-tokens']),
  }
  if (command === 'campaign') {
    const result = await runCampaign(entries, root, execution)
    print({ report: result.reportPath, summary: result.summary, complete: result.complete })
    process.exitCode = result.summary.status === 'passed' ? 0 : 1
  }
  else {
    if (!options.case || entries.length !== 1)
      throw new Error('Run/compare requires exactly one public --case')
    const result = command === 'run'
      ? await runCase(entries[0], root, { ...execution, composition: execution.candidateComposition })
      : await compareCase(entries[0], root, execution)
    const summary = command === 'run' ? summarizeEvaluation([{ ...result, arm: 'candidate' }]) : result.summary
    print({ ...result, summary })
    process.exitCode = summary.status === 'passed' ? 0 : 1
  }
}
main(process.argv.slice(2)).catch((error) => {
  process.stderr.write(error.code === 'EEXIST'
    ? 'Evaluation output or lock already exists. Preserve the retained evidence; refusing to overwrite.\n'
    : 'Evaluation failed. Check command options, explicit live permission and local input files.\n')
  process.exitCode = 2
})
