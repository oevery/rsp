/** Change kind in the single-file workflow. */
export type ChangeKind = 'feature' | 'fix' | 'refactor' | 'docs' | 'ops' | 'research'

/** Parsed YAML frontmatter from a change file. */
export interface Frontmatter {
  kind?: ChangeKind
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
  kind?: ChangeKind
  _: string[]
}

export interface ArchiveChangeArgs {
  name: string
}

/** Options for `rsp init`. */
export interface InitArgs {
  withProjectRules?: boolean
  withProjectSetup?: boolean
  agentsMode?: 'managed' | 'print'
}

/** User-customizable project configuration from .rsp/config.yaml. */
export interface RspConfig {
  /** Custom kind values (override built-in defaults when present). */
  kinds?: string[]
}

/** Shared output-mode options for read-only commands. */
export interface CommandRunOptions {
  json?: boolean
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
