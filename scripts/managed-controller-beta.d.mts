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
  provider_comparison_cases: Array<{
    case: string
    repetitions: number
    holdout_manifest_sha256: string
    base_tree_sha256: string
    provider_expectations: ManagedControllerBetaProviderExpectations
  }>
  provider_expectations: ManagedControllerBetaProviderExpectations
  prior_retained_evidence: ManagedControllerBetaRetainedEvidence[]
  path: string
}

export interface ManagedControllerBetaProviderExpectations {
  route: 'direct' | 'selected'
  mode: 'direct' | 'solo' | 'delegated' | 'coordinated'
  dispatch: 'none' | 'sequential' | 'independent-verify' | 'parallel-wave'
  worker_dispatch_count: { min: number, max: number }
}

export interface ManagedControllerBetaRunMetadata {
  agent_reported?: {
    evaluation_receipt: {
      case_id: string
      composition_sha256: string
      contract_sha256: string
      receipt_sha256: string
    }
    observations: ManagedControllerBetaReceiptObservations
  } | null
  case_id?: string
  contract_sha256?: string
  variant: ManagedControllerBetaVariant
  result: 'passed' | 'failed'
  duration_ms?: number | null
  events?: {
    tool_calls?: number | null
    usage?: unknown
    worker_lifecycle?: ManagedControllerBetaWorkerLifecycleObservation
  }
  output?: {
    expected_missing: string[]
    forbidden_present: string[]
  } | null
  recovery?: unknown
  evaluation_receipt?: {
    case_id: string
    composition_sha256: string
    contract_sha256: string
    receipt_sha256: string
  } | null
  observation_sha256?: string
  observability?: ManagedControllerBetaObservability
  receipt_observations?: ManagedControllerBetaReceiptObservations | null
  composition?: {
    installed_before?: ManagedControllerBetaComposition
  }
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

export interface ManagedControllerBetaWorkerLifecycleObservation {
  admission_count: number | null
  delivery_count: number | null
  dispatch_count: number | null
  interrupt_count: number | null
  release_count: number | null
  settlement_count: number | null
  wait_count: number | null
  order: Array<{ event_index: number, phase: 'dispatch' | 'admission' | 'delivery' | 'wait' | 'interrupt' | 'settlement' | 'release', tool: string }>
  omissions: string[]
}

export interface ManagedControllerBetaRunSummary {
  variant: ManagedControllerBetaVariant
  outcome: ManagedControllerBetaOutcome
  completion: 'contract-passed' | 'contract-failed' | 'not-observed'
  first_fix_result: 'passed' | 'failed' | null
  worker_dispatch_count: number | null
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
  agent_reported: ManagedControllerBetaRunMetadata['agent_reported']
  evaluation_receipt: ManagedControllerBetaRunMetadata['evaluation_receipt']
  observation_sha256: string | null
  observability: ManagedControllerBetaObservability
  provider_expectation: {
    expected: ManagedControllerBetaProviderExpectations
    observed: {
      route: string | null
      mode: string | null
      dispatch: string | null
      worker_dispatch_count: number | null
    }
    status: 'passed' | 'failed'
  }
}

export interface ManagedControllerBetaReceiptObservations {
  correction_count: number | null
  first_fix_result: 'passed' | 'failed' | null
  trigger: { status: 'passed' | 'failed', evidence?: unknown } | null
  worker_dispatch_count: number | null
}

export interface ManagedControllerBetaObservability {
  dimensions: Record<'trigger' | 'compliance' | 'boundary' | 'task_result', {
    status: 'passed' | 'failed' | 'not-observed'
    evidence: unknown
  }>
  measurements: {
    corrections: number | null
    first_fix_result: 'passed' | 'failed' | null
    worker_dispatch_count: number | null
    tool_calls: number | null
    elapsed_ms: number | null
    tokens: { input: number | null, output: number | null, total: number | null }
  }
  omissions: string[]
  host_observed?: { worker_lifecycle: ManagedControllerBetaWorkerLifecycleObservation }
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

export function loadManagedControllerBetaPlan(
  projectRoot?: string,
  options?: { caseId?: string },
): ManagedControllerBetaPlan
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
  authFile?: string
  effort?: string
  isolatedUserContext?: boolean
  model?: string
  modelCatalogJson?: string
  openaiBaseUrl?: string
  outputRoot?: string
  provider?: string
  timeoutMs?: number
}): Promise<{
  summary: ManagedControllerBetaSummary
  summaryPath: string
}>
