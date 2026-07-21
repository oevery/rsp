import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { parse as parseYaml } from 'yaml'

const root = fileURLToPath(new URL('..', import.meta.url))
const fixtures = join(root, 'test', 'rsp-tdd-behavior', 'fixtures')

describe('rsp-tdd behavior fixtures', () => {
  it('covers the happy path and shortcut-resistant stops', () => {
    const cases = Object.fromEntries(readdirSync(fixtures)
      .filter(name => name.endsWith('.yaml'))
      .map((name) => {
        const value = parseYaml(readFileSync(join(fixtures, name), 'utf8')) as Record<string, any>
        return [value.name, value]
      }))

    expect(Object.keys(cases).sort()).toEqual(['clear-behavior', 'invalid-red', 'unexplained-failure'])
    expect(cases['clear-behavior'].expect.sequence).toEqual([
      'observed-red',
      'minimal-green',
      'optional-safe-refactor',
      'fresh-required-checks',
    ])
    expect(cases['clear-behavior'].expect.forbidden).toContain('production-before-red')
    expect(cases['unexplained-failure'].expect.route).toBe('diagnosis')
    expect(cases['unexplained-failure'].expect.forbidden).toContain('guessed-regression-test')
    expect(cases['invalid-red'].expect.result).toBe('red-not-established')
    expect(cases['invalid-red'].expect.forbidden).toContain('production-mutation')
    expect(Object.values(cases).every((value: any) => value.expect.owner === 'same-selected-change')).toBe(true)
  })
})
