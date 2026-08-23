import type { ManagedControllerEvaluationMetadata } from './managed-controller-eval.mjs'

export type ReleaseBehaviorArm = 'baseline' | 'candidate'
export type ReleaseBehaviorClassification = 'eligible' | 'harness-failed' | 'model-failed'
export type ReleaseBehaviorOutcome = 'passed' | 'failed'

export interface ReleaseBehaviorPlanCase {
  id: string
  holdout: string
  risk: string
  candidateRepetitions: number
  baselineRepetitions: number
  installedSkills: string[]
  identities: {
    baselineCompositionSha256: string
    candidateCompositionSha256: string
    contractSha256: string
    fixtureSha256: string
    harnessSha256: string
  }
}

export interface ReleaseBehaviorPlan {
  id: string
  execution: 'serial-fail-fast'
  baseline: { ref: string, commit: string }
  candidate: { commit: string | null, dirty: boolean | null, fingerprintSha256: string | null }
  settings: { model: string | null, effort: string | null, provider: string | null }
  counts: { candidateRuns: number, baselineRuns: number }
  diagnostics: string[]
  policy: {
    candidate_correctness_required: boolean
    baseline_correctness_required: boolean
    efficiency_threshold: null
    provider_execution_from_candidate_check: boolean
  }
  cases: ReleaseBehaviorPlanCase[]
}

export interface ReleaseBehaviorExecutionRun {
  arm: ReleaseBehaviorArm
  repetition: number
  classification: ReleaseBehaviorClassification
  outcome: ReleaseBehaviorOutcome
  [key: string]: unknown
}

export interface ReleaseBehaviorScenario extends ReleaseBehaviorPlanCase {
  runs: ReleaseBehaviorExecutionRun[]
}

export interface ReleaseBehaviorExecutionResult {
  scenarios: ReleaseBehaviorScenario[]
  stopped: { case: string, arm: ReleaseBehaviorArm, reason: string } | null
  verdict: ReleaseBehaviorOutcome
}

export interface ReleaseBehaviorReport {
  schemaVersion: 1
  evidenceMode: 'fresh-provider'
  sanitized: true
  verdict: ReleaseBehaviorOutcome
  stopped: ReleaseBehaviorExecutionResult['stopped']
  plan: ReleaseBehaviorPlan
  scenarios: ReleaseBehaviorScenario[]
}

export interface ReleaseBehaviorSurfaceMetadata {
  git?: {
    commits?: Array<{
      body: string
      subject: string
      trailers: Array<{ key: string, value: string }>
    }>
  }
  paths: { workspace: string }
  worktree?: { changed_paths?: string[] }
}

export function buildReleaseBehaviorPlan(
  repositoryRoot?: string,
  options?: { baselineRef?: string, caseId?: string, effort?: string | null, model?: string | null, provider?: string | null },
): ReleaseBehaviorPlan

export function classifyReleaseBehaviorExecution(
  metadata: {
    events?: { tool_calls?: number | null, usage?: unknown }
    exit_code: number | null
    timed_out: boolean
  },
  final: string,
): ReleaseBehaviorClassification

export function executeReleaseBehaviorCases(options: {
  plan: ReleaseBehaviorPlan
  runArm: (input: {
    arm: ReleaseBehaviorArm
    planCase: ReleaseBehaviorPlanCase
    repetition: number
  }) => Promise<ReleaseBehaviorExecutionRun>
}): Promise<ReleaseBehaviorExecutionResult>

export function renderReleaseBehaviorMarkdown(
  report: Pick<ReleaseBehaviorReport, 'evidenceMode' | 'plan' | 'scenarios' | 'verdict'>,
): string

export function scoreReleaseBehaviorContract(
  holdout: { manifest: Pick<import('./managed-controller-eval.mjs').ManagedControllerHoldoutManifest, 'release_behavior'> },
  metadata: ReleaseBehaviorSurfaceMetadata,
  final: string,
): { status: 'passed' | 'failed', evidence: { dimension: string, failures?: string[] } }

export function runReleaseBehaviorAcceptance(options?: {
  authFile?: string
  baselineRef?: string
  caseId?: string
  effort?: string
  isolatedUserContext?: boolean
  model?: string
  modelCatalogJson?: string
  openaiBaseUrl?: string
  outputRoot?: string
  provider?: string
  timeoutMs?: number
  evaluationRunner?: (options: Record<string, unknown>) => Promise<ManagedControllerEvaluationMetadata>
}): Promise<{ jsonPath: string, markdownPath: string, report: ReleaseBehaviorReport }>
