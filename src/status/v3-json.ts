import type { StatusJsonShape } from '../types.js'
import type { ProjectStatusView } from './model.js'

export interface StatusJsonErrorOptions {
  focused: boolean
  blocked: boolean
  verbose?: boolean
}

function hasActiveFilters(query: ProjectStatusView['query']): boolean {
  return query.focused || query.blocked || query.stale !== null
}

export function toStatusJson(view: ProjectStatusView, options: { verbose?: boolean } = {}): StatusJsonShape {
  const output: StatusJsonShape = {
    command: 'status',
    ok: view.ok,
    focused: view.focused,
    records: view.records.map(record => record.output),
    groups: view.groups,
    plan: {
      nodes: view.plan.nodes,
      edges: view.plan.edges,
      blocked: view.plan.blocked,
      waves: view.plan.waves,
    },
    summary: view.summary,
    diagnostics: view.diagnostics,
  }
  if (options.verbose || hasActiveFilters(view.query)) {
    output.filters = view.query
  }
  if (options.verbose) {
    output.nextActions = view.nextActions
    output.archiveTrend = view.archiveTrend
    output.runtime = view.runtime
  }
  return output
}

export function toStatusJsonError(error: { code: string, message: string }, options: StatusJsonErrorOptions): StatusJsonShape & { error: { code: string, message: string } } {
  const output: StatusJsonShape & { error: { code: string, message: string } } = {
    command: 'status',
    ok: false,
    focused: [],
    records: [],
    groups: [],
    plan: {
      nodes: [],
      edges: [],
      blocked: [],
      waves: [],
    },
    summary: {
      total: 0,
      focused: 0,
      blocked: 0,
    },
    diagnostics: [],
    error,
  }
  if (options.verbose || options.focused || options.blocked) {
    output.filters = {
      focused: options.focused,
      blocked: options.blocked,
      stale: null,
    }
  }
  if (options.verbose) {
    output.archiveTrend = []
    output.nextActions = []
    output.runtime = []
  }
  return output
}
