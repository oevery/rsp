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
})
