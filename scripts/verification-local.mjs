#!/usr/bin/env node

import { existsSync, mkdirSync, readdirSync, readFileSync, realpathSync, statSync, writeFileSync } from 'node:fs'
import { join, relative, resolve, sep } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { executeLocalCommand, localCommandEvidence } from '../verification/harness/local-execution.mjs'
import { runLocalAgentEvaluationSuite } from './agent-evaluation-suite.mjs'
import { discoverReleaseProjectScenarios } from './release-acceptance-scenarios.mjs'
import { RELEASE_ACCEPTANCE_STEPS } from './release-acceptance.mjs'
import {
  assertVerificationProviderMode,
  buildVerificationAggregateReport,
  loadVerificationTopology,
} from './verification-platform.mjs'

function now() {
  return new Date().toISOString()
}

function acceptanceOutputRoot() {
  return ['.cache/verification-acceptance', process.pid, Date.now()].join('/')
}

function commandRun(topology, scenario, root, command, args, executionMode, artifactPaths = [], timeoutMs = 900_000) {
  const receipt = executeLocalCommand({ root, command, args, artifactPaths, timeoutMs })
  return {
    scenario_id: scenario.id,
    executionMode,
    disposition: receipt.command_failures?.length ? 'failed' : 'verified',
    startedAt: receipt.started_at,
    completedAt: receipt.completed_at,
    errors: receipt.command_failures ?? [],
    omissions: [],
    evidence: localCommandEvidence(receipt),
    usage: receipt.usage,
    provider: executionMode === 'fake-provider' ? { mode: 'fake', real_provider: false } : null,
    verdict: receipt.command_failures?.length ? 'failed' : 'passed',
  }
}

function parseAcceptanceReport(path) {
  try {
    const report = JSON.parse(readFileSync(path, 'utf8'))
    return report && typeof report === 'object' && !Array.isArray(report) ? report : null
  }
  catch {
    return null
  }
}

function isWithin(base, candidate) {
  return candidate === base || candidate.startsWith(base + sep)
}

const ACCEPTANCE_STEP_IDS = Object.freeze(RELEASE_ACCEPTANCE_STEPS.map(step => step.id))

function hasCompleteAcceptanceStepPlan(report) {
  const stepIds = report.steps.map(step => step.id)
  return stepIds.length === ACCEPTANCE_STEP_IDS.length
    && stepIds.every((id, index) => id === ACCEPTANCE_STEP_IDS[index])
}

function currentAcceptanceReport(report, receipt) {
  if (!report || typeof report.id !== 'string' || report.id.trim() === '' || report.schemaVersion !== 1 || !Array.isArray(report.steps))
    return false
  const stepIds = new Set()
  if (report.steps.some((step) => {
    if (!step || typeof step !== 'object' || Array.isArray(step) || typeof step.id !== 'string' || step.id.trim() === '' || !['passed', 'failed'].includes(step.status) || stepIds.has(step.id))
      return true
    stepIds.add(step.id)
    return false
  })) {
    return false
  }
  if (report.verdict === 'passed' && report.steps.some(step => step.status !== 'passed'))
    return false
  if (!hasCompleteAcceptanceStepPlan(report))
    return false
  const reportStarted = Date.parse(report.startedAt ?? '')
  const reportCompleted = Date.parse(report.completedAt ?? '')
  const receiptStarted = Date.parse(receipt.started_at ?? '')
  const receiptCompleted = Date.parse(receipt.completed_at ?? '')
  if (![reportStarted, reportCompleted].every(Number.isFinite) || reportCompleted < reportStarted)
    return false
  if (Number.isFinite(receiptStarted) && reportStarted < receiptStarted)
    return false
  if (Number.isFinite(receiptCompleted) && reportCompleted > receiptCompleted)
    return false
  return true
}

