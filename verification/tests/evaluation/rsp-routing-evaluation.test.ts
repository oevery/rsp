import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { buildRoutingEvaluationMatrix, runLocalEvaluationCampaign } from '../../../scripts/agent-evaluation-campaigns.mjs'

const root = fileURLToPath(new URL('../../..', import.meta.url))

describe('rSP Core routing campaign', () => {
  it('declares routing, ambiguity, authority, and phase cases as executable inputs', () => {
    const scenarios = buildRoutingEvaluationMatrix(root)
    expect(scenarios).toHaveLength(10)
    expect(scenarios.map(scenario => scenario.kind)).toEqual(expect.arrayContaining(['direct-change', 'group-explicit-owner', 'focus-candidate-explicit-owner', 'focus-ambiguity-stop', 'authority-stop', 'shape-composition', 'design-composition', 'review-composition', 'verify-composition', 'manage-qualification']))
    expect(scenarios.every(scenario => !Object.hasOwn(scenario, 'trace'))).toBe(true)
    expect(scenarios.every(scenario => scenario.execution.args[0] === 'scripts/verification-scenario-check.mjs')).toBe(true)
  })

  it('records observed command evidence but does not claim Core routing execution without a Core runtime', () => {
    const result = runLocalEvaluationCampaign({ scenarios: buildRoutingEvaluationMatrix(root), campaignId: 'rsp-routing-local', root })
    expect(result.report).toMatchObject({ verdict: 'incomplete', execution: { planned: 10, executed: 10, verified: 0, unverified: 10 } })
    expect(result.report.runs.every(run => run.evidence.some(evidence => evidence.source_kind === 'event'))).toBe(true)
    expect((result.report.omissions ?? []).every(omission => omission.kind === 'unverified')).toBe(true)
  })
})
