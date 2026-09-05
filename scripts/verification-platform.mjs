#!/usr/bin/env node

import { existsSync, readFileSync } from 'node:fs'
import { isAbsolute, join, resolve, sep } from 'node:path'
import { parse as parseYaml } from 'yaml'
import { loadAgentEvaluationRegistry } from './agent-evaluation-platform.mjs'

export const VERIFICATION_SCHEMA_VERSION = 1
export const VERIFICATION_LAYERS = Object.freeze(['test', 'evaluation', 'acceptance'])
export const VERIFICATION_EXECUTION_MODES = Object.freeze(['deterministic', 'simulated', 'local', 'fake-provider', 'disposable-project', 'real-provider'])
export const VERIFICATION_DISPOSITIONS = Object.freeze(['verified', 'failed', 'skipped', 'unavailable', 'unverified', 'simulated'])
const CONFIG_LAYER_KEYS = Object.freeze({ test: 'tests', evaluation: 'evaluations', acceptance: 'acceptance' })
const LAYER_EXECUTION_MODES = Object.freeze({
  test: new Set(['deterministic']),
  evaluation: new Set(['simulated', 'local', 'fake-provider']),
  acceptance: new Set(['disposable-project']),
})
const AI_SEVERITIES = new Set(['P0', 'P1', 'P2', 'P3'])

function invalid(message) {
  throw new Error(`verification contract invalid: ${message}`)
}

function object(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    invalid(`${label} must be an object`)
  return value
}

function nonEmptyString(value, label) {
  if (typeof value !== 'string' || value.trim() === '')
    invalid(`${label} must be a non-empty string`)
  return value
}

function stringArray(value, label) {
  if (!Array.isArray(value) || value.some(item => typeof item !== 'string' || item.trim() === ''))
    invalid(`${label} must be a string array`)
  return [...new Set(value)]
}

function normalizeEvidence(value, label) {
  const values = Array.isArray(value) ? value : [value]
  return values.map((entry, index) => {
    const itemLabel = `${label}[${index}]`
    object(entry, itemLabel)
    return {
      id: nonEmptyString(entry.id ?? `${label}-${index + 1}`, `${itemLabel}.id`),
      source_kind: nonEmptyString(entry.source_kind ?? 'host-observation', `${itemLabel}.source_kind`),
      locator: nonEmptyString(entry.locator ?? itemLabel, `${itemLabel}.locator`),
      provenance: entry.provenance === undefined ? { source: 'host', observed: true } : object(entry.provenance, `${itemLabel}.provenance`),
      value: entry.value,
    }
  })
}

function scopedEvidence(run) {
  return run.evidence.map((entry, index) => ({
    ...entry,
    id: `${run.scenario_id}:${entry.id ?? `evidence-${index + 1}`}`,
  }))
}

function scopedAnalysis(analysis, scenarioId) {
  if (!analysis || typeof analysis !== 'object' || !Array.isArray(analysis.findings))
    return analysis
  return {
    ...analysis,
    findings: analysis.findings.map(finding => ({
      ...finding,
      evidence_ids: Array.isArray(finding.evidence_ids)
        ? finding.evidence_ids.map(id => String(id).startsWith(`${scenarioId}:`) ? id : `${scenarioId}:${id}`)
        : finding.evidence_ids,
    })),
  }
}

function scopedAggregateFindings(findings, runs) {
  const evidenceByScenario = new Map(runs.map(run => [run.scenario_id, new Set(run.evidence.map(entry => entry.id))]))
  return (Array.isArray(findings) ? findings : []).map((finding) => {
    const scenarioId = typeof finding.scenario_id === 'string' ? finding.scenario_id : null
    const known = scenarioId ? evidenceByScenario.get(scenarioId) : null
    if (!known || !Array.isArray(finding.evidence_ids))
      return finding
    return {
      ...finding,
      evidence_ids: finding.evidence_ids.map((id) => {
        const scopedId = `${scenarioId}:${id}`
        return known.has(scopedId) ? scopedId : id
      }),
    }
  })
}

