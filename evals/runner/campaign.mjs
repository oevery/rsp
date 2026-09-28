import { randomUUID } from 'node:crypto'
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { aggregateReviewDecisions } from '../graders/semantic-review.mjs'
import { compositionIdentity } from '../observers/workspace.mjs'
import { budgetStop, withBatchLock } from './batch-state.mjs'
import { summarizeEvaluation } from './compare.mjs'
import { harnessIdentity, runCase, sourceIdentity } from './execute.mjs'
import { hash, treeFiles, writeJson } from './files.mjs'
import { executionIdentity, gradingIdentity } from './identity.mjs'
import { pairedOrder } from './statistics.mjs'
import { readReleaseSuite } from './suite.mjs'

export function summarizeCampaign(report) {
  const runs = report.comparisons.flatMap(comparison => comparison.runs)
  return summarizeEvaluation(runs, { complete: report.complete !== false })
}

export async function runCampaign(entries, root, options) {
  if (!entries.length || new Set(entries.map(entry => entry.id)).size !== entries.length)
    throw new Error('Campaign needs nonempty unique case IDs')
  budgetStop([], options)
  let existing = options.resume ? JSON.parse(readFileSync(options.resume, 'utf8')) : null
  const id = existing?.id ?? randomUUID()
  const directory = existing ? dirname(options.resume) : join(options.outputRoot ?? join(root, 'evals', 'reports'), `campaign-${id}`)
  mkdirSync(directory, { recursive: true, mode: 0o700 })
  const reportPath = join(directory, 'campaign.json')
  return withBatchLock(reportPath, async () => {
    if (options.resume)
      existing = JSON.parse(readFileSync(options.resume, 'utf8'))
    const candidate = compositionIdentity(options.candidateComposition)
    const baseline = compositionIdentity(options.baselineComposition)
    const repetitions = options.repetitions ?? existing?.plan.repetitions ?? 1
    if (!Number.isInteger(repetitions) || repetitions < 1 || repetitions > 100 || candidate.hash === baseline.hash || entries.some(entry => !candidate.skills.includes(entry.manifest.skill)))
      throw new Error('Invalid repetition count or Skill compositions')
    const plan = {
      candidate,
      baseline,
      sourceHash: sourceIdentity(root),
      harnessHash: harnessIdentity(root),
      executionHash: executionIdentity(root),
      gradingHash: gradingIdentity(root),
      executor: options.adapter.settings,
      adapter: options.adapter.id,
      repetitions,
      seed: options.seed ?? existing?.plan.seed ?? id,
      timeoutMs: options.timeoutMs ?? existing?.plan.timeoutMs ?? 600000,
      suiteHash: readReleaseSuite(root)?.hash ?? null,
      cases: entries.map(entry => ({ id: entry.id, skill: entry.manifest.skill, kind: entry.manifest.kind, activation: entry.manifest.activation ?? (entry.manifest.hard.required_skill_read ? 'required' : 'optional'), visibility: entry.visibility, version: entry.version ?? null, hash: entry.inputHash, promptHash: hash(entry.manifest.prompt), provenance: entry.provenance ?? null })),
    }
    if (existing) {
      const { harnessHash: _new, ...current } = plan
      const { harnessHash: _old, ...previous } = existing.plan
      if (hash(existing.plan) !== existing.planHash || hash(current) !== hash(previous))
        throw new Error('Resume identity drift; preserve evidence and start a new campaign')
      if (existing.inFlight || ['execution-failure', 'candidate-failure'].includes(existing.stopReason))
        throw new Error('Unresolved execution or recorded failure; no automatic rerun')
      // Verify every retained run before spending more tokens.
      for (const comparison of existing.comparisons) {
        for (const run of comparison.runs) {
          const { arm: _arm, repetition: _rep, ...saved } = run
          if (!/^[a-f0-9-]{36}$/u.test(run.id) || hash(saved) !== hash(JSON.parse(readFileSync(join(directory, run.id, 'run.json'), 'utf8'))))
            throw new Error('Retained run changed')
        }
      }
    }
    const report = existing ?? { schema: 'rsp-campaign-v1', id, startedAt: new Date().toISOString(), plan, planHash: hash(plan), comparisons: [], complete: false }
    const invocation = []
    const save = () => {
      report.summary = summarizeCampaign(report)
      writeJson(reportPath, report)
      const packets = join(directory, 'review-packets')
      mkdirSync(packets, { recursive: true, mode: 0o700 })
      for (const run of report.comparisons.flatMap(comparison => comparison.runs)) {
        if (run.packet)
          writeJson(join(packets, `${run.packet.id}.json`), run.packet)
      }
      writeFileSync(join(directory, 'summary.md'), `# Evaluation campaign\n\n${JSON.stringify({ complete: report.complete, stopReason: report.stopReason ?? null, cases: report.comparisons.map(c => ({ case: c.case, runs: c.runs.length })), summary: report.summary }, null, 2)}\n`)
    }
    if (report.complete)
      return { reportPath, ...report }
    report.stopReason = null
    save()
    for (const entry of entries) {
      if (hash(treeFiles(entry.directory, { rejectLinks: true })) !== entry.inputHash || executionIdentity(root) !== plan.executionHash || gradingIdentity(root) !== plan.gradingHash || sourceIdentity(root) !== plan.sourceHash)
        throw new Error('Campaign input drift; partial evidence retained')
      let comparison = report.comparisons.find(c => c.case === entry.id)
      if (!comparison) {
        comparison = { case: entry.id, repetitions, scheduling: { order: 'seeded-balanced-pairs', seed: `${plan.seed}:${entry.id}`, concurrency: 1 }, runs: [] }
        report.comparisons.push(comparison)
      }
      const schedule = Array.from({ length: repetitions }, (_, i) => pairedOrder(comparison.scheduling.seed, i + 1).map(arm => ({ arm, repetition: i + 1 }))).flat()
      for (const [index, slot] of schedule.entries()) {
        const previous = comparison.runs[index]
        if (previous) {
          if (previous.arm !== slot.arm || previous.repetition !== slot.repetition)
            throw new Error('Saved schedule mismatch')
          continue
        }
        report.stopReason = budgetStop(invocation, options)
        if (report.stopReason) {
          save()
          return { reportPath, ...report }
        }
        if (compositionIdentity(options.baselineComposition).hash !== plan.baseline.hash || compositionIdentity(options.candidateComposition).hash !== plan.candidate.hash) {
          report.stopReason = 'composition-drift'
          save()
          return { reportPath, ...report }
        }
        report.inFlight = { case: entry.id, ...slot }
        save()
        const run = await runCase(entry, root, { ...options, sourceHash: plan.sourceHash, compositionHash: plan[slot.arm].hash, timeoutMs: plan.timeoutMs, composition: slot.arm === 'candidate' ? options.candidateComposition : options.baselineComposition, arm: slot.arm, outputRoot: directory })
        comparison.runs.push({ ...slot, ...run })
        invocation.push({ usage: run.events?.usage })
        comparison.summary = summarizeEvaluation(comparison.runs, { complete: comparison.runs.length === schedule.length })
        delete report.inFlight
        report.stopReason = run.verdict.status === 'inconclusive' ? 'execution-failure' : slot.arm === 'candidate' && run.verdict.status === 'failed' ? 'candidate-failure' : null
        save()
        if (report.stopReason)
          return { reportPath, ...report }
      }
    }
    report.complete = true
    report.completedAt = new Date().toISOString()
    save()
    return { reportPath, ...report }
  })
}

