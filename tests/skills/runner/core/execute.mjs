import { randomUUID } from 'node:crypto'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { isAbsolute, join, relative } from 'node:path'
import { setImmediate } from 'node:timers/promises'
import { cancellationReason, runProcess } from '../adapters/process.mjs'
import { gradeEvidence } from '../graders/evidence.mjs'
import { observeProjectChecks } from '../observers/checks.mjs'
import { observeEvents } from '../observers/events.mjs'
import { compositionIdentity, prepareWorkspace, retainWorkspace, workspaceObservation } from '../observers/workspace.mjs'
import { loadConfig } from './config.mjs'
import { hash, treeFiles, writeJson } from './files.mjs'
import { executionIdentity, gradingIdentity } from './identity.mjs'
import { projectIdentity } from './projects.mjs'
import { streamLines } from './streams.mjs'

export { prepareWorkspace, workspaceObservation } from '../observers/workspace.mjs'

// Only the programmatic engine test seam accepts a command. The live CLI always
// constructs the fixed OpenCodex adapter and marks local results ineligible.
export function createLocalAdapter(command, args = []) {
  return {
    id: 'local-test',
    settings: { provider: 'local-test', model: 'none', effort: 'none' },
    async run({ workspace, prompt, signal, onActivity }) {
      return runProcess(command, args, { cwd: workspace, env: { PATH: process.env.PATH, HOME: workspace }, input: prompt, signal, onActivity })
    },
  }
}

export function harnessIdentity(root) {
  return hash(treeFiles(join(root, 'tests/skills/runner'), { rejectLinks: true }))
}

export function sourceIdentity(root) {
  return hash({
    trees: Object.fromEntries(['src', 'bin', 'rules', 'skills', 'dist'].map(name => [name, treeFiles(join(root, name), { rejectLinks: true })])),
    build: Object.fromEntries(['tsup.config.ts', 'tsconfig.json'].map(name => [name, hash(readFileSync(join(root, name)))])),
    package: hash(readFileSync(join(root, 'package.json'))),
    lock: hash(readFileSync(join(root, 'pnpm-lock.yaml'))),
  })
}