export function readAcceptanceReport(root, receipt, outputRoot = '.cache/verification-acceptance') {
  const match = receipt.host_observed?.stdout?.match(/^JSON: ([^\r\n]+)$/mu)
  const repositoryRoot = resolve(root)
  const reportsRoot = resolve(repositoryRoot, outputRoot)
  if (!isWithin(repositoryRoot, reportsRoot) || !existsSync(reportsRoot))
    return null
  let canonicalRepositoryRoot
  let canonicalReportsRoot
  try {
    canonicalRepositoryRoot = realpathSync(repositoryRoot)
    canonicalReportsRoot = realpathSync(reportsRoot)
  }
  catch {
    return null
  }
  if (!isWithin(canonicalRepositoryRoot, canonicalReportsRoot))
    return null

  const candidates = []
  if (match) {
    const reportPath = resolve(repositoryRoot, match[1].trim())
    if (isWithin(reportsRoot, reportPath) && existsSync(reportPath)) {
      try {
        const canonicalReportPath = realpathSync(reportPath)
        if (isWithin(canonicalReportsRoot, canonicalReportPath))
          candidates.push({ path: canonicalReportPath, mtimeMs: statSync(canonicalReportPath).mtimeMs })
      }
      catch {
        // Fall back to the report scan below.
      }
    }
  }
  try {
    for (const entry of readdirSync(canonicalReportsRoot, { withFileTypes: true })) {
      if (!entry.isDirectory())
        continue
      const reportPath = join(canonicalReportsRoot, entry.name, 'report.json')
      if (!existsSync(reportPath))
        continue
      const canonicalReportPath = realpathSync(reportPath)
      if (!isWithin(canonicalReportsRoot, canonicalReportPath))
        continue
      candidates.push({ path: canonicalReportPath, mtimeMs: statSync(canonicalReportPath).mtimeMs })
    }
  }
  catch {
    return null
  }
  const uniqueCandidates = [...new Map(candidates.map(candidate => [candidate.path, candidate])).values()]
    .sort((left, right) => right.mtimeMs - left.mtimeMs)
  for (const candidate of uniqueCandidates) {
    const report = parseAcceptanceReport(candidate.path)
    if (currentAcceptanceReport(report, receipt))
      return report
  }
  return null
}

function requiredProjectChecks(project) {
  const checks = project.kind === 'published-upgrade'
    ? ['update', 'doctor', 'check', 'specs', 'generatedIndexRemoved']
    : project.kind === 'existing-rsp'
      ? ['update', 'doctor', 'check', 'status', 'specs', 'history', 'preservedFiles']
      : ['init', 'addSpec', 'doctor', 'status', 'specs', 'preservedFiles']
  if (project.coverage?.includes('dirty-git-worktree'))
    checks.push('dirtyGitWorktree')
  if (project.coverage?.includes('unicode-content'))
    checks.push('unicodeContent')
  if (project.coverage?.includes('monorepo-nesting'))
    checks.push('monorepoNesting')
  return checks
}

function validAcceptanceProjects(projects, expectedProjects) {
  if (!Array.isArray(projects) || !Array.isArray(expectedProjects) || projects.length !== expectedProjects.length)
    return false
  const actualById = new Map(projects.map(project => [project?.id, project]))
  return expectedProjects.every((expected) => {
    const actual = actualById.get(expected.id)
    if (!actual || actual.kind !== expected.kind || actual.fixturePath !== expected.fixturePath || actual.fixtureSha256 !== expected.fixtureSha256)
      return false
    if (!Array.isArray(actual.coverage) || JSON.stringify([...actual.coverage].sort()) !== JSON.stringify([...expected.coverage].sort()))
      return false
    const checks = actual.checks
    return checks && typeof checks === 'object' && !Array.isArray(checks)
      && requiredProjectChecks(expected).every(key => checks[key] === true)
  })
}

