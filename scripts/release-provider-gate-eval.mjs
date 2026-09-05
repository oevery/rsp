#!/usr/bin/env node

import { assertAgentEvaluationLocalMode, buildAgentEvaluationAnalysisInput, createAgentEvaluationFakeJudge, runAgentEvaluationAnalysis, scoreAgentEvaluationTrace } from './agent-evaluation-platform.mjs'

function usage(value, status = 'verified') {
  const input = Number.isInteger(value?.input_tokens) ? value.input_tokens : null
  const output = Number.isInteger(value?.output_tokens) ? value.output_tokens : null
  const total = Number.isInteger(value?.total_tokens) ? value.total_tokens : input !== null && output !== null ? input + output : null
  return { input_tokens: input, output_tokens: output, total_tokens: total, source: value?.source ?? 'fake-provider', status, price_snapshot: value?.price_snapshot ?? null, estimated_cost: value?.estimated_cost ?? null, currency: value?.currency ?? null, confidence: total === null ? 0 : 1 }
}

export function normalizeFakeProviderRun({ provider = 'fake-provider', model = 'fake-model', config = {}, response = {}, usage: rawUsage = {} } = {}) {
  assertAgentEvaluationLocalMode({ mode: 'fake', providerKind: 'fixture' })
  return {
    provider,
    model,
    config_provenance: Object.keys(config).filter(key => !/token|secret|password|authorization|cookie|api[_ -]?key/iu.test(key)).sort(),
    response: { status: response.status ?? 'completed', text: response.text ?? '' },
    usage: usage(rawUsage, Number.isInteger(rawUsage?.input_tokens) || Number.isInteger(rawUsage?.output_tokens) || Number.isInteger(rawUsage?.total_tokens) ? 'verified' : 'unverified'),
    latency_ms: Number.isFinite(response.latency_ms) ? response.latency_ms : null,
    retries: Number.isInteger(response.retries) ? response.retries : 0,
    error: response.error ?? null,
    capacity: response.capacity ?? 'available',
  }
}

export function runFakeProviderGate({ baseline, candidate, trace = {} } = {}) {
  assertAgentEvaluationLocalMode({ mode: 'fake', providerKind: 'fixture' })
  const contract = { id: 'provider-gate-fake', kind: 'worker', owner: 'release-provider-gate', metrics: ['compliance', 'boundary', 'artifact', 'recovery', 'handoff'], goals: ['compare equivalent fake provider arms'], required_events: ['provider_started', 'response_observed', 'usage_observed', 'result_returned'], forbidden_events: ['real_provider_started'], artifact_surfaces: ['host-trace', 'final-handoff'] }
  const enrichedTrace = { ...trace, events: trace.events ?? contract.required_events.map(type => ({ type })), final: trace.final ?? 'fake provider gate completed', artifacts: trace.artifacts ?? [{ id: 'artifact-1', content: 'fake-provider-report' }], host_observed: { ...(trace.host_observed ?? {}), provider_mode: 'fake', recovery: trace.host_observed?.recovery ?? 'settled' } }
  const score = scoreAgentEvaluationTrace({ contract, trace: enrichedTrace, expectedArtifactIds: ['artifact-1'] })
  const input = buildAgentEvaluationAnalysisInput({ contract, trace: enrichedTrace, deterministic: score.deterministic })
  const analysis = runAgentEvaluationAnalysis({ input, judge: createAgentEvaluationFakeJudge() })
  return { mode: 'fake', baseline: normalizeFakeProviderRun(baseline), candidate: normalizeFakeProviderRun(candidate), score, analysis, real_provider: false, follow_up: 'real provider acceptance requires a separately authorized Change and fresh availability check' }
}
