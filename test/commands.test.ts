import { describe, expect, it } from 'vitest'
import { SPEC_NAME_RE } from '../src/core/helpers.js'

describe('additional spec name validation', () => {
  it('allows simple kebab-case names', () => {
    expect(SPEC_NAME_RE.test('my-feature')).toBe(true)
    expect(SPEC_NAME_RE.test('login')).toBe(true)
    expect(SPEC_NAME_RE.test('feature-123')).toBe(true)
  })

  it('allows subdirectory names', () => {
    expect(SPEC_NAME_RE.test('auth/login')).toBe(true)
    expect(SPEC_NAME_RE.test('auth/oauth/login')).toBe(true)
    expect(SPEC_NAME_RE.test('payments/checkout')).toBe(true)
  })

  it('rejects empty string', () => {
    expect(SPEC_NAME_RE.test('')).toBe(false)
  })

  it('rejects consecutive slashes', () => {
    expect(SPEC_NAME_RE.test('auth//login')).toBe(false)
  })

  it('rejects leading slash', () => {
    expect(SPEC_NAME_RE.test('/auth/login')).toBe(false)
  })

  it('rejects trailing slash', () => {
    expect(SPEC_NAME_RE.test('auth/login/')).toBe(false)
  })

  it('rejects uppercase letters', () => {
    expect(SPEC_NAME_RE.test('Auth/Login')).toBe(false)
    expect(SPEC_NAME_RE.test('AUTH')).toBe(false)
  })

  it('rejects spaces', () => {
    expect(SPEC_NAME_RE.test('my feature')).toBe(false)
    expect(SPEC_NAME_RE.test('auth/ my feature')).toBe(false)
  })

  it('rejects special characters', () => {
    expect(SPEC_NAME_RE.test('auth/login!')).toBe(false)
    expect(SPEC_NAME_RE.test('feature.name')).toBe(false)
    expect(SPEC_NAME_RE.test('feature_underscore')).toBe(false)
  })
})
