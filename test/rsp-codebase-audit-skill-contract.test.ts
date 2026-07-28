import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('..', import.meta.url))
const skillDir = join(root, 'skills', 'rsp-codebase-audit')
const content = readFileSync(join(skillDir, 'SKILL.md'), 'utf8')
const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
const skill = match?.[2] ?? ''
const lenses = readFileSync(join(skillDir, 'references', 'structural-lenses.md'), 'utf8')

describe('rsp-codebase-audit Skill contract', () => {
  it('is a portable optional Skill with one progressive reference', () => {
    expect(match).not.toBeNull()
    expect(skill).toContain('[structural audit lenses](references/structural-lenses.md)')
    expect(skill).toContain('After scope and authority are fixed')
  })

  it('defines a bounded trigger and the smallest evidence input', () => {
    expect(skill).toContain('before a Change, fixed review scope, or bounded design question exists')
    expect(skill).toContain('one explicit repository or subtree boundary')
    expect(skill).toContain('An RSP Change is not required')
    expect(skill).toContain('entry points, direct callers or consumers, state and data owners, relevant configuration, and focused tests')
    expect(skill).toContain('Do not substitute this audit for security, performance, dependency, framework, style, production-readiness')
  })

  it('keeps authority report-only and forbids lifecycle or product mutation', () => {
    expect(skill).toContain('This Skill owns only its response report')
    expect(skill).toContain('never modifies project code, tests, configuration, documentation, RSP artifacts, focus, lifecycle state, Git state, or external systems')
    expect(skill).toContain('does not create a Change, choose product intent, design a solution, apply a fix, or invoke another Skill')
    expect(skill).toContain('A focused Change may provide intent or scope but grants no additional mutation authority')
  })

  it('audits structural evidence without applying a generic checklist', () => {
    for (const heading of [
      '## Ownership and sources of truth',
      '## Module and dependency direction',
      '## Production-path reachability',
      '## Change amplification and repeated knowledge',
      '## Verification mismatch',
    ]) {
      expect(lenses).toContain(heading)
    }
    expect(skill).toContain('select only the lenses relevant to evidence already encountered')
    expect(skill).toContain('do not scan every directory or apply every lens mechanically')
    expect(skill).toContain('reachable trigger, a realistic impact, and the implicated ownership or behavior chain')
    expect(skill).toContain('directory names, pattern matching, code size, framework taste, a generic checklist')
    expect(lenses).toContain('Code reduction is never the objective')
  })

  it('hard-gates production reachability and verification claims', () => {
    expect(skill).toContain('naming the direct production consumer')
    expect(skill).toContain('confirming whether its actual callee reaches or bypasses the seam')
    expect(skill).toContain('Compare focused tests or other verification evidence with that same live path')
    expect(lenses).toContain('Do not treat API existence, registration, generated code, or an isolated passing test as proof of lifecycle integration')
    expect(lenses).toContain('Missing tests alone are not a structural finding')
  })

  it('returns at most five ranked findings or an honest non-finding', () => {
    expect(skill).toContain('Emit at most five')
    expect(skill).toContain('language explicitly requested by the user')
    expect(skill).toContain('nearest project instructions, then the conversation language')
    expect(skill).toContain('semantic field order rather than fixed English wording')
    expect(skill).toContain('preserving paths, severity labels, confidence values, and the result values')
    for (const field of ['Lens:', 'Evidence:', 'Trigger:', 'Impact:', 'Confidence:', 'Next owner:']) {
      expect(skill).toContain(field)
    }
    expect(skill).toContain('Use `clean` when the inspected boundary contains no evidenced structural risk')
    expect(skill).toContain('Use `scoped uncertainty` when missing authority, inaccessible evidence, or an unsafe runtime requirement prevents judgment')
    expect(skill).toContain('Do not manufacture advice to fill the report')
  })

  it('stops on ambiguous, unsafe, mutating, or expanded work', () => {
    expect(skill).toContain('Stop before auditing when the boundary or owner intent is materially ambiguous')
    expect(skill).toContain('credentials, an unsafe or destructive probe, production side effects, mutation, or material expansion')
    expect(skill).toContain('Stop inspecting when the requested boundary has enough evidence')
    expect(skill).toContain('Never continue into shaping, design, implementation, review, archive, Git delivery, publication, deployment, or approval')
  })
})