export async function runCase(entry, root, options = {}) {
  if (options.timeoutMs != null)
    throw new Error('Model total deadlines are not supported')
  const timeoutMs = null
  const adapter = options.adapter ?? (options.command ? createLocalAdapter(options.command, options.args) : null)
  if (!adapter)
    throw new Error('An explicit evaluation adapter is required')
  if (entry.manifest.native && adapter.id !== 'opencodex-native-v1' && adapter.id !== 'local-test')
    throw new Error('Native worker cases require the native adapter')
  const composition = compositionIdentity(options.composition)
  const expectedCompositionHash = options.compositionHash ?? composition.hash
  const inputHash = hash({ case: treeFiles(entry.directory, { rejectLinks: true }), project: projectIdentity(root, entry.manifest.project) })
  if (entry.inputHash && entry.inputHash !== inputHash)
    throw new Error('Case changed after selection')
  const id = randomUUID()
  const outputRoot = join(options.outputRoot ?? join(root, 'tests/skills/reports'), id)
  mkdirSync(outputRoot, { recursive: true, mode: 0o700 })
  const identity = {
    schema: 'evaluation-run-v2',
    sourceHash: sourceIdentity(root),
    caseSpecHash: hash(entry.manifest),
    adapter: adapter.id,
    executor: adapter.settings,
    promptHash: hash(entry.manifest.prompt),
    caseHash: inputHash,
    project: entry.project ?? null,
    compositionHash: composition.hash,
    skills: composition.skills,
    harnessHash: harnessIdentity(root),
    executionHash: executionIdentity(root),
    sharedConfigHash: loadConfig(join(root, 'tests/skills/config.toml')).hash,
    gradingHash: gradingIdentity(root),
    visibility: entry.visibility ?? 'public',
  }
  let workspace
  let stage = 'workspace'
  const activity = phase => options.onActivity?.({ phase, state: 'observing' })
  activity(stage)
  let run = { id, lane: adapter.id === 'local-test' ? 'local-control' : 'model', case: entry.manifest.id, skill: entry.manifest.skill, caseSpec: structuredClone(entry.manifest), context: {}, identity, timeoutMs, cancelled: false, cancellationReason: null, reportDirectory: outputRoot }
  const redact = adapter.redact ?? (value => value)
  try {
    stage = 'composition'
    activity(stage)
    if (composition.hash !== expectedCompositionHash)
      throw new Error('Composition changed after selection')
    stage = 'workspace'
    activity(stage)
    if (options.sourceHash && identity.sourceHash !== options.sourceHash)
      throw new Error('Source or built CLI changed after selection')
    workspace = prepareWorkspace(entry, root, options.composition)
    run.context.workspace = workspace
    const baseline = workspaceObservation(workspace)
    try {
      run.retainedEvidence = { baseline: retainWorkspace(workspace, join(outputRoot, 'baseline'), redact, entry.manifest.hard.allowed_paths) }
    }
    catch { run.retainedEvidence = { baseline: { error: 'baseline-retention-incomplete' } } }
    identity.dependencies = { lockHash: hash(readFileSync(join(root, 'pnpm-lock.yaml'))), contentHash: hash(Object.fromEntries(Object.entries(baseline.files).filter(([path]) => path.includes('node_modules/')))) }
    identity.fixtureHash = hash(Object.fromEntries(Object.entries(baseline.files).filter(([path]) => !path.startsWith('.agents/skills/'))))
    if (baseline.skillTreeHash !== expectedCompositionHash)
      throw new Error('Installed composition does not match frozen source')
    if (sourceIdentity(root) !== identity.sourceHash)
      throw new Error('Source or built CLI changed during workspace preparation')
    stage = 'adapter'
    activity(stage)
    await setImmediate()
    const result = options.signal?.aborted
      ? { exitCode: null, stdout: '', stderr: '', finalOutput: null, timedOut: false, timeoutMs, cancelled: true, cancellationReason: cancellationReason(options.signal), durationMs: 0 }
      : await adapter.run({ workspace, prompt: entry.manifest.prompt, outputRoot, signal: options.signal, writableGit: entry.manifest.hard.commit !== undefined, onActivity: options.onActivity })
    run.result = result
    if (options.signal?.aborted) {
      result.cancelled = true
      result.cancellationReason = cancellationReason(options.signal)
    }
    stage = 'observation'
    activity(stage)
    if (sourceIdentity(root) !== identity.sourceHash)
      throw new Error('Source or built CLI changed during execution')
    const events = observeEvents(streamLines(result, 'stdout', outputRoot))
    if (result.native) {
      events.native = result.native
      events.usage = result.native.usage
    }
    events.writes = events.writes.map(path => isAbsolute(path) ? relative(workspace, path) : path)
    result.finalOutput ??= events.finalOutput
    const observation = workspaceObservation(workspace, baseline, entry.manifest.hard.allowed_paths)
    observation.checks = observeProjectChecks(root, workspace, entry.manifest)
    Object.assign(run, { observation, events })
    await setImmediate()
    if (options.signal?.aborted) {
      result.cancelled = true
      result.cancellationReason = cancellationReason(options.signal)
    }
    stage = 'oracle'
    activity(stage)
    const graded = await gradeEvidence(entry, { ...run, result, observation, events })
    run = { ...run, result, observation, events, ...graded, semantic: { status: 'inconclusive', reason: 'independent review pending' } }
  }
  catch {
    run.verdict = { status: 'inconclusive', category: stage === 'adapter' ? 'infrastructure' : 'harness', reason: `${stage}-failed` }
  }
  finally {
    if (workspace) {
      try {
        run.retainedEvidence ??= {}
        run.retainedEvidence.workspace = retainWorkspace(workspace, join(outputRoot, 'workspace'), redact, entry.manifest.hard.allowed_paths)
      }
      catch {
        run.retainedEvidence = { ...run.retainedEvidence, error: 'workspace-retention-incomplete' }
      }
      finally { rmSync(workspace, { recursive: true, force: true, maxRetries: 3 }) }
    }
  }
  await setImmediate()
  if (options.signal?.aborted || run.result?.cancelled) {
    run.cancelled = true
    run.cancellationReason = options.signal?.aborted ? cancellationReason(options.signal) : run.result.cancellationReason ?? 'cancelled'
    if (run.result)
      Object.assign(run.result, { cancelled: true, cancellationReason: run.cancellationReason })
    run.verdict = { status: 'inconclusive', category: 'infrastructure', reason: 'execution-cancelled' }
  }
  // Apply redaction to every persisted evidence surface, not just stdout.
  function sanitize(value) {
    if (typeof value === 'string')
      return redact(value)
    if (Array.isArray(value))
      return value.map(sanitize)
    if (value && typeof value === 'object')
      return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, sanitize(item)]))
    return value
  }
  run = sanitize(run)
  run.evidenceHash = hash({ caseSpec: run.caseSpec, context: run.context, identity: run.identity, result: run.result, observation: run.observation })
  writeJson(join(outputRoot, 'run.json'), run)
  if (!run.result?.stdoutFile)
    writeFileSync(join(outputRoot, 'events.jsonl'), run.result?.stdout ?? '', { mode: 0o600 })
  if (!run.result?.stderrFile)
    writeFileSync(join(outputRoot, 'stderr.log'), run.result?.stderr ?? '', { mode: 0o600 })
  writeFileSync(join(outputRoot, 'final.md'), run.result?.finalOutput ?? '', { mode: 0o600 })
  activity('execution-retained')
  return run
}
