import type { ArchiveHistoryListResult } from '../history/model.js'
import type { SpecsDetailProjection, SpecsSearchProjection, SpecsTreeProjection } from '../specs/projection.js'
import type { ProjectStatusRecord, ProjectStatusSnapshot } from '../status/model.js'
import type { ChangeGroupStatusOutput, HistoryDetailOutput, HistoryRecordOutput } from '../types.js'

export type DashboardScope = 'work' | 'specs' | 'history'
export type DashboardLayout = 'wide' | 'narrow' | 'compact'
export type DashboardMode = 'list' | 'detail' | 'help' | 'search'

interface DashboardItemBase {
  key: string
  workRef: string
  title: string
  searchable: string
}

export interface ChangeDashboardItem extends DashboardItemBase {
  type: 'change'
  record: ProjectStatusRecord
}

export interface GroupDashboardItem extends DashboardItemBase {
  type: 'group'
  group: ChangeGroupStatusOutput
}

export interface HistoryDashboardItem extends DashboardItemBase {
  type: 'history'
  history: HistoryRecordOutput
}

export type DashboardItem = ChangeDashboardItem | GroupDashboardItem | HistoryDashboardItem

export interface DashboardNavigationState {
  filter: string
  selectedKey: string | null
  selectedIndex: number
  viewportStart: number
}

export interface DashboardHistoryState {
  status: 'idle' | 'loading' | 'ready' | 'error'
  records: HistoryRecordOutput[]
  summary: ArchiveHistoryListResult['summary'] | null
  error: string | null
  queued: boolean
  listRequestId: number
  detail: {
    record: HistoryDetailOutput | null
    loadingPath: string | null
    error: string | null
    errorPath: string | null
    requestId: number
  }
}

export interface DashboardSpecsState {
  status: 'idle' | 'loading' | 'ready' | 'stale' | 'error'
  tree: SpecsTreeProjection | null
  error: string | null
  listRequestId: number
  detail: { record: SpecsDetailProjection | null, loadingPath: string | null, error: string | null, requestId: number, scroll: number }
  search: { result: SpecsSearchProjection | null, loading: boolean, error: string | null, requestId: number, query: string }
}

export interface DashboardState {
  snapshot: ProjectStatusSnapshot
  scope: DashboardScope
  navigation: Record<DashboardScope, DashboardNavigationState>
  history: DashboardHistoryState
  specs: DashboardSpecsState
  width: number
  height: number
  layout: DashboardLayout
  mode: DashboardMode
  refresh: { running: boolean, queued: boolean, error: string | null }
}

export type DashboardAction
  = | { type: 'move', delta: number }
    | { type: 'filter', value: string }
    | { type: 'scope', scope: DashboardScope }
    | { type: 'scope-next' }
    | { type: 'resize', width: number, height: number }
    | { type: 'mode', mode: DashboardMode }
    | { type: 'snapshot', snapshot: ProjectStatusSnapshot }
    | { type: 'refresh-requested' }
    | { type: 'refresh-failed', message: string }
    | { type: 'history-list-requested', requestId: number }
    | { type: 'history-list-queued' }
    | { type: 'history-list-loaded', requestId: number, result: ArchiveHistoryListResult }
    | { type: 'history-list-failed', requestId: number, message: string }
    | { type: 'history-detail-requested', requestId: number, path: string }
    | { type: 'history-detail-loaded', requestId: number, record: HistoryDetailOutput }
    | { type: 'history-detail-failed', requestId: number, message: string }
    | { type: 'specs-tree-requested', requestId: number }
    | { type: 'specs-tree-loaded', requestId: number, result: SpecsTreeProjection }
    | { type: 'specs-tree-failed', requestId: number, message: string }
    | { type: 'specs-detail-requested', requestId: number, path: string }
    | { type: 'specs-detail-loaded', requestId: number, record: SpecsDetailProjection }
    | { type: 'specs-detail-failed', requestId: number, message: string }
    | { type: 'specs-search-requested', requestId: number, query: string }
    | { type: 'specs-search-loaded', requestId: number, result: SpecsSearchProjection }
    | { type: 'specs-search-failed', requestId: number, message: string }
    | { type: 'specs-scroll', offset: number }

export function dashboardLayout(width: number, height: number): DashboardLayout {
  if (width < 40 || height < 8)
    return 'compact'
  return width >= 96 ? 'wide' : 'narrow'
}

export function dashboardListWidth(layout: DashboardLayout, width: number): number {
  if (layout !== 'wide')
    return width
  return Math.min(56, Math.max(36, Math.floor(width * 0.4)))
}

