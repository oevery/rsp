import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  aggregateAgentEvaluationRuns,
  assertAgentEvaluationLocalMode,
  buildAgentEvaluationAnalysisInput,
  buildAgentEvaluationEvidenceCatalog,
  buildAgentEvaluationResumePlan,
  createAgentEvaluationFakeJudge,
  detectAgentEvaluationLeaks,
  loadAgentEvaluationRegistry,
  renderAgentEvaluationMarkdown,
  runAgentEvaluationAnalysis,
  sanitizeAgentEvaluationValue,
  scoreAgentEvaluationTrace,
  validateAgentEvaluationAnalysis,
  validateAgentEvaluationArtifactSurfaces,
  validateAgentEvaluationCampaignRegistry,
  validateAgentEvaluationRegistry,
} from '../../../scripts/agent-evaluation-platform.mjs'

const root = fileURLToPath(new URL('../../..', import.meta.url))

describe('agent evaluation platform', () => {
  it('registers every published Skill plus Core and worker routing contracts', () => {
    const registry = loadAgentEvaluationRegistry(root)
    const skills = registry.objects.filter(item => item.kind === 'skill').map(item => item.installed_skill).sort()

    expect(skills).toEqual([
      'rsp',
      'rsp-commit',
      'rsp-design',
      'rsp-diagnose',
      'rsp-implement',
      'rsp-manage',
      'rsp-release-docs',
      'rsp-resolve-findings',
      'rsp-review',
      'rsp-shape',
      'rsp-structural-audit',
      'rsp-tdd',
      'rsp-verify',
    ])
    expect(registry.objects.filter(item => item.kind === 'core').map(item => item.owner)).toEqual(['rsp-core-routing'])
    expect(registry.objects.filter(item => item.kind === 'worker').map(item => item.owner)).toEqual(['managed-worker-routing'])
    expect(registry.campaigns.map(item => item.kind)).toEqual(['project-fixture', 'provider-gate'])
    expect(registry.artifact_surfaces.every(item => item.host_evidence_source && item.primary_dimension)).toBe(true)
  })

  it('rejects an incomplete registry instead of silently shrinking coverage', () => {
    const registry = loadAgentEvaluationRegistry(root)
    expect(() => validateAgentEvaluationRegistry({ ...registry, objects: registry.objects.filter(item => item.owner !== 'rsp-verify') }, { root })).toThrow('published Skills are missing contracts: rsp-verify')
  })

  it('scores routing, required events, forbidden events and worker counts independently', () => {
    const contract = {
      id: 'worker-routing-test',
      kind: 'worker' as const,
      owner: 'managed-worker-routing',
      installed_skill: null,
      fixtures: ['verification/evaluations/managed-controller/holdout/auto-integrated-direct'],
      metrics: ['routing', 'compliance', 'boundary', 'dispatch'],
      goals: ['select and execute the expected worker route'],
      required_events: ['route_selected', 'worker_dispatched', 'worker_settled'],
      forbidden_events: ['publication_started'],
      artifact_surfaces: ['host-trace'],
      expected_route: 'coordinated',
      worker_dispatch_count: { min: 2, max: 2 },
    }
    const trace = {
      events: [
        { id: 'e1', type: 'route_selected' },
        { id: 'e2', type: 'worker_dispatched' },
        { id: 'e3', type: 'publication_started' },
      ],
      host_observed: { route: 'delegated', worker_dispatch_count: 1 },
      self_report: { route: 'coordinated', worker_dispatch_count: 2 },
      final: 'completed',
    }
    const result = scoreAgentEvaluationTrace({ contract, trace })

    expect(result.status).toBe('failed')
    expect(result.dimensions.routing.status).toBe('failed')
    expect(result.dimensions.compliance.status).toBe('failed')
    expect(result.dimensions.boundary.status).toBe('failed')
    expect(result.deterministic.missing_required_events).toEqual(['worker_settled'])
    expect(result.deterministic.forbidden_events).toEqual([{ event_id: 'e3', type: 'publication_started' }])
    expect(result.deterministic.worker_findings).toEqual([{ kind: 'worker-dispatch-count-mismatch', expected: { min: 2, max: 2 }, actual: 1 }])
  })

  it('detects and redacts user paths and sensitive context before AI analysis', () => {
    const trace = { final: '/Users/oevery/.codex/memories/MEMORY.md authorization: Bearer abcdefghijkl' }
    expect(detectAgentEvaluationLeaks(trace)).toEqual([
      { kind: 'absolute-path', path: '$.final', value: '<redacted>' },
      { kind: 'sensitive-context', path: '$.final', value: '<redacted>' },
    ])
    expect(sanitizeAgentEvaluationValue({ token: 'secret-value', path: '/Users/oevery/private.txt' })).toEqual({ token: '[REDACTED]', path: '<absolute-path>' })
  })

  it('assigns sanitized evidence IDs and rejects raw or duplicate catalog references', () => {
    const catalog = buildAgentEvaluationEvidenceCatalog({
      trace: { events: [{ type: 'result_returned', details: { token: 'never-retain' } }], final: '/Users/oevery/private/report.md' },
      deterministic: { missing_required_events: ['verification'] },
    })
    expect(catalog.entries.map(entry => entry.id)).toEqual(['event-1', 'final-handoff-2', 'deterministic-3'])
    expect(catalog.entries[1]).toMatchObject({ source_kind: 'final-handoff', locator: 'trace.final', value: '<absolute-path>' })
    const input = buildAgentEvaluationAnalysisInput({ contract: { id: 'catalog-test', owner: 'rsp', kind: 'skill', goals: ['cite evidence'], metrics: ['compliance'], required_events: ['result_returned'], forbidden_events: [] }, trace: { events: [{ type: 'result_returned' }] }, deterministic: {} })
    expect(() => runAgentEvaluationAnalysis({ input, judge: () => ({ schema_version: 1, verdict: 'passed', findings: [{ id: 'f1', severity: 'P1', category: 'omission', summary: 'raw id', evidence_ids: ['event-id'], confidence: 1 }], confidence: 1 }) })).toThrow('unknown evidence')
    expect(() => validateAgentEvaluationCampaignRegistry({ version: 1, id: 'bad', campaigns: [{ id: 'one', kind: 'provider-gate', owner: 'x', fixtures: ['verification/evaluations/agent-evaluation/contracts.yaml'], metrics: ['artifact'], artifact_surfaces: ['host-trace'] }, { id: 'one', kind: 'provider-gate', owner: 'y', fixtures: ['verification/evaluations/agent-evaluation/contracts.yaml'], metrics: ['artifact'], artifact_surfaces: ['host-trace'] }] }, { root })).toThrow('duplicate campaign id')
  })

  it('scores required artifact surfaces with deterministic checks', () => {
    const contract = { artifact_surfaces: ['final-handoff'] }
    const surfaces = [{ id: 'final-handoff', kind: 'handoff', required: true, host_evidence_source: 'final', deterministic_checks: ['present', 'non_empty', 'evidence_refs_known'], semantic_goals: ['handoff'], primary_dimension: 'handoff' }]
    const catalog = buildAgentEvaluationEvidenceCatalog({ trace: { final: 'done' }, deterministic: {} })
    expect(validateAgentEvaluationArtifactSurfaces({ contract, surfaces, artifacts: [{ surface_id: 'final-handoff', content: 'done', evidence_ids: ['final-handoff-1'] }], evidenceCatalog: catalog }).status).toBe('passed')
    expect(validateAgentEvaluationArtifactSurfaces({ contract, surfaces, artifacts: [], evidenceCatalog: catalog }).status).toBe('failed')
  })

  it('keeps unavailable and unverified coverage incomplete and blocks real providers', () => {
    const report = aggregateAgentEvaluationRuns({ plan: { cases: [{ id: 'case-a', candidate_repetitions: 3 }] }, runs: [{ case: 'case-a', arm: 'candidate', repetition: 1, disposition: 'unavailable' }, { case: 'case-a', arm: 'candidate', repetition: 2, disposition: 'unverified', verdict: 'passed' }] })
    expect(report).toMatchObject({ verdict: 'incomplete', execution: { planned: 3, executed: 2, skipped: 1, unavailable: 1, unverified: 1 } })
    expect(() => assertAgentEvaluationLocalMode({ mode: 'real' })).toThrow('real provider execution is not authorized')
    expect(assertAgentEvaluationLocalMode({ mode: 'fake', providerKind: 'fixture' })).toMatchObject({ real_provider: false })
    const judge = createAgentEvaluationFakeJudge({ verdict: 'passed', findings: [] })
    expect(judge()).toMatchObject({ schema_version: 1, verdict: 'passed' })
  })

  it('lets deterministic hard failures override an AI pass without fabricating evidence', () => {
    const input = buildAgentEvaluationAnalysisInput({
      contract: { id: 'analysis-test', owner: 'rsp', kind: 'skill', installed_skill: 'rsp', fixtures: ['verification/evaluations/skill-routing/cases.yaml'], metrics: ['compliance'], goals: ['preserve required verification'], required_events: ['verification'], forbidden_events: [], artifact_surfaces: ['final-handoff'] },
      trace: { events: [], final: 'done' },
      deterministic: { missing_required_events: ['verification'], forbidden_events: [], leakage: [], command_failures: [] },
    })
    const result = runAgentEvaluationAnalysis({
      input,
      judge: () => ({ schema_version: 1, verdict: 'passed', findings: [], confidence: 0.9 }),
    })

    expect(result).toMatchObject({ verdict: 'failed', deterministic_override: true })
    expect(() => validateAgentEvaluationAnalysis({ schema_version: 1, verdict: 'passed', findings: [{ id: 'bad', severity: 'P1', category: 'omission', summary: 'missing evidence', evidence_ids: [], confidence: 0.8 }] })).toThrow('evidence_ids must be a non-empty string array')
  })

  it('preserves planned, executed, skipped and stopped campaign state for exact resume', () => {
    const report = aggregateAgentEvaluationRuns({
      plan: { cases: [{ id: 'case-a', candidate_repetitions: 2, baseline_repetitions: 1 }, { id: 'case-b', candidate_repetitions: 1, baseline_repetitions: 0 }] },
      runs: [{ case: 'case-a', arm: 'candidate', repetition: 1, verdict: 'failed' }],
      stopped: { case: 'case-a', arm: 'candidate', repetition: 1 },
      analysis: { source: 'fake-judge' },
    })
    const resume = buildAgentEvaluationResumePlan({ report, from: 'case-a:candidate:2' })

    expect(report).toMatchObject({ verdict: 'stopped', execution: { planned: 4, executed: 1, skipped: 3, stopped: { case: 'case-a', arm: 'candidate', repetition: 1 } } })
    expect(resume.runs).toEqual([
      { case: 'case-a', arm: 'candidate', repetition: 2 },
      { case: 'case-a', arm: 'baseline', repetition: 1 },
      { case: 'case-b', arm: 'candidate', repetition: 1 },
    ])
    expect(renderAgentEvaluationMarkdown(report)).toContain('- Skipped runs: 3')
    expect(renderAgentEvaluationMarkdown(report)).toContain('deterministic hard-boundary findings remain authoritative')
  })
})
