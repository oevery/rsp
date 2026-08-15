import type {
  ManagedControllerBetaRunMetadata,
  ManagedControllerBetaRunSummary,
} from '../scripts/managed-controller-beta.mjs'
import { createHash } from 'node:crypto'
import {
  cpSync,
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  realpathSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  assertManagedControllerBetaOutputBoundary,
  createManagedControllerBetaSummary,
  loadManagedControllerBetaPlan,
  summarizeManagedControllerBetaComparison,
  summarizeManagedControllerBetaRun,
} from '../scripts/managed-controller-beta.mjs'
import { evaluateManagedController, runManagedControllerEvaluation } from '../scripts/managed-controller-eval.mjs'
import { hashSkillEvaluationValue } from '../scripts/skill-candidate-evaluation.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))

function hashContent(content: string) {
  return createHash('sha256').update(content).digest('hex')
}

function observabilityOf(summary: unknown) {
  return (summary as { observability: unknown }).observability
}

function copyBetaContractProject(target: string) {
  for (const path of [
    ['test', 'managed-controller', 'beta'],
    ['test', 'managed-controller', 'holdout', 'auto-multisurface-routing'],
    ['skills', 'rsp'],
    ['skills', 'rsp-manage'],
    ['skills', 'rsp-implement'],
    ['research', 'evaluations', 'rsp-manage', '2026-08-04-manage-orchestration-beta'],
  ]) {
    const source = join(root, ...path)
    const destination = join(target, ...path)
    mkdirSync(join(destination, '..'), { recursive: true })
    cpSync(source, destination, { recursive: true })
  }
}

