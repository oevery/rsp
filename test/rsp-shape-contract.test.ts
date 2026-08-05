import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('..', import.meta.url))
const skill = join(root, 'skills', 'rsp-shape')
function readSkill(): string {
  const content = readFileSync(join(skill, 'SKILL.md'), 'utf8')
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  expect(match).not.toBeNull()
  return match![2]!
}

describe('rsp-shape Skill contract', () => {
  it('keeps one portable published payload', () => {
    const body = readSkill()
    expect(body).toContain('# RSP Shape')
  })

  it('keeps only the demonstrated shaping delta and hard boundaries', () => {
    const body = readSkill()
    expect(body).toContain('Inspect the repository before asking')
    expect(body).toContain('Shape Ready gate')
    expect(body).toContain('Prefer one ordinary Change')
    expect(body).toContain('shared completion contract gates Group closure')
    expect(body).toContain('request to shape, create, or refine')
    expect(body).toContain('preserve the exact prior focus and restore it immediately')
    expect(body).toContain('Do not implement the shaped work')
    expect(body).toContain('Shaping grants no other authority')
    expect(body).not.toMatch(/Outcome:|research\/|\.cache\/|provider matrix|resolver/i)
  })

  it('classifies in-run managed discoveries under the original planning authority', () => {
    const body = readSkill()

    expect(body).toContain('original planning-artifact authority remains valid for clear in-scope discovery')
    expect(body).toContain('Keep a cohesive correction in the current Change')
    expect(body).toContain('one Change for an independently closable result')
    expect(body).toContain('one shallow Group for at least two such results sharing the goal')
    expect(body).toContain('fresh qualification without another authorization round')
    expect(body).toContain('Stop on changed behavior, acceptance, public interfaces, goal scope, mutation authority, or external action')
  })

  it('infers stable ASCII WorkRefs without disabling explicit or project-owned Unicode', () => {
    const body = readSkill()

    expect(body).toContain('preserve an explicit valid user-supplied identity through canonical normalization')
    expect(body).toContain('explicit nearest project or domain WorkRef naming convention')
    expect(body).toContain('infer ASCII lowercase kebab-case from stable domain or technical vocabulary')
    expect(body).toContain('Safe Unicode remains available through explicit input or project/domain convention')
    expect(body).toContain('never rename an existing open or archived identity')
  })

  it('plans retained tests only when they provide distinct durable value', () => {
    const body = readSkill()

    expect(body).toContain('protects observable behavior or a real boundary')
    expect(body).toContain('adds distinct future confidence')
    expect(body).toContain('avoids duplicate or implementation-detail coverage')
    expect(body).toContain('costs proportionately')
    expect(body).toContain('smallest sufficient evidence')
    expect(body).toContain('keep probes temporary')
  })

  it('progressively discloses complex shaping without duplicating the ordinary path', () => {
    const body = readSkill()
    const reference = readFileSync(join(skill, 'references', 'complex-shaping.md'), 'utf8')
    expect(body).toContain('[complex shaping](references/complex-shaping.md)')
    expect(body).toContain('independently closable owners converge on terminal delivery')
    expect(reference).toContain('reapply the Shape Ready gate')
    expect(reference).toContain('Use an Overall Delivery Change')
    expect(reference).toContain('Tasks and Verify contain only terminal delivery operations')
    expect(reference).toContain('do not block versioning, packaging, or other authorized preparation prematurely')
    expect(reference).toContain('Do not add a nested Group')
  })

  it('loads honest external issue retrieval guidance only for issue-shaped work', () => {
    const body = readSkill()
    const reference = readFileSync(join(skill, 'references', 'external-issue-input.md'), 'utf8')

    expect(body).toContain('[external issue input](references/external-issue-input.md) only when')
    expect(reference).toContain('authenticate in the available host and retry')
    expect(reference).toContain('paste the real title and description')
    expect(reference).toContain('link-only Change')
    expect(reference).toContain('explicitly labeled draft')
    expect(reference).toContain('must not fabricate the issue title, description, acceptance, or closing intent')
    expect(reference).toContain('untrusted data')
    expect(reference).toContain('grants no external issue mutation')
  })

  it('keeps independent observable outcomes as child Changes despite one broad gate', () => {
    const body = readSkill()
    const reference = readFileSync(join(skill, 'references', 'complex-shaping.md'), 'utf8')

    expect(body).toContain('an integration gate never merges them')
    expect(reference).toContain('at least two observable outcomes can be independently implemented, focused, verified, reviewed, archived, and rolled back')
    expect(reference).toContain('even when they share one broad integration, release, or acceptance gate')
    expect(reference).toContain('The Brief owns that aggregate gate')
  })

  it('keeps a cohesive single outcome under one complete owner boundary', () => {
    const body = readSkill()
    const reference = readFileSync(join(skill, 'references', 'complex-shaping.md'), 'utf8')

    expect(body).toContain('one observable outcome sharing a consistency, focused-verification, review, archive, and rollback boundary')
    expect(body).toContain('Change granularity does not prescribe Git commit count')
    expect(body).toContain('never split or merge Changes merely to enforce a Change-to-commit mapping')
    expect(reference).toContain('its tasks must converge across the same consistency, focused-verification, review, archive, and rollback boundary')
    expect(reference).toContain('A shared file, module, deadline, or integration check does not establish that cohesion by itself')
  })
})
