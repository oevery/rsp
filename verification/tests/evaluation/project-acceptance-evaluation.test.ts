import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { buildProjectEvaluationMatrix, runLocalEvaluationCampaign } from '../../../scripts/agent-evaluation-campaigns.mjs'

const root = fileURLToPath(new URL('../../..', import.meta.url))

describe('project acceptance campaign', () => {
  it('declares all project boundary categories and a real acceptance command', () => {
    const scenarios = buildProjectEvaluationMatrix(root)
    expect(scenarios.map(scenario => scenario.kind)).toEqual(['checkout', 'package-build', 'install-upgrade', 'worktree', 'generated-artifacts', 'final-handoff'])
    expect(scenarios.every(scenario => scenario.applicability === 'required' && scenario.semantic_boundary === 'disposable-release-acceptance')).toBe(true)
    expect(scenarios.every(scenario => scenario.execution.args[0] === 'scripts/release-acceptance.mjs')).toBe(true)
  })

  it('does not promote a release plan inspection to disposable acceptance', () => {
    const result = runLocalEvaluationCampaign({ scenarios: buildProjectEvaluationMatrix(root), campaignId: 'project-acceptance-local', root })
    expect(result.report).toMatchObject({ verdict: 'incomplete', execution: { planned: 6, executed: 6, verified: 0, unverified: 6 } })
    expect(result.report.runs.every(run => run.disposition === 'unverified')).toBe(true)
    expect(result.report.runs.every(run => run.evidence.some(evidence => evidence.source_kind === 'event'))).toBe(true)
  })
})
