#!/usr/bin/env node

import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { isAbsolute, join, resolve } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { buildReleaseProviderComparisonPlan } from './release-provider-comparison.mjs'

const scriptPath = fileURLToPath(import.meta.url)
const VERSION_PATTERN = /^\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?(?:\+[0-9A-Za-z.-]+)?$/u
const TAG_PATTERN = /^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/u
const REQUIRED_DIMENSIONS = ['compliance', 'boundary', 'task_result']

function parseRoot(argv) {
  let root = process.cwd()
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument !== '--root')
      throw new Error(`unknown argument: ${argument}`)
    const value = argv[index + 1]
    if (!value || value.startsWith('--'))
      throw new Error('--root requires a path')
    root = isAbsolute(value) ? value : resolve(process.cwd(), value)
    index += 1
  }
  return root
}

function readTargetTag(root) {
  const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  if (typeof packageJson.version !== 'string' || !VERSION_PATTERN.test(packageJson.version))
    throw new Error('package.json version must be an explicit semantic version')
  return `v${packageJson.version}`
}

export function previousReleaseTag(root, targetTag) {
  const output = execFileSync(
    'git',
    ['-C', root, 'tag', '--merged', 'HEAD', '--list', 'v*', '--sort=-version:refname'],
    { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] },
  )
  return output.split('\n').map(value => value.trim()).find(tag => TAG_PATTERN.test(tag) && tag !== targetTag) ?? null
}

function sameIdentity(left, right) {
  return typeof left === 'string' && left === right
}

function hasCompleteRuns(report, plan) {
  if (!Array.isArray(report.runs) || report.runs.length !== plan.repetitions * 2)
    return false
  const expected = new Set()
  for (let repetition = 1; repetition <= plan.repetitions; repetition += 1) {
    expected.add(`baseline:${repetition}`)
    expected.add(`candidate:${repetition}`)
  }
  for (const run of report.runs) {
    const key = `${run.arm}:${run.repetition}`
    if (!expected.delete(key) || run.outcome !== 'passed')
      return false
    const composition = run.arm === 'baseline'
      ? plan.baseline.composition.hash
      : plan.candidate.composition.hash
    if (!sameIdentity(run.compositionSha256, composition)
      || !sameIdentity(run.contractSha256, plan.identities.contractSha256)
      || REQUIRED_DIMENSIONS.some(name => run.dimensions?.[name]?.status !== 'passed')) {
      return false
    }
  }
  return expected.size === 0
}

function reportMatchesPlan(report, plan) {
  return report?.verdict === 'passed'
    && report.execution === 'serial-paired'
    && report.repetitions === plan.repetitions
    && report.correctness?.passed === true
    && Array.isArray(report.identities?.issues)
    && report.identities.issues.length === 0
    && report.identities.baseline?.ref === plan.baseline.ref
    && report.identities.baseline?.commit === plan.baseline.commit
    && sameIdentity(report.identities.baseline?.composition?.hash, plan.baseline.composition.hash)
    && sameIdentity(report.identities.candidate?.composition?.hash, plan.candidate.composition.hash)
    && sameIdentity(report.identities.contractSha256, plan.identities.contractSha256)
    && sameIdentity(report.identities.fixtureSha256, plan.identities.fixtureSha256)
    && sameIdentity(report.identities.harnessSha256, plan.identities.harnessSha256)
    && hasCompleteRuns(report, plan)
}

export function assessReleaseProviderEvidence(plan, reports) {
  if (plan.baseline.composition.hash === plan.candidate.composition.hash) {
    return {
      state: 'not-required',
      baselineRef: plan.baseline.ref,
      compositionSha256: plan.candidate.composition.hash,
    }
  }
  const matching = reports.find(entry => reportMatchesPlan(entry.report, plan))
  if (!matching) {
    return {
      state: 'missing',
      baselineRef: plan.baseline.ref,
      compositionSha256: plan.candidate.composition.hash,
    }
  }
  return {
    state: 'reused',
    baselineRef: plan.baseline.ref,
    reportPath: matching.path,
    repetitions: matching.report.repetitions,
    compositionSha256: plan.candidate.composition.hash,
  }
}

export function loadReleaseProviderReports(root) {
  const reportsRoot = join(root, '.cache', 'release-provider-comparison')
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

export function checkReleaseProviderEvidence(root) {
  const targetTag = readTargetTag(root)
  const baselineRef = previousReleaseTag(root, targetTag)
  if (!baselineRef)
    return { state: 'not-required', baselineRef: null, compositionSha256: null }
  const plan = buildReleaseProviderComparisonPlan(root, { baselineRef, repetitions: 3 })
  return assessReleaseProviderEvidence(plan, loadReleaseProviderReports(root))
}

function main() {
  try {
    const result = checkReleaseProviderEvidence(parseRoot(process.argv.slice(2)))
    if (result.state === 'missing') {
      throw new Error(`matching provider comparison evidence is missing or stale for ${result.baselineRef}; run release:provider-compare explicitly before retrying (candidate check never invokes a provider)`)
    }
    if (result.state === 'reused') {
      console.log(`Release provider evidence check passed: reused ${result.repetitions}/3 paired comparison evidence from ${result.reportPath}.`)
      return
    }
    const baseline = result.baselineRef ? ` against ${result.baselineRef}` : ''
    console.log(`Release provider evidence check passed: compared Skill composition is unchanged${baseline}; provider comparison is not required.`)
  }
  catch (error) {
    console.error(`Release provider evidence check failed: ${error.message}`)
    process.exitCode = 1
  }
}

if (process.argv[1] && resolve(process.argv[1]) === scriptPath)
  main()
