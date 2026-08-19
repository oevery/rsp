import { cp, mkdir, mkdtemp, readdir, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_PACKAGED_SKILL_NAMES, inspectPackagedSkillInventory, printPackagedSkillInventory } from '../../src/commands/skills.js'

const roots: string[] = []

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'rsp-skills-inventory-'))
  roots.push(root)
  const packageRoot = join(root, 'package')
  const projectRoot = join(root, 'project')
  for (const name of DEFAULT_PACKAGED_SKILL_NAMES) {
    await mkdir(join(packageRoot, 'skills', name), { recursive: true })
    await writeFile(join(packageRoot, 'skills', name, 'SKILL.md'), `${name}\n`)
  }
  await mkdir(join(packageRoot, 'skills', 'extra'), { recursive: true })
  await mkdir(projectRoot)
  await writeFile(join(packageRoot, 'package.json'), '{"name":"@example/rsp","version":"1.2.3"}\n')
  await writeFile(join(packageRoot, 'skills', 'extra', 'SKILL.md'), 'optional\n')
  return { packageRoot, projectRoot }
}

afterEach(async () => {
  await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true })))
})

describe('packaged Skill inventory', () => {
  it('groups human output into default suite and optional project Skills', () => {
    const log = vi.spyOn(console, 'log').mockImplementation(() => {})
    printPackagedSkillInventory({
      package: { name: '@example/rsp', version: '1.2.3' },
      target: '.agents/skills',
      skills: [
        { name: 'extra', kind: 'optional', status: 'missing' },
        { name: 'rsp', kind: 'default', status: 'unchanged' },
      ],
    })
    expect(log.mock.calls.map(([line]) => line)).toEqual([
      '  @example/rsp@1.2.3',
      '  target: .agents/skills',
      '',
      '  Default suite Skills',
      '    rsp  unchanged',
      '',
      '  Optional project Skills',
      '    extra  missing',
    ])
    log.mockRestore()
  })

  it('classifies default and optional Skills across exact installed states without mutation', async () => {
    const { packageRoot, projectRoot } = await fixture()
    await mkdir(join(projectRoot, '.agents', 'skills', 'rsp'), { recursive: true })
    await cp(join(packageRoot, 'skills', 'rsp'), join(projectRoot, '.agents', 'skills', 'rsp'), { recursive: true })
    await mkdir(join(projectRoot, '.agents', 'skills', 'extra'))
    await writeFile(join(projectRoot, '.agents', 'skills', 'extra', 'SKILL.md'), 'local\n')

    const inventory = await inspectPackagedSkillInventory({ packageRoot, projectRoot })
    expect(inventory.package).toEqual({ name: '@example/rsp', version: '1.2.3' })
    expect(inventory.target).toBe('.agents/skills')
    expect(inventory.skills).toContainEqual({ name: 'extra', kind: 'optional', status: 'divergent' })
    expect(inventory.skills).toContainEqual({ name: 'rsp', kind: 'default', status: 'unchanged' })
    expect(await readdir(projectRoot)).toEqual(['.agents'])
    expect(await readFile(join(projectRoot, '.agents', 'skills', 'extra', 'SKILL.md'), 'utf8')).toBe('local\n')
  })

  it('does not create installation directories when every target is missing', async () => {
    const { packageRoot, projectRoot } = await fixture()
    const inventory = await inspectPackagedSkillInventory({ packageRoot, projectRoot })
    expect(inventory.skills.every(skill => skill.status === 'missing')).toBe(true)
    expect(await readdir(projectRoot)).toEqual([])
  })

  it('rejects a package missing a fixed default before creating project paths', async () => {
    const { packageRoot, projectRoot } = await fixture()
    await rm(join(packageRoot, 'skills', 'rsp-tdd'), { recursive: true })
    await expect(inspectPackagedSkillInventory({ packageRoot, projectRoot })).rejects.toThrow('packaged Skills missing default Skills: rsp-tdd')
    expect(await readdir(projectRoot)).toEqual([])
  })
})
