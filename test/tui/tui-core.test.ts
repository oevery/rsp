import type { ProjectStatusSnapshot } from '../../src/status/model.js'
import type { HistoryRecordOutput } from '../../src/types.js'
import { Writable } from 'node:stream'
import { describe, expect, it } from 'vitest'
import { displayWidth, truncateDisplay } from '../../src/tui/display.js'
import { resolveUiLocale } from '../../src/tui/i18n/locale.js'
import { catalogs } from '../../src/tui/i18n/messages.js'
import { projectItemDependencyForest, projectItemState, projectNextAction } from '../../src/tui/projection.js'
import { shouldAutoLaunchUi, validateUiArgs } from '../../src/tui/route.js'
import { dashboardListWidth, initialDashboardState, reduceDashboard, visibleItems } from '../../src/tui/state.js'
import { openTerminalSession } from '../../src/tui/terminal.js'

function snapshot(names: string[]): ProjectStatusSnapshot {
  return {
    focused: names.slice(0, 1),
    records: names.map((name, index) => ({
      output: {
        name,
        kind: 'feature',
        progress: { done: index, total: names.length },
        ageDays: 0,
        isFocused: index === 0,
        isBlocked: index === names.length - 1,
        path: `.rsp/changes/${name}.md`,
      },
      progressKnown: true,
      title: `Change ${name}`,
      blockerEntries: index === names.length - 1 ? ['waiting for owner'] : [],
      readiness: {
        incompleteTasks: names.length - index,
        incompleteVerify: 1,
        activeBlockers: index === names.length - 1,
        missingScenarios: false,
        deterministic: 'pass',
        semantic: 'needs-review',
        archiveReady: 'no',
      },
    })),
    groups: [],
    plan: {
      nodes: names.map((name, index) => ({ name, selection: 'selected', state: index === names.length - 1 ? 'blocked' : 'ready' })),
      ready: names.slice(0, -1),
      edges: [],
      blocked: names.length ? [{ change: names.at(-1)!, requires: [], external: true }] : [],
      waves: [names.slice(0, -1)],
    },
    archiveTrend: [],
    diagnostics: [],
    runtime: [],
  }
}

describe('tUI routing', () => {
  it('auto-launches only for an empty safe dual-TTY invocation', () => {
    expect(shouldAutoLaunchUi([], { stdinTty: true, stdoutTty: true, term: 'xterm-256color' })).toBe(true)
    expect(shouldAutoLaunchUi([], { stdinTty: false, stdoutTty: true, term: 'xterm-256color' })).toBe(false)
    expect(shouldAutoLaunchUi([], { stdinTty: true, stdoutTty: true, term: 'dumb' })).toBe(false)
    expect(shouldAutoLaunchUi([], { stdinTty: true, stdoutTty: true, term: 'xterm', ci: 'true' })).toBe(false)
    expect(shouldAutoLaunchUi([], { stdinTty: true, stdoutTty: true, term: 'xterm', ci: '' })).toBe(false)
    expect(shouldAutoLaunchUi([], { stdinTty: true, stdoutTty: true, term: 'xterm', ci: 'false' })).toBe(true)
    expect(shouldAutoLaunchUi(['--help'], { stdinTty: true, stdoutTty: true, term: 'xterm' })).toBe(false)
  })

  it('validates the explicit language before the interactive entry loads', () => {
    expect(validateUiArgs([])).toEqual({ lang: 'auto' })
    expect(validateUiArgs(['--lang', 'zh-CN'])).toEqual({ lang: 'zh-CN' })
    expect(() => validateUiArgs(['--lang', 'fr'])).toThrow('auto, en, or zh-CN')
    expect(() => validateUiArgs(['--unknown'])).toThrow('Unknown rsp ui option')
  })
})

describe('tUI locale', () => {
  it('resolves explicit, environment, and host locales deterministically', () => {
    expect(resolveUiLocale('zh-CN', undefined, 'en-US')).toBe('zh-CN')
    expect(resolveUiLocale('auto', 'en', 'zh-CN')).toBe('en')
    expect(resolveUiLocale('auto', 'fr', 'zh-Hans-CN')).toBe('zh-CN')
    expect(resolveUiLocale('auto', undefined, 'zh_TW.UTF-8')).toBe('en')
    expect(resolveUiLocale('auto', undefined, 'zh-Hant-HK')).toBe('en')
    expect(resolveUiLocale('auto', undefined, 'zh-Hans-SG')).toBe('zh-CN')
    expect(resolveUiLocale('auto', undefined, 'de-DE')).toBe('en')
  })

  it('keeps English and Chinese catalogs in key parity', () => {
    expect(Object.keys(catalogs.en).sort()).toEqual(Object.keys(catalogs['zh-CN']).sort())
  })
})