function validateAnalysis(analysis, label, knownEvidence, { requireVerdict = true } = {}) {
  if (analysis === null || analysis === undefined)
    return
  object(analysis, label)
  if (requireVerdict)
    nonEmptyString(analysis.verdict, `${label}.verdict`)
  if (!Array.isArray(analysis.findings))
    invalid(`${label}.findings must be an array`)
  for (const [index, finding] of analysis.findings.entries()) {
    const findingLabel = `${label}.findings[${index}]`
    object(finding, findingLabel)
    nonEmptyString(finding.id, `${findingLabel}.id`)
    if (!AI_SEVERITIES.has(finding.severity))
      invalid(`${findingLabel}.severity is invalid`)
    nonEmptyString(finding.category, `${findingLabel}.category`)
    nonEmptyString(finding.summary, `${findingLabel}.summary`)
    if (!Number.isFinite(finding.confidence) || finding.confidence < 0 || finding.confidence > 1)
      invalid(`${findingLabel}.confidence must be between 0 and 1`)
    const refs = stringArray(finding.evidence_ids, `${findingLabel}.evidence_ids`)
    const unknown = refs.filter(id => !knownEvidence.has(id))
    if (unknown.length > 0)
      invalid(`${findingLabel}.evidence_ids references unknown evidence: ${unknown.join(', ')}`)
  }
}

function readYaml(root, relativePath, label) {
  const path = resolve(root, relativePath)
  if (!path.startsWith(resolve(root) + sep))
    invalid(`${label} escapes the repository`)
  if (!existsSync(path))
    invalid(`${label} is missing: ${relativePath}`)
  try {
    return { path, value: parseYaml(readFileSync(path, 'utf8')) }
  }
  catch (error) {
    invalid(`${label} cannot be parsed: ${error.message}`)
  }
}

export function loadVerificationConfig(root = process.cwd()) {
  const repositoryRoot = resolve(root)
  const { value } = readYaml(repositoryRoot, 'verification/config.yaml', 'verification config')
  object(value, 'verification config')
  if (value.version !== VERIFICATION_SCHEMA_VERSION)
    invalid(`verification config version must be ${VERIFICATION_SCHEMA_VERSION}`)
  nonEmptyString(value.id, 'verification config.id')
  object(value.layers, 'verification config.layers')
  for (const layer of VERIFICATION_LAYERS) {
    const configKey = CONFIG_LAYER_KEYS[layer]
    const definition = object(value.layers[configKey], `verification config.layers.${configKey}`)
    nonEmptyString(definition.command, `verification config.layers.${configKey}.command`)
    stringArray(definition.execution_modes, `verification config.layers.${configKey}.execution_modes`)
  }
  object(value.reports, 'verification config.reports')
  stringArray(value.reports.dispositions, 'verification config.reports.dispositions')
  stringArray(value.reports.required_fields, 'verification config.reports.required_fields')
  object(value.provider, 'verification config.provider')
  if (value.provider.real_execution !== 'disabled')
    invalid('real provider execution must be disabled in the local architecture')
  return Object.freeze({ ...value, repository_root: repositoryRoot })
}

function validateScenario(scenario, source, index) {
  object(scenario, `${source}.scenarios[${index}]`)
  const id = nonEmptyString(scenario.id, `${source}.scenarios[${index}].id`)
  if (!/^[a-z0-9][a-z0-9./-]*$/u.test(id))
    invalid(`${source}.scenarios[${index}].id is not canonical: ${id}`)
  if (!VERIFICATION_LAYERS.includes(scenario.layer))
    invalid(`${id}.layer is invalid`)
  nonEmptyString(scenario.owner, `${id}.owner`)
  if (!VERIFICATION_EXECUTION_MODES.includes(scenario.execution_mode))
    invalid(`${id}.execution_mode is invalid`)
  stringArray(scenario.fixture_refs, `${id}.fixture_refs`)
  stringArray(scenario.required_evidence, `${id}.required_evidence`)
  nonEmptyString(scenario.oracle, `${id}.oracle`)
  nonEmptyString(scenario.rubric, `${id}.rubric`)
  nonEmptyString(scenario.artifact_policy, `${id}.artifact_policy`)
  if (scenario.layer === 'acceptance' && scenario.execution_mode === 'simulated')
    invalid(`${id} cannot mark simulated execution as acceptance`)
  if (scenario.execution_mode === 'real-provider')
    invalid(`${id} cannot be enabled in the local topology`)
  return Object.freeze({ ...scenario, source })
}

