import { hash } from './files.mjs'

export function pairedOrder(seed, repetition) {
  const block = Math.floor((repetition - 1) / 2)
  const first = Number.parseInt(hash(`${seed}:${block}`).slice(0, 2), 16) % 2
  const baselineFirst = (first + repetition - 1) % 2 === 0
  return baselineFirst ? ['baseline', 'candidate'] : ['candidate', 'baseline']
}

export function summarizeValues(values) {
  const valid = values.filter(value => typeof value === 'number' && Number.isFinite(value))
  const mean = valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null
  return {
    samples: valid.length,
    missing: values.length - valid.length,
    mean,
    standardDeviation: valid.length > 1 ? Math.sqrt(valid.reduce((sum, value) => sum + (value - mean) ** 2, 0) / (valid.length - 1)) : null,
    min: valid.length ? Math.min(...valid) : null,
    max: valid.length ? Math.max(...valid) : null,
  }
}

const metrics = {
  durationMs: run => run.result?.durationMs,
  inputTokens: run => run.events?.usage?.input_tokens,
  outputTokens: run => run.events?.usage?.output_tokens,
  cachedInputTokens: run => run.events?.usage?.cached_input_tokens,
  toolCalls: run => run.events?.toolCalls,
  modelInvocations: run => run.events?.modelInvocations,
}

export function compareStatistics(runs) {
  const byArm = Object.fromEntries(['baseline', 'candidate'].map((arm) => {
    const selected = runs.filter(run => run.arm === arm)
    const valid = selected.filter(run => run.verdict.status !== 'inconclusive')
    const categories = {}
    for (const run of selected)
      categories[run.verdict.category] = (categories[run.verdict.category] ?? 0) + 1
    return [arm, {
      total: selected.length,
      valid: valid.length,
      inconclusive: selected.length - valid.length,
      successRate: valid.length ? valid.filter(run => run.verdict.status === 'passed').length / valid.length : null,
      categories,
      metrics: Object.fromEntries(Object.entries(metrics).map(([name, get]) => [name, summarizeValues(selected.map(get))])),
    }]
  }))
  const pairs = []
  for (const candidate of runs.filter(run => run.arm === 'candidate')) {
    const baseline = runs.find(run => run.arm === 'baseline' && run.case === candidate.case && run.repetition === candidate.repetition)
    if (baseline && [baseline, candidate].every(run => run.verdict.status !== 'inconclusive'))
      pairs.push({ baseline, candidate })
  }
  return {
    byArm,
    pairedDeltas: Object.fromEntries(Object.entries(metrics).map(([name, get]) => [name, summarizeValues(pairs.map(({ baseline, candidate }) => {
      const a = get(baseline)
      const b = get(candidate)
      return typeof a === 'number' && typeof b === 'number' ? b - a : null
    }))])),
    pairedSamples: pairs.length,
  }
}
