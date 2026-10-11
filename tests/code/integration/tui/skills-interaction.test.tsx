import type { PackagedSkillInventory, SkillInstallResult } from '../../../../src/commands/skills.js'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { setImmediate } from 'node:timers/promises'
import { cleanup, render } from 'ink-testing-library'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { DEFAULT_PACKAGED_SKILL_NAMES, inspectPackagedSkillInventory, installPackagedSkills } from '../../../../src/commands/skills.js'
import { SkillsApp } from '../../../../src/skills-tui/app.js'
import { skillsCatalogs } from '../../../../src/skills-tui/messages.js'

const temporary: string[] = []
afterEach(() => {
  cleanup()
  for (const path of temporary.splice(0))
    rmSync(path, { recursive: true, force: true })
})

function plan(replaced: string[] = []): SkillInstallResult {
  return { installed: [], unchanged: [], removed: [], replaced }
}

function inventory(divergent = false): PackagedSkillInventory {
  return {
    package: { name: '@oevery/rsp', version: 'fixture' },
    target: '.agents/skills',
    skills: [
      { name: 'rsp', kind: 'default', status: divergent ? 'divergent' : 'missing' },
      { name: 'rsp-review', kind: 'default', status: 'missing' },
    ],
  }
}

describe('skill selection terminal interaction', () => {
  it('installs every core member and does not allow partial selection', async () => {
    const onComplete = vi.fn()
    const view = render(<SkillsApp inventory={inventory()} plan={plan()} messages={skillsCatalogs.en} onComplete={onComplete} />)
    await setImmediate()
    await vi.waitFor(() => expect(view.lastFrame()).toContain('[x] rsp-review'))
    view.stdin.write(' ')
    await vi.waitFor(() => expect(view.lastFrame()).toContain('[x] rsp-review'))
    view.stdin.write('\r')
    await vi.waitFor(() => expect(onComplete).toHaveBeenCalledWith({ kind: 'confirmed', names: ['rsp', 'rsp-review'], force: false }))
  })

  it.each(['n', 'y'])('requires a separate replacement decision before overwriting divergent Skills (%s)', async (answer) => {
    const onComplete = vi.fn()
    const view = render(<SkillsApp inventory={inventory(true)} plan={plan(['rsp'])} messages={skillsCatalogs.en} onComplete={onComplete} />)
    await setImmediate()
    view.stdin.write('\r')
    await vi.waitFor(() => expect(view.lastFrame()).toContain(skillsCatalogs.en.replaceTitle))
    expect(onComplete).not.toHaveBeenCalled()
    view.stdin.write(answer)
    await vi.waitFor(() => expect(onComplete).toHaveBeenCalledWith(answer === 'n' ? { kind: 'cancelled' } : { kind: 'confirmed', names: ['rsp', 'rsp-review'], force: true }))
  })
})

describe('migration confirmation against installed directories', () => {
  it.each([true, false])('previews replacements and deletions before migrating (divergent core: %s)', async (divergent) => {
    const root = mkdtempSync(join(tmpdir(), 'rsp-tui-migration-'))
    temporary.push(root)
    const packageRoot = join(root, 'package')
    const projectRoot = join(root, 'project')
    const target = join(projectRoot, '.agents', 'skills')
    mkdirSync(projectRoot)
    mkdirSync(join(packageRoot, 'skills'), { recursive: true })
    writeFileSync(join(packageRoot, 'package.json'), JSON.stringify({ name: 'rsp', version: 'fixture' }))
    for (const name of DEFAULT_PACKAGED_SKILL_NAMES) {
      mkdirSync(join(packageRoot, 'skills', name))
      writeFileSync(join(packageRoot, 'skills', name, 'SKILL.md'), name)
    }
    const options = { packageRoot, projectRoot }
    await installPackagedSkills({}, options)
    const core = join(target, 'rsp', 'SKILL.md')
    if (divergent)
      writeFileSync(core, 'custom core')
    const retired = join(target, 'rsp-structural-audit')
    mkdirSync(retired)
    writeFileSync(join(retired, 'SKILL.md'), 'custom audit')
    const unrelated = join(target, 'my-skill')
    mkdirSync(unrelated)
    writeFileSync(join(unrelated, 'SKILL.md'), 'keep me')

    const inventory = await inspectPackagedSkillInventory(options)
    const plan = await installPackagedSkills({ dryRun: true, force: true }, options)
    for (const answer of ['n', 'y']) {
      const onComplete = vi.fn()
      const view = render(<SkillsApp inventory={inventory} plan={plan} messages={skillsCatalogs.en} onComplete={onComplete} />)
      await setImmediate()
      view.stdin.write('\r')
      await vi.waitFor(() => expect(view.lastFrame()).toContain('Local customizations'))
      expect(view.lastFrame()).toContain('Delete directory: .agents/skills/rsp-structural-audit')
      if (divergent)
        expect(view.lastFrame()).toContain('Replace directory: .agents/skills/rsp')
      else
        expect(view.lastFrame()).not.toContain('Replace directory:')
      expect(onComplete).not.toHaveBeenCalled()
      expect(readFileSync(join(retired, 'SKILL.md'), 'utf8')).toBe('custom audit')
      expect(readFileSync(core, 'utf8')).toBe(divergent ? 'custom core' : 'rsp')
      view.stdin.write(answer)
      await vi.waitFor(() => expect(onComplete).toHaveBeenCalledOnce())
      const selection = onComplete.mock.calls[0]![0]
      if (answer === 'n') {
        expect(selection).toEqual({ kind: 'cancelled' })
        expect(existsSync(retired)).toBe(true)
      }
      else {
        expect(selection.kind).toBe('confirmed')
        const applied = await installPackagedSkills({ names: selection.names, force: selection.force }, options)
        expect(applied).toEqual(plan)
        expect(existsSync(retired)).toBe(false)
        expect(readFileSync(core, 'utf8')).toBe('rsp')
        expect(readFileSync(join(unrelated, 'SKILL.md'), 'utf8')).toBe('keep me')
      }
      view.unmount()
    }
  })
})
