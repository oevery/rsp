#!/usr/bin/env node

import { Buffer } from 'node:buffer'
import { spawn, spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { lstatSync, mkdirSync, readFileSync, readlinkSync, writeFileSync } from 'node:fs'
import { isAbsolute, join, relative, resolve, sep } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { discoverReleaseProjectScenarios } from './release-acceptance-scenarios.mjs'

export const RELEASE_ACCEPTANCE_STEPS = [
  { id: 'skill-security', label: 'Skill security', command: 'pnpm', args: ['run', 'skills:security-check'], coverage: ['security'] },
  { id: 'metadata', label: 'Release metadata', command: 'node', args: ['scripts/release-metadata-check.mjs'], coverage: ['metadata'] },
  { id: 'docs-check', label: 'Documentation contracts', command: 'pnpm', args: ['run', 'docs:check'], coverage: ['documentation'] },
  { id: 'docs-build', label: 'Documentation build', command: 'pnpm', args: ['run', 'docs:build'], coverage: ['documentation-build'] },
  { id: 'build', label: 'CLI build', command: 'pnpm', args: ['run', 'build'], coverage: ['build'] },
  { id: 'typecheck', label: 'TypeScript typecheck', command: 'pnpm', args: ['run', 'typecheck'], coverage: ['typecheck'] },
  { id: 'lint', label: 'Lint', command: 'pnpm', args: ['run', 'lint'], coverage: ['lint'] },
  { id: 'tests', label: 'Complete serial code test suite', command: 'pnpm', args: ['exec', 'vitest', 'run', '--no-file-parallelism'], coverage: ['serial-tests'] },
  { id: 'package', label: 'Packed installed-package workflows', command: 'node', args: ['scripts/clean-install-check.mjs', '--json'], coverage: ['installed-package', 'real-projects'], streamStdout: false },
]

export const RELEASE_ACCEPTANCE_OMISSIONS = [
  'provider-backed old/new token comparison is environment-owned; run release:provider-compare separately with one explicit prior release tag',
  'interactive PTY evidence is environment-owned and is not executed by this deterministic runner',
  'Windows terminal acceptance is not observed on non-Windows hosts',
  'registry, push, tag, hosted release, and publication reconciliation require separate authority',
]

const REQUIRED_STEP_COVERAGE = [
  'build',
  'documentation',
  'documentation-build',
  'installed-package',
  'lint',
  'metadata',
  'real-projects',
  'security',
  'serial-tests',
  'typecheck',
]

function portablePath(path) {
  return path.split(sep).join('/')
}

function parseArguments(argv) {
  const options = { json: false, outputRoot: null, plan: false }
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index]
    if (argument === '--plan') {
      options.plan = true
    }
    else if (argument === '--json') {
      options.json = true
    }
    else if (argument === '--output-root') {
      const value = argv[index + 1]
      if (!value || value.startsWith('--'))
        throw new Error('--output-root requires a path')
      options.outputRoot = value
      index += 1
    }
    else {
      throw new Error(`unknown argument: ${argument}`)
    }
  }
  return options
}

function commandText(step) {
  return [step.command, ...step.args].join(' ')
}

function gitOutput(root, args) {
  const result = spawnSync('git', ['-C', root, ...args], { encoding: 'utf8' })
  return result.status === 0 ? result.stdout.trim() : null
}

function gitBuffer(root, args) {
  const result = spawnSync('git', ['-C', root, ...args], { maxBuffer: 64 * 1024 * 1024 })
  return result.status === 0 ? result.stdout : null
}

function sourceFingerprint(root, commit) {
  if (!commit)
    return null
  const diff = gitBuffer(root, ['diff', '--binary', '--no-ext-diff', 'HEAD', '--', '.'])
  const untrackedOutput = gitBuffer(root, ['ls-files', '--others', '--exclude-standard', '-z'])
  if (!diff || !untrackedOutput)
    return null
  const hash = createHash('sha256')
  hash.update('rsp-release-source-v1\0')
  hash.update(commit)
  hash.update('\0tracked-diff\0')
  hash.update(diff)
  const untrackedPaths = untrackedOutput.toString('utf8').split('\0').filter(Boolean).sort()
  for (const path of untrackedPaths) {
    const absolutePath = resolve(root, path)
    const stats = lstatSync(absolutePath)
    hash.update('\0untracked\0')
    hash.update(portablePath(path))
    hash.update('\0mode\0')
    hash.update(String(stats.mode & 0o777))
    hash.update('\0content\0')
    if (stats.isSymbolicLink())
      hash.update(readlinkSync(absolutePath))
    else
      hash.update(readFileSync(absolutePath))
  }
  return hash.digest('hex')
}

export function computeReleaseSourceIdentity(root) {
  const status = gitOutput(root, ['status', '--porcelain=v1', '--untracked-files=all'])
  const commit = gitOutput(root, ['rev-parse', '--verify', 'HEAD^{commit}'])
  return {
    commit,
    dirty: status === null ? null : status !== '',
    fingerprintSha256: sourceFingerprint(root, commit),
  }
}

