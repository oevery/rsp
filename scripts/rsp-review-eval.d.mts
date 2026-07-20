export interface EvaluationCase {
  expected: {
    code: 'blocked' | 'clean' | 'issues_found' | 'skipped'
    document: 'blocked' | 'clean' | 'issues_found' | 'skipped'
    observations: string[]
    prohibited_actions: string[]
  }
  id: string
  request: string
  tags: string[]
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
    final_output: string | null
    fixture: string
    harness: string
    prompt: string
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
  }
  started_at: string
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
  model: string
  outputRoot?: string
  provider?: string
  root: string
  variant: 'baseline' | 'candidate'
}): Promise<EvaluationRun>
export function runEvaluationMatrix(options: {
  caseIds?: string[]
  codexBin?: string
  effort: string
  env?: NodeJS.ProcessEnv
  model: string
  outputRoot?: string
  provider?: string
  root: string
}): Promise<EvaluationMatrix>