describe('dashboard projection', () => {
  it('keeps focus orthogonal to blocked and ready execution state', () => {
    const input = snapshot(['focused-ready', 'focused-blocked'])
    input.records[1].output.isFocused = true
    input.focused.push('focused-blocked')
    expect(projectItemState({ type: 'change', key: 'focused-ready', workRef: 'focused-ready', title: '', searchable: '', record: input.records[0] }, input)).toEqual({ focused: true, execution: 'ready' })
    const blocked = { type: 'change' as const, key: 'focused-blocked', workRef: 'focused-blocked', title: '', searchable: '', record: input.records[1] }
    expect(projectItemState(blocked, input)).toEqual({ focused: true, execution: 'blocked' })
    expect(projectNextAction(blocked, input)).toEqual({ kind: 'blocked' })
  })

  it('projects transitive Group dependencies and only valid next actions', () => {
    const input = snapshot(['delivery/api', 'foundation', 'setup'])
    input.groups = [{ name: 'delivery', path: '.rsp/changes/delivery/00-brief.md', slices: [{ name: 'delivery/api', boundary: 'API', state: 'open' }], completion: { done: 0, total: 1 }, blockers: false, readyToClose: false, warnings: [] }]
    input.plan.edges = [
      { change: 'delivery/api', requires: 'foundation', reason: 'API needs foundation', state: 'open' },
      { change: 'foundation', requires: 'setup', reason: 'foundation needs setup', state: 'archived' },
    ]
    input.plan.ready = ['delivery/api']
    const item = { type: 'group' as const, key: 'delivery', workRef: 'delivery', title: '', searchable: '', group: input.groups[0] }
    expect(projectItemDependencyForest(item, input)[0]?.children[0]?.children[0]?.name).toBe('setup')
    expect(projectNextAction(item, input)).toEqual({ kind: 'command', value: 'rsp show delivery/api' })
    input.groups[0].readyToClose = true
    expect(projectNextAction(item, input)).toEqual({ kind: 'command', value: 'rsp group close delivery' })
    input.groups[0].readyToClose = false
    input.plan.ready = []
    expect(projectNextAction(item, input)).toEqual({ kind: 'brief', value: '.rsp/changes/delivery/00-brief.md' })
  })
})

describe('terminal presentation primitives', () => {
  it('caps the wide work list while preserving the full narrow width', () => {
    expect(dashboardListWidth('wide', 100)).toBe(40)
    expect(dashboardListWidth('wide', 200)).toBe(56)
    expect(dashboardListWidth('narrow', 52)).toBe(52)
  })

  it('measures and truncates CJK text by display cells', () => {
    expect(displayWidth('RSP 仪表盘')).toBe(10)
    expect(truncateDisplay('变更组-alpha', 8)).toBe('变更组-…')
    expect(displayWidth(truncateDisplay('变更组-alpha', 8))).toBeLessThanOrEqual(8)
  })

  it('restores alternate screen and cursor exactly once', () => {
    let output = ''
    const stream = new Writable({
      write(chunk, _encoding, callback) {
        output += String(chunk)
        callback()
      },
    })
    const session = openTerminalSession(stream, { screenReader: false })
    session.cleanup()
    session.cleanup()
    expect(output).toBe('\u001B[?1049h\u001B[?25l\u001B[?25h\u001B[?1049l')
  })

  it('does not use destructive screen control in screen-reader mode', () => {
    let output = ''
    const stream = new Writable({
      write(chunk, _encoding, callback) {
        output += String(chunk)
        callback()
      },
    })
    const session = openTerminalSession(stream, { screenReader: true })
    session.cleanup()
    expect(output).toBe('')
  })
})

