import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { DEFAULT_PACKAGED_SKILL_NAMES, inspectPackagedSkillInventory, installPackagedSkills } from '../../../src/commands/skills.js'

const temporary: string[] = []
const expectedDefaults = ['rsp', 'rsp-shape', 'rsp-implement', 'rsp-doc', 'rsp-verify', 'rsp-review', 'rsp-commit'].sort()
afterEach(() => {
  for (const path of temporary.splice(0))
    rmSync(path, { recursive: true, force: true })
})

function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'rsp-skill-migration-'))
  temporary.push(root)
  const packageRoot = join(root, 'package')
  const projectRoot = join(root, 'project')
  const targetRoot = join(projectRoot, '.agents', 'skills')
  mkdirSync(join(packageRoot, 'skills'), { recursive: true })
  mkdirSync(targetRoot, { recursive: true })
  writeFileSync(join(packageRoot, 'package.json'), JSON.stringify({ name: '@oevery/rsp', version: 'fixture' }))
  for (const name of [...DEFAULT_PACKAGED_SKILL_NAMES, 'rsp-structural-audit']) {
    mkdirSync(join(packageRoot, 'skills', name))
    writeFileSync(join(packageRoot, 'skills', name, 'SKILL.md'), `packaged ${name}`)
  }
  function installed(name: string, content = `user ${name}`) {
    mkdirSync(join(targetRoot, name))
    writeFileSync(join(targetRoot, name, 'SKILL.md'), content)
  }
  return { packageRoot, projectRoot, targetRoot, installed }
}

