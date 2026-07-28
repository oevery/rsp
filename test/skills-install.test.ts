import { spawnSync } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import { copyFileSync, cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync } from 'node:fs'
import { rename as fsRename, mkdir, readdir, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { afterAll, afterEach, describe, expect, it } from 'vitest'
import { installPackagedSkills } from '../src/commands/skills.js'

const repoRoot = fileURLToPath(new URL('..', import.meta.url))
const packageVersion = (JSON.parse(readFileSync(join(repoRoot, 'package.json'), 'utf8')) as { version: string }).version
const cliCacheRoot = join(repoRoot, '.cache')
mkdirSync(cliCacheRoot, { recursive: true })
const cliPackageRoot = mkdtempSync(join(cliCacheRoot, 'rsp-skills-package-'))
cpSync(join(repoRoot, 'dist'), join(cliPackageRoot, 'dist'), { recursive: true })
cpSync(join(repoRoot, 'skills'), join(cliPackageRoot, 'skills'), { recursive: true })
copyFileSync(join(repoRoot, 'package.json'), join(cliPackageRoot, 'package.json'))
const cli = join(cliPackageRoot, 'dist', 'cli.mjs')
const temporaryRoots: string[] = []
const expectedSkills = [
  'rsp',
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
const optionalSkill = 'rsp-structural-audit'

async function temporaryRoot(label: string): Promise<string> {
  const root = join(tmpdir(), `${label}-${randomUUID()}`)
  await mkdir(root, { recursive: true })
  temporaryRoots.push(root)
  return root
}

function runInstall(projectRoot: string, ...args: string[]) {
  return spawnSync('node', [cli, 'skills', 'install', ...args], {
    cwd: projectRoot,
    encoding: 'utf-8',
  })
}

function runList(projectRoot: string, ...args: string[]) {
  return spawnSync('node', [cli, 'skills', 'list', ...args], {
    cwd: projectRoot,
    encoding: 'utf-8',
  })
}

async function packagedSkillNames(): Promise<string[]> {
  const entries = await readdir(join(repoRoot, 'skills'), { withFileTypes: true })
  return entries.filter(entry => entry.isDirectory() && !entry.name.startsWith('.')).map(entry => entry.name).sort()
}

async function createTwoSkillFixture(label: string) {
  const packageRoot = await temporaryRoot(`${label}-package`)
  const projectRoot = await temporaryRoot(`${label}-project`)
  for (const name of ['a', 'b']) {
    await mkdir(join(packageRoot, 'skills', name), { recursive: true })
    await writeFile(join(packageRoot, 'skills', name, 'SKILL.md'), `package ${name}\n`)
    await mkdir(join(projectRoot, '.agents', 'skills', name), { recursive: true })
    await writeFile(join(projectRoot, '.agents', 'skills', name, 'SKILL.md'), `project ${name}\n`)
  }
  return { packageRoot, projectRoot }
}

async function createRenamedSkillFixture(
  label: string,
  obsoleteName = 'rsp-address-review',
  replacementName = 'rsp-resolve-findings',
) {
  const packageRoot = await temporaryRoot(`${label}-package`)
  const projectRoot = await temporaryRoot(`${label}-project`)
  const replacement = join(packageRoot, 'skills', replacementName, 'SKILL.md')
  const obsolete = join(projectRoot, '.agents', 'skills', obsoleteName, 'SKILL.md')
  const unrelated = join(projectRoot, '.agents', 'skills', 'local-tool', 'SKILL.md')
  await mkdir(dirname(replacement), { recursive: true })
  await writeFile(replacement, 'replacement\n')
  await mkdir(dirname(obsolete), { recursive: true })
  await writeFile(obsolete, 'obsolete package version\n')
  await mkdir(dirname(unrelated), { recursive: true })
  await writeFile(unrelated, 'project owned\n')
  return { obsolete, packageRoot, projectRoot, replacement, unrelated }
}

afterEach(async () => {
  await Promise.all(temporaryRoots.splice(0).map(root => rm(root, { recursive: true, force: true })))
})

afterAll(() => {
  rmSync(cliPackageRoot, { recursive: true, force: true })
})

describe('rsp skills install', () => {
  it('lists an exact machine-readable inventory without creating project paths', async () => {
    const projectRoot = await temporaryRoot('rsp-skills-list')
    const result = runList(projectRoot, '--json')
    expect(result.status, result.stderr).toBe(0)
    expect(JSON.parse(result.stdout)).toEqual({
      package: { name: '@oevery/rsp', version: packageVersion },
      target: '.agents/skills',
      skills: [...expectedSkills.map(name => ({ name, kind: 'default', status: 'missing' })), { name: optionalSkill, kind: 'optional', status: 'missing' }].sort((a, b) => a.name.localeCompare(b.name)),
    })
    expect(await readdir(projectRoot)).toEqual([])
  })

  it('installs the default lifecycle inventory and is idempotent', async () => {
    const projectRoot = await temporaryRoot('rsp-skills-install')
    const unrelated = join(projectRoot, '.agents', 'skills', 'local-tool', 'SKILL.md')
    await mkdir(join(projectRoot, '.agents', 'skills', 'local-tool'), { recursive: true })
    await writeFile(unrelated, 'project owned\n')

    const first = runInstall(projectRoot)
    expect(first.status, first.stderr).toBe(0)
    const names = await packagedSkillNames()
    expect(names).toEqual([...expectedSkills, optionalSkill].sort())
    expect(first.stdout).toContain(`installed: ${expectedSkills.join(', ')}`)
    expect((await readdir(join(projectRoot, '.agents', 'skills'))).sort()).toEqual([...expectedSkills, 'local-tool'].sort())
    expect(await readFile(unrelated, 'utf-8')).toBe('project owned\n')

    const second = runInstall(projectRoot)
    expect(second.status, second.stderr).toBe(0)
    expect(second.stdout).toContain(`unchanged: ${expectedSkills.join(', ')}`)
  })

  it('installs one exact optional Skill without implicitly installing the default suite', async () => {
    const projectRoot = await temporaryRoot('rsp-skills-optional-install')

    const first = runInstall(projectRoot, optionalSkill)
    expect(first.status, first.stderr).toBe(0)
    expect(first.stdout).toContain(`installed: ${optionalSkill}`)
    expect(await readdir(join(projectRoot, '.agents', 'skills'))).toEqual([optionalSkill])

    const second = runInstall(projectRoot, optionalSkill)
    expect(second.status, second.stderr).toBe(0)
    expect(second.stdout).toContain(`unchanged: ${optionalSkill}`)
  })

  it('rejects an unknown named Skill before creating project directories', async () => {
    const projectRoot = await temporaryRoot('rsp-skills-unknown')

    const result = runInstall(projectRoot, 'missing-skill')
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('unknown packaged Skill: missing-skill')
    expect(await readdir(projectRoot)).toEqual([])
  })

  it('rejects more than one Skill name before creating project directories', async () => {
    const projectRoot = await temporaryRoot('rsp-skills-extra-name')

    const result = runInstall(projectRoot, optionalSkill, 'rsp')
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('rsp skills install accepts at most one Skill name')
    expect(await readdir(projectRoot)).toEqual([])
  })

  it('leaves a divergent optional Skill untouched during default installation', async () => {
    const projectRoot = await temporaryRoot('rsp-skills-optional-conflict')
    const optionalFile = join(projectRoot, '.agents', 'skills', optionalSkill, 'SKILL.md')
    await mkdir(join(projectRoot, '.agents', 'skills', optionalSkill), { recursive: true })
    await writeFile(optionalFile, 'project optional version\n')

    const result = runInstall(projectRoot)
    expect(result.status, result.stderr).toBe(0)
    expect(result.stdout).toContain(`installed: ${expectedSkills.join(', ')}`)
    expect(await readFile(optionalFile, 'utf8')).toBe('project optional version\n')
  })

  it('forces only the exact named Skill and preserves other divergent directories', async () => {
    const projectRoot = await temporaryRoot('rsp-skills-optional-force')
    const skillRoot = join(projectRoot, '.agents', 'skills')
    const optionalFile = join(skillRoot, optionalSkill, 'SKILL.md')
    const defaultFile = join(skillRoot, 'rsp', 'SKILL.md')
    const unrelatedFile = join(skillRoot, 'local-tool', 'SKILL.md')
    for (const path of [optionalFile, defaultFile, unrelatedFile]) {
      await mkdir(dirname(path), { recursive: true })
      await writeFile(path, 'project version\n')
    }

    const result = runInstall(projectRoot, optionalSkill, '--force')
    expect(result.status, result.stderr).toBe(0)
    expect(result.stdout).toContain(`replaced: ${optionalSkill}`)
    expect(await readFile(optionalFile, 'utf8')).toBe(await readFile(join(repoRoot, 'skills', optionalSkill, 'SKILL.md'), 'utf8'))
    expect(await readFile(defaultFile, 'utf8')).toBe('project version\n')
    expect(await readFile(unrelatedFile, 'utf8')).toBe('project version\n')
  })

  it('preflights every target and performs no partial install after a conflict', async () => {
    const projectRoot = await temporaryRoot('rsp-skills-conflict')
    const conflicting = join(projectRoot, '.agents', 'skills', 'rsp', 'SKILL.md')
    await mkdir(join(projectRoot, '.agents', 'skills', 'rsp'), { recursive: true })
    await writeFile(conflicting, 'project version\n')

    const result = runInstall(projectRoot)
    expect(result.status).toBe(1)
    expect(result.stderr).toContain('conflicting packaged Skills: rsp')
    expect(await readFile(conflicting, 'utf-8')).toBe('project version\n')
    expect(await readdir(join(projectRoot, '.agents', 'skills'))).toEqual(['rsp'])
  })

  it('keeps dry-run mutation-free and force replacement bounded to package-owned targets', async () => {
    const projectRoot = await temporaryRoot('rsp-skills-force')
    const conflicting = join(projectRoot, '.agents', 'skills', 'rsp', 'SKILL.md')
    const unrelated = join(projectRoot, '.agents', 'skills', 'local-tool', 'SKILL.md')
    await mkdir(join(projectRoot, '.agents', 'skills', 'rsp'), { recursive: true })
    await mkdir(join(projectRoot, '.agents', 'skills', 'local-tool'), { recursive: true })
    await writeFile(conflicting, 'project version\n')
    await writeFile(unrelated, 'project owned\n')

    const dryRun = runInstall(projectRoot, '--dry-run')
    expect(dryRun.status).toBe(1)
    expect(dryRun.stderr).toContain('conflicting packaged Skills: rsp')
    expect(await readFile(conflicting, 'utf-8')).toBe('project version\n')
    expect((await readdir(join(projectRoot, '.agents', 'skills'))).sort()).toEqual(['local-tool', 'rsp'])

    const forcedDryRun = runInstall(projectRoot, '--dry-run', '--force')
    expect(forcedDryRun.status, forcedDryRun.stderr).toBe(0)
    expect(forcedDryRun.stdout).toContain('would be replaced: rsp')
    expect(await readFile(conflicting, 'utf-8')).toBe('project version\n')
    expect((await readdir(join(projectRoot, '.agents', 'skills'))).sort()).toEqual(['local-tool', 'rsp'])

    const forced = runInstall(projectRoot, '--force')
    expect(forced.status, forced.stderr).toBe(0)
    expect(forced.stdout).toContain('replaced: rsp')
    expect(await readFile(conflicting, 'utf-8')).toBe(await readFile(join(repoRoot, 'skills', 'rsp', 'SKILL.md'), 'utf-8'))
    expect(await readFile(unrelated, 'utf-8')).toBe('project owned\n')
  })

  it('requires force to remove an obsolete packaged Skill during its replacement install', async () => {
    const { obsolete, packageRoot, projectRoot, replacement, unrelated } = await createRenamedSkillFixture('rsp-skills-obsolete-rename')
    const replacementTarget = join(projectRoot, '.agents', 'skills', 'rsp-resolve-findings', 'SKILL.md')

    await expect(
      installPackagedSkills({ names: ['rsp-resolve-findings'] }, { packageRoot, projectRoot }),
    ).rejects.toThrow(/obsolete packaged Skill renames: rsp-address-review -> rsp-resolve-findings; rerun with --force/)
    expect(await readFile(obsolete, 'utf8')).toBe('obsolete package version\n')
    await expect(readFile(replacementTarget, 'utf8')).rejects.toMatchObject({ code: 'ENOENT' })

    const dryRun = await installPackagedSkills({ dryRun: true, force: true, names: ['rsp-resolve-findings'] }, { packageRoot, projectRoot })
    expect(dryRun).toEqual({ installed: ['rsp-resolve-findings'], removed: ['rsp-address-review'], replaced: [], unchanged: [] })
    expect(await readFile(obsolete, 'utf8')).toBe('obsolete package version\n')
    await expect(readFile(replacementTarget, 'utf8')).rejects.toMatchObject({ code: 'ENOENT' })

    const installed = await installPackagedSkills({ force: true, names: ['rsp-resolve-findings'] }, { packageRoot, projectRoot })
    expect(installed).toEqual(dryRun)
    await expect(readFile(obsolete, 'utf8')).rejects.toMatchObject({ code: 'ENOENT' })
    expect(await readFile(replacementTarget, 'utf8')).toBe(await readFile(replacement, 'utf8'))
    expect(await readFile(unrelated, 'utf8')).toBe('project owned\n')
  })

  it('migrates the renamed optional structural audit only when explicitly forced', async () => {
    const { obsolete, packageRoot, projectRoot, replacement, unrelated } = await createRenamedSkillFixture(
      'rsp-skills-optional-audit-rename',
      'rsp-codebase-audit',
      'rsp-structural-audit',
    )
    const replacementTarget = join(projectRoot, '.agents', 'skills', 'rsp-structural-audit', 'SKILL.md')

    await expect(
      installPackagedSkills({ names: ['rsp-structural-audit'] }, { packageRoot, projectRoot }),
    ).rejects.toThrow(/obsolete packaged Skill renames: rsp-codebase-audit -> rsp-structural-audit; rerun with --force/)
    expect(await readFile(obsolete, 'utf8')).toBe('obsolete package version\n')
    await expect(readFile(replacementTarget, 'utf8')).rejects.toMatchObject({ code: 'ENOENT' })

    const installed = await installPackagedSkills({ force: true, names: ['rsp-structural-audit'] }, { packageRoot, projectRoot })
    expect(installed).toEqual({ installed: ['rsp-structural-audit'], removed: ['rsp-codebase-audit'], replaced: [], unchanged: [] })
    await expect(readFile(obsolete, 'utf8')).rejects.toMatchObject({ code: 'ENOENT' })
    expect(await readFile(replacementTarget, 'utf8')).toBe(await readFile(replacement, 'utf8'))
    expect(await readFile(unrelated, 'utf8')).toBe('project owned\n')
  })

  it('restores an obsolete packaged Skill when replacement activation fails', async () => {
    const { obsolete, packageRoot, projectRoot } = await createRenamedSkillFixture('rsp-skills-obsolete-rollback')

    await expect(installPackagedSkills({ force: true, names: ['rsp-resolve-findings'] }, {
      packageRoot,
      projectRoot,
      async renamePath(source, destination) {
        if (source.includes('/next/rsp-resolve-findings') && destination.endsWith('/rsp-resolve-findings'))
          throw new Error('injected replacement activation failure')
        await fsRename(source, destination)
      },
    })).rejects.toThrow('injected replacement activation failure')

    expect(await readFile(obsolete, 'utf8')).toBe('obsolete package version\n')
    await expect(readFile(join(projectRoot, '.agents', 'skills', 'rsp-resolve-findings', 'SKILL.md'), 'utf8')).rejects.toMatchObject({ code: 'ENOENT' })
    expect((await readdir(join(projectRoot, '.agents', 'skills'))).some(name => name.startsWith('.rsp-skills-install-'))).toBe(false)
  })

  it('rejects a symlinked obsolete Skill before installing its replacement', async () => {
    const packageRoot = await temporaryRoot('rsp-skills-obsolete-symlink-package')
    const projectRoot = await temporaryRoot('rsp-skills-obsolete-symlink-project')
    const externalRoot = await temporaryRoot('rsp-skills-obsolete-symlink-external')
    await mkdir(join(packageRoot, 'skills', 'rsp-resolve-findings'), { recursive: true })
    await writeFile(join(packageRoot, 'skills', 'rsp-resolve-findings', 'SKILL.md'), 'replacement\n')
    await mkdir(join(projectRoot, '.agents', 'skills'), { recursive: true })
    await writeFile(join(externalRoot, 'SKILL.md'), 'external\n')
    await symlink(externalRoot, join(projectRoot, '.agents', 'skills', 'rsp-address-review'))

    await expect(
      installPackagedSkills({ force: true, names: ['rsp-resolve-findings'] }, { packageRoot, projectRoot }),
    ).rejects.toThrow(/unsupported entry.*installed Skill rsp-address-review/)
    expect(await readFile(join(externalRoot, 'SKILL.md'), 'utf8')).toBe('external\n')
    await expect(readFile(join(projectRoot, '.agents', 'skills', 'rsp-resolve-findings', 'SKILL.md'), 'utf8')).rejects.toMatchObject({ code: 'ENOENT' })
  })

  it('rejects symlinked package-owned destinations without writing other targets', async () => {
    const projectRoot = await temporaryRoot('rsp-skills-destination-symlink')
    const externalRoot = await temporaryRoot('rsp-skills-destination-external')
    await mkdir(join(projectRoot, '.agents', 'skills'), { recursive: true })
    await writeFile(join(externalRoot, 'SKILL.md'), 'external\n')
    await symlink(externalRoot, join(projectRoot, '.agents', 'skills', 'rsp'))

    const result = runInstall(projectRoot)
    expect(result.status).toBe(1)
    expect(result.stderr).toMatch(/unsupported entry.*installed Skill rsp/)
    expect(await readFile(join(externalRoot, 'SKILL.md'), 'utf-8')).toBe('external\n')
    expect(await readdir(join(projectRoot, '.agents', 'skills'))).toEqual(['rsp'])
  })

  it('rejects symlinked entries in a packaged Skill tree', async () => {
    const packageRoot = await temporaryRoot('rsp-skills-source-package')
    const projectRoot = await temporaryRoot('rsp-skills-source-project')
    const externalRoot = await temporaryRoot('rsp-skills-source-external')
    await mkdir(join(packageRoot, 'skills', 'rsp'), { recursive: true })
    await writeFile(join(packageRoot, 'skills', 'rsp', 'SKILL.md'), 'rsp\n')
    await writeFile(join(externalRoot, 'secret.md'), 'secret\n')
    await symlink(join(externalRoot, 'secret.md'), join(packageRoot, 'skills', 'rsp', 'linked.md'))

    await expect(installPackagedSkills({}, { packageRoot, projectRoot })).rejects.toThrow(/unsupported entry.*linked\.md/)
    await expect(readdir(projectRoot)).resolves.toEqual([])
  })

  it('rejects a parent symlink introduced after preflight without writing through it', async () => {
    const packageRoot = await temporaryRoot('rsp-skills-parent-drift-package')
    const projectRoot = await temporaryRoot('rsp-skills-parent-drift-project')
    const externalRoot = await temporaryRoot('rsp-skills-parent-drift-external')
    await mkdir(join(packageRoot, 'skills', 'rsp'), { recursive: true })
    await writeFile(join(packageRoot, 'skills', 'rsp', 'SKILL.md'), 'rsp\n')

    await expect(installPackagedSkills({ names: ['rsp'] }, {
      packageRoot,
      projectRoot,
      async onMutationStep(step) {
        if (step.phase === 'before-target-root-mutation')
          await symlink(externalRoot, join(projectRoot, '.agents'))
      },
    })).rejects.toThrow(/project Skills root must be a real directory/)

    await expect(readdir(externalRoot)).resolves.toEqual([])
  })

  it('restores every original Skill after the second activation fails', async () => {
    const { packageRoot, projectRoot } = await createTwoSkillFixture('rsp-skills-activation-failure')

    await expect(installPackagedSkills({ force: true, names: ['a', 'b'] }, {
      packageRoot,
      projectRoot,
      async renamePath(source, destination) {
        if (source.includes('/next/b') && destination.endsWith('/b'))
          throw new Error('injected second activation failure')
        await fsRename(source, destination)
      },
    })).rejects.toThrow('injected second activation failure')

    expect(await readFile(join(projectRoot, '.agents', 'skills', 'a', 'SKILL.md'), 'utf8')).toBe('project a\n')
    expect(await readFile(join(projectRoot, '.agents', 'skills', 'b', 'SKILL.md'), 'utf8')).toBe('project b\n')
    expect((await readdir(join(projectRoot, '.agents', 'skills'))).some(name => name.startsWith('.rsp-skills-install-'))).toBe(false)
  })

  it('retains recoverable originals and continues rollback when a restore target is occupied', async () => {
    const { packageRoot, projectRoot } = await createTwoSkillFixture('rsp-skills-rollback-occupied')

    await expect(installPackagedSkills({ force: true, names: ['a', 'b'] }, {
      packageRoot,
      projectRoot,
      async renamePath(source, destination) {
        if (source.includes('/next/b') && destination.endsWith('/b'))
          throw new Error('injected second activation failure')
        await fsRename(source, destination)
      },
      async onMutationStep(step) {
        if (step.phase === 'before-rollback-restore' && step.name === 'b') {
          await mkdir(step.target)
          await writeFile(join(step.target, 'SKILL.md'), 'concurrent b\n')
        }
      },
    })).rejects.toThrow(/rollback incomplete; recover original Skills from .*\/previous/)

    expect(await readFile(join(projectRoot, '.agents', 'skills', 'a', 'SKILL.md'), 'utf8')).toBe('project a\n')
    expect(await readFile(join(projectRoot, '.agents', 'skills', 'b', 'SKILL.md'), 'utf8')).toBe('concurrent b\n')
    const staging = (await readdir(join(projectRoot, '.agents', 'skills'))).find(name => name.startsWith('.rsp-skills-install-'))
    expect(staging).toBeDefined()
    expect(await readFile(join(projectRoot, '.agents', 'skills', staging!, 'previous', 'b', 'SKILL.md'), 'utf8')).toBe('project b\n')
  })

  it('retains recoverable originals and continues rollback after a restore rename failure', async () => {
    const { packageRoot, projectRoot } = await createTwoSkillFixture('rsp-skills-rollback-rename-failure')

    await expect(installPackagedSkills({ force: true, names: ['a', 'b'] }, {
      packageRoot,
      projectRoot,
      async renamePath(source, destination) {
        if (source.includes('/next/b') && destination.endsWith('/b'))
          throw new Error('injected second activation failure')
        if (source.includes('/previous/b') && destination.endsWith('/b'))
          throw new Error('injected restore rename failure')
        await fsRename(source, destination)
      },
    })).rejects.toThrow(/rollback incomplete; recover original Skills from .*injected restore rename failure/)

    expect(await readFile(join(projectRoot, '.agents', 'skills', 'a', 'SKILL.md'), 'utf8')).toBe('project a\n')
    const staging = (await readdir(join(projectRoot, '.agents', 'skills'))).find(name => name.startsWith('.rsp-skills-install-'))
    expect(staging).toBeDefined()
    expect(await readFile(join(projectRoot, '.agents', 'skills', staging!, 'previous', 'b', 'SKILL.md'), 'utf8')).toBe('project b\n')
  })
})
