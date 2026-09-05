export const AGENT_EVALUATION_SCHEMA_VERSION: 1
export const AGENT_EVALUATION_METRICS: readonly string[]

export interface AgentEvaluationContract {
  id: string
  kind: 'skill' | 'core' | 'worker'
  owner: string
  installed_skill: string | null
  fixtures: string[]
  metrics: string[]
  goals: string[]
  required_events: string[]
  forbidden_events: string[]
  artifact_surfaces: string[]
  expected_route?: string
  worker_dispatch_count?: { min: number, max: number }
}

export interface AgentEvaluationRegistry {
  version: 1
  id: string
  defaults: Record<'skill' | 'core' | 'worker', Record<string, string[]>>
  objects: AgentEvaluationContract[]
  campaigns: AgentEvaluationCampaign[]
  artifact_surfaces: AgentEvaluationArtifactSurface[]
  evidence_schema: Record<string, unknown> | null
}

export interface AgentEvaluationCampaign {
  id: string
  kind: 'project-fixture' | 'provider-gate'
  owner: string
  fixtures: string[]
  metrics: string[]
  artifact_surfaces: string[]
  real_provider: boolean
}

export interface AgentEvaluationArtifactSurface {
  id: string
  kind: string
  required: boolean
  host_evidence_source: string
  deterministic_checks: string[]
  semantic_goals: string[]
  primary_dimension: string
}

export interface AgentEvaluationTrace {
  events?: Array<{ id?: string, type: string, source?: string, details?: unknown }>
  command_failures?: Array<Record<string, unknown>>
  warnings?: Array<Record<string, unknown>>
  unavailable?: Array<Record<string, unknown>>
  artifacts?: Array<Record<string, unknown>>
  self_report?: Record<string, unknown> | null
  host_observed?: Record<string, unknown>
  final?: string | null
  usage?: unknown
  tool_calls?: number | null
  elapsed_ms?: number | null
}

export interface AgentEvaluationScore {
  status: 'passed' | 'failed' | 'incomplete'
  dimensions: Record<string, { status: 'passed' | 'failed' | 'incomplete' | 'not-observed', evidence: unknown }>
  deterministic: Record<string, unknown>
  evidence_catalog: AgentEvaluationEvidenceCatalog
  normalized_trace: AgentEvaluationTrace
}

export interface AgentEvaluationEvidenceCatalog {
  schema_version: 1
  entries: Array<{ id: string, source_kind: string, locator: string, provenance: Record<string, unknown>, value: unknown }>
}

export interface AgentEvaluationAnalysis {
  schema_version: 1
  verdict: 'passed' | 'failed' | 'incomplete'
  findings: Array<{
    id: string
    severity: 'P0' | 'P1' | 'P2' | 'P3'
    category: string
    summary: string
    evidence_ids: string[]
    confidence: number
    blocking: boolean
  }>
  confidence: number | null
  disagreement: unknown
}

export function validateAgentEvaluationRegistry(registry: unknown, options?: { root?: string }): AgentEvaluationRegistry
export function validateAgentEvaluationCampaignRegistry(registry: unknown, options?: { root?: string }): { version: 1, id: string, campaigns: AgentEvaluationCampaign[] }
export function loadAgentEvaluationRegistry(root: string): AgentEvaluationRegistry
export function loadAgentEvaluationCampaignRegistry(root: string): { version: 1, id: string, campaigns: AgentEvaluationCampaign[] }
export function sanitizeAgentEvaluationValue(value: unknown, key?: string): unknown
export function detectAgentEvaluationLeaks(value: unknown): Array<{ kind: string, path: string, value: string }>
export function normalizeAgentEvaluationTrace(trace?: AgentEvaluationTrace): AgentEvaluationTrace
export function buildAgentEvaluationEvidenceCatalog(options?: { trace?: AgentEvaluationTrace, deterministic?: Record<string, unknown> }): AgentEvaluationEvidenceCatalog
export function validateAgentEvaluationArtifactSurfaces(options: { contract: Partial<AgentEvaluationContract>, surfaces: AgentEvaluationArtifactSurface[], artifacts?: Array<Record<string, unknown>>, evidenceCatalog?: AgentEvaluationEvidenceCatalog | null }): { status: 'passed' | 'failed', surfaces: Array<Record<string, unknown>>, findings: Array<Record<string, unknown>> }
export function scoreAgentEvaluationTrace(options: { contract: Partial<AgentEvaluationContract>, trace: AgentEvaluationTrace, expectedArtifactIds?: string[] }): AgentEvaluationScore
export function buildAgentEvaluationAnalysisInput(options: { contract: Partial<AgentEvaluationContract>, trace: AgentEvaluationTrace, deterministic: Record<string, unknown> }): Record<string, unknown>
export function validateAgentEvaluationAnalysis(analysis: unknown, options?: { evidenceCatalog?: AgentEvaluationEvidenceCatalog | null }): AgentEvaluationAnalysis
export function runAgentEvaluationAnalysis(options: { input: Record<string, unknown>, judge: (input: Record<string, unknown>) => unknown }): AgentEvaluationAnalysis & { deterministic_override: boolean }
export function createAgentEvaluationFakeJudge(options?: { verdict?: 'passed' | 'failed' | 'incomplete', findings?: AgentEvaluationAnalysis['findings'], confidence?: number, disagreement?: unknown }): (input?: Record<string, unknown>) => AgentEvaluationAnalysis
export function createAgentEvaluationLocalJudge(): (input?: Record<string, unknown>) => AgentEvaluationAnalysis
export function assertAgentEvaluationLocalMode(options?: { mode?: string, provider?: Record<string, unknown> | null, providerKind?: string | null }): { mode: string, provider_kind: string, real_provider: false }
export function aggregateAgentEvaluationRuns(options: { plan: { cases?: Array<{ id: string, candidate_repetitions?: number, baseline_repetitions?: number }> }, runs?: Array<Record<string, unknown>>, stopped?: Record<string, unknown> | null, analysis?: unknown, requireObservedEvidence?: boolean }): Record<string, unknown>
export function buildAgentEvaluationResumePlan(options: { report: Record<string, unknown>, from: string }): Record<string, unknown>
export function renderAgentEvaluationMarkdown(report: Record<string, unknown>): string
