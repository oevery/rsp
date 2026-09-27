import { randomUUID } from 'node:crypto'
import { compositionIdentity } from '../observers/workspace.mjs'
import { runCase, sourceIdentity } from './execute.mjs'
import { compareStatistics, pairedOrder } from './statistics.mjs'

export function summarizeRuns(runs) {
  const counts = arm => ({
    passed: runs.filter(run => run.arm === arm && run.verdict.status === 'passed').length,
    failed: runs.filter(run => run.arm === arm && run.verdict.status === 'failed').length,
    inconclusive: runs.filter(run => run.arm === arm && run.verdict.status === 'inconclusive').length,
  })
  const baseline = counts('baseline')
  const candidate = counts('candidate')
  return {
    baseline,
    candidate,
    statistics: compareStatistics(runs),
    status: candidate.failed ? 'failed' : baseline.inconclusive || candidate.inconclusive || !runs.length ? 'inconclusive' : 'passed',
    regression: candidate.failed ? 'observed-candidate-failure' : baseline.inconclusive || candidate.inconclusive ? 'undetermined' : 'not-observed',
  }
}

export async function compareCase(entry, root, options = {}) {
  const repetitions = options.repetitions ?? 1
  if (!Number.isInteger(repetitions) || repetitions < 1 || repetitions > 100)
    throw new Error('Repetitions must be an integer from 1 to 100')
  if (!options.adapter || !options.candidateComposition)
    throw new Error('Comparison requires one shared adapter and a candidate composition')
  const baseline = compositionIdentity(options.baselineComposition)
  const candidate = compositionIdentity(options.candidateComposition)
  if (baseline.hash === candidate.hash)
    throw new Error('Baseline and candidate compositions must differ')
  if (!candidate.skills.includes(entry.manifest.skill))
    throw new Error('Candidate composition is missing the evaluated Skill')
  const runs = []
  const sourceHash = sourceIdentity(root)
  const seed = options.seed ?? randomUUID()
  for (let repetition = 1; repetition <= repetitions; repetition++) {
    const order = pairedOrder(seed, repetition)
    for (const arm of order) {
      const composition = arm === 'baseline' ? options.baselineComposition : options.candidateComposition
      if (compositionIdentity(composition).hash !== (arm === 'baseline' ? baseline.hash : candidate.hash))
        throw new Error('Composition changed during comparison')
      const run = await runCase(entry, root, { ...options, sourceHash, compositionHash: arm === 'baseline' ? baseline.hash : candidate.hash, composition, arm })
      runs.push({ arm, repetition, ...run })
    }
  }
  return { case: entry.manifest.id, repetitions, scheduling: { order: 'seeded-balanced-pairs', seed, concurrency: 1 }, runs, summary: summarizeRuns(runs) }
}
