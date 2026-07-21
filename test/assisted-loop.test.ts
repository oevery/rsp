import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { evaluateAssistedLoop, loadAssistedLoopCases } from '../scripts/assisted-loop-eval.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))

describe('rsp assisted engineering loop', () => {
  it('covers the tightened 3.0 gate with eight host-neutral scenarios', () => {
    const cases = loadAssistedLoopCases(root)

    expect(cases.map(item => item.id)).toEqual([
      'authority-restraint',
      'handoff-recovery',
      'implementation-diagnosis',
      'implementation-known-cause',
      'implementation-tdd',
      'missing-discipline-fallback',
      'review-fix-rereview',
      'shape-nontrivial-intent',
    ])
    expect(new Set(cases.map(item => item.stage))).toEqual(new Set([
      'authority',
      'handoff',
      'implementation',
      'review-resolution',
      'shaping',
    ]))
    for (const item of cases) {
      expect(item.evidence.length).toBeGreaterThan(0)
      expect(item.expected.next_action.length).toBeGreaterThan(0)
      expect(item.expected.returned_owner.length).toBeGreaterThan(0)
      expect(item.sources.every(source => source.startsWith('skills/'))).toBe(true)
      expect(item.prohibited_actions).toEqual(expect.arrayContaining(['commit', 'push', 'publish']))
    }
  })

  it('finds every required contract in the canonical published skills', () => {
    const results = evaluateAssistedLoop(root)
    const failures = results.filter(result => !result.passed)

    expect(failures, JSON.stringify(failures, null, 2)).toEqual([])
  })
})