function validPackageArtifact(report, receipt) {
  const packageStep = Array.isArray(report?.steps) ? report.steps.find(step => step?.id === 'package') : null
  const evidence = packageStep?.evidence
  const packageIdentity = report?.package
  const packageValue = evidence?.package
  const tarballPath = evidence?.tarballPath
  const tarballSha256 = evidence?.tarballSha256
  if (!packageIdentity || typeof packageIdentity.name !== 'string' || packageIdentity.name.trim() === '' || typeof packageIdentity.version !== 'string' || packageIdentity.version.trim() === '' || packageValue !== `${packageIdentity.name}@${packageIdentity.version}` || typeof tarballPath !== 'string' || tarballPath.trim() === '' || !/^[a-f0-9]{64}$/u.test(tarballSha256 ?? ''))
    return false
  const artifact = Array.isArray(receipt?.artifacts) ? receipt.artifacts.find(item => item?.path === tarballPath) : null
  return artifact?.observed === true && artifact.sha256 === tarballSha256 && artifact.bytes === evidence.tarballBytes
}

export function acceptanceCategoryEvidence(report, category, expectedProjects = [], receipt = null) {
  const steps = Array.isArray(report?.steps) ? report.steps : []
  const reportValid = currentAcceptanceReport(report, { started_at: report?.startedAt, completed_at: report?.completedAt })
  const packageStep = steps.find(step => step?.id === 'package')
  const buildStep = steps.find(step => step?.id === 'build')
  const projects = Array.isArray(packageStep?.evidence?.projectScenarios) ? packageStep.evidence.projectScenarios : []
  const projectListValid = validAcceptanceProjects(projects, expectedProjects)
  const packageArtifactValid = validPackageArtifact(report, receipt)
  const checkoutProjects = projectListValid ? projects : []
  const installProjects = projectListValid ? projects.filter(project => project.coverage.includes('published-upgrade') || project.coverage.includes('fresh-adoption')) : []
  const worktreeProjects = projectListValid ? projects.filter(project => project.coverage.includes('dirty-git-worktree')) : []
  const checks = {
    'checkout': reportValid && report.verdict === 'passed' && projectListValid && checkoutProjects.length > 0,
    'package-build': reportValid && report.verdict === 'passed' && buildStep?.status === 'passed' && packageStep?.status === 'passed' && packageArtifactValid,
    'install-upgrade': reportValid && report.verdict === 'passed' && installProjects.length > 0,
    'worktree': reportValid && report.verdict === 'passed' && worktreeProjects.length > 0,
    'generated-artifacts': reportValid && report.verdict === 'passed' && packageStep?.status === 'passed' && packageArtifactValid,
    'final-handoff': reportValid && report.verdict === 'passed' && projectListValid,
  }
  const selectedProjects = {
    'checkout': checkoutProjects,
    'package-build': projects,
    'install-upgrade': installProjects,
    'worktree': worktreeProjects,
    'generated-artifacts': projects,
    'final-handoff': projects,
  }[category] ?? []
  return {
    verified: checks[category] === true,
    evidence: [{
      source_kind: 'acceptance-report',
      locator: `report.project-category.${category}`,
      value: {
        category,
        report_id: report?.id ?? null,
        report_verdict: report?.verdict ?? null,
        project_count: projects.length,
        selected_project_scenarios: selectedProjects.map(project => ({
          id: project.id ?? null,
          kind: project.kind ?? null,
          coverage: project.coverage ?? [],
          fixturePath: project.fixturePath ?? null,
          fixtureSha256: project.fixtureSha256 ?? null,
          checks: project.checks ?? {},
        })),
        checks,
      },
    }],
  }
}

function acceptanceCategoryRun(scenario, receipt, report, expectedProjects) {
  const categoryName = scenario.id.split('/')[1]
  const category = acceptanceCategoryEvidence(report, categoryName, expectedProjects, receipt)
  const commandPassed = receipt.command_failures?.length === 0
  const verified = commandPassed && category.verified
  return {
    scenario_id: scenario.id,
    executionMode: 'disposable-project',
    disposition: verified ? 'verified' : 'unverified',
    startedAt: receipt.started_at,
    completedAt: receipt.completed_at,
    errors: receipt.command_failures ?? [],
    omissions: verified ? [] : [{ kind: 'unverified', reason: report ? `acceptance category ${categoryName} lacks a passing category-specific oracle` : 'acceptance report was not observed' }],
    evidence: [...localCommandEvidence(receipt), ...category.evidence],
    usage: receipt.usage,
    provider: null,
    verdict: verified ? 'passed' : commandPassed ? 'unverified' : 'failed',
  }
}

