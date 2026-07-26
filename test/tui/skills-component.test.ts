import type { PackagedSkillInventory } from '../../src/commands/skills.js'
import { render } from 'ink-testing-library'
import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { SkillsApp } from '../../src/skills-tui/app.js'
import { skillsCatalogs } from '../../src/skills-tui/messages.js'
import { displayWidth } from '../../src/tui/display.js'

const inventory: PackagedSkillInventory = {
  package: { name: '@oevery/rsp', version: '1.2.3' },
  target: '.agents/skills',
  skills: [
    { name: 'rsp', kind: 'default', status: 'unchanged' },
    { name: 'rsp-codebase-audit', kind: 'optional', status: 'missing' },
  ],
}

describe('skillsApp', () => {
  it('locks defaults, selects an optional Skill, and returns one confirmed plan', async () => {
    const onComplete = vi.fn()
    const view = render(React.createElement(SkillsApp, { inventory, messages: skillsCatalogs.en, initialWidth: 40, onComplete }))
    expect(view.lastFrame()).toContain('Default lifecycle Skills')
    expect(view.lastFrame()).toContain('[x] rsp  locked')
    expect(view.lastFrame()).toContain('Optional project Skills')
    expect(view.lastFrame()).toContain('[ ] rsp-codebase-audit')
    expect(view.lastFrame()!.indexOf('Default lifecycle Skills')).toBeLessThan(view.lastFrame()!.indexOf('Optional project Skills'))
    expect(view.lastFrame()!.split('\n').every(line => displayWidth(line) <= 40)).toBe(true)
    view.stdin.write(' ')
    await new Promise(resolve => setImmediate(resolve))
    view.stdin.write('\r')
    await new Promise(resolve => setImmediate(resolve))
    expect(onComplete).toHaveBeenCalledWith({ kind: 'confirmed', names: ['rsp', 'rsp-codebase-audit'], force: false })
    view.cleanup()
  })

  it('requires a separate replacement confirmation and cancellation writes no plan', async () => {
    const onComplete = vi.fn()
    const divergent = { ...inventory, skills: inventory.skills.map(skill => skill.name === 'rsp' ? { ...skill, status: 'divergent' as const } : skill) }
    const view = render(React.createElement(SkillsApp, { inventory: divergent, messages: skillsCatalogs['zh-CN'], onComplete }))
    expect(view.lastFrame()).toContain('默认生命周期 Skills')
    expect(view.lastFrame()).toContain('可选项目 Skills')
    view.stdin.write('\r')
    await new Promise(resolve => setImmediate(resolve))
    expect(view.lastFrame()).toContain('替换所选的差异 Skill')
    expect(onComplete).not.toHaveBeenCalled()
    view.stdin.write('n')
    await new Promise(resolve => setImmediate(resolve))
    expect(onComplete).toHaveBeenCalledWith({ kind: 'cancelled' })
    view.cleanup()
  })
})
