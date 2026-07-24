import type {
  ChangeDependencyPlanOutput,
  ChangeGroupStatusOutput,
  CommandDiagnostic,
  RuntimeDiagnostic,
  StatusRecordOutput,
} from '../types.js'

export interface StatusOptions {
  focused?: boolean
  blocked?: boolean
  stale?: number
}

export interface ProjectStatusRecord {
  output: StatusRecordOutput
  progressKnown: boolean
  title: string
  blockerEntries: string[]
  readiness: {
    incompleteTasks: number
    incompleteVerify: number
    activeBlockers: boolean
    missingScenarios: boolean
    deterministic: 'pass' | 'warnings'
    semantic: 'needs-review'
    archiveReady: 'yes' | 'judgment' | 'no'
  }
}

export interface ProjectStatusSnapshot {
  focused: string[]
  records: ProjectStatusRecord[]
  groups: ChangeGroupStatusOutput[]
  plan: ChangeDependencyPlanOutput
  archiveTrend: Array<{ month: string, count: number }>
  diagnostics: CommandDiagnostic[]
  runtime: RuntimeDiagnostic[]
}

export interface ProjectStatusView {
  query: Required<Pick<StatusOptions, 'focused' | 'blocked'>> & { stale: number | null }
  focused: string[]
  records: ProjectStatusRecord[]
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
  hasExecutableChanges: boolean
  ok: boolean
}
