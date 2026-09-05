import type { AgentEvaluationAnalysis, AgentEvaluationScore } from './agent-evaluation-platform.d.mts'

export interface FakeProviderRun {
  provider: string
  model: string
  config_provenance: string[]
  response: Record<string, unknown>
  usage: Record<string, unknown>
  latency_ms: number | null
  retries: number
  error: unknown
  capacity: string
}

export interface FakeProviderGateResult {
  mode: 'fake'
  baseline: FakeProviderRun
  candidate: FakeProviderRun
  score: AgentEvaluationScore
  analysis: AgentEvaluationAnalysis & { deterministic_override: boolean }
  real_provider: false
  follow_up: string
}

export function normalizeFakeProviderRun(options?: { provider?: string, model?: string, config?: Record<string, unknown>, response?: Record<string, unknown>, usage?: Record<string, unknown> }): FakeProviderRun
export function runFakeProviderGate(options?: { baseline?: Record<string, unknown>, candidate?: Record<string, unknown>, trace?: Record<string, unknown> }): FakeProviderGateResult
