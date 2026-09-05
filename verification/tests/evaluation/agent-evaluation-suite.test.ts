import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { runLocalAgentEvaluationSuite } from '../../../scripts/agent-evaluation-suite.mjs'

const root = fileURLToPath(new URL('../../..', import.meta.url))

describe('agent evaluation suite integration', () => {
  it('composes all local campaigns through one evidence and coverage model', () => {
    const report = runLocalAgentEvaluationSuite(root)
    expect(report).toMatchObject({ verdict: 'incomplete', invariants: { evidence_provenance_complete: true, deterministic_hard_failures_authoritative: true, real_provider_acceptance: 'outside-group' }, provider: { mode: 'fake', real_provider: false } })
    expect(report.inventory.published_skills).toHaveLength(13)
    expect(report.inventory.core_routes).toEqual(['rsp-core-routing'])
    expect(report.inventory.worker_routes).toEqual(['managed-worker-routing'])
    expect(report.inventory.project_categories).toEqual(['checkout', 'package-build', 'install-upgrade', 'worktree', 'generated-artifacts', 'final-handoff'])
    expect(report.campaigns.skills.report.execution).toMatchObject({ planned: 39, executed: 39, verified: 0, unverified: 39 })
  }, 30_000)
})
