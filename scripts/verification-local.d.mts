import type { VerificationAggregateReport } from './verification-platform.d.mts'

export interface CompactEvaluationRun {
  case: string
  score: { normalized_trace?: unknown, [key: string]: unknown }
  [key: string]: unknown
}

export interface CompactEvaluationCampaign {
  campaign_id: string
  mode: string
  scenarios: Array<Record<string, unknown>>
  report: {
    verdict: string
    execution: Record<string, unknown>
    runs: CompactEvaluationRun[]
    errors: Array<unknown>
    omissions: Array<unknown>
    analysis: unknown
  }
}

export interface CompactEvaluationSummary {
  schema_version: 1
  verdict: 'passed' | 'failed' | 'incomplete'
  inventory: Record<string, unknown>
  campaigns: Record<string, CompactEvaluationCampaign>
  provider: Record<string, unknown>
  invariants: Record<string, unknown>
}

export interface LocalVerificationSummary {
  schema_version: 1
  topology: Record<string, unknown>
  aggregate: VerificationAggregateReport
  evaluations: CompactEvaluationSummary
  provider: Record<string, unknown>
  boundaries: Array<Record<string, unknown>>
}

export function buildLocalVerificationSummary(root?: string, options?: { executeTests?: boolean, executeAcceptance?: boolean }): LocalVerificationSummary
export function readAcceptanceReport(root: string, receipt: Record<string, unknown>, outputRoot?: string): Record<string, unknown> | null
export function acceptanceCategoryEvidence(report: Record<string, unknown> | null, category: string, expectedProjects?: Array<Record<string, unknown>>, receipt?: Record<string, unknown> | null): { verified: boolean, evidence: Array<Record<string, unknown>> }
export function writeAggregateArtifact(root: string, summary: { aggregate: Record<string, unknown> }): { jsonPath: string, markdownPath: string }
export function runVerificationCommand(command: string, root?: string): number
