import { spawnSync } from 'node:child_process'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  hashManagedControllerArtifact,
  hashManagedControllerComposition,
  prepareManagedControllerRun,
} from '../../scripts/managed-controller-eval.mjs'
import {
  buildReleaseProviderComparisonMatrixPlans,
  buildReleaseProviderComparisonPlan,
  classifyProviderAttempt,
  createReleaseProviderComparisonSummary,
  executeSerialProviderPairs,
  renderReleaseProviderComparisonMarkdown,
  replayReleaseProviderComparison,
  runReleaseProviderComparison,
  runReleaseProviderComparisonMatrix,
} from '../../scripts/release-provider-comparison.mjs'
import { assessReleaseProviderEvidence } from '../../scripts/release-provider-evidence-check.mjs'
import { hashSkillEvaluationValue } from '../../scripts/skill-candidate-evaluation.mjs'

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
    case: plan.case,
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
    scenario: {
      expected: plan.providerExpectations,
      observed: {
        dispatch: plan.providerExpectations.dispatch,
        mode: plan.providerExpectations.mode,
        route: plan.providerExpectations.route,
        worker_dispatch_count: plan.providerExpectations.worker_dispatch_count.min,
      },
      status: 'passed',
    },
    omissions: [],
  }
}

function matrixScenarioSummary(
  plan: ReturnType<typeof buildReleaseProviderComparisonPlan>,
  verdict: 'failed' | 'passed' = 'passed',
) {
  return {
    case: plan.case,
    identities: {
      baseline: { ...plan.baseline, composition: { ...plan.baseline.composition } },
      candidate: { ...plan.candidate, composition: { ...plan.candidate.composition } },
      contractSha256: plan.identities.contractSha256,
      fixtureSha256: plan.identities.fixtureSha256,
      harnessSha256: plan.identities.harnessSha256,
    },
    repetitions: plan.repetitions,
    verdict,
  }
}