function unfilteredItems(state: DashboardState, scope = state.scope): DashboardItem[] {
  if (scope === 'work') {
    const changes: DashboardItem[] = state.snapshot.records.map(record => ({
      type: 'change',
      key: record.output.name,
      workRef: record.output.name,
      title: record.output.summary ?? record.title,
      searchable: `${record.output.name} ${record.output.summary ?? ''} ${record.title}`,
      record,
    }))
    const groups: DashboardItem[] = state.snapshot.groups.map(group => ({
      type: 'group',
      key: group.name,
      workRef: group.name,
      title: group.summary ?? group.name,
      searchable: `${group.name} ${group.summary ?? ''} ${group.slices.map(slice => slice.name).join(' ')}`,
      group,
    }))
    return [...changes, ...groups]
  }
  if (scope === 'specs')
    return []
  return state.history.records.map(record => ({
    type: 'history',
    key: record.path,
    workRef: record.workRef,
    title: record.summary,
    searchable: `${record.date} ${record.workRef} ${record.kind} ${record.summary} ${record.path}`,
    history: record,
  }))
}

function itemsFor(state: DashboardState, scope = state.scope): DashboardItem[] {
  const query = state.navigation[scope].filter.trim().toLocaleLowerCase()
  const items = unfilteredItems(state, scope)
  return query ? items.filter(item => item.searchable.toLocaleLowerCase().includes(query)) : items
}

function viewportCapacity(state: Pick<DashboardState, 'height'>): number {
  return Math.max(1, state.height - 7)
}

function reconcileScope(state: DashboardState, scope: DashboardScope, preferredKey?: string | null, preferredIndex?: number): DashboardState {
  const current = state.navigation[scope]
  const items = itemsFor(state, scope)
  if (items.length === 0) {
    return {
      ...state,
      navigation: { ...state.navigation, [scope]: { ...current, selectedKey: null, selectedIndex: 0, viewportStart: 0 } },
    }
  }
  const retainedKey = preferredKey === undefined ? current.selectedKey : preferredKey
  const retained = retainedKey ? items.findIndex(item => item.key === retainedKey) : -1
  const candidateIndex = preferredIndex ?? current.selectedIndex
  const selectedIndex = retained >= 0 ? retained : Math.max(0, Math.min(candidateIndex, items.length - 1))
  const capacity = viewportCapacity(state)
  const viewportStart = selectedIndex < current.viewportStart
    ? selectedIndex
    : selectedIndex >= current.viewportStart + capacity
      ? selectedIndex - capacity + 1
      : Math.min(current.viewportStart, Math.max(0, items.length - capacity))
  return {
    ...state,
    navigation: {
      ...state.navigation,
      [scope]: { ...current, selectedKey: items[selectedIndex].key, selectedIndex, viewportStart },
    },
  }
}

function emptyNavigation(selectedKey: string | null = null): DashboardNavigationState {
  return { filter: '', selectedKey, selectedIndex: 0, viewportStart: 0 }
}

export function initialDashboardState(snapshot: ProjectStatusSnapshot, dimensions: { width: number, height: number }): DashboardState {
  return reconcileScope({
    snapshot,
    scope: 'work',
    navigation: {
      work: emptyNavigation(snapshot.focused[0] ?? null),
      specs: emptyNavigation(),
      history: emptyNavigation(),
    },
    history: {
      status: 'idle',
      records: [],
      summary: null,
      error: null,
      queued: false,
      listRequestId: 0,
      detail: { record: null, loadingPath: null, error: null, errorPath: null, requestId: 0 },
    },
    specs: {
      status: 'idle',
      tree: null,
      error: null,
      listRequestId: 0,
      detail: { record: null, loadingPath: null, error: null, requestId: 0, scroll: 0 },
      search: { result: null, loading: false, error: null, requestId: 0, query: '' },
    },
    width: dimensions.width,
    height: dimensions.height,
    layout: dashboardLayout(dimensions.width, dimensions.height),
    mode: 'list',
    refresh: { running: false, queued: false, error: null },
  }, 'work')
}

