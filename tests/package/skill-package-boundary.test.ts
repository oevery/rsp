import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { checkSkillPackage } from '../../scripts/skill-package-check.mjs'
import { DEFAULT_PACKAGED_SKILL_NAMES } from '../../src/commands/skills.js'

const root = fileURLToPath(new URL('../..', import.meta.url))
const temporary: string[] = []
afterEach(() => {
  for (const path of temporary.splice(0))
    rmSync(path, { recursive: true, force: true })
})

describe('published Skill package boundary', () => {
  it('discovers the default suite from the production inventory', () => {
    const discovered = readdirSync(join(root, 'skills'), { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name)
      .sort()
    const expected = ['rsp', 'rsp-shape', 'rsp-implement', 'rsp-verify', 'rsp-review', 'rsp-commit', 'rsp-release-docs', 'rsp-structural-audit'].sort()

    expect(discovered).toEqual(expected)
    expect([...DEFAULT_PACKAGED_SKILL_NAMES].sort()).toEqual(expected.filter(name => name !== 'rsp-structural-audit'))
  })

  it('validates published Skill metadata and local resource closure without prose assertions', () => {
    for (const name of [...DEFAULT_PACKAGED_SKILL_NAMES, 'rsp-structural-audit']) {
      expect(checkSkillPackage(join(root, 'skills', name))).toEqual({ status: 'passed', errors: [] })
    }
  })

  it('rejects malformed host metadata but accepts equivalent YAML and rewritten instructions', () => {
    const parent = mkdtempSync(join(tmpdir(), 'rsp-skill-package-'))
    temporary.push(parent)
    const directory = join(parent, 'sample-skill')
    mkdirSync(directory)
    const cases: Array<[string, string | null]> = [
      ['name: sample-skill\ndescription: Uses the selected project.', null],
      ['description: >-\n  Uses the selected\n  project.\nname: "sample-skill"', null],
      ['name: sample-skill', 'invalid-description'],
      ['name: wrong\ndescription: Valid text.', 'invalid-name'],
      [`name: sample-skill\ndescription: ${'x'.repeat(1025)}`, 'invalid-description'],
      ['name: [unterminated', 'invalid-frontmatter'],
    ]
    for (const [metadata, code] of cases) {
      writeFileSync(join(directory, 'SKILL.md'), `---\n${metadata}\n---\nAny independently worded instruction.\n`)
      const result = checkSkillPackage(directory)
      expect(result.status).toBe(code ? 'failed' : 'passed')
      if (code)
        expect(result.errors).toContainEqual({ path: 'SKILL.md', code })
    }
    const result = spawnSync(process.execPath, [join(root, 'scripts/skill-package-check.mjs'), parent], { encoding: 'utf8' })
    expect(result.status).toBe(1)
    expect(JSON.parse(result.stdout).status).toBe('failed')
  })

  it('resolves real Markdown resources while ignoring examples and external URLs', () => {
    const parent = mkdtempSync(join(tmpdir(), 'rsp-skill-resources-'))
    temporary.push(parent)
    const directory = join(parent, 'sample-skill')
    mkdirSync(join(directory, 'references'), { recursive: true })
    writeFileSync(join(directory, 'references', 'a guide.md'), '# Guide\nUse this procedure.\n')
    writeFileSync(join(parent, 'outside.md'), 'Not a package resource.')
    const prefix = '---\nname: sample-skill\ndescription: Selected procedure.\n---\n'
    const entrypoint = join(directory, 'SKILL.md')
    writeFileSync(entrypoint, `${prefix}[guide][procedure]\n\n[procedure]: references/a%20guide.md#guide\n\n[external](https://example.invalid/doc)\n\n\`[example](missing.md)\`\n`)
    expect(checkSkillPackage(directory).status).toBe('passed')
    for (const [link, code] of [['references/missing.md', 'missing-or-invalid-resource'], ['../outside.md', 'resource-outside-package']]) {
      writeFileSync(entrypoint, `${prefix}[procedure](${link})\n`)
      expect(checkSkillPackage(directory).errors).toContainEqual({ path: 'SKILL.md', code })
    }
  })
})
