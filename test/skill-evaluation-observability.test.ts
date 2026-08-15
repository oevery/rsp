import { describe, expect, it } from 'vitest'
import { projectSkillEvaluationObservability } from '../scripts/skill-evaluation-observability.mjs'

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
      measurements: {
        corrections: null,
        tool_calls: 4,
        elapsed_ms: 1200,
        tokens: { input: 100, output: 25, total: 125 },
      },
      omissions: [
        'trigger observation is unavailable',
        'correction count is unavailable',
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
      tool_calls: null,
      elapsed_ms: null,
      tokens: { input: null, output: null, total: null },
    })
    expect(result.omissions).toContain('total-token count is unavailable')
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

  it('retains an explicit harness trigger observation', () => {
    const result = projectSkillEvaluationObservability({
      triggerObservation: { status: 'passed', evidence: { selected_skill: 'rsp-review' } },
    })

    expect(result.dimensions.trigger).toEqual({
      status: 'passed',
      evidence: { selected_skill: 'rsp-review' },
    })
    expect(result.omissions).not.toContain('trigger observation is unavailable')
  })
})
