import { existsSync, lstatSync, mkdirSync, mkdtempSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs'
import { rename } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { DEFAULT_PACKAGED_SKILL_NAMES, inspectPackagedSkillInventory, updatePackagedSkills } from '../../../src/commands/skills.js'

const temporary: string[] = []
afterEach(() => {
  for (const path of temporary.splice(0))
    rmSync(path, { recursive: true, force: true })
})
function fixture() {
  const root = mkdtempSync(join(tmpdir(), 'rsp-skill-ownership-'))
  temporary.push(root)
  const packageRoot = join(root, 'package')
  const projectRoot = join(root, 'project')
  const targetRoot = join(projectRoot, '.agents/skills')
  mkdirSync(targetRoot, { recursive: true })
  mkdirSync(join(packageRoot, 'skills'), { recursive: true })
  writeFileSync(join(packageRoot, 'package.json'), JSON.stringify({ name: '@oevery/rsp', version: 'fixture' }))
  for (const name of DEFAULT_PACKAGED_SKILL_NAMES) {
    mkdirSync(join(packageRoot, 'skills', name))
    writeFileSync(join(packageRoot, 'skills', name, 'SKILL.md'), `packaged ${name}`)
  }
  function installed(name: string, content = 'old') {
    mkdirSync(join(targetRoot, name))
    writeFileSync(join(targetRoot, name, 'SKILL.md'), content)
  }
  return { packageRoot, projectRoot, targetRoot, installed }
}

describe('package-owned Skills', () => {
  it('replaces complete trees including stale hidden files and preserves unknown names', async () => {
    const context = fixture()
    context.installed('rsp')
    writeFileSync(join(context.targetRoot, 'rsp/.old'), 'obsolete')
    context.installed('custom', 'user content')
    const retired = ['rsp-address-review', 'rsp-codebase-audit', 'rsp-structural-audit', 'rsp-design', 'rsp-diagnose', 'rsp-manage', 'rsp-release-docs', 'rsp-resolve-findings', 'rsp-tdd']
    for (const name of retired) context.installed(name)
    expect((await updatePackagedSkills({ ...context, dryRun: true })).removed.sort()).toEqual(retired.sort())
    expect(readFileSync(join(context.targetRoot, 'rsp/SKILL.md'), 'utf8')).toBe('old')
    await updatePackagedSkills(context)
    expect(readFileSync(join(context.targetRoot, 'rsp/SKILL.md'), 'utf8')).toBe('packaged rsp')
    expect(existsSync(join(context.targetRoot, 'rsp/.old'))).toBe(false)
    expect(readFileSync(join(context.targetRoot, 'custom/SKILL.md'), 'utf8')).toBe('user content')
    for (const name of retired) expect(existsSync(join(context.targetRoot, name))).toBe(false)
    expect((await updatePackagedSkills(context)).unchanged.sort()).toEqual([...DEFAULT_PACKAGED_SKILL_NAMES].sort())
  })

  it('retains completed replacements on failure and converges on retry', async () => {
    const context = fixture()
    context.installed('rsp', 'old core')
    context.installed('rsp-review', 'old review')
    await expect(updatePackagedSkills({ ...context, renamePath: async (from, to) => {
      if (to === join(context.targetRoot, 'rsp-review'))
        throw new Error('publish denied')
      await rename(from, to)
    } })).rejects.toThrow('publish denied')
    expect(readFileSync(join(context.targetRoot, 'rsp/SKILL.md'), 'utf8')).toBe('packaged rsp')
    expect(existsSync(join(context.targetRoot, 'rsp-review'))).toBe(false)
    await updatePackagedSkills(context)
    expect(readFileSync(join(context.targetRoot, 'rsp-review/SKILL.md'), 'utf8')).toBe('packaged rsp-review')
  })

  it('preserves canonical source links and rejects unexpected managed symlinks', async () => {
    const context = fixture()
    for (const name of DEFAULT_PACKAGED_SKILL_NAMES) symlinkSync(join(context.packageRoot, 'skills', name), join(context.targetRoot, name))
    expect((await updatePackagedSkills(context)).unchanged.sort()).toEqual([...DEFAULT_PACKAGED_SKILL_NAMES].sort())
    for (const name of DEFAULT_PACKAGED_SKILL_NAMES) expect(lstatSync(join(context.targetRoot, name)).isSymbolicLink()).toBe(true)
    expect((await inspectPackagedSkillInventory(context)).skills.every(skill => skill.status === 'unchanged')).toBe(true)
    symlinkSync(join(context.packageRoot, 'skills/rsp'), join(context.targetRoot, 'rsp-manage'))
    await expect(updatePackagedSkills(context)).rejects.toThrow('unsupported entry')
    expect(readFileSync(join(context.packageRoot, 'skills/rsp/SKILL.md'), 'utf8')).toBe('packaged rsp')
  })
})
