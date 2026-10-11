import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, readdirSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterEach, describe, expect, it } from 'vitest'
import { checkSkillPackage } from '../../../scripts/skill-package-check.mjs'
import { DEFAULT_PACKAGED_SKILL_NAMES } from '../../../src/commands/skills.js'

const root = fileURLToPath(new URL('../../..', import.meta.url))
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
    const expected = ['rsp', 'rsp-shape', 'rsp-implement', 'rsp-verify', 'rsp-review', 'rsp-commit', 'rsp-doc'].sort()

    expect(discovered).toEqual(expected)
    expect([...DEFAULT_PACKAGED_SKILL_NAMES].sort()).toEqual(expected)
  })

  it('validates published Skill metadata and local resource closure without prose assertions', () => {
    for (const name of [...DEFAULT_PACKAGED_SKILL_NAMES]) {
      expect(checkSkillPackage(join(root, 'skills', name), { suiteRoot: join(root, 'skills') })).toEqual({ status: 'passed', errors: [] })
    }
  })

  it('allows declared Core references but rejects missing, sibling and escaped resources', () => {
    const suiteRoot = mkdtempSync(join(tmpdir(), 'rsp-suite-resources-'))
    temporary.push(suiteRoot)
    const directory = join(suiteRoot, 'rsp-review')
    mkdirSync(directory)
    mkdirSync(join(suiteRoot, 'rsp', 'references'), { recursive: true })
    const shared = join(suiteRoot, 'rsp', 'references', 'work-model.md')
    writeFileSync(shared, '# Work model')
    const prefix = '---\nname: rsp-review\ndescription: Review.\n---\n'
    const check = (link: string) => {
      writeFileSync(join(directory, 'SKILL.md'), `${prefix}[work model](${link})\n`)
      return checkSkillPackage(directory, { suiteRoot })
    }
    expect(check('../rsp/references/work-model.md').status).toBe('passed')
    expect(checkSkillPackage(directory).status).toBe('failed')
    expect(check('../rsp/references/missing.md').status).toBe('failed')
    writeFileSync(join(suiteRoot, 'rsp', 'SKILL.md'), 'Not a shared definition')
    expect(check('../rsp/SKILL.md').status).toBe('failed')
    symlinkSync(join(suiteRoot, 'rsp', 'SKILL.md'), join(suiteRoot, 'rsp', 'references', 'escape.md'))
    expect(check('../rsp/references/escape.md').status).toBe('failed')
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
