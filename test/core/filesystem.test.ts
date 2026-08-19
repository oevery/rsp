import { describe, expect, it } from 'vitest'
import { normalizeLogicalPath } from '../../src/core/filesystem.js'

describe('normalizeLogicalPath', () => {
  it('normalizes backslashes to forward slashes', () => {
    expect(normalizeLogicalPath('auth\\login')).toBe('auth/login')
  })
})
