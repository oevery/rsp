import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { parse as parseYaml } from 'yaml'

const root = fileURLToPath(new URL('..', import.meta.url))
const fixtures = join(root, 'test', 'rsp-design-behavior', 'fixtures')

describe('rsp-design behavior fixtures', () => {
  it('covers each design mode and authority restraint', () => {
    const cases = Object.fromEntries(readdirSync(fixtures)
      .filter(name => name.endsWith('.yaml'))
      .map((name) => {
        const value = parseYaml(readFileSync(join(fixtures, name), 'utf8')) as Record<string, any>
        return [value.name, value]
      }))

    expect(Object.keys(cases).sort()).toEqual([
      'authorized-reversible-probe',
      'domain-ownership',
      'missing-authority',
      'module-seam',
    ])
    expect(cases['domain-ownership'].expect.reference).toBe('domain-modeling')
    expect(cases['domain-ownership'].evidence).toContain('existing-production-consumer')
    expect(cases['module-seam'].expect.reference).toBe('module-seams')
    expect(cases['module-seam'].evidence).toContain('direct-production-consumer')
    expect(cases['authorized-reversible-probe'].expect.reference).toBe('reversible-exploration')
    expect(cases['authorized-reversible-probe'].expect.sequence).toEqual([
      'record-pre-probe-state',
      'run-minimum-observation',
      'capture-evidence',
      'remove-disposable-artifacts',
      'verify-cleanup',
    ])
    expect(cases['missing-authority'].expect.result).toBe('blocked')
    expect(cases['missing-authority'].expect.owner).toBe('unresolved')
    expect(cases['missing-authority'].expect.forbidden).toContain('artifact-mutation')
    expect([
      cases['domain-ownership'],
      cases['module-seam'],
      cases['authorized-reversible-probe'],
    ].every((value: any) => value.expect.owner === 'same-selected-change')).toBe(true)
    expect(Object.values(cases).every((value: any) => value.expect.forbidden.includes('production-implementation'))).toBe(true)
  })
})
