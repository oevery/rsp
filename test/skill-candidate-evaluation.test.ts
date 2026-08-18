import type {
  BoundSkillEvaluationObservation,
  SkillEvaluationDimensionStatus,
  SkillEvaluationObservation,
  SkillEvaluationReceiptObservations,
} from '../scripts/skill-candidate-evaluation.mjs'
import { execFileSync, spawnSync } from 'node:child_process'
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { createSkillCandidateManifestFromManagedRuns, evaluateSkillCandidate, hashSkillEvaluationValue } from '../scripts/skill-candidate-evaluation.mjs'

const currentIdentity = '1'.repeat(64)
const candidateIdentity = '2'.repeat(64)
const contractIdentity = '3'.repeat(64)
const scriptPath = fileURLToPath(new URL('../scripts/skill-candidate-evaluation.mjs', import.meta.url))

function observation(
  statuses: Partial<Record<'trigger' | 'compliance' | 'boundary' | 'task_result', SkillEvaluationDimensionStatus>> = {},
  measurements: Record<string, any> = {},
): SkillEvaluationObservation {
  return {
    dimensions: {
      trigger: statuses.trigger === 'not-observed'
        ? { status: 'not-observed', evidence: null }
        : { status: statuses.trigger ?? 'passed', evidence: {} },
      compliance: { status: statuses.compliance ?? 'passed', evidence: {} },
      boundary: { status: statuses.boundary ?? 'passed', evidence: {} },
      task_result: { status: statuses.task_result ?? 'passed', evidence: {} },
    },
    measurements: {
      corrections: measurements.corrections ?? null,
      first_fix_result: measurements.first_fix_result ?? null,
      worker_dispatch_count: measurements.worker_dispatch_count ?? null,
      tool_calls: measurements.tool_calls ?? null,
      elapsed_ms: measurements.elapsed_ms ?? null,
      tokens: {
        input: measurements.tokens?.input ?? null,
        output: measurements.tokens?.output ?? null,
        total: measurements.tokens?.total ?? null,
      },
    },
    omissions: [],
  }
}

function boundObservation(
  caseId: string,
  compositionSha256: string,
  contractSha256: string,
  statuses: Partial<Record<'trigger' | 'compliance' | 'boundary' | 'task_result', SkillEvaluationDimensionStatus>> = {},
  measurements: Record<string, unknown> = {},
): BoundSkillEvaluationObservation {
  const observability = observation(statuses, measurements)
  const receiptObservations: SkillEvaluationReceiptObservations = {
    trigger: observability.dimensions.trigger.status === 'not-observed'
      ? null
      : { status: observability.dimensions.trigger.status as 'passed' | 'failed', evidence: {} },
    first_fix_result: measurements.first_fix_result === 'passed' || measurements.first_fix_result === 'failed'
      ? measurements.first_fix_result
      : null,
    correction_count: Number.isInteger(measurements.corrections) ? measurements.corrections as number : null,
    worker_dispatch_count: Number.isInteger(measurements.worker_dispatch_count)
      ? measurements.worker_dispatch_count as number
      : null,
  }
  const receipt = {
    case_id: caseId,
    composition_sha256: compositionSha256,
    contract_sha256: contractSha256,
    observations: receiptObservations,
  }
  return {
    case_id: caseId,
    composition_sha256: compositionSha256,
    contract_sha256: contractSha256,
    receipt_sha256: hashSkillEvaluationValue(receipt),
    observation_sha256: hashSkillEvaluationValue(observability),
    receipt_observations: receiptObservations,
    observability,
  }
}

