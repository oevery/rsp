import { describe, expect, it } from 'vitest'
import vitestConfig from '../../../vitest.config.js'

describe('deterministic test collection', () => {
  it('collects repository tests without executing evaluation or acceptance fixtures', () => {
    expect(vitestConfig.test?.include).toEqual(['verification/tests/**/*.test.{ts,tsx}'])
    expect(vitestConfig.test?.exclude).toEqual(expect.arrayContaining([
      'verification/tests/**/fixtures/**',
      'verification/tests/**/holdout/**',
    ]))
  })
})
