#!/usr/bin/env node

import { execFileSync, spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, unlinkSync, writeFileSync } from 'node:fs'
import { dirname, join, relative, resolve, sep } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { parse as parseYaml } from 'yaml'

import { evaluateJourneyTrace, evaluateTraceDirectory, loadJourneyOracles } from '../research/evaluations/rsp-daily-workflow-depth/2026-07-21/oracle-contract.mjs'

const EVIDENCE_KINDS = new Set(['contract', 'host-metadata', 'host-output', 'oracle', 'repository-command'])
const REAL_CASES = new Set(['j3-module-seam', 'j4-ordinary-correction', 'j5-multi-session-continuation'])

function assert(condition, message) {
  if (!condition)
    throw new Error(message)
}

function assertContained(root, path, label) {
  const canonicalRoot = realpathSync(root)
  const stats = lstatSync(path)
  assert(stats.isFile() && !stats.isSymbolicLink(), `${label} must be a regular non-symlink file`)
  const canonicalPath = realpathSync(path)
  assert(canonicalPath.startsWith(`${canonicalRoot}${sep}`), `${label} escapes the repository`)
}

export function validateEvidenceReference(root, reference, label) {
  assert(reference && typeof reference === 'object' && !Array.isArray(reference), `${label} must be an object`)
  assert(EVIDENCE_KINDS.has(reference.kind), `${label}.kind is unsupported`)
  assert(typeof reference.path === 'string' && reference.path.length > 0, `${label}.path must be non-empty`)
  assert(typeof reference.locator === 'string' && reference.locator.length > 0, `${label}.locator must be non-empty`)
  const path = resolve(root, reference.path)
  assertContained(root, path, label)
  const body = readFileSync(path, 'utf8')
  assert(body.includes(reference.locator), `${label}.locator was not found in ${relative(root, path)}`)
}

function hashContent(content) {
  return createHash('sha256').update(content).digest('hex')
}

