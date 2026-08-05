import { readdirSync, readFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
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

function readSourceClosure(source: string): string[] {
  const path = join(root, source)
  const body = readFileSync(path, 'utf8')
  const references = [...body.matchAll(/\[[^\]]+\]\((references\/[^)]+\.md)\)/g)]
    .map(match => resolve(dirname(path), match[1]))
    .filter(path => path.startsWith(root))
  return [body, ...references.map(path => readFileSync(path, 'utf8'))]
}

const semanticAlternatives: Record<string, string[]> = {
  'Planned future design': ['planned design'],
  'Implemented stable current facts': ['stable implemented facts', 'implementation changed a stable behavior'],
  'Lasting rationale': ['lasting rationale'],
  'Temporary execution state': ['temporary continuation'],
  'final-evidence snapshot': ['final decisive evidence', 'final evidence'],
  'superseded evidence': ['superseded content'],
  'Before archive': ['before archive'],
  'inspect worktree': ['inspect drift'],
  'not durable truth': ['not a second state store'],
  'continue or abort the Git operation': ['continuing, aborting'],
}

function satisfiesSemanticContract(body: string, contract: string): boolean {
  const normalized = body.toLowerCase()
  return [contract, ...(semanticAlternatives[contract] ?? [])]
    .some(candidate => normalized.includes(candidate.toLowerCase()))
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
      const sourceClosures = item.sources.map(readSourceClosure)
      const bodies = sourceClosures.map(parts => parts[0])
      const combined = sourceClosures.flat().join('\n')

      for (const contract of item.required_contract)
        expect(satisfiesSemanticContract(combined, contract), `${item.id}: ${contract}`).toBe(true)

      for (const contract of item.all_sources_contract ?? []) {
        for (const [index, body] of bodies.entries())
          expect(body, `${item.id}: ${item.sources[index]}: ${contract}`).toContain(contract)
      }
    }
  })

  it('keeps continuation recoverable without creating another durable owner', () => {
    const core = readFileSync(join(root, 'skills', 'rsp', 'SKILL.md'), 'utf8')
    const fallback = readFileSync(join(root, 'rules', 'rsp-rules.md'), 'utf8')

    expect(core).toMatch(/reopen (?:its|every authority) pointers?/)
    expect(core).toMatch(/refresh (?:decisive evidence|any verification)/)
    expect(core).toMatch(/not (?:a second state store|persisted without explicit path authority)/)
    expect(fallback).toMatch(/not durable truth or a second state store/i)
  })

  it('distinguishes progress, pause, owner release, blockers, and resume at the portable boundary', () => {
    const core = readFileSync(join(root, 'skills', 'rsp', 'SKILL.md'), 'utf8')
    const manage = readSourceClosure('skills/rsp-manage/SKILL.md').join('\n')
    const routing = readFileSync(join(root, 'skills', 'rsp', 'references', 'managed-routing.md'), 'utf8')
    const fallback = readFileSync(join(root, 'rules', 'rsp-rules.md'), 'utf8')

    expect(core).toMatch(/once selected, Manage solely owns same-goal revalidation, interruption and resume/i)

    expect(manage).toContain('progress or status inquiry')
    expect(manage).toContain('explicit pause')
    expect(manage).toContain('release or unfocus')
    expect(manage).toContain('preserve the focused owner')
    expect(manage).toContain('revalidate the selected handoff')
    expect(fallback).toContain('does not emulate `rsp-manage`')
    expect(fallback).toContain('managed resume')
    expect(routing).toContain('## HANDOFF AND RETURN')
    expect(routing).toContain('After selection, stop using this reference for execution detail')
    expect(routing).not.toContain('progress or status inquiry')
    expect(routing).not.toContain('explicit pause')
  })

  it('converges Changes before archive and gates persistent artifact audience', () => {
    const shape = readFileSync(join(root, 'skills', 'rsp-shape', 'SKILL.md'), 'utf8')
    const fallback = readFileSync(join(root, 'rules', 'rsp-rules.md'), 'utf8')

    expect(shape).toMatch(/convergent current-plan(?: and |\/)final-evidence snapshot/)
    expect(shape).toContain('not an append-only execution log')
    expect(shape).toMatch(/replace superseded/i)
    expect(shape).toContain('final decisive')
    expect(shape).toContain('in the response')
    expect(shape).toContain('Before archive')
    expect(shape).toContain('real product actors')
    expect(shape).toMatch(/domain(?:, system, user, or operator)? language/)

    expect(shape).toContain('not authors or execution narrators')
    expect(fallback).toContain('convergent current-plan and final-evidence snapshot')
    expect(fallback).toContain('not an append-only execution log')
    expect(fallback).toContain('Replace superseded plans and evidence')
    expect(fallback).toContain('temporary execution or continuation state to the response')
    expect(fallback).toContain('Before archive')
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
    expect(core).toContain('Keep response language user/session-owned and durable project language repository-owned')
    expect(core).toContain('project `.rsp/config.yaml` never selects it')
    expect(core).toContain('configured effective artifact language')
    expect(core).toContain('configured effective commit language')
    expect(core).toContain('Configuration changes never rewrite existing artifacts')
    expect(core).toMatch(/localized continuation with these semantic fields in order/)
    expect(core).toMatch(/Localize headings and labels|localized continuation/)
    expect(core).toMatch(/Preserve technical values/)
    expect(fallback).toContain('Use the response language for user-visible narration')
    expect(fallback).toContain('Preserve each existing artifact\'s established language unless translation is explicitly authorized')

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

  it('localizes observable control narration while preserving canonical values as secondary tokens', () => {
    const skillSystem = readFileSync(join(root, '.rsp', 'specs', 'skill-system.md'), 'utf8')
    const core = readFileSync(join(root, 'skills', 'rsp', 'SKILL.md'), 'utf8')
    const fallback = readFileSync(join(root, 'rules', 'rsp-rules.md'), 'utf8')

    for (const [source, body] of [
      ['.rsp/specs/skill-system.md', skillSystem],
      ['skills/rsp/SKILL.md', core],
    ] as const) {
      expect(body, source).toContain('Every user-visible RSP progress update, phase or stage description, control result, worker receipt, stop reason, and handoff')
      expect(body, source).toMatch(/natural-language narration selected by (?:that|the response-language) precedence/)
      expect(body, source).toMatch(/canonical technical value remains unchanged in parentheses or code formatting|retain a canonical technical value unchanged in parentheses or code formatting/)
      expect(body, source).toMatch(/must not stand alone as the human-facing label|never stands alone as the human-facing label/)
      expect(body, source).toContain('does not change persisted artifact language or host-owned hidden reasoning summaries')
    }
    expect(fallback).toContain('Use the response language for user-visible narration')
    expect(fallback).toContain('preserving exact WorkRefs, paths, commands, headings, and machine values')

    for (const source of [
      'skills/rsp-shape/SKILL.md',
      'skills/rsp-diagnose/SKILL.md',
      'skills/rsp-tdd/SKILL.md',
      'skills/rsp-implement/SKILL.md',
      'skills/rsp-manage/SKILL.md',
      'skills/rsp-commit/SKILL.md',
      'skills/rsp-release-docs/SKILL.md',
    ]) {
      const body = readFileSync(join(root, source), 'utf8')
      expect(body, source).toContain('response-versus-artifact language boundary for all user-visible control narration')
      expect(body, source).toContain('secondary parenthesized or code-formatted tokens')
      expect(body, source).not.toContain('Every user-visible RSP progress update, phase or stage description, control result, worker receipt, stop reason, and handoff')
    }

    for (const source of [
      'skills/rsp-design/SKILL.md',
      'skills/rsp-review/SKILL.md',
      'skills/rsp-resolve-findings/SKILL.md',
      'skills/rsp-structural-audit/SKILL.md',
    ]) {
      const body = readFileSync(join(root, source), 'utf8')
      expect(body, source).toMatch(/technical token alone as a response label|secondary exact tokens beside localized narration/)
      expect(body, source).not.toContain('Every user-visible RSP progress update, phase or stage description, control result, worker receipt, stop reason, and handoff')
    }
  })
})
