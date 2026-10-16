import type {
  ArchiveReadinessOutput,
  ChangeDependencyPlanOutput,
  ChangeGroupStatusOutput,
  CommandDiagnostic,
  EffectiveLanguagePolicy,
  RuntimeDiagnostic,
  StatusRecordOutput,
  WorkflowPolicy,
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
  externalBlockers: string[]
  readiness: ArchiveReadinessOutput
}

export interface ProjectStatusSnapshot {
  workflow: WorkflowPolicy
  language: EffectiveLanguagePolicy
  focused: string[]
  records: ProjectStatusRecord[]
  groups: ChangeGroupStatusOutput[]
  plan: ChangeDependencyPlanOutput
  archiveTrend: Array<{ month: string, count: number }>
  diagnostics: CommandDiagnostic[]
  runtime: RuntimeDiagnostic[]
}

export interface ProjectStatusView {
  workflow: WorkflowPolicy
  language: EffectiveLanguagePolicy
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