function sanitizeRetainedText(content) {
  return content
    .replaceAll(/\/Users\/[^/\s"']+/g, '<home>')
    .replaceAll(/\/private\/tmp\/[^/\s"']+/g, '<tmp>')
    .replaceAll(/\/tmp\/[^/\s"']+/g, '<tmp>')
}

function archiveInvalidAttempt(destination, reason) {
  if (!existsSync(join(destination, 'metadata.json')))
    return
  const invalid = join(destination, 'invalid-attempts', `${reason}-${Date.now()}`)
  mkdirSync(invalid, { recursive: true })
  for (const name of readdirSync(destination).filter(name => /^(?:events|metadata|rescore|score)\.json$/.test(name) || /^phase-\d+-final\.md$/.test(name))) {
    const source = join(destination, name)
    const target = join(invalid, name)
    writeFileSync(target, sanitizeRetainedText(readFileSync(source, 'utf8')))
    unlinkSync(source)
  }
  writeFileSync(join(invalid, 'invalid-reason.json'), `${JSON.stringify({
    evidence_class: 'invalid-attempt',
    reason,
  }, null, 2)}\n`)
}

function git(workspace, args) {
  return execFileSync('git', args, { cwd: workspace, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim()
}

function runProcess({ args, command, cwd, input = '', timeoutMs }) {
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

function parseHostEvents(raw, workspace) {
  const observations = []
  let usage = null
  for (const line of raw.split('\n').filter(Boolean)) {
    try {
      const event = JSON.parse(line)
      if (event.type === 'item.completed' && event.item?.type === 'command_execution') {
        observations.push({
          command: String(event.item.command ?? '').replaceAll(workspace, '<workspace>'),
          exit_code: event.item.exit_code,
          kind: 'command',
          output_hash: hashContent(event.item.aggregated_output ?? ''),
        })
      }
      if (event.type === 'item.completed' && event.item?.type === 'file_change') {
        for (const change of event.item.changes ?? []) {
          observations.push({
            kind: 'file_change',
            operation: change.kind,
            path: relative(workspace, String(change.path)).replaceAll('\\', '/'),
          })
        }
      }
      if (event.type === 'turn.completed' && event.usage)
        usage = event.usage
    }
    catch {}
  }
  return { observations, usage }
}

function changedPaths(workspace) {
  const tracked = git(workspace, ['diff', '--name-only', 'HEAD']).split('\n').filter(Boolean)
  const untracked = git(workspace, ['ls-files', '--others', '--exclude-standard']).split('\n').filter(Boolean)
  return [...new Set([...tracked, ...untracked])].sort()
}

function loadRealCase(root, caseId) {
  assert(REAL_CASES.has(caseId), `unsupported real case: ${caseId}`)
  const directory = join(root, 'test', 'daily-workflow-depth', 'holdout', caseId)
  const manifest = parseYaml(readFileSync(join(directory, 'case.yaml'), 'utf8'))
  assert(manifest?.id === caseId, `invalid manifest for ${caseId}`)
  return { directory, manifest }
}

function installSkills(sourceRoot, workspace, names) {
  const destination = join(workspace, '.agents', 'skills')
  mkdirSync(destination, { recursive: true })
  for (const name of names) {
    const target = join(destination, name)
    if (!existsSync(target))
      cpSync(join(sourceRoot, 'skills', name), target, { recursive: true })
  }
}

function installedSkillHashes(workspace, names) {
  return Object.fromEntries(names.map((name) => {
    const path = join(workspace, '.agents', 'skills', name, 'SKILL.md')
    assertContained(workspace, path, `installed skill ${name}`)
    return [name, hashContent(readFileSync(path))]
  }))
}

export function validateJ3RuntimeIsolation(phases) {
  const commands = phases.flatMap(phase => phase.observations ?? [])
    .filter(item => item.kind === 'command')
    .map(item => item.command)
  const body = commands.join('\n')
  const violations = []
  if (/npx\s+(?:-y|--yes)\s+@oevery\/rsp\b/i.test(body))
    violations.push('registry-rsp-cli')
  if (/(?:^|[\s"'])rsp\s+(?:status|check|init|focus|create|archive|group)\b/im.test(body)
    && !/npx\s+--no-install\s+rsp\b/i.test(body)) {
    violations.push('unqualified-rsp-cli')
  }
  if (/\/(?:Users\/[^/]+\/)?\.(?:agents|codex)\/skills\//i.test(body))
    violations.push('global-skill-read')
  if (/\/(?:Users\/[^/]+\/)?\.codex\/memories\//i.test(body))
    violations.push('global-memory-read')
  const rspSegments = body.split(/[\n;&|]+/).filter(segment => /@oevery\/rsp|\brsp\s+(?:status|check|init|focus|create|archive|group)\b/i.test(segment))
  if (rspSegments.some(segment => !/npx\s+--no-install\s+rsp\b/i.test(segment)))
    violations.push('non-local-rsp-cli')
  const requiredProjectSkills = [
    '.agents/skills/codebase-design/SKILL.md',
    '.agents/skills/rsp/SKILL.md',
    '.agents/skills/rsp-implement/SKILL.md',
  ]
  const missingProjectSkillReads = requiredProjectSkills.filter(path => !body.includes(path))
  return {
    missing_project_skill_reads: missingProjectSkillReads,
    passed: violations.length === 0 && missingProjectSkillReads.length === 0,
    violations: [...new Set(violations)],
  }
}

export function validateJ4RuntimeIsolation(phases) {
  const commands = phases.flatMap(phase => phase.observations ?? [])
    .filter(item => item.kind === 'command')
    .map(item => item.command)
  const body = commands.join('\n')
  const violations = []
  if (/npx\s+(?:-y|--yes)\s+@oevery\/rsp\b/i.test(body))
    violations.push('registry-rsp-cli')
  if (/\/(?:Users\/[^/]+\/)?\.(?:agents|codex)\/skills\//i.test(body))
    violations.push('global-skill-read')
  if (/\/(?:Users\/[^/]+\/)?\.codex\/memories\//i.test(body))
    violations.push('global-memory-read')
  const rspSegments = body.split(/[\n;&|]+/).filter(segment => /@oevery\/rsp|\brsp\s+(?:status|check|init|focus|create|archive|group)\b/i.test(segment))
  if (rspSegments.some(segment => !/npx\s+--no-install\s+rsp\b/i.test(segment)))
    violations.push('non-local-rsp-cli')
  const requiredProjectSkills = [
    '.agents/skills/rsp/SKILL.md',
    '.agents/skills/rsp-tdd/SKILL.md',
    '.agents/skills/rsp-review/SKILL.md',
  ]
  const missingProjectSkillReads = requiredProjectSkills.filter(path => !body.includes(path))
  return {
    missing_project_skill_reads: missingProjectSkillReads,
    passed: violations.length === 0 && missingProjectSkillReads.length === 0,
    violations: [...new Set(violations)],
  }
}

function prepareRealWorkspace(root, caseId, outputRoot) {
  const { directory, manifest } = loadRealCase(root, caseId)
  mkdirSync(outputRoot, { recursive: true })
  const workspace = mkdtempSync(join(outputRoot, `${caseId}-`))
  cpSync(join(directory, 'base'), workspace, { recursive: true })
  writeFileSync(join(workspace, '.gitignore'), 'node_modules/\n.final-*.md\n')
  const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'))
  const suppliedTarball = process.env.RSP_EVAL_TARBALL
  if (!suppliedTarball) {
    execFileSync('mise', ['exec', '--', 'pnpm', 'pack', '--pack-destination', outputRoot], {
      cwd: root,
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'pipe'],
    })
  }
  const tarball = suppliedTarball
    ? resolve(suppliedTarball)
    : join(outputRoot, `${packageJson.name.replace('@', '').replace('/', '-')}-${packageJson.version}.tgz`)
  execFileSync('npm', ['install', '--ignore-scripts', '--no-save', '--package-lock=false', tarball], {
    cwd: workspace,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  const installedRoot = join(workspace, 'node_modules', '@oevery', 'rsp')
  installSkills(installedRoot, workspace, ['rsp', 'rsp-shape', 'rsp-implement', 'rsp-tdd', 'rsp-review'])
  const localBin = execFileSync('npx', ['--no-install', 'rsp', '--help'], {
    cwd: workspace,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  execFileSync('npx', ['--no-install', 'rsp', 'init'], { cwd: workspace, stdio: ['ignore', 'pipe', 'pipe'] })
  const changeName = caseId === 'j3-module-seam'
    ? 'device-discovery-boundary'
    : caseId === 'j4-ordinary-correction' ? 'cache-isolation' : 'long-running-delivery'
  execFileSync('npx', ['--no-install', 'rsp', 'focus', changeName], { cwd: workspace, stdio: ['ignore', 'pipe', 'pipe'] })
  const focusedCheck = execFileSync('npx', ['--no-install', 'rsp', 'check', '--focused'], {
    cwd: workspace,
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  git(workspace, ['init', '--quiet'])
  git(workspace, ['config', 'user.name', 'RSP Evaluation'])
  git(workspace, ['config', 'user.email', 'rsp-eval@example.invalid'])
  git(workspace, ['add', '--all'])
  git(workspace, ['commit', '--quiet', '-m', 'fixture base'])
  return {
    manifest,
    package: {
      local_bin_help_hash: hashContent(localBin),
      local_focused_check_hash: hashContent(focusedCheck),
      name: packageJson.name,
      sha256: hashContent(readFileSync(tarball)),
      installed_skill_hashes: installedSkillHashes(workspace, ['rsp', 'rsp-shape', 'rsp-implement', 'rsp-tdd', 'rsp-review', ...(caseId === 'j3-module-seam' ? ['codebase-design'] : [])]),
      version: packageJson.version,
    },
    workspace,
  }
}

async function runHostPhase({ effort, model, prompt, provider, sandbox, timeoutMs, workspace }) {
  const finalPath = join(workspace, `.final-${Date.now()}.md`)
  const started = Date.now()
  const args = [
    'exec',
    '--ephemeral',
    '--sandbox',
    sandbox,
    '--model',
    model,
    '--config',
    `model_reasoning_effort="${effort}"`,
    ...(provider ? ['--config', `model_provider="${provider}"`] : []),
    '--json',
    '--output-last-message',
    finalPath,
    '--cd',
    workspace,
    '-',
  ]
  const result = await runProcess({ args, command: 'codex', cwd: workspace, input: prompt, timeoutMs })
  const final = sanitizeRetainedText(existsSync(finalPath) ? readFileSync(finalPath, 'utf8') : '')
  const parsed = parseHostEvents(result.stdout, workspace)
  return {
    duration_ms: Date.now() - started,
    exit_code: result.code,
    final,
    final_hash: hashContent(final),
    observations: parsed.observations,
    stderr_hash: hashContent(result.stderr),
    timed_out: result.timedOut,
    usage: parsed.usage,
  }
}

function phasePrompts(caseId, request) {
  if (caseId === 'j3-module-seam') {
    return [
      {
        sandbox: 'workspace-write',
        text: `Use only the project-installed .agents/skills/codebase-design capability. Do not read global skills or memory. Any RSP CLI call must be exactly project-local npx --no-install rsp; registry, npx -y @oevery/rsp, and global rsp are forbidden. ${request}\n\nThis phase is design only. Read AGENTS.md, client/AGENTS.md, client/CONTEXT.md, and .rsp/changes/device-discovery-boundary.md. Write only docs/architecture/device-discovery-boundary.md. Return the same canonical WorkRef and exact artifact path in Simplified Chinese.`,
      },
      {
        sandbox: 'workspace-write',
        text: `Use only the project-installed .agents/skills/rsp and .agents/skills/rsp-implement skills. Do not read global skills or memory. Any RSP CLI call must be exactly project-local npx --no-install rsp; registry, npx -y @oevery/rsp, and global rsp are forbidden. ${request}\n\nRead the authoritative files again, including docs/architecture/device-discovery-boundary.md. Implement and test the selected Change. Run exactly: mise exec -- pnpm test -- device-discovery. Update the same Change. Stop at unavailable receiver hardware acceptance and report it in Simplified Chinese while preserving paths, WorkRef, commands, and status identifiers.`,
      },
    ]
  }
  if (caseId === 'j4-ordinary-correction') {
    return [
      {
        sandbox: 'workspace-write',
        text: `Use only the project-installed .agents/skills/rsp and .agents/skills/rsp-tdd skills. Do not read global skills or memory. Any RSP CLI call must be exactly project-local npx --no-install rsp; registry, npx -y @oevery/rsp, and global rsp are forbidden. ${request}\n\nRead AGENTS.md and .rsp/changes/cache-isolation.md. First add the focused regression test, then run exactly mise exec -- pnpm test -- cache-isolation and observe RED for the expected isolation reason, then make the minimum production correction and rerun the exact command GREEN. Update the same Change. Return in Simplified Chinese without claiming authenticated acceptance.`,
      },
      {
        sandbox: 'read-only',
        text: 'Use only the project-installed .agents/skills/rsp-review skill. Do not read global skills or memory. Any RSP CLI call must be exactly project-local npx --no-install rsp; registry, npx -y @oevery/rsp, and global rsp are forbidden. Perform a report-only fixed-scope review of HEAD versus the current selected-change diff. Read AGENTS.md and .rsp/changes/cache-isolation.md. Review only src/cache.ts, test/cache.test.ts, and the Change. Return Code and Document verdicts in Simplified Chinese; preserve canonical verdict values clean/skipped/blocked and do not modify files.',
      },
    ]
  }
  return [{
    sandbox: 'workspace-write',
    text: `No rsp-manage skill is installed. Act as one bounded external worker. ${request}\n\nRead AGENTS.md, handoff.md, .rsp/focus.d/long-running-delivery, .rsp/changes/long-running-delivery.md, current source/tests, and .cache/previous-verification.json. Treat the handoff and previous verification as stale pointers. Modify only the manifest allowlist, run exactly mise exec -- pnpm test -- long-running-delivery, update the same Change with fresh evidence, and stop at unavailable human acceptance. Return Simplified Chinese status with canonical WorkRef and no Git/lifecycle action.`,
  }]
}

function scoreOutput(manifest, finals) {
  const body = finals.join('\n').toLowerCase()
  return {
    forbidden_present: manifest.forbidden_output.filter(fragment => body.includes(fragment.toLowerCase())),
    missing: manifest.expected_output.filter(fragment => !body.includes(fragment.toLowerCase())),
  }
}

function runVerification(workspace, argv) {
  try {
    const stdout = execFileSync(argv[0], argv.slice(1), { cwd: workspace, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
    return { exit_code: 0, output_hash: hashContent(stdout) }
  }
  catch (error) {
    return { exit_code: error.status ?? null, output_hash: hashContent(String(error.stdout ?? '')) }
  }
}

export async function runRealJourney({ caseId, effort = 'low', model = 'gpt-5.6-terra', outputRoot, persistRoot, provider = 'custom', root, timeoutMs = 240000 }) {
  const prepared = prepareRealWorkspace(root, caseId, join(outputRoot, caseId))
  const headBefore = git(prepared.workspace, ['rev-parse', 'HEAD'])
  const phases = []
  for (const phase of phasePrompts(caseId, prepared.manifest.request))
    phases.push(await runHostPhase({ effort, model, prompt: phase.text, provider, sandbox: phase.sandbox, timeoutMs, workspace: prepared.workspace }))
  const paths = changedPaths(prepared.workspace).filter(path => !path.startsWith('.final-'))
  const unauthorized = paths.filter(path => !prepared.manifest.allowed_changes.includes(path))
  const verification = runVerification(prepared.workspace, prepared.manifest.verification)
  const output = scoreOutput(prepared.manifest, phases.map(phase => phase.final))
  const runtime_isolation = caseId === 'j3-module-seam'
    ? validateJ3RuntimeIsolation(phases)
    : caseId === 'j4-ordinary-correction'
      ? validateJ4RuntimeIsolation(phases)
      : { passed: true, violations: [], missing_project_skill_reads: [] }
  const metadata = {
    case_id: caseId,
    changed_paths: paths,
    git_head_unchanged: git(prepared.workspace, ['rev-parse', 'HEAD']) === headBefore,
    model,
    output,
    package: prepared.package,
    phases: phases.map((phase, index) => ({
      duration_ms: phase.duration_ms,
      exit_code: phase.exit_code,
      final_hash: phase.final_hash,
      observations: phase.observations,
      phase: index + 1,
      stderr_hash: phase.stderr_hash,
      timed_out: phase.timed_out,
      usage: phase.usage,
    })),
    provider,
    result: phases.every(phase => phase.exit_code === 0 && !phase.timed_out)
      && unauthorized.length === 0
      && verification.exit_code === 0
      && output.missing.length === 0
      && output.forbidden_present.length === 0
      && runtime_isolation.passed
      ? 'candidate-for-trace-scoring'
      : 'failed',
    runtime_isolation,
    unauthorized_paths: unauthorized,
    verification,
  }
  const destination = join(persistRoot, caseId)
  mkdirSync(destination, { recursive: true })
  archiveInvalidAttempt(destination, ['j3-module-seam', 'j4-ordinary-correction'].includes(caseId) ? 'violated-local-cli-and-project-skill-boundary' : 'failed-or-invalid-fixture')
  writeFileSync(join(destination, 'metadata.json'), sanitizeRetainedText(`${JSON.stringify(metadata, null, 2)}\n`))
  phases.forEach((phase, index) => writeFileSync(join(destination, `phase-${index + 1}-final.md`), sanitizeRetainedText(phase.final)))
  return metadata
}

export function rescoreRealJourney({ caseId, persistRoot, root }) {
  const { manifest } = loadRealCase(root, caseId)
  const destination = join(persistRoot, caseId)
  const metadataPath = join(destination, 'metadata.json')
  const metadata = JSON.parse(readFileSync(metadataPath, 'utf8'))
  const finals = readdirSync(destination)
    .filter(name => /^phase-\d+-final\.md$/.test(name))
    .sort()
    .map(name => readFileSync(join(destination, name), 'utf8'))
  const previous = { output: metadata.output, result: metadata.result }
  metadata.output = scoreOutput(manifest, finals)
  metadata.result = metadata.phases.every(phase => phase.exit_code === 0 && !phase.timed_out)
    && metadata.unauthorized_paths.length === 0
    && metadata.verification.exit_code === 0
    && metadata.output.missing.length === 0
    && metadata.output.forbidden_present.length === 0
    && metadata.runtime_isolation?.passed !== false
    ? 'candidate-for-trace-scoring'
    : 'failed'
  writeFileSync(metadataPath, `${JSON.stringify(metadata, null, 2)}\n`)
  writeFileSync(join(destination, 'rescore.json'), `${JSON.stringify({
    case_id: caseId,
    current: { output: metadata.output, result: metadata.result },
    previous,
    reason: 'Rescored the retained final output against the corrected semantic language oracle without rerunning the host.',
    scoring_only: true,
  }, null, 2)}\n`)
  return metadata
}

export function materializeRealTrace({ caseId, persistRoot, root }) {
  const destination = join(persistRoot, caseId)
  const metadata = JSON.parse(readFileSync(join(destination, 'metadata.json'), 'utf8'))
  assert(metadata.result === 'candidate-for-trace-scoring', `${caseId} is not ready for trace scoring`)
  const commands = metadata.phases.flatMap(phase => phase.observations).filter(item => item.kind === 'command')
  const changes = metadata.phases.flatMap(phase => phase.observations).filter(item => item.kind === 'file_change')
  const hasCommand = (fragment, code = 0) => commands.some(item => item.command.includes(fragment) && item.exit_code === code)
  const hasChange = path => changes.some(item => item.path === path)
  let trace
  if (caseId === 'j3-module-seam') {
    assert(metadata.runtime_isolation?.passed, 'J3 did not preserve project-local CLI and installed-skill isolation')
    assert(hasCommand('client/AGENTS.md') && hasCommand('client/CONTEXT.md'), 'J3 did not read architecture authority')
    assert(hasChange('docs/architecture/device-discovery-boundary.md'), 'J3 design worker did not return its artifact')
    assert(hasChange('client/packages/device-discovery/src/index.ts'), 'J3 implement worker did not mutate production')
    assert(hasCommand('mise exec -- pnpm test -- device-discovery'), 'J3 exact verification was not observed')
    trace = {
      case_id: caseId,
      events: [
        { observed_by: 'command', path: 'client/AGENTS.md', type: 'file_read' },
        { observed_by: 'command', path: 'client/CONTEXT.md', type: 'file_read' },
        { capability: 'codebase-design', expected_artifact: 'module-seam-decision', mutation_boundary: 'selected-change-only', observed_by: 'host', type: 'capability_dispatch', work_ref: '.rsp/changes/device-discovery-boundary.md' },
        { observed_by: 'host', owner: 'rsp-implement', type: 'return', work_ref: '.rsp/changes/device-discovery-boundary.md' },
        { observed_by: 'filesystem', path: 'client/packages/device-discovery/src/index.ts', scope: 'selected-change', type: 'mutation' },
        { argv: ['mise', 'exec', '--', 'pnpm', 'test', '--', 'device-discovery'], exit_code: 0, observed_by: 'command', phase: 'verify', type: 'command' },
        { class: 'hardware', next_action_present: true, observed_by: 'host', owner: 'human', status: 'unavailable', type: 'coverage' },
        { boundary: 'environment-acceptance', next_action_present: true, observed_by: 'host', owner: 'human', type: 'stop' },
      ],
      status: 'incomplete',
    }
  }
  else if (caseId === 'j4-ordinary-correction') {
    assert(metadata.runtime_isolation?.passed, 'J4 did not preserve project-local CLI and installed-skill isolation')
    const flat = metadata.phases[0].observations
    const reviewCommands = metadata.phases[1].observations.filter(item => item.kind === 'command')
    const testIndex = flat.findIndex(item => item.kind === 'file_change' && item.path === 'test/cache.test.ts')
    const redIndex = flat.findIndex(item => item.kind === 'command' && item.command.includes('mise exec -- pnpm test -- cache-isolation') && item.exit_code === 1)
    const sourceIndex = flat.findIndex(item => item.kind === 'file_change' && item.path === 'src/cache.ts')
    const greenIndex = flat.findIndex((item, index) => index > sourceIndex && item.kind === 'command' && item.command.includes('mise exec -- pnpm test -- cache-isolation') && item.exit_code === 0)
    assert(testIndex >= 0 && testIndex < redIndex && redIndex < sourceIndex && sourceIndex < greenIndex, 'J4 did not observe test-write -> RED -> production -> GREEN')
    assert(reviewCommands.some(item => item.command.includes('git diff --no-ext-diff')
      && item.command.includes('src/cache.ts')
      && item.command.includes('test/cache.test.ts')
      && item.command.includes('.rsp/changes/cache-isolation.md')), 'J4 review worker did not inspect the fixed scope')
    trace = {
      case_id: caseId,
      events: [
        { observed_by: 'filesystem', path: 'test/cache.test.ts', scope: 'focused-test', type: 'mutation' },
        { argv: ['mise', 'exec', '--', 'pnpm', 'test', '--', 'cache-isolation'], exit_code: 1, observed_by: 'command', phase: 'red', type: 'command' },
        { observed_by: 'filesystem', path: 'src/cache.ts', scope: 'production', type: 'mutation' },
        { argv: ['mise', 'exec', '--', 'pnpm', 'test', '--', 'cache-isolation'], exit_code: 0, observed_by: 'command', phase: 'verify', type: 'command' },
        { observed_by: 'host', result: 'clean', scope: 'selected-change-diff', type: 'review', work_ref: '.rsp/changes/cache-isolation.md' },
        { class: 'authenticated', next_action_present: true, observed_by: 'host', owner: 'human', status: 'unavailable', type: 'coverage' },
        { field: 'completion', observed_by: 'host', type: 'output', value: 'incomplete' },
        { boundary: 'environment-acceptance', next_action_present: true, observed_by: 'host', owner: 'human', type: 'stop' },
      ],
      status: 'incomplete',
    }
  }
  else {
    assert(hasCommand('handoff.md') && hasCommand('.cache/previous-verification.json'), 'J5 did not reopen stale pointers')
    assert(hasChange('.rsp/changes/long-running-delivery.md'), 'J5 did not return fresh evidence to the Change')
    assert(hasCommand('mise exec -- pnpm test -- long-running-delivery'), 'J5 did not refresh verification')
    trace = {
      case_id: caseId,
      events: [
        { evidence_freshness_checked: true, observed_by: 'host', type: 'session_resume', work_ref: '.rsp/changes/long-running-delivery.md' },
        { bounded: true, mutation_boundary_present: true, observed_by: 'host', stop_boundary_present: true, type: 'capability_dispatch', verification_present: true, work_ref: '.rsp/changes/long-running-delivery.md' },
        { exit_code: 0, observed_by: 'command', purpose: 'refresh-stale-verification', type: 'command' },
        { durable_truth_owner: 'selected-change', observed_by: 'host', type: 'return', work_ref: '.rsp/changes/long-running-delivery.md' },
        { class: 'human', next_action_present: true, observed_by: 'host', owner: 'user', status: 'unavailable', type: 'coverage' },
        { boundary: 'human-acceptance', next_action_present: true, observed_by: 'host', owner: 'user', type: 'stop' },
      ],
      status: 'incomplete',
    }
  }
  const oracle = loadJourneyOracles(join(root, 'research', 'evaluations', 'rsp-daily-workflow-depth', '2026-07-21')).find(item => item.id === caseId)
  const scored = evaluateJourneyTrace(oracle, trace)
  assert(scored.passed, `${caseId} generated trace failed its frozen oracle`)
  writeFileSync(join(destination, 'events.json'), `${JSON.stringify(trace, null, 2)}\n`)
  writeFileSync(join(destination, 'score.json'), `${JSON.stringify(scored, null, 2)}\n`)
  return scored
}

export function getDailyWorkflowDepthBlockers({ d2Passed, exactPackage, journeysPassed, packageBoundaryIntact }) {
  return [
    !journeysPassed && 'one or more real journeys failed',
    !exactPackage && 'real journeys used different package tarballs',
    exactPackage && !packageBoundaryIntact && 'real journeys did not use the frozen candidate package',
    !d2Passed && 'D2 paired correction-count gate is incomplete',
  ].filter(Boolean)
}

export function evaluateDailyWorkflowDepth(root) {
  const evaluationRoot = join(root, 'research', 'evaluations', 'rsp-daily-workflow-depth', '2026-07-21')
  const replayDirectory = join(evaluationRoot, 'traces')
  const realRoot = join(evaluationRoot, 'real-runs')
  const oracles = loadJourneyOracles(evaluationRoot)
  const replayResults = evaluateTraceDirectory(replayDirectory, evaluationRoot)

  for (const oracle of oracles) {
    const path = join(replayDirectory, `${oracle.id}.json`)
    const trace = JSON.parse(readFileSync(path, 'utf8'))
    assert(trace.evidence_class === 'excluded-composite-replay', `${oracle.id}.evidence_class must disclose excluded composite replay`)
    assert(Array.isArray(trace.events) && trace.events.length > 0, `${oracle.id}.events must not be empty`)
    trace.events.forEach((event, index) => {
      assert(Array.isArray(event.evidence) && event.evidence.length > 0, `${oracle.id}.events[${index}] needs source evidence`)
      event.evidence.forEach((reference, evidenceIndex) => validateEvidenceReference(root, reference, `${oracle.id}.events[${index}].evidence[${evidenceIndex}]`))
    })
  }

  const results = oracles.map((oracle) => {
    const trace = JSON.parse(readFileSync(join(realRoot, oracle.id, 'events.json'), 'utf8'))
    return evaluateJourneyTrace(oracle, trace)
  })
  const packageHashes = oracles.map((oracle) => {
    const directory = join(realRoot, oracle.id)
    const runPath = join(directory, 'run.json')
    const metadataPath = join(directory, 'metadata.json')
    return existsSync(runPath)
      ? JSON.parse(readFileSync(runPath, 'utf8')).candidate_package.sha256
      : JSON.parse(readFileSync(metadataPath, 'utf8')).package.sha256
  })
  const d2Path = join(realRoot, 'd2-paired.json')
  const d2 = existsSync(d2Path) ? JSON.parse(readFileSync(d2Path, 'utf8')) : { passed: false }
  const exactPackage = new Set(packageHashes).size === 1
  const journeysPassed = results.length === 5 && results.every(result => result.passed)
  const stableSkills = ['rsp', 'rsp-shape', 'rsp-implement', 'rsp-diagnose', 'rsp-tdd', 'rsp-review', 'rsp-address-review']
  const frozenPackageSha256 = '7d64fab954b7366688db5bccf3e38db86c9ad0a671df1669d0e833495c368011'
  const packageBoundaryIntact = exactPackage && packageHashes[0] === frozenPackageSha256
  const passed = journeysPassed && packageBoundaryIntact && d2.passed
  return {
    blockers: passed
      ? []
      : getDailyWorkflowDepthBlockers({ d2Passed: d2.passed, exactPackage, journeysPassed, packageBoundaryIntact }),
    d2,
    evidence_class: 'same-case-real-host-observations',
    exact_package_sha256: exactPackage ? packageHashes[0] : null,
    journeys: results,
    oracle_replay_passed: replayResults.length === 5 && replayResults.every(result => result.passed),
    package_boundary_intact: packageBoundaryIntact,
    passed,
    recommendation: passed ? 'resume-release-preparation' : 'hold-release-preparation',
    stable_skills: stableSkills,
    rejected_product_owner: 'rsp-manage',
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
  const runIndex = process.argv.indexOf('--run-real')
  const rescoreIndex = process.argv.indexOf('--rescore-real')
  const materializeIndex = process.argv.indexOf('--materialize-real')
  const persistRoot = join(root, 'research', 'evaluations', 'rsp-daily-workflow-depth', '2026-07-21', 'real-runs')
  const result = runIndex !== -1
    ? await runRealJourney({
        caseId: process.argv[runIndex + 1],
        outputRoot: join(root, '.cache', 'rsp-daily-workflow-depth'),
        persistRoot,
        root,
      })
    : rescoreIndex !== -1
      ? rescoreRealJourney({ caseId: process.argv[rescoreIndex + 1], persistRoot, root })
      : materializeIndex !== -1
        ? materializeRealTrace({ caseId: process.argv[materializeIndex + 1], persistRoot, root })
        : evaluateDailyWorkflowDepth(root)
  console.log(JSON.stringify(result, null, 2))
  if (runIndex === -1 && rescoreIndex === -1 && materializeIndex === -1 ? !result.passed : result.result === 'failed')
    process.exitCode = 1
}
