export interface LocalAgentEvaluationSuiteReport {
  schema_version: 1
  verdict: 'passed' | 'failed' | 'incomplete'
  inventory: { published_skills: Array<string | null>, core_routes: string[], worker_routes: string[], project_categories: string[] }
  campaigns: Record<'skills' | 'routing' | 'worker' | 'project', { report: { verdict: string, execution: Record<string, unknown>, runs: Array<Record<string, unknown>> }, scenarios: Array<Record<string, unknown>> }>
  provider: Record<string, unknown> & { mode: 'fake', real_provider: false }
  invariants: { evidence_provenance_complete: boolean, deterministic_hard_failures_authoritative: true, coverage_dispositions: string[], real_provider_acceptance: 'outside-group', project_acceptance_executed: boolean }
}

export function runLocalAgentEvaluationSuite(root?: string, options?: { executeAcceptance?: boolean }): LocalAgentEvaluationSuiteReport