export function reduceDashboard(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case 'move': {
      const items = itemsFor(state)
      const current = state.navigation[state.scope]
      const index = Math.max(0, Math.min(current.selectedIndex + action.delta, Math.max(0, items.length - 1)))
      return reconcileScope(state, state.scope, items[index]?.key ?? null, index)
    }
    case 'filter': {
      const current = state.navigation[state.scope]
      const next = {
        ...state,
        navigation: { ...state.navigation, [state.scope]: { ...current, filter: action.value, selectedIndex: 0, viewportStart: 0 } },
      }
      return reconcileScope(next, state.scope, null, 0)
    }
    case 'scope':
      return reconcileScope({ ...state, scope: action.scope, mode: 'list' }, action.scope)
    case 'scope-next': {
      const next = state.scope === 'work' ? 'specs' : state.scope === 'specs' ? 'history' : 'work'
      return reconcileScope({ ...state, scope: next, mode: 'list' }, next)
    }
    case 'resize': {
      const next = { ...state, width: action.width, height: action.height, layout: dashboardLayout(action.width, action.height) }
      return reconcileScope(next, state.scope)
    }
    case 'mode':
      return { ...state, mode: action.mode }
    case 'snapshot': {
      const next = { ...state, snapshot: action.snapshot, refresh: { running: false, queued: false, error: null } }
      return reconcileScope(next, 'work')
    }
    case 'refresh-requested':
      return { ...state, refresh: { running: true, queued: state.refresh.running, error: null } }
    case 'refresh-failed':
      return { ...state, refresh: { running: false, queued: false, error: action.message } }
    case 'history-list-requested':
      return { ...state, history: { ...state.history, status: 'loading', error: null, queued: false, listRequestId: action.requestId } }
    case 'history-list-queued':
      return { ...state, history: { ...state.history, queued: true } }
    case 'history-list-loaded': {
      if (action.requestId !== state.history.listRequestId)
        return state
      const next = {
        ...state,
        history: { ...state.history, status: 'ready' as const, records: action.result.records, summary: action.result.summary, error: null },
      }
      return reconcileScope(next, 'history')
    }
    case 'history-list-failed':
      return action.requestId === state.history.listRequestId
        ? { ...state, history: { ...state.history, status: 'error', error: action.message } }
        : state
    case 'history-detail-requested':
      return {
        ...state,
        history: { ...state.history, detail: { ...state.history.detail, loadingPath: action.path, error: null, errorPath: null, requestId: action.requestId } },
      }
    case 'history-detail-loaded':
      return action.requestId === state.history.detail.requestId
        ? { ...state, history: { ...state.history, detail: { ...state.history.detail, record: action.record, loadingPath: null, error: null, errorPath: null } } }
        : state
    case 'history-detail-failed':
      return action.requestId === state.history.detail.requestId
        ? { ...state, history: { ...state.history, detail: { ...state.history.detail, loadingPath: null, error: action.message, errorPath: state.history.detail.loadingPath } } }
        : state
    case 'specs-tree-requested':
      return { ...state, specs: { ...state.specs, status: 'loading', error: null, listRequestId: action.requestId } }
    case 'specs-tree-loaded':
      return action.requestId === state.specs.listRequestId
        ? { ...state, specs: { ...state.specs, status: 'ready', tree: action.result, error: null } }
        : state
    case 'specs-tree-failed':
      return action.requestId === state.specs.listRequestId
        ? { ...state, specs: { ...state.specs, status: state.specs.tree ? 'stale' : 'error', error: action.message } }
        : state
    case 'specs-detail-requested':
      return { ...state, specs: { ...state.specs, detail: { ...state.specs.detail, loadingPath: action.path, error: null, requestId: action.requestId, scroll: 0 } } }
    case 'specs-detail-loaded':
      return action.requestId === state.specs.detail.requestId
        ? { ...state, specs: { ...state.specs, detail: { ...state.specs.detail, record: action.record, loadingPath: null, error: null } } }
        : state
    case 'specs-detail-failed':
      return action.requestId === state.specs.detail.requestId
        ? { ...state, specs: { ...state.specs, detail: { ...state.specs.detail, loadingPath: null, error: action.message } } }
        : state
    case 'specs-search-requested':
      return { ...state, specs: { ...state.specs, search: { ...state.specs.search, loading: true, error: null, query: action.query, requestId: action.requestId } } }
    case 'specs-search-loaded':
      return action.requestId === state.specs.search.requestId
        ? { ...state, specs: { ...state.specs, search: { ...state.specs.search, loading: false, result: action.result, error: null } } }
        : state
    case 'specs-search-failed':
      return action.requestId === state.specs.search.requestId
        ? { ...state, specs: { ...state.specs, search: { ...state.specs.search, loading: false, error: action.message } } }
        : state
    case 'specs-scroll':
      return { ...state, specs: { ...state.specs, detail: { ...state.specs.detail, scroll: Math.max(0, action.offset) } } }
  }
}

export function allItems(state: DashboardState): DashboardItem[] {
  return itemsFor(state)
}

export function visibleItems(state: DashboardState): DashboardItem[] {
  const navigation = state.navigation[state.scope]
  return itemsFor(state).slice(navigation.viewportStart, navigation.viewportStart + viewportCapacity(state))
}