function writeReplaySource(directory: string, plan: ReturnType<typeof buildReleaseProviderComparisonPlan>) {
  const runs = []
  const metadataPaths = []
  for (let targetPair = 1; targetPair <= plan.repetitions; targetPair += 1) {
    const order = targetPair % 2 === 1
      ? ['baseline', 'candidate'] as const
      : ['candidate', 'baseline'] as const
    for (const [index, arm] of order.entries()) {
      const variant = arm === 'baseline' ? 'candidate' : 'product'
      const compositionSha256 = arm === 'baseline'
        ? plan.baseline.composition.hash
        : plan.candidate.composition.hash
      const observations = {
        trigger: {
          status: 'passed',
          evidence: {
            dispatch: plan.providerExpectations.dispatch,
            mode: plan.providerExpectations.mode,
            route: plan.providerExpectations.route,
          },
        },
        first_fix_result: 'passed',
        correction_count: 0,
        worker_dispatch_count: plan.providerExpectations.worker_dispatch_count.min,
      }
      const receipt = {
        case_id: plan.case,
        composition_sha256: compositionSha256,
        contract_sha256: plan.identities.contractSha256,
        observations,
      }
      const agentReported = {
        evaluation_receipt: {
          case_id: plan.case,
          composition_sha256: compositionSha256,
          contract_sha256: plan.identities.contractSha256,
          receipt_sha256: hashSkillEvaluationValue(receipt),
        },
        observations,
      }
      const usage = {
        cache_write_input_tokens: 0,
        cached_input_tokens: 80 + targetPair,
        input_tokens: 100 + targetPair,
        output_tokens: 20,
        reasoning_output_tokens: 5,
      }
      const observability = {
        dimensions: {
          trigger: { status: 'not-observed', evidence: null },
          compliance: { status: 'passed', evidence: { expected_missing: [] } },
          boundary: { status: 'passed', evidence: { forbidden_present: [], unauthorized_paths: [] } },
          task_result: { status: 'passed', evidence: { outcome: 'passed' } },
        },
        resources: {
          expected_resources: [],
          observed_resources: [],
          unexpected_resources: [],
          missing_resources: [],
        },
        measurements: {
          corrections: null,
          first_fix_result: null,
          worker_dispatch_count: null,
          tool_calls: 10 + targetPair,
          model_invocations: 1,
          tool_output_bytes: 200 + targetPair,
          elapsed_ms: 1000 + targetPair,
          tokens: {
            cache_write_input: 0,
            cached_input: 80 + targetPair,
            input: 100 + targetPair,
            output: 20,
            reasoning_output: 5,
            total: 120 + targetPair,
            uncached_input: 20,
          },
        },
        omissions: [],
      }
      const final = `completed ${arm} ${targetPair}\n`
      const runDirectory = join(
        directory,
        'raw',
        `pair-attempt-${String(targetPair).padStart(2, '0')}`,
        'runs',
        `synthetic-${variant}`,
      )
      mkdirSync(runDirectory, { recursive: true })
      const eventsPath = join(runDirectory, 'events.jsonl')
      const finalPath = join(runDirectory, 'final.md')
      const metadataPath = join(runDirectory, 'metadata.json')
      writeFileSync(eventsPath, '{}\n')
      writeFileSync(finalPath, final)
      const metadata = {
        agent_reported: agentReported,
        case_id: plan.case,
        composition: {
          installed_after: { hash: compositionSha256 },
          installed_before: { hash: compositionSha256 },
          stable: true,
        },
        contract_sha256: plan.identities.contractSha256,
        duration_ms: 1000 + targetPair,
        events: {
          infrastructure: { categories: [], retry_count: 0, status: 'no-contamination-observed' },
          model_invocations: 1,
          observed_resources: [],
          tool_calls: 10 + targetPair,
          tool_output_bytes: 200 + targetPair,
          usage,
        },
        evaluation_receipt: null,
        final_hash: hashManagedControllerArtifact(final),
        observation_sha256: hashSkillEvaluationValue(observability),
        observability,
        output: { expected_missing: [], forbidden_present: [] },
        paths: { events: eventsPath, final: finalPath, metadata: metadataPath },
        receipt_observations: null,
        result: 'passed',
        timed_out: false,
        variant,
        verification: { passed: true },
        worktree: { unauthorized_paths: [] },
      }
      writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`)
      metadataPaths.push(metadataPath)
      runs.push({
        case: plan.case,
        repetition: targetPair,
        arm,
        order: order.join('-then-'),
        pairAttempt: targetPair,
        pairId: `pair-attempt-${String(targetPair).padStart(2, '0')}`,
        position: index + 1,
        targetPair,
        classification: 'eligible',
        outcome: 'passed',
        completion: 'contract-passed',
        compositionSha256,
        contractSha256: plan.identities.contractSha256,
        observationSha256: metadata.observation_sha256,
        agent_reported: agentReported as typeof agentReported | null,
        dimensions: observability.dimensions,
        resources: observability.resources,
        measurements: {
          ...observability.measurements,
          corrections: observations.correction_count as number | null,
          first_fix_result: observations.first_fix_result as string | null,
          worker_dispatch_count: observations.worker_dispatch_count as number | null,
        },
        infrastructure: { categories: [], retryCount: 0, status: 'no-contamination-observed' },
        scenario: {
          expected: plan.providerExpectations,
          observed: {
            dispatch: plan.providerExpectations.dispatch,
            mode: plan.providerExpectations.mode,
            route: plan.providerExpectations.route,
            worker_dispatch_count: plan.providerExpectations.worker_dispatch_count.min,
          },
          status: 'passed',
        },
        omissions: [],
      })
    }
  }
  const report = {
    verdict: 'passed',
    execution: 'serial-paired',
    scheduling: plan.scheduling,
    repetitions: plan.repetitions,
    case: plan.case,
    identities: {
      baseline: plan.baseline,
      candidate: plan.candidate,
      contractSha256: plan.identities.contractSha256,
      fixtureSha256: plan.identities.fixtureSha256,
      harnessSha256: 'a'.repeat(64),
      issues: [],
    },
    correctness: { passed: true },
    infrastructure: {
      attemptedPairs: plan.repetitions,
      contaminatedPairs: 0,
      eligiblePairs: plan.repetitions,
      incompletePairs: 0,
      replacementPairs: 0,
    },
    runs,
  }
  const reportPath = join(directory, 'report.json')
  writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`)
  return { metadataPaths, report, reportPath }
}

describe('release provider comparison', () => {
  it('plans the six routing and worker-topology scenarios as eight serial pairs', () => {
    const plans = buildReleaseProviderComparisonMatrixPlans(root, { baselineRef: 'v3.2.0' })

    expect(plans.map(plan => ({
      case: plan.case,
      dispatch: plan.providerExpectations.dispatch,
      mode: plan.providerExpectations.mode,
      repetitions: plan.repetitions,
      route: plan.providerExpectations.route,
      workers: plan.providerExpectations.worker_dispatch_count,
    }))).toEqual([
      { case: 'auto-integrated-direct', dispatch: 'none', mode: 'direct', repetitions: 1, route: 'direct', workers: { min: 0, max: 0 } },
      { case: 'managed-solo-integrated', dispatch: 'none', mode: 'solo', repetitions: 1, route: 'selected', workers: { min: 0, max: 0 } },
      { case: 'managed-delegated-integrated', dispatch: 'sequential', mode: 'delegated', repetitions: 1, route: 'selected', workers: { min: 1, max: 1 } },
      { case: 'auto-multisurface-routing', dispatch: 'independent-verify', mode: 'coordinated', repetitions: 3, route: 'selected', workers: { min: 2, max: 2 } },
      { case: 'managed-coordinated-sequential', dispatch: 'sequential', mode: 'coordinated', repetitions: 1, route: 'selected', workers: { min: 2, max: 2 } },
      { case: 'managed-coordinated-parallel', dispatch: 'parallel-wave', mode: 'coordinated', repetitions: 1, route: 'selected', workers: { min: 2, max: 2 } },
    ])
    expect(plans.reduce((total, plan) => total + plan.repetitions, 0)).toBe(8)
    expect(plans.every(plan => plan.scheduling.concurrency === 1)).toBe(true)
  })

  it('runs matrix scenarios strictly serially with shared provider options and stops on failure', async () => {
    const calls: string[] = []
    const plans = buildReleaseProviderComparisonMatrixPlans(root, { baselineRef: 'v3.2.0' })
    let active = 0
    let maxActive = 0
    const result = await runReleaseProviderComparisonMatrix({
      baselineRef: 'v3.2.0',
      effort: 'medium',
      model: 'test-model',
      provider: 'test-provider',
      scenarioRunner: async (options) => {
        const plan = plans.find(entry => entry.case === options.caseId)!
        active += 1
        maxActive = Math.max(maxActive, active)
        calls.push([
          options.caseId,
          options.model,
          options.effort,
          options.provider,
        ].join(':'))
        await Promise.resolve()
        active -= 1
        return {
          jsonPath: 'report.json',
          markdownPath: 'report.md',
          summary: matrixScenarioSummary(
            plan,
            options.caseId === 'managed-delegated-integrated' ? 'failed' : 'passed',
          ),
        }
      },
    })

    expect(maxActive).toBe(1)
    expect(calls).toEqual([
      'auto-integrated-direct:test-model:medium:test-provider',
      'managed-solo-integrated:test-model:medium:test-provider',
      'managed-delegated-integrated:test-model:medium:test-provider',
    ])
    expect(result).toMatchObject({
      failedCase: 'managed-delegated-integrated',
      failure: 'scenario-failed',
      scenariosCompleted: 3,
      scenariosPlanned: 6,
      verdict: 'failed',
    })
  })

  it('fails fast when passed scenarios drift from the matrix-wide fixed identities', async () => {
    const plans = buildReleaseProviderComparisonMatrixPlans(root, { baselineRef: 'v3.2.0' })
    const calls: string[] = []
    const result = await runReleaseProviderComparisonMatrix({
      baselineRef: 'v3.2.0',
      scenarioRunner: async (options) => {
        const plan = plans.find(entry => entry.case === options.caseId)!
        calls.push(plan.case)
        const summary = matrixScenarioSummary(plan)
        if (plan.case === 'managed-solo-integrated')
          summary.identities.candidate.composition.hash = 'stale-composition'
        return { jsonPath: 'report.json', markdownPath: 'report.md', summary }
      },
    })

    expect(calls).toEqual(['auto-integrated-direct', 'managed-solo-integrated'])
    expect(result).toMatchObject({
      failedCase: 'managed-solo-integrated',
      failure: 'scenario-identity-drift',
      scenariosCompleted: 2,
      scenariosPlanned: 6,
      verdict: 'failed',
    })
  })

  it('pins the previous release, candidate, holdout, and harness before provider execution', () => {
    const plan = buildReleaseProviderComparisonPlan(root, { baselineRef: 'v3.2.0', repetitions: 3 })

    expect(plan.execution).toBe('serial-paired')
    expect(plan.scheduling).toEqual({
      concurrency: 1,
      order: 'alternating-ab-ba',
      maxPairAttempts: 5,
      maxContaminatedPairReplacements: 2,
    })
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

  it('does not relabel a runner timeout as infrastructure contamination without transport evidence', () => {
    expect(classifyProviderAttempt({
      infrastructureStatus: 'no-contamination-observed',
      outcome: 'failed',
      timedOut: true,
    })).toBe('model-failed')
    expect(classifyProviderAttempt({
      infrastructureStatus: 'contaminated',
      outcome: 'failed',
      timedOut: true,
    })).toBe('infra-contaminated')
  })

  it('executes balanced pairs strictly serially and replaces only contaminated pairs', async () => {
    const calls: string[] = []
    let active = 0
    let maxActive = 0
    const runs = await executeSerialProviderPairs({
      maxContaminatedPairReplacements: 2,
      repetitions: 3,
      runArm: async ({ arm, pairAttempt, position, targetPair }) => {
        active += 1
        maxActive = Math.max(maxActive, active)
        calls.push(`${targetPair}:${pairAttempt}:${position}:${arm}`)
        await Promise.resolve()
        active -= 1
        return {
          arm,
          classification: pairAttempt === 1 && arm === 'baseline' ? 'infra-contaminated' : 'eligible',
          outcome: 'passed',
        }
      },
    })

    expect(maxActive).toBe(1)
    expect(calls).toEqual([
      '1:1:1:baseline',
      '1:2:1:baseline',
      '1:2:2:candidate',
      '2:3:1:candidate',
      '2:3:2:baseline',
      '3:4:1:baseline',
      '3:4:2:candidate',
    ])
    expect(runs).toHaveLength(7)
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
    expect(readFileSync(result.markdownPath, 'utf8')).toContain('| 1 | 1 | 1 | baseline | model-failed | failed | invalid-evaluation-receipt |')
  })

  it('reports repeated median token deltas and arm noise without making an efficiency gate', () => {
    const plan = buildReleaseProviderComparisonPlan(root, { baselineRef: 'v3.2.0', repetitions: 3 })
    const runs = [
      {
        ...syntheticRun(plan, 'baseline', 1, 100),
        agent_reported: {
          evaluation_receipt: {
            case_id: plan.case,
            composition_sha256: plan.baseline.composition.hash,
            contract_sha256: plan.identities.contractSha256,
            receipt_sha256: 'a'.repeat(64),
          },
          observations: {
            trigger: { status: 'passed' },
            first_fix_result: 'passed',
            correction_count: 0,
            worker_dispatch_count: 1,
          },
        },
      },
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
      pairedDeltaPct: {
        total_tokens: {
          median: 20,
          min: -9.09,
          max: 22.22,
          range: 31.31,
          pairs: [
            { targetPair: 1, deltaPct: 20 },
            { targetPair: 2, deltaPct: -9.09 },
            { targetPair: 3, deltaPct: 22.22 },
          ],
        },
      },
    })
    expect(markdown).toContain('| total_tokens | 100 | 110 | 10% | 20% | 18.18% |')
    expect(markdown).toContain('| total_tokens | 1:20%, 2:-9.09%, 3:22.22% | 20% | -9.09% | 22.22% | 31.31% |')
    expect(markdown).toContain('## Agent-reported observations')
    expect(markdown).toContain('| 1 | baseline | passed | passed | 0 | 1 |')
    expect(JSON.stringify(summary)).not.toMatch(/"(?:model|provider|session|settings|workspace)"s*:/u)
  })

  it('excludes transport-contaminated pairs but keeps expensive clean pairs in efficiency statistics', () => {
    const plan = buildReleaseProviderComparisonPlan(root, { baselineRef: 'v3.2.0', repetitions: 3 })
    const contaminatedBaseline = {
      ...syntheticRun(plan, 'baseline', 1, 1000),
      pairAttempt: 1,
      pairId: 'pair-attempt-01',
      targetPair: 1,
      classification: 'infra-contaminated',
      infrastructure: { categories: ['rate-limit'], retryCount: 1, status: 'contaminated' },
    }
    const runs = [contaminatedBaseline]
    for (let repetition = 2; repetition <= 4; repetition += 1) {
      const targetPair = repetition - 1
      for (const arm of ['baseline', 'candidate'] as const) {
        runs.push({
          ...syntheticRun(plan, arm, repetition, targetPair === 1 ? 900 : 100),
          pairAttempt: repetition,
          pairId: `pair-attempt-0${repetition}`,
          targetPair,
          classification: 'eligible',
          infrastructure: { categories: [], retryCount: 0, status: 'no-contamination-observed' },
        })
      }
    }

    const summary = createReleaseProviderComparisonSummary(plan, runs)

    expect(summary.verdict).toBe('passed')
    expect(summary.infrastructure).toMatchObject({
      attemptedPairs: 4,
      contaminatedPairs: 1,
      eligiblePairs: 3,
      replacementPairs: 1,
    })
    expect(summary.efficiency.baseline.total_tokens).toMatchObject({ median: 100, max: 900 })
    expect(summary.runs).toContainEqual(expect.objectContaining({
      classification: 'infra-contaminated',
      measurements: expect.objectContaining({ tokens: expect.objectContaining({ total: 1000 }) }),
    }))
  })

  it('does not report an exhausted contaminated attempt as a completed replacement', () => {
    const plan = buildReleaseProviderComparisonPlan(root, { baselineRef: 'v3.2.0', repetitions: 3 })
    const run = {
      ...syntheticRun(plan, 'baseline', 1, null, { outcome: 'unavailable' }),
      classification: 'infra-contaminated',
      pairAttempt: 1,
      pairId: 'pair-attempt-01',
      targetPair: 1,
    }

    expect(createReleaseProviderComparisonSummary(plan, [run]).infrastructure).toMatchObject({
      contaminatedPairs: 1,
      replacementPairs: 0,
    })
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

  it('fails a structured routing-topology mismatch even when other dimensions pass', () => {
    const plan = buildReleaseProviderComparisonPlan(root, { baselineRef: 'v3.2.0', repetitions: 3 })
    const runs = []
    for (let repetition = 1; repetition <= 3; repetition += 1) {
      runs.push(syntheticRun(plan, 'baseline', repetition, 100))
      const candidate = syntheticRun(plan, 'candidate', repetition, 100)
      if (repetition === 1) {
        candidate.scenario = {
          ...candidate.scenario,
          observed: { ...candidate.scenario.observed, dispatch: 'sequential' },
          status: 'failed',
        }
      }
      runs.push(candidate)
    }

    const summary = createReleaseProviderComparisonSummary(plan, runs)
    expect(summary.verdict).toBe('failed')
    expect(summary.correctness.passed).toBe(false)
    expect(summary.runs).toContainEqual(expect.objectContaining({
      arm: 'candidate',
      scenario: expect.objectContaining({ status: 'failed' }),
    }))
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
    expect(summary.efficiency.pairedDeltaPct.total_tokens.median).toBeNull()
    expect(summary.efficiency.pairedDeltaPct.total_tokens.pairs).toContainEqual(
      expect.objectContaining({ targetPair: 2, deltaPct: null }),
    )
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

  it('replays intact raw evidence with the current harness and unchanged candidate gate', ({ onTestFinished }) => {
    const temporaryRoot = mkdtempSync(join(tmpdir(), 'rsp-release-provider-replay-'))
    onTestFinished(() => rmSync(temporaryRoot, { force: true, recursive: true }))
    const plan = buildReleaseProviderComparisonPlan(root, { baselineRef: 'v3.2.0', repetitions: 3 })
    const source = writeReplaySource(join(temporaryRoot, 'source'), plan)
    for (const run of source.report.runs) {
      run.agent_reported = null
      run.measurements.corrections = null
      run.measurements.first_fix_result = null
      run.measurements.worker_dispatch_count = null
    }
    writeFileSync(source.reportPath, `${JSON.stringify(source.report, null, 2)}\n`)

    const result = replayReleaseProviderComparison({
      baselineRef: 'v3.2.0',
      outputRoot: join(temporaryRoot, 'output'),
      repetitions: 3,
      sourceReportPath: source.reportPath,
    })

    expect(result.summary.verdict).toBe('passed')
    expect(result.summary.identities.harnessSha256).toBe(plan.identities.harnessSha256)
    expect(result.summary.replay).toEqual({
      mode: 'deterministic-replay',
      sourceCandidateCommit: source.report.identities.candidate.commit,
      sourceHarnessSha256: 'a'.repeat(64),
      sourceReportSha256: expect.stringMatching(/^[a-f0-9]{64}$/),
    })
    expect(result.summary.runs[0]).toMatchObject({
      agent_reported: { observations: { worker_dispatch_count: 2 } },
      measurements: { corrections: 0, first_fix_result: 'passed', worker_dispatch_count: 2 },
    })
    expect(assessReleaseProviderEvidence(plan, [{ path: result.jsonPath, report: result.summary }])).toMatchObject({
      state: 'reused',
      reportPath: result.jsonPath,
    })
    const serialized = readFileSync(result.jsonPath, 'utf8')
    expect(serialized).not.toContain(temporaryRoot)
    expect(serialized).not.toMatch(/"(?:model|provider|session|settings|workspace)"\s*:/u)
  })

  it('replays a configured one-pair scenario without weakening explicit repetition overrides', ({ onTestFinished }) => {
    const temporaryRoot = mkdtempSync(join(tmpdir(), 'rsp-release-provider-replay-one-pair-'))
    onTestFinished(() => rmSync(temporaryRoot, { force: true, recursive: true }))
    const plan = buildReleaseProviderComparisonPlan(root, {
      baselineRef: 'v3.2.0',
      caseId: 'managed-solo-integrated',
    })
    const source = writeReplaySource(join(temporaryRoot, 'source'), plan)

    const result = replayReleaseProviderComparison({
      baselineRef: 'v3.2.0',
      caseId: plan.case,
      outputRoot: join(temporaryRoot, 'output'),
      sourceReportPath: source.reportPath,
    })

    expect(plan.repetitions).toBe(1)
    expect(result.summary).toMatchObject({ case: 'managed-solo-integrated', repetitions: 1, verdict: 'passed' })
    expect(result.summary.runs).toHaveLength(2)
  })

  it.each([
    ['replacement attempts', ({ report }: ReturnType<typeof writeReplaySource>) => { report.infrastructure.replacementPairs = 1 }],
    ['candidate composition drift', ({ report }: ReturnType<typeof writeReplaySource>) => { report.identities.candidate.composition.hash = 'b'.repeat(64) }],
    ['tampered observation hash', ({ metadataPaths }: ReturnType<typeof writeReplaySource>) => {
      const metadata = JSON.parse(readFileSync(metadataPaths[0], 'utf8'))
      metadata.observation_sha256 = 'b'.repeat(64)
      writeFileSync(metadataPaths[0], `${JSON.stringify(metadata, null, 2)}\n`)
    }],
    ['tampered retained agent evidence', ({ report }: ReturnType<typeof writeReplaySource>) => {
      report.runs[0].agent_reported!.observations.worker_dispatch_count = 99
    }],
    ['missing final response', ({ metadataPaths }: ReturnType<typeof writeReplaySource>) => {
      unlinkSync(join(metadataPaths[0], '..', 'final.md'))
    }],
  ])('rejects unsafe replay source: %s', (_label, mutate) => {
    const temporaryRoot = mkdtempSync(join(tmpdir(), 'rsp-release-provider-replay-invalid-'))
    try {
      const plan = buildReleaseProviderComparisonPlan(root, { baselineRef: 'v3.2.0', repetitions: 3 })
      const source = writeReplaySource(join(temporaryRoot, 'source'), plan)
      mutate(source)
      writeFileSync(source.reportPath, `${JSON.stringify(source.report, null, 2)}\n`)

      expect(() => replayReleaseProviderComparison({
        baselineRef: 'v3.2.0',
        outputRoot: join(temporaryRoot, 'output'),
        repetitions: 3,
        sourceReportPath: source.reportPath,
      })).toThrow(/Release provider comparison invalid:/u)
    }
    finally {
      rmSync(temporaryRoot, { force: true, recursive: true })
    }
  })

  it('rejects provider execution options in replay mode before reading source evidence', () => {
    const result = spawnSync(process.execPath, [
      join(root, 'scripts', 'release-provider-comparison.mjs'),
      '--replay-report',
      'missing-report.json',
      '--baseline-ref',
      'v3.2.0',
      '--repetitions',
      '3',
      '--model',
      'must-not-run',
    ], { cwd: root, encoding: 'utf8' })

    expect(result.status).toBe(1)
    expect(result.stderr).toContain('--replay-report cannot be combined with provider execution option --model')
    expect(result.stderr).not.toContain('replay source report is missing')
  })
})
