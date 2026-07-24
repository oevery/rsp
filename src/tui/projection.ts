import type { DependencyForestNode } from '../status/dependency-forest.js'
import type { ProjectStatusSnapshot } from '../status/model.js'
import type { DashboardItem } from './state.js'
import { projectDependencyForest } from '../status/dependency-forest.js'

export type DashboardExecutionState = 'blocked' | 'ready' | 'waiting'

export interface DashboardItemState {
  focused: boolean
  execution: DashboardExecutionState
}

export function projectItemState(item: DashboardItem, snapshot: ProjectStatusSnapshot): DashboardItemState {
  const blocked = Boolean(item.record?.output.isBlocked || item.group?.blockers)
  const ready = snapshot.plan.ready.includes(item.workRef) || Boolean(item.group?.readyToClose)
  return {
    focused: Boolean(item.record?.output.isFocused),
    execution: blocked ? 'blocked' : ready ? 'ready' : 'waiting',
  }
}

export function projectItemDependencyForest(item: DashboardItem, snapshot: ProjectStatusSnapshot): DependencyForestNode[] {
  const roots = item.group ? item.group.slices.map(slice => slice.name) : [item.workRef]
  const forest = projectDependencyForest(snapshot.plan, roots)
  return item.record ? forest[0]?.children ?? [] : forest
}

export function projectExternalBlockers(item: DashboardItem, snapshot: ProjectStatusSnapshot): string[] {
  if (!item.record)
    return []
  const edges = snapshot.plan.edges.filter(edge => edge.change === item.workRef)
  return item.record.blockerEntries.filter((entry) => {
    const dependency = entry.match(/^requires\s+`([^`]+)`:\s*(\S.*)$/i)
    if (!dependency)
      return true
    return !edges.some(edge => edge.requires === dependency[1] && edge.reason === dependency[2])
  })
}

export type DashboardNextAction
  = | { kind: 'command', value: string }
    | { kind: 'brief', value: string }
    | { kind: 'blocked' }

export function projectNextAction(item: DashboardItem, snapshot: ProjectStatusSnapshot): DashboardNextAction {
  if (item.record && snapshot.plan.blocked.some(blocked => blocked.change === item.workRef && blocked.external))
    return { kind: 'blocked' }
  if (item.record)
    return { kind: 'command', value: `rsp show ${item.workRef}` }
  if (item.group?.readyToClose)
    return { kind: 'command', value: `rsp group close ${item.workRef}` }
  const executableSlice = item.group?.slices.find(slice => slice.state === 'open' && snapshot.plan.ready.includes(slice.name))
  if (executableSlice)
    return { kind: 'command', value: `rsp show ${executableSlice.name}` }
  return { kind: 'brief', value: item.group?.path ?? item.workRef }
}
