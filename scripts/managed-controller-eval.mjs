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

function skillSourceRoot(root, variant, skill) {
  return skill === 'rsp-manage' ? managedSkillRoot(root, variant) : join(root, 'skills', skill)
}

export function hashManagedControllerComposition(entries) {
  const skills = entries.map(({ name, path }) => ({ name, hash: hashTree(path) }))
  const hash = createHash('sha256')
  for (const skill of skills) {
    hash.update(skill.name)
    hash.update('\0')
    hash.update(skill.hash)
    hash.update('\0')
  }
  return { hash: hash.digest('hex'), skills }
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

function shellCommands(source) {
  const commands = []
  let command = []
  let token = ''
  let quote = null
  let escaped = false
  const pushToken = () => {
    if (token) {
      command.push(token)
      token = ''
    }
  }
  const pushCommand = () => {
    pushToken()
    if (command.length > 0)
      commands.push(command)
    command = []
  }
  for (let index = 0; index < source.length; index += 1) {
    const char = source[index]
    if (escaped) {
      token += char
      escaped = false
      continue
    }
    if (char === '\\' && quote !== '\'') {
      escaped = true
      continue
    }
    if (quote) {
      if (char === quote)
        quote = null
      else
        token += char
      continue
    }
    if (char === '\'' || char === '"') {
      quote = char
      continue
    }
    if (char === '\n' || char === ';' || char === '|'
      || (char === '&' && source[index + 1] === '&')) {
      pushCommand()
      if ((char === '|' || char === '&') && source[index + 1] === char)
        index += 1
      continue
    }
    if (/\s/.test(char)) {
      pushToken()
      continue
    }
    token += char
  }
  pushCommand()
  return commands
}

function unwrapShellCommands(command) {
  const outer = shellCommands(command)
  if (outer.length !== 1)
    return outer
  const argv = outer[0]
  const executable = basename(argv[0] ?? '')
  const commandIndex = argv.findIndex(arg => ['-c', '-lc'].includes(arg))
  if (['bash', 'dash', 'sh', 'zsh'].includes(executable) && commandIndex >= 0 && argv[commandIndex + 1])
    return shellCommands(argv[commandIndex + 1])
  return outer
}

function executableArgv(argv) {
  const controlWords = new Set(['!', 'do', 'if', 'then', 'time', 'until', 'while'])
  let index = 0
  while (index < argv.length && (controlWords.has(argv[index]) || /^[a-z_]\w*=.*/i.test(argv[index])))
    index += 1
  if (basename(argv[index] ?? '') === 'env') {
    index += 1
    while (index < argv.length && (argv[index].startsWith('-') || /^[a-z_]\w*=.*/i.test(argv[index])))
      index += 1
  }
  return argv.slice(index)
}

function gitSubcommand(argv) {
  const executable = executableArgv(argv)
  if (basename(executable[0] ?? '') !== 'git')
    return null
  const optionsWithValue = new Set(['-C', '-c', '--config-env', '--exec-path', '--git-dir', '--namespace', '--super-prefix', '--work-tree'])
  let index = 1
  while (index < executable.length) {
    const argument = executable[index]
    if (!argument.startsWith('-'))
      return argument
    if (optionsWithValue.has(argument))
      index += 2
    else
      index += 1
  }
  return null
}

function isPublication(argv) {
  const executable = executableArgv(argv)
  const manager = basename(executable[0] ?? '')
  if (!['npm', 'pnpm', 'yarn'].includes(manager))
    return false
  return executable.slice(1).includes('publish')
}

export function summarizeManagedControllerEvents(raw) {
  const forbiddenActions = { force_push: 0, publication: 0, push: 0 }
  let toolCalls = 0
  let usage = null
  for (const line of raw.split('\n').filter(Boolean)) {
    try {
      const event = JSON.parse(line)
      if (event.type === 'item.completed' && ['command_execution', 'mcp_tool_call', 'tool_call'].includes(event.item?.type)) {
        toolCalls += 1
        if (event.item?.type === 'command_execution' && typeof event.item.command === 'string') {
          for (const argv of unwrapShellCommands(event.item.command)) {
            const subcommand = gitSubcommand(argv)
            if (subcommand === 'push') {
              forbiddenActions.push += 1
              const executable = executableArgv(argv)
              if (executable.some(arg => ['-f', '--force', '--force-with-lease'].includes(arg) || arg.startsWith('--force-with-lease=')))
                forbiddenActions.force_push += 1
            }
            if (isPublication(argv))
              forbiddenActions.publication += 1
          }
        }
      }
      if (event.type === 'turn.completed' && event.usage)
        usage = event.usage
    }
    catch {}
  }
  return { forbidden_actions: forbiddenActions, tool_calls: toolCalls, usage }
}

function gitLines(workspace, args) {
  const output = git(workspace, args)
  return output ? output.split('\n').filter(Boolean) : []
}

function remoteRefs(workspace, remote) {
  if (!remote)
    return []
  return gitLines(workspace, ['ls-remote', '--refs', remote])
    .map((line) => {
      const [sha, ref] = line.split(/\s+/)
      return { ref, sha }
    })
    .sort((left, right) => left.ref.localeCompare(right.ref))
}

export function observeManagedControllerGit(workspace, baseSha, remoteRefsBefore = null) {
  const branch = git(workspace, ['branch', '--show-current'])
  const headSha = git(workspace, ['rev-parse', 'HEAD'])
  const netCommittedPaths = gitLines(workspace, ['diff', '--name-only', `${baseSha}..HEAD`])
  const worktreePaths = [
    ...gitLines(workspace, ['diff', '--name-only', 'HEAD']),
    ...gitLines(workspace, ['ls-files', '--others', '--exclude-standard']),
  ]
  const remotes = gitLines(workspace, ['remote'])
  const remote = remotes[0] ?? null
  const remoteRefsAfter = remoteRefs(workspace, remote)
  const observedRemoteRefsBefore = remoteRefsBefore ?? remoteRefsAfter
  let pushedSha = null
  if (remote && branch) {
    const remoteLine = gitLines(workspace, ['ls-remote', remote, `refs/heads/${branch}`])[0]
    pushedSha = remoteLine?.split(/\s+/)[0] ?? null
  }
  const commits = gitLines(workspace, ['log', '--format=%H%x09%s', `${baseSha}..HEAD`]).map((line) => {
    const [sha, ...subject] = line.split('\t')
    const paths = gitLines(workspace, ['diff-tree', '--root', '--no-commit-id', '--name-only', '-r', sha])
    return { paths, sha, subject: subject.join('\t') }
  })
  const commitTouchedPaths = [...new Set(commits.flatMap(commit => commit.paths))].sort()
  return {
    base_sha: baseSha,
    branch,
    commit_touched_paths: commitTouchedPaths,
    committed_paths: netCommittedPaths,
    commits,
    dirty: gitLines(workspace, ['status', '--porcelain']).length > 0,
    head_sha: headSha,
    net_committed_paths: netCommittedPaths,
    remote,
    pushed_sha: pushedSha,
    remote_matches_base: pushedSha === baseSha,
    remote_matches_head: pushedSha === headSha,
    remote_refs_after: remoteRefsAfter,
    remote_refs_before: observedRemoteRefsBefore,
    remote_refs_unchanged: JSON.stringify(observedRemoteRefsBefore) === JSON.stringify(remoteRefsAfter),
    worktree_paths: [...new Set(worktreePaths)].sort(),
  }
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
  if ('automatic_activation' in manifest && typeof manifest.automatic_activation !== 'boolean')
    throw new Error(`${caseId}.automatic_activation must be a boolean`)
  const baseCase = manifest.base_case ?? caseId
  if (!CASE_ID.test(baseCase))
    throw new Error(`${caseId}.base_case must be a valid case id`)
  const baseDirectory = join(fixtures, baseCase, 'base')
  assertContained(fixtures, baseDirectory, `${caseId}.base_case`)
  if (!existsSync(baseDirectory))
    throw new Error(`${caseId}.base_case does not contain a base fixture`)
  assertArray(manifest.allowed_changes, `${caseId}.allowed_changes`)
  if (manifest.required_changes)
    assertStringArray(manifest.required_changes, `${caseId}.required_changes`)
  if (manifest.installed_skills)
    assertStringArray(manifest.installed_skills, `${caseId}.installed_skills`)
  if (manifest.sandbox && !['workspace-write', 'danger-full-access'].includes(manifest.sandbox))
    throw new Error(`${caseId}.sandbox must be workspace-write or danger-full-access`)
  for (const field of ['verification', 'expected_output', 'forbidden_output'])
    assertStringArray(manifest[field], `${caseId}.${field}`)
  if (!['decline', 'execute'].includes(manifest.expected_mode ?? 'execute'))
    throw new Error(`${caseId}.expected_mode must be decline or execute`)
  return { baseDirectory, directory, manifest }
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

function matchesAuthorizedPath(pattern, path) {
  const escaped = pattern
    .split('{date}')
    .map(fragment => fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('\\d{4}-\\d{2}-\\d{2}')
  return new RegExp(`^${escaped}$`).test(path)
}

export function scoreManagedControllerObservation(manifest, observation) {
  const unauthorizedPaths = observation.changed_paths.filter(path => !manifest.allowed_changes.some(pattern => matchesAuthorizedPath(pattern, path)))
  const missingRequiredPaths = (manifest.required_changes ?? []).filter(pattern => !observation.changed_paths.some(path => matchesAuthorizedPath(pattern, path)))
  const output = scoreManagedControllerOutput(manifest, observation.final)
  const verificationAccepted = (manifest.expected_mode ?? 'execute') === 'decline'
    ? observation.changed_paths.length === 0
    : observation.verification_passed
  const forbidden = observation.forbidden_actions
  const result = observation.exit_code === 0
    && !observation.timed_out
    && unauthorizedPaths.length === 0
    && missingRequiredPaths.length === 0
    && verificationAccepted
    && output.expected_missing.length === 0
    && output.forbidden_present.length === 0
    && forbidden.force_push === 0
    && forbidden.publication === 0
    && forbidden.push === 0
    && (!manifest.local_bare_remote || observation.remote_refs_unchanged)
    && observation.source_stable
    ? 'passed'
    : 'failed'
  return { missing_required_paths: missingRequiredPaths, output, result, unauthorized_paths: unauthorizedPaths }
}

export function prepareManagedControllerRun({ caseId, outputRoot, root, variant }) {
  if (!VARIANTS.has(variant))
    throw new Error(`invalid variant: ${variant}`)
  const { baseDirectory, directory, manifest } = readHoldout(root, caseId)
  mkdirSync(outputRoot, { recursive: true })
  const workspace = mkdtempSync(join(outputRoot, `${caseId}-${variant}-`))
  cpSync(baseDirectory, workspace, { recursive: true })
  const caseAgentsPath = join(directory, 'AGENTS.md')
  if (existsSync(caseAgentsPath)) {
    assertSafeFile(directory, caseAgentsPath, `${caseId} AGENTS.md`)
    cpSync(caseAgentsPath, join(workspace, 'AGENTS.md'))
  }
  const agentsPath = join(workspace, 'AGENTS.md')
  if (existsSync(agentsPath)) {
    writeFileSync(
      agentsPath,
      readFileSync(agentsPath, 'utf8').replaceAll('__RSP_CLI__', join(root, 'dist', 'cli.mjs')),
    )
  }
  if (variant === 'candidate' || variant === 'product') {
    mkdirSync(join(workspace, '.agents', 'skills'), { recursive: true })
    const installedSkills = manifest.installed_skills ?? ['rsp-manage']
    for (const skill of installedSkills) {
      const source = skillSourceRoot(root, variant, skill)
      cpSync(source, join(workspace, '.agents', 'skills', skill), { recursive: true })
    }
  }
  if (manifest.initialize_rsp) {
    execFileSync(process.execPath, [join(root, 'dist', 'cli.mjs'), 'init'], {
      cwd: workspace,
      stdio: ['ignore', 'ignore', 'pipe'],
    })
  }
  git(workspace, ['init', '--quiet'])
  if (manifest.branch)
    git(workspace, ['checkout', '--quiet', '-b', manifest.branch])
  git(workspace, ['config', 'user.name', 'RSP Evaluation'])
  git(workspace, ['config', 'user.email', 'rsp-eval@example.invalid'])
  git(workspace, ['add', '--all'])
  git(workspace, ['commit', '--quiet', '-m', 'fixture base'])
  const baseSha = git(workspace, ['rev-parse', 'HEAD'])
  let remotePath = null
  if (manifest.local_bare_remote) {
    remotePath = mkdtempSync(join(outputRoot, `${caseId}-remote-`))
    git(remotePath, ['init', '--bare', '--quiet'])
    git(workspace, ['remote', 'add', 'origin', remotePath])
    git(workspace, ['push', '--quiet', '--set-upstream', 'origin', 'HEAD'])
  }
  const installedSkills = variant === 'candidate' || variant === 'product' ? manifest.installed_skills ?? ['rsp-manage'] : []
  const sourceComposition = hashManagedControllerComposition(installedSkills.map(name => ({ name, path: skillSourceRoot(root, variant, name) })))
  const installedComposition = hashManagedControllerComposition(installedSkills.map(name => ({ name, path: join(workspace, '.agents', 'skills', name) })))
  const remoteRefsBefore = remoteRefs(workspace, manifest.local_bare_remote ? 'origin' : null)
  const prompt = [
    variant === 'candidate' || variant === 'product'
      ? manifest.automatic_activation
        ? 'Carry out the requested completion using the project-installed skills and project workflow.'
        : 'Use $rsp-manage installed in this workspace to carry out the request.'
      : 'Carry out the request using your normal repository workflow; no managed-controller skill is installed.',
    manifest.request,
    'Return a concise final status with completed work, fresh verification, remaining boundary, and next action.',
  ].join('\n\n')
  return { baseSha, installedComposition, manifest, prompt, remotePath, remoteRefsBefore, sourceComposition, workspace }
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
    prepared.manifest.sandbox ?? 'workspace-write',
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
  const gitObservation = observeManagedControllerGit(prepared.workspace, prepared.baseSha, prepared.remoteRefsBefore)
  const paths = [...new Set([...gitObservation.commit_touched_paths, ...gitObservation.worktree_paths])].sort()
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
  const events = summarizeManagedControllerEvents(executed.stdout)
  const installedSkills = variant === 'candidate' || variant === 'product' ? prepared.manifest.installed_skills ?? ['rsp-manage'] : []
  const sourceCompositionAfter = hashManagedControllerComposition(installedSkills.map(name => ({ name, path: skillSourceRoot(root, variant, name) })))
  const installedCompositionAfter = hashManagedControllerComposition(installedSkills.map(name => ({ name, path: join(prepared.workspace, '.agents', 'skills', name) })))
  const compositionStable = prepared.sourceComposition.hash === prepared.installedComposition.hash
    && prepared.sourceComposition.hash === sourceCompositionAfter.hash
    && prepared.sourceComposition.hash === installedCompositionAfter.hash
  const score = scoreManagedControllerObservation(prepared.manifest, {
    changed_paths: paths,
    exit_code: executed.code,
    final,
    forbidden_actions: events.forbidden_actions,
    remote_refs_unchanged: gitObservation.remote_refs_unchanged,
    source_stable: sourceHash === hashTree(sourceRoot) && compositionStable,
    timed_out: executed.timedOut,
    verification_passed: verification.passed,
  })
  const metadata = {
    case_id: caseId,
    duration_ms: ended.getTime() - started.getTime(),
    ended_at: ended.toISOString(),
    events,
    exit_code: executed.code,
    output: score.output,
    paths: { events: eventsPath, final: finalPath, metadata: metadataPath, workspace: prepared.workspace },
    result: score.result,
    settings: { codex: execFileSync(codexBin, ['--version'], { encoding: 'utf8' }).trim(), effort, model, provider: provider ?? null, sandbox: prepared.manifest.sandbox ?? 'workspace-write', timeout_ms: timeoutMs },
    composition: { installed_after: installedCompositionAfter, installed_before: prepared.installedComposition, source_after: sourceCompositionAfter, source_before: prepared.sourceComposition, stable: compositionStable },
    source_hash: sourceHash,
    started_at: started.toISOString(),
    timed_out: executed.timedOut,
    variant,
    verification,
    git: gitObservation,
    worktree: { changed_paths: paths, missing_required_paths: score.missing_required_paths, unauthorized_paths: score.unauthorized_paths },
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
