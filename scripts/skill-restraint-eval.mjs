#!/usr/bin/env node

import { execFileSync, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { isAbsolute, join, relative, resolve, sep } from 'node:path'
import { parse as parseYaml } from 'yaml'
import { hashSkillEvaluationValue } from './skill-candidate-evaluation.mjs'

const CASE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u
const VARIANT_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u
const STATUS = new Set(['passed', 'failed'])
const CONSEQUENCE = new Set(['preserved', 'not-applicable'])

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

function exactKeys(value, expected, label) {
  const actual = Object.keys(value).sort()
  const wanted = [...expected].sort()
  if (JSON.stringify(actual) !== JSON.stringify(wanted))
    throw new Error(`${label} must contain exactly: ${wanted.join(', ')}`)
}

function assertContained(parent, child, label) {
  const base = resolve(parent)
  const target = resolve(child)
  if (target !== base && !target.startsWith(`${base}${sep}`))
    throw new Error(`unsafe ${label}: ${relative(base, target)}`)
}

function assertRelativePath(path, label) {
  if (typeof path !== 'string' || path.length === 0 || isAbsolute(path))
    throw new Error(`invalid ${label}: ${String(path)}`)
  const probe = resolve('/fixture')
  const target = resolve(probe, path)
  assertContained(probe, target, label)
  if (target === probe)
    throw new Error(`invalid ${label}: ${path}`)
}

function assertNoSymlinkPath(root, target, label) {
  let current = root
  for (const segment of relative(root, target).split(sep)) {
    current = join(current, segment)
    if (existsSync(current) && lstatSync(current).isSymbolicLink())
      throw new Error(`unsafe ${label}: symlink path component ${relative(root, current)}`)
  }
}

function fixtureRoot(root) {
  return join(root, 'test', 'skill-restraint-eval', 'fixtures')
}

function validatePathList(value, label) {
  if (!Array.isArray(value))
    throw new Error(`${label} must be an array`)
  for (const path of value)
    assertRelativePath(path, label)
  return value
}

function validateCase(value, id) {
  if (!isObject(value) || value.id !== id || typeof value.request !== 'string')
    throw new Error(`invalid restraint fixture manifest: ${id}`)
  if (!isObject(value.source)
    || value.source.class !== 'real-world-derived'
    || value.source.project !== 'boats-cloud'
    || value.source.sanitization !== 'independent-reimplementation') {
    throw new Error(`invalid real-project provenance: ${id}`)
  }
  if (!Array.isArray(value.command) || value.command.length === 0 || value.command.some(item => typeof item !== 'string'))
    throw new Error(`invalid fixture command: ${id}`)
  if (!isObject(value.acceptance) || !isObject(value.acceptance.adjudication))
    throw new Error(`invalid fixture acceptance: ${id}`)
  validatePathList(value.acceptance.changed_paths, `${id} changed_paths`)
  validatePathList(value.acceptance.required_paths, `${id} required_paths`)
  validatePathList(value.acceptance.forbidden_paths, `${id} forbidden_paths`)
  if (!Array.isArray(value.acceptance.content))
    throw new Error(`invalid content checks: ${id}`)
  for (const check of value.acceptance.content) {
    if (!isObject(check))
      throw new Error(`invalid content check: ${id}`)
    assertRelativePath(check.path, `${id} content path`)
    for (const field of ['contains', 'absent']) {
      if (!Array.isArray(check[field]) || check[field].some(item => typeof item !== 'string'))
        throw new Error(`invalid ${field} content check: ${id}`)
    }
  }
  const expected = value.acceptance.adjudication
  exactKeys(expected, ['decision', 'independent_consequences', 'restraint', 'trigger'], `${id} adjudication acceptance`)
  if (typeof expected.decision !== 'string'
    || !STATUS.has(expected.restraint)
    || !STATUS.has(expected.trigger)
    || !CONSEQUENCE.has(expected.independent_consequences)) {
    throw new Error(`invalid adjudication acceptance values: ${id}`)
  }
  if (!isObject(value.variants) || Object.keys(value.variants).length < 2)
    throw new Error(`fixture must define at least two variants: ${id}`)
  for (const [variant, config] of Object.entries(value.variants)) {
    if (!VARIANT_ID.test(variant) || !isObject(config))
      throw new Error(`invalid fixture variant: ${id}/${variant}`)
    validatePathList(config.remove ?? [], `${id}/${variant} remove`)
  }
  return value
}

export function loadSkillRestraintCase(root, id) {
  if (!CASE_ID.test(id))
    throw new Error(`invalid restraint fixture id: ${id}`)
  const fixtures = fixtureRoot(root)
  const directory = join(fixtures, id)
  assertContained(fixtures, directory, 'fixture path')
  const path = join(directory, 'case.yaml')
  if (!existsSync(path))
    throw new Error(`unknown restraint fixture: ${id}`)
  const value = validateCase(parseYaml(readFileSync(path, 'utf8')), id)
  const contract = { acceptance: value.acceptance, command: value.command, id: value.id, request: value.request, source: value.source }
  return { contract_sha256: hashSkillEvaluationValue(contract), directory, value }
}

export function listSkillRestraintCases(root) {
  return readdirSync(fixtureRoot(root), { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => loadSkillRestraintCase(root, entry.name).value)
    .sort((left, right) => left.id.localeCompare(right.id, 'en'))
}

function git(workspace, args) {
  return execFileSync('git', args, { cwd: workspace, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
}

function copyDirectory(source, target) {
  if (existsSync(source))
    cpSync(source, target, { recursive: true })
}

export function prepareSkillRestraintCase({ caseId, outputRoot, root, variant }) {
  if (!VARIANT_ID.test(variant))
    throw new Error(`invalid restraint fixture variant: ${variant}`)
  const loaded = loadSkillRestraintCase(root, caseId)
  const config = loaded.value.variants[variant]
  if (!config)
    throw new Error(`unknown restraint fixture variant: ${caseId}/${variant}`)
  const evaluations = resolve(outputRoot ?? join(tmpdir(), 'rsp-skill-restraint-eval'))
  mkdirSync(evaluations, { recursive: true })
  const workspace = mkdtempSync(join(evaluations, `${caseId}-${variant}-`))
  assertContained(evaluations, workspace, 'evaluation workspace')
  copyDirectory(join(loaded.directory, 'base'), workspace)
  git(workspace, ['init', '--quiet'])
  git(workspace, ['config', 'user.name', 'RSP Evaluation'])
  git(workspace, ['config', 'user.email', 'rsp-eval@example.invalid'])
  git(workspace, ['add', '--all'])
  git(workspace, ['commit', '--quiet', '--allow-empty', '-m', 'fixture base'])
  copyDirectory(join(loaded.directory, 'variants', variant), workspace)
  for (const path of config.remove ?? []) {
    const target = resolve(workspace, path)
    assertContained(workspace, target, 'fixture removal')
    assertNoSymlinkPath(workspace, target, 'fixture removal')
    rmSync(target, { force: true, recursive: true })
  }
  return { case: loaded.value, case_id: caseId, contract_sha256: loaded.contract_sha256, variant, workspace }
}

function hashText(value) {
  return createHash('sha256').update(value).digest('hex')
}

export function bindSkillRestraintAdjudication({ caseId, contractSha256, finalOutput, variant, verdict }) {
  if (!isObject(verdict))
    throw new Error('restraint adjudication verdict must be an object')
  exactKeys(verdict, ['decision', 'independent_consequences', 'restraint', 'trigger'], 'restraint adjudication verdict')
  return { case_id: caseId, contract_sha256: contractSha256, final_output_sha256: hashText(finalOutput), variant, verdict }
}

function validateAdjudication(adjudication, prepared, finalOutput) {
  if (!isObject(adjudication))
    throw new Error('restraint adjudication must be an object')
  exactKeys(adjudication, ['case_id', 'contract_sha256', 'final_output_sha256', 'variant', 'verdict'], 'restraint adjudication')
  if (adjudication.case_id !== prepared.case_id || adjudication.variant !== prepared.variant)
    throw new Error('restraint adjudication identity does not match the prepared fixture')
  if (adjudication.contract_sha256 !== prepared.contract_sha256)
    throw new Error('restraint adjudication contract hash does not match the fixture')
  if (adjudication.final_output_sha256 !== hashText(finalOutput))
    throw new Error('restraint adjudication output hash does not match the final output')
  if (!isObject(adjudication.verdict))
    throw new Error('restraint adjudication verdict must be an object')
  exactKeys(adjudication.verdict, ['decision', 'independent_consequences', 'restraint', 'trigger'], 'restraint adjudication verdict')
  if (typeof adjudication.verdict.decision !== 'string'
    || !STATUS.has(adjudication.verdict.restraint)
    || !STATUS.has(adjudication.verdict.trigger)
    || !CONSEQUENCE.has(adjudication.verdict.independent_consequences)) {
    throw new Error('restraint adjudication verdict contains invalid values')
  }
}

function changedPaths(workspace) {
  const tracked = git(workspace, ['diff', '--name-only', 'HEAD']).split(String.fromCharCode(10)).filter(Boolean)
  const untracked = git(workspace, ['ls-files', '--others', '--exclude-standard']).split(String.fromCharCode(10)).filter(Boolean)
  return [...new Set([...tracked, ...untracked])].sort((left, right) => left.localeCompare(right, 'en'))
}

function inspectWorkspace(prepared) {
  const acceptance = prepared.case.acceptance
  const issues = []
  const actualChanged = changedPaths(prepared.workspace)
  const expectedChanged = [...acceptance.changed_paths].sort((left, right) => left.localeCompare(right, 'en'))
  if (JSON.stringify(actualChanged) !== JSON.stringify(expectedChanged))
    issues.push(`changed paths differ: expected ${expectedChanged.join(', ') || 'none'}; received ${actualChanged.join(', ') || 'none'}`)
  for (const path of acceptance.required_paths) {
    const target = resolve(prepared.workspace, path)
    assertContained(prepared.workspace, target, 'required path')
    assertNoSymlinkPath(prepared.workspace, target, 'required path')
    if (!existsSync(target))
      issues.push(`required path missing: ${path}`)
  }
  for (const path of acceptance.forbidden_paths) {
    const target = resolve(prepared.workspace, path)
    assertContained(prepared.workspace, target, 'forbidden path')
    assertNoSymlinkPath(prepared.workspace, target, 'forbidden path')
    if (existsSync(target))
      issues.push(`forbidden path present: ${path}`)
  }
  for (const check of acceptance.content) {
    const target = resolve(prepared.workspace, check.path)
    assertContained(prepared.workspace, target, 'content path')
    assertNoSymlinkPath(prepared.workspace, target, 'content path')
    if (!existsSync(target)) {
      issues.push(`content path missing: ${check.path}`)
      continue
    }
    const body = readFileSync(target, 'utf8')
    for (const text of check.contains) {
      if (!body.includes(text))
        issues.push(`required content missing in ${check.path}: ${text}`)
    }
    for (const text of check.absent) {
      if (body.includes(text))
        issues.push(`forbidden content present in ${check.path}: ${text}`)
    }
  }
  return { actual_changed_paths: actualChanged, issues }
}

function runFixtureCommand(prepared) {
  const [command, ...args] = prepared.case.command
  const result = spawnSync(command, args, { cwd: prepared.workspace, encoding: 'utf8', shell: false, timeout: 10_000 })
  return { exit_code: result.status, passed: result.status === 0 && !result.error, signal: result.signal, stderr: result.stderr, stdout: result.stdout }
}

export function scoreSkillRestraintCase({ adjudication, finalOutput, prepared }) {
  if (typeof finalOutput !== 'string')
    throw new Error('restraint final output must be a string')
  validateAdjudication(adjudication, prepared, finalOutput)
  const workspace = inspectWorkspace(prepared)
  const expected = prepared.case.acceptance.adjudication
  const semanticIssues = []
  for (const field of ['decision', 'independent_consequences', 'restraint', 'trigger']) {
    if (adjudication.verdict[field] !== expected[field])
      semanticIssues.push(`adjudication ${field} differs: expected ${expected[field]}; received ${adjudication.verdict[field]}`)
  }
  const command = runFixtureCommand(prepared)
  const compliancePassed = workspace.issues.length === 0 && semanticIssues.length === 0
  const observation = {
    dimensions: {
      trigger: { status: adjudication.verdict.trigger, evidence: { source: 'hash-bound-adjudication' } },
      compliance: { status: compliancePassed ? 'passed' : 'failed', evidence: { issues: [...workspace.issues, ...semanticIssues] } },
      boundary: { status: workspace.issues.some(issue => issue.startsWith('changed paths differ')) ? 'failed' : 'passed', evidence: { changed_paths: workspace.actual_changed_paths } },
      task_result: { status: command.passed ? 'passed' : 'failed', evidence: { exit_code: command.exit_code, signal: command.signal } },
    },
    measurements: { corrections: null, first_fix_result: null, worker_dispatch_count: null, tool_calls: null, elapsed_ms: null, tokens: { input: null, output: null, total: null } },
    omissions: ['provider execution measurements unavailable'],
  }
  return {
    adjudication_sha256: hashSkillEvaluationValue(adjudication),
    case_id: prepared.case_id,
    command,
    contract_sha256: prepared.contract_sha256,
    observation,
    result: Object.values(observation.dimensions).every(item => item.status === 'passed') ? 'passed' : 'failed',
    variant: prepared.variant,
    workspace,
  }
}
