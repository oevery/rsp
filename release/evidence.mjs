import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { aggregateReviewDecisions } from '../evals/graders/semantic-review.mjs'
import { compositionIdentity } from '../evals/observers/workspace.mjs'
import { loadCase } from '../evals/runner/cases.mjs'
import { sourceIdentity } from '../evals/runner/execute.mjs'
import { hash } from '../evals/runner/files.mjs'
import { executionIdentity, gradingIdentity } from '../evals/runner/identity.mjs'
import { readReleaseSuite } from '../evals/runner/suite.mjs'

// Reports are trusted operator artifacts, not signed third-party attestations.
// Recompute gates; never trust the report's cached summary or semantic status.
export function checkCampaignEvidence(root, reportPath) {
  if (!reportPath)
    return { status: 'inconclusive', reasons: ['reviewed provider campaign required'] }
  const reasons = []
  try {
    const report = JSON.parse(readFileSync(reportPath, 'utf8'))
    const plan = report.plan
    const suite = readReleaseSuite(root)
    if (!suite || plan.suiteHash !== suite.hash)
      reasons.push('release scenario suite missing or changed')
    for (const id of suite?.publicCases ?? []) {
      if (!plan.cases.some(entry => entry.id === id && entry.visibility === 'public'))
        reasons.push(`required public scenario missing: ${id}`)
    }
    for (const skill of suite?.holdoutNegativeSkills ?? []) {
      if (!plan.cases.some(entry => entry.skill === skill && entry.visibility === 'holdout' && entry.activation === 'forbidden'))
        reasons.push(`required negative holdout missing: ${skill}`)
    }
    if (report.schema !== 'rsp-campaign-v1' || !report.complete || hash(plan) !== report.planHash)
      reasons.push('incomplete or changed campaign plan')
    if (plan.adapter !== 'opencodex-config' || plan.executor.provider !== 'config' || !plan.executor.configuredProvider || !plan.executor.version || !plan.executor.configHash || !plan.executor.isolated)
      reasons.push('real isolated OpenCodex execution required')
    const current = compositionIdentity(join(root, 'skills'))
    if (plan.sourceHash !== sourceIdentity(root) || plan.candidate.hash !== current.hash || plan.executionHash !== executionIdentity(root))
      reasons.push('stale source, candidate or harness identity')
    const gradingChanged = plan.gradingHash !== gradingIdentity(root)
    const receipt = report.revalidation
    if (gradingChanged || receipt) {
      const { receiptHash, ...body } = receipt ?? {}
      if (!receipt || receiptHash !== hash(body) || receipt.planHash !== report.planHash || receipt.executionHash !== plan.executionHash || receipt.gradingHash !== gradingIdentity(root))
        reasons.push('offline revalidation required or invalid')
    }
    if (plan.candidate.hash === plan.baseline.hash || !Number.isInteger(plan.repetitions) || plan.repetitions < 2)
      reasons.push('distinct paired compositions and at least two repetitions required')
    for (const skill of current.skills) {
      for (const visibility of ['public', 'holdout']) {
        if (!plan.cases.some(entry => entry.skill === skill && entry.visibility === visibility && (visibility !== 'holdout' || entry.activation !== 'forbidden')))
          reasons.push(`missing ${visibility} coverage: ${skill}`)
      }
    }
    if (new Set(plan.cases.map(entry => entry.id)).size !== plan.cases.length || report.comparisons.length !== plan.cases.length)
      reasons.push('case coverage mismatch')
    const runIds = new Set()
    for (const entry of plan.cases) {
      if (entry.visibility === 'public' && loadCase(root, entry.id).inputHash !== entry.hash)
        reasons.push('public case changed since campaign')
      if (entry.visibility === 'holdout' && !entry.version)
        reasons.push('holdout version missing')
      if (entry.visibility === 'holdout') {
        const proof = entry.provenance
        if (!proof?.authorId || !proof.candidateAuthorId || proof.authorId === proof.candidateAuthorId || proof.candidateHash !== plan.candidate.hash || proof.isolation !== 'separate-read-boundary' || !proof.isolationEvidence || !Number.isFinite(Date.parse(proof.frozenAt)) || !Number.isFinite(Date.parse(proof.unsealedAt)) || Date.parse(proof.unsealedAt) < Date.parse(proof.frozenAt) || Date.parse(proof.unsealedAt) > Date.parse(report.startedAt))
          reasons.push('holdout independence, freeze and isolation attestation required')
      }
      const comparisons = report.comparisons.filter(item => item.case === entry.id)
      if (comparisons.length !== 1)
        throw new Error('case result missing or duplicated')
      const runs = comparisons[0].runs
      if (new Set(runs.map(run => run.identity.fixtureHash)).size !== 1)
        reasons.push('paired fixture mismatch')
      if (runs.length !== plan.repetitions * 2)
        reasons.push(`incomplete paired runs: ${entry.id}`)
      for (let repetition = 1; repetition <= plan.repetitions; repetition++) {
        for (const arm of ['baseline', 'candidate']) {
          if (runs.filter(run => run.arm === arm && run.repetition === repetition).length !== 1)
            reasons.push('paired arm missing or duplicated')
        }
      }
      for (const run of runs) {
        if (!/^[a-f0-9-]{36}$/u.test(run.id) || runIds.has(run.id))
          throw new Error('invalid run identity')
        runIds.add(run.id)
        if (run.identity.sourceHash !== plan.sourceHash)
          reasons.push('run source or built CLI identity mismatch')
        const original = JSON.parse(readFileSync(join(dirname(reportPath), run.id, 'run.json'), 'utf8'))
        for (const [filename, value] of [['events.jsonl', run.result?.stdout], ['stderr.log', run.result?.stderr], ['final.md', run.result?.finalOutput]]) {
          if (readFileSync(join(dirname(reportPath), run.id, filename), 'utf8') !== value)
            reasons.push(`retained artifact mismatch: ${run.id}`)
        }
        const { arm, repetition: _repetition, decisions: _decisions, semantic: _semantic, ...execution } = run
        const { semantic: _originalSemantic, ...originalExecution } = original
        if (hash(execution) !== hash(originalExecution))
          reasons.push(`execution evidence changed: ${run.id}`)
        if (run.case !== entry.id || run.skill !== entry.skill || run.identity.visibility !== entry.visibility || run.identity.promptHash !== entry.promptHash || run.identity.caseHash !== entry.hash || run.identity.executionHash !== plan.executionHash || run.identity.gradingHash !== plan.gradingHash || hash(run.identity.executor) !== hash(plan.executor) || run.identity.compositionHash !== plan[arm].hash)
          reasons.push('run identity mismatch')
        let grades = run
        if (gradingChanged || receipt) {
          const matches = receipt?.runs?.filter(item => item.runId === run.id) ?? []
          if (matches.length !== 1 || matches[0].evidenceHash !== run.evidenceHash)
            reasons.push('offline revalidation does not match execution evidence')
          else grades = matches[0]
        }
        if (grades.verdict?.status === 'inconclusive' || run.result?.exitCode !== 0 || run.result?.timedOut || !run.events?.completed || run.events?.parseFailures.length)
          reasons.push(`execution or evidence incomplete: ${run.id}`)
        if (arm === 'candidate') {
          if (run.identity.schema !== 'evaluation-run-v2' || run.packet?.schema !== 'semantic-review-v2' || grades.verdict?.status !== 'passed' || grades.hard?.status !== 'passed' || grades.activation?.status !== 'passed' || grades.task?.status !== 'passed')
            reasons.push(`candidate correctness failure: ${run.id}`)
          if (!run.packet || aggregateReviewDecisions(run.packet, run.decisions ?? []).status !== 'passed')
            reasons.push(`independent semantic review incomplete: ${run.id}`)
        }
      }
    }
  }
  catch {
    reasons.push('campaign evidence unreadable or structurally invalid')
  }
  return { status: reasons.length ? 'inconclusive' : 'passed', reasons }
}
