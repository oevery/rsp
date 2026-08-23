import { describe, expect, it } from 'vitest'
// @ts-expect-error Maintainer-only script has no standalone declaration contract.
import { projectSkillEvaluationObservability } from '../../scripts/skill-evaluation-observability.mjs'

describe('skill evaluation observability', () => {
  it('separates successful compliance, boundary, and task evidence from unobserved triggering', () => {
    expect(projectSkillEvaluationObservability({
      elapsedMs: 1200,
      outcome: 'passed',
      outputContract: { expected_missing: [], forbidden_present: [] },
      toolCalls: 4,
      unauthorizedPaths: [],
      usage: { input_tokens: 100, output_tokens: 25 },
    })).toEqual({
      dimensions: {
        trigger: { status: 'not-observed', evidence: null },
        compliance: { status: 'passed', evidence: { expected_missing: [] } },
        boundary: { status: 'passed', evidence: { forbidden_present: [], unauthorized_paths: [] } },
        task_result: { status: 'passed', evidence: { outcome: 'passed' } },
      },
      resources: {
        expected_resources: null,
        observed_resources: null,
        unexpected_resources: null,
        missing_resources: null,
      },
      measurements: {
        corrections: null,
        first_fix_result: null,
        worker_dispatch_count: null,
        tool_calls: 4,
        elapsed_ms: 1200,
        model_invocations: null,
        tool_output_bytes: null,
        tokens: {
          cache_write_input: null,
          cached_input: null,
          input: 100,
          output: 25,
          reasoning_output: null,
          total: 125,
          uncached_input: null,
        },
      },
      omissions: [
        'trigger observation is unavailable',
        'correction count is unavailable',
        'first-fix result is unavailable',
        'worker dispatch count is unavailable',
        'model-invocation count is unavailable',
        'tool-output byte count is unavailable',
      ],
    })
  })

  it('keeps unavailable measurements null instead of fabricating zeros', () => {
    const result = projectSkillEvaluationObservability({ outcome: 'unavailable' })

    expect(result.dimensions).toEqual({
      trigger: { status: 'not-observed', evidence: null },
      compliance: { status: 'not-observed', evidence: null },
      boundary: { status: 'not-observed', evidence: null },
      task_result: { status: 'not-observed', evidence: { outcome: 'unavailable' } },
    })
    expect(result.measurements).toEqual({
      corrections: null,
      first_fix_result: null,
      worker_dispatch_count: null,
      tool_calls: null,
      elapsed_ms: null,
      model_invocations: null,
      tool_output_bytes: null,
      tokens: {
        cache_write_input: null,
        cached_input: null,
        input: null,
        output: null,
        reasoning_output: null,
        total: null,
        uncached_input: null,
      },
    })
    expect(result.omissions).toContain('total-token count is unavailable')
  })

  it('separates cached and uncached input while retaining unavailable host telemetry', () => {
    const result = projectSkillEvaluationObservability({
      modelInvocations: 3,
      toolOutputBytes: 4096,
      usage: {
        cache_write_input_tokens: 50,
        cached_input_tokens: 700,
        input_tokens: 1000,
        output_tokens: 40,
        reasoning_output_tokens: 12,
      },
    })

    expect(result.measurements).toMatchObject({
      model_invocations: 3,
      tool_output_bytes: 4096,
      tokens: {
        cache_write_input: 50,
        cached_input: 700,
        input: 1000,
        output: 40,
        reasoning_output: 12,
        total: 1040,
        uncached_input: 300,
      },
    })
    expect(result.omissions).not.toContain('model-invocation count is unavailable')
    expect(result.omissions).not.toContain('tool-output byte count is unavailable')
  })

  it('attributes compliance, boundary, and task failures independently', () => {
    const result = projectSkillEvaluationObservability({
      outcome: 'failed',
      outputContract: {
        expected_missing: ['required verification'],
        forbidden_present: ['publication claim'],
      },
      unauthorizedPaths: ['src/unrelated.ts'],
    })

    expect(result.dimensions).toMatchObject({
      trigger: { status: 'not-observed' },
      compliance: { status: 'failed' },
      boundary: { status: 'failed' },
      task_result: { status: 'failed' },
    })
  })

  it('retains explicit structured harness receipt observations independently', () => {
    const result = projectSkillEvaluationObservability({
      receiptObservations: {
        trigger: { status: 'passed', evidence: { selected_skill: 'rsp-review' } },
        first_fix_result: 'passed',
        correction_count: 2,
        worker_dispatch_count: 3,
      },
    })

    expect(result.dimensions.trigger).toEqual({
      status: 'passed',
      evidence: { selected_skill: 'rsp-review' },
    })
    expect(result.measurements).toMatchObject({
      corrections: 2,
      first_fix_result: 'passed',
      worker_dispatch_count: 3,
    })
    expect(result.omissions).not.toContain('trigger observation is unavailable')
    expect(result.omissions).not.toContain('correction count is unavailable')
    expect(result.omissions).not.toContain('first-fix result is unavailable')
    expect(result.omissions).not.toContain('worker dispatch count is unavailable')
  })

  it('does not accept legacy fields or infer receipt observations from task success and tool calls', () => {
    const result = projectSkillEvaluationObservability({
      corrections: 0,
      outcome: 'passed',
      toolCalls: 7,
      triggerObservation: { status: 'passed', evidence: { selected_skill: 'rsp-manage' } },
    })

    expect(result.dimensions.trigger.status).toBe('not-observed')
    expect(result.dimensions.task_result.status).toBe('passed')
    expect(result.measurements).toMatchObject({
      corrections: null,
      first_fix_result: null,
      worker_dispatch_count: null,
      tool_calls: 7,
    })
  })

  it('derives missing and unexpected references only from declared and observed resource paths', () => {
    const result = projectSkillEvaluationObservability({
      expectedResources: [
        'rsp/references/managed-routing.md',
        'rsp-manage/references/interruption-recovery.md',
      ],
      observedResources: [
        'rsp/references/managed-routing.md',
        'rsp/references/managed-routing.md',
        'rsp-manage/references/closeout.md',
      ],
    })

    expect(result.resources).toEqual({
      expected_resources: [
        'rsp-manage/references/interruption-recovery.md',
        'rsp/references/managed-routing.md',
      ],
      observed_resources: [
        'rsp-manage/references/closeout.md',
        'rsp/references/managed-routing.md',
      ],
      unexpected_resources: ['rsp-manage/references/closeout.md'],
      missing_resources: ['rsp-manage/references/interruption-recovery.md'],
    })
  })

  it('keeps unavailable reference observation distinct from an observed empty set', () => {
    const unavailable = projectSkillEvaluationObservability({
      expectedResources: ['rsp/references/managed-routing.md'],
    })
    const observedEmpty = projectSkillEvaluationObservability({
      expectedResources: ['rsp/references/managed-routing.md'],
      observedResources: [],
    })

    expect(unavailable.resources).toMatchObject({
      observed_resources: null,
      missing_resources: null,
    })
    expect(unavailable.omissions).toContain('reference-load observation is unavailable')
    expect(observedEmpty.resources).toMatchObject({
      observed_resources: [],
      unexpected_resources: [],
      missing_resources: ['rsp/references/managed-routing.md'],
    })
    expect(observedEmpty.omissions).not.toContain('reference-load observation is unavailable')
  })

  it('fails closed instead of retaining absolute, traversing, or non-reference resource paths', () => {
    for (const observedResources of [
      ['/private/workspace/.agents/skills/rsp/references/managed-routing.md'],
      ['rsp/references/../SKILL.md'],
      ['rsp/SKILL.md'],
    ]) {
      const result = projectSkillEvaluationObservability({
        expectedResources: ['rsp/references/managed-routing.md'],
        observedResources,
      })
      expect(result.resources.observed_resources).toBeNull()
      expect(result.resources.missing_resources).toBeNull()
      expect(result.omissions).toContain('reference-load observation is unavailable')
    }
  })
})
