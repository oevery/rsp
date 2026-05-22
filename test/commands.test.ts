import { describe, expect, it } from 'vitest'

const VALID_NAME_RE = /^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/

describe('new-feature name validation', () => {
  it('allows simple kebab-case names', () => {
    expect(VALID_NAME_RE.test('my-feature')).toBe(true)
    expect(VALID_NAME_RE.test('login')).toBe(true)
    expect(VALID_NAME_RE.test('feature-123')).toBe(true)
  })

  it('allows subdirectory names', () => {
    expect(VALID_NAME_RE.test('auth/login')).toBe(true)
    expect(VALID_NAME_RE.test('auth/oauth/login')).toBe(true)
    expect(VALID_NAME_RE.test('payments/checkout')).toBe(true)
  })

  it('rejects empty string', () => {
    expect(VALID_NAME_RE.test('')).toBe(false)
  })

  it('rejects consecutive slashes', () => {
    expect(VALID_NAME_RE.test('auth//login')).toBe(false)
  })

  it('rejects leading slash', () => {
    expect(VALID_NAME_RE.test('/auth/login')).toBe(false)
  })

  it('rejects trailing slash', () => {
    expect(VALID_NAME_RE.test('auth/login/')).toBe(false)
  })

  it('rejects uppercase letters', () => {
    expect(VALID_NAME_RE.test('Auth/Login')).toBe(false)
    expect(VALID_NAME_RE.test('AUTH')).toBe(false)
  })

  it('rejects spaces', () => {
    expect(VALID_NAME_RE.test('my feature')).toBe(false)
    expect(VALID_NAME_RE.test('auth/ my feature')).toBe(false)
  })

  it('rejects special characters', () => {
    expect(VALID_NAME_RE.test('auth/login!')).toBe(false)
    expect(VALID_NAME_RE.test('feature.name')).toBe(false)
    expect(VALID_NAME_RE.test('feature_underscore')).toBe(false)
  })
})
