import type { ProjectStatusSnapshot } from '../../src/status/model.js'
import { render } from 'ink-testing-library'
import React from 'react'
import { describe, expect, it } from 'vitest'
import { DashboardApp } from '../../src/tui/app.js'
import { catalogs } from '../../src/tui/i18n/messages.js'

const snapshot: ProjectStatusSnapshot = {
  focused: ['alpha', 'beta'],
  records: ['alpha', 'beta'].map((name, index) => ({
    output: { name, kind: 'feature', progress: { done: index, total: 2 }, ageDays: 0, isFocused: true, isBlocked: index === 1, path: `.rsp/changes/${name}.md` },
    progressKnown: true,
    title: name,
    blockerEntries: index ? ['owner decision'] : ['requires `setup`: establish setup first'],
    readiness: { incompleteTasks: 1, incompleteVerify: 1, activeBlockers: Boolean(index), missingScenarios: false, deterministic: 'pass', semantic: 'needs-review', archiveReady: 'no' },
  })),
  groups: [{
    name: 'delivery',
    path: '.rsp/changes/delivery/00-brief.md',
    slices: [{ name: 'delivery/api', boundary: 'API slice', state: 'open' }, { name: 'delivery/ui', boundary: 'UI slice', state: 'open' }],
    completion: { done: 0, total: 2 },
    blockers: false,
    readyToClose: false,
    warnings: [],
  }],
  plan: {
    nodes: [{ name: 'alpha', selection: 'selected', state: 'ready' }, { name: 'beta', selection: 'selected', state: 'blocked' }, { name: 'delivery/api', selection: 'selected', state: 'waiting' }, { name: 'delivery/ui', selection: 'selected', state: 'blocked' }, { name: 'foundation', selection: 'prerequisite', state: 'waiting' }, { name: 'setup', selection: 'prerequisite', state: 'archived' }],
    ready: ['alpha', 'delivery/api'],
    edges: [
      { change: 'delivery/api', requires: 'foundation', reason: 'API needs foundation', state: 'open' },
      { change: 'delivery/ui', requires: 'foundation', reason: 'UI needs foundation', state: 'open' },
      { change: 'foundation', requires: 'setup', reason: 'foundation needs setup', state: 'archived' },
      { change: 'alpha', requires: 'setup', reason: 'establish setup first', state: 'archived' },
    ],
    blocked: [{ change: 'beta', requires: [], external: true }],
    waves: [['alpha', 'delivery/api']],
  },
  archiveTrend: [],
  diagnostics: [],
  runtime: [],
}

describe('dashboardApp', () => {
  it('renders textual states and supports navigation, scope, search, detail, and help', async () => {
    const view = render(React.createElement(DashboardApp, { initialSnapshot: snapshot, messages: catalogs.en }))
    expect(view.lastFrame()).toContain('alpha [focused · ready]')
    expect(view.lastFrame()).toContain('beta [focused · blocked]')
    expect(view.lastFrame()).toContain('Prerequisites')
    expect(view.lastFrame()).toContain('✓ setup  resolved')
    expect(view.lastFrame()).not.toContain('◎ alpha')
    expect(view.lastFrame()).toContain('Blockers: none')
    expect(view.lastFrame()).not.toContain('requires `setup`')
    expect(view.lastFrame()).not.toContain('Legend')

    view.stdin.write('j')
    await new Promise(resolve => setImmediate(resolve))
    expect(view.lastFrame()).toContain('Detail: beta')
    expect(view.lastFrame()).toContain('Prerequisites\n')
    expect(view.lastFrame()).toContain('none')
    expect(view.lastFrame()).toContain('Blockers: owner decision')
    expect(view.lastFrame()).toContain('Next action: Awaiting owner decision')
    expect(view.lastFrame()).not.toContain('Next command: rsp show beta')

    view.stdin.write('\r')
    await new Promise(resolve => setImmediate(resolve))
    expect(view.lastFrame()).toContain('Detail: beta')
    expect(view.lastFrame()).not.toContain('alpha [focused · ready]')
    view.stdin.write('\x1B')
    await new Promise(resolve => setTimeout(resolve, 150))
    expect(view.lastFrame()).toContain('alpha [focused · ready]')

    view.stdin.write('\t')
    await new Promise(resolve => setImmediate(resolve))
    expect(view.lastFrame()).toContain('Groups')
    expect(view.lastFrame()).toContain('delivery: delivery')
    expect(view.lastFrame()).toContain('[waiting]')
    expect(view.lastFrame()).toContain('delivery/api (open)')
    expect(view.lastFrame()).toContain('○ delivery/api')
    expect(view.lastFrame()).toContain('└── ○ foundation')
    expect(view.lastFrame()).toContain('└── ✓ setup')
    expect(view.lastFrame()).toContain('Reason: foundation needs setup')
    expect(view.lastFrame()).toContain('↩ shared')
    expect(view.lastFrame()).toContain('Next command: rsp show delivery/api')

    view.stdin.write('/')
    await new Promise(resolve => setImmediate(resolve))
    view.stdin.write('missing')
    await new Promise(resolve => setImmediate(resolve))
    expect(view.lastFrame()).toContain('No items match the filter.')
    view.stdin.write('\r')
    await new Promise(resolve => setImmediate(resolve))
    view.stdin.write('?')
    await new Promise(resolve => setImmediate(resolve))
    expect(view.lastFrame()).toContain('Keyboard help')
    expect(view.lastFrame()).toContain('Legend  ◎ focused')
    expect(view.lastFrame()).toContain('Dependency trees read from work to prerequisites.')
    view.cleanup()
  })

  it('keeps the Chinese primary view monolingual and canonical states discoverable in help', async () => {
    const view = render(React.createElement(DashboardApp, { initialSnapshot: snapshot, messages: catalogs['zh-CN'] }))
    expect(view.lastFrame()).toContain('RSP 仪表盘')
    expect(view.lastFrame()).toContain('alpha [已聚焦 · 就绪]')
    expect(view.lastFrame()).not.toContain('(focused)')
    expect(view.lastFrame()).not.toContain('(ready)')
    view.stdin.write('?')
    await new Promise(resolve => setImmediate(resolve))
    expect(view.lastFrame()).toContain('规范状态：focused · ready · waiting · resolved · blocked')
    expect(view.lastFrame()).toContain('图例  ◎ 聚焦')
    view.cleanup()
  })
})
