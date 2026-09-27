import { describe, expect, it } from 'vitest'
import { discoverCases, loadCase } from '../../evals/runner/cases.mjs'

const root = process.cwd()

describe('evaluation engine', () => {
  it('discovers only explicit case manifests and keeps their evidence local', () => {
    const cases = discoverCases(root)
    expect(cases.map(entry => entry.manifest.id)).toEqual(expect.arrayContaining([
      'preserve-user-files',
      'trigger-rsp-review',
    ]))
    expect(new Set(cases.map(entry => entry.manifest.id)).size).toBe(cases.length)
    expect(cases.every(entry => entry.manifestPath.startsWith(`${root}/evals/cases/`))).toBe(true)
  })

  it('loads a case by its public identity and rejects unknown cases', () => {
    const entry = loadCase(root, 'preserve-user-files')
    expect(entry.manifest.kind).toBe('behavior')
    expect(entry.manifest.skill).toBe('rsp-implement')
    expect(() => loadCase(root, 'missing-case')).toThrow('Unknown evaluation case')
  })
})
