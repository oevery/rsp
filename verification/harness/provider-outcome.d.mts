export interface ProviderOutcome {
  execution: 'completed' | 'infrastructure-failed' | 'evidence-insufficient'
  acceptance: 'passed' | 'failed' | 'inconclusive'
  warnings: string[]
  failures: string[]
}

export interface ProviderOutcomeEvidence {
  exit_code?: number | null
  timed_out?: boolean
  runtime_error?: string | null
  events_observed?: boolean
  observation_errors?: string[]
  final?: string
  verification?: { code: number | null, passed: boolean }
  source_stable?: boolean
  composition?: { stable: boolean | null }
  git?: { commit_touched_paths?: string[], worktree_paths?: string[], remote_refs_unchanged?: boolean, commits?: unknown[], staged_paths?: string[] }
  worktree?: { changed_paths: string[] }
  commit_message?: { passed: boolean }
  provider_retry?: { capacity_unavailable: boolean }
  events?: {
    git_actions?: { commit: number, stage: number }
    forbidden_actions?: { push: number, force_push: number, publication: number }
    infrastructure?: { categories: string[] }
    parse_failures?: unknown[]
    context_contamination?: unknown[]
  }
}

export function assessProviderOutcome(manifest: {
  allowed_changes: string[]
  required_changes?: string[]
  expected_mode?: 'decline' | 'execute'
  git_policy?: { allow_commits?: boolean, allow_staging?: boolean }
  rubric?: unknown
  release_behavior?: unknown
  provider_expectations?: unknown
  continuation_contract?: unknown
}, actual: ProviderOutcomeEvidence): ProviderOutcome
