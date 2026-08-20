import { describe, expect, it } from 'vitest'
import { assessReleaseProviderEvidence } from '../../scripts/release-provider-evidence-check.mjs'

function plan(candidateComposition = 'candidate-composition') {
  return {
    repetitions: 3,
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

function passedReport() {
  const repetitions = 3
  const runs = []
  for (let repetition = 1; repetition <= repetitions; repetition += 1) {
    for (const arm of ['baseline', 'candidate']) {
      runs.push({
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
      })
    }
  }
  return {
    path: '.cache/release-provider-comparison/run/report.json',
    report: {
      verdict: 'passed',
      execution: 'serial-paired',
      scheduling: { concurrency: 1, order: 'alternating-ab-ba' },
      repetitions,
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
      reportPath: '.cache/release-provider-comparison/run/report.json',
      repetitions: 3,
      compositionSha256: 'candidate-composition',
    })
  })

  it.each([
    ['candidate composition', (entry: ReturnType<typeof passedReport>) => { entry.report.identities.candidate.composition.hash = 'stale' }],
    ['contract', (entry: ReturnType<typeof passedReport>) => { entry.report.identities.contractSha256 = 'stale' }],
    ['fixture', (entry: ReturnType<typeof passedReport>) => { entry.report.identities.fixtureSha256 = 'stale' }],
    ['harness', (entry: ReturnType<typeof passedReport>) => { entry.report.identities.harnessSha256 = 'stale' }],
    ['serial scheduling', (entry: ReturnType<typeof passedReport>) => { entry.report.scheduling.concurrency = 2 }],
    ['eligible pair count', (entry: ReturnType<typeof passedReport>) => { entry.report.infrastructure.eligiblePairs = 2 }],
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