function expandPublishedSkillScenarios(index, registry, source) {
  const expansion = object(index.expansion, `${source}.expansion`)
  if (expansion.type !== 'published-skills')
    invalid(`${source}.expansion.type is unsupported`)
  const caseKinds = stringArray(expansion.case_kinds, `${source}.expansion.case_kinds`)
  return registry.objects
    .filter(item => item.kind === 'skill')
    .flatMap(skill => caseKinds.map(caseKind => validateScenario({
      id: `skills/${skill.installed_skill}/${caseKind}`,
      layer: index.layer,
      owner: index.owner,
      execution_mode: index.execution_mode,
      fixture_refs: [...index.fixture_refs, ...skill.fixtures],
      required_evidence: index.required_evidence,
      oracle: index.oracle,
      rubric: index.rubric,
      artifact_policy: index.artifact_policy,
      contract_owner: skill.owner,
    }, source, 0)))
}

function loadScenarioSource(root, sourceDefinition, registry) {
  const sourcePath = nonEmptyString(sourceDefinition.path, 'scenario source.path')
  const { value } = readYaml(root, join('verification', sourcePath), `scenario source ${sourceDefinition.id}`)
  object(value, `scenario source ${sourceDefinition.id}`)
  const source = `verification/${sourcePath}`
  if (value.layer !== sourceDefinition.layer)
    invalid(`${source}.layer does not match scenarios/index.yaml`)
  if (value.expansion)
    return expandPublishedSkillScenarios(value, registry, source)
  const ids = value.scenario_ids === undefined ? [value.id] : stringArray(value.scenario_ids, `${source}.scenario_ids`)
  return ids.map(id => validateScenario({
    id,
    layer: value.layer,
    owner: value.owner,
    execution_mode: value.execution_mode,
    fixture_refs: value.fixture_refs,
    required_evidence: value.required_evidence,
    oracle: value.oracle,
    rubric: value.rubric,
    artifact_policy: value.artifact_policy,
    runner: value.runner,
  }, source, 0))
}

export function loadVerificationTopology(root = process.cwd()) {
  const repositoryRoot = resolve(root)
  const config = loadVerificationConfig(repositoryRoot)
  const { value: rootIndex } = readYaml(repositoryRoot, 'verification/scenarios/index.yaml', 'scenario index')
  object(rootIndex, 'scenario index')
  if (rootIndex.version !== VERIFICATION_SCHEMA_VERSION)
    invalid(`scenario index version must be ${VERIFICATION_SCHEMA_VERSION}`)
  const registry = loadAgentEvaluationRegistry(repositoryRoot)
  const sources = Array.isArray(rootIndex.sources) ? rootIndex.sources : []
  if (sources.length === 0)
    invalid('scenario index.sources must not be empty')
  const scenarios = sources.flatMap(source => loadScenarioSource(repositoryRoot, source, registry))
  const ids = new Set()
  for (const scenario of scenarios) {
    if (ids.has(scenario.id))
      invalid(`duplicate scenario id: ${scenario.id}`)
    ids.add(scenario.id)
    for (const fixture of scenario.fixture_refs) {
      if (isAbsolute(fixture))
        invalid(`${scenario.id}.fixture_refs must be repository-relative`)
      const fixturePath = resolve(repositoryRoot, fixture)
      if (!fixturePath.startsWith(repositoryRoot + sep) || !existsSync(fixturePath))
        invalid(`${scenario.id}.fixture_refs is missing: ${fixture}`)
    }
  }
  const byLayer = Object.fromEntries(VERIFICATION_LAYERS.map(layer => [layer, scenarios.filter(scenario => scenario.layer === layer)]))
  return Object.freeze({ version: VERIFICATION_SCHEMA_VERSION, config, scenarios: Object.freeze(scenarios), by_layer: byLayer, registry })
}

