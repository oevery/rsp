import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { buildSkillEvaluationMatrix, runLocalEvaluationCampaign } from '../../../scripts/agent-evaluation-campaigns.mjs'
import { loadAgentEvaluationRegistry } from '../../../scripts/agent-evaluation-platform.mjs'

const root = fileURLToPath(new URL('../../..', import.meta.url))

describe('skill behavior campaign', () => {
  it('declares independent owner-specific cases without embedding a host trace', () => {
    const scenarios = buildSkillEvaluationMatrix(loadAgentEvaluationRegistry(root), root)
    expect(scenarios).toHaveLength(39)
    expect(new Set(scenarios.map(scenario => scenario.owner)).size).toBe(13)
    expect(scenarios.every(scenario => !Object.hasOwn(scenario, 'trace'))).toBe(true)
    expect(scenarios.every(scenario => scenario.execution.command === 'node')).toBe(true)
    expect(scenarios.every(scenario => scenario.semantic_boundary === 'published-skill-package-load')).toBe(true)
  })

  it('executes the local package boundary and retains semantic runtime as unverified', () => {
    const scenarios = buildSkillEvaluationMatrix(loadAgentEvaluationRegistry(root), root).filter(scenario => scenario.owner === 'rsp')
    const result = runLocalEvaluationCampaign({ scenarios, campaignId: 'skill-local', root, mode: 'fake' })
    expect(result.report).toMatchObject({ verdict: 'incomplete', execution: { planned: 3, executed: 3, verified: 0, unverified: 3 } })
    expect(result.report.runs).toEqual(expect.arrayContaining([
      expect.objectContaining({
        case: 'skills/rsp/operate-existing',
        disposition: 'unverified',
        evidence: expect.arrayContaining([expect.objectContaining({ source_kind: 'event', value: expect.objectContaining({ type: 'command_completed', source: 'host' }) })]),
      }),
    ]))
    expect(result.report.runs.flatMap(run => run.score.normalized_trace.events ?? []).every(event => event.source !== 'fake-host')).toBe(true)
  })
})
