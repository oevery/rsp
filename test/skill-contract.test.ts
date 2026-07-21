import { lstatSync, readdirSync, readFileSync, realpathSync } from 'node:fs'
import { basename, dirname, join, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { parse as parseYaml } from 'yaml'

const root = fileURLToPath(new URL('..', import.meta.url))
const coreSkill = join(root, 'skills', 'rsp')
const reviewSkill = join(root, 'skills', 'rsp-review')
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
  it('keeps the stable RSP Skill portable', () => {
    expectPortableSkill(coreSkill)
  })

  it('publishes a portable canonical review Skill', () => {
    expectPortableSkill(reviewSkill)
    expect(reviewSkill.includes(`${sep}.agents${sep}skills${sep}`)).toBe(false)
    expect(readSkill(reviewSkill).body).toContain('verify that the changed production consumer actually reaches that seam')
    expect(readSkill(reviewSkill).body).toContain('never return `clean` for authority-only documents')
    expect(readSkill(reviewSkill).body).toContain('Absence of a new test is not actionable by itself')
  })

  it('publishes both stable Skills while keeping research outside package roots', () => {
    const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8')) as { files: string[] }
    const publishedSkills = readdirSync(join(root, 'skills'))
    expect(packageJson.files.some(path => path.startsWith('research'))).toBe(false)
    expect(packageJson.files).toContain('skills/')
    expect(publishedSkills).toContain('rsp')
    expect(publishedSkills).toContain('rsp-review')
  })
})
