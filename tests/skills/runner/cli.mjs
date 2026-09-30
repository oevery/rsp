#!/usr/bin/env node
import { randomUUID } from 'node:crypto'
import { mkdirSync, readFileSync, rmSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { createNativeOpenCodexAdapter, createOpenCodexAdapter } from './adapters/opencodex.mjs'
import { discoverCases, resolveCase } from './core/cases.mjs'
import { loadConfig } from './core/config.mjs'
import { prepareWorkspace, runCase, sourceIdentity } from './core/execute.mjs'
import { hash, writeJson } from './core/files.mjs'
import { reviewPacket } from './core/review.mjs'
import { loadTaskOracle } from './graders/task-result.mjs'
import { compositionIdentity } from './observers/workspace.mjs'

const root = process.cwd()
function options(args) {
  const result = {}
  const valued = new Set(['case', 'suite', 'config-file', 'auth-file', 'codex-bin', 'max-sessions', 'timeout-ms', 'output-root', 'composition'])
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--')
      continue
    const key = args[i].slice(2)
    if (args[i] === '--allow-live')
      result[key] = true
    else if (args[i].startsWith('--') && valued.has(key) && args[i + 1] && !args[i + 1].startsWith('--'))
      result[key] = args[++i]
    else throw new Error('Unknown or incomplete option')
  }
  return result
}
function select(opts) {
  const cases = discoverCases(root)
  if (opts.case && opts.suite)
    throw new Error('Select a case list or a suite, not both')
  if (opts.case) {
    const ids = opts.case.split(',')
    if (new Set(ids).size !== ids.length)
      throw new Error('Duplicate cases')
    return ids.map((id) => {
      const entry = cases.find(c => c.id === id)
      if (!entry)
        throw new Error('Unknown case')
      return entry
    })
  }
  const name = opts.suite ?? 'smoke'
  if (!/^[a-z0-9-]+$/u.test(name))
    throw new Error('Invalid suite')
  const suite = JSON.parse(readFileSync(join(root, 'tests/skills/suites', `${name}.json`), 'utf8'))
  if (suite.all === true)
    return cases
  if (!Array.isArray(suite.cases) || !suite.cases.length || new Set(suite.cases).size !== suite.cases.length)
    throw new Error('Invalid suite selection')
  return suite.cases.map((id) => {
    const entry = cases.find(c => c.id === id)
    if (!entry)
      throw new Error('Suite references missing case')
    return entry
  })
}
function positive(value, fallback) {
  const n = value === undefined ? fallback : Number(value)
  if (!Number.isInteger(n) || n < 1)
    throw new Error('Expected positive integer')
  return n
}
function print(value) {
  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`)
}
async function main(args) {
  const command = args[0] && !args[0].startsWith('--') ? args.shift() : 'check'
  const opts = options(args)
  const config = loadConfig()
  const entries = select(opts).map(entry => resolveCase(root, entry))
  if (!entries.length)
    throw new Error('Empty selection')
  const selected = entries.map(e => ({ id: e.id, project: e.manifest.project ?? 'empty', kind: e.manifest.kind, skill: e.manifest.skill, inputHash: e.inputHash }))
  if (command === 'list' || command === 'plan') {
    print({ cases: selected, config: { executor: config.executor, judge: config.judge, hash: config.hash }, plannedRootSessions: entries.length * 2, nativeWorkers: 'case-dependent, included in retained host evidence', providerInvocations: 0 })
    return
  }
  if (command === 'check') {
    const checks = []
    for (const entry of entries) {
      let workspace
      try {
        const oracle = await loadTaskOracle(entry)
        const schema = await oracle.check({ case: entry.manifest, directory: entry.directory, root })
        workspace = prepareWorkspace(entry, root)
        const readiness = oracle.readiness ? await oracle.readiness({ workspace, root, case: entry.manifest }) : { status: 'passed', scope: 'project-materialization' }
        checks.push({ id: entry.id, status: schema.status === 'passed' && readiness.status === 'passed' ? 'passed' : 'failed', schema, readiness })
      }
      catch { checks.push({ id: entry.id, status: 'failed', reason: 'schema-or-project-readiness-failed' }) }
      finally {
        if (workspace)
          rmSync(workspace, { recursive: true, force: true })
      }
    }
    const status = checks.every(c => c.status === 'passed') ? 'passed' : 'failed'
    print({ mode: 'offline-readiness', status, checks, providerInvocations: 0, behavioralAcceptance: 'not-run' })
    process.exitCode = status === 'passed' ? 0 : 1
    return
  }
  if (command !== 'run')
    throw new Error('Expected check, list, plan or run')
  if (!opts['allow-live'] || !opts['config-file'] || !opts['max-sessions'])
    throw new Error('Live run requires permission, private overlay and explicit root-session budget')
  const maxSessions = positive(opts['max-sessions'])
  if (maxSessions < entries.length * 2)
    throw new Error('Budget must cover tasks and independent reviews')
  const timeoutMs = positive(opts['timeout-ms'], 600000)
  const outputRoot = join(resolve(opts['output-root'] ?? 'tests/skills/reports'), randomUUID())
  mkdirSync(outputRoot, { recursive: true, mode: 0o700 })
  const reportPath = join(outputRoot, 'matrix.json')
  const sourceHash = sourceIdentity(root)
  const composition = resolve(opts.composition ?? 'skills')
  const frozenComposition = compositionIdentity(composition)
  const report = { schema: 'skill-matrix-v1', lane: 'model', status: 'inconclusive', complete: false, composition: frozenComposition, config: { executor: config.executor, judge: config.judge, hash: config.hash }, selected, runs: [], rootSessions: 0 }
  const save = () => writeJson(reportPath, report)
  save()
  try {
    const common = { configFile: opts['config-file'], authFile: opts['auth-file'], codexBin: opts['codex-bin'] }
    const judge = createOpenCodexAdapter({ ...common, role: 'judge' })
    for (const entry of entries) {
      if (loadConfig().hash !== config.hash)
        throw new Error('Shared configuration changed during matrix execution')
      const factory = entry.manifest.native ? createNativeOpenCodexAdapter : createOpenCodexAdapter
      const adapter = factory({ ...common, role: 'executor' })
      report.rootSessions++
      save()
      const run = await runCase(entry, root, { adapter, composition, compositionHash: frozenComposition.hash, outputRoot, timeoutMs, sourceHash })
      const item = { case: entry.id, run: join(run.reportDirectory, 'run.json'), runHash: hash(readFileSync(join(run.reportDirectory, 'run.json'))), mechanical: run.verdict, status: run.verdict.status === 'failed' ? 'failed' : 'inconclusive' }
      report.runs.push(item)
      save()
      if (run.verdict.status !== 'passed')
        break
      report.rootSessions++
      save()
      const review = await reviewPacket(run.packet, { adapter: judge, outputRoot, timeoutMs, formatRetries: 0 })
      item.review = review.reportPath
      item.reviewHash = hash(readFileSync(review.reportPath))
      item.status = review.status
      save()
      if (item.status !== 'passed')
        break
    }
    report.complete = report.runs.length === entries.length && report.runs.every(r => r.review || r.status === 'failed')
    report.status = report.runs.some(r => r.status === 'failed') ? 'failed' : report.complete && report.runs.every(r => r.status === 'passed') ? 'passed' : 'inconclusive'
  }
  catch { report.reason = 'execution-or-review-unavailable' }
  finally { save() }
  print({ report: reportPath, status: report.status, complete: report.complete, rootSessions: report.rootSessions })
  process.exitCode = report.status === 'passed' ? 0 : 1
}
main(process.argv.slice(2).filter(arg => arg !== '--')).catch((error) => {
  process.stderr.write(error.code === 'PROJECT_UNAVAILABLE' ? `${error.message}\n` : 'Skill validation failed. Check selection, project readiness, private inputs and explicit live permission.\n')
  process.exitCode = 2
})