describe('dashboard reducer', () => {
  it('keeps selection in a bounded viewport and recovers by WorkRef', () => {
    const first = snapshot(['a', 'b', 'c', 'd', 'e'])
    let state = initialDashboardState(first, { width: 80, height: 8 })
    state = reduceDashboard(state, { type: 'move', delta: 4 })
    expect(state.navigation.changes.selectedKey).toBe('e')
    expect(visibleItems(state).some(item => item.workRef === 'e')).toBe(true)

    state = reduceDashboard(state, { type: 'snapshot', snapshot: snapshot(['a', 'b', 'c']) })
    expect(state.navigation.changes.selectedKey).toBe('c')
  })

  it('filters, switches scope, handles resize, and retains last data on refresh failure', () => {
    const first = snapshot(['alpha', 'beta'])
    first.groups = [{ name: 'group-a', path: '.rsp/changes/group-a/00-brief.md', slices: [], completion: { done: 0, total: 1 }, blockers: false, readyToClose: false, warnings: [] }]
    let state = initialDashboardState(first, { width: 120, height: 24 })
    state = reduceDashboard(state, { type: 'filter', value: 'beta' })
    expect(visibleItems(state).map(item => item.workRef)).toEqual(['beta'])
    state = reduceDashboard(state, { type: 'scope', scope: 'groups' })
    expect(state.navigation.groups.selectedKey).toBe('group-a')
    state = reduceDashboard(state, { type: 'resize', width: 50, height: 10 })
    expect(state.layout).toBe('narrow')
    state = reduceDashboard(state, { type: 'refresh-failed', message: 'read failed' })
    expect(state.snapshot).toBe(first)
    expect(state.refresh.error).toBe('read failed')
  })

  it('coalesces repeated refresh requests', () => {
    let state = initialDashboardState(snapshot(['a']), { width: 80, height: 20 })
    state = reduceDashboard(state, { type: 'refresh-requested' })
    state = reduceDashboard(state, { type: 'refresh-requested' })
    expect(state.refresh).toMatchObject({ running: true, queued: true })
  })

  it('cycles through three independent scopes and selects repeated WorkRefs by archive path', () => {
    const records: HistoryRecordOutput[] = [
      { date: '2026-07-24', workRef: 'repeat', group: null, kind: 'feature', summary: 'new', summaryTruncated: false, path: '.rsp/archives/2026-07-24_repeat.md' },
      { date: '2026-07-23', workRef: 'repeat', group: null, kind: 'fix', summary: 'old', summaryTruncated: false, path: '.rsp/archives/2026-07-23_repeat.md' },
    ]
    let state = initialDashboardState(snapshot(['alpha']), { width: 80, height: 20 })
    state = reduceDashboard(state, { type: 'scope-next' })
    expect(state.scope).toBe('groups')
    state = reduceDashboard(state, { type: 'scope-next' })
    expect(state.scope).toBe('history')
    state = reduceDashboard(state, { type: 'history-list-requested', requestId: 1 })
    state = reduceDashboard(state, { type: 'history-list-loaded', requestId: 1, result: { records, summary: { matched: 2, returned: 2, hasMore: false } } })
    expect(visibleItems(state).map(item => item.key)).toEqual(records.map(record => record.path))
    state = reduceDashboard(state, { type: 'move', delta: 1 })
    expect(state.navigation.history.selectedKey).toBe(records[1].path)
    state = reduceDashboard(state, { type: 'filter', value: 'old' })
    state = reduceDashboard(state, { type: 'scope-next' })
    expect(state.scope).toBe('changes')
    expect(state.navigation.changes.filter).toBe('')
    state = reduceDashboard(state, { type: 'scope', scope: 'history' })
    expect(state.navigation.history.filter).toBe('old')
  })

  it('ignores stale history results and preserves the last valid list on failure', () => {
    const record: HistoryRecordOutput = { date: '2026-07-24', workRef: 'alpha', group: null, kind: 'feature', summary: 'done', summaryTruncated: false, path: '.rsp/archives/2026-07-24_alpha.md' }
    let state = initialDashboardState(snapshot([]), { width: 80, height: 20 })
    state = reduceDashboard(state, { type: 'history-list-requested', requestId: 1 })
    state = reduceDashboard(state, { type: 'history-list-requested', requestId: 2 })
    state = reduceDashboard(state, { type: 'history-list-loaded', requestId: 1, result: { records: [], summary: { matched: 0, returned: 0, hasMore: false } } })
    expect(state.history.status).toBe('loading')
    state = reduceDashboard(state, { type: 'history-list-loaded', requestId: 2, result: { records: [record], summary: { matched: 1, returned: 1, hasMore: false } } })
    state = reduceDashboard(state, { type: 'history-list-requested', requestId: 3 })
    state = reduceDashboard(state, { type: 'history-list-failed', requestId: 3, message: 'archive unreadable' })
    expect(state.history.records).toEqual([record])
    expect(state.history).toMatchObject({ status: 'error', error: 'archive unreadable' })
    state = reduceDashboard(state, { type: 'history-detail-requested', requestId: 1, path: record.path })
    state = reduceDashboard(state, { type: 'history-detail-failed', requestId: 1, message: 'detail oversized' })
    expect(state.history.records).toEqual([record])
    expect(state.history.detail.error).toBe('detail oversized')
    expect(state.scope).toBe('changes')
  })
})
