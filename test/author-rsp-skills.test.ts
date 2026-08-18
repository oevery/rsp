import { execFileSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { formatSkillContext, scanSkillContext } from '../.agents/skills/author-rsp-skills/scripts/scan-skill-context.mjs'

const root = fileURLToPath(new URL('..', import.meta.url))
const fixtures: string[] = []

function fixture() {
  const path = mkdtempSync(join(tmpdir(), 'rsp-author-skills-'))
  fixtures.push(path)
  return path
}

function write(base: string, path: string, content: string) {
  const target = join(base, path)
  mkdirSync(dirname(target), { recursive: true })
  writeFileSync(target, content)
  return target
}

afterEach(() => {
  for (const path of fixtures.splice(0))
    rmSync(path, { force: true, recursive: true })
})

describe('author-rsp-skills maintainer contract', () => {
  it('keeps authoring local, progressive, semantic, and outside publication authority', () => {
    const skill = readFileSync(join(root, '.agents/skills/author-rsp-skills/SKILL.md'), 'utf8')
    const concise = readFileSync(join(root, '.agents/skills/author-rsp-skills/references/concision.md'), 'utf8')
    const evaluation = readFileSync(join(root, '.agents/skills/author-rsp-skills/references/evaluation.md'), 'utf8')
    const metadata = readFileSync(join(root, '.agents/skills/author-rsp-skills/agents/openai.yaml'), 'utf8')

    for (const mode of ['`create`', '`revise`', '`audit`', '`concise`', '`adapt`', '`evaluate`'])
      expect(skill).toContain(mode)
    for (const path of ['references/authoring.md', 'references/concision.md', 'references/evaluation.md'])
      expect(skill).toContain(path)
    for (const obligation of ['trigger', 'inputs', 'authority', 'action', 'output', 'stop', 'verification', 'conditional-loading'])
      expect(skill).toContain(obligation)
    expect(skill).toContain('report-only Pre-Change Audit')
    expect(skill).toContain('WorkRef: N/A')
    expect(skill).toContain('stops before candidate creation, repair, mutation, or acceptance')
    expect(skill).toContain('requires one selected RSP Change and explicit artifact mutation authority')
    expect(skill).toContain('does not grant artifact mutation, candidate acceptance, review, Git, archive, installation, or publication authority')
    expect(concise).toContain('diagnostics')
    expect(concise).toContain('Do not introduce a private DSL')
    expect(evaluation).toContain('Trigger, Compliance, Boundary, and task result')
    expect(metadata).toContain('Use $author-rsp-skills')
  })

  it('is a direct maintainer package rather than a published Skill projection', () => {
    expect(readFileSync(join(root, 'test/project-skill-dogfood.test.ts'), 'utf8')).not.toContain('\'author-rsp-skills\',')
    expect(() => readFileSync(join(root, 'skills/author-rsp-skills/SKILL.md'), 'utf8')).toThrow()
  })
})

describe('skill context scanner', () => {
  it('reports canonical packages, reachability, repetitions, and diagnostics deterministically', () => {
    const base = fixture()
    const repeated = 'This exact sufficiently long paragraph is intentionally repeated for deterministic diagnostics.'
    write(base, 'skills/published/SKILL.md', `# Published\n\n[Guide](references/guide.md)\n\n${repeated}\n`)
    write(base, 'skills/published/references/guide.md', '# Guide\n\n[Deep](deep.md)\n')
    write(base, 'skills/published/references/deep.md', `# Deep\n\n${repeated}\n`)
    write(base, 'skills/published/references/orphan.md', '# Orphan\n')
    write(base, 'skills/published/NOTICE.md', `# Notice\n\n${repeated}\n`)
    write(base, '.agents/skills/local/SKILL.md', '# Local\n')
    mkdirSync(join(base, '.agents/skills'), { recursive: true })
    symlinkSync('../../skills/published', join(base, '.agents/skills/published'))

    const first = scanSkillContext({ root: base })
    const second = scanSkillContext({ root: base })

    expect(first).toEqual(second)
    expect(first.schema_version).toBe(1)
    expect(first.diagnostics_only).toBe(true)
    expect(first.packages.map(item => [item.kind, item.name])).toEqual([
      ['maintainer', 'local'],
      ['published', 'published'],
    ])
    expect(first.packages[1].reachable_markdown).toEqual([
      'skills/published/SKILL.md',
      'skills/published/references/deep.md',
      'skills/published/references/guide.md',
    ])
    expect(first.packages[1].markdown_files).toContain('skills/published/NOTICE.md')
    expect(first.packages[1].distribution_markdown).toEqual(['skills/published/NOTICE.md'])
    expect(first.packages[1].unreachable_markdown).toEqual(['skills/published/references/orphan.md'])
    expect(first.repeated_prose).toEqual([{
      text: repeated,
      paths: ['skills/published/SKILL.md', 'skills/published/references/deep.md'],
    }])
    expect(formatSkillContext(first)).toContain('diagnostics, not correctness thresholds')
    expect(formatSkillContext(first)).toContain('distribution: skills/published/NOTICE.md')
  })

  it('does not follow Markdown references outside the package', () => {
    const base = fixture()
    write(base, 'outside.md', '# Outside\n')
    write(base, 'skills/safe/SKILL.md', '# Safe\n\n[Outside](../../outside.md)\n')

    const result = scanSkillContext({ root: base })
    expect(result.packages[0].reachable_markdown).toEqual(['skills/safe/SKILL.md'])
    expect(result.packages[0].markdown_files).toEqual(['skills/safe/SKILL.md'])
  })

  it('emits stable JSON and contains no hard size budget contract', () => {
    const script = join(root, '.agents/skills/author-rsp-skills/scripts/scan-skill-context.mjs')
    const output = execFileSync(process.execPath, [script, '--root', root, '--json'], { encoding: 'utf8' })
    const parsed = JSON.parse(output)
    expect(parsed.packages.some((item: { name: string }) => item.name === 'author-rsp-skills')).toBe(true)

    const corpus = [
      readFileSync(join(root, '.agents/skills/author-rsp-skills/SKILL.md'), 'utf8'),
      readFileSync(join(root, '.agents/skills/author-rsp-skills/references/concision.md'), 'utf8'),
      readFileSync(script, 'utf8'),
    ].join('\n')
    expect(corpus).not.toMatch(/(?:max(?:imum)?|hard)[-_ ]?(?:words?|tokens?|lines?|bytes?)\s*[:=]\s*\d+/i)
  })
})
