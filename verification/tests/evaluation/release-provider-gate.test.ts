import { describe, expect, it } from 'vitest'
import { normalizeFakeProviderRun, runFakeProviderGate } from '../../../scripts/release-provider-gate-eval.mjs'

describe('fake provider release gate contract', () => {
  it('uses canonical usage fields without inferring missing provider usage', () => {
    expect(normalizeFakeProviderRun({ config: { api_key: 'redacted', temperature: 0 }, usage: { input_tokens: 10, output_tokens: 5 } })).toMatchObject({ config_provenance: ['temperature'], usage: { input_tokens: 10, output_tokens: 5, total_tokens: 15, status: 'verified', source: 'fake-provider' } })
    expect(normalizeFakeProviderRun({ usage: {} }).usage).toMatchObject({ total_tokens: null, status: 'unverified', confidence: 0 })
  })

  it('compares fake baseline and candidate arms and emits the real-provider boundary', () => {
    const result = runFakeProviderGate({ baseline: { model: 'fake-baseline', usage: { input_tokens: 10, output_tokens: 2 } }, candidate: { model: 'fake-candidate', usage: { input_tokens: 11, output_tokens: 3 } } })
    expect(result).toMatchObject({ mode: 'fake', real_provider: false, score: { status: 'passed' } })
    expect(result.follow_up).toContain('separately authorized Change')
  })

  it('keeps fake capacity failures as deterministic incomplete infrastructure', () => {
    const result = runFakeProviderGate({ baseline: {}, candidate: {}, trace: { unavailable: [{ reason: 'capacity', status: 'unavailable' }], host_observed: { recovery: 'not-observed' } } })
    expect(result.score.status).toBe('incomplete')
    expect(result.real_provider).toBe(false)
  })
})