export function createVerificationRunRecord({ scenario, executionMode = scenario?.execution_mode, startedAt, completedAt, errors = [], omissions = [], evidence = [], verdict = 'unverified', disposition: requestedDisposition = null, usage = null, provider = null, analysis = null } = {}) {
  if (!scenario)
    invalid('run scenario is required')
  const mode = nonEmptyString(executionMode, `${scenario.id}.execution_mode`)
  if (!VERIFICATION_EXECUTION_MODES.includes(mode))
    invalid(`${scenario.id}.execution_mode is invalid`)
  if (!LAYER_EXECUTION_MODES[scenario.layer]?.has(mode))
    invalid(`${scenario.id} cannot record ${mode} execution for ${scenario.layer}`)
  if (mode === 'real-provider')
    invalid(`${scenario.id} cannot record real-provider execution in the local architecture`)
  if (!Array.isArray(errors) || !Array.isArray(omissions) || !Array.isArray(evidence))
    invalid(`${scenario.id} errors, omissions, and evidence must be arrays`)
  const normalizedVerdict = nonEmptyString(verdict, `${scenario.id}.verdict`)
  const normalizedErrors = errors
  const normalizedOmissions = omissions
  const normalizedEvidence = normalizeEvidence(evidence, `${scenario.id}.evidence`)
  const hasErrors = normalizedErrors.length > 0
  const disposition = hasErrors
    ? 'failed'
    : requestedDisposition ?? (normalizedVerdict === 'simulated' || mode === 'simulated'
      ? 'simulated'
      : normalizedVerdict)
  if (!VERIFICATION_DISPOSITIONS.includes(disposition))
    invalid(`${scenario.id}.disposition is invalid: ${disposition}`)
  if (disposition === 'verified' && (normalizedVerdict !== 'passed' || normalizedErrors.length > 0 || normalizedOmissions.length > 0 || normalizedEvidence.length === 0 || mode === 'simulated'))
    invalid(`${scenario.id} has a contradictory verified record`)
  return Object.freeze({
    scenario_id: scenario.id,
    layer: scenario.layer,
    owner: scenario.owner,
    execution_mode: mode,
    started_at: startedAt ?? null,
    completed_at: completedAt ?? null,
    errors: normalizedErrors,
    omissions: normalizedOmissions,
    evidence: normalizedEvidence,
    usage,
    provider,
    analysis,
    verdict: normalizedVerdict,
    disposition,
  })
}

function numericUsage(runs) {
  const totals = { input_tokens: 0, output_tokens: 0, total_tokens: 0, known: false }
  for (const run of runs) {
    const usage = run.usage
    if (!usage || typeof usage !== 'object')
      continue
    const input = Number.isFinite(usage.input_tokens) ? usage.input_tokens : null
    const output = Number.isFinite(usage.output_tokens) ? usage.output_tokens : null
    const total = Number.isFinite(usage.total_tokens) ? usage.total_tokens : input !== null && output !== null ? input + output : null
    if (input !== null)
      totals.input_tokens += input
    if (output !== null)
      totals.output_tokens += output
    if (total !== null)
      totals.total_tokens += total
    if (input !== null || output !== null || total !== null)
      totals.known = true
  }
  return totals
}

