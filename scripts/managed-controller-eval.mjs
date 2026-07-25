#!/usr/bin/env node

import { execFileSync, spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, writeFileSync } from 'node:fs'
import { basename, dirname, join, relative, resolve, sep } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { parse as parseYaml } from 'yaml'

const CASE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const VARIANTS = new Set(['baseline', 'candidate', 'product'])

function assertStringArray(value, label) {
  if (!Array.isArray(value) || value.length === 0 || value.some(item => typeof item !== 'string' || item.length === 0))
    throw new Error(`${label} must be a non-empty string array`)
}

function assertArray(value, label) {
  if (!Array.isArray(value) || value.some(item => typeof item !== 'string' || item.length === 0))
    throw new Error(`${label} must be a string array`)
}

function assertContained(parent, child, label) {
  const root = resolve(parent)
  const target = resolve(child)
  if (target !== root && !target.startsWith(`${root}${sep}`))
    throw new Error(`${label} escapes ${root}`)
}

function assertSafeFile(root, path, label) {
  const canonicalRoot = realpathSync(root)
  const stats = lstatSync(path)
  if (stats.isSymbolicLink() || !stats.isFile())
    throw new Error(`${label} must be a regular non-symlink file`)
  const canonicalPath = realpathSync(path)
  if (!canonicalPath.startsWith(`${canonicalRoot}${sep}`))
    throw new Error(`${label} escapes its allowed root`)
}

function hashContent(content) {
  return createHash('sha256').update(content).digest('hex')
}

function listFiles(directory, current = directory) {
  const paths = []
  for (const entry of readdirSync(current, { withFileTypes: true })) {
    if (entry.name === '.git')
      continue
    const path = join(current, entry.name)
    if (entry.isDirectory())
      paths.push(...listFiles(directory, path))
    else
      paths.push(path)
  }
  return paths.sort()
}

function hashTree(directory) {
  const hash = createHash('sha256')
  for (const path of listFiles(directory)) {
    hash.update(relative(directory, path))
    hash.update('\0')
    hash.update(readFileSync(path))
    hash.update('\0')
  }
  return hash.digest('hex')
}

