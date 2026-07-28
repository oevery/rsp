import type { ProjectStatusSnapshot } from '../../src/status/model.js'
import type { HistoryDetailOutput, HistoryRecordOutput } from '../../src/types.js'
import { render } from 'ink-testing-library'
import React from 'react'
import { describe, expect, it, vi } from 'vitest'
import { DashboardApp } from '../../src/tui/app.js'
import { displayWidth } from '../../src/tui/display.js'
import { catalogs } from '../../src/tui/i18n/messages.js'

const snapshot: ProjectStatusSnapshot = {
  manage: { activation: 'explicit', closeout: 'local' },
  language: { artifacts: null, commit: null },
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

const defaultInspectors = {
  inspectStatus: async () => snapshot,
  inspectHistory: async () => ({ records: [], summary: { matched: 0, returned: 0, hasMore: false } }),
  inspectHistoryDetail: async () => { throw new Error('no selected history record') },
}

describe('dashboardApp', () => {
  it.each([
    { locale: 'en' as const, initial: 'RSP dashboard  [Changes] Groups History', groups: 'RSP dashboard  Changes [Groups] History', history: 'RSP dashboard  Changes Groups [History]', footer: 'Tab: Changes → Groups → History' },
    { locale: 'zh-CN' as const, initial: 'RSP 仪表盘  [变更] 变更组 历史', groups: 'RSP 仪表盘  变更 [变更组] 历史', history: 'RSP 仪表盘  变更 变更组 [历史]', footer: 'Tab：变更 → 变更组 → 历史' },
  ])('exposes all scopes and the active scope at 40x8 in $locale', async ({ footer, groups, history, initial, locale }) => {
    const view = render(React.createElement(DashboardApp, {
      initialSnapshot: snapshot,
      initialDimensions: { width: 40, height: 8 },
      messages: catalogs[locale],
      ...defaultInspectors,
    }))
    expect(view.lastFrame()).toContain(initial)
    expect(view.lastFrame()).toContain(footer)
    expect(view.lastFrame()!.split('\n').every(line => displayWidth(line) <= 40)).toBe(true)

    view.stdin.write('\t')
    await new Promise(resolve => setImmediate(resolve))
    expect(view.lastFrame()).toContain(groups)

    view.stdin.write('\t')
    await new Promise(resolve => setImmediate(resolve))
    await new Promise(resolve => setImmediate(resolve))
    expect(view.lastFrame()).toContain(history)
    expect(view.lastFrame()!.split('\n').every(line => displayWidth(line) <= 40)).toBe(true)
    view.cleanup()
  })

  it('renders textual states and supports navigation, scope, search, detail, and help', async () => {
    const view = render(React.createElement(DashboardApp, { initialSnapshot: snapshot, messages: catalogs.en, ...defaultInspectors }))
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
    const view = render(React.createElement(DashboardApp, { initialSnapshot: snapshot, messages: catalogs['zh-CN'], ...defaultInspectors }))
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

  it('lazy-loads bounded History, keeps duplicate WorkRefs distinct, and opens detail by path', async () => {
    const records: HistoryRecordOutput[] = [
      { date: '2026-07-24', workRef: 'repeat', group: null, kind: 'feature', summary: 'new summary', summaryTruncated: false, path: '.rsp/archives/2026-07-24_repeat.md' },
      { date: '2026-07-23', workRef: 'repeat', group: null, kind: 'fix', summary: 'old summary', summaryTruncated: false, path: '.rsp/archives/2026-07-23_repeat.md' },
    ]
    const detail: HistoryDetailOutput = {
      ...records[1],
      scenarioCount: 2,
      checkboxes: {
        tasks: { done: 2, todo: 0, progress: 0, dropped: 0, total: 2 },
        verify: { done: 1, todo: 0, progress: 0, dropped: 0, total: 1 },
      },
      evidence: {
        tasks: { items: ['- [x] task one', '- [x] task two', ...Array.from({ length: 12 }, (_, index) => `- [x] task hidden ${index}`)], truncated: false },
        verify: { items: ['- [x] test'], truncated: false },
        blockers: { items: [], truncated: false },
      },
    }
    const inspectHistory = vi.fn(async () => ({ records, summary: { matched: 3, returned: 2, hasMore: true } }))
    const inspectHistoryDetail = vi.fn(async () => detail)
    const view = render(React.createElement(DashboardApp, {
      initialSnapshot: snapshot,
      messages: catalogs.en,
      inspectStatus: vi.fn(async () => snapshot),
      inspectHistory,
      inspectHistoryDetail,
    }))
    expect(inspectHistory).not.toHaveBeenCalled()
    view.stdin.write('\t')
    await new Promise(resolve => setImmediate(resolve))
    view.stdin.write('\t')
    await new Promise(resolve => setImmediate(resolve))
    await new Promise(resolve => setImmediate(resolve))
    expect(inspectHistory).toHaveBeenCalledTimes(1)
    expect(view.lastFrame()).toContain('History')
    expect(view.lastFrame()).toContain('2/3 archived Changes shown')
    expect(view.lastFrame()).toContain('2026-07-24  repeat')
    view.stdin.write('j')
    await new Promise(resolve => setImmediate(resolve))
    view.stdin.write('\r')
    await new Promise(resolve => setImmediate(resolve))
    await new Promise(resolve => setImmediate(resolve))
    expect(inspectHistoryDetail).toHaveBeenCalledWith(records[1].path)
    expect(view.lastFrame()).toContain('Detail: repeat')
    expect(view.lastFrame()).toContain(records[1].path)
    expect(view.lastFrame()).toContain('Scenarios: 2')
    expect(view.lastFrame()).not.toContain('task hidden 9')
    expect(view.lastFrame()).toContain('(truncated)')
    view.cleanup()
  })

  it('localizes History loading, empty, and refresh failure while keeping the last valid list', async () => {
    let resolveFirst!: (value: { records: HistoryRecordOutput[], summary: { matched: number, returned: number, hasMore: boolean } }) => void
    const first = new Promise<{ records: HistoryRecordOutput[], summary: { matched: number, returned: number, hasMore: boolean } }>((resolve) => {
      resolveFirst = resolve
    })
    const record: HistoryRecordOutput = { date: '2026-07-24', workRef: 'done', group: null, kind: 'feature', summary: '完成', summaryTruncated: false, path: '.rsp/archives/2026-07-24_done.md' }
    const inspectHistory = vi.fn()
      .mockImplementationOnce(() => first)
      .mockRejectedValueOnce(new Error('archive unreadable'))
    const view = render(React.createElement(DashboardApp, {
      initialSnapshot: snapshot,
      messages: catalogs['zh-CN'],
      inspectStatus: vi.fn(async () => snapshot),
      inspectHistory,
      inspectHistoryDetail: vi.fn(),
    }))
    view.stdin.write('\t')
    await new Promise(resolve => setImmediate(resolve))
    view.stdin.write('\t')
    await new Promise(resolve => setImmediate(resolve))
    await new Promise(resolve => setImmediate(resolve))
    expect(view.lastFrame()).toContain('正在加载归档历史')
    resolveFirst({ records: [record], summary: { matched: 1, returned: 1, hasMore: false } })
    await new Promise(resolve => setImmediate(resolve))
    expect(view.lastFrame()).toContain('done')
    view.stdin.write('r')
    await new Promise(resolve => setImmediate(resolve))
    expect(view.lastFrame()).toContain('归档历史刷新失败')
    expect(view.lastFrame()).toContain('done')
    view.cleanup()
  })

  it('renders the bounded History empty state without requesting detail', async () => {
    const inspectHistoryDetail = vi.fn()
    const view = render(React.createElement(DashboardApp, {
      initialSnapshot: snapshot,
      messages: catalogs.en,
      inspectStatus: vi.fn(async () => snapshot),
      inspectHistory: vi.fn(async () => ({ records: [], summary: { matched: 0, returned: 0, hasMore: false } })),
      inspectHistoryDetail,
    }))
    view.stdin.write('\t')
    await new Promise(resolve => setImmediate(resolve))
    view.stdin.write('\t')
    await new Promise(resolve => setImmediate(resolve))
    await new Promise(resolve => setImmediate(resolve))
    expect(view.lastFrame()).toContain('No archived Changes in the bounded result.')
    expect(inspectHistoryDetail).not.toHaveBeenCalled()
    view.cleanup()
  })

  it('serializes History refresh and coalesces repeated requests into one queued run', async () => {
    const empty = { records: [], summary: { matched: 0, returned: 0, hasMore: false } }
    let resolveRefresh!: (value: typeof empty) => void
    const refresh = new Promise<typeof empty>((resolve) => {
      resolveRefresh = resolve
    })
    const inspectHistory = vi.fn()
      .mockResolvedValueOnce(empty)
      .mockImplementationOnce(() => refresh)
      .mockResolvedValueOnce(empty)
    const view = render(React.createElement(DashboardApp, {
      initialSnapshot: snapshot,
      messages: catalogs.en,
      inspectStatus: vi.fn(async () => snapshot),
      inspectHistory,
      inspectHistoryDetail: vi.fn(),
    }))
    view.stdin.write('\t')
    await new Promise(resolve => setImmediate(resolve))
    view.stdin.write('\t')
    await new Promise(resolve => setImmediate(resolve))
    await new Promise(resolve => setImmediate(resolve))
    expect(inspectHistory).toHaveBeenCalledTimes(1)

    view.stdin.write('r')
    await new Promise(resolve => setImmediate(resolve))
    view.stdin.write('r')
    await new Promise(resolve => setImmediate(resolve))
    view.stdin.write('r')
    await new Promise(resolve => setImmediate(resolve))
    expect(inspectHistory).toHaveBeenCalledTimes(2)

    resolveRefresh(empty)
    await new Promise(resolve => setImmediate(resolve))
    await new Promise(resolve => setImmediate(resolve))
    expect(inspectHistory).toHaveBeenCalledTimes(3)
    view.cleanup()
  })

  it('shows a detail failure only while its archive path remains selected', async () => {
    const records: HistoryRecordOutput[] = [
      { date: '2026-07-24', workRef: 'first', group: null, kind: 'feature', summary: 'first', summaryTruncated: false, path: '.rsp/archives/2026-07-24_first.md' },
      { date: '2026-07-24', workRef: 'second', group: null, kind: 'feature', summary: 'second', summaryTruncated: false, path: '.rsp/archives/2026-07-24_second.md' },
    ]
    const view = render(React.createElement(DashboardApp, {
      initialSnapshot: snapshot,
      messages: catalogs.en,
      inspectStatus: vi.fn(async () => snapshot),
      inspectHistory: vi.fn(async () => ({ records, summary: { matched: 2, returned: 2, hasMore: false } })),
      inspectHistoryDetail: vi.fn(async () => { throw new Error('first detail failed') }),
    }))
    view.stdin.write('\t')
    await new Promise(resolve => setImmediate(resolve))
    view.stdin.write('\t')
    await new Promise(resolve => setImmediate(resolve))
    await new Promise(resolve => setImmediate(resolve))
    view.stdin.write('\r')
    await new Promise(resolve => setImmediate(resolve))
    await new Promise(resolve => setImmediate(resolve))
    expect(view.lastFrame()).toContain('first detail failed')

    view.stdin.write('j')
    await new Promise(resolve => setImmediate(resolve))
    expect(view.lastFrame()).toContain('Detail: second')
    expect(view.lastFrame()).not.toContain('first detail failed')
    view.cleanup()
  })

  it('keeps a long wide-character History detail diagnostic on one bounded row', async () => {
    const record: HistoryRecordOutput = { date: '2026-07-24', workRef: 'detail-error', group: null, kind: 'feature', summary: 'summary', summaryTruncated: false, path: '.rsp/archives/2026-07-24_detail-error.md' }
    const diagnostic = `.rsp/archives/${'错误路径'.repeat(30)} unreadable`
    const view = render(React.createElement(DashboardApp, {
      initialSnapshot: snapshot,
      initialDimensions: { width: 40, height: 12 },
      messages: catalogs.en,
      inspectStatus: vi.fn(async () => snapshot),
      inspectHistory: vi.fn(async () => ({ records: [record], summary: { matched: 1, returned: 1, hasMore: false } })),
      inspectHistoryDetail: vi.fn(async () => { throw new Error(diagnostic) }),
    }))
    view.stdin.write('\t')
    await new Promise(resolve => setImmediate(resolve))
    view.stdin.write('\t')
    await new Promise(resolve => setImmediate(resolve))
    await new Promise(resolve => setImmediate(resolve))
    view.stdin.write('\r')
    await new Promise(resolve => setImmediate(resolve))
    await new Promise(resolve => setImmediate(resolve))
    const frame = view.lastFrame()!
    expect(frame).toContain('Archive detail failed:')
    expect(frame).toContain('…')
    expect(frame.split('\n')).toHaveLength(12)
    expect(frame.split('\n').every(line => displayWidth(line) <= 40)).toBe(true)
    view.cleanup()
  })

  it('bounds complete History rows and detail identities by terminal display cells', async () => {
    const workRef = 'wide-'.repeat(30)
    const kind = '类型'.repeat(60)
    const record: HistoryRecordOutput = { date: '2026-07-24', workRef, group: null, kind, summary: 'summary', summaryTruncated: false, path: `.rsp/archives/2026-07-24_${workRef}.md` }
    const detail: HistoryDetailOutput = {
      ...record,
      scenarioCount: 0,
      checkboxes: {
        tasks: { done: 0, todo: 0, progress: 0, dropped: 0, total: 0 },
        verify: { done: 0, todo: 0, progress: 0, dropped: 0, total: 0 },
      },
      evidence: {
        tasks: { items: [], truncated: false },
        verify: { items: [], truncated: false },
        blockers: { items: [], truncated: false },
      },
    }
    const view = render(React.createElement(DashboardApp, {
      initialSnapshot: snapshot,
      messages: catalogs.en,
      inspectStatus: vi.fn(async () => snapshot),
      inspectHistory: vi.fn(async () => ({ records: [record], summary: { matched: 1, returned: 1, hasMore: false } })),
      inspectHistoryDetail: vi.fn(async () => detail),
    }))
    view.stdin.write('\t')
    await new Promise(resolve => setImmediate(resolve))
    view.stdin.write('\t')
    await new Promise(resolve => setImmediate(resolve))
    await new Promise(resolve => setImmediate(resolve))
    expect(view.lastFrame()!.split('\n').every(line => displayWidth(line) <= 100)).toBe(true)

    view.stdin.write('\r')
    await new Promise(resolve => setImmediate(resolve))
    await new Promise(resolve => setImmediate(resolve))
    expect(view.lastFrame()!.split('\n').every(line => displayWidth(line) <= 100)).toBe(true)
    expect(view.lastFrame()).toContain('…')
    view.cleanup()
  })

  it('does not suppress a current-scope empty state while History loads in the background', async () => {
    const emptySnapshot: ProjectStatusSnapshot = {
      manage: { activation: 'explicit', closeout: 'local' },
      language: { artifacts: null, commit: null },
      focused: [],
      records: [],
      groups: [],
      plan: { nodes: [], ready: [], edges: [], blocked: [], waves: [] },
      archiveTrend: [],
      diagnostics: [],
      runtime: [],
    }
    const inspectHistory = vi.fn(() => new Promise<never>(() => {}))
    const view = render(React.createElement(DashboardApp, {
      initialSnapshot: emptySnapshot,
      messages: catalogs.en,
      inspectStatus: vi.fn(async () => emptySnapshot),
      inspectHistory,
      inspectHistoryDetail: vi.fn(),
    }))
    view.stdin.write('\t')
    await new Promise(resolve => setImmediate(resolve))
    view.stdin.write('\t')
    await new Promise(resolve => setImmediate(resolve))
    await new Promise(resolve => setImmediate(resolve))
    expect(view.lastFrame()).toContain('Loading archive history')

    view.stdin.write('\t')
    await new Promise(resolve => setImmediate(resolve))
    expect(view.lastFrame()!.match(/No open work\./g)).toHaveLength(2)
    view.cleanup()
  })

  it.each([8, 10])('renders compact actionable History detail without overflow at height %i', async (height) => {
    const record: HistoryRecordOutput = { date: '2026-07-24', workRef: 'compact', group: null, kind: 'feature', summary: 'summary', summaryTruncated: false, path: '.rsp/archives/2026-07-24_compact.md' }
    const detail: HistoryDetailOutput = {
      ...record,
      scenarioCount: 1,
      checkboxes: {
        tasks: { done: 1, todo: 0, progress: 0, dropped: 0, total: 1 },
        verify: { done: 1, todo: 0, progress: 0, dropped: 0, total: 1 },
      },
      evidence: {
        tasks: { items: ['task'], truncated: true },
        verify: { items: ['verify'], truncated: true },
        blockers: { items: ['blocker'], truncated: true },
      },
    }
    const view = render(React.createElement(DashboardApp, {
      initialSnapshot: snapshot,
      initialDimensions: { width: 80, height },
      messages: catalogs.en,
      inspectStatus: vi.fn(async () => snapshot),
      inspectHistory: vi.fn(async () => ({ records: [record], summary: { matched: 1, returned: 1, hasMore: false } })),
      inspectHistoryDetail: vi.fn(async () => detail),
    }))
    view.stdin.write('\t')
    await new Promise(resolve => setImmediate(resolve))
    view.stdin.write('\t')
    await new Promise(resolve => setImmediate(resolve))
    await new Promise(resolve => setImmediate(resolve))
    view.stdin.write('\r')
    await new Promise(resolve => setImmediate(resolve))
    await new Promise(resolve => setImmediate(resolve))
    expect(view.lastFrame()).toContain('Resize to at least 12 rows to view History detail.')
    expect(view.lastFrame()!.split('\n')).toHaveLength(height)
    view.cleanup()
  })

  it('keeps loaded History detail within height 20 during bounded refresh loading and a long wide-character error row', async () => {
    const record: HistoryRecordOutput = { date: '2026-07-24', workRef: 'dynamic', group: null, kind: '类型'.repeat(20), summary: 'summary', summaryTruncated: false, path: '.rsp/archives/2026-07-24_dynamic.md' }
    const detail: HistoryDetailOutput = {
      ...record,
      scenarioCount: 1,
      checkboxes: {
        tasks: { done: 1, todo: 0, progress: 0, dropped: 0, total: 1 },
        verify: { done: 1, todo: 0, progress: 0, dropped: 0, total: 1 },
      },
      evidence: {
        tasks: { items: ['任务'.repeat(30), 'task-2', 'task-3'], truncated: true },
        verify: { items: ['验证'.repeat(30), 'verify-2', 'verify-3'], truncated: true },
        blockers: { items: ['阻塞'.repeat(30), 'blocker-2', 'blocker-3'], truncated: true },
      },
    }
    let rejectRefresh!: (error: Error) => void
    const refresh = new Promise<never>((_resolve, reject) => {
      rejectRefresh = reject
    })
    const inspectHistory = vi.fn()
      .mockResolvedValueOnce({ records: [record], summary: { matched: 1, returned: 1, hasMore: false } })
      .mockImplementationOnce(() => refresh)
    const view = render(React.createElement(DashboardApp, {
      initialSnapshot: snapshot,
      initialDimensions: { width: 40, height: 20 },
      messages: catalogs.en,
      inspectStatus: vi.fn(async () => snapshot),
      inspectHistory,
      inspectHistoryDetail: vi.fn(async () => detail),
    }))
    view.stdin.write('\t')
    await new Promise(resolve => setImmediate(resolve))
    view.stdin.write('\t')
    await new Promise(resolve => setImmediate(resolve))
    await new Promise(resolve => setImmediate(resolve))
    view.stdin.write('\r')
    await new Promise(resolve => setImmediate(resolve))
    await new Promise(resolve => setImmediate(resolve))
    view.stdin.write('r')
    await new Promise(resolve => setImmediate(resolve))
    expect(view.lastFrame()).toContain('Loading archive history')
    expect(view.lastFrame()!.split('\n')).toHaveLength(20)
    expect(view.lastFrame()!.split('\n').every(line => displayWidth(line) <= 40)).toBe(true)

    rejectRefresh(new Error(`.rsp/archives/${'刷新错误'.repeat(30)} unreadable`))
    await new Promise(resolve => setImmediate(resolve))
    await new Promise(resolve => setImmediate(resolve))
    expect(view.lastFrame()).toContain('Archive history refresh failed')
    const errorFrame = view.lastFrame()!
    const errorLine = errorFrame.split('\n').find(line => line.includes('Archive history refresh failed'))
    expect(errorLine).toContain('…')
    expect(errorFrame.split('\n')).toHaveLength(20)
    expect(errorFrame.split('\n').every(line => displayWidth(line) <= 40)).toBe(true)
    view.cleanup()
  })

  it('keeps date, WorkRef, kind, and summary visible in a 40-column History row', async () => {
    const record: HistoryRecordOutput = { date: '2026-07-24', workRef: 'work-reference', group: null, kind: '类型很长', summary: 'summary-visible', summaryTruncated: false, path: '.rsp/archives/2026-07-24_work-reference.md' }
    const view = render(React.createElement(DashboardApp, {
      initialSnapshot: snapshot,
      initialDimensions: { width: 40, height: 20 },
      messages: catalogs.en,
      inspectStatus: vi.fn(async () => snapshot),
      inspectHistory: vi.fn(async () => ({ records: [record], summary: { matched: 1, returned: 1, hasMore: false } })),
      inspectHistoryDetail: vi.fn(),
    }))
    view.stdin.write('\t')
    await new Promise(resolve => setImmediate(resolve))
    view.stdin.write('\t')
    await new Promise(resolve => setImmediate(resolve))
    await new Promise(resolve => setImmediate(resolve))
    const frame = view.lastFrame()!
    expect(frame).toContain('2026-07-24')
    expect(frame).toContain('work')
    expect(frame).toContain('类型')
    expect(frame).toContain('summary')
    expect(frame.split('\n').every(line => displayWidth(line) <= 40)).toBe(true)
    view.cleanup()
  })

  it.each([[40, 16], [80, 20]] as const)('renders structured hanging-wrapped History evidence within %i columns by %i rows', async (width, height) => {
    const record: HistoryRecordOutput = { date: '2026-07-24', workRef: 'structured', group: null, kind: 'feature', summary: 'summary', summaryTruncated: false, path: '.rsp/archives/2026-07-24_structured.md' }
    const detail: HistoryDetailOutput = {
      ...record,
      scenarioCount: 1,
      checkboxes: {
        tasks: { done: 1, todo: 0, progress: 0, dropped: 0, total: 1 },
        verify: { done: 0, todo: 1, progress: 0, dropped: 0, total: 1 },
      },
      evidence: {
        tasks: { items: [`[x] ${'ascii'.repeat(10)}${'宽字符'.repeat(12)}` + ' keep `code`'], truncated: true },
        verify: { items: [`- ${'verify'.repeat(10)}${'验证'.repeat(12)}`], truncated: true },
        blockers: { items: [`[-] ${'blocked'.repeat(8)}${'阻塞'.repeat(12)}`], truncated: true },
      },
    }
    const view = render(React.createElement(DashboardApp, {
      initialSnapshot: snapshot,
      initialDimensions: { width, height },
      messages: catalogs.en,
      inspectStatus: vi.fn(async () => snapshot),
      inspectHistory: vi.fn(async () => ({ records: [record], summary: { matched: 1, returned: 1, hasMore: false } })),
      inspectHistoryDetail: vi.fn(async () => detail),
    }))
    view.stdin.write('\t')
    await new Promise(resolve => setImmediate(resolve))
    view.stdin.write('\t')
    await new Promise(resolve => setImmediate(resolve))
    await new Promise(resolve => setImmediate(resolve))
    view.stdin.write('\r')
    await new Promise(resolve => setImmediate(resolve))
    await new Promise(resolve => setImmediate(resolve))
    const frame = view.lastFrame()!
    expect(frame.match(/^Tasks:/gm)).toHaveLength(1)
    expect(frame.match(/^Verify:/gm)).toHaveLength(1)
    expect(frame.match(/^Blockers:/gm)).toHaveLength(1)
    expect(frame).toContain('Tasks: 1/1')
    expect(frame).toContain('Verify: 0/1')
    expect(frame).toContain('Blockers:')
    expect(frame).toContain('  ✓')
    expect(frame).toContain('  •')
    expect(frame).toContain('  −')
    expect(frame).toContain('(truncated)')
    expect(frame.split('\n').some(line => line.startsWith('    '))).toBe(true)
    expect(frame.split('\n')).toHaveLength(height)
    expect(frame.split('\n').every(line => displayWidth(line) <= width)).toBe(true)
    view.cleanup()
  })
})