export function validateVerificationAggregateReport(report) {
  object(report, 'verification aggregate report')
  if (report.schema_version !== VERIFICATION_SCHEMA_VERSION)
    invalid('verification aggregate report schema_version is invalid')
  nonEmptyString(report.id, 'verification aggregate report.id')
  nonEmptyString(report.verdict, 'verification aggregate report.verdict')
  for (const field of ['planned', 'executed', 'verified', 'failed', 'skipped', 'unavailable', 'unverified', 'simulated']) {
    if (!Number.isInteger(report[field]) || report[field] < 0)
      invalid(`verification aggregate report.${field} must be a non-negative integer`)
  }
  for (const field of ['runs', 'errors', 'omissions', 'evidence', 'boundaries']) {
    if (!Array.isArray(report[field]))
      invalid(`verification aggregate report.${field} must be an array`)
  }
  const dispositions = Object.fromEntries(VERIFICATION_DISPOSITIONS.map(disposition => [disposition, 0]))
  const scenarioIds = new Set()
  const aggregateEvidenceIds = new Set()
  let evidenceCount = 0
  let errorCount = 0
  for (const [index, entry] of report.evidence.entries()) {
    const entryLabel = `verification aggregate report.evidence[${index}]`
    object(entry, entryLabel)
    const id = nonEmptyString(entry.id, `${entryLabel}.id`)
    if (aggregateEvidenceIds.has(id))
      invalid(`verification aggregate report contains duplicate evidence: ${id}`)
    aggregateEvidenceIds.add(id)
    nonEmptyString(entry.source_kind, `${entryLabel}.source_kind`)
    nonEmptyString(entry.locator, `${entryLabel}.locator`)
    object(entry.provenance, `${entryLabel}.provenance`)
  }
  for (const [index, run] of report.runs.entries()) {
    object(run, `verification aggregate report.runs[${index}]`)
    const scenarioId = nonEmptyString(run.scenario_id, `verification aggregate report.runs[${index}].scenario_id`)
    if (scenarioIds.has(scenarioId))
      invalid(`verification aggregate report contains duplicate scenario: ${scenarioId}`)
    scenarioIds.add(scenarioId)
    nonEmptyString(run.layer, `verification aggregate report.runs[${index}].layer`)
    nonEmptyString(run.owner, `verification aggregate report.runs[${index}].owner`)
    nonEmptyString(run.execution_mode, `verification aggregate report.runs[${index}].execution_mode`)
    if (!LAYER_EXECUTION_MODES[run.layer]?.has(run.execution_mode))
      invalid(`verification aggregate report.runs[${index}] execution mode is invalid for its layer`)
    nonEmptyString(run.verdict, `verification aggregate report.runs[${index}].verdict`)
    if (!VERIFICATION_DISPOSITIONS.includes(run.disposition))
      invalid(`verification aggregate report.runs[${index}].disposition is invalid`)
    if (!Array.isArray(run.errors) || !Array.isArray(run.omissions) || !Array.isArray(run.evidence))
      invalid(`verification aggregate report.runs[${index}] errors, omissions, and evidence must be arrays`)
    if (run.disposition === 'verified' && (run.verdict !== 'passed' || run.errors.length > 0 || run.omissions.length > 0 || run.evidence.length === 0 || run.execution_mode === 'simulated'))
      invalid(`verification aggregate report.runs[${index}] has a contradictory verified record`)
    const runEvidenceIds = new Set()
    for (const [evidenceIndex, entry] of run.evidence.entries()) {
      const entryLabel = `verification aggregate report.runs[${index}].evidence[${evidenceIndex}]`
      object(entry, entryLabel)
      const id = nonEmptyString(entry.id, `${entryLabel}.id`)
      if (!aggregateEvidenceIds.has(id))
        invalid(`${entryLabel} is not present in aggregate evidence`)
      runEvidenceIds.add(id)
    }
    validateAnalysis(run.analysis, `verification aggregate report.runs[${index}].analysis`, runEvidenceIds)
    dispositions[run.disposition] += 1
    evidenceCount += run.evidence.length
    errorCount += run.errors.length
  }
  if (report.executed !== report.runs.length)
    invalid('verification aggregate report.executed must equal runs.length')
  for (const disposition of VERIFICATION_DISPOSITIONS) {
    if (report[disposition] !== dispositions[disposition])
      invalid(`verification aggregate report.${disposition} does not match run dispositions`)
  }
  if (report.executed > report.planned)
    invalid('verification aggregate report.executed cannot exceed planned')
  if (report.evidence.length !== evidenceCount)
    invalid('verification aggregate report.evidence does not match run evidence')
  if (report.errors.length !== errorCount)
    invalid('verification aggregate report.errors does not match run errors')
  const remainingOmissions = [...report.omissions]
  for (const omission of report.runs.flatMap(run => run.omissions)) {
    const omissionIndex = remainingOmissions.findIndex(candidate => JSON.stringify(candidate) === JSON.stringify(omission))
    if (omissionIndex < 0)
      invalid('verification aggregate report.omissions does not retain run omissions')
    remainingOmissions.splice(omissionIndex, 1)
  }
  const expectedVerdict = report.failed > 0 ? 'failed' : report.executed < report.planned || report.skipped > 0 || report.unavailable > 0 || report.unverified > 0 || report.simulated > 0 ? 'incomplete' : 'passed'
  if (report.verdict !== 'stopped' && report.verdict !== expectedVerdict)
    invalid('verification aggregate report.verdict contradicts its counts')
  if (!report.usage || typeof report.usage !== 'object')
    invalid('verification aggregate report.usage must be an object')
  object(report.ai_analysis, 'verification aggregate report.ai_analysis')
  nonEmptyString(report.ai_analysis.provenance, 'verification aggregate report.ai_analysis.provenance')
  if (!Array.isArray(report.ai_analysis.findings))
    invalid('verification aggregate report.ai_analysis.findings must be an array')
  validateAnalysis({ findings: report.ai_analysis.findings }, 'verification aggregate report.ai_analysis', aggregateEvidenceIds, { requireVerdict: false })
  return report
}

