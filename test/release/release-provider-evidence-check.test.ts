import { describe, expect, it } from 'vitest'
import {
  assessReleaseProviderEvidence,
  assessReleaseProviderEvidenceMatrix,
} from '../../scripts/release-provider-evidence-check.mjs'

function plan(candidateComposition = 'candidate-composition', caseId = 'scenario-a', repetitions = 3) {
  return {
    case: caseId,
    providerExpectations: {},
    repetitions,
    baseline: {
      ref: 'v3.2.0',
      commit: 'baseline-commit',
      composition: { hash: 'baseline-composition' },
    },
    candidate: {
      commit: 'release-commit',
      dirty: false,
      fingerprintSha256: 'release-fingerprint',
      composition: { hash: candidateComposition },
    },
    identities: {
      contractSha256: 'contract',
      fixtureSha256: 'fixture',
      harnessSha256: 'harness',
    },
  }
}

function passedReport(caseId = 'scenario-a', repetitions = 3) {
  const runs = []
  for (let repetition = 1; repetition <= repetitions; repetition += 1) {
    for (const arm of ['baseline', 'candidate']) {
      runs.push({
        case: caseId,
        arm,
        classification: 'eligible',
        repetition,
        targetPair: repetition,
        outcome: 'passed',
        compositionSha256: arm === 'baseline' ? 'baseline-composition' : 'candidate-composition',
        contractSha256: 'contract',
        dimensions: {
          compliance: { status: 'passed' },
          boundary: { status: 'passed' },
          task_result: { status: 'passed' },
        },
        scenario: { status: 'passed' },
      })
    }
  }
  return {
    path: `.cache/release-provider-comparison/${caseId}/report.json`,
    report: {
      verdict: 'passed',
      execution: 'serial-paired',
      scheduling: { concurrency: 1, order: 'alternating-ab-ba' },
      repetitions,
      case: caseId,
      identities: {
        baseline: {
          ref: 'v3.2.0',
          commit: 'baseline-commit',
          composition: { hash: 'baseline-composition' },
        },
        candidate: {
          commit: 'pre-release-implementation-commit',
          dirty: true,
          fingerprintSha256: 'pre-release-fingerprint',
          composition: { hash: 'candidate-composition' },
        },
        contractSha256: 'contract',
        fixtureSha256: 'fixture',
        harnessSha256: 'harness',
        issues: [],
      },
      correctness: { passed: true },
      infrastructure: { eligiblePairs: repetitions },
      runs,
    },
  }
}

function baselineDiagnosticReport() {
  const entry = passedReport() as any
  const baseline = entry.report.runs.find((run: any) => run.arm === 'baseline' && run.targetPair === 1)
  baseline.worker_compliance_enforcement = 'diagnostic'
  baseline.worker_compliance = {
    status: 'failed',
    host_dispatch_count: 0,
    expected_dispatch_count: 2,
    receipt_rejection_count: 2,
    recovered_product_result: true,
    violations: [{ assignment: null, kind: 'host-dispatch-count', value: 0, expected: 2 }],
  }
  baseline.dimensions.compliance.status = 'failed'
  baseline.dimensions.boundary.status = 'failed'
  entry.report.correctness = { passed: true, candidatePassed: true, baselineDiagnosticFailures: 1 }
  entry.report.infrastructure.efficiencyComparablePairs = 0
  entry.report.efficiency = { status: 'not-comparable' }
  return entry
}

function partialBaselineReport() {
  const entry = passedReport() as any
  const baseline = entry.report.runs.find((run: any) => run.arm === 'baseline' && run.targetPair === 1)
  baseline.classification = 'model-failed'
  baseline.outcome = 'failed'
  baseline.dimensions.compliance.status = 'failed'
  baseline.dimensions.boundary.status = 'failed'
  entry.report.correctness = {
    passed: true,
    candidatePassed: true,
    candidateRuns: 3,
    requiredCandidateRuns: 3,
    baselineModelFailures: 1,
  }
  entry.report.comparison = { status: 'partial', eligiblePairs: 2, plannedPairs: 3 }
  entry.report.infrastructure.eligiblePairs = 2
  entry.report.efficiency = { status: 'not-conclusive' }
  return entry
}

