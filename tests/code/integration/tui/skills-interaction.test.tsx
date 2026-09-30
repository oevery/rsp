import type { PackagedSkillInventory } from '../../../../src/commands/skills.js'
import { setImmediate } from 'node:timers/promises'
import { cleanup, render } from 'ink-testing-library'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { SkillsApp } from '../../../../src/skills-tui/app.js'
import { skillsCatalogs } from '../../../../src/skills-tui/messages.js'

afterEach(cleanup)

function inventory(divergent = false): PackagedSkillInventory {
  return {
    package: { name: '@oevery/rsp', version: 'fixture' },
    target: '.agents/skills',
    skills: [
      { name: 'rsp', kind: 'default', status: divergent ? 'divergent' : 'missing' },
      { name: 'rsp-structural-audit', kind: 'optional', status: 'missing' },
    ],
  }
}

describe('skill selection terminal interaction', () => {
  it('keeps defaults selected and includes only explicitly selected optional Skills', async () => {
    const onComplete = vi.fn()
    const view = render(<SkillsApp inventory={inventory()} messages={skillsCatalogs.en} onComplete={onComplete} />)
    await setImmediate()
    await vi.waitFor(() => expect(view.lastFrame()).toContain('[ ] rsp-structural-audit'))
    view.stdin.write(' ')
    await vi.waitFor(() => expect(view.lastFrame()).toContain('[x] rsp-structural-audit'))
    view.stdin.write('\r')
    await vi.waitFor(() => expect(onComplete).toHaveBeenCalledWith({ kind: 'confirmed', names: ['rsp', 'rsp-structural-audit'], force: false }))
  })

  it.each(['n', 'y'])('requires a separate replacement decision before overwriting divergent Skills (%s)', async (answer) => {
    const onComplete = vi.fn()
    const view = render(<SkillsApp inventory={inventory(true)} messages={skillsCatalogs.en} onComplete={onComplete} />)
    await setImmediate()
    view.stdin.write('\r')
    await vi.waitFor(() => expect(view.lastFrame()).toContain(skillsCatalogs.en.replaceTitle))
    expect(onComplete).not.toHaveBeenCalled()
    view.stdin.write(answer)
    await vi.waitFor(() => expect(onComplete).toHaveBeenCalledWith(answer === 'n' ? { kind: 'cancelled' } : { kind: 'confirmed', names: ['rsp'], force: true }))
  })
})