export function buildVerificationAggregateReport({ id = 'verification-local', topology, runs = [], boundaries = [], aiAnalysis = {}, source = null } = {}) {
  if (!topology || !Array.isArray(topology.scenarios))
    invalid('verification aggregate requires topology')
  const planned = topology.scenarios.length
  const normalizedRuns = runs.map((run) => {
    const scenario = topology.scenarios.find(item => item.id === run.scenario_id)
    if (!scenario)
      invalid(`run references unknown scenario: ${String(run.scenario_id)}`)
    const normalized = createVerificationRunRecord({ scenario, ...run })
    return {
      ...normalized,
      evidence: scopedEvidence(normalized),
      analysis: scopedAnalysis(normalized.analysis, normalized.scenario_id),
    }
  })
  const runIds = normalizedRuns.map(run => run.scenario_id)
  if (new Set(runIds).size !== runIds.length)
    invalid('verification aggregate contains duplicate scenario runs')
  const counts = {
    planned,
    executed: normalizedRuns.length,
    verified: normalizedRuns.filter(run => run.disposition === 'verified').length,
    failed: normalizedRuns.filter(run => run.disposition === 'failed').length,
    skipped: normalizedRuns.filter(run => run.disposition === 'skipped').length,
    unavailable: normalizedRuns.filter(run => run.disposition === 'unavailable').length,
    unverified: normalizedRuns.filter(run => run.disposition === 'unverified').length,
    simulated: normalizedRuns.filter(run => run.disposition === 'simulated').length,
  }
  const errors = normalizedRuns.flatMap(run => run.errors)
  const omissions = normalizedRuns.flatMap(run => run.omissions)
  const missing = Math.max(0, planned - counts.executed)
  if (missing > 0)
    omissions.push({ kind: 'skipped', count: missing, reason: 'planned scenario has no run record' })
  const verdict = counts.failed > 0 ? 'failed' : counts.executed < planned || counts.skipped > 0 || counts.unavailable > 0 || counts.unverified > 0 || counts.simulated > 0 ? 'incomplete' : 'passed'
  return validateVerificationAggregateReport({
    schema_version: VERIFICATION_SCHEMA_VERSION,
    id,
    verdict,
    ...counts,
    runs: normalizedRuns,
    errors,
    omissions,
    evidence: normalizedRuns.flatMap(run => run.evidence),
    usage: numericUsage(normalizedRuns),
    ai_analysis: { provenance: 'local-deterministic-judge', ...aiAnalysis, findings: scopedAggregateFindings(aiAnalysis.findings, normalizedRuns) },
    boundaries,
    source,
  })
}

export function assertVerificationProviderMode(mode) {
  if (mode === 'real-provider' || mode === 'real')
    throw new Error('verification real provider execution is disabled; use a separately authorized Change')
  return mode
}