export function buildReleaseAcceptancePlan(repositoryRoot) {
  const projectCatalog = discoverReleaseProjectScenarios(repositoryRoot)
  const steps = RELEASE_ACCEPTANCE_STEPS
    .map(step => ({ ...step, args: [...step.args], coverage: [...step.coverage], commandText: commandText(step) }))
  const stepCoverage = [...new Set(steps.flatMap(step => step.coverage))].sort()
  const requiredStepCoverage = [...REQUIRED_STEP_COVERAGE]
  const missingStepCoverage = requiredStepCoverage.filter(tag => !stepCoverage.includes(tag))
  if (missingStepCoverage.length > 0)
    throw new Error(`release acceptance step coverage is missing: ${missingStepCoverage.join(', ')}`)
  return {
    mode: 'release-acceptance',
    execution: 'serial-fail-fast',
    counts: {
      steps: steps.length,
      projectScenarios: projectCatalog.scenarios.length,
      projectCoverageTags: projectCatalog.coverage.length,
    },
    requiredStepCoverage,
    stepCoverage,
    omissions: [...RELEASE_ACCEPTANCE_OMISSIONS],
    steps,
    projects: {
      coverage: projectCatalog.coverage,
      requiredCoverage: projectCatalog.requiredCoverage,
      scenarios: projectCatalog.scenarios.map(({ fixtureRoot: _fixtureRoot, ...scenario }) => scenario),
    },
  }
}

function createRunId(source) {
  const timestamp = new Date().toISOString().replace(/[-:.]/gu, '')
  const commit = source.commit ? source.commit.slice(0, 10) : 'no-git'
  return `${timestamp}-${commit}-${process.pid}`
}

export function createAcceptanceRunDirectory(outputRoot, id) {
  mkdirSync(outputRoot, { recursive: true })
  const directory = join(outputRoot, id)
  mkdirSync(directory)
  mkdirSync(join(directory, 'logs'))
  return directory
}

function parseVitestEvidence(output) {
  const files = output.match(/Test Files\s+(\d+) passed \((\d+)\)/u)
  const tests = output.match(/Tests\s+(\d+) passed \((\d+)\)/u)
  return files && tests
    ? { testFilesPassed: Number(files[1]), testFilesTotal: Number(files[2]), testsPassed: Number(tests[1]), testsTotal: Number(tests[2]) }
    : null
}

function parsePackageEvidence(output) {
  try {
    const parsed = JSON.parse(output.trim())
    return {
      package: parsed.package,
      projectCoverage: parsed.projectCoverage,
      projectScenarios: parsed.projectScenarios,
      tarballSha256: parsed.tarballSha256,
    }
  }
  catch {
    return null
  }
}

async function executeStep(step, root, logPath) {
  const startedAt = new Date()
  process.stdout.write(`\n→ ${step.label}\n`)
  const stdout = []
  const stderr = []
  const status = await new Promise((resolveStatus) => {
    const executable = step.command === 'node' ? process.execPath : step.command
    const child = spawn(executable, step.args, { cwd: root, env: process.env, stdio: ['ignore', 'pipe', 'pipe'] })
    child.stdout.on('data', (chunk) => {
      stdout.push(chunk)
      if (step.streamStdout !== false)
        process.stdout.write(chunk)
    })
    child.stderr.on('data', (chunk) => {
      stderr.push(chunk)
      process.stderr.write(chunk)
    })
    child.on('error', error => stderr.push(Buffer.from(`${error.message}\n`)))
    child.on('close', code => resolveStatus(code ?? 1))
  })
  const completedAt = new Date()
  const stdoutText = Buffer.concat(stdout).toString('utf8')
  const stderrText = Buffer.concat(stderr).toString('utf8')
  writeFileSync(logPath, `# stdout\n${stdoutText}\n# stderr\n${stderrText}`)
  const result = {
    id: step.id,
    label: step.label,
    command: step.commandText,
    coverage: step.coverage,
    status: status === 0 ? 'passed' : 'failed',
    exitCode: status,
    durationMs: completedAt.getTime() - startedAt.getTime(),
    log: portablePath(relative(root, logPath)),
    evidence: null,
  }
  if (step.id === 'tests')
    result.evidence = parseVitestEvidence(stdoutText)
  if (step.id === 'package')
    result.evidence = parsePackageEvidence(stdoutText)
  process.stdout.write(`${(status === 0 ? '✓ ' : '✗ ') + step.label} (${result.durationMs} ms)\n`)
  return result
}

