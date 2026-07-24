import { existsSync, lstatSync, readFileSync } from 'node:fs'
import { basename, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { parse as parseYaml } from 'yaml'

const root = fileURLToPath(new URL('..', import.meta.url))
const candidate = join(root, 'research', 'candidates', 'skills', 'rsp-implement')
const published = join(root, 'skills', 'rsp-implement')
const skill = existsSync(candidate) ? candidate : published
const portableKeys = new Set(['description', 'license', 'metadata', 'name'])

function readSkill(): { body: string, frontmatter: Record<string, any> } {
  const content = readFileSync(join(skill, 'SKILL.md'), 'utf8')
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  expect(match).not.toBeNull()
  return { body: match![2]!, frontmatter: parseYaml(match![1]!) as Record<string, any> }
}

describe('rsp-implement Skill contract', () => {
  it('keeps one concise portable payload and its adaptation notice', () => {
    const { body, frontmatter } = readSkill()
    expect(frontmatter.name).toBe(basename(skill))
    expect(frontmatter.description).toEqual(expect.any(String))
    expect(frontmatter.license).toBe('MIT')
    expect(Object.keys(frontmatter).every(key => portableKeys.has(key))).toBe(true)
    expect(frontmatter.metadata).toMatchObject({ author: 'oevery', version: expect.stringMatching(/^\d{4}\.\d{2}\.\d{2}(?:\.\d+)?$/) })
    expect(body.trim().split(/\s+/).length).toBeLessThanOrEqual(600)
    expect(lstatSync(join(skill, 'SKILL.md')).isSymbolicLink()).toBe(false)
    expect(readFileSync(join(skill, 'NOTICE.md'), 'utf8')).toContain('d884ae04edebef577e82ff7c4e143debd0bbec99')
    expect(existsSync(candidate) && existsSync(published)).toBe(false)
  })

  it('keeps only the demonstrated implementation delta and hard boundaries', () => {
    const { body } = readSkill()
    expect(body).toContain('Use normal repository discovery')
    expect(body).toContain('Preserve unrelated modified, staged, and untracked work')
    expect(body).toContain('discard, guess, or rewrite pre-existing intent')
    expect(body).toContain('require separate explicit authority')
    expect(body).toContain('failed or unavailable verification cannot support completion')
    expect(body).toContain('use unavailable when a missing tool, dependency, service, credential, or environment')
    expect(body).toContain('Use blocked only when scoped checks pass')
    expect(body).toContain('confirmed pre-existing or out-of-scope baseline defect')
    expect(body).toContain('Claim completion only when required Tasks and checks pass')
    expect(body).not.toMatch(/resolve-context|first backticked|Outcome:|tee \/dev\/null|provider matrix|research\//i)
  })

  it('classifies implementation evidence without recursively invoking optional disciplines', () => {
    const { body } = readSkill()

    expect(body).toContain('## Classify implementation evidence')
    expect(body).toContain('unexplained failure')
    expect(body).toContain('`rsp-diagnose`')
    expect(body).toContain('manual diagnosis fallback')
    expect(body).toContain('`rsp-tdd`')
    expect(body).toContain('manual TDD fallback')
    expect(body).toContain('ordinary implementation')
    expect(body).toContain('Continue ordinary implementation by default')
    expect(body).toContain('explicitly required by the user, selected Change, or project instructions')
    expect(body).toContain('concrete changed risk')
    expect(body).toContain('Behavior being testable, a test being possible, or the work being a fix is not sufficient by itself')
    expect(body).toContain('Fresh verification is required, but a new test is only one evidence option')
    expect(body).toContain('protects observable behavior or a real boundary')
    expect(body).toContain('adds distinct future confidence')
    expect(body).toContain('avoids duplicate or implementation-detail coverage')
    expect(body).toContain('proportionate maintenance cost')
    expect(body).toContain('remove the disposable test, fixture, and helper before completion')
    expect(body).toContain('User, Change, and project retention requirements remain authoritative')
    expect(body).toContain('Do not invoke another Skill from inside this Skill')
    expect(body).toContain('Do not reproduce either discipline inside Implement')
    expect(body).toContain('same selected Change')
  })
})