function acceptanceTestRun(scenario, receipt, report) {
  const step = report?.steps?.find(item => item.id === 'tests')
  const evidence = [{
    source_kind: 'acceptance-report',
    locator: 'report.steps.tests',
    value: { status: step?.status ?? null, evidence: step?.evidence ?? null },
  }]
  const verified = receipt.command_failures?.length === 0 && step?.status === 'passed' && step.evidence?.testsPassed === step.evidence?.testsTotal
  return {
    scenario_id: scenario.id,
    executionMode: 'deterministic',
    disposition: verified ? 'verified' : report ? 'unverified' : 'unavailable',
    startedAt: receipt.started_at,
    completedAt: receipt.completed_at,
    errors: receipt.command_failures ?? [],
    omissions: verified ? [] : [{ kind: report ? 'unverified' : 'unavailable', reason: 'deterministic test evidence was derived from release acceptance' }],
    evidence: [...localCommandEvidence(receipt), ...evidence],
    usage: receipt.usage,
    provider: null,
    verdict: verified ? 'passed' : receipt.command_failures?.length ? 'failed' : 'unverified',
  }
}

function providerRun(topology, provider) {
  const scenario = topology.scenarios.find(item => item.id === 'provider/fake-baseline-candidate')
  if (!scenario)
    throw new Error('fake provider scenario is missing from verification topology')
  const entries = provider.score?.evidence_catalog?.entries ?? []
  return {
    scenario_id: scenario.id,
    executionMode: 'fake-provider',
    disposition: provider.score?.status === 'passed' ? 'verified' : 'failed',
    startedAt: now(),
    completedAt: now(),
    errors: [],
    omissions: [],
    evidence: entries.map(entry => ({ source_kind: entry.source_kind, locator: entry.locator, provenance: entry.provenance, value: entry.value })),
    usage: provider.baseline?.usage && provider.candidate?.usage
      ? {
          input_tokens: (provider.baseline.usage.input_tokens ?? 0) + (provider.candidate.usage.input_tokens ?? 0),
          output_tokens: (provider.baseline.usage.output_tokens ?? 0) + (provider.candidate.usage.output_tokens ?? 0),
          total_tokens: (provider.baseline.usage.total_tokens ?? 0) + (provider.candidate.usage.total_tokens ?? 0),
          source: 'fake-provider-baseline-candidate',
        }
      : provider.candidate?.usage ?? null,
    provider: { mode: 'fake', real_provider: false },
    verdict: provider.score?.status === 'passed' ? 'passed' : 'failed',
  }
}

function campaignRuns(topology, suite) {
  return Object.entries(suite.campaigns)
    .filter(([name]) => name !== 'project')
    .flatMap(([, campaign]) => campaign.report.runs.map(run => ({
      scenario_id: run.case,
      executionMode: run.execution_mode ?? (run.disposition === 'simulated' ? 'simulated' : 'local'),
      disposition: run.disposition ?? null,
      startedAt: null,
      completedAt: null,
      errors: run.errors ?? [],
      omissions: run.omissions ?? [],
      evidence: run.evidence ?? [],
      usage: run.usage ?? null,
      provider: run.provider ?? null,
      analysis: run.analysis ?? null,
      verdict: run.verdict === 'passed' ? 'passed' : run.verdict,
    })))
}

const DETERMINISTIC_FIELDS = Object.freeze([
  'missing_required_events',
  'forbidden_events',
  'command_failures',
  'warnings',
  'unavailable',
  'leakage',
  'route_conflicts',
  'worker_findings',
  'missing_artifacts',
  'evidence_ids',
])

