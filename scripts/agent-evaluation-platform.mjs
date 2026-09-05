#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { isAbsolute, join, resolve, sep } from 'node:path'
import { parse as parseYaml } from 'yaml'

export const AGENT_EVALUATION_SCHEMA_VERSION = 1
export const AGENT_EVALUATION_METRICS = Object.freeze([
  'trigger',
  'routing',
  'compliance',
  'boundary',
  'artifact',
  'recovery',
  'handoff',
  'authority',
  'focus',
  'ambiguity',
  'dispatch',
  'lifecycle',
  'ownership',
  'serialization',
])

const CONTRACT_KINDS = new Set(['skill', 'core', 'worker'])
const CAMPAIGN_KINDS = new Set(['project-fixture', 'provider-gate'])
const SEVERITIES = new Set(['P0', 'P1', 'P2', 'P3'])
const COVERAGE_DISPOSITIONS = new Set(['verified', 'skipped', 'unavailable', 'unverified'])
const EVIDENCE_SOURCE_KINDS = new Set(['event', 'command-failure', 'warning', 'unavailable', 'artifact', 'final-handoff', 'deterministic'])
const ARTIFACT_PRIMARY_DIMENSIONS = new Set(AGENT_EVALUATION_METRICS)
const SECRET_KEY = /token|secret|password|cookie|authorization|api[_ -]?key|bearer/iu
const ABSOLUTE_PATH = /(?:^|[\s"'])\/(?:Users|private|home|var\/folders|tmp)\//u

function invalid(message) {
  throw new Error(`agent evaluation contract invalid: ${message}`)
}

function string(value, label) {
  if (typeof value !== 'string' || value.trim().length === 0)
    invalid(`${label} must be a non-empty string`)
  return value
}

function stringArray(value, label, { allowEmpty = false } = {}) {
  if (!Array.isArray(value) || (!allowEmpty && value.length === 0) || value.some(item => typeof item !== 'string' || item.trim().length === 0))
    invalid(`${label} must be ${allowEmpty ? '' : 'a non-empty '}string array`)
  return [...new Set(value)]
}

function object(value, label) {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    invalid(`${label} must be an object`)
  return value
}

function contained(root, candidate, label) {
  const absolute = resolve(root, candidate)
  const rootPath = resolve(root)
  if (absolute !== rootPath && !absolute.startsWith(rootPath + sep))
    invalid(`${label} escapes repository root`)
  return absolute
}

function normalizeMetricList(value, label) {
  const metrics = stringArray(value, label)
  if (metrics.some(metric => !AGENT_EVALUATION_METRICS.includes(metric)))
    invalid(`${label} contains an unsupported metric`)
  return metrics
}

function normalizeArtifactSurface(entry, index) {
  object(entry, `artifact_surfaces[${index}]`)
  const id = string(entry.id, `artifact_surfaces[${index}].id`)
  const kind = string(entry.kind, `artifact_surfaces[${index}].kind`)
  const hostEvidenceSource = string(entry.host_evidence_source, `artifact_surfaces[${index}].host_evidence_source`)
  const deterministicChecks = stringArray(entry.deterministic_checks, `artifact_surfaces[${index}].deterministic_checks`, { allowEmpty: true })
  const semanticGoals = stringArray(entry.semantic_goals, `artifact_surfaces[${index}].semantic_goals`, { allowEmpty: true })
  const primaryDimension = string(entry.primary_dimension, `artifact_surfaces[${index}].primary_dimension`)
  if (!ARTIFACT_PRIMARY_DIMENSIONS.has(primaryDimension))
    invalid(`artifact_surfaces[${index}].primary_dimension is unsupported`)
  return Object.freeze({ id, kind, required: entry.required === true, host_evidence_source: hostEvidenceSource, deterministic_checks: deterministicChecks, semantic_goals: semanticGoals, primary_dimension: primaryDimension })
}

function normalizeCampaign(entry, index, root) {
  object(entry, `campaigns[${index}]`)
  const id = string(entry.id, `campaigns[${index}].id`)
  const kind = string(entry.kind, `campaigns[${index}].kind`)
  if (!CAMPAIGN_KINDS.has(kind))
    invalid(`campaigns[${index}].kind must be project-fixture or provider-gate`)
  const owner = string(entry.owner, `campaigns[${index}].owner`)
  const fixtures = stringArray(entry.fixtures, `campaigns[${index}].fixtures`)
  for (const fixture of fixtures) {
    if (isAbsolute(fixture))
      invalid(`campaigns[${index}].fixtures must be repository-relative`)
    if (!existsSync(contained(root, fixture, `campaigns[${index}].fixtures`)))
      invalid(`campaigns[${index}].fixture is missing: ${fixture}`)
  }
  const metrics = normalizeMetricList(entry.metrics, `campaigns[${index}].metrics`)
  const artifactSurfaces = stringArray(entry.artifact_surfaces, `campaigns[${index}].artifact_surfaces`)
  return Object.freeze({ id, kind, owner, fixtures, metrics, artifact_surfaces: artifactSurfaces, real_provider: entry.real_provider === true })
}

function normalizeObject(entry, index, root, defaults) {
  object(entry, `objects[${index}]`)
  const id = string(entry.id, `objects[${index}].id`)
  const kind = string(entry.kind, `objects[${index}].kind`)
  if (!CONTRACT_KINDS.has(kind))
    invalid(`objects[${index}].kind must be skill, core, or worker`)
  const owner = string(entry.owner, `objects[${index}].owner`)
  const installedSkill = entry.installed_skill === undefined || entry.installed_skill === null ? null : string(entry.installed_skill, `objects[${index}].installed_skill`)
  const fixtures = stringArray(entry.fixtures, `objects[${index}].fixtures`)
  const metrics = normalizeMetricList(entry.metrics, `objects[${index}].metrics`)
  const kindDefaults = object(defaults?.[kind], `defaults.${kind}`)
  const goals = stringArray(entry.goals ?? kindDefaults.goals, `objects[${index}].goals`)
  const requiredEvents = stringArray(entry.required_events ?? kindDefaults.required_events, `objects[${index}].required_events`)
  const forbiddenEvents = stringArray(entry.forbidden_events ?? kindDefaults.forbidden_events, `objects[${index}].forbidden_events`)
  const artifactSurfaces = stringArray(entry.artifact_surfaces ?? kindDefaults.artifact_surfaces, `objects[${index}].artifact_surfaces`)
  for (const fixture of fixtures) {
    if (isAbsolute(fixture))
      invalid(`objects[${index}].fixtures must be repository-relative`)
    if (!existsSync(contained(root, fixture, `objects[${index}].fixtures`)))
      invalid(`objects[${index}].fixture is missing: ${fixture}`)
  }
  if (kind === 'skill' && installedSkill === null)
    invalid(`objects[${index}].installed_skill is required for Skill contracts`)
  return Object.freeze({ id, kind, owner, installed_skill: installedSkill, fixtures, metrics, goals, required_events: requiredEvents, forbidden_events: forbiddenEvents, artifact_surfaces: artifactSurfaces })
}

export function validateAgentEvaluationRegistry(registry, { root } = {}) {
  object(registry, 'registry')
  if (registry.version !== AGENT_EVALUATION_SCHEMA_VERSION)
    invalid(`version must be ${AGENT_EVALUATION_SCHEMA_VERSION}`)
  string(registry.id, 'registry.id')
  if (!Array.isArray(registry.objects) || registry.objects.length === 0)
    invalid('objects must be a non-empty array')
  object(registry.defaults, 'defaults')
  const repositoryRoot = root ?? process.cwd()
  const artifactSurfaces = (registry.artifact_surfaces ?? []).map(normalizeArtifactSurface)
  const artifactIds = new Set()
  for (const surface of artifactSurfaces) {
    if (artifactIds.has(surface.id))
      invalid(`duplicate artifact surface id: ${surface.id}`)
    artifactIds.add(surface.id)
  }
  const ids = new Set()
  const owners = new Set()
  const objects = registry.objects.map((entry, index) => {
    const normalized = normalizeObject(entry, index, repositoryRoot, registry.defaults)
    if (ids.has(normalized.id))
      invalid(`duplicate object id: ${normalized.id}`)
    if (owners.has(normalized.owner))
      invalid(`duplicate object owner: ${normalized.owner}`)
    for (const surface of normalized.artifact_surfaces) {
      if (!artifactIds.has(surface))
        invalid(`objects[${index}].artifact_surfaces references unknown surface: ${surface}`)
    }
    ids.add(normalized.id)
    owners.add(normalized.owner)
    return normalized
  })
  const campaigns = (registry.campaigns ?? []).map((entry, index) => {
    const normalized = normalizeCampaign(entry, index, repositoryRoot)
    for (const surface of normalized.artifact_surfaces) {
      if (!artifactIds.has(surface))
        invalid(`campaigns[${index}].artifact_surfaces references unknown surface: ${surface}`)
    }
    return normalized
  })
  if (!campaigns.some(campaign => campaign.kind === 'project-fixture'))
    invalid('project-fixture campaign is missing')
  if (!campaigns.some(campaign => campaign.kind === 'provider-gate'))
    invalid('provider-gate campaign is missing')
  const skillNames = new Set(readdirSync(join(repositoryRoot, 'skills'), { withFileTypes: true })
    .filter(entry => entry.isDirectory() && existsSync(join(repositoryRoot, 'skills', entry.name, 'SKILL.md')))
    .map(entry => entry.name))
  const registeredSkills = new Set(objects.filter(entry => entry.kind === 'skill').map(entry => entry.installed_skill))
  const missingSkills = [...skillNames].filter(name => !registeredSkills.has(name)).sort()
  if (missingSkills.length > 0)
    invalid(`published Skills are missing contracts: ${missingSkills.join(', ')}`)
  if (!objects.some(entry => entry.kind === 'core' && entry.owner === 'rsp-core-routing'))
    invalid('rsp-core-routing contract is missing')
  if (!objects.some(entry => entry.kind === 'worker' && entry.owner === 'managed-worker-routing'))
    invalid('managed-worker-routing contract is missing')
  return Object.freeze({ version: registry.version, id: registry.id, defaults: registry.defaults, objects, campaigns, artifact_surfaces: artifactSurfaces, evidence_schema: registry.evidence_schema ?? null })
}

export function validateAgentEvaluationCampaignRegistry(registry, { root } = {}) {
  object(registry, 'campaign_registry')
  if (registry.version !== AGENT_EVALUATION_SCHEMA_VERSION)
    invalid(`campaign_registry.version must be ${AGENT_EVALUATION_SCHEMA_VERSION}`)
  const campaigns = (registry.campaigns ?? []).map((entry, index) => normalizeCampaign(entry, index, root ?? process.cwd()))
  if (campaigns.length === 0)
    invalid('campaign_registry.campaigns must be a non-empty array')
  const ids = new Set()
  for (const campaign of campaigns) {
    if (ids.has(campaign.id))
      invalid(`duplicate campaign id: ${campaign.id}`)
    ids.add(campaign.id)
  }
  return Object.freeze({ version: registry.version, id: string(registry.id, 'campaign_registry.id'), campaigns })
}

export function loadAgentEvaluationRegistry(root) {
  const repositoryRoot = resolve(root)
  const topologyPath = join(repositoryRoot, 'verification', 'contracts', 'registry.yaml')
  let path = join(repositoryRoot, 'verification', 'evaluations', 'agent-evaluation', 'contracts.yaml')
  if (existsSync(topologyPath)) {
    const topology = parseYaml(readFileSync(topologyPath, 'utf8'))
    const source = topology?.agent_evaluation_registry
    if (typeof source === 'string' && source.trim() !== '')
      path = resolve(repositoryRoot, 'verification', 'contracts', source)
  }
  if (!existsSync(path))
    invalid(`registry is missing: ${path}`)
  return validateAgentEvaluationRegistry(parseYaml(readFileSync(path, 'utf8')), { root: repositoryRoot })
}

export function loadAgentEvaluationCampaignRegistry(root) {
  const repositoryRoot = resolve(root)
  const topologyPath = join(repositoryRoot, 'verification', 'contracts', 'registry.yaml')
  let path = join(repositoryRoot, 'verification', 'evaluations', 'agent-evaluation', 'contracts.yaml')
  if (existsSync(topologyPath)) {
    const topology = parseYaml(readFileSync(topologyPath, 'utf8'))
    const source = topology?.agent_evaluation_registry
    if (typeof source === 'string' && source.trim() !== '')
      path = resolve(repositoryRoot, 'verification', 'contracts', source)
  }
  if (!existsSync(path))
    invalid(`campaign registry is missing: ${path}`)
  const registry = parseYaml(readFileSync(path, 'utf8'))
  return validateAgentEvaluationCampaignRegistry({ version: registry.version, id: `${registry.id}-campaigns`, campaigns: registry.campaigns }, { root: repositoryRoot })
}

function normalizeEvents(events) {
  if (events === undefined)
    return []
  if (!Array.isArray(events))
    invalid('trace.events must be an array')
  return events.map((event, index) => {
    object(event, `trace.events[${index}]`)
    if (typeof event.type !== 'string' || event.type.length === 0)
      invalid(`trace.events[${index}].type must be a non-empty string`)
    return { id: typeof event.id === 'string' && event.id.length > 0 ? event.id : `event-${index + 1}`, type: event.type, source: event.source ?? 'host', details: event.details ?? null }
  })
}

function normalizedList(value, label) {
  if (value === undefined)
    return []
  if (!Array.isArray(value))
    invalid(`${label} must be an array`)
  return value
}

function evidenceRef(prefix, index) {
  return `${prefix}-${index + 1}`
}

export function sanitizeAgentEvaluationValue(value, key = '') {
  if (SECRET_KEY.test(key))
    return '[REDACTED]'
  if (typeof value === 'string') {
    if (ABSOLUTE_PATH.test(value))
      return value.replace(/\/(?:Users|private|home|var\/folders|tmp)\/[^\s"']+/gu, '<absolute-path>')
    return value
  }
  if (Array.isArray(value))
    return value.map(item => sanitizeAgentEvaluationValue(item, key))
  if (value && typeof value === 'object')
    return Object.fromEntries(Object.entries(value).map(([childKey, childValue]) => [childKey, sanitizeAgentEvaluationValue(childValue, childKey)]))
  return value
}

function evidenceEntry(id, sourceKind, locator, value, provenance) {
  if (!EVIDENCE_SOURCE_KINDS.has(sourceKind))
    invalid(`unsupported evidence source kind: ${sourceKind}`)
  return { id, source_kind: sourceKind, locator: sanitizeAgentEvaluationValue(locator), provenance: sanitizeAgentEvaluationValue(provenance ?? { source: 'host' }), value: sanitizeAgentEvaluationValue(value) }
}

export function buildAgentEvaluationEvidenceCatalog({ trace = {}, deterministic = {} } = {}) {
  const normalized = normalizeAgentEvaluationTrace(trace)
  const entries = []
  const add = (sourceKind, locator, value, provenance) => entries.push(evidenceEntry(`${sourceKind}-${entries.length + 1}`, sourceKind, locator, value, provenance))
  normalized.events.forEach((event, index) => add('event', `trace.events[${index}]`, event, { source: event.source ?? 'host', observed: true }))
  normalized.command_failures.forEach((item, index) => add('command-failure', `trace.command_failures[${index}]`, item, { source: 'host', observed: true }))
  normalized.warnings.forEach((item, index) => add('warning', `trace.warnings[${index}]`, item, { source: 'host', observed: true }))
  normalized.unavailable.forEach((item, index) => add('unavailable', `trace.unavailable[${index}]`, item, { source: 'host', observed: true }))
  normalized.artifacts.forEach((item, index) => add('artifact', `trace.artifacts[${index}]`, item, { source: 'host', observed: true }))
  if (normalized.final !== null)
    add('final-handoff', 'trace.final', normalized.final, { source: 'host', observed: true })
  for (const [name, value] of Object.entries(deterministic)) {
    if (Array.isArray(value))
      value.forEach((item, index) => add('deterministic', `deterministic.${name}[${index}]`, item, { source: 'scorer', field: name }))
  }
  const ids = new Set()
  for (const entry of entries) {
    if (ids.has(entry.id))
      invalid(`duplicate evidence id: ${entry.id}`)
    ids.add(entry.id)
  }
  return Object.freeze({ schema_version: AGENT_EVALUATION_SCHEMA_VERSION, entries: Object.freeze(entries.map(entry => Object.freeze(entry))) })
}

function evidenceIds(catalog) {
  return new Set((catalog?.entries ?? []).map(entry => entry.id))
}

function validateEvidenceCatalog(catalog) {
  object(catalog, 'evidence_catalog')
  if (catalog.schema_version !== AGENT_EVALUATION_SCHEMA_VERSION)
    invalid(`evidence_catalog.schema_version must be ${AGENT_EVALUATION_SCHEMA_VERSION}`)
  if (!Array.isArray(catalog.entries))
    invalid('evidence_catalog.entries must be an array')
  const ids = new Set()
  catalog.entries.forEach((entry, index) => {
    object(entry, `evidence_catalog.entries[${index}]`)
    const id = string(entry.id, `evidence_catalog.entries[${index}].id`)
    const sourceKind = string(entry.source_kind, `evidence_catalog.entries[${index}].source_kind`)
    if (!EVIDENCE_SOURCE_KINDS.has(sourceKind))
      invalid(`evidence_catalog.entries[${index}].source_kind is invalid`)
    string(entry.locator, `evidence_catalog.entries[${index}].locator`)
    object(entry.provenance, `evidence_catalog.entries[${index}].provenance`)
    if (ids.has(id))
      invalid(`duplicate evidence id: ${id}`)
    ids.add(id)
    if (detectAgentEvaluationLeaks(entry).length > 0)
      invalid('evidence catalog contains unsanitized data')
  })
  return catalog
}

export function validateAgentEvaluationArtifactSurfaces({ contract, surfaces, artifacts = [], evidenceCatalog = null } = {}) {
  object(contract, 'contract')
  if (!Array.isArray(surfaces))
    invalid('artifact surface registry must be an array')
  const selected = surfaces.filter(surface => (contract.artifact_surfaces ?? []).includes(surface.id))
  const selectedIds = new Set(selected.map(surface => surface.id))
  for (const ref of contract.artifact_surfaces ?? []) {
    if (!selectedIds.has(ref))
      invalid(`contract references unknown artifact surface: ${ref}`)
  }
  if (evidenceCatalog)
    validateEvidenceCatalog(evidenceCatalog)
  const knownEvidence = evidenceCatalog ? evidenceIds(evidenceCatalog) : null
  const findings = []
  const result = selected.map((surface) => {
    const observed = artifacts.find(artifact => artifact.surface_id === surface.id)
    const checks = []
    for (const check of surface.deterministic_checks ?? []) {
      if (check === 'present') {
        checks.push({ check, passed: observed !== undefined })
      }
      else if (check === 'non_empty') {
        checks.push({ check, passed: observed !== undefined && ((typeof observed.content === 'string' && observed.content.length > 0) || (Array.isArray(observed.items) && observed.items.length > 0) || observed.content !== undefined) })
      }
      else if (check === 'evidence_refs_known') {
        const refs = Array.isArray(observed?.evidence_ids) ? observed.evidence_ids : []
        checks.push({ check, passed: knownEvidence ? refs.every(id => knownEvidence.has(id)) : observed === undefined || refs.length === 0 })
      }
      else if (check === 'lifecycle_settled') {
        checks.push({ check, passed: observed?.lifecycle_status === 'settled' })
      }
      else if (check === 'self_report_conflict_checked') {
        checks.push({ check, passed: observed?.self_report_conflict_checked === true })
      }
      else {
        checks.push({ check, passed: false, reason: 'unsupported-check' })
      }
    }
    const failedChecks = checks.filter(check => !check.passed)
    if (surface.required && failedChecks.length > 0)
      findings.push({ surface_id: surface.id, failed_checks: failedChecks })
    return { surface_id: surface.id, required: surface.required, observed: observed !== undefined, primary_dimension: surface.primary_dimension, checks }
  })
  return { status: findings.length > 0 ? 'failed' : 'passed', surfaces: result, findings }
}

export function detectAgentEvaluationLeaks(value) {
  const leaks = []
  const visit = (current, path = '$') => {
    if (typeof current === 'string') {
      if (ABSOLUTE_PATH.test(current))
        leaks.push({ kind: 'absolute-path', path, value: '<redacted>' })
      const withoutRedactions = current
        .replace(/(?:authorization\s*[:=]\s*|bearer\s+|(?:api[_ -]?key|token|secret)\s*[:=]\s*)\[REDACTED\]/giu, '')
        .replace(/\[REDACTED\]/gu, '')
      if (/\.codex\/memories|authorization\s*[:=]|bearer\s+[\w.-]{8,}|(?:api[_ -]?key|token|secret)\s*[:=]/iu.test(withoutRedactions))
        leaks.push({ kind: 'sensitive-context', path, value: '<redacted>' })
      return
    }
    if (Array.isArray(current)) {
      current.forEach((item, index) => visit(item, `${path}[${index}]`))
      return
    }
    if (current && typeof current === 'object')
      Object.entries(current).forEach(([key, child]) => visit(child, `${path}.${key}`))
  }
  visit(value)
  return leaks
}

function compareExpectedEvents(contract, events) {
  const types = new Set(events.map(event => event.type))
  const required = contract.required_events ?? []
  const forbidden = contract.forbidden_events ?? []
  return {
    missing: required.filter(type => !types.has(type)),
    forbidden: events.filter(event => forbidden.includes(event.type)).map(event => ({ event_id: event.id, type: event.type })),
  }
}

function scoreDimension(status, evidence = null) {
  return { status, evidence }
}

export function normalizeAgentEvaluationTrace(trace = {}) {
  object(trace, 'trace')
  const normalized = {
    events: normalizeEvents(trace.events),
    command_failures: normalizedList(trace.command_failures, 'trace.command_failures').map((item, index) => ({ id: item.id ?? evidenceRef('command-failure', index), ...sanitizeAgentEvaluationValue(item) })),
    warnings: normalizedList(trace.warnings, 'trace.warnings').map((item, index) => ({ id: item.id ?? evidenceRef('warning', index), ...sanitizeAgentEvaluationValue(item) })),
    unavailable: normalizedList(trace.unavailable, 'trace.unavailable').map((item, index) => ({ id: item.id ?? evidenceRef('unavailable', index), ...sanitizeAgentEvaluationValue(item) })),
    artifacts: normalizedList(trace.artifacts, 'trace.artifacts').map((item, index) => ({ id: item.id ?? evidenceRef('artifact', index), ...sanitizeAgentEvaluationValue(item) })),
    self_report: sanitizeAgentEvaluationValue(trace.self_report ?? null),
    host_observed: sanitizeAgentEvaluationValue(trace.host_observed ?? {}),
    final: typeof trace.final === 'string' ? sanitizeAgentEvaluationValue(trace.final) : null,
    usage: sanitizeAgentEvaluationValue(trace.usage ?? null),
    tool_calls: Number.isInteger(trace.tool_calls) && trace.tool_calls >= 0 ? trace.tool_calls : null,
    elapsed_ms: Number.isFinite(trace.elapsed_ms) && trace.elapsed_ms >= 0 ? trace.elapsed_ms : null,
  }
  return Object.freeze(normalized)
}

function routeConflict(contract, trace) {
  const expected = contract.expected_route
  const hostRoute = trace.host_observed?.route
  const selfRoute = trace.self_report?.route
  const conflicts = []
  if (expected && hostRoute && expected !== hostRoute)
    conflicts.push({ kind: 'host-route-mismatch', expected, actual: hostRoute })
  if (hostRoute && selfRoute && hostRoute !== selfRoute)
    conflicts.push({ kind: 'self-report-host-route-conflict', self_report: selfRoute, host: hostRoute })
  return conflicts
}

function workerDispatchFindings(contract, trace) {
  const expected = contract.worker_dispatch_count
  if (!expected)
    return []
  const actual = trace.host_observed?.worker_dispatch_count
  if (!Number.isInteger(actual))
    return [{ kind: 'worker-dispatch-observation-unavailable', expected }]
  if (actual < expected.min || actual > expected.max)
    return [{ kind: 'worker-dispatch-count-mismatch', expected, actual }]
  if (Number.isInteger(trace.self_report?.worker_dispatch_count) && trace.self_report.worker_dispatch_count !== actual)
    return [{ kind: 'self-report-host-dispatch-conflict', self_report: trace.self_report.worker_dispatch_count, host: actual }]
  return []
}

export function scoreAgentEvaluationTrace({ contract, trace, expectedArtifactIds = [] }) {
  object(contract, 'contract')
  const normalized = normalizeAgentEvaluationTrace(trace)
  const eventResults = compareExpectedEvents(contract, normalized.events)
  const leaks = detectAgentEvaluationLeaks(trace)
  const routeConflicts = routeConflict(contract, normalized)
  const workerFindings = workerDispatchFindings(contract, normalized)
  const artifactIds = new Set(normalized.artifacts.map(item => item.id))
  const missingArtifacts = expectedArtifactIds.filter(id => !artifactIds.has(id))
  const deterministic = {
    missing_required_events: eventResults.missing,
    forbidden_events: eventResults.forbidden,
    command_failures: normalized.command_failures,
    warnings: normalized.warnings,
    unavailable: normalized.unavailable,
    leakage: leaks,
    route_conflicts: routeConflicts,
    worker_findings: workerFindings,
    missing_artifacts: missingArtifacts,
  }
  const evidence_catalog = buildAgentEvaluationEvidenceCatalog({ trace: normalized, deterministic })
  deterministic.evidence_ids = evidence_catalog.entries.map(entry => entry.id)
  const routingStatus = routeConflicts.some(item => item.kind === 'host-route-mismatch') ? 'failed' : normalized.host_observed?.route || normalized.self_report?.route ? 'passed' : 'not-observed'
  const complianceStatus = eventResults.missing.length > 0 || normalized.command_failures.length > 0 ? 'failed' : contract.required_events ? 'passed' : 'not-observed'
  const boundaryStatus = eventResults.forbidden.length > 0 || leaks.length > 0 ? 'failed' : contract.forbidden_events || leaks.length === 0 ? 'passed' : 'not-observed'
  const artifactStatus = missingArtifacts.length > 0 ? 'failed' : expectedArtifactIds.length > 0 ? 'passed' : 'not-observed'
  const recoveryStatus = normalized.unavailable.length > 0 && (normalized.host_observed?.recovery === undefined || normalized.host_observed?.recovery === 'not-observed') ? 'incomplete' : normalized.host_observed?.recovery === undefined ? 'not-observed' : 'passed'
  const handoffStatus = normalized.final === null ? 'not-observed' : normalized.final.length > 0 ? 'passed' : 'failed'
  const dimensions = {
    trigger: scoreDimension(normalized.host_observed?.trigger ? 'passed' : 'not-observed', normalized.host_observed?.trigger ?? null),
    routing: scoreDimension(routingStatus, { conflicts: routeConflicts, expected: contract.expected_route ?? null, actual: normalized.host_observed?.route ?? null }),
    compliance: scoreDimension(complianceStatus, { missing_required_events: eventResults.missing, command_failures: normalized.command_failures.map(item => item.id) }),
    boundary: scoreDimension(boundaryStatus, { forbidden_events: eventResults.forbidden, leakage: leaks }),
    artifact: scoreDimension(artifactStatus, { missing: missingArtifacts, observed: [...artifactIds] }),
    recovery: scoreDimension(recoveryStatus, normalized.host_observed?.recovery ?? null),
    handoff: scoreDimension(handoffStatus, { final_present: normalized.final !== null && normalized.final.length > 0 }),
  }
  const activeDimensions = new Set(contract.metrics ?? Object.keys(dimensions))
  const hardFailure = ['routing', 'compliance', 'boundary', 'artifact'].some(name => activeDimensions.has(name) && dimensions[name].status === 'failed')
  const incomplete = [...activeDimensions].some(name => dimensions[name]?.status === 'not-observed' || dimensions[name]?.status === 'incomplete')
  return { status: hardFailure ? 'failed' : incomplete ? 'incomplete' : 'passed', dimensions, deterministic, evidence_catalog, normalized_trace: normalized }
}

export function buildAgentEvaluationAnalysisInput({ contract, trace, deterministic }) {
  const evidence_catalog = buildAgentEvaluationEvidenceCatalog({ trace, deterministic })
  return sanitizeAgentEvaluationValue({
    schema_version: AGENT_EVALUATION_SCHEMA_VERSION,
    contract: { id: contract.id, owner: contract.owner, kind: contract.kind, goals: contract.goals ?? [], metrics: contract.metrics ?? [], required_events: contract.required_events ?? [], forbidden_events: contract.forbidden_events ?? [] },
    trace,
    deterministic,
    evidence_catalog,
  })
}

export function validateAgentEvaluationAnalysis(analysis, { evidenceCatalog = null } = {}) {
  object(analysis, 'analysis')
  if (analysis.schema_version !== AGENT_EVALUATION_SCHEMA_VERSION)
    invalid(`analysis.schema_version must be ${AGENT_EVALUATION_SCHEMA_VERSION}`)
  if (!['passed', 'failed', 'incomplete'].includes(analysis.verdict))
    invalid('analysis.verdict must be passed, failed, or incomplete')
  if (!Array.isArray(analysis.findings))
    invalid('analysis.findings must be an array')
  const findings = analysis.findings.map((finding, index) => {
    object(finding, `analysis.findings[${index}]`)
    const severity = string(finding.severity, `analysis.findings[${index}].severity`)
    if (!SEVERITIES.has(severity))
      invalid(`analysis.findings[${index}].severity is invalid`)
    if (!Number.isFinite(finding.confidence) || finding.confidence < 0 || finding.confidence > 1)
      invalid(`analysis.findings[${index}].confidence must be between 0 and 1`)
    const evidenceRefs = stringArray(finding.evidence_ids, `analysis.findings[${index}].evidence_ids`)
    if (evidenceCatalog) {
      validateEvidenceCatalog(evidenceCatalog)
      const known = evidenceIds(evidenceCatalog)
      const unknown = evidenceRefs.filter(id => !known.has(id))
      if (unknown.length > 0)
        invalid(`analysis.findings[${index}].evidence_ids references unknown evidence: ${unknown.join(', ')}`)
    }
    return { id: string(finding.id, `analysis.findings[${index}].id`), severity, category: string(finding.category, `analysis.findings[${index}].category`), summary: string(finding.summary, `analysis.findings[${index}].summary`), evidence_ids: evidenceRefs, confidence: finding.confidence, blocking: finding.blocking === true }
  })
  return Object.freeze({ schema_version: analysis.schema_version, verdict: analysis.verdict, findings, confidence: Number.isFinite(analysis.confidence) ? analysis.confidence : null, disagreement: analysis.disagreement ?? null })
}

export function runAgentEvaluationAnalysis({ input, judge }) {
  if (typeof judge !== 'function')
    throw new Error('agent evaluation judge must be a function')
  const analysis = validateAgentEvaluationAnalysis(judge(input), { evidenceCatalog: input.evidence_catalog ?? null })
  const deterministic = input.deterministic ?? {}
  const hardFailure = ['forbidden_events', 'leakage', 'command_failures', 'missing_required_events', 'missing_artifacts', 'route_conflicts', 'worker_findings'].some(name => Array.isArray(deterministic[name]) && deterministic[name].length > 0)
  return { ...analysis, verdict: hardFailure ? 'failed' : analysis.verdict, deterministic_override: hardFailure && analysis.verdict !== 'failed' }
}

export function createAgentEvaluationFakeJudge({ verdict = 'passed', findings = [], confidence = 1, disagreement = null } = {}) {
  const fixed = { schema_version: AGENT_EVALUATION_SCHEMA_VERSION, verdict, findings, confidence, disagreement }
  return () => structuredClone(fixed)
}

export function createAgentEvaluationLocalJudge() {
  return (input = {}) => {
    const deterministic = input.deterministic ?? {}
    const findings = []
    const add = (id, category, summary, evidenceName, severity = 'P1') => {
      const evidenceIds = (input.evidence_catalog?.entries ?? [])
        .filter(entry => entry.source_kind === evidenceName || entry.source_kind === 'deterministic')
        .map(entry => entry.id)
      if (evidenceIds.length > 0)
        findings.push({ id, severity, category, summary, evidence_ids: evidenceIds.slice(0, 4), confidence: 1, blocking: true })
    }
    if ((deterministic.missing_required_events ?? []).length > 0)
      add('missing-required-evidence', 'omission', 'required host observations are missing', 'deterministic')
    if ((deterministic.command_failures ?? []).length > 0)
      add('command-failure', 'execution', 'the declared local command failed', 'command-failure')
    if ((deterministic.leakage ?? []).length > 0)
      add('sensitive-leakage', 'security', 'sanitization detected sensitive or absolute-path content', 'deterministic', 'P0')
    if ((deterministic.route_conflicts ?? []).length > 0)
      add('route-conflict', 'routing', 'host routing conflicts with the declared expectation', 'deterministic')
    return {
      schema_version: AGENT_EVALUATION_SCHEMA_VERSION,
      verdict: findings.length > 0 ? 'failed' : 'passed',
      findings,
      confidence: findings.length > 0 ? 1 : 0.9,
      disagreement: null,
    }
  }
}

export function assertAgentEvaluationLocalMode({ mode = 'fake', provider = null, providerKind = null } = {}) {
  const normalizedMode = String(mode).toLowerCase()
  const normalizedKind = String(providerKind ?? provider?.kind ?? provider?.mode ?? '').toLowerCase()
  if (normalizedMode === 'real' || normalizedMode === 'provider' || normalizedKind === 'real' || provider?.real === true)
    throw new Error('agent evaluation real provider execution is not authorized by the foundation')
  return Object.freeze({ mode: normalizedMode, provider_kind: normalizedKind || 'fake', real_provider: false })
}

function runKey(run) {
  return `${String(run.case)}:${String(run.arm)}:${String(run.repetition)}`
}

function plannedRuns(plan) {
  return (plan.cases ?? []).flatMap(entry => [
    ...Array.from({ length: entry.candidate_repetitions ?? 0 }, (_, index) => ({ case: entry.id, arm: 'candidate', repetition: index + 1 })),
    ...Array.from({ length: entry.baseline_repetitions ?? 0 }, (_, index) => ({ case: entry.id, arm: 'baseline', repetition: index + 1 })),
  ])
}

export function aggregateAgentEvaluationRuns({ plan, runs, stopped = null, analysis = null, requireObservedEvidence = false }) {
  if (!plan || !Array.isArray(plan.cases))
    throw new Error('agent evaluation campaign plan must contain cases')
  const planned = plannedRuns(plan)
  const actualRuns = runs ?? []
  const seen = new Set()
  for (const run of actualRuns) {
    const key = runKey(run)
    if (seen.has(key))
      throw new Error(`duplicate campaign run: ${key}`)
    seen.add(key)
    if (requireObservedEvidence && run.disposition === 'verified' && (!run.evidence || run.evidence.length === 0))
      throw new Error(`verified campaign run has no observed evidence: ${key}`)
    if (!planned.some(candidate => runKey(candidate) === key))
      throw new Error(`campaign run is not in immutable plan: ${key}`)
  }
  const coverage = planned.map((run) => {
    const actual = actualRuns.find(candidate => runKey(candidate) === runKey(run))
    if (!actual)
      return { ...run, disposition: 'skipped' }
    const disposition = actual.disposition ?? (actual.unavailable ? 'unavailable' : actual.unverified ? 'unverified' : actual.verdict ? 'verified' : 'unverified')
    if (!COVERAGE_DISPOSITIONS.has(disposition))
      throw new Error(`invalid campaign coverage disposition for ${runKey(run)}: ${disposition}`)
    return { ...run, disposition }
  })
  const skipped = coverage.filter(run => run.disposition === 'skipped')
  const unavailable = coverage.filter(run => run.disposition === 'unavailable')
  const unverified = coverage.filter(run => run.disposition === 'unverified')
  const failed = actualRuns.some(run => ['verified', 'simulated'].includes(run.disposition ?? 'verified') && run.verdict === 'failed')
  const simulated = actualRuns.filter(run => (run.disposition ?? '') === 'simulated')
  const status = stopped ? 'stopped' : failed ? 'failed' : skipped.length > 0 || unavailable.length > 0 || unverified.length > 0 || simulated.length > 0 ? 'incomplete' : 'passed'
  const errors = actualRuns.flatMap(run => Array.isArray(run.errors) ? run.errors : [])
  const omissions = [
    ...skipped.map(run => ({ kind: 'skipped', run: runKey(run) })),
    ...unavailable.map(run => ({ kind: 'unavailable', run: runKey(run) })),
    ...unverified.map(run => ({ kind: 'unverified', run: runKey(run) })),
    ...simulated.map(run => ({ kind: 'simulated', run: runKey(run) })),
  ]
  return { schema_version: AGENT_EVALUATION_SCHEMA_VERSION, verdict: status, execution: { planned: planned.length, executed: actualRuns.length, verified: coverage.filter(run => run.disposition === 'verified').length, skipped: skipped.length, unavailable: unavailable.length, unverified: unverified.length, simulated: simulated.length, stopped, planned_runs: planned, coverage, skipped_runs: skipped.map(({ disposition, ...run }) => run), unavailable_runs: unavailable, unverified_runs: unverified }, runs: actualRuns, errors, omissions, analysis }
}

export function buildAgentEvaluationResumePlan({ report, from }) {
  if (!report?.execution || !Array.isArray(report.execution.skipped_runs))
    throw new Error('agent evaluation report has no resumable execution state')
  const index = report.execution.skipped_runs.findIndex(candidate => runKey(candidate) === from)
  if (index < 0)
    throw new Error(`resume point is not skipped: ${from}`)
  return { from, runs: report.execution.skipped_runs.slice(index), retained_runs: report.runs ?? [], original_stopped: report.execution.stopped ?? null }
}

export function renderAgentEvaluationMarkdown(report) {
  const execution = report.execution ?? {}
  const lines = ['# Agent evaluation report', '', `- Verdict: ${report.verdict}`, `- Planned runs: ${execution.planned ?? 0}`, `- Executed runs: ${execution.executed ?? 0}`, `- Skipped runs: ${execution.skipped ?? 0}`, `- Stopped: ${execution.stopped ? runKey(execution.stopped) : 'no'}`, '', '## Findings', '']
  for (const run of report.runs ?? []) {
    lines.push(`### ${runKey(run)}`)
    lines.push(`- Verdict: ${run.verdict ?? 'unknown'}`)
    for (const [dimension, result] of Object.entries(run.score?.dimensions ?? {}))
      lines.push(`- ${dimension}: ${result.status}`)
    for (const finding of run.analysis?.findings ?? [])
      lines.push(`- [${finding.severity}] ${finding.summary} (evidence: ${finding.evidence_ids.join(', ')})`)
    lines.push('')
  }
  if ((execution.skipped_runs ?? []).length > 0) {
    lines.push('## Skipped / unverified', '')
    for (const run of execution.skipped_runs)
      lines.push(`- ${runKey(run)}`)
    lines.push('')
  }
  lines.push('AI analysis is advisory for semantic interpretation; deterministic hard-boundary findings remain authoritative.')
  return `${lines.join('\n')}\n`
}
