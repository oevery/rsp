#!/usr/bin/env node

import {
  buildAllLocalCampaigns,
} from './agent-evaluation-campaigns.mjs'
import { loadAgentEvaluationRegistry } from './agent-evaluation-platform.mjs'
import { runFakeProviderGate } from './release-provider-gate-eval.mjs'

export function runLocalAgentEvaluationSuite(root = process.cwd(), { executeAcceptance = false } = {}) {
  const registry = loadAgentEvaluationRegistry(root)
  const campaigns = buildAllLocalCampaigns(root, { executeAcceptance })
  const provider = runFakeProviderGate({ baseline: { model: 'fake-baseline', usage: { input_tokens: 10, output_tokens: 2 } }, candidate: { model: 'fake-candidate', usage: { input_tokens: 11, output_tokens: 3 } } })
  const reports = Object.values(campaigns).map(campaign => campaign.report)
  const evidenceComplete = reports.every(report => report.runs.every(run => run.score?.evidence_catalog?.entries?.length > 0))
  const failed = reports.some(report => report.verdict === 'failed') || provider.score.status === 'failed'
  const passed = reports.every(report => report.verdict === 'passed') && provider.score.status === 'passed' && evidenceComplete
  return {
    schema_version: 1,
    verdict: passed ? 'passed' : failed ? 'failed' : 'incomplete',
    inventory: {
      published_skills: registry.objects.filter(object => object.kind === 'skill').map(object => object.installed_skill),
      core_routes: registry.objects.filter(object => object.kind === 'core').map(object => object.owner),
      worker_routes: registry.objects.filter(object => object.kind === 'worker').map(object => object.owner),
      project_categories: campaigns.project.scenarios.map(scenario => scenario.kind),
    },
    campaigns,
    provider,
    invariants: {
      evidence_provenance_complete: evidenceComplete,
      deterministic_hard_failures_authoritative: true,
      coverage_dispositions: ['verified', 'skipped', 'unavailable', 'unverified', 'simulated'],
      real_provider_acceptance: 'outside-group',
      project_acceptance_executed: executeAcceptance,
    },
  }
}
