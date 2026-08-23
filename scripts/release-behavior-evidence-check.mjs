#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { isAbsolute, join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { buildReleaseBehaviorPlan } from './release-behavior-acceptance.mjs'
import { previousReleaseTag } from './release-provider-evidence-check.mjs'

const scriptPath = fileURLToPath(import.meta.url)
const VERSION_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/u

function parseRoot(argv) {
  let root = process.cwd()
  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] !== '--root')
      throw new Error(`unknown argument: ${argv[index]}`)
    const value = argv[index + 1]
    if (!value || value.startsWith('--'))
      throw new Error('--root requires a path')
    root = isAbsolute(value) ? value : resolve(process.cwd(), value)
    index += 1
  }
  return root
}

function targetTag(root) {
  const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  if (typeof packageJson.version !== 'string' || !VERSION_PATTERN.test(packageJson.version))
    throw new Error('package.json version must be an explicit semantic version')
  return `v${packageJson.version}`
}

function hasAbsoluteMachinePath(value, root) {
  const serialized = JSON.stringify(value)
  return serialized.includes(root) || /\/(?:Users|home|tmp)\//u.test(serialized)
}

function candidateRunsPassed(reportCase, planCase) {
  const runs = reportCase.runs?.filter(run => run.arm === 'candidate') ?? []
  if (runs.length !== planCase.candidateRepetitions)
    return false
  const repetitions = new Set()
  for (const run of runs) {
    if (!Number.isInteger(run.repetition) || run.repetition < 1 || run.repetition > planCase.candidateRepetitions || repetitions.has(run.repetition))
      return false
    repetitions.add(run.repetition)
    if (run.classification !== 'eligible' || run.outcome !== 'passed'
      || run.compositionSha256 !== planCase.identities.candidateCompositionSha256
      || run.contractSha256 !== planCase.identities.contractSha256) {
      return false
    }
    const dimensions = Object.values(run.dimensions ?? {})
    if (dimensions.length === 0 || dimensions.some(dimension => !['passed', 'not-applicable'].includes(dimension.status)))
      return false
  }
  return true
}

function reportCaseMatches(root, entry, plan, planCase) {
  const report = entry.report
  const reportCase = report.scenarios?.find(scenario => scenario.id === planCase.id)
  const reportPlanCase = report.plan?.cases?.find(scenario => scenario.id === planCase.id)
  return report?.schemaVersion === 1
    && report.evidenceMode === 'fresh-provider'
    && report.sanitized === true
    && report.verdict === 'passed'
    && report.plan?.execution === 'serial-fail-fast'
    && report.plan?.baseline?.ref === plan.baseline.ref
    && report.plan?.baseline?.commit === plan.baseline.commit
    && typeof report.plan?.settings?.model === 'string'
    && typeof report.plan?.settings?.effort === 'string'
    && typeof report.plan?.settings?.provider === 'string'
    && reportPlanCase?.candidateRepetitions === planCase.candidateRepetitions
    && reportPlanCase?.baselineRepetitions === planCase.baselineRepetitions
    && reportPlanCase?.identities?.candidateCompositionSha256 === planCase.identities.candidateCompositionSha256
    && reportPlanCase?.identities?.baselineCompositionSha256 === planCase.identities.baselineCompositionSha256
    && reportPlanCase?.identities?.contractSha256 === planCase.identities.contractSha256
    && reportPlanCase?.identities?.fixtureSha256 === planCase.identities.fixtureSha256
    && reportPlanCase?.identities?.harnessSha256 === planCase.identities.harnessSha256
    && !hasAbsoluteMachinePath(report, root)
    && candidateRunsPassed(reportCase ?? {}, planCase)
}

export function assessReleaseBehaviorEvidence(root, plan, reports) {
  const requiredCases = plan.cases.filter(entry => entry.identities.baselineCompositionSha256 !== entry.identities.candidateCompositionSha256)
  if (requiredCases.length === 0)
    return { state: 'not-required', baselineRef: plan.baseline.ref, missingCases: [] }
  const matches = []
  const missingCases = []
  let settings = null
  for (const planCase of requiredCases) {
    const matching = reports.find(entry => reportCaseMatches(root, entry, plan, planCase)
      && (!settings || JSON.stringify(entry.report.plan.settings) === JSON.stringify(settings)))
    if (!matching) {
      missingCases.push(planCase.id)
      continue
    }
    settings ??= matching.report.plan.settings
    matches.push({ case: planCase.id, reportPath: matching.path })
  }
  if (missingCases.length > 0)
    return { state: 'missing', baselineRef: plan.baseline.ref, missingCases, settings }
  return { state: 'reused', baselineRef: plan.baseline.ref, reports: matches, settings }
}

export function loadReleaseBehaviorReports(root) {
  const reportsRoot = join(root, '.cache', 'release-behavior-acceptance')
  if (!existsSync(reportsRoot))
    return []
  return readdirSync(reportsRoot, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => join(reportsRoot, entry.name, 'report.json'))
    .filter(existsSync)
    .sort()
    .reverse()
    .flatMap((path) => {
      try {
        return [{ path, report: JSON.parse(readFileSync(path, 'utf8')) }]
      }
      catch {
        return []
      }
    })
}

export function checkReleaseBehaviorEvidence(root) {
  const baselineRef = previousReleaseTag(root, targetTag(root))
  if (!baselineRef)
    return { state: 'not-required', baselineRef: null, missingCases: [] }
  const plan = buildReleaseBehaviorPlan(root, { baselineRef })
  return assessReleaseBehaviorEvidence(root, plan, loadReleaseBehaviorReports(root))
}

function main() {
  try {
    const result = checkReleaseBehaviorEvidence(parseRoot(process.argv.slice(2)))
    if (result.state === 'missing')
      throw new Error(`matching release behavior evidence is missing or stale for ${result.baselineRef} (missing: ${result.missingCases.join(', ')}); run release:behavior-check -- --case <missing-case> with the same explicit model, effort, and provider (candidate check never invokes a provider)`)
    if (result.state === 'reused') {
      console.log(`Release behavior evidence check passed: reused ${result.reports.length} scenario reports for ${result.settings.model}/${result.settings.effort}/${result.settings.provider}.`)
      return
    }
    console.log('Release behavior evidence check passed: compared Skill compositions are unchanged; provider behavior evidence is not required.')
  }
  catch (error) {
    console.error(`Release behavior evidence check failed: ${error.message}`)
    process.exitCode = 1
  }
}

if (process.argv[1] && resolve(process.argv[1]) === scriptPath)
  main()
