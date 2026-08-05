/** Change kind in the single-file workflow. */
export type ChangeKind = 'feature' | 'fix' | 'refactor' | 'docs' | 'ops' | 'research'

export type IssueRelation = 'relates' | 'closes'

export interface IssueRelationship {
  url: string
  relation: IssueRelation
}

/** Parsed YAML frontmatter from a change file. */
export interface Frontmatter {
  kind?: string
  [key: string]: unknown
}

/** Semantic checkbox counts in a change file. */
export interface CheckboxCount {
  todo: number
  progress: number
  done: number
  dropped: number
  total: number
}

export interface CreateChangeArgs {
  name: string
  kind?: string
  lite?: boolean
  issue?: string
  issueRelation?: string
  _: string[]
}

export interface ArchiveChangeArgs {
  name: string
}

export interface ReopenChangeArgs {
  name: string
  from?: string
  reason: string
}

/** Options for `rsp init`. */
export interface InitArgs {
  withProjectSetup?: boolean
  agentsMode?: 'managed' | 'print'
}

export type ManageActivation = 'explicit' | 'auto'
export type ManageCloseout = 'manual' | 'lifecycle' | 'local'

export interface ManagePolicy {
  activation: ManageActivation
  closeout: ManageCloseout
}

export interface ProjectLanguageConfig {
  default: string
  artifacts?: string
  commit?: string
}

export interface EffectiveLanguagePolicy {
  artifacts: string | null
  commit: string | null
}

/** User-customizable project configuration from .rsp/config.yaml. */
export interface RspConfig {
  /** Custom kind values (override built-in defaults when present). */
  kinds?: string[]
  /** One authoritative Decision Record directory. */
  decisions?: {
    path?: string
  }
  /** Project policy for Manage routing and bounded local closeout. */
  manage?: {
    activation?: ManageActivation
    closeout?: ManageCloseout
  }
  /** Project language policy for durable artifact and commit prose. */
  language?: ProjectLanguageConfig
}

/** Shared output-mode options for read-only commands. */
export interface CommandRunOptions {
  json?: boolean
  compact?: boolean
  verbose?: boolean
}

/** Severity levels used in structured diagnostics. */
export type DiagnosticSeverity = 'error' | 'warning' | 'info'

/** Structured validation or guidance entry from a command. */
export interface CommandDiagnostic {
  severity: DiagnosticSeverity
  code: string
  message: string
  change?: string
  path?: string
  details?: string[]
  hint?: string
}

/** Runtime I/O or parsing issue that the command chose not to hard-fail on. */
export interface RuntimeDiagnostic {
  code: string
  operation: string
  path: string
  message: string
}

export interface HistoryRecordOutput {
  date: string
  workRef: string
  group: string | null
  kind: string
  summary: string
  summaryTruncated: boolean
  path: string
  issues?: IssueRelationship[]
}

export interface HistoryEvidenceListOutput {
  items: string[]
  truncated: boolean
}

export interface HistoryDetailOutput extends HistoryRecordOutput {
  scenarioCount: number
  checkboxes: {
    tasks: CheckboxCount
    verify: CheckboxCount
  }
  evidence: {
    tasks: HistoryEvidenceListOutput
    verify: HistoryEvidenceListOutput
    blockers: HistoryEvidenceListOutput
  }
}

export interface StatusRecordOutput {
  name: string
  summary: string | null
  kind: string
  progress: {
    done: number
    total: number
  }
  ageDays: number | null
  isFocused: boolean
  isBlocked: boolean
  path: string | null
  issues?: IssueRelationship[]
}

export interface ChangeDependencyEdgeOutput {
  change: string
  requires: string
  reason: string
  state: 'open' | 'archived' | 'missing'
}

export interface ChangeDependencyBlockerOutput {
  change: string
  requires: string[]
  external: boolean
}

export interface ChangeDependencyNodeOutput {
  name: string
  selection: 'selected' | 'prerequisite'
  state: 'ready' | 'waiting' | 'blocked' | 'archived' | 'missing'
}

export interface ChangeDependencyPlanOutput {
  nodes: ChangeDependencyNodeOutput[]
  ready: string[]
  edges: ChangeDependencyEdgeOutput[]
  blocked: ChangeDependencyBlockerOutput[]
  waves: string[][]
}

export interface ChangeGroupSliceOutput {
  name: string
  boundary: string
  state: 'open' | 'archived' | 'missing'
}

export interface ChangeGroupStatusOutput {
  name: string
  summary: string | null
  path: string
  slices: ChangeGroupSliceOutput[]
  completion: {
    done: number
    total: number
  }
  blockers: boolean
  readyToClose: boolean
  warnings: string[]
}

/** Stable JSON envelope shared by successful and command-boundary status output. */
export interface StatusJsonShape {
  command: 'status'
  ok: boolean
  manage: ManagePolicy
  language: EffectiveLanguagePolicy
  filters: {
    focused: boolean
    blocked: boolean
    stale: number | null
  }
  focused: string[]
  records: StatusRecordOutput[]
  groups: ChangeGroupStatusOutput[]
  plan: ChangeDependencyPlanOutput
  summary: {
    total: number
    focused: number
    blocked: number
  }
  nextActions: string[]
  archiveTrend: Array<{ month: string, count: number }>
  diagnostics: CommandDiagnostic[]
  runtime: RuntimeDiagnostic[]
}

/** Parsed ADDED/MODIFIED/REMOVED delta markers from a change's Spec section. */
export interface DeltaSections {
  added: boolean
  modified: boolean
  removed: boolean
}

/** A structured Given/When/Then scenario block. */
export interface ScenarioBlock {
  heading: string
  steps: string[]
}
