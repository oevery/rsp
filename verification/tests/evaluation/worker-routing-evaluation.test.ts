import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { buildWorkerEvaluationMatrix, runLocalEvaluationCampaign } from '../../../scripts/agent-evaluation-campaigns.mjs'

const root = fileURLToPath(new URL('../../..', import.meta.url))

describe('worker routing campaign', () => {
  it('declares direct, delegated, coordinated, serialization, and recovery inputs without fake lifecycle events', () => {
    const scenarios = buildWorkerEvaluationMatrix(root)
    expect(scenarios).toHaveLength(6)
    expect(scenarios.map(scenario => scenario.kind)).toEqual(['direct', 'solo', 'delegated', 'coordinated', 'coordinated', 'coordinated'])
    expect(scenarios.every(scenario => !Object.hasOwn(scenario, 'trace'))).toBe(true)
    expect(scenarios.map(scenario => scenario.contract.worker_dispatch_count?.min)).toEqual([0, 1, 1, 2, 2, 1])
  })

  it('keeps worker lifecycle and dispatch unverified when no host worker adapter participates', () => {
    const result = runLocalEvaluationCampaign({ scenarios: buildWorkerEvaluationMatrix(root), campaignId: 'worker-routing-local', root })
    expect(result.report).toMatchObject({ verdict: 'incomplete', execution: { planned: 6, executed: 6, verified: 0, unverified: 6 } })
    expect(result.report.runs.every(run => run.disposition === 'unverified')).toBe(true)
    expect(result.report.runs.every(run => run.evidence.some(evidence => evidence.source_kind === 'event'))).toBe(true)
  })
})