export function applyReviews(report, decisions) {
  if (report.schema !== 'rsp-campaign-v1' || !Array.isArray(decisions))
    throw new Error('Expected campaign and an array of independent review decisions')
  const copy = structuredClone(report)
  const runs = copy.comparisons.flatMap(comparison => comparison.runs)
  const packets = new Set(runs.filter(run => run.packet).map(run => run.packet.packetHash))
  if (decisions.some(decision => !packets.has(decision.packetHash)))
    throw new Error('Review refers to an unknown packet')
  for (const run of runs) {
    if (!run.packet)
      continue
    run.decisions = decisions.filter(decision => decision.packetHash === run.packet.packetHash)
    run.semantic = aggregateReviewDecisions(run.packet, run.decisions)
  }
  for (const comparison of copy.comparisons)
    comparison.summary = summarizeEvaluation(comparison.runs, { complete: copy.complete !== false })
  copy.summary = summarizeCampaign(copy)
  return copy
}

export function reviewCampaign(reportPath, decisionsPath) {
  const report = JSON.parse(readFileSync(reportPath, 'utf8'))
  const decisions = JSON.parse(readFileSync(decisionsPath, 'utf8'))
  const reviewed = applyReviews(report, decisions)
  const output = `${reportPath}.reviewed.json`
  // Exclusive creation preserves earlier decisions, including concurrent imports.
  writeFileSync(output, `${JSON.stringify(reviewed, null, 2)}\n`, { flag: 'wx', mode: 0o600 })
  return { reportPath: output, summary: reviewed.summary }
}