describe('skill candidate no-regression evaluation', () => {
  it('marks a behavior-preserving candidate eligible and keeps cost deltas diagnostic', () => {
    const result = evaluateSkillCandidate({
      current_identity: { sha256: currentIdentity },
      candidate_identity: { sha256: candidateIdentity },
      cases: [
        {
          id: 'unseen-routing',
          contract_sha256: contractIdentity,
          unseen: true,
          current: boundObservation('unseen-routing', currentIdentity, contractIdentity, {}, {
            corrections: 1,
            first_fix_result: 'failed',
            worker_dispatch_count: 2,
            tool_calls: 5,
            elapsed_ms: 100,
            tokens: { input: 20, output: 5, total: 25 },
          }),
          candidate: boundObservation('unseen-routing', candidateIdentity, contractIdentity, {}, {
            corrections: 0,
            first_fix_result: 'passed',
            worker_dispatch_count: 3,
            tool_calls: 8,
            elapsed_ms: 120,
            tokens: { input: 24, output: 6, total: 30 },
          }),
        },
        {
          id: 'unseen-boundary',
          contract_sha256: '4'.repeat(64),
          unseen: true,
          current: boundObservation('unseen-boundary', currentIdentity, '4'.repeat(64)),
          candidate: boundObservation('unseen-boundary', candidateIdentity, '4'.repeat(64)),
        },
      ],
    })

    expect(result).toMatchObject({
      result: 'candidate-eligible',
      identities: { current: currentIdentity, candidate: candidateIdentity },
      regressions: [],
      candidate_failures: [],
      missing_evidence: [],
      authority: { mutate_skills: false, publish: false },
    })
    expect(result.cases.map(item => item.contract_sha256)).toEqual([
      contractIdentity,
      '4'.repeat(64),
    ])
    expect(result.cases[0].diagnostics.first_fix_result).toEqual({
      current: 'failed',
      candidate: 'passed',
      changed: true,
    })
    expect(result.cases[0].diagnostics.measurements).toMatchObject({
      corrections: { current: 1, candidate: 0, delta: -1 },
      worker_dispatch_count: { current: 2, candidate: 3, delta: 1 },
      tool_calls: { current: 5, candidate: 8, delta: 3 },
      elapsed_ms: { current: 100, candidate: 120, delta: 20 },
    })
    expect(result.cases[0].diagnostics.measurements['tokens.input']).toEqual({
      current: 20,
      candidate: 24,
      delta: 4,
    })
    expect(result.cases[0].diagnostics.measurements['tokens.output']).toEqual({
      current: 5,
      candidate: 6,
      delta: 1,
    })
    expect(result.cases[0].diagnostics.measurements['tokens.total']).toEqual({
      current: 25,
      candidate: 30,
      delta: 5,
    })
  })

  it('retains current and identifies exact hard regressions independently', () => {
    const result = evaluateSkillCandidate({
      current_identity: currentIdentity,
      candidate_identity: candidateIdentity,
      cases: [{
        id: 'unseen-regression',
        contract_sha256: contractIdentity,
        unseen: true,
        current: boundObservation('unseen-regression', currentIdentity, contractIdentity),
        candidate: boundObservation('unseen-regression', candidateIdentity, contractIdentity, { boundary: 'failed', task_result: 'failed' }),
      }],
    })

    expect(result.result).toBe('retain-current')
    expect(result.regressions).toEqual([
      { case_id: 'unseen-regression', dimension: 'boundary', current: 'passed', candidate: 'failed' },
      { case_id: 'unseen-regression', dimension: 'task_result', current: 'passed', candidate: 'failed' },
    ])
    expect(result.candidate_failures).toEqual([
      { case_id: 'unseen-regression', dimension: 'boundary', status: 'failed' },
      { case_id: 'unseen-regression', dimension: 'task_result', status: 'failed' },
    ])
  })

  it('fails closed with exact missing evidence and never converts diagnostics to zero', () => {
    const result = evaluateSkillCandidate({
      current_identity: currentIdentity,
      candidate_identity: currentIdentity,
      cases: [{
        id: 'known-incomplete',
        contract_sha256: contractIdentity,
        unseen: false,
        current: boundObservation('known-incomplete', currentIdentity, contractIdentity),
        candidate: boundObservation('known-incomplete', currentIdentity, contractIdentity, { trigger: 'not-observed' }),
      }],
    })

    expect(result.result).toBe('incomplete')
    expect(result.missing_evidence).toEqual([
      {
        case_id: null,
        variant: null,
        dimension: null,
        reason: 'current and candidate identities must be distinct',
      },
      {
        case_id: 'known-incomplete',
        variant: null,
        dimension: null,
        reason: 'case is not explicitly marked unseen',
      },
      {
        case_id: 'known-incomplete',
        variant: 'candidate',
        dimension: 'trigger',
        reason: 'required dimension is not observed',
      },
    ])
    expect(result.regressions).toContainEqual({
      case_id: 'known-incomplete',
      dimension: 'trigger',
      current: 'passed',
      candidate: 'not-observed',
    })
    expect(result.cases[0].diagnostics.measurements.tool_calls).toEqual({
      current: null,
      candidate: null,
      delta: null,
    })
  })

  it('rejects malformed identities and holdout sizes', () => {
    expect(() => evaluateSkillCandidate({
      current_identity: 'not-a-hash',
      candidate_identity: candidateIdentity,
      cases: [],
    })).toThrow('current identity must contain a lowercase SHA-256 hash')

    expect(() => evaluateSkillCandidate({
      current_identity: currentIdentity,
      candidate_identity: candidateIdentity,
      cases: Array.from({ length: 4 }, (_, index) => ({
        id: `case-${index}`,
        contract_sha256: contractIdentity,
        unseen: true,
        current: boundObservation(`case-${index}`, currentIdentity, contractIdentity),
        candidate: boundObservation(`case-${index}`, candidateIdentity, contractIdentity),
      })),
    })).toThrow('must contain one to three cases')
  })

  it('requires and retains one immutable acceptance-contract identity per case', () => {
    expect(() => evaluateSkillCandidate({
      current_identity: currentIdentity,
      candidate_identity: candidateIdentity,
      cases: [{
        id: 'missing-contract',
        contract_sha256: undefined as unknown as string,
        unseen: true,
        current: {} as BoundSkillEvaluationObservation,
        candidate: {} as BoundSkillEvaluationObservation,
      }],
    })).toThrow('cases[0] contract_sha256 must be a lowercase SHA-256 hash')

    expect(() => evaluateSkillCandidate({
      current_identity: currentIdentity,
      candidate_identity: candidateIdentity,
      cases: [{
        id: 'malformed-contract',
        contract_sha256: 'A'.repeat(64),
        unseen: true,
        current: {} as BoundSkillEvaluationObservation,
        candidate: {} as BoundSkillEvaluationObservation,
      }],
    })).toThrow('cases[0] contract_sha256 must be a lowercase SHA-256 hash')
  })

  it('rejects observations that are not bound to the manifest and receipt content', () => {
    const current = boundObservation('bound-case', currentIdentity, contractIdentity)
    const candidate = boundObservation('bound-case', candidateIdentity, contractIdentity)
    const manifest = {
      current_identity: currentIdentity,
      candidate_identity: candidateIdentity,
      cases: [{
        id: 'bound-case',
        contract_sha256: contractIdentity,
        unseen: true,
        current,
        candidate,
      }],
    }

    expect(() => evaluateSkillCandidate({
      ...manifest,
      cases: [{ ...manifest.cases[0], candidate: { ...candidate, composition_sha256: currentIdentity } }],
    })).toThrow('composition_sha256 must match its manifest identity')
    expect(() => evaluateSkillCandidate({
      ...manifest,
      cases: [{ ...manifest.cases[0], candidate: { ...candidate, receipt_sha256: '0'.repeat(64) } }],
    })).toThrow('receipt_sha256 does not match its receipt content')
    expect(() => evaluateSkillCandidate({
      ...manifest,
      cases: [{ ...manifest.cases[0], candidate: { ...candidate, observation_sha256: '0'.repeat(64) } }],
    })).toThrow('observation_sha256 does not match its observability content')
    const contradictoryObservability = {
      ...candidate.observability,
      measurements: {
        ...candidate.observability.measurements,
        corrections: 2,
      },
    }
    expect(() => evaluateSkillCandidate({
      ...manifest,
      cases: [{
        ...manifest.cases[0],
        candidate: {
          ...candidate,
          observability: contradictoryObservability,
          observation_sha256: hashSkillEvaluationValue(contradictoryObservability),
        },
      }],
    })).toThrow('observability corrections does not match its receipt observation')
  })

  it('runs deterministically without mutating the manifest or neighboring evidence', ({ onTestFinished }) => {
    const directory = mkdtempSync(join(tmpdir(), 'rsp-skill-candidate-'))
    onTestFinished(() => rmSync(directory, { force: true, recursive: true }))
    const manifestPath = join(directory, 'manifest.json')
    const retainedPath = join(directory, 'retained-summary.json')
    const manifest = JSON.stringify({
      current_identity: currentIdentity,
      candidate_identity: candidateIdentity,
      cases: [{
        id: 'unseen-cli',
        contract_sha256: contractIdentity,
        unseen: true,
        current: boundObservation('unseen-cli', currentIdentity, contractIdentity),
        candidate: boundObservation('unseen-cli', candidateIdentity, contractIdentity),
      }],
    }, null, 2)
    writeFileSync(manifestPath, manifest)
    writeFileSync(retainedPath, '{\"immutable\":true}\n')
    const pathsBefore = readdirSync(directory).sort()
    const retainedBefore = readFileSync(retainedPath, 'utf8')

    const first = execFileSync(process.execPath, [scriptPath, manifestPath], { encoding: 'utf8' })
    const second = execFileSync(process.execPath, [scriptPath, manifestPath], { encoding: 'utf8' })

    expect(JSON.parse(first).result).toBe('candidate-eligible')
    expect(second).toBe(first)
    expect(readFileSync(manifestPath, 'utf8')).toBe(manifest)
    expect(readFileSync(retainedPath, 'utf8')).toBe(retainedBefore)
    expect(readdirSync(directory).sort()).toEqual(pathsBefore)
  })

  it('uses result-aware process exit codes for CI gating', ({ onTestFinished }) => {
    const directory = mkdtempSync(join(tmpdir(), 'rsp-skill-candidate-exit-'))
    onTestFinished(() => rmSync(directory, { force: true, recursive: true }))
    const run = (name: string, manifest: unknown) => {
      const manifestPath = join(directory, `${name}.json`)
      writeFileSync(manifestPath, JSON.stringify(manifest))
      return spawnSync(process.execPath, [scriptPath, manifestPath], { encoding: 'utf8' })
    }
    const base = {
      current_identity: currentIdentity,
      candidate_identity: candidateIdentity,
      cases: [{
        id: 'unseen-cli-gate',
        contract_sha256: contractIdentity,
        unseen: true,
        current: boundObservation('unseen-cli-gate', currentIdentity, contractIdentity),
        candidate: boundObservation('unseen-cli-gate', candidateIdentity, contractIdentity),
      }],
    }

    const eligible = run('eligible', base)
    const retained = run('retained', {
      ...base,
      cases: [{
        ...base.cases[0],
        candidate: boundObservation('unseen-cli-gate', candidateIdentity, contractIdentity, { boundary: 'failed' }),
      }],
    })
    const incomplete = run('incomplete', {
      ...base,
      current_identity: candidateIdentity,
      cases: [{
        ...base.cases[0],
        current: boundObservation('unseen-cli-gate', candidateIdentity, contractIdentity),
      }],
    })
    const malformed = run('malformed', {
      ...base,
      cases: [{ ...base.cases[0], contract_sha256: 'missing' }],
    })

    expect(eligible.status).toBe(0)
    expect(JSON.parse(eligible.stdout).result).toBe('candidate-eligible')
    expect(retained.status).not.toBe(0)
    expect(JSON.parse(retained.stdout).result).toBe('retain-current')
    expect(incomplete.status).not.toBe(0)
    expect(JSON.parse(incomplete.stdout).result).toBe('incomplete')
    expect(malformed.status).not.toBe(0)
    expect(malformed.stdout).toBe('')
    expect(malformed.stderr).toContain('contract_sha256 must be a lowercase SHA-256 hash')
  })

  it('creates and persists one comparison from structured managed-run receipts', ({ onTestFinished }) => {
    const directory = mkdtempSync(join(tmpdir(), 'rsp-managed-run-candidate-'))
    onTestFinished(() => rmSync(directory, { force: true, recursive: true }))
    const managedMetadata = (identity: string, toolCalls: number) => {
      const bound = boundObservation('managed-unseen', identity, contractIdentity, {}, {
        corrections: 0,
        first_fix_result: 'passed',
        worker_dispatch_count: 1,
        tool_calls: toolCalls,
      })
      return {
        case_id: bound.case_id,
        contract_sha256: bound.contract_sha256,
        evaluation_receipt: {
          case_id: bound.case_id,
          composition_sha256: bound.composition_sha256,
          contract_sha256: bound.contract_sha256,
          receipt_sha256: bound.receipt_sha256,
        },
        receipt_observations: bound.receipt_observations,
        observation_sha256: bound.observation_sha256,
        observability: bound.observability,
      }
    }
    const current = managedMetadata(currentIdentity, 5)
    const candidate = managedMetadata(candidateIdentity, 4)
    const manifest = createSkillCandidateManifestFromManagedRuns(current, candidate)
    expect(evaluateSkillCandidate(manifest).result).toBe('candidate-eligible')

    const currentPath = join(directory, 'current.json')
    const candidatePath = join(directory, 'candidate.json')
    const outputPath = join(directory, 'comparison.json')
    writeFileSync(currentPath, JSON.stringify(current))
    writeFileSync(candidatePath, JSON.stringify(candidate))
    const run = spawnSync(process.execPath, [
      scriptPath,
      'managed-runs',
      currentPath,
      candidatePath,
      '--output',
      outputPath,
    ], { encoding: 'utf8' })
    expect(run.status).toBe(0)
    expect(JSON.parse(run.stdout)).toMatchObject({ result: 'candidate-eligible' })
    expect(JSON.parse(readFileSync(outputPath, 'utf8'))).toMatchObject({
      manifest: { current_identity: { sha256: currentIdentity }, candidate_identity: { sha256: candidateIdentity } },
      result: { result: 'candidate-eligible' },
    })
  })

  it('compares current agent-reported managed-run metadata without a legacy projection', () => {
    const managedMetadata = (identity: string, toolCalls: number) => {
      const bound = boundObservation('managed-agent-reported', identity, contractIdentity, {}, {
        corrections: 0,
        first_fix_result: 'passed',
        worker_dispatch_count: 1,
        tool_calls: toolCalls,
      })
      const sourceObservability = observation({ trigger: 'not-observed' }, { tool_calls: toolCalls })
      return {
        agent_reported: {
          evaluation_receipt: {
            case_id: bound.case_id,
            composition_sha256: bound.composition_sha256,
            contract_sha256: bound.contract_sha256,
            receipt_sha256: bound.receipt_sha256,
          },
          observations: bound.receipt_observations,
        },
        case_id: bound.case_id,
        contract_sha256: bound.contract_sha256,
        duration_ms: 100,
        events: { tool_calls: toolCalls, usage: { input_tokens: 20, output_tokens: 5 } },
        evaluation_receipt: null,
        observation_sha256: hashSkillEvaluationValue(sourceObservability),
        observability: sourceObservability,
        output: { expected_missing: [], forbidden_present: [] },
        receipt_observations: null,
        result: 'passed',
        worktree: { unauthorized_paths: [] },
      }
    }

    const manifest = createSkillCandidateManifestFromManagedRuns(
      managedMetadata(currentIdentity, 5),
      managedMetadata(candidateIdentity, 4),
    )

    expect(evaluateSkillCandidate(manifest)).toMatchObject({
      result: 'candidate-eligible',
      regressions: [],
      candidate_failures: [],
      missing_evidence: [],
    })
    expect(manifest.cases[0].current.observability.dimensions.trigger.status).toBe('passed')
    expect(manifest.cases[0].current.observability.measurements).toMatchObject({
      corrections: 0,
      first_fix_result: 'passed',
      worker_dispatch_count: 1,
    })
  })

  it('fails closed when legacy and agent-reported managed-run evidence conflict', () => {
    const legacy = boundObservation('managed-conflict', candidateIdentity, contractIdentity)
    const reported = boundObservation('managed-conflict', currentIdentity, contractIdentity)
    const metadata = {
      agent_reported: {
        evaluation_receipt: {
          case_id: reported.case_id,
          composition_sha256: reported.composition_sha256,
          contract_sha256: reported.contract_sha256,
          receipt_sha256: reported.receipt_sha256,
        },
        observations: reported.receipt_observations,
      },
      case_id: reported.case_id,
      contract_sha256: reported.contract_sha256,
      duration_ms: 100,
      events: { tool_calls: 1, usage: {} },
      evaluation_receipt: {
        case_id: legacy.case_id,
        composition_sha256: legacy.composition_sha256,
        contract_sha256: legacy.contract_sha256,
        receipt_sha256: legacy.receipt_sha256,
      },
      observation_sha256: hashSkillEvaluationValue(legacy.observability),
      observability: legacy.observability,
      output: { expected_missing: [], forbidden_present: [] },
      receipt_observations: legacy.receipt_observations,
      result: 'passed',
      worktree: { unauthorized_paths: [] },
    }

    expect(() => createSkillCandidateManifestFromManagedRuns(metadata, metadata))
      .toThrow('metadata contains conflicting legacy and agent-reported evaluation evidence')
  })
})
