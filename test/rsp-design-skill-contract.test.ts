import { lstatSync, readdirSync, readFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { parse as parseYaml } from 'yaml'

const root = fileURLToPath(new URL('..', import.meta.url))
const skill = join(root, 'skills', 'rsp-design')

function readSkill(): { body: string, frontmatter: Record<string, any> } {
  const content = readFileSync(join(skill, 'SKILL.md'), 'utf8')
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  expect(match).not.toBeNull()
  return { body: match![2]!, frontmatter: parseYaml(match![1]!) as Record<string, any> }
}

describe('rsp-design Skill contract', () => {
  it('publishes a concise host-neutral discipline with progressive references', () => {
    const { body, frontmatter } = readSkill()

    expect(frontmatter.name).toBe(basename(skill))
    expect(frontmatter.description).toEqual(expect.any(String))
    expect(frontmatter.license).toBe('MIT')
    expect(frontmatter.metadata).toMatchObject({ author: 'oevery', version: expect.stringMatching(/^\d{4}\.\d{2}\.\d{2}(?:\.\d+)?$/) })
    expect(body.trim().split(/\s+/).length).toBeLessThanOrEqual(500)
    expect(lstatSync(join(skill, 'SKILL.md')).isSymbolicLink()).toBe(false)
    expect(readdirSync(join(skill, 'references')).sort()).toEqual([
      'domain-modeling.md',
      'module-seams.md',
      'reversible-exploration.md',
    ])
    expect(body).toContain('Load only the reference matching the question')
  })

  it('requires one owned question and preserves the RSP artifact boundary', () => {
    const { body } = readSkill()

    expect(body).toContain('explicit WorkRef or exactly one unambiguous focus marker')
    expect(body).toContain('State the single material question')
    expect(body).toContain('Never invent product intent')
    expect(body).toContain('write settled planned design only under its `Design` section')
    expect(body).toContain('Do not write Specs, Decision Records, `CONTEXT.md`, `AGENTS.md`, production code')
    expect(body).toContain('Core durable review')
    expect(body).toContain('same WorkRef')
  })

  it('returns evidence, tradeoffs, decisions, routing, and one next action in the selected language', () => {
    const { body } = readSkill()

    expect(body).toContain('requested language')
    expect(body).toContain('inspected evidence and material gaps')
    expect(body).toContain('credible alternatives and tradeoffs')
    expect(body).toContain('unresolved owner decisions')
    expect(body).toContain('artifact routing')
    expect(body).toContain('smallest next action')
    expect(body).toContain('recursively invoke another Skill')
  })
})