function git(workspace, args) {
  return execFileSync('git', args, { cwd: workspace, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
}

function runCommand({ args, command, cwd, input, timeoutMs }) {
  return new Promise((resolveRun) => {
    const child = spawn(command, args, { cwd, env: process.env, stdio: ['pipe', 'pipe', 'pipe'] })
    let stderr = ''
    let stdout = ''
    let timedOut = false
    const timeout = setTimeout(() => {
      timedOut = true
      child.kill('SIGTERM')
    }, timeoutMs)
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    child.stdout.on('data', chunk => stdout += chunk)
    child.stderr.on('data', chunk => stderr += chunk)
    child.on('error', (error) => {
      clearTimeout(timeout)
      resolveRun({ code: null, error: String(error), stderr, stdout, timedOut })
    })
    child.on('close', (code) => {
      clearTimeout(timeout)
      resolveRun({ code, error: null, stderr, stdout, timedOut })
    })
    child.stdin.end(input)
  })
}

function summarizeEvents(raw) {
  let toolCalls = 0
  let usage = null
  for (const line of raw.split('\n').filter(Boolean)) {
    try {
      const event = JSON.parse(line)
      if (event.type === 'item.completed' && ['command_execution', 'mcp_tool_call', 'tool_call'].includes(event.item?.type))
        toolCalls += 1
      if (event.type === 'turn.completed' && event.usage)
        usage = event.usage
    }
    catch {}
  }
  return { tool_calls: toolCalls, usage }
}

function changedPaths(workspace) {
  const tracked = git(workspace, ['diff', '--name-only', 'HEAD']).split('\n').filter(Boolean)
  const untracked = git(workspace, ['ls-files', '--others', '--exclude-standard']).split('\n').filter(Boolean)
  return [...new Set([...tracked, ...untracked])].sort()
}

function candidateRoot(root) {
  return join(root, 'research', 'candidates', 'skills', 'rsp-manage')
}

function productRoot(root) {
  return join(root, 'skills', 'rsp-manage')
}

function managedSkillRoot(root, variant) {
  return variant === 'product' ? productRoot(root) : candidateRoot(root)
}

function contractFixtures(root) {
  return join(root, 'test', 'managed-controller', 'fixtures')
}

function holdoutFixtures(root) {
  return join(root, 'test', 'managed-controller', 'holdout')
}

export function loadManagedControllerCases(root) {
  const fixtures = contractFixtures(root)
  return readdirSync(fixtures)
    .filter(name => name.endsWith('.yaml'))
    .sort()
    .map((name) => {
      const path = join(fixtures, name)
      assertSafeFile(fixtures, path, `fixture ${name}`)
      const item = parseYaml(readFileSync(path, 'utf8'))
      if (!item || !CASE_ID.test(item.id) || item.id !== basename(name, '.yaml'))
        throw new Error(`fixture ${name} has an invalid or mismatched id`)
      for (const field of ['evidence', 'required_contract', 'prohibited_actions'])
        assertStringArray(item[field], `${item.id}.${field}`)
      return item
    })
}

export function evaluateManagedController(root) {
  const body = readFileSync(join(candidateRoot(root), 'SKILL.md'), 'utf8')
  return loadManagedControllerCases(root).map((item) => {
    const missing = item.required_contract.filter(fragment => !body.includes(fragment))
    return { id: item.id, missing, passed: missing.length === 0 }
  })
}

export function readManagedControllerFlag(flags, name) {
  const index = flags.indexOf(name)
  if (index === -1)
    return undefined
  const value = flags[index + 1]
  if (!value || value.startsWith('--'))
    throw new Error(`${name} requires a value`)
  return value
}

function readHoldout(root, caseId) {
  if (!CASE_ID.test(caseId))
    throw new Error(`invalid case id: ${caseId}`)
  const fixtures = holdoutFixtures(root)
  const directory = join(fixtures, caseId)
  assertContained(fixtures, directory, 'holdout case')
  const manifest = parseYaml(readFileSync(join(directory, 'case.yaml'), 'utf8'))
  if (!manifest || manifest.id !== caseId || typeof manifest.request !== 'string')
    throw new Error(`invalid holdout manifest: ${caseId}`)
  assertArray(manifest.allowed_changes, `${caseId}.allowed_changes`)
  for (const field of ['verification', 'expected_output', 'forbidden_output'])
    assertStringArray(manifest[field], `${caseId}.${field}`)
  if (!['decline', 'execute'].includes(manifest.expected_mode ?? 'execute'))
    throw new Error(`${caseId}.expected_mode must be decline or execute`)
  return { directory, manifest }
}

function readRetainedScoringManifest(root, matrixPath, caseId) {
  const retainedPath = join(dirname(matrixPath), 'oracles', `${caseId}.yaml`)
  if (!existsSync(retainedPath))
    return readHoldout(root, caseId).manifest
  assertSafeFile(join(dirname(matrixPath), 'oracles'), retainedPath, `retained oracle ${caseId}`)
  const manifest = parseYaml(readFileSync(retainedPath, 'utf8'))
  if (!manifest || manifest.id !== caseId)
    throw new Error(`invalid retained oracle: ${caseId}`)
  for (const field of ['expected_output', 'forbidden_output'])
    assertStringArray(manifest[field], `${caseId}.${field}`)
  return manifest
}

export function scoreManagedControllerOutput(manifest, final) {
  const normalized = final.toLowerCase()
  return {
    expected_missing: manifest.expected_output.filter(fragment => !normalized.includes(fragment.toLowerCase())),
    forbidden_present: manifest.forbidden_output.filter(fragment => normalized.includes(fragment.toLowerCase())),
  }
}

export function prepareManagedControllerRun({ caseId, outputRoot, root, variant }) {
  if (!VARIANTS.has(variant))
    throw new Error(`invalid variant: ${variant}`)
  const { directory, manifest } = readHoldout(root, caseId)
  mkdirSync(outputRoot, { recursive: true })
  const workspace = mkdtempSync(join(outputRoot, `${caseId}-${variant}-`))
  cpSync(join(directory, 'base'), workspace, { recursive: true })
  const agentsPath = join(workspace, 'AGENTS.md')
  if (existsSync(agentsPath)) {
    writeFileSync(
      agentsPath,
      readFileSync(agentsPath, 'utf8').replaceAll('__RSP_CLI__', join(root, 'dist', 'cli.mjs')),
    )
  }
  if (variant === 'candidate' || variant === 'product') {
    const installed = join(workspace, '.agents', 'skills', 'rsp-manage')
    mkdirSync(join(workspace, '.agents', 'skills'), { recursive: true })
    cpSync(managedSkillRoot(root, variant), installed, { recursive: true })
  }
  git(workspace, ['init', '--quiet'])
  git(workspace, ['config', 'user.name', 'RSP Evaluation'])
  git(workspace, ['config', 'user.email', 'rsp-eval@example.invalid'])
  git(workspace, ['add', '--all'])
  git(workspace, ['commit', '--quiet', '-m', 'fixture base'])
  const prompt = [
    variant === 'candidate' || variant === 'product'
      ? 'Use $rsp-manage installed in this workspace to carry out the request.'
      : 'Carry out the request using your normal repository workflow; no managed-controller skill is installed.',
    manifest.request,
    'Return a concise final status with completed work, fresh verification, remaining boundary, and next action.',
  ].join('\n\n')
  return { manifest, prompt, workspace }
}

export async function runManagedControllerEvaluation({ caseId, codexBin = 'codex', effort, model, outputRoot, provider, root, timeoutMs, variant }) {
  const prepared = prepareManagedControllerRun({ caseId, outputRoot, root, variant })
  const runDirectory = join(outputRoot, 'runs', basename(prepared.workspace))
  mkdirSync(runDirectory, { recursive: true })
  const finalPath = join(runDirectory, 'final.md')
  const eventsPath = join(runDirectory, 'events.jsonl')
  const metadataPath = join(runDirectory, 'metadata.json')
  const sourceRoot = managedSkillRoot(root, variant)
  const sourceHash = hashTree(sourceRoot)
  const started = new Date()
  const args = [
    'exec',
    '--ephemeral',
    '--sandbox',
    'workspace-write',
    '--model',
    model,
    '--config',
    `model_reasoning_effort="${effort}"`,
    ...(provider ? ['--config', `model_provider="${provider}"`] : []),
    '--json',
    '--output-last-message',
    finalPath,
    '--cd',
    prepared.workspace,
    '-',
  ]
  const executed = await runCommand({ args, command: codexBin, cwd: prepared.workspace, input: prepared.prompt, timeoutMs })
  writeFileSync(eventsPath, executed.stdout)
  if (executed.stderr)
    writeFileSync(join(runDirectory, 'stderr.log'), executed.stderr)
  const ended = new Date()
  const paths = changedPaths(prepared.workspace)
  const unauthorized = paths.filter(path => !prepared.manifest.allowed_changes.includes(path))
  let verification = { code: null, passed: false, stderr: '', stdout: '' }
  try {
    const stdout = execFileSync(prepared.manifest.verification[0], prepared.manifest.verification.slice(1), {
      cwd: prepared.workspace,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
    verification = { code: 0, passed: true, stderr: '', stdout }
  }
  catch (error) {
    verification = {
      code: error.status ?? null,
      passed: false,
      stderr: String(error.stderr ?? ''),
      stdout: String(error.stdout ?? ''),
    }
  }
  const final = existsSync(finalPath) ? readFileSync(finalPath, 'utf8') : ''
  const output = scoreManagedControllerOutput(prepared.manifest, final)
  const events = summarizeEvents(executed.stdout)
  const verificationAccepted = prepared.manifest.expected_mode === 'decline'
    ? paths.length === 0
    : verification.passed
  const result = executed.code === 0
    && !executed.timedOut
    && unauthorized.length === 0
    && verificationAccepted
    && output.expected_missing.length === 0
    && output.forbidden_present.length === 0
    && sourceHash === hashTree(sourceRoot)
    ? 'passed'
    : 'failed'
  const metadata = {
    case_id: caseId,
    duration_ms: ended.getTime() - started.getTime(),
    ended_at: ended.toISOString(),
    events,
    exit_code: executed.code,
    output,
    paths: { events: eventsPath, final: finalPath, metadata: metadataPath, workspace: prepared.workspace },
    result,
    settings: { codex: execFileSync(codexBin, ['--version'], { encoding: 'utf8' }).trim(), effort, model, provider: provider ?? null, sandbox: 'workspace-write', timeout_ms: timeoutMs },
    source_hash: sourceHash,
    started_at: started.toISOString(),
    timed_out: executed.timedOut,
    variant,
    verification,
    worktree: { changed_paths: paths, unauthorized_paths: unauthorized },
  }
  writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`)
  return metadata
}

async function main() {
  const root = resolve(fileURLToPath(new URL('..', import.meta.url)))
  const [command, ...flags] = process.argv.slice(2)
  if (command === 'contract') {
    const result = evaluateManagedController(root)
    console.log(JSON.stringify(result, null, 2))
    process.exitCode = result.every(item => item.passed) ? 0 : 1
    return
  }
  const flag = name => readManagedControllerFlag(flags, name)
  if (command === 'rescore') {
    const matrixPath = resolve(flags[0])
    const matrix = JSON.parse(readFileSync(matrixPath, 'utf8'))
    const runs = matrix.runs.map((run) => {
      const caseId = run.case_id ?? run.case
      const manifest = readRetainedScoringManifest(root, matrixPath, caseId)
      const finalPath = run.paths?.final ?? join(dirname(matrixPath), 'outputs', `${caseId}-${run.variant}.md`)
      const final = readFileSync(finalPath, 'utf8')
      const retainedHashMatches = !run.retained_normalized_output_hash
        || hashContent(final) === run.retained_normalized_output_hash
      const executionPassed = run.process_result
        ? run.process_result === 'passed'
        && run.unauthorized_paths.length === 0
        && run.verification.startsWith('npm test passed')
        : run.exit_code === 0
          && !run.timed_out
          && run.verification.passed
          && run.worktree.unauthorized_paths.length === 0
      const output = scoreManagedControllerOutput(manifest, final)
      const result = executionPassed
        && retainedHashMatches
        && output.expected_missing.length === 0
        && output.forbidden_present.length === 0
        ? 'passed'
        : 'failed'
      return { case: caseId, output, retained_hash_matches: retainedHashMatches, result, variant: run.variant }
    })
    const rescore = {
      original_matrix_hash: hashContent(readFileSync(matrixPath)),
      reason: matrix.rescore_reason ?? null,
      result: runs.every(run => run.result === 'passed') ? 'passed' : 'failed',
      runs,
      source_raw_matrix_hash: matrix.source_raw_matrix_hash ?? null,
    }
    const outputDirectory = resolve(flag('--output-root') ?? join(root, '.cache', 'rsp-manage-eval'))
    mkdirSync(outputDirectory, { recursive: true })
    const outputPath = join(outputDirectory, 'rescore.json')
    writeFileSync(outputPath, `${JSON.stringify(rescore, null, 2)}\n`)
    console.log(JSON.stringify({ output_path: outputPath, ...rescore }, null, 2))
    process.exitCode = rescore.result === 'passed' ? 0 : 1
    return
  }
  const model = flag('--model')
  const effort = flag('--effort')
  const provider = flag('--provider')
  const timeoutMs = Number(flag('--timeout-ms') ?? 300000)
  const outputRoot = resolve(flag('--output-root') ?? join(root, '.cache', 'rsp-manage-eval'))
  if (!model || !effort)
    throw new Error('--model and --effort are required')
  if (command === 'run') {
    const [caseId, variant] = flags
    console.log(JSON.stringify(await runManagedControllerEvaluation({ caseId, effort, model, outputRoot, provider, root, timeoutMs, variant }), null, 2))
    return
  }
  if (command === 'matrix') {
    const runs = []
    for (const caseId of ['multi-slice', 'interruption-recovery']) {
      for (const variant of ['baseline', 'candidate'])
        runs.push(await runManagedControllerEvaluation({ caseId, effort, model, outputRoot, provider, root, timeoutMs, variant }))
    }
    const matrix = { result: runs.every(run => run.result === 'passed') ? 'passed' : 'failed', runs }
    const matrixPath = join(outputRoot, 'matrix.json')
    writeFileSync(matrixPath, `${JSON.stringify(matrix, null, 2)}\n`)
    console.log(JSON.stringify({ matrix_path: matrixPath, result: matrix.result, runs: runs.map(run => ({ case_id: run.case_id, result: run.result, variant: run.variant })) }, null, 2))
    process.exitCode = matrix.result === 'passed' ? 0 : 1
    return
  }
  throw new Error('usage: managed-controller-eval.mjs contract | run <case> <baseline|candidate|product> --model <model> --effort <effort> [--provider <id>] | matrix --model <model> --effort <effort> [--provider <id>]')
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}
