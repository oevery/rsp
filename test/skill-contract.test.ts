import { lstatSync, readdirSync, readFileSync, realpathSync } from 'node:fs'
import { basename, dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { parse as parseYaml } from 'yaml'

const root = fileURLToPath(new URL('..', import.meta.url))
const skillsRoot = join(root, 'skills')
const publishedSkillNames = [
  'rsp',
  'rsp-codebase-audit',
  'rsp-commit',
  'rsp-design',
  'rsp-diagnose',
  'rsp-implement',
  'rsp-manage',
  'rsp-release-docs',
  'rsp-resolve-findings',
  'rsp-review',
  'rsp-shape',
  'rsp-tdd',
]
const reviewSkill = join(root, 'skills', 'rsp-review')
const resolveFindingsSkill = join(root, 'skills', 'rsp-resolve-findings')
const distillUpstreamSkill = join(root, '.agents', 'skills', 'distill-upstream')
const portableKeys = new Set([
  'description',
  'license',
  'metadata',
  'name',
])

interface SkillFrontmatter {
  description: string
  license?: string
  metadata?: Record<string, unknown>
  name: string
}

function readSkill(skillDir: string): { body: string, frontmatter: SkillFrontmatter, rawFrontmatter: string } {
  const content = readFileSync(join(skillDir, 'SKILL.md'), 'utf8')
  const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/)
  expect(match, `${relative(root, skillDir)} must contain YAML frontmatter`).not.toBeNull()

  return {
    rawFrontmatter: match![1]!,
    frontmatter: parseYaml(match![1]!) as SkillFrontmatter,
    body: match![2]!,
  }
}

function walkPackage(dir: string): string[] {
  const files: string[] = []

  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    const stats = lstatSync(path)
    expect(stats.isSymbolicLink(), `${relative(root, path)} must not be a symlink`).toBe(false)
    if (stats.isDirectory())
      files.push(...walkPackage(path))
    else
      files.push(path)
  }

  return files
}

function expectPortableSkill(skillDir: string): void {
  const canonicalDir = realpathSync(skillDir)
  const { body, frontmatter, rawFrontmatter } = readSkill(skillDir)

  expect(frontmatter.name).toBe(basename(skillDir))
  expect(frontmatter.name).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
  expect(frontmatter.name.length).toBeLessThanOrEqual(64)
  expect(typeof frontmatter.description).toBe('string')
  expect(frontmatter.description.length).toBeGreaterThan(0)
  expect(frontmatter.description.length).toBeLessThanOrEqual(1024)
  if (frontmatter.license !== undefined)
    expect(typeof frontmatter.license).toBe('string')
  expect(Object.keys(frontmatter).every(key => portableKeys.has(key))).toBe(true)

  if (frontmatter.metadata) {
    expect(Object.values(frontmatter.metadata).every(value => typeof value === 'string')).toBe(true)
    if (frontmatter.metadata.version) {
      expect(frontmatter.metadata.version).toMatch(/^\d{4}\.\d{2}\.\d{2}(?:\.\d+)?$/)
      expect(rawFrontmatter).toMatch(/^\s*version:\s*"\d{4}\.\d{2}\.\d{2}(?:\.\d+)?"\s*$/m)
    }
  }

  for (const path of walkPackage(skillDir)) {
    const canonicalPath = realpathSync(path)
    expect(canonicalPath === canonicalDir || canonicalPath.startsWith(`${canonicalDir}${sep}`)).toBe(true)
  }

  for (const match of body.matchAll(/\[[^\]]+\]\(([^)]+)\)/g)) {
    const target = match[1]!
    if (/^(?:[a-z]+:|#)/i.test(target))
      continue
    const path = decodeURIComponent(target.split(/[?#]/, 1)[0]!)
    const resolved = resolve(dirname(join(skillDir, 'SKILL.md')), path)
    expect(resolved.startsWith(`${canonicalDir}${sep}`)).toBe(true)
    expect(() => realpathSync(resolved)).not.toThrow()
  }
}

describe('rsp Skill contract', () => {
  it('publishes the complete portable Skill suite', () => {
    const discovered = readdirSync(skillsRoot, { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name)
      .sort()

    expect(discovered).toEqual(publishedSkillNames)
    for (const name of discovered)
      expectPortableSkill(join(skillsRoot, name))
  })

  it('publishes the canonical review Skill contract', () => {
    expect(reviewSkill.includes(`${sep}.agents${sep}skills${sep}`)).toBe(false)
    const { body } = readSkill(reviewSkill)
    expect(body).toContain('verify that the changed production consumer actually reaches that seam')
    expect(body).toContain('never return `clean` for authority-only documents')
    expect(body).toContain('Absence of a new test is not actionable by itself')
    expect(body).toContain('conversation language')
    expect(body).toContain('shape below as semantic field order rather than fixed English wording')
    expect(body).toContain('`issues_found`, `clean`, `skipped`, and `blocked`')
  })

  it('publishes the canonical review-resolution Skill contract', () => {
    const { body } = readSkill(resolveFindingsSkill)
    expect(body).toContain('authoritative pointers, not project truth')
    expect(body).toContain('fresh fixed-scope re-review')
    expect(body).toContain('conversation language')
    expect(body).toContain('shapes as semantic field order rather than fixed English wording')
    expect(body).toContain('`accepted`, `rejected`, and `needs-clarification`')
  })

  it('publishes the complete assisted suite while keeping research outside package roots', () => {
    const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { files: string[] }
    const publishedSkills = readdirSync(skillsRoot).sort()
    expect(packageJson.files.some(path => path.startsWith('research'))).toBe(false)
    expect(packageJson.files).toContain('skills/')
    expect(publishedSkills).toEqual(publishedSkillNames)
  })

  it('keeps the maintainer distillation Skill portable and conditionally disclosed', () => {
    expectPortableSkill(distillUpstreamSkill)
    const { body } = readSkill(distillUpstreamSkill)

    for (const strategy of ['conform', 'model', 'adapt', 'tooling'])
      expect(body).toContain(`[references/${strategy}.md](references/${strategy}.md)`)
  })

  it('keeps upstream research separate from adoption and product mutation', () => {
    const { body } = readSkill(distillUpstreamSkill)

    expect(body).toContain('Do not edit `src/`, `rules/`, published `skills/`, `.rsp/specs/`, or create an RSP change during distillation')
    expect(body).toContain('Do not run `accept` unless the user separately asks')
    expect(body).toContain('No local RSP problem or gap means no adoption recommendation')
    expect(body).toContain('Start a candidate only when a normal RSP Change names')
    expect(body).toContain('Never regenerate or overwrite existing research content automatically')
  })
})