describe('release provider evidence check', () => {
  it('does not require provider evidence when the compared Skill composition is unchanged', () => {
    const current = plan('baseline-composition')

    expect(assessReleaseProviderEvidence(current, [])).toEqual({
      state: 'not-required',
      baselineRef: 'v3.2.0',
      compositionSha256: 'baseline-composition',
    })
  })

  it('reuses matching provider evidence across release-only candidate identity changes', () => {
    const result = assessReleaseProviderEvidence(plan(), [passedReport()])

    expect(result).toEqual({
      state: 'reused',
      baselineRef: 'v3.2.0',
      reportPath: '.cache/release-provider-comparison/scenario-a/report.json',
      repetitions: 3,
      compositionSha256: 'candidate-composition',
    })
  })

  it('reuses a passed candidate report with baseline-only worker diagnostics', () => {
    expect(assessReleaseProviderEvidence(plan(), [baselineDiagnosticReport()])).toMatchObject({
      state: 'reused',
      reportPath: '.cache/release-provider-comparison/scenario-a/report.json',
    })
  })

  it('reuses complete candidate evidence when the baseline comparison is partial', () => {
    expect(assessReleaseProviderEvidence(plan(), [partialBaselineReport()])).toMatchObject({
      state: 'reused',
      reportPath: '.cache/release-provider-comparison/scenario-a/report.json',
    })
  })

  it('rejects partial reports with fewer than the required candidate runs', () => {
    const entry = partialBaselineReport()
    entry.report.runs = entry.report.runs.filter((run: any) => !(run.arm === 'candidate' && run.targetPair === 3))
    entry.report.correctness.candidateRuns = 2
    entry.report.correctness.candidatePassed = false
    entry.report.correctness.passed = false
    entry.report.verdict = 'unavailable'

    expect(assessReleaseProviderEvidence(plan(), [entry]).state).toBe('missing')
  })

  it('rejects candidate worker noncompliance and falsely comparable baseline diagnostics', () => {
    const candidateFailure = baselineDiagnosticReport()
    const candidate = candidateFailure.report.runs.find((run: any) => run.arm === 'candidate' && run.targetPair === 1)
    candidate.worker_compliance_enforcement = 'diagnostic'
    candidate.worker_compliance = { ...candidateFailure.report.runs[0].worker_compliance }
    expect(assessReleaseProviderEvidence(plan(), [candidateFailure]).state).toBe('missing')

    const comparableBaseline = baselineDiagnosticReport()
    comparableBaseline.report.efficiency.status = 'observed'
    comparableBaseline.report.infrastructure.efficiencyComparablePairs = 3
    expect(assessReleaseProviderEvidence(plan(), [comparableBaseline]).state).toBe('missing')
  })

  it('reuses provider evidence only when every matrix scenario has a matching passed report', () => {
    const plans = [
      plan('candidate-composition', 'scenario-a', 3),
      plan('candidate-composition', 'scenario-b', 1),
    ]
    const result = assessReleaseProviderEvidenceMatrix(plans, [
      passedReport('scenario-a', 3),
      passedReport('scenario-b', 1),
    ])

    expect(result).toEqual({
      state: 'reused',
      baselineRef: 'v3.2.0',
      compositionSha256: 'candidate-composition',
      reports: [
        { case: 'scenario-a', reportPath: '.cache/release-provider-comparison/scenario-a/report.json', repetitions: 3 },
        { case: 'scenario-b', reportPath: '.cache/release-provider-comparison/scenario-b/report.json', repetitions: 1 },
      ],
    })
  })

  it('reports each missing matrix scenario instead of accepting partial coverage', () => {
    const plans = [
      plan('candidate-composition', 'scenario-a', 3),
      plan('candidate-composition', 'scenario-b', 1),
      plan('candidate-composition', 'scenario-c', 1),
    ]

    expect(assessReleaseProviderEvidenceMatrix(plans, [passedReport('scenario-a', 3)])).toEqual({
      state: 'missing',
      baselineRef: 'v3.2.0',
      compositionSha256: 'candidate-composition',
      missingCases: ['scenario-b', 'scenario-c'],
    })
  })

  it.each([
    ['candidate composition', (entry: ReturnType<typeof passedReport>) => { entry.report.identities.candidate.composition.hash = 'stale' }],
    ['contract', (entry: ReturnType<typeof passedReport>) => { entry.report.identities.contractSha256 = 'stale' }],
    ['fixture', (entry: ReturnType<typeof passedReport>) => { entry.report.identities.fixtureSha256 = 'stale' }],
    ['harness', (entry: ReturnType<typeof passedReport>) => { entry.report.identities.harnessSha256 = 'stale' }],
    ['serial scheduling', (entry: ReturnType<typeof passedReport>) => { entry.report.scheduling.concurrency = 2 }],
    ['paired correctness', (entry: ReturnType<typeof passedReport>) => { entry.report.runs.pop() }],
  ])('rejects stale or incomplete %s evidence', (_label, mutate) => {
    const entry = passedReport()
    mutate(entry)

    expect(assessReleaseProviderEvidence(plan(), [entry])).toEqual({
      state: 'missing',
      baselineRef: 'v3.2.0',
      compositionSha256: 'candidate-composition',
    })
  })
})
