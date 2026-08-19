import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  hashManagedControllerComposition,
  prepareManagedControllerRun,
} from '../scripts/managed-controller-eval.mjs'
import {
  buildReleaseProviderComparisonPlan,
  createReleaseProviderComparisonSummary,
  renderReleaseProviderComparisonMarkdown,
  runReleaseProviderComparison,
} from '../scripts/release-provider-comparison.mjs'

const root = process.cwd()

function syntheticRun(
  plan: ReturnType<typeof buildReleaseProviderComparisonPlan>,
  arm: 'baseline' | 'candidate',
  repetition: number,
  totalTokens: number | null,
  options: { dimensionStatus?: 'failed' | 'passed', outcome?: 'failed' | 'passed' | 'unavailable' } = {},
) {
  const dimensionStatus = options.dimensionStatus ?? 'passed'
  return {
    repetition,
    arm,
    outcome: options.outcome ?? 'passed',
    completion: 'contract-passed',
    compositionSha256: arm === 'baseline' ? plan.baseline.composition.hash : plan.candidate.composition.hash,
    contractSha256: plan.identities.contractSha256,
    observationSha256: 'f'.repeat(64),
    dimensions: {
      trigger: { status: 'not-observed' },
      compliance: { status: dimensionStatus },
      boundary: { status: dimensionStatus },
      task_result: { status: dimensionStatus },
    },
    measurements: {
      corrections: null,
      first_fix_result: null,
      worker_dispatch_count: null,
      tool_calls: totalTokens === null ? null : 10 + repetition,
      elapsed_ms: totalTokens === null ? null : 1000 + repetition * 10,
      tokens: {
        input: totalTokens === null ? null : totalTokens - 20,
        output: totalTokens === null ? null : 20,
        total: totalTokens,
      },
    },
    omissions: [],
  }
}

