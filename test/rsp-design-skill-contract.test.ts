import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('..', import.meta.url))
const skill = join(root, 'skills', 'rsp-design')

function readSkill(): string {
  const content = readFileSync(join(skill, 'SKILL.md'), 'utf8')
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  expect(match).not.toBeNull()
  return match![2]!
}

describe('rsp-design Skill contract', () => {
  it('publishes a host-neutral discipline with progressive references', () => {
    const body = readSkill()
    expect(readdirSync(join(skill, 'references')).sort()).toEqual([
      'domain-modeling.md',
      'module-seams.md',
      'reversible-exploration.md',
    ])
    expect(body).toContain('Load only the reference matching the question')
  })

  it('supports pre-change and tracked ownership without weakening the artifact boundary', () => {
    const body = readSkill()

    expect(body).toContain('Pre-Change Design')
    expect(body).toContain('Tracked Design')
    expect(body).toContain('one explicit bounded design question')
    expect(body).toContain('Do not invent a WorkRef')
    expect(body).toContain('explicit WorkRef or exactly one unambiguous focus marker')
    expect(body).toContain('Never invent product intent')
    expect(body).toContain('write settled planned design only under its `Design` section')
    expect(body).toContain('Do not write Specs, Decision Records, `CONTEXT.md`, `AGENTS.md`, production code')
    expect(body).toContain('Core durable review')
    expect(body).toContain('same WorkRef')
  })

  it('returns evidence, tradeoffs, decisions, routing, and one next action in the selected language', () => {
    const body = readSkill()

    expect(body).toContain('requested language')
    expect(body).toContain('inspected evidence and material gaps')
    expect(body).toContain('credible alternatives and tradeoffs')
    expect(body).toContain('unresolved owner decisions')
    expect(body).toContain('artifact routing')
    expect(body).toContain('smallest next action')
    expect(body).toContain('return to the user')
    expect(body).toContain('recursively invoke another Skill')
  })

  it('routes a bounded design inquiry before generic no-change shaping', () => {
    const core = readFileSync(join(root, 'skills', 'rsp', 'SKILL.md'), 'utf8')
    const fallback = readFileSync(join(root, 'rules', 'rsp-rules.md'), 'utf8')
    const designRoute = core.indexOf('Without a selected Change, use report-only Pre-Change Design')
    const noChangeRoute = core.indexOf('Core resolves whether one unambiguous shape-ready Change')

    expect(designRoute).toBeGreaterThan(-1)
    expect(noChangeRoute).toBeGreaterThan(designRoute)
    expect(core).toContain('installed `rsp-design`; never manually emulate it')
    expect(core).toContain('Only when unavailable, its manual fallback')
    expect(core).toContain('without inventing a WorkRef or artifact')
    expect(readSkill()).toContain('the manual fallback is only for an unavailable Skill')
    expect(fallback).toContain('one optional Discipline action against the same owner')
    expect(fallback).toContain('When an optional Discipline Skill is unavailable, a compact manual fallback may cover only the same bounded owner and action')
    expect(fallback).toContain('missing acceptance')
  })
})