function compactEvaluationRun(run) {
  const deterministic = Object.fromEntries(DETERMINISTIC_FIELDS
    .filter(field => run.score?.deterministic?.[field] !== undefined)
    .map(field => [field, run.score.deterministic[field]]))
  return {
    case: run.case,
    arm: run.arm,
    repetition: run.repetition,
    execution_mode: run.execution_mode,
    disposition: run.disposition,
    verdict: run.verdict,
    expected_verdict: run.expected_verdict,
    observed_verdict: run.observed_verdict,
    score: {
      status: run.score?.status ?? null,
      dimensions: Object.fromEntries(Object.entries(run.score?.dimensions ?? {}).map(([name, dimension]) => [name, { status: dimension.status }])),
      deterministic,
    },
    evidence_count: Array.isArray(run.evidence) ? run.evidence.length : 0,
    errors: run.errors ?? [],
    omissions: run.omissions ?? [],
    usage: run.usage ?? null,
    provider: run.provider ?? null,
    analysis: run.analysis
      ? {
          verdict: run.analysis.verdict,
          findings: run.analysis.findings ?? [],
          confidence: run.analysis.confidence ?? null,
          disagreement: run.analysis.disagreement ?? null,
          deterministic_override: run.analysis.deterministic_override ?? false,
        }
      : null,
  }
}

function compactEvaluationSuite(suite) {
  return {
    schema_version: suite.schema_version,
    verdict: suite.verdict,
    inventory: suite.inventory,
    campaigns: Object.fromEntries(Object.entries(suite.campaigns).map(([name, campaign]) => [name, {
      campaign_id: campaign.campaign_id,
      mode: campaign.mode,
      scenarios: campaign.scenarios.map(scenario => ({
        id: scenario.id,
        kind: scenario.kind,
        owner: scenario.owner,
      })),
      report: {
        verdict: campaign.report.verdict,
        execution: campaign.report.execution,
        runs: campaign.report.runs.map(compactEvaluationRun),
        errors: campaign.report.errors,
        omissions: campaign.report.omissions,
        analysis: campaign.report.analysis,
      },
    }])),
    provider: { mode: suite.provider.mode, real_provider: suite.provider.real_provider, verdict: suite.provider.score?.status },
    invariants: suite.invariants,
  }
}

