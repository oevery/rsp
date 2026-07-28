import type { ChangeDependencyPlanOutput, ChangeGroupStatusOutput, StatusRecordOutput } from '../types.js'
import type { ProjectStatusSnapshot, ProjectStatusView, StatusOptions } from './model.js'

export function deriveStatusView(snapshot: ProjectStatusSnapshot, options: StatusOptions = {}): ProjectStatusView {
  const query = {
    focused: Boolean(options.focused),
    blocked: Boolean(options.blocked),
    stale: typeof options.stale === 'number' ? options.stale : null,
  }
  const records = snapshot.records.filter(({ output: record }) => {
    if (query.focused && !record.isFocused)
      return false
    if (query.blocked && !record.isBlocked)
      return false
    if (query.stale !== null && (record.ageDays === null || record.ageDays < query.stale))
      return false
    return true
  })
  const filtered = query.focused || query.blocked || query.stale !== null
  const ok = snapshot.diagnostics.every(diagnostic => diagnostic.severity !== 'error')
  const nextActions = ok
    ? buildStatusNextActions(snapshot.focused.length, snapshot.records.map(record => record.output), snapshot.groups, filtered)
    : ['Run: rsp doctor']

  return {
    manage: snapshot.manage,
    language: snapshot.language,
    query,
    focused: snapshot.focused,
    records,
    groups: snapshot.groups,
    plan: filterDependencyPlan(snapshot.plan, new Set(records.map(record => record.output.name))),
    summary: {
      total: records.length,
      focused: records.filter(record => record.output.isFocused).length,
      blocked: records.filter(record => record.output.isBlocked).length,
    },
    nextActions,
    archiveTrend: snapshot.archiveTrend,
    diagnostics: snapshot.diagnostics,
    runtime: snapshot.runtime,
    hasExecutableChanges: snapshot.records.length > 0,
    ok,
  }
}

export function buildStatusNextActions(focusedCount: number, records: StatusRecordOutput[], groups: ChangeGroupStatusOutput[], filtered: boolean): string[] {
  const openChanges = records.map(record => record.name).sort()
  if (focusedCount > 0)
    return []
  const readyGroup = groups.find(group => group.readyToClose)
  if (readyGroup)
    return [`Run: rsp group close ${readyGroup.name}`]
  if (openChanges.length === 0 && groups.length > 0)
    return [`Review Group Brief: ${groups[0].path}`]
  if (openChanges.length === 0)
    return ['Run: rsp create <name>']
  if (filtered) {
    return [
      'Run: rsp status',
      'Run: rsp focus <name>',
      'Or run: rsp create <name>',
    ]
  }
  const firstChanges = openChanges.slice(0, 3).join(', ')
  const extra = openChanges.length > 3 ? ` (+${openChanges.length - 3} more)` : ''
  const recommendation = recommendOpenChange(records, groups)
  return [
    `Open changes: ${firstChanges}${extra}`,
    recommendation ? `Run: rsp focus ${recommendation}` : 'Resolve blockers before focusing an open change.',
    'Or run: rsp create <name>',
  ]
}

export function recommendOpenChange(records: StatusRecordOutput[], groups: ChangeGroupStatusOutput[]): string | null {
  const recordsByName = new Map(records.map(record => [record.name, record]))
  const candidates: Array<{ name: string, owner: string }> = records
    .filter(record => !record.name.includes('/') && !record.isBlocked)
    .map(record => ({ name: record.name, owner: record.name }))

  for (const group of groups) {
    if (group.blockers)
      continue
    const slice = group.slices.find((candidate) => {
      const record = recordsByName.get(candidate.name)
      return candidate.state === 'open' && record !== undefined && !record.isBlocked
    })
    if (slice)
      candidates.push({ name: slice.name, owner: group.name })
  }

  return candidates.sort((left, right) => left.owner.localeCompare(right.owner) || left.name.localeCompare(right.name))[0]?.name ?? null
}

export function filterDependencyPlan(plan: ChangeDependencyPlanOutput, names: Set<string>): ChangeDependencyPlanOutput {
  const included = new Set(names)
  let changed = true
  while (changed) {
    changed = false
    for (const edge of plan.edges) {
      if (included.has(edge.change) && !included.has(edge.requires)) {
        included.add(edge.requires)
        changed = true
      }
    }
  }

  const waves = plan.waves
    .map(wave => wave.filter(name => included.has(name)))
    .filter(wave => wave.length > 0)
  return {
    nodes: plan.nodes
      .filter(node => included.has(node.name))
      .map(node => ({ ...node, selection: names.has(node.name) ? 'selected' as const : 'prerequisite' as const })),
    ready: waves[0] ?? [],
    edges: plan.edges.filter(edge => included.has(edge.change)),
    blocked: plan.blocked.filter(blocker => included.has(blocker.change)),
    waves,
  }
}
