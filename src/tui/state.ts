import type { ProjectStatusRecord, ProjectStatusSnapshot } from '../status/model.js'
import type { ChangeGroupStatusOutput } from '../types.js'

export type DashboardScope = 'changes' | 'groups'
export type DashboardLayout = 'wide' | 'narrow' | 'compact'
export type DashboardMode = 'list' | 'detail' | 'help' | 'search'

export interface DashboardItem {
  workRef: string
  title: string
  searchable: string
  record?: ProjectStatusRecord
  group?: ChangeGroupStatusOutput
}

export interface DashboardState {
  snapshot: ProjectStatusSnapshot
  scope: DashboardScope
  filter: string
  selectedWorkRef: string | null
  selectedIndex: number
  viewportStart: number
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
    | { type: 'resize', width: number, height: number }
    | { type: 'mode', mode: DashboardMode }
    | { type: 'snapshot', snapshot: ProjectStatusSnapshot }
    | { type: 'refresh-requested' }
    | { type: 'refresh-failed', message: string }

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

function itemsFor(state: Pick<DashboardState, 'snapshot' | 'scope' | 'filter'>): DashboardItem[] {
  const items: DashboardItem[] = state.scope === 'changes'
    ? state.snapshot.records.map(record => ({ workRef: record.output.name, title: record.title, searchable: `${record.output.name} ${record.title}`, record }))
    : state.snapshot.groups.map(group => ({
        workRef: group.name,
        title: group.name,
        searchable: `${group.name} ${group.slices.map(slice => slice.name).join(' ')}`,
        group,
      }))
  const query = state.filter.trim().toLocaleLowerCase()
  return query ? items.filter(item => item.searchable.toLocaleLowerCase().includes(query)) : items
}

function viewportCapacity(state: Pick<DashboardState, 'height'>): number {
  return Math.max(1, state.height - 7)
}

function reconcile(state: DashboardState, preferredWorkRef = state.selectedWorkRef, preferredIndex = state.selectedIndex): DashboardState {
  const items = itemsFor(state)
  if (items.length === 0)
    return { ...state, selectedWorkRef: null, selectedIndex: 0, viewportStart: 0 }
  const retained = preferredWorkRef ? items.findIndex(item => item.workRef === preferredWorkRef) : -1
  const selectedIndex = retained >= 0 ? retained : Math.max(0, Math.min(preferredIndex, items.length - 1))
  const capacity = viewportCapacity(state)
  const viewportStart = selectedIndex < state.viewportStart
    ? selectedIndex
    : selectedIndex >= state.viewportStart + capacity
      ? selectedIndex - capacity + 1
      : Math.min(state.viewportStart, Math.max(0, items.length - capacity))
  return { ...state, selectedWorkRef: items[selectedIndex].workRef, selectedIndex, viewportStart }
}

export function initialDashboardState(snapshot: ProjectStatusSnapshot, dimensions: { width: number, height: number }): DashboardState {
  return reconcile({
    snapshot,
    scope: 'changes',
    filter: '',
    selectedWorkRef: snapshot.focused[0] ?? null,
    selectedIndex: 0,
    viewportStart: 0,
    width: dimensions.width,
    height: dimensions.height,
    layout: dashboardLayout(dimensions.width, dimensions.height),
    mode: 'list',
    refresh: { running: false, queued: false, error: null },
  })
}

export function reduceDashboard(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case 'move': {
      const items = itemsFor(state)
      const index = Math.max(0, Math.min(state.selectedIndex + action.delta, Math.max(0, items.length - 1)))
      return reconcile({ ...state, selectedIndex: index, selectedWorkRef: items[index]?.workRef ?? null }, items[index]?.workRef ?? null, index)
    }
    case 'filter':
      return reconcile({ ...state, filter: action.value, selectedIndex: 0, viewportStart: 0 })
    case 'scope':
      return reconcile({ ...state, scope: action.scope, filter: '', selectedIndex: 0, viewportStart: 0 }, null, 0)
    case 'resize':
      return reconcile({ ...state, width: action.width, height: action.height, layout: dashboardLayout(action.width, action.height) })
    case 'mode':
      return { ...state, mode: action.mode }
    case 'snapshot':
      return reconcile({ ...state, snapshot: action.snapshot, refresh: { running: false, queued: false, error: null } })
    case 'refresh-requested':
      return { ...state, refresh: { running: true, queued: state.refresh.running, error: null } }
    case 'refresh-failed':
      return { ...state, refresh: { running: false, queued: false, error: action.message } }
  }
}

export function allItems(state: DashboardState): DashboardItem[] {
  return itemsFor(state)
}

export function visibleItems(state: DashboardState): DashboardItem[] {
  return itemsFor(state).slice(state.viewportStart, state.viewportStart + viewportCapacity(state))
}