describe('managed-controller beta evidence', () => {
  it('locks one baseline/product holdout before execution', () => {
    const plan = loadManagedControllerBetaPlan(root)

    expect(plan.id).toBe('manage-orchestration-beta')
    expect(plan.case).toBe('auto-multisurface-routing')
    expect(plan.variants).toEqual(['baseline', 'product'])
    expect(plan.holdout_manifest_sha256).toMatch(/^[a-f0-9]{64}$/)
    expect(plan.base_tree_sha256).toMatch(/^[a-f0-9]{64}$/)
    expect(plan.product_skill_names).toEqual(['rsp', 'rsp-manage', 'rsp-implement'])
    expect(plan.product_composition).toEqual({
      hash: plan.product_composition_sha256,
      skills: [
        { name: 'rsp', hash: expect.stringMatching(/^[a-f0-9]{64}$/) },
        { name: 'rsp-manage', hash: expect.stringMatching(/^[a-f0-9]{64}$/) },
        { name: 'rsp-implement', hash: expect.stringMatching(/^[a-f0-9]{64}$/) },
      ],
    })
    expect(plan.prior_retained_evidence).toEqual([
      {
        path: 'research/evaluations/rsp-manage/2026-08-04-manage-orchestration-beta/report.md',
        sha256: '4c4d7ff94bbdfbfc6988e9d264cff05de89a37f6dcc9e19f555536ba02011dc1',
      },
      {
        path: 'research/evaluations/rsp-manage/2026-08-04-manage-orchestration-beta/summary.json',
        sha256: '2cbbde60883e17dd0bee50c0214c3a13cc6626d04b2dc5d26ed89dd1f498de8e',
      },
    ])
    expect(plan.observations).toEqual([
      'completion outcome',
      'first-fix result where observable',
      'worker or tool dispatch count where observable',
      'verification rounds',
      'elapsed time where observable',
      'human-intervention outcome',
    ])
    expect(plan.conclusion_limits).toContain('no numeric promotion threshold')
    expect(plan.conclusion_limits).toContain('unavailable measurements remain explicit omissions')
  })

  it('fails closed when product names, product composition, or prior retained evidence drift', ({ onTestFinished }) => {
    const directory = mkdtempSync(join(tmpdir(), 'rsp-manage-beta-locks-'))
    onTestFinished(() => rmSync(directory, { force: true, recursive: true }))
    copyBetaContractProject(directory)

    const manifestPath = join(directory, 'test', 'managed-controller', 'holdout', 'auto-multisurface-routing', 'case.yaml')
    const manifest = readFileSync(manifestPath, 'utf8')
    writeFileSync(manifestPath, manifest.replace('  - rsp-implement\n', ''))
    expect(() => loadManagedControllerBetaPlan(directory)).toThrow(
      'beta product_skill_names must exactly match holdout installed_skills',
    )

    writeFileSync(manifestPath, manifest)
    const skillPath = join(directory, 'skills', 'rsp-implement', 'SKILL.md')
    writeFileSync(skillPath, `${readFileSync(skillPath, 'utf8')}\ncomposition drift\n`)
    expect(() => loadManagedControllerBetaPlan(directory)).toThrow('beta product composition drifted')

    copyBetaContractProject(directory)
    const reportPath = join(
      directory,
      'research',
      'evaluations',
      'rsp-manage',
      '2026-08-04-manage-orchestration-beta',
      'report.md',
    )
    writeFileSync(reportPath, `${readFileSync(reportPath, 'utf8')}\nretained evidence drift\n`)
    expect(() => loadManagedControllerBetaPlan(directory)).toThrow('beta prior retained evidence drifted')
  })

  it('rejects retained evidence symlinks even when their content hash matches', ({ onTestFinished }) => {
    const directory = mkdtempSync(join(tmpdir(), 'rsp-manage-beta-retained-symlink-'))
    onTestFinished(() => rmSync(directory, { force: true, recursive: true }))
    copyBetaContractProject(directory)

    const retainedDirectory = join(
      directory,
      'research',
      'evaluations',
      'rsp-manage',
      '2026-08-04-manage-orchestration-beta',
    )
    const reportPath = join(retainedDirectory, 'report.md')
    const reportCopyPath = join(retainedDirectory, 'report-copy.md')
    writeFileSync(reportCopyPath, readFileSync(reportPath))
    rmSync(reportPath)
    symlinkSync(reportCopyPath, reportPath)

    expect(() => loadManagedControllerBetaPlan(directory)).toThrow(
      'must be a regular non-symlink file',
    )
  })

  it('rejects output aliases into prior evidence before creating descendants', ({ onTestFinished }) => {
    const directory = mkdtempSync(join(tmpdir(), 'rsp-manage-beta-output-alias-'))
    onTestFinished(() => rmSync(directory, { force: true, recursive: true }))
    copyBetaContractProject(directory)

    const plan = loadManagedControllerBetaPlan(directory)
    const retainedDirectory = join(
      directory,
      'research',
      'evaluations',
      'rsp-manage',
      '2026-08-04-manage-orchestration-beta',
    )
    const aliasPath = join(directory, 'retained-alias')
    const nestedOutput = join(aliasPath, 'new-generation')
    symlinkSync(retainedDirectory, aliasPath, 'dir')

    expect(() => assertManagedControllerBetaOutputBoundary(
      plan,
      aliasPath,
      directory,
    )).toThrow('beta output resolves inside prior retained evidence generation')
    expect(() => assertManagedControllerBetaOutputBoundary(
      plan,
      nestedOutput,
      directory,
    )).toThrow('beta output resolves inside prior retained evidence generation')
    expect(existsSync(join(retainedDirectory, 'new-generation'))).toBe(false)
  })

  it('protects the prior generation and records sanitized current product identity', ({ onTestFinished }) => {
    const plan = loadManagedControllerBetaPlan(root)
    expect(() => assertManagedControllerBetaOutputBoundary(
      plan,
      join(root, 'research', 'evaluations', 'rsp-manage', '2026-08-04-manage-orchestration-beta'),
      root,
    )).toThrow('beta output resolves inside prior retained evidence generation')
    const directory = mkdtempSync(join(tmpdir(), 'rsp-manage-beta-safe-output-'))
    onTestFinished(() => rmSync(directory, { force: true, recursive: true }))
    const safeOutput = join(directory, 'new-generation')
    expect(assertManagedControllerBetaOutputBoundary(plan, safeOutput, root)).toBe(
      realpathSync(safeOutput),
    )

    const deterministic = evaluateManagedController(root)
    const summary = createManagedControllerBetaSummary(plan, deterministic, [])
    expect(summary.deterministic_contracts).toEqual({ passed: true, cases: 22 })
    expect(summary.product_composition).toEqual(plan.product_composition)
    expect(Object.keys(summary.product_composition)).toEqual(['hash', 'skills'])
    expect(summary.product_composition.skills.map(skill => Object.keys(skill))).toEqual([
      ['name', 'hash'],
      ['name', 'hash'],
      ['name', 'hash'],
    ])
    expect(JSON.stringify(summary.product_composition)).not.toContain(root)
    expect(JSON.stringify(summary)).not.toContain('token')
  })

  it('retains only bounded aggregate observations and truthful omissions', ({ onTestFinished }) => {
    const directory = mkdtempSync(join(tmpdir(), 'rsp-manage-beta-contract-'))
    onTestFinished(() => rmSync(directory, { force: true, recursive: true }))
    const eventsPath = join(directory, 'events.jsonl')
    writeFileSync(eventsPath, `${JSON.stringify({
      type: 'item.completed',
      item: { type: 'command_execution', command: 'npm test' },
    })}\n`)
    const summary = summarizeManagedControllerBetaRun(
      loadManagedControllerBetaPlan(root),
      {
        variant: 'product',
        result: 'passed',
        duration_ms: 1234,
        events: {
          tool_calls: 4,
          usage: { input_tokens: 100, output_tokens: 20 },
        },
        output: { expected_missing: [], forbidden_present: [] },
        recovery: { passed: true },
        paths: { events: eventsPath },
        verification: { passed: true },
        worktree: { unauthorized_paths: [] },
        settings: { model: 'must-not-leak', provider: 'must-not-leak' },
      } as never,
      'Receiver acceptance remains unavailable.',
    )

    expect(summary).toMatchObject({
      outcome: 'passed',
      tool_calls: 4,
      verification_rounds: { agent_observed: 1, harness: 1, harness_passed: true },
      human_intervention_outcome: 'required-after-automated-work',
      first_fix_result: null,
      worker_dispatch_count: null,
    })
    expect(Object.keys(summary)).toEqual([
      'variant',
      'outcome',
      'completion',
      'first_fix_result',
      'worker_dispatch_count',
      'tool_calls',
      'verification_rounds',
      'elapsed_ms',
      'human_intervention_outcome',
      'omissions',
      'output_contract',
      'recovery_contract',
      'unauthorized_paths',
      'evaluation_receipt',
      'observation_sha256',
      'observability',
    ])
    expect(summary.omissions).toContain(
      'first-fix result is not emitted as a structured receipt observation',
    )
    expect(observabilityOf(summary)).toMatchObject({
      dimensions: {
        trigger: { status: 'not-observed' },
        compliance: { status: 'passed' },
        boundary: { status: 'passed' },
        task_result: { status: 'passed' },
      },
      measurements: {
        corrections: null,
        first_fix_result: null,
        worker_dispatch_count: null,
        tool_calls: 4,
        elapsed_ms: 1234,
        tokens: { input: 100, output: 20, total: 120 },
      },
    })
    expect(JSON.stringify(summary)).not.toContain('must-not-leak')
  })

  it('projects only explicit structured receipt observations', ({ onTestFinished }) => {
    const directory = mkdtempSync(join(tmpdir(), 'rsp-manage-beta-receipt-'))
    onTestFinished(() => rmSync(directory, { force: true, recursive: true }))
    const eventsPath = join(directory, 'events.jsonl')
    writeFileSync(eventsPath, `${JSON.stringify({ type: 'turn.completed' })}\n`)
    const plan = loadManagedControllerBetaPlan(root)
    const receiptObservations = {
      correction_count: 1,
      first_fix_result: 'failed',
      trigger: { status: 'passed', evidence: { selected_skill: 'rsp-manage' } },
      worker_dispatch_count: 2,
    } as const
    const receipt = {
      case_id: plan.case,
      composition_sha256: plan.product_composition.hash,
      contract_sha256: plan.holdout_manifest_sha256,
      observations: receiptObservations,
    }
    const observability = {
      dimensions: {
        trigger: { status: 'passed' as const, evidence: { selected_skill: 'rsp-manage' } },
        compliance: { status: 'passed' as const, evidence: { expected_missing: [] } },
        boundary: { status: 'passed' as const, evidence: { forbidden_present: [], unauthorized_paths: [] } },
        task_result: { status: 'passed' as const, evidence: { outcome: 'passed' } },
      },
      measurements: {
        corrections: 1,
        first_fix_result: 'failed' as const,
        worker_dispatch_count: 2,
        tool_calls: 9,
        elapsed_ms: 500,
        tokens: { input: 30, output: 10, total: 40 },
      },
      omissions: [],
    }
    const metadata: ManagedControllerBetaRunMetadata = {
      case_id: plan.case,
      contract_sha256: plan.holdout_manifest_sha256,
      variant: 'product',
      result: 'passed',
      duration_ms: 500,
      events: {
        tool_calls: 9,
        usage: { input_tokens: 30, output_tokens: 10 },
      },
      output: { expected_missing: [], forbidden_present: [] },
      paths: { events: eventsPath },
      composition: { installed_before: plan.product_composition },
      evaluation_receipt: {
        case_id: receipt.case_id,
        composition_sha256: receipt.composition_sha256,
        contract_sha256: receipt.contract_sha256,
        receipt_sha256: hashSkillEvaluationValue(receipt),
      },
      observation_sha256: hashSkillEvaluationValue(observability),
      observability,
      receipt_observations: receiptObservations,
      verification: { passed: true },
      worktree: { unauthorized_paths: [] },
    }

    const summary = summarizeManagedControllerBetaRun(
      plan,
      metadata,
      'Completed after one correction.',
    )

    expect(summary.first_fix_result).toBe('failed')
    expect(summary.worker_dispatch_count).toBe(2)
    expect(summary.tool_calls).toBe(9)
    expect(observabilityOf(summary)).toMatchObject({
      dimensions: { trigger: { status: 'passed' } },
      measurements: {
        corrections: 1,
        first_fix_result: 'failed',
        worker_dispatch_count: 2,
        tool_calls: 9,
      },
    })
    expect(summary.omissions).not.toContain(
      'first-fix result is not emitted as a structured receipt observation',
    )
    expect(summary.omissions).not.toContain(
      'worker dispatch count is not emitted as a structured receipt observation',
    )

    const contradictoryObservability = {
      ...observability,
      measurements: { ...observability.measurements, corrections: 2 },
    }
    expect(() => summarizeManagedControllerBetaRun(
      plan,
      {
        ...metadata,
        observability: contradictoryObservability,
        observation_sha256: hashSkillEvaluationValue(contradictoryObservability),
      },
      'Completed after one correction.',
    )).toThrow('managed-controller producer.observability corrections does not match its receipt observation')
  })

  it('consumes a producer receipt end to end with typed beta metadata', async ({ onTestFinished }) => {
    const outputRoot = mkdtempSync(join(tmpdir(), 'rsp-manage-beta-producer-'))
    onTestFinished(() => rmSync(outputRoot, { force: true, recursive: true }))
    const plan = loadManagedControllerBetaPlan(root)
    const produced = await runManagedControllerEvaluation({
      caseId: plan.case,
      codexBin: join(root, 'test', 'skill-behavior', 'fake-codex.mjs'),
      effort: 'high',
      env: { ...process.env, FAKE_CODEX_RECEIPT_MODE: 'valid' },
      model: 'test-model',
      outputRoot,
      root,
      timeoutMs: 5000,
      variant: 'product',
    })
    expect(produced.variant).toBe('product')
    const metadata: ManagedControllerBetaRunMetadata = {
      ...produced,
      variant: 'product',
    }
    const final = readFileSync(produced.paths.final, 'utf8')
    const summary: ManagedControllerBetaRunSummary = summarizeManagedControllerBetaRun(
      plan,
      metadata,
      final,
    )

    expect(metadata.evaluation_receipt).toMatchObject({
      case_id: plan.case,
      composition_sha256: plan.product_composition.hash,
      contract_sha256: plan.holdout_manifest_sha256,
      receipt_sha256: expect.stringMatching(/^[a-f0-9]{64}$/),
    })
    expect(metadata.observation_sha256).toMatch(/^[a-f0-9]{64}$/)
    expect(summary.evaluation_receipt).toEqual(metadata.evaluation_receipt)
    expect(summary.observation_sha256).toBe(metadata.observation_sha256)
    expect(summary.first_fix_result).toBe('passed')
    expect(summary.worker_dispatch_count).toBe(2)
    expect(summary.observability.dimensions.trigger.status).toBe('passed')
    expect(existsSync(join(produced.paths.workspace, '.rsp-evaluation-receipt.json'))).toBe(false)
    expect(produced.worktree.changed_paths).not.toContain('.rsp-evaluation-receipt.json')
  })

  it('records unavailable model execution without requiring a final response', ({ onTestFinished }) => {
    const directory = mkdtempSync(join(tmpdir(), 'rsp-manage-beta-unavailable-'))
    onTestFinished(() => rmSync(directory, { force: true, recursive: true }))
    const eventsPath = join(directory, 'events.jsonl')
    writeFileSync(eventsPath, `${JSON.stringify({
      type: 'turn.failed',
      error: { message: 'usage limit reached' },
    })}\n`)

    const plan = loadManagedControllerBetaPlan(root)
    const producerObservability = {
      dimensions: {
        trigger: { status: 'not-observed' as const, evidence: null },
        compliance: { status: 'failed' as const, evidence: { expected_missing: ['npm test'] } },
        boundary: { status: 'passed' as const, evidence: { forbidden_present: [], unauthorized_paths: [] } },
        task_result: { status: 'failed' as const, evidence: { outcome: 'failed' } },
      },
      measurements: {
        corrections: null,
        first_fix_result: null,
        worker_dispatch_count: null,
        tool_calls: 0,
        elapsed_ms: 100,
        tokens: { input: null, output: null, total: null },
      },
      omissions: [
        'trigger observation is unavailable',
        'correction count is unavailable',
        'first-fix result is unavailable',
        'worker dispatch count is unavailable',
        'input-token count is unavailable',
        'output-token count is unavailable',
        'total-token count is unavailable',
      ],
    }
    const summary = summarizeManagedControllerBetaRun(
      plan,
      {
        case_id: plan.case,
        contract_sha256: plan.holdout_manifest_sha256,
        variant: 'product',
        result: 'failed',
        duration_ms: 100,
        events: { tool_calls: 0 },
        output: { expected_missing: ['npm test'], forbidden_present: [] },
        composition: { installed_before: plan.product_composition },
        evaluation_receipt: null,
        observation_sha256: hashSkillEvaluationValue(producerObservability),
        observability: producerObservability,
        receipt_observations: null,
        paths: { events: eventsPath },
        verification: { passed: false },
        worktree: { unauthorized_paths: [] },
      },
      '',
    )

    expect(summary).toMatchObject({
      outcome: 'unavailable',
      completion: 'not-observed',
      tool_calls: 0,
    })
    expect(summary.omissions).toContain('model execution capability is unavailable')
    expect(summary.omissions).toContain('final response was not produced')
    expect(observabilityOf(summary)).toMatchObject({
      dimensions: { task_result: { status: 'not-observed' } },
    })
  })

  it('does not infer capability failure from ordinary command output', ({ onTestFinished }) => {
    const directory = mkdtempSync(join(tmpdir(), 'rsp-manage-beta-command-output-'))
    onTestFinished(() => rmSync(directory, { force: true, recursive: true }))
    const eventsPath = join(directory, 'events.jsonl')
    writeFileSync(eventsPath, [
      JSON.stringify({
        type: 'item.completed',
        item: {
          type: 'command_execution',
          command: 'rg unavailable docs',
          aggregated_output: 'Historical report: model execution capability is unavailable.',
        },
      }),
      JSON.stringify({ type: 'turn.completed' }),
      '',
    ].join('\n'))

    const summary = summarizeManagedControllerBetaRun(
      loadManagedControllerBetaPlan(root),
      {
        variant: 'baseline',
        result: 'passed',
        events: { tool_calls: 1 },
        output: { expected_missing: [], forbidden_present: [] },
        paths: { events: eventsPath },
        verification: { passed: true },
        worktree: { unauthorized_paths: [] },
      },
      'Receiver acceptance remains unavailable.',
    )

    expect(summary.outcome).toBe('passed')
    expect(summary.completion).toBe('contract-passed')
    expect(summary.omissions).not.toContain('model execution capability is unavailable')
  })

  it('keeps unavailable or not-run evidence incomplete and retains only complete product evidence', () => {
    const comparison = summarizeManagedControllerBetaComparison([
      { variant: 'baseline', outcome: 'unavailable' },
      { variant: 'product', outcome: 'not-run' },
    ])
    const retainedSummary = JSON.parse(readFileSync(
      join(root, 'research', 'evaluations', 'rsp-manage', '2026-08-04-manage-orchestration-beta', 'summary.json'),
      'utf8',
    ))
    const retainedReport = readFileSync(
      join(root, 'research', 'evaluations', 'rsp-manage', '2026-08-04-manage-orchestration-beta', 'report.md'),
      'utf8',
    )

    expect(comparison).toEqual({
      status: 'incomplete',
      reason: 'baseline was unavailable',
    })
    expect(retainedSummary.comparison).toEqual({
      status: 'complete',
      reason: null,
    })
    expect(retainedSummary.runs.find((run: { variant: string }) => run.variant === 'baseline')).toMatchObject({
      outcome: 'passed',
      completion: 'contract-passed',
      unauthorized_paths: [],
    })
    expect(retainedSummary.runs.find((run: { variant: string }) => run.variant === 'product')).toMatchObject({
      outcome: 'passed',
      completion: 'contract-passed',
      unauthorized_paths: [],
    })
    expect(retainedReport).toContain('Comparison: complete for this one holdout')
  })

  it('retains the canonical-control-model generation without changing prior evidence', () => {
    const priorDirectory = join(
      root,
      'research',
      'evaluations',
      'rsp-manage',
      '2026-08-04-manage-orchestration-beta',
    )
    const generationDirectory = join(
      root,
      'research',
      'evaluations',
      'rsp-manage',
      '2026-08-04-manage-orchestration-beta-control-model',
    )
    const priorReport = readFileSync(join(priorDirectory, 'report.md'), 'utf8')
    const priorSummary = readFileSync(join(priorDirectory, 'summary.json'), 'utf8')
    const report = readFileSync(join(generationDirectory, 'report.md'), 'utf8')
    const rawSummary = readFileSync(join(generationDirectory, 'summary.json'), 'utf8')
    const summary = JSON.parse(rawSummary)

    expect(hashContent(priorReport)).toBe(
      '4c4d7ff94bbdfbfc6988e9d264cff05de89a37f6dcc9e19f555536ba02011dc1',
    )
    expect(hashContent(priorSummary)).toBe(
      '2cbbde60883e17dd0bee50c0214c3a13cc6626d04b2dc5d26ed89dd1f498de8e',
    )
    expect(hashContent(rawSummary)).toBe(
      '058666619aef4511399a9b2822e60fab8f5565069adfeff78a4406617f1d3838',
    )
    expect(summary.product_composition.hash).toBe(
      'ee2e26aee295ea182add2102d928f016e58685cd3e53d3447d92f13268688b76',
    )
    expect(evaluateManagedController(root)).toHaveLength(22)
    expect(summary.deterministic_contracts).toEqual({
      passed: true,
      cases: 19,
    })
    expect(summary.comparison).toEqual({ status: 'complete', reason: null })
    expect(summary.runs).toEqual([
      expect.objectContaining({
        variant: 'baseline',
        outcome: 'passed',
        completion: 'contract-passed',
        tool_calls: 7,
        verification_rounds: {
          agent_observed: 2,
          harness: 1,
          harness_passed: true,
        },
        elapsed_ms: 176774,
        human_intervention_outcome: 'required-after-automated-work',
        output_contract: { expected_missing: [], forbidden_present: [] },
        recovery_contract: expect.objectContaining({ passed: true }),
        unauthorized_paths: [],
      }),
      expect.objectContaining({
        variant: 'product',
        outcome: 'passed',
        completion: 'contract-passed',
        tool_calls: 11,
        verification_rounds: {
          agent_observed: 3,
          harness: 1,
          harness_passed: true,
        },
        elapsed_ms: 501178,
        human_intervention_outcome: 'required-after-automated-work',
        output_contract: { expected_missing: [], forbidden_present: [] },
        recovery_contract: expect.objectContaining({ passed: true }),
        unauthorized_paths: [],
      }),
    ])
    expect(rawSummary).not.toMatch(/"(?:model|provider|session|settings|token|usage|workspace)"\s*:/u)
    expect(rawSummary).not.toContain('/tmp/')
    expect(report).toContain('model `ocx/gpt-5.6-terra`')
    expect(report).toContain('all 19 current')
    expect(report).toContain('Receiver-device acceptance remained explicitly unavailable')
    expect(report).toContain('complete only for this one holdout')
    expect(report).toContain('remains unchanged historical evidence')
    expect(report).toContain('no activation or release change')
    expect(report).toContain('no provider-general or real-host-general conclusion')
  })

  it('retains the control-boundary generation under the new prompt identity', () => {
    const generationDirectory = join(
      root,
      'research',
      'evaluations',
      'rsp-manage',
      '2026-08-05-manage-orchestration-beta-control-boundaries',
    )
    const report = readFileSync(join(generationDirectory, 'report.md'), 'utf8')
    const rawSummary = readFileSync(join(generationDirectory, 'summary.json'), 'utf8')
    const summary = JSON.parse(rawSummary)

    expect(hashContent(report)).toBe(
      'e139483e4c6f2b9112b24db565c82e744458abe4dbef91060c10182bcc57bad3',
    )
    expect(hashContent(rawSummary)).toBe(
      '3d73b203716992a087f1148018fddb03136456c4e01cbdff7723b8570615848b',
    )
    expect(summary.product_composition.hash).toBe(
      'ff9d3e73086d7067fa2c65f8e569a369266ea15d6a70d3971665ca84d8c2be41',
    )
    expect(evaluateManagedController(root)).toHaveLength(22)
    expect(summary.deterministic_contracts).toEqual({
      passed: true,
      cases: 19,
    })
    expect(summary.runs).toEqual([
      expect.objectContaining({
        variant: 'baseline',
        outcome: 'passed',
        completion: 'contract-passed',
        tool_calls: 8,
        verification_rounds: {
          agent_observed: 1,
          harness: 1,
          harness_passed: true,
        },
        elapsed_ms: 116236,
        unauthorized_paths: [],
      }),
      expect.objectContaining({
        variant: 'product',
        outcome: 'passed',
        completion: 'contract-passed',
        tool_calls: 6,
        verification_rounds: {
          agent_observed: 1,
          harness: 1,
          harness_passed: true,
        },
        elapsed_ms: 231695,
        unauthorized_paths: [],
      }),
    ])
    expect(rawSummary).not.toMatch(/"(?:model|provider|session|settings|token|usage|workspace)"\s*:/u)
    expect(report).toContain('model `ocx/gpt-5.6-terra`')
    expect(report).toContain('all 19 current')
    expect(report).toContain('Receiver-device acceptance remained explicitly unavailable')
    expect(report).toContain('complete only for this one holdout')
    expect(report).toContain('remain unchanged historical evidence')
    expect(report).toContain('no activation or release change')
  })

  it('retains the focused-context-flow generation under an isolated evaluation identity', () => {
    const generationDirectory = join(
      root,
      'research',
      'evaluations',
      'rsp-manage',
      '2026-08-14-manage-orchestration-beta-context-flow',
    )
    const report = readFileSync(join(generationDirectory, 'report.md'), 'utf8')
    const rawSummary = readFileSync(join(generationDirectory, 'summary.json'), 'utf8')
    const summary = JSON.parse(rawSummary)

    expect(hashContent(report)).toBe(
      '481ff3532dd8b03be43a93bb59b342d2def7f7e6ed0fe69121781a29d780e12b',
    )
    expect(hashContent(rawSummary)).toBe(
      'a49fb8f172c9e39572288bd03c365f88316ad5984ab474e50882e930c4ecdd0a',
    )
    expect(summary.product_composition.hash).toBe(
      'b7b0871abce0ea7e591585d7bae9170ff16d16f2a8c2756121bf0b23991363da',
    )
    expect(summary.deterministic_contracts).toEqual({
      passed: true,
      cases: 21,
    })
    expect(evaluateManagedController(root)).toHaveLength(22)
    expect(summary.runs).toEqual([
      expect.objectContaining({
        variant: 'baseline',
        outcome: 'passed',
        completion: 'contract-passed',
        tool_calls: 6,
        verification_rounds: {
          agent_observed: 2,
          harness: 1,
          harness_passed: true,
        },
        elapsed_ms: 107621,
        unauthorized_paths: [],
      }),
      expect.objectContaining({
        variant: 'product',
        outcome: 'passed',
        completion: 'contract-passed',
        tool_calls: 8,
        verification_rounds: {
          agent_observed: 2,
          harness: 1,
          harness_passed: true,
        },
        elapsed_ms: 146161,
        unauthorized_paths: [],
      }),
    ])
    expect(rawSummary).not.toMatch(/"(?:model|provider|session|settings|token|usage|workspace)"\s*:/u)
    expect(rawSummary).not.toContain('/tmp/')
    expect(report).toContain('model `combo/gpt-5.6-terra`')
    expect(report).toContain('isolated provider-only user context')
    expect(report).toContain('all 21 current controller contracts passed')
    expect(report).toContain('both variants reported automatic route `selected`')
    expect(report).toContain('not a token or latency improvement claim')
    expect(report).toContain('every earlier generation remains unchanged historical evidence')
    expect(report).toContain('no activation or release change')
  })
})