describe('packaged Skill migration', () => {
  it('installs seven defaults including documentation while named installation stays selective', async () => {
    const context = fixture()
    const inventory = await inspectPackagedSkillInventory(context)
    expect(inventory.skills.filter(skill => skill.kind === 'default').map(skill => skill.name).sort()).toEqual(expectedDefaults)
    expect(inventory.skills.find(skill => skill.name === 'rsp-structural-audit')).toMatchObject({ kind: 'optional', status: 'missing' })
    expect(inventory.skills.find(skill => skill.name === 'rsp-doc')).toMatchObject({ kind: 'default', status: 'missing' })
    const result = await installPackagedSkills({}, context)
    expect(result.installed).toEqual(expectedDefaults)
    expect(result.removed).toEqual([])
    await expect(installPackagedSkills({ names: ['rsp-release-docs'] }, context)).rejects.toThrow('unknown packaged Skill: rsp-release-docs')
    expect(existsSync(join(context.targetRoot, 'rsp-structural-audit'))).toBe(false)
    expect(readFileSync(join(context.targetRoot, 'rsp-doc', 'SKILL.md'), 'utf8')).toBe('packaged rsp-doc')
    const selected = fixture()
    const doc = await installPackagedSkills({ names: ['rsp-doc'] }, selected)
    expect(doc.installed).toEqual(['rsp-doc'])
    expect(doc.removed).toEqual([])
    expect(readFileSync(join(selected.targetRoot, 'rsp-doc', 'SKILL.md'), 'utf8')).toBe('packaged rsp-doc')
    expect(existsSync(join(selected.targetRoot, 'rsp'))).toBe(false)
    const customDoc = join(selected.targetRoot, 'rsp-doc', 'SKILL.md')
    writeFileSync(customDoc, 'User-customized documentation guidance.')
    await expect(installPackagedSkills({}, selected)).rejects.toThrow('rsp-doc')
    expect(readFileSync(customDoc, 'utf8')).toBe('User-customized documentation guidance.')
    expect(existsSync(join(selected.targetRoot, 'rsp'))).toBe(false)
  })

  it('conflicts on old names including the ancestor alias and previews only explicitly forced removals', async () => {
    const context = fixture()
    const oldNames = ['rsp-address-review', 'rsp-design', 'rsp-diagnose', 'rsp-manage', 'rsp-release-docs', 'rsp-resolve-findings', 'rsp-tdd']
    for (const name of oldNames)
      context.installed(name)
    context.installed('unrelated-skill')
    await expect(installPackagedSkills({}, context)).rejects.toThrow('rsp-address-review -> rsp-implement')
    for (const name of oldNames)
      expect(readFileSync(join(context.targetRoot, name, 'SKILL.md'), 'utf8')).toBe(`user ${name}`)
    const preview = await installPackagedSkills({ dryRun: true, force: true }, context)
    expect(preview.removed).toEqual(oldNames.sort())
    expect(existsSync(join(context.targetRoot, 'rsp'))).toBe(false)
    const result = await installPackagedSkills({ force: true }, context)
    expect(result.removed).toEqual(oldNames)
    for (const name of oldNames)
      expect(existsSync(join(context.targetRoot, name))).toBe(false)
    expect(readFileSync(join(context.targetRoot, 'unrelated-skill', 'SKILL.md'), 'utf8')).toBe('user unrelated-skill')
  })

  it('one replacement migrates only its own old names; optional audit retains its historical alias', async () => {
    const context = fixture()
    context.installed('rsp-manage')
    context.installed('rsp-design')
    context.installed('rsp-codebase-audit')
    context.installed('rsp-release-docs', 'Customized release guidance.')
    const result = await installPackagedSkills({ names: ['rsp-shape'], force: true }, context)
    expect(result.removed).toEqual(['rsp-design'])
    expect(existsSync(join(context.targetRoot, 'rsp-manage'))).toBe(true)
    expect(existsSync(join(context.targetRoot, 'rsp-codebase-audit'))).toBe(true)
    expect(readFileSync(join(context.targetRoot, 'rsp-release-docs', 'SKILL.md'), 'utf8')).toBe('Customized release guidance.')
    await installPackagedSkills({ names: ['rsp-review'], force: true }, context)
    await expect(installPackagedSkills({ names: ['rsp-doc'] }, context)).rejects.toThrow('rsp-release-docs -> rsp-doc')
    expect(readFileSync(join(context.targetRoot, 'rsp-release-docs', 'SKILL.md'), 'utf8')).toBe('Customized release guidance.')
    expect(existsSync(join(context.targetRoot, 'rsp-doc'))).toBe(false)
    const docPreview = await installPackagedSkills({ names: ['rsp-doc'], dryRun: true, force: true }, context)
    expect(docPreview.removed).toEqual(['rsp-release-docs'])
    expect(readFileSync(join(context.targetRoot, 'rsp-release-docs', 'SKILL.md'), 'utf8')).toBe('Customized release guidance.')
    const doc = await installPackagedSkills({ names: ['rsp-doc'], force: true }, context)
    expect(doc.removed).toEqual(['rsp-release-docs'])
    expect(existsSync(join(context.targetRoot, 'rsp-release-docs'))).toBe(false)
    const audit = await installPackagedSkills({ names: ['rsp-structural-audit'], force: true }, context)
    expect(audit.removed).toEqual(['rsp-codebase-audit'])
  })

  it('restores old trees after failed activation and refuses symlinked old names', async () => {
    const context = fixture()
    context.installed('rsp-address-review')
    context.installed('rsp-release-docs', 'Customized release guidance.')
    context.installed('unrelated-skill')
    await expect(installPackagedSkills({ names: ['rsp-doc', 'rsp-implement'], force: true }, {
      ...context,
      onMutationStep(step) {
        if (step.phase === 'before-activate')
          throw new Error('activation failed')
      },
    })).rejects.toThrow('activation failed')
    expect(readFileSync(join(context.targetRoot, 'rsp-address-review', 'SKILL.md'), 'utf8')).toBe('user rsp-address-review')
    expect(existsSync(join(context.targetRoot, 'rsp-implement'))).toBe(false)
    expect(readFileSync(join(context.targetRoot, 'rsp-release-docs', 'SKILL.md'), 'utf8')).toBe('Customized release guidance.')
    expect(existsSync(join(context.targetRoot, 'rsp-doc'))).toBe(false)
    expect(readFileSync(join(context.targetRoot, 'unrelated-skill', 'SKILL.md'), 'utf8')).toBe('user unrelated-skill')
    symlinkSync(join(context.packageRoot, 'skills', 'rsp'), join(context.targetRoot, 'rsp-manage'))
    await expect(installPackagedSkills({ names: ['rsp'], force: true }, context)).rejects.toThrow('unsupported entry')
    expect(existsSync(join(context.targetRoot, 'rsp'))).toBe(false)
  })
})
