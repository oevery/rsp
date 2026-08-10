import type {
  ManageRuntimeAttentionItem,
  ManageRuntimeProjectProjection,
  ManageRuntimeRunProjection,
} from '../runtime/manage.js'
import type { CommandDiagnostic, HistoryDetailOutput } from '../types.js'

export const WEB_PROJECTION_VERSION = Object.freeze({ major: 1, minor: 1 })
export const WEB_MAX_OVERVIEW_RECORDS = 50
export const WEB_MAX_SPECS_DOCUMENTS = 60
export const WEB_MAX_HISTORY_RECORDS = 30
export const WEB_MAX_DIAGNOSTICS = 12
export const WEB_MAX_QUERY_CODE_POINTS = 200
export const WEB_MAX_DETAIL_PATH_CODE_POINTS = 512
export const WEB_MAX_TEXT_CODE_POINTS = 1000
export const WEB_MAX_MANAGED_RUNS = 24
export const WEB_MAX_MANAGED_ATTENTION = 32
export const WEB_MAX_MANAGED_TIMELINE = 64
export const WEB_BOOTSTRAP_TTL_MS = 60_000
export const WEB_SESSION_TTL_MS = 8 * 60 * 60 * 1000
export const WEB_MAX_BOOTSTRAPS_PER_PROJECT = 8
export const WEB_MAX_SESSIONS_PER_PROJECT = 16

export interface WebProjectionVersion {
  major: number
  minor: number
}

export interface WebOverviewRecord {
  workRef: string
  goal: string | null
  kind: string
  state: 'focused' | 'ready' | 'waiting' | 'blocked' | 'open'
  progress: {
    done: number
    total: number
  }
}

export interface WebOverviewProjection {
  current: {
    workRef: string | null
    goal: string | null
    state: WebOverviewRecord['state'] | 'empty'
    blockers: string[]
    nextAction: string | null
  }
  summary: {
    open: number
    focused: number
    blocked: number
  }
  records: WebOverviewRecord[]
  recordsSummary: {
    total: number
    returned: number
    hasMore: boolean
  }
  diagnostics: CommandDiagnostic[]
  diagnosticSummary: {
    total: number
    returned: number
    hasMore: boolean
  }
}

export interface WebSpecsDocument {
  path: string
  kind: 'spec' | 'decision-record'
  title: string
  summary: string | null
  bytes: number
}

export interface WebSpecsProjection {
  documents: WebSpecsDocument[]
  summary: {
    total: number
    returned: number
    hasMore: boolean
  }
}

export interface WebHistoryRecord {
  date: string
  workRef: string
  group: string | null
  kind: string
  summary: string
  summaryTruncated: boolean
}

export interface WebHistoryProjection {
  records: WebHistoryRecord[]
  summary: {
    total: number
    returned: number
    hasMore: boolean
  }
}

export interface WebSnapshot {
  projection: WebProjectionVersion
  snapshotId: string
  generatedAt: string
  source: {
    projectId: string
    gitHead: string | null
    gitBranch: string | null
    dirty: boolean | null
    identities: {
      overview: string
      specs: string
      history: string
      managed: string
    }
  }
  overview: WebOverviewProjection
  specs: WebSpecsProjection
  history: WebHistoryProjection
  managed: WebManagedProjection
}

export interface WebSnapshotSuccess {
  ok: true
  snapshot: WebSnapshot
}

export interface WebSnapshotFailure {
  ok: false
  error: {
    code: string
    message: string
  }
  stale: {
    snapshotId: string
    generatedAt: string
  } | null
}

export interface WebSpecsDetailProjection {
  mode: 'detail'
  source: WebSnapshot['source']
  document: WebSpecsDocument & {
    content: string
    contentTruncated: boolean
  }
}

export interface WebSpecsSearchProjection {
  mode: 'search'
  source: WebSnapshot['source']
  query: {
    literal: string
    limit: number
  }
  matches: Array<{
    path: string
    kind: 'spec' | 'decision-record'
    title: string
    heading: string | null
    line: number
    excerpt: string
  }>
  summary: {
    candidates: number
    searched: number
    matched: number
    returned: number
    hasMore: boolean
  }
}

export interface WebHistoryDetailProjection {
  mode: 'detail'
  record: Omit<HistoryDetailOutput, 'path' | 'issues'>
}

export interface WebManagedFreshness {
  state: 'current' | 'stale' | 'unavailable'
  sourceSequence: number
  generatedAt: string
  reasons: string[]
}

export interface WebManagedRunSummary {
  lookupId: string
  runId: string
  runKey: string
  workRef: string
  status: ManageRuntimeRunProjection['status']
  phase: string | null
  managerId: string | null
  actors: number
  dispatches: number
  receipts: number
  attention: number
  terminalDeliveryObserved: boolean
  lastObservedAt: string
  freshness: WebManagedFreshness
}

export interface WebManagedAttentionItem extends ManageRuntimeAttentionItem {
  runId: string | null
  runLookupId: string | null
}

export interface WebManagedProjection {
  state: ManageRuntimeProjectProjection['state']
  available: boolean
  authoritative: false
  diagnostic: {
    code: string
    message: string
    action: string | null
  } | null
  generatedAt: string
  runs: WebManagedRunSummary[]
  runsSummary: {
    total: number
    returned: number
    hasMore: boolean
  }
  attention: WebManagedAttentionItem[]
  attentionSummary: {
    total: number
    returned: number
    hasMore: boolean
  }
}

export interface WebManagedRunDetailProjection {
  mode: 'run-detail'
  run: ManageRuntimeRunProjection
  attention: ManageRuntimeAttentionItem[]
  freshness: WebManagedFreshness
}

export interface WebManagedSseEvent {
  id: number
  type: 'managed-projection' | 'managed-gap' | 'session-unloaded' | 'broker-stopping'
  projectId: string
  at: string
  projection?: WebManagedProjection
  expectedAfter?: number
  replayFrom?: number
}

export interface WebProjector {
  overview: (root: string) => Promise<{
    projection: WebOverviewProjection
    openWorkRefs: string[]
    sensitiveUrls: string[]
  }>
}

export function isWebOverviewProjection(value: unknown): value is WebOverviewProjection {
  if (!isObject(value) || !isObject(value.current) || !isObject(value.summary))
    return false
  return (typeof value.current.workRef === 'string' || value.current.workRef === null)
    && (typeof value.current.goal === 'string' || value.current.goal === null)
    && typeof value.current.state === 'string'
    && Array.isArray(value.current.blockers)
    && value.current.blockers.every(item => typeof item === 'string')
    && (typeof value.current.nextAction === 'string' || value.current.nextAction === null)
    && Array.isArray(value.records)
    && Array.isArray(value.diagnostics)
}

function isObject(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
