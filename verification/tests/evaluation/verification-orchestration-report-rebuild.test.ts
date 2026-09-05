import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { RELEASE_ACCEPTANCE_STEPS } from '../../../scripts/release-acceptance.mjs'
import { acceptanceCategoryEvidence, buildLocalVerificationSummary, readAcceptanceReport, writeAggregateArtifact } from '../../../scripts/verification-local.mjs'
import { buildVerificationAggregateReport, createVerificationRunRecord, validateVerificationAggregateReport } from '../../../scripts/verification-platform.mjs'

const root = fileURLToPath(new URL('../../..', import.meta.url))

function acceptanceSteps(packageEvidence?: Record<string, unknown>) {
  return RELEASE_ACCEPTANCE_STEPS.map(step => ({
    id: step.id,
    status: 'passed',
    ...(step.id === 'package' && packageEvidence ? { evidence: packageEvidence } : {}),
  }))
}

describe('verification orchestration and report rebuild', () => {
  const requiredScenario = {
    id: 'test/required',
    layer: 'test' as const,
    owner: 'tests',
    execution_mode: 'deterministic' as const,
    fixture_refs: ['package.json'],
    required_evidence: ['host-trace'],
    oracle: 'vitest',
    rubric: 'tests',
    artifact_policy: 'report',
  }

  it('does not pass when a required layer has no executed evidence', () => {
    const topology = { scenarios: [requiredScenario] }
    const report = buildVerificationAggregateReport({ topology })

    expect(report).toMatchObject({ verdict: 'incomplete', planned: 1, executed: 0, verified: 0 })
    expect(report.omissions).toEqual(expect.arrayContaining([expect.objectContaining({ kind: 'skipped', count: 1 })]))
  })

  it('rejects externally supplied contradictory aggregate counts', () => {
    expect(() => validateVerificationAggregateReport({
      schema_version: 1,
      id: 'malformed',
      verdict: 'passed',
      planned: 1,
      executed: 0,
      verified: 1,
      failed: 0,
      skipped: 0,
      unavailable: 0,
      unverified: 0,
      simulated: 0,
      runs: [],
      errors: [],
      omissions: [],
      evidence: [],
      usage: {},
      ai_analysis: {},
      boundaries: [],
    })).toThrow('does not match run dispositions')
  })

  it('rejects contradictory verified records and aggregates usage with AI provenance', () => {
    const topology = { scenarios: [requiredScenario] }
    expect(() => createVerificationRunRecord({ scenario: topology.scenarios[0], verdict: 'passed', disposition: 'verified' })).toThrow('contradictory verified record')
    const report = buildVerificationAggregateReport({
      topology,
      runs: [{ scenario_id: 'test/required', executionMode: 'deterministic', disposition: 'verified', verdict: 'passed', evidence: [{ source_kind: 'event', locator: 'command', value: { exit_code: 0 } }], usage: { input_tokens: 4, output_tokens: 6 } }],
      aiAnalysis: { semantic_provider_invoked: false },
    })
    expect(report).toMatchObject({ verdict: 'passed', planned: 1, executed: 1, verified: 1, usage: { input_tokens: 4, output_tokens: 6, total_tokens: 10 }, ai_analysis: { provenance: 'local-deterministic-judge', semantic_provider_invoked: false } })
    expect(validateVerificationAggregateReport(report)).toBe(report)
  })

  it('classifies deterministic command failures as failed runs', () => {
    const report = buildVerificationAggregateReport({
      topology: { scenarios: [requiredScenario] },
      runs: [{
        scenario_id: requiredScenario.id,
        executionMode: 'deterministic',
        disposition: 'unverified',
        verdict: 'failed',
        errors: [{ message: 'command failed' }],
        evidence: [{ source_kind: 'command-failure', locator: 'command', value: { exit_code: 7 } }],
      }],
    })

    expect(report).toMatchObject({ verdict: 'failed', failed: 1, unverified: 0, errors: [{ message: 'command failed' }] })
  })

  it('requires acceptance runs to use the disposable-project boundary', () => {
    const acceptanceScenario = { ...requiredScenario, id: 'acceptance/project', layer: 'acceptance' as const, execution_mode: 'disposable-project' as const }

    expect(() => createVerificationRunRecord({ scenario: acceptanceScenario, executionMode: 'local', verdict: 'passed', disposition: 'verified', evidence: [{ source_kind: 'event', locator: 'command', value: { exit_code: 0 } }] })).toThrow('cannot record local execution for acceptance')
  })

  it('rejects verified omissions and AI findings that cannot cite aggregate evidence', () => {
    const scenario = requiredScenario
    const evidence = [{ id: 'event-1', source_kind: 'event', locator: 'command', provenance: { source: 'host', observed: true }, value: { exit_code: 0 } }]

    expect(() => createVerificationRunRecord({ scenario, verdict: 'passed', disposition: 'verified', omissions: [{ kind: 'unverified', reason: 'missing observation' }], evidence })).toThrow('contradictory verified record')
    expect(() => buildVerificationAggregateReport({
      topology: { scenarios: [scenario] },
      runs: [{ scenario_id: scenario.id, executionMode: 'deterministic', disposition: 'verified', verdict: 'passed', evidence }],
      aiAnalysis: { findings: [{ id: 'ghost', severity: 'P1', category: 'evidence', summary: 'unknown evidence', evidence_ids: ['does-not-exist'], confidence: 1 }] },
    })).toThrow('references unknown evidence')
  })

  it('retains run omissions and requires aggregate AI findings', () => {
    const evidence = [{ id: 'event-1', source_kind: 'event', locator: 'command', provenance: { source: 'host', observed: true }, value: { exit_code: 0 } }]
    const run = {
      scenario_id: 'test/required',
      layer: 'test',
      owner: 'tests',
      execution_mode: 'deterministic',
      started_at: null,
      completed_at: null,
      errors: [],
      omissions: [{ kind: 'unverified', reason: 'missing semantic runtime' }],
      evidence,
      usage: null,
      provider: null,
      analysis: null,
      verdict: 'unverified',
      disposition: 'unverified',
    }
    const report = {
      schema_version: 1,
      id: 'omission-contract',
      verdict: 'incomplete',
      planned: 1,
      executed: 1,
      verified: 0,
      failed: 0,
      skipped: 0,
      unavailable: 0,
      unverified: 1,
      simulated: 0,
      runs: [run],
      errors: [],
      omissions: [],
      evidence,
      usage: {},
      ai_analysis: {},
      boundaries: [],
    }

    expect(() => validateVerificationAggregateReport(report)).toThrow('does not retain run omissions')
    const malformedRunOptions = { scenario: requiredScenario, verdict: 'passed', disposition: 'verified', errors: { message: 'boom' }, evidence: { source_kind: 'event' } }
    expect(() => createVerificationRunRecord(malformedRunOptions as never)).toThrow('errors, omissions, and evidence must be arrays')
  })

  it('derives acceptance evidence from selected project scenarios', () => {
    const report = {
      schemaVersion: 1,
      id: 'acceptance-1',
      verdict: 'passed',
      startedAt: '2026-08-26T00:00:00.000Z',
      completedAt: '2026-08-26T00:00:00.000Z',
      steps: acceptanceSteps({
        package: '@oevery/rsp@3.3.0',
        tarballSha256: 'a'.repeat(64),
        projectScenarios: [
          { id: 'upgrade', kind: 'published-upgrade', coverage: ['published-upgrade'], fixturePath: 'fixtures/upgrade', fixtureSha256: 'b'.repeat(64), checks: { update: true, doctor: true, check: true, specs: true, generatedIndexRemoved: true } },
          { id: 'dirty', kind: 'fresh-adoption', coverage: ['fresh-adoption', 'dirty-git-worktree'], fixturePath: 'fixtures/dirty', fixtureSha256: 'c'.repeat(64), checks: { init: true, addSpec: true, doctor: true, status: true, specs: true, preservedFiles: true, dirtyGitWorktree: true } },
        ],
      }),
    }

    const expectedProjects = [
      { id: 'upgrade', kind: 'published-upgrade', coverage: ['published-upgrade'], fixturePath: 'fixtures/upgrade', fixtureSha256: 'b'.repeat(64) },
      { id: 'dirty', kind: 'fresh-adoption', coverage: ['fresh-adoption', 'dirty-git-worktree'], fixturePath: 'fixtures/dirty', fixtureSha256: 'c'.repeat(64) },
    ]
    const install = acceptanceCategoryEvidence(report, 'install-upgrade', expectedProjects)
    const worktree = acceptanceCategoryEvidence(report, 'worktree', expectedProjects)
    const installProjects = (install.evidence[0].value as { selected_project_scenarios: Array<Record<string, unknown>> }).selected_project_scenarios
    const worktreeProjects = (worktree.evidence[0].value as { selected_project_scenarios: Array<Record<string, unknown>> }).selected_project_scenarios
    expect(install.verified).toBe(true)
    expect(installProjects).toEqual(expect.arrayContaining([expect.objectContaining({ id: 'upgrade' }), expect.objectContaining({ id: 'dirty' })]))
    expect(worktree.verified).toBe(true)
    expect(worktreeProjects).toEqual([expect.objectContaining({ id: 'dirty' })])
  })

  it('requires a host-observed package artifact bound to the reported identity and hash', () => {
    const tarballPath = '.cache/verification-acceptance/run-1/artifacts/package.tgz'
    const report = {
      schemaVersion: 1,
      id: 'acceptance-artifact',
      verdict: 'passed',
      package: { name: '@oevery/rsp', version: '3.3.0' },
      startedAt: '2026-08-26T00:00:00.000Z',
      completedAt: '2026-08-26T00:01:00.000Z',
      steps: acceptanceSteps({ package: '@oevery/rsp@3.3.0', tarballPath, tarballBytes: 3, tarballSha256: 'a'.repeat(64) }),
    }
    const receipt = { artifacts: [{ path: tarballPath, observed: true, bytes: 3, sha256: 'a'.repeat(64) }] }

    expect(acceptanceCategoryEvidence(report, 'package-build', [], receipt).verified).toBe(true)
    expect(acceptanceCategoryEvidence(report, 'generated-artifacts', [], receipt).verified).toBe(true)
    expect(acceptanceCategoryEvidence(report, 'generated-artifacts', [], { artifacts: [] }).verified).toBe(false)
    expect(acceptanceCategoryEvidence({ ...report, steps: acceptanceSteps({ package: '', tarballPath, tarballBytes: 3, tarballSha256: 'a'.repeat(64) }) }, 'package-build', [], receipt).verified).toBe(false)
    expect(acceptanceCategoryEvidence({ ...report, steps: acceptanceSteps({ package: '@oevery/rsp@3.3.0', tarballPath, tarballBytes: 3, tarballSha256: 'b'.repeat(64) }) }, 'generated-artifacts', [], receipt).verified).toBe(false)
  })

  it('rejects malformed and weak acceptance reports instead of throwing or verifying', () => {
    expect(acceptanceCategoryEvidence({ steps: {} }, 'checkout')).toMatchObject({ verified: false })
    const weak = acceptanceCategoryEvidence({
      schemaVersion: 1,
      id: 'weak',
      verdict: 'passed',
      startedAt: '2026-08-26T00:00:00.000Z',
      completedAt: '2026-08-26T00:01:00.000Z',
      steps: acceptanceSteps({ package: 'fake', tarballSha256: 'a'.repeat(64), projectScenarios: [{ fixturePath: 'x', fixtureSha256: 'b'.repeat(64), checks: {} }] }),
    }, 'checkout', [{ id: 'expected', kind: 'fresh-adoption', coverage: ['fresh-adoption'], fixturePath: 'expected', fixtureSha256: 'c'.repeat(64) }])
    expect(weak.verified).toBe(false)
  })

  it('rejects a passed aggregate with a failed, duplicate, or missing acceptance step', () => {
    const expectedProjects = [{ id: 'expected', kind: 'fresh-adoption', coverage: ['fresh-adoption'], fixturePath: 'expected', fixtureSha256: 'c'.repeat(64) }]
    const base = {
      schemaVersion: 1,
      id: 'contradictory',
      verdict: 'passed',
      startedAt: '2026-08-26T00:00:00.000Z',
      completedAt: '2026-08-26T00:01:00.000Z',
      steps: acceptanceSteps({ package: 'fake', tarballSha256: 'a'.repeat(64), projectScenarios: [{ ...expectedProjects[0], checks: { init: true, addSpec: true, doctor: true, status: true, specs: true, preservedFiles: true } }] }),
    }
    expect(acceptanceCategoryEvidence({ ...base, steps: base.steps.filter(step => step.id === 'build' || step.id === 'package') }, 'checkout', expectedProjects).verified).toBe(false)
    expect(acceptanceCategoryEvidence({ ...base, steps: base.steps.map(step => step.id === 'package' ? { ...step, status: 'failed' } : step) }, 'package-build', expectedProjects).verified).toBe(false)
    expect(acceptanceCategoryEvidence({ ...base, steps: [...base.steps, { id: 'package', status: 'passed' }] }, 'checkout', expectedProjects).verified).toBe(false)
  })

  it('recovers a current acceptance report when the stdout pointer was truncated', () => {
    const workspace = mkdtempSync(join(tmpdir(), 'rsp-acceptance-report-recovery-'))
    try {
      const reportPath = join(workspace, '.cache', 'verification-acceptance', 'run-1', 'report.json')
      mkdirSync(join(workspace, '.cache', 'verification-acceptance', 'run-1'), { recursive: true })
      writeFileSync(reportPath, JSON.stringify({ id: 'acceptance-recovered', schemaVersion: 1, verdict: 'passed', startedAt: new Date(Date.now() - 500).toISOString(), completedAt: new Date().toISOString(), steps: acceptanceSteps() }))

      const report = readAcceptanceReport(workspace, {
        started_at: new Date(Date.now() - 1000).toISOString(),
        completed_at: new Date(Date.now() + 1000).toISOString(),
        host_observed: { stdout: 'truncated acceptance output' },
      })

      expect(report).toMatchObject({ id: 'acceptance-recovered', schemaVersion: 1, verdict: 'passed', steps: acceptanceSteps() })
    }
    finally {
      rmSync(workspace, { recursive: true, force: true })
    }
  })

  it('rejects acceptance reports outside the repository and reports from before the invocation', () => {
    const workspace = mkdtempSync(join(tmpdir(), 'rsp-acceptance-boundary-'))
    const outside = mkdtempSync(join(tmpdir(), 'rsp-acceptance-outside-'))
    try {
      mkdirSync(join(outside, 'run-1'), { recursive: true })
      writeFileSync(join(outside, 'run-1', 'report.json'), JSON.stringify({ id: 'outside', schemaVersion: 1, verdict: 'passed', startedAt: new Date(Date.now() - 500).toISOString(), completedAt: new Date().toISOString(), steps: [] }))
      mkdirSync(join(workspace, '.cache'), { recursive: true })
      symlinkSync(outside, join(workspace, '.cache', 'verification-acceptance'), 'dir')
      expect(readAcceptanceReport(workspace, { started_at: new Date(Date.now() - 1000).toISOString(), completed_at: new Date(Date.now() + 1000).toISOString(), host_observed: { stdout: 'truncated' } })).toBeNull()
    }
    finally {
      rmSync(workspace, { recursive: true, force: true })
      rmSync(outside, { recursive: true, force: true })
    }
  })

  it('does not recover a report completed before the current host invocation', () => {
    const workspace = mkdtempSync(join(tmpdir(), 'rsp-acceptance-stale-'))
    try {
      const reportDirectory = join(workspace, '.cache', 'verification-acceptance', 'run-1')
      mkdirSync(reportDirectory, { recursive: true })
      writeFileSync(join(reportDirectory, 'report.json'), JSON.stringify({
        id: 'stale',
        schemaVersion: 1,
        verdict: 'passed',
        startedAt: new Date(Date.now() - 5000).toISOString(),
        completedAt: new Date(Date.now() - 4000).toISOString(),
        steps: [],
      }))

      expect(readAcceptanceReport(workspace, {
        started_at: new Date(Date.now() - 1000).toISOString(),
        completed_at: new Date(Date.now() + 1000).toISOString(),
        host_observed: { stdout: 'truncated' },
      })).toBeNull()
    }
    finally {
      rmSync(workspace, { recursive: true, force: true })
    }
  })

  it('reports the full local plan with explicit semantic and provider boundaries', () => {
    const summary = buildLocalVerificationSummary(root)
    expect(summary.aggregate).toMatchObject({ planned: 63, executed: 63, verdict: 'incomplete', verified: 1 })
    expect(summary.aggregate.boundaries).toEqual(expect.arrayContaining([
      expect.objectContaining({ boundary: 'real-provider', disposition: 'unavailable' }),
      expect.objectContaining({ boundary: 'Skill semantic runtime', disposition: 'unverified' }),
    ]))
    expect(summary.aggregate.ai_analysis).toMatchObject({ semantic_provider_invoked: false, hard_failures_override_semantic_pass: true })
    expect(summary.aggregate.ai_analysis.analyzed_runs).toBe(55)
    expect(summary.aggregate.ai_analysis.findings).toEqual(expect.any(Array))
    expect(JSON.stringify(summary.evaluations).length).toBeLessThan(500_000)
    expect(summary.evaluations.campaigns.skills.report.runs[0].score).not.toHaveProperty('normalized_trace')
    expect(summary.evaluations.campaigns.skills.report.runs[0]).toHaveProperty('analysis')
  }, 30_000)

  it('returns repository-relative report paths without leaking the host workspace', () => {
    const workspace = mkdtempSync(join(tmpdir(), 'rsp-verification-report-'))
    try {
      const summary = {
        topology: { by_layer: { test: 1, evaluation: 0, acceptance: 0 } },
        aggregate: {
          verdict: 'incomplete',
          planned: 1,
          executed: 1,
          verified: 0,
          failed: 0,
          unverified: 1,
          unavailable: 0,
          simulated: 0,
          errors: [],
          omissions: [{ kind: 'unverified', reason: 'runtime unavailable' }, { kind: 'unverified', reason: 'runtime unavailable' }],
          usage: { input_tokens: 0, output_tokens: 0, total_tokens: 0, known: true },
          boundaries: [],
          ai_analysis: { provenance: 'local-deterministic-judge', judge: 'local-deterministic-judge', semantic_provider_invoked: false },
        },
      }
      const paths = writeAggregateArtifact(workspace, summary)

      expect(paths).toEqual({
        jsonPath: 'verification/artifacts/verification-local-report.json',
        markdownPath: 'verification/artifacts/verification-local-report.md',
      })
      expect(JSON.stringify(paths)).not.toContain(workspace)
      expect(JSON.parse(readFileSync(join(workspace, paths.jsonPath), 'utf8'))).toEqual(summary)
      const markdown = readFileSync(join(workspace, paths.markdownPath), 'utf8')
      expect(markdown).toContain('\"count\":2')
      expect(markdown).toContain('Usage: 0 input + 0 output = 0 total tokens')
      expect(markdown).toContain('Findings: 0')
    }
    finally {
      rmSync(workspace, { recursive: true, force: true })
    }
  })
})
