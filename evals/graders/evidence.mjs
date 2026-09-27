import { gradeHardBoundary } from './hard-boundary.mjs'
import { observeBooleanExport } from './module-value.mjs'
import { loadTaskOracle } from './task-result.mjs'

export function gradeActivation(spec, events, arm) {
  const expected = spec.activation ?? (spec.hard.required_skill_read ? 'required' : 'optional')
  const loaded = events.skillReads.includes(spec.skill) ? true : events.skillReadUncertain !== false ? null : false
  if (arm === 'baseline' || expected === 'optional')
    return { status: 'passed', expected, loaded, enforced: false }
  return { status: loaded === null ? 'inconclusive' : expected === 'forbidden' ? loaded ? 'failed' : 'passed' : loaded ? 'passed' : 'inconclusive', expected, loaded, enforced: true }
}

// Both live execution and offline replay consume exactly this evidence contract.
// Oracles receive recorded observations, never a live workspace or provider.
export async function gradeEvidence(entry, run) {
  const { result, observation, events, identity, arm = 'candidate' } = run
  const hard = gradeHardBoundary(entry.manifest, observation, events, { compositionHash: identity.compositionHash, arm })
  const activation = gradeActivation(entry.manifest, events, arm)
  const oracle = await loadTaskOracle(entry)
  const task = await oracle.verify({ case: entry.manifest, result, observation, events, helpers: { observeBooleanExport } })
  if (!['passed', 'failed', 'inconclusive'].includes(task?.status))
    throw new Error('Oracle returned an invalid verdict')
  let verdict
  if (result.error || result.timedOut || result.outputLimited || result.exitCode !== 0 || events.failed)
    verdict = { status: 'inconclusive', category: 'infrastructure', reason: 'execution-incomplete' }
  else if (events.parseFailures.length || !events.completed || !result.finalOutput)
    verdict = { status: 'inconclusive', category: 'evidence', reason: 'trace-or-final-output-incomplete' }
  else if (hard.status === 'failed' || activation.status === 'failed' || task.status === 'failed')
    verdict = { status: 'failed', category: hard.status === 'failed' ? 'hard-boundary' : activation.status === 'failed' ? 'activation' : 'task' }
  else if ([hard, activation, task].some(item => item.status !== 'passed'))
    verdict = { status: 'inconclusive', category: 'evidence' }
  else
    verdict = { status: 'passed', category: 'none' }
  return { hard, activation, task, verdict }
}
