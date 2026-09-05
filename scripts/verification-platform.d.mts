export const VERIFICATION_SCHEMA_VERSION: 1
export const VERIFICATION_LAYERS: readonly string[]
export const VERIFICATION_EXECUTION_MODES: readonly string[]
export const VERIFICATION_DISPOSITIONS: readonly string[]
export interface VerificationScenario {
  id: string
  layer: 'test' | 'evaluation' | 'acceptance'
  owner: string
  execution_mode: string
  fixture_refs: string[]
  required_evidence: string[]
  oracle: string
  rubric: string
  artifact_policy: string
  source?: string
  [key: string]: unknown
}
export interface VerificationConfig {
  provider: { real_execution: string, [key: string]: unknown }
  [key: string]: unknown
}
export interface VerificationAggregateReport {
  schema_version: 1
  id: string
  verdict: string
  planned: number
  executed: number
  verified: number
  failed: number
  skipped: number
  unavailable: number
  unverified: number
  simulated: number
  runs: Array<Record<string, unknown>>
  errors: Array<Record<string, unknown>>
  omissions: Array<Record<string, unknown>>
  evidence: Array<Record<string, unknown>>
  usage: Record<string, unknown>
  ai_analysis: Record<string, unknown>
  boundaries: Array<Record<string, unknown>>
}
export function loadVerificationConfig(root?: string): Record<string, unknown> & { repository_root: string }
export function loadVerificationTopology(root?: string): { version: 1, config: VerificationConfig, scenarios: VerificationScenario[], by_layer: Record<string, VerificationScenario[]>, registry: Record<string, unknown> }
export function createVerificationRunRecord(options: { scenario: VerificationScenario, executionMode?: string, startedAt?: string | null, completedAt?: string | null, errors?: unknown[], omissions?: unknown[], evidence?: unknown[], verdict?: string, disposition?: string | null, usage?: unknown, provider?: unknown, analysis?: unknown }): Record<string, unknown>
export function validateVerificationAggregateReport(report: unknown): Record<string, unknown>
export function buildVerificationAggregateReport(options: { id?: string, topology: { scenarios: VerificationScenario[] }, runs?: Array<Record<string, unknown>>, boundaries?: Array<Record<string, unknown>>, aiAnalysis?: Record<string, unknown>, source?: unknown }): VerificationAggregateReport
export function assertVerificationProviderMode(mode: string): string
