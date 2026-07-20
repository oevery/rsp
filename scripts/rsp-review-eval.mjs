#!/usr/bin/env node

import { execFileSync, spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { basename, join, relative, resolve, sep } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { parse as parseYaml } from 'yaml'

const CASE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const PROVIDER_ID = /^[\w-]+$/
const PIPELINE_STATES = new Set(['blocked', 'clean', 'issues_found', 'skipped'])

function assertContained(parent, child, label) {
  const resolvedParent = resolve(parent)
  const resolvedChild = resolve(child)
  if (resolvedChild !== resolvedParent && !resolvedChild.startsWith(`${resolvedParent}${sep}`))
    throw new Error(`Unsafe ${label}: ${relative(resolvedParent, resolvedChild)}`)
}

function fixtureRoot(root) {
  return join(root, 'test', 'skill-behavior', 'fixtures')
}

function readCase(root, id) {
  if (!CASE_ID.test(id))
    throw new Error(`Invalid evaluation case id: ${id}`)

  const fixtures = fixtureRoot(root)
  const directory = join(fixtures, id)
  assertContained(fixtures, directory, 'fixture path')
  const casePath = join(directory, 'case.yaml')
  if (!existsSync(casePath))
    throw new Error(`Unknown evaluation case: ${id}`)

  const value = parseYaml(readFileSync(casePath, 'utf8'))
  if (!value || value.id !== id || !Array.isArray(value.tags) || typeof value.request !== 'string')
    throw new Error(`Invalid evaluation case manifest: ${id}`)
  if (!value.expected || !PIPELINE_STATES.has(value.expected.code) || !PIPELINE_STATES.has(value.expected.document))
    throw new Error(`Invalid pipeline expectations: ${id}`)
  if (!Array.isArray(value.expected.observations) || !Array.isArray(value.expected.prohibited_actions))
    throw new Error(`Invalid evaluation expectations: ${id}`)

  return { directory, value }
}

export function loadEvaluationCases(root) {
  return readdirSync(fixtureRoot(root), { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => readCase(root, entry.name).value)
    .sort((left, right) => left.id.localeCompare(right.id))
}

function git(workspace, args) {
  return execFileSync('git', args, { cwd: workspace, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
}

function hashContent(content) {
  return createHash('sha256').update(content).digest('hex')
}

function hashFile(path) {
  return hashContent(readFileSync(path))
}

function listTreeFiles(directory, current = directory) {
  const paths = []
  for (const entry of readdirSync(current, { withFileTypes: true })) {
    if (entry.name === '.git')
      continue
    const path = join(current, entry.name)
    if (entry.isDirectory())
      paths.push(...listTreeFiles(directory, path))
    else
      paths.push(path)
  }
  return paths.sort()
}

function hashTree(directory) {
  const hash = createHash('sha256')
  for (const path of listTreeFiles(directory)) {
    hash.update(relative(directory, path))
    hash.update('\0')
    hash.update(readFileSync(path))
    hash.update('\0')
  }
  return hash.digest('hex')
}

function executable(codexBin, args) {
  if (codexBin.endsWith('.mjs'))
    return { args: [codexBin, ...args], command: process.execPath }
  return { args, command: codexBin }
}

function commandVersion(codexBin) {
  const invocation = executable(codexBin, ['--version'])
  return execFileSync(invocation.command, invocation.args, { encoding: 'utf8' }).trim()
}

function runCommand({ args, command, cwd, env, input }) {
  return new Promise((resolveRun) => {
    const child = spawn(command, args, { cwd, env, stdio: ['pipe', 'pipe', 'pipe'] })
    let stderr = ''
    let stdout = ''
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', chunk => stdout += chunk)
    child.stderr.on('data', chunk => stderr += chunk)
    child.on('error', error => resolveRun({ code: null, error, stderr, stdout }))
    child.on('close', code => resolveRun({ code, error: null, stderr, stdout }))
    child.stdin.end(input)
  })
}

function summarizeEvents(raw) {
  const byItemType = {}
  const byType = {}
  let toolCalls = 0
  let total = 0
  let usage = null
  const toolTypes = new Set(['command_execution', 'computer_tool_call', 'mcp_tool_call', 'tool_call', 'web_search'])

  for (const line of raw.split('\n').filter(Boolean)) {
    let event
    try {
      event = JSON.parse(line)
    }
    catch {
      continue
    }
    total += 1
    const type = typeof event.type === 'string' ? event.type : 'unknown'
    byType[type] = (byType[type] ?? 0) + 1
    const itemType = typeof event.item?.type === 'string' ? event.item.type : null
    if (itemType) {
      byItemType[itemType] = (byItemType[itemType] ?? 0) + 1
      if (type === 'item.completed' && toolTypes.has(itemType))
        toolCalls += 1
    }
    if (type === 'turn.completed' && event.usage)
      usage = event.usage
  }

  return { events: { by_item_type: byItemType, by_type: byType, tool_calls: toolCalls, total }, usage }
}

export function prepareEvaluation({ caseId, outputRoot, root, variant }) {
  if (variant !== 'baseline' && variant !== 'candidate')
    throw new Error(`Unknown evaluation variant: ${variant}`)

  const { directory, value } = readCase(root, caseId)
  const evaluations = resolve(outputRoot ?? join(root, '.cache', 'rsp-review-eval'))
  mkdirSync(evaluations, { recursive: true })
  const workspace = mkdtempSync(join(evaluations, `${caseId}-${variant}-`))
  assertContained(evaluations, workspace, 'evaluation workspace')

  const base = join(directory, 'base')
  if (existsSync(base))
    cpSync(base, workspace, { recursive: true })

  git(workspace, ['init', '--quiet'])
  git(workspace, ['config', 'user.name', 'RSP Evaluation'])
  git(workspace, ['config', 'user.email', 'rsp-eval@example.invalid'])
  git(workspace, ['add', '--all'])
  git(workspace, ['commit', '--quiet', '--allow-empty', '-m', 'fixture base'])

  const changed = join(directory, 'changed')
  if (existsSync(changed))
    cpSync(changed, workspace, { recursive: true })

  if (variant === 'candidate') {
    const sourceSkill = join(root, 'research', 'candidates', 'skills', 'rsp-review')
    const installedSkill = join(workspace, '.agents', 'skills', 'rsp-review')
    mkdirSync(join(workspace, '.agents', 'skills'), { recursive: true })
    cpSync(sourceSkill, installedSkill, { recursive: true })
  }

  const prompt = [
    variant === 'candidate'
      ? 'Load the rsp-review skill installed in this isolated workspace and follow it exactly.'
      : 'Review this isolated workspace using your normal review behavior; no review skill is installed.',
    'Use HEAD as the immutable comparison point and inspect the current working-tree diff.',
    'Return a report only. Do not edit files, stage, commit, push, publish, delete, or create review artifacts.',
    value.request,
  ].join('\n\n')
  const promptPath = join(evaluations, `${basename(workspace)}.prompt.md`)
  writeFileSync(promptPath, `${prompt}\n`)

  return { case: value, promptPath, variant, workspace }
}

export async function runEvaluation({ caseId, codexBin = 'codex', effort, env = process.env, model, outputRoot, provider, root, variant }) {
  if (!model || !effort)
    throw new Error('Evaluation model and effort are required')
  if (provider && !PROVIDER_ID.test(provider))
    throw new Error(`Invalid evaluation provider: ${provider}`)

  const evaluations = resolve(outputRoot ?? join(root, '.cache', 'rsp-review-eval'))
  const prepared = prepareEvaluation({ caseId, outputRoot: evaluations, root, variant })
  const runId = basename(prepared.workspace)
  const runDirectory = join(evaluations, 'runs', runId)
  mkdirSync(runDirectory, { recursive: true })
  const rawEventsPath = join(runDirectory, 'events.jsonl')
  const finalOutputPath = join(runDirectory, 'final.md')
  const metadataPath = join(runDirectory, 'metadata.json')
  const prompt = readFileSync(prepared.promptPath, 'utf8')
  const candidatePath = join(root, 'research', 'candidates', 'skills', 'rsp-review')
  const fixturesPath = fixtureRoot(root)
  const harnessPath = fileURLToPath(import.meta.url)
  const beforeStatus = git(prepared.workspace, ['status', '--porcelain=v1', '--untracked-files=all'])
  const beforeWorkspace = hashTree(prepared.workspace)
  const cliVersion = commandVersion(codexBin)
  const started = new Date()
  const args = [
    'exec',
    '--ephemeral',
    ...(provider ? ['--config', `model_provider="${provider}"`] : ['--ignore-user-config']),
    '--sandbox',
    'read-only',
    '--model',
    model,
    '--config',
    `model_reasoning_effort="${effort}"`,
    '--json',
    '--output-last-message',
    finalOutputPath,
    '--cd',
    prepared.workspace,
    '-',
  ]
  const invocation = executable(codexBin, args)
  const executed = await runCommand({ ...invocation, cwd: prepared.workspace, env, input: prompt })
  const ended = new Date()
  writeFileSync(rawEventsPath, executed.stdout)
  if (executed.stderr)
    writeFileSync(join(runDirectory, 'stderr.log'), executed.stderr)

  const afterStatus = git(prepared.workspace, ['status', '--porcelain=v1', '--untracked-files=all'])
  const afterWorkspace = hashTree(prepared.workspace)
  const summary = summarizeEvents(executed.stdout)
  const mutated = beforeStatus !== afterStatus || beforeWorkspace !== afterWorkspace
  const result = executed.code === 0 && existsSync(finalOutputPath) && !mutated ? 'passed' : 'failed'
  const metadata = {
    case: prepared.case,
    duration_ms: ended.getTime() - started.getTime(),
    ended_at: ended.toISOString(),
    events: summary.events,
    exit_code: executed.code,
    hashes: {
      after_workspace: afterWorkspace,
      before_workspace: beforeWorkspace,
      candidate: hashTree(candidatePath),
      final_output: existsSync(finalOutputPath) ? hashFile(finalOutputPath) : null,
      fixture: hashTree(fixturesPath),
      harness: hashFile(harnessPath),
      prompt: hashContent(prompt),
    },
    paths: {
      final_output: finalOutputPath,
      metadata: metadataPath,
      raw_events: rawEventsPath,
      workspace: prepared.workspace,
    },
    result,
    settings: {
      cli_version: cliVersion,
      config_source: provider ? 'user' : 'isolated',
      effort,
      model,
      provider: provider ?? null,
      sandbox: 'read-only',
    },
    started_at: started.toISOString(),
    usage: summary.usage,
    variant,
    worktree: {
      after_status: afterStatus,
      before_status: beforeStatus,
      mutated,
    },
  }
  writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`)
  return metadata
}

export async function runEvaluationMatrix({ caseIds, codexBin = 'codex', effort, env = process.env, model, outputRoot, provider, root }) {
  if (!model || !effort)
    throw new Error('Evaluation model and effort are required')
  if (provider && !PROVIDER_ID.test(provider))
    throw new Error(`Invalid evaluation provider: ${provider}`)

  const evaluations = resolve(outputRoot ?? join(root, '.cache', 'rsp-review-eval'))
  mkdirSync(evaluations, { recursive: true })
  const available = new Set(loadEvaluationCases(root).map(item => item.id))
  const selected = caseIds ?? [...available]
  for (const id of selected) {
    if (!available.has(id))
      throw new Error(`Unknown evaluation case: ${id}`)
  }

  const started = new Date()
  const runs = []
  for (const caseId of selected) {
    for (const variant of ['baseline', 'candidate']) {
      runs.push(await runEvaluation({ caseId, codexBin, effort, env, model, outputRoot: evaluations, provider, root, variant }))
    }
  }
  const ended = new Date()
  const candidateHashes = [...new Set(runs.map(run => run.hashes.candidate))]
  const fixtureHashes = [...new Set(runs.map(run => run.hashes.fixture))]
  const harnessHashes = [...new Set(runs.map(run => run.hashes.harness))]
  const result = runs.every(run => run.result === 'passed')
    && candidateHashes.length === 1
    && fixtureHashes.length === 1
    && harnessHashes.length === 1
    ? 'passed'
    : 'failed'
  const matrixDirectory = join(evaluations, 'matrices')
  mkdirSync(matrixDirectory, { recursive: true })
  const matrixPath = join(matrixDirectory, `${started.toISOString().replaceAll(/[:.]/g, '-')}.json`)
  const matrix = {
    case_ids: selected,
    candidate_hashes: candidateHashes,
    ended_at: ended.toISOString(),
    effort,
    fixture_hashes: fixtureHashes,
    harness_hashes: harnessHashes,
    metadata_path: matrixPath,
    model,
    provider: provider ?? null,
    result,
    runs,
    started_at: started.toISOString(),
  }
  writeFileSync(matrixPath, `${JSON.stringify(matrix, null, 2)}\n`)
  return matrix
}

function flagValue(flags, name) {
  const index = flags.indexOf(name)
  return index >= 0 ? flags[index + 1] : undefined
}

function usage() {
  console.error('Usage:\n  node scripts/rsp-review-eval.mjs prepare <case> <baseline|candidate> [--json]\n  node scripts/rsp-review-eval.mjs run <case> <baseline|candidate> --model <model> --effort <effort> [--provider <provider>] [--json]\n  node scripts/rsp-review-eval.mjs matrix --model <model> --effort <effort> [--provider <provider>] [--json]')
}

const isMain = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)
if (isMain) {
  const [command, ...arguments_] = process.argv.slice(2)
  if (!['matrix', 'prepare', 'run'].includes(command)) {
    usage()
    process.exitCode = 1
  }
  else {
    try {
      const root = process.cwd()
      if (command === 'matrix') {
        const matrix = await runEvaluationMatrix({
          effort: flagValue(arguments_, '--effort'),
          model: flagValue(arguments_, '--model'),
          provider: flagValue(arguments_, '--provider'),
          root,
        })
        if (arguments_.includes('--json'))
          console.log(JSON.stringify(matrix, null, 2))
        else
          console.log(`Matrix ${matrix.result}: ${matrix.runs.length} runs\nMetadata: ${matrix.metadata_path}`)
      }
      else if (command === 'prepare') {
        const [caseId, variant, ...flags] = arguments_
        if (!caseId || !variant)
          throw new Error('prepare requires case and variant')
        const prepared = prepareEvaluation({ caseId, root, variant })
        if (flags.includes('--json'))
          console.log(JSON.stringify(prepared, null, 2))
        else
          console.log(`Prepared ${prepared.case.id} (${prepared.variant})\nWorkspace: ${prepared.workspace}\nPrompt: ${prepared.promptPath}`)
      }
      else {
        const [caseId, variant, ...flags] = arguments_
        if (!caseId || !variant)
          throw new Error('run requires case and variant')
        const run = await runEvaluation({
          caseId,
          effort: flagValue(flags, '--effort'),
          model: flagValue(flags, '--model'),
          provider: flagValue(flags, '--provider'),
          root,
          variant,
        })
        if (flags.includes('--json'))
          console.log(JSON.stringify(run, null, 2))
        else
          console.log(`Ran ${run.case.id} (${run.variant}): ${run.result}\nMetadata: ${run.paths.metadata}`)
      }
    }
    catch (error) {
      console.error(error instanceof Error ? error.message : String(error))
      process.exitCode = 1
    }
  }
}
