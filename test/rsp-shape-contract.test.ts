import { existsSync, lstatSync, readFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { parse as parseYaml } from 'yaml'

const root = fileURLToPath(new URL('..', import.meta.url))
const candidate = join(root, 'research', 'candidates', 'skills', 'rsp-shape')
const published = join(root, 'skills', 'rsp-shape')
const skill = existsSync(candidate) ? candidate : published
const portableKeys = new Set(['description', 'license', 'metadata', 'name'])

function readSkill(): { body: string, frontmatter: Record<string, any> } {
  const content = readFileSync(join(skill, 'SKILL.md'), 'utf8')
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  expect(match).not.toBeNull()
  return { body: match![2]!, frontmatter: parseYaml(match![1]!) as Record<string, any> }
}

describe('rsp-shape Skill contract', () => {
  it('keeps one concise portable payload', () => {
    const { body, frontmatter } = readSkill()
    expect(frontmatter.name).toBe(basename(skill))
    expect(frontmatter.description).toEqual(expect.any(String))
    expect(frontmatter.license).toBe('MIT')
    expect(Object.keys(frontmatter).every(key => portableKeys.has(key))).toBe(true)
    expect(frontmatter.metadata).toMatchObject({ author: 'oevery', version: expect.stringMatching(/^\d{4}\.\d{2}\.\d{2}(?:\.\d+)?$/) })
    expect(body.trim().split(/\s+/).length).toBeLessThanOrEqual(600)
    expect(lstatSync(join(skill, 'SKILL.md')).isSymbolicLink()).toBe(false)
    expect(existsSync(candidate) && existsSync(published)).toBe(false)
  })

  it('keeps only the demonstrated shaping delta and hard boundaries', () => {
    const { body } = readSkill()
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
    const { body } = readSkill()

    expect(body).toContain('original planning-artifact authority remains valid for clear in-scope discovery')
    expect(body).toContain('Keep a cohesive correction in the current Change')
    expect(body).toContain('one Change for an independently closable result')
    expect(body).toContain('one shallow Group for at least two such results sharing the goal')
    expect(body).toContain('fresh qualification without another authorization round')
    expect(body).toContain('Stop on changed behavior, acceptance, public interfaces, goal scope, mutation authority, or external action')
  })

  it('plans retained tests only when they provide distinct durable value', () => {
    const { body } = readSkill()

    expect(body).toContain('protects observable behavior or a real boundary')
    expect(body).toContain('adds distinct future confidence')
    expect(body).toContain('avoids duplicate or implementation-detail coverage')
    expect(body).toContain('costs proportionately')
    expect(body).toContain('smallest sufficient evidence')
    expect(body).toContain('keep probes temporary')
  })

  it('progressively discloses complex shaping without duplicating the ordinary path', () => {
    const { body } = readSkill()
    const reference = readFileSync(join(skill, 'references', 'complex-shaping.md'), 'utf8')
    expect(body).toContain('[complex shaping](references/complex-shaping.md)')
    expect(body).toContain('independently closable owners converge on terminal delivery')
    expect(reference).toContain('reapply the Shape Ready gate')
    expect(reference).toContain('Use an Overall Delivery Change')
    expect(reference).toContain('Tasks and Verify contain only terminal delivery operations')
    expect(reference).toContain('do not block versioning, packaging, or other authorized preparation prematurely')
    expect(reference).toContain('Do not add a nested Group')
    expect(reference.trim().split(/\s+/).length).toBeLessThanOrEqual(600)
  })

  it('keeps independent observable outcomes as child Changes despite one broad gate', () => {
    const { body } = readSkill()
    const reference = readFileSync(join(skill, 'references', 'complex-shaping.md'), 'utf8')

    expect(body).toContain('an integration gate never merges them')
    expect(reference).toContain('at least two observable outcomes can be independently implemented, focused, verified, reviewed, archived, and rolled back')
    expect(reference).toContain('even when they share one broad integration, release, or acceptance gate')
    expect(reference).toContain('The Brief owns that aggregate gate')
  })

  it('keeps a cohesive single outcome under one complete owner boundary', () => {
    const { body } = readSkill()
    const reference = readFileSync(join(skill, 'references', 'complex-shaping.md'), 'utf8')

    expect(body).toContain('one observable outcome sharing a consistency, focused-verification, review, archive, and rollback boundary')
    expect(body).toContain('Change granularity does not prescribe Git commit count')
    expect(body).toContain('never split or merge Changes merely to enforce a Change-to-commit mapping')
    expect(reference).toContain('its tasks must converge across the same consistency, focused-verification, review, archive, and rollback boundary')
    expect(reference).toContain('A shared file, module, deadline, or integration check does not establish that cohesion by itself')
  })
})