export function renderReleaseAcceptanceMarkdown(report) {
  const code = String.fromCharCode(96)
  const lines = [
    '# Release Acceptance Report',
    '',
    `- Verdict: **${report.verdict}**`,
    `- Mode: ${code}${report.plan.mode}${code}`,
    `- Run: ${code}${report.id}${code}`,
    `- Package: ${code}${report.package.name}@${report.package.version}${code}`,
    `- Source commit: ${code}${report.source.commit ?? 'unavailable'}${code}`,
    `- Dirty source: ${code}${String(report.source.dirty)}${code}`,
    `- Source fingerprint: ${code}${report.source.fingerprintSha256 ?? 'unavailable'}${code}`,
    `- Started: ${report.startedAt}`,
    `- Completed: ${report.completedAt}`,
    '',
    '## Dynamic discovery',
    '',
    `- Steps: ${report.plan.counts.steps}`,
    `- Project scenarios: ${report.plan.counts.projectScenarios}`,
    `- Project coverage tags: ${report.plan.counts.projectCoverageTags}`,
    `- Required project coverage: ${report.plan.projects.requiredCoverage.join(', ')}`,
    '',
    '## Steps',
    '',
    '| Step | Status | Duration | Evidence |',
    '| --- | --- | ---: | --- |',
  ]
  for (const step of report.steps) {
    let evidence = 'see log'
    if (step.evidence && step.id === 'tests')
      evidence = `${step.evidence.testFilesPassed}/${step.evidence.testFilesTotal} files; ${step.evidence.testsPassed}/${step.evidence.testsTotal} tests`
    else if (step.evidence && step.id === 'package')
      evidence = `${step.evidence.projectScenarios?.length ?? 0} projects; tarball ${step.evidence.tarballSha256 ?? 'unavailable'}`
    lines.push(`| ${step.label} | ${step.status} | ${step.durationMs} ms | ${evidence} |`)
  }
  lines.push('', '## Project scenarios', '')
  for (const scenario of report.plan.projects.scenarios)
    lines.push(`- ${code}${scenario.id}${code} (${scenario.kind}): ${scenario.coverage.join(', ')}`)
  lines.push('', '## Omissions', '')
  for (const omission of report.omissions)
    lines.push(`- ${omission}`)
  lines.push('', 'Passing this report grants no commit, push, tag, publication, deployment, approval, or human-acceptance authority.', '')
  return lines.join('\n')
}

function writeReport(runDirectory, report) {
  const jsonPath = join(runDirectory, 'report.json')
  const markdownPath = join(runDirectory, 'report.md')
  writeFileSync(jsonPath, `${JSON.stringify(report, null, 2)}\n`)
  writeFileSync(markdownPath, renderReleaseAcceptanceMarkdown(report))
  return { jsonPath, markdownPath }
}

async function main() {
  const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
  const options = parseArguments(process.argv.slice(2))
  const plan = buildReleaseAcceptancePlan(root)
  if (options.plan) {
    if (options.json) {
      process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`)
    }
    else {
      process.stdout.write(`Release acceptance plan: ${plan.counts.steps} serial steps, ${plan.counts.projectScenarios} project scenarios\n`)
      for (const step of plan.steps)
        process.stdout.write(`- ${step.id}: ${step.commandText}\n`)
      for (const scenario of plan.projects.scenarios)
        process.stdout.write(`- project ${scenario.id}: ${scenario.kind} [${scenario.coverage.join(', ')}]\n`)
    }
    return
  }

  const manifest = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  const source = computeReleaseSourceIdentity(root)
  const id = createRunId(source)
  const configuredOutput = options.outputRoot ?? join(root, '.cache', 'release-acceptance')
  const outputRoot = isAbsolute(configuredOutput) ? configuredOutput : resolve(root, configuredOutput)
  const runDirectory = createAcceptanceRunDirectory(outputRoot, id)
  const startedAt = new Date().toISOString()
  const results = []
  for (const step of plan.steps) {
    const result = await executeStep(step, root, join(runDirectory, 'logs', `${step.id}.log`))
    results.push(result)
    if (result.status !== 'passed')
      break
  }
  const failed = results.find(step => step.status === 'failed')
  const report = {
    schemaVersion: 1,
    id,
    verdict: failed ? 'failed' : results.length === plan.steps.length ? 'passed' : 'blocked',
    startedAt,
    completedAt: new Date().toISOString(),
    package: { name: manifest.name, version: manifest.version },
    source,
    environment: { node: process.version, platform: process.platform, arch: process.arch },
    plan,
    steps: results,
    omissions: plan.omissions,
  }
  const paths = writeReport(runDirectory, report)
  process.stdout.write(`\nRelease acceptance ${report.verdict}.\n`)
  process.stdout.write(`Report: ${portablePath(relative(root, paths.markdownPath))}\n`)
  process.stdout.write(`JSON: ${portablePath(relative(root, paths.jsonPath))}\n`)
  if (report.verdict !== 'passed')
    process.exitCode = 1
}

const invokedPath = process.argv[1] ? resolve(process.argv[1]) : null
if (invokedPath === resolve(fileURLToPath(import.meta.url))) {
  main().catch((error) => {
    process.stderr.write(`Release acceptance failed: ${error.message}\n`)
    process.exitCode = 1
  })
}
