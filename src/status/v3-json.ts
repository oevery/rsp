import type { StatusJsonShape } from '../types.js'
import type { ProjectStatusView } from './model.js'

export interface StatusJsonErrorOptions {
  focused: boolean
  blocked: boolean
}

export function toStatusJson(view: ProjectStatusView): StatusJsonShape {
  return {
    command: 'status',
    ok: view.ok,
    manage: view.manage,
    filters: view.query,
    focused: view.focused,
    records: view.records.map(record => record.output),
    groups: view.groups,
    plan: view.plan,
    summary: view.summary,
    nextActions: view.nextActions,
    archiveTrend: view.archiveTrend,
    diagnostics: view.diagnostics,
    runtime: view.runtime,
  }
}

export function toStatusJsonError(error: { code: string, message: string }, options: StatusJsonErrorOptions): StatusJsonShape & { error: { code: string, message: string } } {
  return {
    command: 'status',
    ok: false,
    manage: { activation: 'explicit', closeout: 'manual' },
    filters: {
      focused: options.focused,
      blocked: options.blocked,
      stale: null,
    },
    focused: [],
    records: [],
    groups: [],
    plan: {
      nodes: [],
      ready: [],
      edges: [],
      blocked: [],
      waves: [],
    },
    summary: {
      total: 0,
      focused: 0,
      blocked: 0,
    },
    archiveTrend: [],
    nextActions: [],
    diagnostics: [],
    runtime: [],
    error,
  }
}