export function buildLocalVerificationSummary(root = process.cwd(), { executeTests = false, executeAcceptance = false } = {}) {
  const repositoryRoot = resolve(root)
  const topology = loadVerificationTopology(repositoryRoot)
  const suite = runLocalAgentEvaluationSuite(repositoryRoot, { executeAcceptance: false })
  const provider = suite.provider
  const runs = campaignRuns(topology, suite)
  const acceptanceScenarios = topology.by_layer.acceptance
  let acceptanceReceipt = null
  let acceptanceReport = null
  const expectedProjects = executeAcceptance ? discoverReleaseProjectScenarios(repositoryRoot).scenarios : []
  if (executeAcceptance) {
    const outputRoot = acceptanceOutputRoot()
    const packageArtifactPath = `${outputRoot}/artifacts/package.tgz`
    acceptanceReceipt = executeLocalCommand({ root: repositoryRoot, command: 'node', args: ['scripts/release-acceptance.mjs', '--json', '--output-root', outputRoot], artifactPaths: [outputRoot, packageArtifactPath], timeoutMs: 900_000 })
    acceptanceReport = readAcceptanceReport(repositoryRoot, acceptanceReceipt, outputRoot)
    for (const scenario of acceptanceScenarios)
      runs.push(acceptanceCategoryRun(scenario, acceptanceReceipt, acceptanceReport, expectedProjects))
  }
  else {
    for (const scenario of acceptanceScenarios) {
      runs.push({
        scenario_id: scenario.id,
        executionMode: 'disposable-project',
        startedAt: null,
        completedAt: null,
        errors: [],
        omissions: [{ kind: 'unverified', reason: 'disposable acceptance was not requested by this command' }],
        evidence: [],
        usage: null,
        provider: null,
        verdict: 'unverified',
      })
    }
  }
  const testScenario = topology.by_layer.test[0]
  if (executeTests && acceptanceReceipt) {
    runs.push(acceptanceTestRun(testScenario, acceptanceReceipt, acceptanceReport))
  }
  else if (executeTests) {
    runs.push(commandRun(topology, testScenario, repositoryRoot, 'pnpm', ['run', 'verify:test'], 'deterministic', ['verification/tests/architecture/verification-topology.test.ts']))
  }
  else {
    runs.push({
      scenario_id: testScenario.id,
      executionMode: 'deterministic',
      startedAt: null,
      completedAt: null,
      errors: [],
      omissions: [{ kind: 'skipped', reason: 'test layer was not requested by this command' }],
      evidence: [],
      usage: null,
      provider: null,
      verdict: 'unverified',
    })
  }
  runs.push(providerRun(topology, provider))
  const report = buildVerificationAggregateReport({
    id: `verification-${executeTests && executeAcceptance ? 'local' : 'plan'}`,
    topology,
    runs,
    boundaries: [
      { boundary: 'real-provider', disposition: 'unavailable', reason: 'disabled by local verification policy' },
      { boundary: 'Skill semantic runtime', disposition: 'unverified', reason: 'no executable agent/provider runtime was invoked' },
      { boundary: 'worker lifecycle', disposition: 'unverified', reason: 'no host worker adapter was invoked' },
    ],
    aiAnalysis: {
      judge: 'local-deterministic-judge',
      semantic_provider_invoked: false,
      analyzed_runs: runs.filter(run => run.analysis).length,
      findings: runs.flatMap(run => (run.analysis?.findings ?? []).map(finding => ({ ...finding, scenario_id: run.scenario_id }))),
      hard_failures_override_semantic_pass: true,
    },
    source: { node: process.version, execution_tests: executeTests, execution_acceptance: executeAcceptance },
  })
  const summary = {
    schema_version: 1,
    topology: {
      scenario_count: topology.scenarios.length,
      by_layer: Object.fromEntries(Object.entries(topology.by_layer).map(([layer, scenarios]) => [layer, scenarios.length])),
      provider_real_execution: topology.config.provider.real_execution,
    },
    aggregate: report,
    evaluations: compactEvaluationSuite(suite),
    provider: { mode: provider.mode, real_provider: provider.real_provider, usage: { baseline: provider.baseline.usage, candidate: provider.candidate.usage }, verdict: provider.score.status },
    boundaries: report.boundaries,
  }
  return summary
}

export function writeAggregateArtifact(root, summary) {
  const repositoryRoot = resolve(root)
  const directory = join(repositoryRoot, 'verification', 'artifacts')
  mkdirSync(directory, { recursive: true })
  const jsonPath = join(directory, 'verification-local-report.json')
  const markdownPath = join(directory, 'verification-local-report.md')
  writeFileSync(jsonPath, `${JSON.stringify(summary, null, 2)}\n`)
  writeFileSync(markdownPath, renderSummaryMarkdown(summary))
  return {
    jsonPath: relative(repositoryRoot, jsonPath).split(sep).join('/'),
    markdownPath: relative(repositoryRoot, markdownPath).split(sep).join('/'),
  }
}

