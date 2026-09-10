import { describe, expect, it } from 'vitest'

import { scoreDesignReturn } from '../../../scripts/d2-paired-correction-eval.mjs'

describe('d2 paired deterministic correction evidence', () => {
  it('requires every project-design return-envelope field', () => {
    const score = scoreDesignReturn('未决问题：owner?\n权威输入：CONTEXT.md')

    expect(score.missing_fields).toEqual([
      'expected-artifact',
      'mutation-boundary',
      'same-returning-work-ref',
    ])
    expect(score.deterministic_correction_requests).toBe(3)
  })
})
