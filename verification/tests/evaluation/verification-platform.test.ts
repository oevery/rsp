import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import {
  assertVerificationProviderMode,
  createVerificationRunRecord,
  loadVerificationTopology,
} from '../../../scripts/verification-platform.mjs'

const root = fileURLToPath(new URL('../../..', import.meta.url))

describe('verification platform', () => {
  it('loads the shared topology and reports distinct layer ownership', () => {
    const topology = loadVerificationTopology(root)

    expect(Object.keys(topology.by_layer).sort()).toEqual(['acceptance', 'evaluation', 'test'])
    expect(topology.scenarios.every(scenario => scenario.fixture_refs.length > 0 && scenario.required_evidence.length > 0)).toBe(true)
    expect(topology.by_layer.acceptance.every(scenario => scenario.execution_mode === 'disposable-project')).toBe(true)
  })

  it('records simulation without promoting it to acceptance', () => {
    const topology = loadVerificationTopology(root)
    const evaluation = topology.by_layer.evaluation[0]
    const acceptance = topology.by_layer.acceptance[0]

    expect(createVerificationRunRecord({ scenario: evaluation, verdict: 'passed', disposition: 'unverified' })).toMatchObject({
      execution_mode: 'local',
      disposition: 'unverified',
    })
    expect(() => createVerificationRunRecord({ scenario: acceptance, executionMode: 'simulated', verdict: 'passed' })).toThrow('cannot record simulated execution for acceptance')
  })

  it('fails closed for real provider execution', () => {
    expect(() => assertVerificationProviderMode('real-provider')).toThrow('real provider execution is disabled')
  })
})