function renderSummaryMarkdown(summary) {
  const report = summary.aggregate
  const findings = Array.isArray(report.ai_analysis?.findings) ? report.ai_analysis.findings : []
  const lines = [
    '# Verification local report',
    '',
    `- Verdict: ${report.verdict}`,
    `- Planned: ${report.planned}`,
    `- Executed: ${report.executed}`,
    `- Verified: ${report.verified}`,
    `- Failed: ${report.failed}`,
    `- Unverified: ${report.unverified}`,
    `- Unavailable: ${report.unavailable}`,
    `- Simulated: ${report.simulated}`,
    `- Errors: ${report.errors.length}`,
    `- Usage: ${report.usage.input_tokens} input + ${report.usage.output_tokens} output = ${report.usage.total_tokens} total tokens${report.usage.known ? '' : ' (unknown)'}`,
    '',
    '## Coverage',
    '',
  ]
  for (const [layer, count] of Object.entries(summary.topology.by_layer ?? {}))
    lines.push(`- ${layer}: ${count} planned`)
  lines.push('', '## Omissions', '')
  const omissionGroups = new Map()
  for (const omission of report.omissions) {
    const key = JSON.stringify({ kind: omission.kind ?? 'unknown', reason: omission.reason ?? null })
    omissionGroups.set(key, (omissionGroups.get(key) ?? 0) + 1)
  }
  for (const [key, count] of omissionGroups)
    lines.push(`- ${JSON.stringify({ ...JSON.parse(key), count })}`)
  lines.push('', '## Boundaries', '')
  for (const boundary of report.boundaries)
    lines.push(`- ${boundary.boundary}: ${boundary.disposition} (${boundary.reason})`)
  lines.push('', '## AI analysis', '', `- Provenance: ${report.ai_analysis.provenance}`, `- Judge: ${report.ai_analysis.judge ?? 'unavailable'}`, `- Semantic provider invoked: ${report.ai_analysis.semantic_provider_invoked ?? 'unknown'}`, `- Findings: ${findings.length}`, '- Real provider execution: disabled.')
  for (const finding of findings)
    lines.push(`- ${JSON.stringify({ id: finding.id ?? null, severity: finding.severity ?? null, category: finding.category ?? null, summary: finding.summary ?? null, evidence_ids: finding.evidence_ids ?? [] })}`)
  return `${lines.join('\n')}\n`
}

export function runVerificationCommand(command, root = process.cwd()) {
  const repositoryRoot = resolve(root)
  if (command === 'provider-real' || command === 'real')
    assertVerificationProviderMode('real-provider')
  if (command === 'accept') {
    const outputRoot = acceptanceOutputRoot()
    const receipt = executeLocalCommand({ root: repositoryRoot, command: 'node', args: ['scripts/release-acceptance.mjs', '--json', '--output-root', outputRoot], artifactPaths: [outputRoot], timeoutMs: 900_000 })
    process.stdout.write(`${JSON.stringify({ layer: 'acceptance', verdict: receipt.command_failures?.length ? 'failed' : 'passed', evidence: localCommandEvidence(receipt), real_provider: false }, null, 2)}\n`)
    return receipt.command_failures?.length ? 1 : 0
  }
  if (command === 'provider-fake') {
    const summary = buildLocalVerificationSummary(repositoryRoot)
    process.stdout.write(`${JSON.stringify({ provider: summary.provider, boundary: summary.boundaries }, null, 2)}\n`)
    return summary.provider.verdict === 'passed' ? 0 : 1
  }
  if (command === 'evaluate') {
    const summary = buildLocalVerificationSummary(repositoryRoot)
    process.stdout.write(`${JSON.stringify(summary.evaluations, null, 2)}\n`)
    return summary.evaluations.verdict === 'passed' ? 0 : 1
  }
  if (command === 'local') {
    const summary = buildLocalVerificationSummary(repositoryRoot, { executeTests: true, executeAcceptance: true })
    const paths = writeAggregateArtifact(repositoryRoot, summary)
    process.stdout.write(`${JSON.stringify({ ...summary, report_paths: paths }, null, 2)}\n`)
    return summary.aggregate.verdict === 'passed' ? 0 : 1
  }
  throw new Error(`unknown verification command: ${command}`)
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    process.exitCode = runVerificationCommand(process.argv[2] ?? 'local')
  }
  catch (error) {
    process.stderr.write(`${error.message}\n`)
    process.exitCode = 2
  }
}
