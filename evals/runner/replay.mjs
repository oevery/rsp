import { Buffer } from 'node:buffer'
import { existsSync, readFileSync } from 'node:fs'
import { dirname, isAbsolute, join, relative } from 'node:path'
import { gradeEvidence } from '../graders/evidence.mjs'
import { observeEvents } from '../observers/events.mjs'
import { loadCase } from './cases.mjs'
import { harnessIdentity, sourceIdentity } from './execute.mjs'
import { hash, writeJson } from './files.mjs'
import { executionIdentity, gradingIdentity } from './identity.mjs'

export async function replayRun(reportPath, root, entries, { persist = true } = {}) {
  const run = JSON.parse(readFileSync(reportPath, 'utf8'))
  let replay
  try {
    if (run.identity?.schema !== 'evaluation-run-v2')
      throw new Error('legacy evidence has no replay contract; preserved without regrading')
    const entry = entries ? entries.find(entry => entry.id === run.case) : loadCase(root, run.case)
    if (!entry || entry.inputHash !== run.identity.caseHash || hash(run.caseSpec) !== run.identity.caseSpecHash)
      throw new Error('case identity changed or unavailable')
    if (hash({ caseSpec: run.caseSpec, context: run.context, identity: run.identity, result: run.result, observation: run.observation }) !== run.evidenceHash)
      throw new Error('recorded evidence hash mismatch')
    if (!run.result || !run.observation || !run.context?.workspace)
      throw new Error('recorded execution or observation missing')
    for (const [name, value] of [['events.jsonl', run.result.stdout], ['stderr.log', run.result.stderr], ['final.md', run.result.finalOutput]]) {
      if (readFileSync(join(dirname(reportPath), name), 'utf8') !== value)
        throw new Error('retained artifact mismatch')
    }
    for (const [path, content] of Object.entries(run.observation.artifacts)) {
      const digest = hash(Buffer.concat([Buffer.from(`${String(run.observation.fileModes[path])}:`), Buffer.from(content)]))
      if (digest !== run.observation.files[path])
        throw new Error('artifact content incomplete or redacted')
    }
    const events = observeEvents(run.result.stdout, run.context.skillReadReference, run.context.knownOutputReference)
    events.writes = events.writes.map(path => isAbsolute(path) ? relative(run.context.workspace, path) : path)
    const graded = await gradeEvidence({ ...entry, manifest: run.caseSpec }, { ...run, events, arm: run.context.arm })
    replay = { ...graded, matchesOriginal: hash(graded.verdict) === hash(run.verdict) }
  }
  catch (error) {
    replay = { verdict: { status: 'inconclusive', category: 'evidence', reason: error.message }, matchesOriginal: false }
  }
  const result = { schema: 'evaluation-replay-v1', runId: run.id, originalVerdict: run.verdict, originalHarnessHash: run.identity?.harnessHash, replayHarnessHash: harnessIdentity(root), providerInvocations: 0, ...replay }
  const output = join(dirname(reportPath), 'replay.json')
  if (persist)
    writeJson(output, result)
  return { reportPath: output, ...result }
}

export async function revalidateCampaign(reportPath, root, entries) {
  const report = JSON.parse(readFileSync(reportPath, 'utf8'))
  if (!report.complete || hash(report.plan) !== report.planHash || report.plan.sourceHash !== sourceIdentity(root) || report.plan.executionHash !== executionIdentity(root))
    throw new Error('Execution identity missing or changed; cannot upgrade historical evidence')
  const runs = []
  for (const run of report.comparisons.flatMap(c => c.runs)) {
    if (!/^[a-f0-9-]{36}$/u.test(run.id))
      throw new Error('Invalid run id')
    const replay = await replayRun(join(dirname(reportPath), run.id, 'run.json'), root, entries, { persist: false })
    runs.push({ runId: run.id, evidenceHash: run.evidenceHash, verdict: replay.verdict, hard: replay.hard, task: replay.task, activation: replay.activation })
  }
  const receipt = { planHash: report.planHash, executionHash: executionIdentity(root), gradingHash: gradingIdentity(root), runs }
  report.revalidation = { ...receipt, receiptHash: hash(receipt) }
  const output = `${reportPath}.revalidated.json`
  if (existsSync(output))
    throw new Error('Revalidation output already exists; preserve it')
  writeJson(output, report)
  return { reportPath: output, providerInvocations: 0, results: runs.map(r => ({ runId: r.runId, verdict: r.verdict })) }
}
