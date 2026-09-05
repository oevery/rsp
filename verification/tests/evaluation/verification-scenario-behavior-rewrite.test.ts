import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  buildProjectEvaluationMatrix,
  buildRoutingEvaluationMatrix,
  buildSkillEvaluationMatrix,
  buildWorkerEvaluationMatrix,
} from '../../../scripts/agent-evaluation-campaigns.mjs'
import { loadAgentEvaluationRegistry } from '../../../scripts/agent-evaluation-platform.mjs'

const root = fileURLToPath(new URL('../../..', import.meta.url))

describe('verification scenario behavior rewrite', () => {
  it('uses owner-specific Skill cases instead of a shared five-case expansion', () => {
    const scenarios = buildSkillEvaluationMatrix(loadAgentEvaluationRegistry(root), root)
    const byOwner = scenarios.reduce((groups, scenario) => {
      const current = groups.get(scenario.owner) ?? []
      current.push(scenario)
      groups.set(scenario.owner, current)
      return groups
    }, new Map<string, typeof scenarios>())

    expect(byOwner.size).toBe(13)
    expect(byOwner.get('rsp')?.map(scenario => scenario.kind)).toEqual(['operate-existing', 'initialize-repair', 'durable-update'])
    expect(byOwner.get('rsp-tdd')?.map(scenario => scenario.kind)).toEqual(['test-first', 'observed-red', 'concrete-risk'])
    expect(byOwner.get('rsp-review')?.map(scenario => scenario.kind)).toEqual(['code-review', 'document-review', 'fixed-scope'])
  })

  it('keeps scenario inputs separate from host receipts across routing, workers, and projects', () => {
    const scenarios = [
      ...buildRoutingEvaluationMatrix(root),
      ...buildWorkerEvaluationMatrix(root),
      ...buildProjectEvaluationMatrix(root),
    ]
    expect(scenarios.every(scenario => !Object.hasOwn(scenario, 'trace'))).toBe(true)
    expect(scenarios.every(scenario => scenario.execution && scenario.contract)).toBe(true)
    expect(scenarios.every(scenario => scenario.verification_disposition === 'unverified')).toBe(true)
  })
})
