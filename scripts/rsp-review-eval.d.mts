export interface EvaluationCase {
  expected: {
    code: 'blocked' | 'clean' | 'issues_found' | 'skipped'
    document: 'blocked' | 'clean' | 'issues_found' | 'skipped'
    observations: string[]
    prohibited_actions: string[]
  }
  id: string
  request: string
  sanitization?: 'independent-reimplementation'
  source_class?: 'real-world-derived'
  tags: string[]
  workspace?: {
    remove?: string[]
    stage?: string[]
  }
}

export interface PreparedEvaluation {
  case: EvaluationCase
  promptPath: string
  variant: 'baseline' | 'candidate'
  workspace: string
}

export interface EvaluationRun {
  case: EvaluationCase
  duration_ms: number
  ended_at: string
  events: {
    by_item_type: Record<string, number>
    by_type: Record<string, number>
    tool_calls: number
    total: number
  }
  exit_code: number | null
  hashes: {
    after_workspace: string
    before_workspace: string
    candidate: string
    candidate_after: string | null
    final_output: string | null
    fixture: string
    fixture_after: string | null
    harness: string
    harness_after: string | null
    installed_candidate: string | null
    prompt: string
  }
  identity: {
    candidate_source_stable: boolean
    errors: string[]
    fixture_source_stable: boolean
    harness_source_stable: boolean
    installed_candidate_matches_source: boolean | null
    stable: boolean
  }
  paths: {
    final_output: string
    metadata: string
    raw_events: string
    workspace: string
  }
  result: 'failed' | 'passed'
  settings: {
    cli_version: string
    config_source: 'isolated' | 'user'
    effort: string
    model: string
    provider: string | null
    sandbox: 'read-only'
    timeout_ms: number
  }
  started_at: string
  timed_out: boolean
  usage: {
    cached_input_tokens: number
    input_tokens: number
    output_tokens: number
    reasoning_output_tokens: number
  } | null
  variant: 'baseline' | 'candidate'
  worktree: {
    after_status: string
    before_status: string
    mutated: boolean
  }
}

export interface EvaluationMatrix {
  case_ids: string[]
  candidate_hashes: string[]
  config_source: 'isolated' | 'user'
  ended_at: string
  effort: string
  fixture_hashes: string[]
  harness_hashes: string[]
  metadata_path: string
  model: string
  provider: string | null
  result: 'failed' | 'passed'
  runs: EvaluationRun[]
  started_at: string
  timeout_ms: number
}

export interface EvaluationCalibration {
  candidate_hashes: string[]
  cases: Array<{
    case_id: string
    median_overhead_pct: number | null
    samples: Array<{
      baseline_input_tokens: number | null
      candidate_input_tokens: number | null
      overhead_pct: number | null
      repetition: number
    }>
  }>
  config_source: 'isolated' | 'user'
  cost: {
    aggregate_median_overhead_pct: number | null
    passed: boolean
    thresholds: {
      max_aggregate_median_pct: number
      max_case_median_pct: number
    }
  }
  effort: string
  ended_at: string
  fixture_hashes: string[]
  harness_hashes: string[]
  issues: string[]
  matrices: Array<{
    ended_at: string
    hash: string
    metadata_path: string
    repetition: number
    result: 'failed' | 'passed'
    started_at: string
  }>
  metadata_path: string
  model: string
  provider: string | null
  repetitions: 3
  result: 'failed' | 'passed'
  started_at: string
  timeout_ms: number
}

export function loadEvaluationCases(root: string): EvaluationCase[]
export function prepareEvaluation(options: {
  caseId: string
  outputRoot?: string
  root: string
  variant: 'baseline' | 'candidate'
}): PreparedEvaluation
export function runEvaluation(options: {
  caseId: string
  codexBin?: string
  effort: string
  env?: NodeJS.ProcessEnv
  isolated?: boolean
  model: string
  outputRoot?: string
  provider?: string
  root: string
  timeoutMs?: number
  variant: 'baseline' | 'candidate'
}): Promise<EvaluationRun>
export function runEvaluationMatrix(options: {
  caseIds?: string[]
  codexBin?: string
  effort: string
  env?: NodeJS.ProcessEnv
  isolated?: boolean
  model: string
  outputRoot?: string
  provider?: string
  root: string
  timeoutMs?: number
}): Promise<EvaluationMatrix>
export function runEvaluationCalibration(options: {
  caseIds?: string[]
  codexBin?: string
  effort: string
  env?: NodeJS.ProcessEnv
  isolated?: boolean
  model: string
  outputRoot?: string
  provider?: string
  repetitions?: 3
  root: string
  timeoutMs?: number
}): Promise<EvaluationCalibration>
