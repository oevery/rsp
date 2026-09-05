#!/usr/bin/env node

import { existsSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { executeLocalCommand, localCommandEvidence } from '../verification/harness/local-execution.mjs'
import {
  aggregateAgentEvaluationRuns,
  assertAgentEvaluationLocalMode,
  buildAgentEvaluationAnalysisInput,
  createAgentEvaluationLocalJudge,
  loadAgentEvaluationRegistry,
  runAgentEvaluationAnalysis,
  scoreAgentEvaluationTrace,
} from './agent-evaluation-platform.mjs'

const SKILL_CASES = Object.freeze({
  'rsp': ['operate-existing', 'initialize-repair', 'durable-update'],
  'rsp-manage': ['ready-group', 'interrupted-goal', 'review-convergence'],
  'rsp-shape': ['unclear-request', 'acceptance-ambiguity', 'independent-slices'],
  'rsp-design': ['module-seam', 'reversible-evidence', 'domain-ownership'],
  'rsp-diagnose': ['reproducible-failure', 'unknown-owner', 'recovery'],
  'rsp-implement': ['ready-change', 'known-fix', 'authority-restraint'],
  'rsp-review': ['code-review', 'document-review', 'fixed-scope'],
  'rsp-resolve-findings': ['fixed-report', 'bounded-fix', 'rereview'],
  'rsp-tdd': ['test-first', 'observed-red', 'concrete-risk'],
  'rsp-verify': ['selected-change', 'evidence-gap', 'reverify'],
  'rsp-commit': ['exact-scope', 'reviewed-group', 'message-contract'],
  'rsp-release-docs': ['changelog', 'migration', 'evidence-audit'],
  'rsp-structural-audit': ['bounded-audit', 'risk-inventory', 'evidence-report'],
})

const ROUTING_CASES = [
  ['direct-change', 'direct', 'change'],
  ['group-explicit-owner', 'group', 'group'],
  ['focus-candidate-explicit-owner', 'direct', 'change'],
  ['focus-ambiguity-stop', 'stopped', 'owner-decision'],
  ['authority-stop', 'stopped', 'owner-decision'],
  ['shape-composition', 'shape', 'shape'],
  ['design-composition', 'design', 'design'],
  ['review-composition', 'review', 'review'],
  ['verify-composition', 'verify', 'verify'],
  ['manage-qualification', 'manage', 'manage'],
]

const WORKER_CASES = [
  ['direct', 'direct', 0],
  ['solo', 'solo', 1],
  ['delegated', 'delegated', 1],
  ['coordinated-sequential', 'coordinated', 2],
  ['coordinated-parallel-safe', 'coordinated', 2],
  ['interruption-recovery', 'coordinated', 1],
]

const PROJECT_CATEGORIES = ['checkout', 'package-build', 'install-upgrade', 'worktree', 'generated-artifacts', 'final-handoff']

function fixture(root, relative) {
  const candidate = join(root, relative)
  if (existsSync(candidate) && statSync(candidate).isFile())
    return { path: relative, exists: true }
  const manifest = join(relative, 'case.yaml')
  if (existsSync(join(root, manifest)))
    return { path: manifest, exists: true }
  if (existsSync(candidate))
    return { path: relative, exists: true }
  throw new Error(`evaluation fixture is missing: ${relative}`)
}

function baseContract(id, kind, owner, metrics, artifactSurfaces = ['host-trace', 'workspace-artifacts', 'final-handoff']) {
  return {
    id,
    kind,
    owner,
    installed_skill: kind === 'skill' ? owner : null,
    fixtures: [],
    metrics,
    goals: ['observe the declared behavior at the owning boundary'],
    required_events: ['command_started', 'command_completed', 'workspace_observed'],
    forbidden_events: ['unauthorized_mutation', 'unauthorized_git', 'unauthorized_publication'],
    artifact_surfaces: artifactSurfaces,
  }
}

function localScenario({ root, id, owner, kind, contract, fixtures, commandArgs, artifactPaths, expected = 'passed', verificationDisposition = 'unverified', semanticBoundary }) {
  return {
    id,
    owner,
    kind,
    applicability: 'required',
    fixtures: fixtures.map(path => fixture(root, path)),
    expected,
    contract,
    semantic_boundary: semanticBoundary,
    verification_disposition: verificationDisposition,
    execution: {
      command: 'node',
      args: ['scripts/verification-scenario-check.mjs', ...commandArgs],
      artifact_paths: artifactPaths,
    },
  }
}

export function buildSkillEvaluationMatrix(registry, root = process.cwd()) {
  return registry.objects.filter(object => object.kind === 'skill').flatMap((skill) => {
    const cases = SKILL_CASES[skill.installed_skill] ?? ['package-boundary']
    return cases.map((caseId) => {
      const contract = baseContract(`skill-${skill.installed_skill}-${caseId}`, 'skill', skill.installed_skill, ['compliance', 'boundary', 'artifact', 'handoff'])
      contract.fixtures = skill.fixtures
      return localScenario({
        root,
        id: `skills/${skill.installed_skill}/${caseId}`,
        owner: skill.installed_skill,
        kind: caseId,
        contract,
        fixtures: skill.fixtures,
        commandArgs: ['skill', skill.installed_skill, caseId, skill.fixtures[0]],
        artifactPaths: [`skills/${skill.installed_skill}/SKILL.md`],
        semanticBoundary: 'published-skill-package-load',
      })
    })
  })
}

export function buildRoutingEvaluationMatrix(root = process.cwd()) {
  const routingFixture = 'verification/evaluations/skill-routing/cases.yaml'
  return ROUTING_CASES.map(([id, route, owner]) => {
    const contract = baseContract(`routing-${id}`, 'core', 'rsp-core-routing', ['routing', 'authority', 'focus', 'handoff'], ['host-trace', 'route-decision', 'final-handoff'])
    contract.expected_route = route
    return localScenario({
      root,
      id: `routing/${id}`,
      owner,
      kind: id,
      contract,
      fixtures: [routingFixture],
      commandArgs: ['routing', 'rsp-core-routing', id, routingFixture],
      artifactPaths: [routingFixture],
      semanticBoundary: 'routing-fixture-declaration',
    })
  })
}

export function buildWorkerEvaluationMatrix(root = process.cwd()) {
  const fixtures = [
    'verification/evaluations/managed-controller/holdout/auto-integrated-direct',
    'verification/evaluations/managed-controller/holdout/managed-solo-integrated',
    'verification/evaluations/managed-controller/holdout/managed-delegated-integrated',
    'verification/evaluations/managed-controller/holdout/managed-coordinated-sequential',
    'verification/evaluations/managed-controller/holdout/managed-coordinated-parallel',
    'verification/evaluations/managed-controller/holdout/interruption-recovery',
  ]
  return WORKER_CASES.map(([id, route, dispatchCount], index) => {
    const contract = baseContract(`worker-${id}`, 'worker', 'managed-worker-routing', ['routing', 'dispatch', 'lifecycle', 'ownership', 'serialization', 'recovery', 'handoff'], ['host-trace', 'worker-receipts', 'final-handoff'])
    contract.expected_route = route
    contract.worker_dispatch_count = { min: dispatchCount, max: dispatchCount }
    return localScenario({
      root,
      id: `worker/${id === 'coordinated-parallel-safe' ? 'coordinated-parallel' : id}`,
      owner: 'managed-worker-routing',
      kind: route,
      contract,
      fixtures: [fixtures[index]],
      commandArgs: ['worker', 'managed-worker-routing', id, fixtures[index]],
      artifactPaths: [`${fixtures[index]}/case.yaml`],
      semanticBoundary: 'worker-fixture-declaration',
    })
  })
}

export function buildProjectEvaluationMatrix(root = process.cwd()) {
  const fixturePath = 'verification/evaluations/release-behavior/release-behavior.yaml'
  return PROJECT_CATEGORIES.map((category) => {
    const contract = baseContract(`project-${category}`, 'core', 'project-acceptance-evaluation', ['compliance', 'artifact', 'handoff'], ['host-trace', 'workspace-artifacts', 'final-handoff'])
    return {
      id: `project/${category}`,
      owner: 'project-acceptance-evaluation',
      kind: category,
      applicability: 'required',
      fixtures: [fixture(root, fixturePath)],
      expected: 'passed',
      contract,
      semantic_boundary: 'disposable-release-acceptance',
      verification_disposition: 'unverified',
      execution: {
        command: 'node',
        args: ['scripts/release-acceptance.mjs', '--plan', '--json'],
        artifact_paths: ['verification/acceptance'],
      },
    }
  })
}

function executeScenario(scenario, root, { executeAcceptance = false, sharedReceipts = new Map() } = {}) {
  const acceptance = scenario.semantic_boundary === 'disposable-release-acceptance'
  const key = acceptance ? 'release-acceptance-plan' : scenario.id
  if (sharedReceipts.has(key))
    return sharedReceipts.get(key)
  const execution = { ...scenario.execution }
  let disposition = scenario.verification_disposition ?? 'unverified'
  if (acceptance && executeAcceptance) {
    execution.args = ['scripts/release-acceptance.mjs', '--json', '--output-root', '.cache/verification-acceptance']
    execution.timeoutMs = 900_000
    disposition = 'verified'
  }
  const receipt = executeLocalCommand({ root, command: execution.command, args: execution.args, artifactPaths: execution.artifact_paths, timeoutMs: execution.timeoutMs })
  const result = { receipt, disposition }
  sharedReceipts.set(key, result)
  return result
}

export function runLocalEvaluationCampaign({ scenarios, campaignId, mode = 'local', root = process.cwd(), executeAcceptance = false } = {}) {
  const localMode = assertAgentEvaluationLocalMode({ mode })
  const sharedReceipts = new Map()
  const runs = scenarios.map((scenario) => {
    const executed = executeScenario(scenario, root, { executeAcceptance, sharedReceipts })
    const score = scoreAgentEvaluationTrace({ contract: scenario.contract, trace: executed.receipt, expectedArtifactIds: ['artifact-1'] })
    const input = buildAgentEvaluationAnalysisInput({ contract: scenario.contract, trace: executed.receipt, deterministic: score.deterministic })
    const analysis = runAgentEvaluationAnalysis({ input, judge: createAgentEvaluationLocalJudge() })
    const observedVerdict = score.status
    const evidence = localCommandEvidence(executed.receipt)
    return {
      case: scenario.id,
      arm: 'candidate',
      repetition: 1,
      disposition: executed.disposition,
      verdict: observedVerdict === 'passed' ? 'passed' : observedVerdict,
      expected_verdict: scenario.expected,
      observed_verdict: observedVerdict,
      score,
      analysis,
      evidence,
      errors: executed.receipt.command_failures ?? [],
      omissions: executed.disposition === 'verified' ? [] : [{ kind: executed.disposition, reason: 'semantic runtime is not available in local harness' }],
      usage: executed.receipt.usage,
      execution_mode: acceptanceMode(scenario, executeAcceptance),
      provider: localMode,
    }
  })
  const report = aggregateAgentEvaluationRuns({
    plan: { cases: scenarios.map(scenario => ({ id: scenario.id, candidate_repetitions: 1 })) },
    runs,
    requireObservedEvidence: true,
  })
  return { campaign_id: campaignId, mode: localMode.mode, scenarios, report }
}

function acceptanceMode(scenario, executeAcceptance) {
  if (scenario.semantic_boundary === 'disposable-release-acceptance')
    return executeAcceptance ? 'disposable-project' : 'local'
  return 'local'
}

export function buildAllLocalCampaigns(root = process.cwd(), { executeAcceptance = false } = {}) {
  const registry = loadAgentEvaluationRegistry(root)
  return {
    skills: runLocalEvaluationCampaign({ scenarios: buildSkillEvaluationMatrix(registry, root), campaignId: 'skills-local', root }),
    routing: runLocalEvaluationCampaign({ scenarios: buildRoutingEvaluationMatrix(root), campaignId: 'routing-local', root }),
    worker: runLocalEvaluationCampaign({ scenarios: buildWorkerEvaluationMatrix(root), campaignId: 'worker-local', root }),
    project: runLocalEvaluationCampaign({ scenarios: buildProjectEvaluationMatrix(root), campaignId: 'project-local', root, executeAcceptance }),
  }
}
