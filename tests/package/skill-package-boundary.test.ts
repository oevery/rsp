import { lstatSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { DEFAULT_PACKAGED_SKILL_NAMES } from '../../src/commands/skills.js'

const root = fileURLToPath(new URL('../..', import.meta.url))

describe('published Skill package boundary', () => {
  it('discovers the default suite from the production inventory', () => {
    const discovered = readdirSync(join(root, 'skills'), { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry => entry.name)
      .sort()
    const expected = [...DEFAULT_PACKAGED_SKILL_NAMES, 'rsp-structural-audit'].sort()

    expect(discovered).toEqual(expected)
  })

  it('requires each published Skill to be a regular package with a readable entrypoint', () => {
    for (const name of [...DEFAULT_PACKAGED_SKILL_NAMES, 'rsp-structural-audit']) {
      const directory = join(root, 'skills', name)
      const entrypoint = join(directory, 'SKILL.md')
      expect(lstatSync(directory).isDirectory()).toBe(true)
      expect(lstatSync(entrypoint).isFile()).toBe(true)
      expect(readFileSync(entrypoint, 'utf8').trim()).not.toBe('')
    }
  })
})
