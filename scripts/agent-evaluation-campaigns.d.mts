import type { AgentEvaluationContract, AgentEvaluationRegistry, AgentEvaluationScore } from './agent-evaluation-platform.d.mts'

export interface AgentEvaluationScenario {
  id: string
  owner: string
  kind: string
  applicability: 'required' | 'optional'
  fixtures: Array<{ path: string, exists: boolean }>
  expected: 'passed' | 'failed' | 'incomplete'
  contract: Partial<AgentEvaluationContract>
  execution: { command: string, args: string[], artifact_paths?: string[] }
  semantic_boundary?: string
  verification_disposition?: 'verified' | 'skipped' | 'unavailable' | 'unverified' | 'simulated'
  [key: string]: unknown
}

export interface AgentEvaluationCampaignRun {
  case: string
  arm: 'candidate'
  repetition: 1
  disposition: 'verified' | 'skipped' | 'unavailable' | 'unverified'
  verdict: 'passed' | 'failed' | 'incomplete'
  expected_verdict: string
  observed_verdict: string
  score: AgentEvaluationScore
  analysis: Record<string, unknown>
}

export interface AgentEvaluationCampaignReport {
  verdict: string
  execution: Record<string, unknown>
  runs: Array<{ disposition: string, evidence: Array<Record<string, unknown>>, score: AgentEvaluationScore, [key: string]: unknown }>
  omissions?: Array<Record<string, unknown>>
  errors?: Array<Record<string, unknown>>
}

export function buildSkillEvaluationMatrix(registry: AgentEvaluationRegistry, root?: string): AgentEvaluationScenario[]
export function buildRoutingEvaluationMatrix(root?: string): AgentEvaluationScenario[]
export function buildWorkerEvaluationMatrix(root?: string): AgentEvaluationScenario[]
export function buildProjectEvaluationMatrix(root?: string): AgentEvaluationScenario[]
export function runLocalEvaluationCampaign(options: { scenarios: AgentEvaluationScenario[], campaignId: string, mode?: string, root?: string, executeAcceptance?: boolean }): Record<string, unknown> & { report: AgentEvaluationCampaignReport, scenarios: AgentEvaluationScenario[] }
