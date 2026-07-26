import { lstatSync, readdirSync, readFileSync, readlinkSync, realpathSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

const root = fileURLToPath(new URL('..', import.meta.url))
const publishedSkills = [
  'rsp',
  'rsp-address-review',
  'rsp-codebase-audit',
  'rsp-commit',
  'rsp-design',
  'rsp-diagnose',
  'rsp-implement',
  'rsp-manage',
  'rsp-release-docs',
  'rsp-review',
  'rsp-shape',
  'rsp-tdd',
]
describe('project Skill dogfooding', () => {
  it('projects every published Skill to its canonical authored directory', () => {
    const discovered = readdirSync(join(root, '.agents', 'skills'), { withFileTypes: true })
      .filter(entry => entry.isSymbolicLink())
      .map(entry => entry.name)
      .sort()

    expect(discovered).toEqual(publishedSkills)
    for (const name of publishedSkills) {
      const projection = join(root, '.agents', 'skills', name)
      expect(lstatSync(projection).isSymbolicLink()).toBe(true)
      expect(readlinkSync(projection)).toBe(`../../skills/${name}`)
      expect(realpathSync(projection)).toBe(realpathSync(join(root, 'skills', name)))
    }
  })

  it('documents the project-owned suite as the active workflow surface', () => {
    const instructions = readFileSync(join(root, 'AGENTS.md'), 'utf8')

    expect(instructions).toContain('## Project Skill Dogfooding')
    expect(instructions).toContain('Codex currently supports Skill disablement in user config, not project `.codex/config.toml`')
  })
})
