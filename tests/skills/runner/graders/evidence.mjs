import { gradeHardBoundary } from './hard-boundary.mjs'
import { observeBooleanExport } from './module-value.mjs'
import { gradeNativeCoordination } from './native-coordination.mjs'
import { loadTaskOracle } from './task-result.mjs'

// Oracles grade observable task outcomes, never Skill text or reading patterns.
// Oracles receive recorded observations, never a live workspace or provider.
export async function gradeEvidence(entry, run) {
  const { result, observation, events, identity } = run
  const hard = gradeHardBoundary(entry.manifest, observation, events, { compositionHash: identity.compositionHash })
  const coordination = gradeNativeCoordination(entry.manifest, result.native, identity.executor)
  const oracle = await loadTaskOracle(entry)
  const task = await oracle.verify({ case: entry.manifest, result, observation, events, helpers: { observeBooleanExport } })
  if (!['passed', 'failed', 'inconclusive'].includes(task?.status))
    throw new Error('Oracle returned an invalid verdict')
  let verdict
  if (result.error || result.timedOut || result.outputLimited || result.exitCode !== 0 || events.failed)
    verdict = { status: 'inconclusive', category: 'infrastructure', reason: 'execution-incomplete' }
  else if (events.parseFailures.length || events.pendingToolCalls || !events.completed || !result.finalOutput)
    verdict = { status: 'inconclusive', category: 'evidence', reason: 'trace-or-final-output-incomplete' }
  else if (hard.status === 'failed' || task.status === 'failed' || coordination.status === 'failed')
    verdict = { status: 'failed', category: hard.status === 'failed' ? 'hard-boundary' : 'task' }
  else if ([hard, task, coordination].some(item => item.status !== 'passed'))
    verdict = { status: 'inconclusive', category: 'evidence' }
  else
    verdict = { status: 'passed', category: 'none' }
  return { hard, task, ...(entry.manifest.native && { coordination }), verdict }
}
