export type ManagedControllerBetaVariant = 'baseline' | 'product'
export type ManagedControllerBetaOutcome = 'passed' | 'failed' | 'unavailable' | 'not-run'

export interface ManagedControllerBetaComposition {
  hash: string
  skills: Array<{ name: string, hash: string }>
}

export interface ManagedControllerBetaRetainedEvidence {
  path: string
  sha256: string
}

export interface ManagedControllerBetaPlan {
  id: 'manage-orchestration-beta'
  case: string
  variants: ManagedControllerBetaVariant[]
  observations: string[]
  conclusion_limits: string[]
  holdout_manifest_sha256: string
  base_tree_sha256: string
  product_skill_names: string[]
  product_composition_sha256: string
  product_composition: ManagedControllerBetaComposition
  prior_retained_evidence: ManagedControllerBetaRetainedEvidence[]
  path: string
}

export interface ManagedControllerBetaRunMetadata {
  variant: ManagedControllerBetaVariant
  result: 'passed' | 'failed'
  duration_ms?: number | null
  events?: {
    tool_calls?: number | null
  }
  output?: {
    expected_missing: string[]
    forbidden_present: string[]
  } | null
  recovery?: unknown
  paths?: {
    events?: string
    final?: string
    metadata?: string
    workspace?: string
  }
  verification?: {
    passed?: boolean
  }
  worktree?: {
    unauthorized_paths?: string[]
  }
  settings?: {
    model?: string
    provider?: string | null
  }
}

export interface ManagedControllerBetaRunSummary {
  variant: ManagedControllerBetaVariant
  outcome: ManagedControllerBetaOutcome
  completion: 'contract-passed' | 'contract-failed' | 'not-observed'
  first_fix_result: null
  worker_dispatch_count: null
  tool_calls: number | null
  verification_rounds: {
    agent_observed: number | null
    harness: number
    harness_passed: boolean
  }
  elapsed_ms: number | null
  human_intervention_outcome: 'required-after-automated-work' | 'not-observed'
  omissions: string[]
  output_contract: ManagedControllerBetaRunMetadata['output']
  recovery_contract: unknown
  unauthorized_paths: string[]
}

export interface ManagedControllerBetaComparison {
  status: 'complete' | 'incomplete'
  reason: string | null
}

export interface ManagedControllerBetaSummary {
  id: string
  case: string
  plan_hash: string
  holdout_manifest_sha256: string
  base_tree_sha256: string
  product_composition: ManagedControllerBetaComposition
  deterministic_contracts: {
    passed: boolean
    cases: number
  }
  runs: ManagedControllerBetaRunSummary[]
  comparison: ManagedControllerBetaComparison
  conclusion_limits: string[]
}

export function loadManagedControllerBetaPlan(projectRoot?: string): ManagedControllerBetaPlan
export function assertManagedControllerBetaOutputBoundary(
  plan: ManagedControllerBetaPlan,
  outputRoot: string,
  projectRoot?: string,
): string
export function summarizeManagedControllerBetaRun(
  plan: ManagedControllerBetaPlan,
  metadata: ManagedControllerBetaRunMetadata,
  final: string,
): ManagedControllerBetaRunSummary
export function summarizeManagedControllerBetaComparison(
  runs: Array<Pick<ManagedControllerBetaRunSummary, 'variant' | 'outcome'>>,
): ManagedControllerBetaComparison
export function createManagedControllerBetaSummary(
  plan: ManagedControllerBetaPlan,
  deterministic: Array<{ id: string, missing: string[], passed: boolean }>,
  runs: ManagedControllerBetaRunSummary[],
): ManagedControllerBetaSummary
export function runManagedControllerBeta(options?: {
  effort?: string
  model?: string
  outputRoot?: string
  provider?: string
  timeoutMs?: number
}): Promise<{
  summary: ManagedControllerBetaSummary
  summaryPath: string
}>
