import { randomUUID } from 'node:crypto'
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { isAbsolute, join, relative } from 'node:path'
import { runProcess } from '../adapters/process.mjs'
import { gradeEvidence } from '../graders/evidence.mjs'
import { createReviewPacket } from '../graders/packet.mjs'
import { observeProjectChecks } from '../observers/checks.mjs'
import { observeEvents } from '../observers/events.mjs'
import { compositionIdentity, prepareWorkspace, workspaceObservation } from '../observers/workspace.mjs'
import { hash, treeFiles, writeJson } from './files.mjs'
import { executionIdentity, gradingIdentity } from './identity.mjs'
import { projectIdentity } from './projects.mjs'

export { prepareWorkspace, workspaceObservation } from '../observers/workspace.mjs'

// Only the programmatic engine test seam accepts a command. The live CLI always
// constructs the fixed OpenCodex adapter and marks local results ineligible.
export function createLocalAdapter(command, args = []) {
  return {
    id: 'local-test',
    settings: { provider: 'local-test', model: 'none', effort: 'none' },
    async run({ workspace, prompt, timeoutMs }) {
      return runProcess(command, args, { cwd: workspace, env: { PATH: process.env.PATH, HOME: workspace }, input: prompt, timeoutMs })
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
    gradingHash: gradingIdentity(root),
    visibility: entry.visibility ?? 'public',
  }
  let workspace
  let stage = 'workspace'
  let run = { id, lane: adapter.id === 'local-test' ? 'local-control' : 'model', case: entry.manifest.id, skill: entry.manifest.skill, caseSpec: structuredClone(entry.manifest), context: {}, identity, reportDirectory: outputRoot }
  const redact = adapter.redact ?? (value => value)
  try {
    stage = 'composition'
    if (composition.hash !== expectedCompositionHash)
      throw new Error('Composition changed after selection')
    stage = 'workspace'
    if (options.sourceHash && identity.sourceHash !== options.sourceHash)
      throw new Error('Source or built CLI changed after selection')
    workspace = prepareWorkspace(entry, root, options.composition)
    run.context.workspace = workspace
    const baseline = workspaceObservation(workspace)
    identity.dependencies = { lockHash: hash(readFileSync(join(root, 'pnpm-lock.yaml'))), contentHash: hash(Object.fromEntries(Object.entries(baseline.files).filter(([path]) => path.includes('node_modules/')))) }
    identity.fixtureHash = hash(Object.fromEntries(Object.entries(baseline.files).filter(([path]) => !path.startsWith('.agents/skills/'))))
    if (baseline.skillTreeHash !== expectedCompositionHash)
      throw new Error('Installed composition does not match frozen source')
    if (sourceIdentity(root) !== identity.sourceHash)
      throw new Error('Source or built CLI changed during workspace preparation')
    stage = 'adapter'
    const result = await adapter.run({ workspace, prompt: entry.manifest.prompt, outputRoot, timeoutMs: options.timeoutMs, writableGit: entry.manifest.hard.commit !== undefined })
    run.result = result
    stage = 'observation'
    if (sourceIdentity(root) !== identity.sourceHash)
      throw new Error('Source or built CLI changed during execution')
    const events = observeEvents(result.stdout)
    if (result.native) {
      events.native = result.native
      events.usage = result.native.usage
    }
    events.writes = events.writes.map(path => isAbsolute(path) ? relative(workspace, path) : path)
    result.finalOutput ??= events.finalOutput
    const observation = workspaceObservation(workspace, baseline, entry.manifest.hard.allowed_paths)
    observation.checks = observeProjectChecks(root, workspace, entry.manifest)
    Object.assign(run, { observation, events })
    stage = 'oracle'
    const graded = await gradeEvidence(entry, { ...run, result, observation, events })
    const rubric = [...entry.manifest.rubric]
    if (entry.manifest.activation && entry.manifest.activation !== 'optional')
      rubric.push({ name: 'routing', description: `Assess whether ${entry.manifest.skill} was appropriately used (${entry.manifest.activation}) from observed actions and task boundaries. Do not require printed Skill text or a particular reading command. Missing evidence remains inconclusive.` })
    const packet = createReviewPacket({ prompt: entry.manifest.prompt, observation, result, rubric, events, workspace, forbiddenActions: entry.manifest.hard.forbidden_actions })
    run = { ...run, result, observation, events, ...graded, packet, semantic: { status: 'inconclusive', reason: 'independent review pending' } }
  }
  catch {
    run.verdict = { status: 'inconclusive', category: stage === 'adapter' ? 'infrastructure' : 'harness', reason: `${stage}-failed` }
  }
  finally {
    if (workspace)
      rmSync(workspace, { recursive: true, force: true, maxRetries: 3 })
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
  if (run.packet) {
    const { packetHash: _oldHash, ...packet } = run.packet
    run.packet = { ...packet, packetHash: hash(packet) }
    writeJson(join(outputRoot, 'review-packet.json'), run.packet)
  }
  run.evidenceHash = hash({ caseSpec: run.caseSpec, context: run.context, identity: run.identity, result: run.result, observation: run.observation })
  writeJson(join(outputRoot, 'run.json'), run)
  writeFileSync(join(outputRoot, 'events.jsonl'), run.result?.stdout ?? '', { mode: 0o600 })
  writeFileSync(join(outputRoot, 'stderr.log'), run.result?.stderr ?? '', { mode: 0o600 })
  writeFileSync(join(outputRoot, 'final.md'), run.result?.finalOutput ?? '', { mode: 0o600 })
  return run
}