describe('release provider comparison', () => {
  it('pins the previous release, candidate, holdout, and harness before provider execution', () => {
    const plan = buildReleaseProviderComparisonPlan(root, { baselineRef: 'v3.2.0', repetitions: 3 })

    expect(plan.execution).toBe('serial-paired')
    expect(plan.repetitions).toBe(3)
    expect(plan.baseline).toMatchObject({
      ref: 'v3.2.0',
      commit: expect.stringMatching(/^[a-f0-9]{40}$/),
      composition: { hash: expect.stringMatching(/^[a-f0-9]{64}$/) },
    })
    expect(plan.candidate).toMatchObject({
      fingerprintSha256: expect.stringMatching(/^[a-f0-9]{64}$/),
      composition: { hash: expect.stringMatching(/^[a-f0-9]{64}$/) },
    })
    expect(plan.baseline.composition.hash).not.toBe(plan.candidate.composition.hash)
    expect(plan.identities).toEqual({
      contractSha256: expect.stringMatching(/^[a-f0-9]{64}$/),
      fixtureSha256: expect.stringMatching(/^[a-f0-9]{64}$/),
      harnessSha256: expect.stringMatching(/^[a-f0-9]{64}$/),
    })
    expect(JSON.stringify(plan)).not.toContain(root)
  })

  it('installs an explicit historical Skill source instead of silently using the current product', ({ onTestFinished }) => {
    const temporaryRoot = mkdtempSync(join(tmpdir(), 'rsp-release-provider-source-'))
    onTestFinished(() => rmSync(temporaryRoot, { force: true, recursive: true }))
    const skillSource = join(temporaryRoot, 'skills')
    for (const skill of ['rsp', 'rsp-manage', 'rsp-implement'])
      cpSync(join(root, 'skills', skill), join(skillSource, skill), { recursive: true })
    const managedSkill = join(skillSource, 'rsp-manage', 'SKILL.md')
    writeFileSync(managedSkill, `${readFileSync(managedSkill, 'utf8')}\nHistorical release marker.\n`)

    const prepared = prepareManagedControllerRun({
      caseId: 'auto-multisurface-routing',
      outputRoot: join(temporaryRoot, 'runs'),
      root,
      skillSourceDirectory: skillSource,
      variant: 'candidate',
    })
    const expected = hashManagedControllerComposition(['rsp', 'rsp-manage', 'rsp-implement'].map(name => ({
      name,
      path: join(skillSource, name),
    })))
    const current = hashManagedControllerComposition(['rsp', 'rsp-manage', 'rsp-implement'].map(name => ({
      name,
      path: join(root, 'skills', name),
    })))

    expect(prepared.sourceComposition).toEqual(expected)
    expect(prepared.installedComposition).toEqual(expected)
    expect(expected.hash).not.toBe(current.hash)
    const receiptShape = prepared.prompt.match(/Use this exact top-level JSON shape: (\{[^\n]+\})\./u)
    expect(receiptShape).not.toBeNull()
    expect(Object.keys(JSON.parse(receiptShape![1])).sort()).toEqual([
      'case_id',
      'composition_sha256',
      'contract_sha256',
      'observations',
    ])
    expect(prepared.prompt).toContain('Do not add an identity wrapper or any other key.')
  })

  it('writes a sanitized failed report when one provider arm returns an invalid receipt', async ({ onTestFinished }) => {
    const outputRoot = mkdtempSync(join(tmpdir(), 'rsp-release-provider-failed-report-'))
    onTestFinished(() => rmSync(outputRoot, { force: true, recursive: true }))

    const result = await runReleaseProviderComparison({
      baselineRef: 'v3.2.0',
      effort: 'high',
      evaluationRunner: async () => {
        throw new Error('evaluation receipt must contain exactly four keys; private diagnostic')
      },
      model: 'test-model',
      outputRoot,
      repetitions: 3,
    })

    expect(result.summary.verdict).toBe('failed')
    expect(result.summary.runs).toEqual([expect.objectContaining({
      arm: 'baseline',
      repetition: 1,
      outcome: 'failed',
      failure: 'invalid-evaluation-receipt',
    })])
    expect(existsSync(result.jsonPath)).toBe(true)
    expect(existsSync(result.markdownPath)).toBe(true)
    expect(readFileSync(result.jsonPath, 'utf8')).not.toContain('private diagnostic')
    expect(readFileSync(result.markdownPath, 'utf8')).toContain('| 1 | baseline | failed | invalid-evaluation-receipt |')
  })

  it('reports repeated median token deltas and arm noise without making an efficiency gate', () => {
    const plan = buildReleaseProviderComparisonPlan(root, { baselineRef: 'v3.2.0', repetitions: 3 })
    const runs = [
      syntheticRun(plan, 'baseline', 1, 100),
      syntheticRun(plan, 'candidate', 1, 120),
      syntheticRun(plan, 'baseline', 2, 110),
      syntheticRun(plan, 'candidate', 2, 100),
      syntheticRun(plan, 'baseline', 3, 90),
      syntheticRun(plan, 'candidate', 3, 110),
    ]
    const summary = createReleaseProviderComparisonSummary(plan, runs)
    const markdown = renderReleaseProviderComparisonMarkdown(summary)

    expect(summary.verdict).toBe('passed')
    expect(summary.correctness.passed).toBe(true)
    expect(summary.efficiency).toMatchObject({
      status: 'observed',
      threshold: null,
      baseline: { total_tokens: { median: 100, min: 90, max: 110, relativeRangePct: 20 } },
      candidate: { total_tokens: { median: 110, min: 100, max: 120, relativeRangePct: 18.18 } },
      deltaPct: { total_tokens: 10 },
    })
    expect(markdown).toContain('| total_tokens | 100 | 110 | 10% | 20% | 18.18% |')
    expect(JSON.stringify(summary)).not.toMatch(/"(?:model|provider|session|settings|workspace)"s*:/u)
  })

  it('fails correctness regressions even when candidate tokens are lower', () => {
    const plan = buildReleaseProviderComparisonPlan(root, { baselineRef: 'v3.2.0', repetitions: 3 })
    const runs = []
    for (let repetition = 1; repetition <= 3; repetition += 1) {
      runs.push(syntheticRun(plan, 'baseline', repetition, 100))
      runs.push(syntheticRun(plan, 'candidate', repetition, 50, {
        dimensionStatus: repetition === 1 ? 'failed' : 'passed',
        outcome: repetition === 1 ? 'failed' : 'passed',
      }))
    }

    const summary = createReleaseProviderComparisonSummary(plan, runs)
    expect(summary.verdict).toBe('failed')
    expect(summary.correctness.passed).toBe(false)
    expect(summary.efficiency.deltaPct.total_tokens).toBe(-50)
  })

  it('keeps missing usage incomplete rather than converting it into a pass', () => {
    const plan = buildReleaseProviderComparisonPlan(root, { baselineRef: 'v3.2.0', repetitions: 3 })
    const runs = []
    for (let repetition = 1; repetition <= 3; repetition += 1) {
      runs.push(syntheticRun(plan, 'baseline', repetition, 100))
      runs.push(syntheticRun(plan, 'candidate', repetition, repetition === 2 ? null : 100))
    }

    const summary = createReleaseProviderComparisonSummary(plan, runs)
    expect(summary.verdict).toBe('incomplete')
    expect(summary.efficiency.status).toBe('not-conclusive')
    expect(summary.omissions).toContain('one or more required measurements are unavailable')
  })

  it('keeps unavailable provider execution distinct from a correctness failure', () => {
    const plan = buildReleaseProviderComparisonPlan(root, { baselineRef: 'v3.2.0', repetitions: 3 })
    const runs = [syntheticRun(plan, 'baseline', 1, null, { outcome: 'unavailable' })]
    const summary = createReleaseProviderComparisonSummary(plan, runs)

    expect(summary.verdict).toBe('unavailable')
    expect(summary.correctness.passed).toBe(false)
    expect(summary.omissions).toContain('one or more paired provider runs were unavailable or not run')
  })

  it('rejects single-run comparisons before provider execution', () => {
    const result = spawnSync(process.execPath, [
      join(root, 'scripts', 'release-provider-comparison.mjs'),
      '--plan',
      '--json',
      '--baseline-ref',
      'v3.2.0',
      '--repetitions',
      '1',
    ], { cwd: root, encoding: 'utf8' })

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('repetitions must be an integer from 3 to 10')
  })
})
