import type { ArchiveHistoryInspection } from '../history/model.js'
import type { ChangeDependencyEdgeOutput, ChangeDependencyPlanOutput, CommandDiagnostic } from '../types.js'
import type { ArchiveTreeInspection, WorkTreeInspection } from './work-ref.js'
import { readFile } from 'node:fs/promises'

import { historyInspectionComplete, inspectArchiveHistory } from '../history/query.js'
import { extractBlockerLines, hasMeaningfulBlockers, isEmptyBlockerLine } from './helpers.js'
import { inspectArchiveTree, inspectWorkTree, isCanonicalExecutableWorkRef } from './work-ref.js'

interface ParsedBlockers {
  requires: ParsedDependency[]
  external: boolean
  malformed: string[]
}

interface ParsedDependency {
  name: string
  reason: string
}

export interface ChangeDependencyInspection {
  plan: ChangeDependencyPlanOutput
  activeBlockers: Map<string, boolean>
  diagnostics: CommandDiagnostic[]
}

const REQUIRES_RE = /^[-*]\s+requires\s+`([^`]+)`:[ \t]*(\S.*)$/i

/** Derive the current dependency projection from authoritative open Change files. */
export async function inspectChangeDependencies(options: { workTree?: WorkTreeInspection, archiveTree?: ArchiveTreeInspection, archiveHistory?: ArchiveHistoryInspection, preferredOrder?: string[] } = {}): Promise<ChangeDependencyInspection> {
  const workTree = options.workTree ?? await inspectWorkTree()
  const archiveTree = options.archiveTree ?? await inspectArchiveTree()
  const archiveHistory = archiveTree.rootExists
    ? options.archiveHistory ?? await inspectArchiveHistory({ archiveTree })
    : null
  const openNames = new Set(workTree.changes.map(ref => ref.name))
  const archivedNames = new Set(
    archiveHistory && historyInspectionComplete(archiveHistory)
      ? archiveHistory.records.map(record => record.workRef)
      : [],
  )
  const parsedByName = new Map<string, ParsedBlockers>()
  const blockedGroups = new Set<string>()
  const diagnostics: CommandDiagnostic[] = archiveTree.diagnostics.map(diagnostic => ({
    severity: 'error',
    code: diagnostic.code,
    path: diagnostic.path,
    message: diagnostic.message,
  }))
  if (archiveHistory)
    diagnostics.push(...archiveHistory.diagnostics)

  for (const brief of workTree.briefs) {
    try {
      if (hasMeaningfulBlockers(await readFile(brief.path, 'utf-8')))
        blockedGroups.add(brief.group)
    }
    catch (error) {
      diagnostics.push({
        severity: 'error',
        code: 'group_brief_read_failed',
        change: brief.group,
        path: brief.path,
        message: error instanceof Error ? error.message : String(error),
      })
    }
  }

  for (const ref of workTree.changes) {
    try {
      const parsed = parseDependencyBlockers(await readFile(ref.path, 'utf-8'))
      if (ref.group && blockedGroups.has(ref.group))
        parsed.external = true
      parsedByName.set(ref.name, parsed)
      for (const line of parsed.malformed) {
        diagnostics.push({
          severity: 'error',
          code: 'dependency_syntax_invalid',
          change: ref.name,
          path: ref.path,
          message: `invalid dependency blocker syntax: ${line}`,
          hint: 'Use: - requires `<change-work-ref>`: <reason>',
        })
      }
    }
    catch (error) {
      diagnostics.push({
        severity: 'error',
        code: 'change_read_failed',
        change: ref.name,
        path: ref.path,
        message: error instanceof Error ? error.message : String(error),
      })
    }
  }

  const edges: ChangeDependencyEdgeOutput[] = []
  for (const [change, blockers] of parsedByName) {
    for (const requirement of blockers.requires) {
      const required = requirement.name
      const edge: ChangeDependencyEdgeOutput = {
        change,
        requires: required,
        reason: requirement.reason,
        state: openNames.has(required) ? 'open' : archivedNames.has(required) ? 'archived' : 'missing',
      }
      edges.push(edge)
      if (!isCanonicalExecutableWorkRef(required)) {
        diagnostics.push({
          severity: 'error',
          code: 'dependency_target_invalid',
          change,
          message: `dependency target must be an executable Change WorkRef: ${required}`,
        })
      }
      else if (required === change) {
        diagnostics.push({
          severity: 'error',
          code: 'dependency_self_reference',
          change,
          message: 'Change cannot require itself',
        })
      }
      else if (edge.state === 'missing') {
        diagnostics.push({
          severity: 'error',
          code: 'dependency_target_missing',
          change,
          message: `dependency target is neither open nor archived: ${required}`,
        })
      }
    }
  }
  edges.sort(compareEdges)
  diagnostics.push(...findCycleDiagnostics(edges))

  const activeBlockers = new Map<string, boolean>()
  const blocked = [...parsedByName]
    .map(([change, blockers]) => {
      const requires = edges
        .filter(edge => edge.change === change && edge.state !== 'archived')
        .map(edge => edge.requires)
        .sort()
      activeBlockers.set(change, blockers.external || requires.length > 0)
      return { change, requires, external: blockers.external }
    })
    .filter(blocker => blocker.external || blocker.requires.length > 0)
    .sort((left, right) => left.change.localeCompare(right.change))

  const waves = buildWaves([...openNames], edges, parsedByName, options.preferredOrder ?? [])
  const graphValid = diagnostics.every(diagnostic => diagnostic.severity !== 'error')
  if (!graphValid) {
    for (const name of openNames)
      activeBlockers.set(name, true)
  }
  const ready = graphValid ? waves[0] ?? [] : []
  const executable = new Set(graphValid ? waves.flat() : [])
  const nodes = [...new Set([...openNames, ...edges.map(edge => edge.requires)])]
    .sort()
    .map((name) => {
      let state: ChangeDependencyPlanOutput['nodes'][number]['state']
      if (!openNames.has(name) && archivedNames.has(name))
        state = 'archived'
      else if (!openNames.has(name))
        state = 'missing'
      else if (ready.includes(name))
        state = 'ready'
      else if (executable.has(name))
        state = 'waiting'
      else
        state = 'blocked'
      return { name, selection: openNames.has(name) ? 'selected' as const : 'prerequisite' as const, state }
    })
  return {
    plan: {
      nodes,
      ready,
      edges,
      blocked,
      waves: graphValid ? waves : [],
    },
    activeBlockers,
    diagnostics,
  }
}

function parseDependencyBlockers(content: string): ParsedBlockers {
  const requires = new Map<string, string>()
  let external = false
  const malformed: string[] = []
  for (const line of extractBlockerLines(content)) {
    if (!line || isEmptyBlockerLine(line))
      continue
    const dependency = line.match(REQUIRES_RE)
    if (dependency) {
      if (!requires.has(dependency[1]))
        requires.set(dependency[1], dependency[2])
    }
    else if (/^[-*]\s+requires\b/i.test(line)) {
      malformed.push(line)
      external = true
    }
    else {
      external = true
    }
  }
  return {
    requires: [...requires].map(([name, reason]) => ({ name, reason })).sort((left, right) => left.name.localeCompare(right.name)),
    external,
    malformed,
  }
}

function buildWaves(names: string[], edges: ChangeDependencyEdgeOutput[], blockersByName: Map<string, ParsedBlockers>, preferredOrder: string[]): string[][] {
  const orderIndex = new Map(preferredOrder.map((name, index) => [name, index]))
  const excluded = new Set(
    [...blockersByName]
      .filter(([, blockers]) => blockers.external)
      .map(([name]) => name),
  )

  let changed = true
  while (changed) {
    changed = false
    for (const edge of edges) {
      if ((edge.state === 'missing' || excluded.has(edge.requires)) && !excluded.has(edge.change)) {
        excluded.add(edge.change)
        changed = true
      }
    }
  }

  const remaining = new Set(names.filter(name => !excluded.has(name)))
  const waves: string[][] = []
  while (remaining.size > 0) {
    const wave = [...remaining]
      .filter(name => !edges.some(edge => edge.change === name && edge.state === 'open' && remaining.has(edge.requires)))
      .sort((left, right) => comparePlanNames(left, right, orderIndex))
    if (wave.length === 0)
      break
    waves.push(wave)
    for (const name of wave)
      remaining.delete(name)
  }
  return waves
}

function comparePlanNames(left: string, right: string, orderIndex: Map<string, number>): number {
  const leftGroup = left.includes('/') ? left.split('/')[0] : null
  const rightGroup = right.includes('/') ? right.split('/')[0] : null
  if (leftGroup && leftGroup === rightGroup) {
    const leftIndex = orderIndex.get(left)
    const rightIndex = orderIndex.get(right)
    if (leftIndex !== undefined && rightIndex !== undefined)
      return leftIndex - rightIndex
  }
  return left.localeCompare(right)
}

function compareEdges(left: ChangeDependencyEdgeOutput, right: ChangeDependencyEdgeOutput): number {
  return left.change.localeCompare(right.change) || left.requires.localeCompare(right.requires)
}

function findCycleDiagnostics(edges: ChangeDependencyEdgeOutput[]): CommandDiagnostic[] {
  const adjacency = new Map<string, string[]>()
  for (const edge of edges) {
    if (edge.state !== 'open' || edge.change === edge.requires)
      continue
    const targets = adjacency.get(edge.change) ?? []
    targets.push(edge.requires)
    adjacency.set(edge.change, targets.sort())
  }

  const visited = new Set<string>()
  const active = new Set<string>()
  const stack: string[] = []
  const reported = new Set<string>()
  const diagnostics: CommandDiagnostic[] = []

  const visit = (name: string) => {
    if (active.has(name)) {
      const start = stack.indexOf(name)
      const cycle = [...stack.slice(start), name]
      const key = [...new Set(cycle)].sort().join('|')
      if (!reported.has(key)) {
        reported.add(key)
        const message = `dependency cycle detected: ${cycle.join(' -> ')}`
        for (const participant of [...new Set(cycle)].sort()) {
          diagnostics.push({
            severity: 'error',
            code: 'dependency_cycle',
            change: participant,
            message,
          })
        }
      }
      return
    }
    if (visited.has(name))
      return
    visited.add(name)
    active.add(name)
    stack.push(name)
    for (const target of adjacency.get(name) ?? [])
      visit(target)
    stack.pop()
    active.delete(name)
  }

  for (const name of [...adjacency.keys()].sort())
    visit(name)
  return diagnostics
}
