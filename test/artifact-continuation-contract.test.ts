import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { parse as parseYaml } from 'yaml'

const root = fileURLToPath(new URL('..', import.meta.url))
const fixtureRoot = join(root, 'test', 'artifact-continuation', 'fixtures')

interface ContractCase {
  id: string
  sources: string[]
  required_contract: string[]
  all_sources_contract?: string[]
  language_contract?: {
    response_labels: string
    artifact_prose: string
    canonical_tokens: string[]
  }
  prohibited_actions: string[]
}

function loadCases(): ContractCase[] {
  return readdirSync(fixtureRoot)
    .filter(name => name.endsWith('.yaml'))
    .sort()
    .map(name => parseYaml(readFileSync(join(fixtureRoot, name), 'utf8')) as ContractCase)
}

describe('rsp artifact routing and continuation contract', () => {
  it('covers durable routing, interruption recovery, and Git-conflict restraint', () => {
    const cases = loadCases()

    expect(cases.map(item => item.id).sort()).toEqual([
      'conflict-restraint',
      'durable-routing',
      'interrupted-continuation',
    ])
    expect(cases.every(item => item.sources.length > 0)).toBe(true)
    expect(cases.every(item => item.required_contract.length > 0)).toBe(true)
    expect(cases.every(item => item.prohibited_actions.includes('commit') || item.id !== 'conflict-restraint')).toBe(true)
  })

  it('finds each semantic contract in its canonical sources', () => {
    for (const item of loadCases()) {
      const bodies = item.sources.map(source => readFileSync(join(root, source), 'utf8'))
      const combined = bodies.join('\n')

      for (const contract of item.required_contract)
        expect(combined, `${item.id}: ${contract}`).toContain(contract)

      for (const contract of item.all_sources_contract ?? []) {
        for (const [index, body] of bodies.entries())
          expect(body, `${item.id}: ${item.sources[index]}: ${contract}`).toContain(contract)
      }
    }
  })

  it('keeps continuation recoverable without creating another durable owner', () => {
    const core = readFileSync(join(root, 'skills', 'rsp', 'SKILL.md'), 'utf8')
    const fallback = readFileSync(join(root, 'rules', 'rsp-rules.md'), 'utf8')

    expect(core).toContain('reopen every authority pointer')
    expect(core).toContain('refresh any verification')
    expect(core).toContain('Never create hidden handoff/controller state')
    expect(fallback).toContain('it is not durable truth or a second state store')
  })

  it('converges Changes before archive and gates persistent artifact audience', () => {
    const shape = readFileSync(join(root, 'skills', 'rsp-shape', 'SKILL.md'), 'utf8')
    const fallback = readFileSync(join(root, 'rules', 'rsp-rules.md'), 'utf8')

    for (const body of [shape, fallback]) {
      expect(body).toMatch(/convergent current-plan(?: and |\/)final-evidence snapshot/)
      expect(body).toContain('not an append-only execution log')
      expect(body).toMatch(/replace superseded/i)
      expect(body).toContain('final decisive')
      expect(body).toContain('in the response')
      expect(body).toContain('Before archive')
      expect(body).toContain('real product actors')
      expect(body).toMatch(/domain(?:, system, user, or operator)? language/)
    }

    expect(shape).toContain('not authors or execution narrators')
    expect(fallback).toContain('hypothetical future agent')
    expect(fallback).toContain('Ordinary implementation is the default')
    expect(fallback).toContain('Retain a new test only when it protects observable behavior or a real boundary')
    expect(fallback).toContain('otherwise remove the temporary probe')
  })

  it('localizes response labels without changing project artifact language', () => {
    const continuation = loadCases().find(item => item.id === 'interrupted-continuation')
    expect(continuation?.language_contract).toEqual({
      response_labels: 'follow the response language',
      artifact_prose: 'follow the target artifact language',
      canonical_tokens: ['WorkRef', 'paths', 'commands', 'machine-consumed values'],
    })

    const core = readFileSync(join(root, 'skills', 'rsp', 'SKILL.md'), 'utf8')
    const fallback = readFileSync(join(root, 'rules', 'rsp-rules.md'), 'utf8')
    expect(core).toContain('Choose response language and artifact language independently')
    expect(core).toContain('semantic field order rather than fixed English wording')
    expect(core).toContain('use `工作引用（WorkRef）` in a Chinese response')
    expect(fallback).toContain('Choose response language and artifact language independently')

    for (const source of [
      'skills/rsp-shape/SKILL.md',
      'skills/rsp-design/SKILL.md',
      'skills/rsp-implement/SKILL.md',
      'skills/rsp-diagnose/SKILL.md',
      'skills/rsp-tdd/SKILL.md',
    ]) {
      expect(readFileSync(join(root, source), 'utf8'), source).toContain('response-versus-artifact language boundary')
    }
  })
})
