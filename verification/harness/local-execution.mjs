import { spawnSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { existsSync, lstatSync, mkdtempSync, readdirSync, readFileSync, readlinkSync, realpathSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { delimiter, dirname, join, relative, resolve, sep } from 'node:path'

const SENSITIVE_KEY = /token|secret|password|cookie|authorization|bearer|api[_ -]?key/iu
const SAFE_ENVIRONMENT_KEYS = new Set([
  'PATH',
  'NODE_PATH',
  'LANG',
  'LC_ALL',
  'LC_CTYPE',
  'TZ',
  'TERM',
  'CI',
  'FORCE_COLOR',
  'NO_COLOR',
])
const MAX_OUTPUT = 16 * 1024

function trimOutput(value) {
  const text = String(value ?? '')
  return text.length > MAX_OUTPUT ? `${text.slice(0, MAX_OUTPUT)}\\n<truncated>` : text
}

function sanitize(value) {
  if (typeof value === 'string') {
    return value
      .replace(/(?:\/Users|\/private|\/home|\/var\/folders|\/tmp)\/[^\s"']+/gu, '<absolute-path>')
      .replace(/authorization\s*[:=]\s*(?:bearer\s+)?\S+/giu, 'authorization: [REDACTED]')
      .replace(/bearer\s+[\w.-]{8,}/giu, 'Bearer [REDACTED]')
      .replace(/((?:--?)?(?:api[_ -]?key|token|secret|password|cookie|authorization|bearer))(?:\s*[:=]|\s+)(?:bearer\s+)?(?:"[^"\n]*"|'[^'\n]*'|\S+)/giu, '$1 [REDACTED]')
      .replace(/(?:api[_ -]?key|token|secret|password|cookie)\s*[:=]\s*\S+/giu, '[REDACTED]')
  }
  if (Array.isArray(value))
    return value.map(item => sanitize(item))
  if (value && typeof value === 'object')
    return Object.fromEntries(Object.entries(value).map(([key, child]) => [key, SENSITIVE_KEY.test(key) ? '[REDACTED]' : sanitize(child)]))
  return value
}

function safeEnvironment(overrides = {}) {
  const isolatedHome = mkdtempSync(join(tmpdir(), 'rsp-verification-home-'))
  const environment = Object.fromEntries(Object.entries(process.env)
    .filter(([key]) => SAFE_ENVIRONMENT_KEYS.has(key)))
  Object.assign(environment, {
    ...overrides,
    PATH: [dirname(process.execPath), environment.PATH].filter(Boolean).join(delimiter),
    HOME: isolatedHome,
    USERPROFILE: isolatedHome,
    XDG_CONFIG_HOME: join(isolatedHome, '.config'),
    CI: 'true',
    RSP_VERIFICATION_PROVIDER: 'disabled',
    RSP_VERIFICATION_REAL_PROVIDER: 'disabled',
  })
  return {
    environment,
    cleanup: () => rmSync(isolatedHome, { recursive: true, force: true }),
  }
}

function git(root, args) {
  const result = spawnSync('git', ['-C', root, ...args], { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 })
  return result.status === 0 ? result.stdout.trim() : null
}

function gitStatus(root) {
  const result = spawnSync('git', ['-C', root, '-c', 'core.quotePath=false', 'status', '--porcelain=v1', '-z', '--untracked-files=all'], { encoding: 'utf8', maxBuffer: 4 * 1024 * 1024 })
  if (result.status !== 0)
    return null
  const records = result.stdout.split('\0').filter(Boolean)
  const entries = []
  for (let index = 0; index < records.length; index += 1) {
    const record = records[index]
    const status = record.slice(0, 2)
    const path = record.slice(3)
    if (path === '')
      continue
    entries.push({ path, line: `${status} ${path}` })
    if (status.includes('R') || status.includes('C')) {
      const pairedPath = records[index + 1]
      if (pairedPath !== undefined) {
        entries.push({ path: pairedPath, line: `${status} ${pairedPath}` })
        index += 1
      }
    }
  }
  return {
    text: entries.map(entry => entry.line).join('\n'),
    entries,
  }
}

function workspaceSnapshot(root) {
  const statusSnapshot = gitStatus(root)
  const status = statusSnapshot?.text ?? null
  const entries = statusSnapshot?.entries ?? []
  const changedPaths = entries.map(entry => entry.path)
  const content = new Map()
  for (const path of changedPaths) {
    const absolute = resolve(root, path)
    if (!existsSync(absolute)) {
      content.set(path, 'missing')
      continue
    }
    const stats = lstatSync(absolute)
    if (stats.isSymbolicLink())
      content.set(path, `symlink:${readlinkSync(absolute)}`)
    else if (stats.isFile())
      content.set(path, createHash('sha256').update(readFileSync(absolute)).digest('hex'))
    else
      content.set(path, `non-file:${stats.mode}`)
  }
  return {
    observed: {
      status: status ?? 'unavailable',
      changed_paths: changedPaths,
      head: git(root, ['rev-parse', '--verify', 'HEAD^{commit}']),
    },
    entries: new Map(entries.map(entry => [entry.path, { line: entry.line, content: content.get(entry.path) }])),
  }
}

function workspaceDelta(before, after) {
  const paths = new Set([...before.entries.keys(), ...after.entries.keys()])
  return [...paths].filter((path) => {
    const previous = before.entries.get(path)
    const current = after.entries.get(path)
    return !previous || !current || previous.line !== current.line || previous.content !== current.content
  })
}

function observedFile(root, absolute) {
  const content = readFileSync(absolute)
  return {
    path: relative(root, absolute).split(sep).join('/'),
    observed: true,
    bytes: content.byteLength,
    sha256: createHash('sha256').update(content).digest('hex'),
  }
}

function artifactSnapshot(root, artifactPaths = []) {
  const repositoryRoot = resolve(root)
  const snapshots = []
  const seen = new Set()
  const add = (snapshot) => {
    if (seen.has(snapshot.path))
      return
    seen.add(snapshot.path)
    snapshots.push(snapshot)
  }
  const visit = (absolute, displayPath) => {
    if (!absolute.startsWith(repositoryRoot + sep) || !existsSync(absolute)) {
      add({ path: displayPath, observed: false })
      return
    }
    const stats = lstatSync(absolute)
    if (stats.isDirectory()) {
      add({ path: displayPath, observed: true, kind: 'directory', entries: readdirSync(absolute).length })
      for (const entry of readdirSync(absolute))
        visit(join(absolute, entry), relative(repositoryRoot, join(absolute, entry)).split(sep).join('/'))
      return
    }
    if (!stats.isFile()) {
      add({ path: displayPath, observed: false, reason: 'not-a-file' })
      return
    }
    add(observedFile(repositoryRoot, absolute))
  }
  for (const path of artifactPaths)
    visit(resolve(repositoryRoot, path), path)
  return snapshots
}

function commandText(command, args) {
  return [command, ...args].join(' ')
}

/** Execute one declared local boundary and return host-observed evidence. */
export function executeLocalCommand({
  root,
  command,
  args = [],
  cwd = root,
  timeoutMs = 120_000,
  artifactPaths = [],
  environment = {},
  expectedExitCode = 0,
} = {}) {
  if (!root || !command)
    throw new Error('local execution requires root and command')
  const repositoryRoot = resolve(root)
  const workingDirectory = resolve(repositoryRoot, cwd)
  if (!workingDirectory.startsWith(repositoryRoot + sep) && workingDirectory !== repositoryRoot)
    throw new Error('local execution cwd escapes repository root')
  const canonicalRoot = realpathSync(repositoryRoot)
  const canonicalWorkingDirectory = realpathSync(workingDirectory)
  if (!canonicalWorkingDirectory.startsWith(canonicalRoot + sep) && canonicalWorkingDirectory !== canonicalRoot)
    throw new Error('local execution cwd escapes repository root through a symlink')
  const before = workspaceSnapshot(repositoryRoot)
  const startedAt = new Date().toISOString()
  const started = Date.now()
  const executable = command === 'node' ? process.execPath : command
  const isolatedEnvironment = safeEnvironment(environment)
  let result
  try {
    result = spawnSync(executable, args, {
      cwd: workingDirectory,
      env: isolatedEnvironment.environment,
      encoding: 'utf8',
      timeout: timeoutMs,
      maxBuffer: 4 * 1024 * 1024,
    })
  }
  finally {
    isolatedEnvironment.cleanup()
  }
  const completedAt = new Date().toISOString()
  const durationMs = Date.now() - started
  const timedOut = result.error?.code === 'ETIMEDOUT'
  const exitCode = timedOut ? null : result.status
  const commandFailure = exitCode !== expectedExitCode || timedOut
    ? [{
        command: commandText(command, args),
        exit_code: exitCode,
        expected_exit_code: expectedExitCode,
        signal: result.signal ?? null,
        timeout: timedOut,
        stderr: trimOutput(result.stderr),
        error: result.error?.message ?? null,
      }]
    : []
  const after = workspaceSnapshot(repositoryRoot)
  const changedPaths = workspaceDelta(before, after)
  const artifacts = artifactSnapshot(repositoryRoot, artifactPaths)
  const events = [
    { id: 'command-started', type: 'command_started', source: 'host', details: { command: commandText(command, args) } },
    { id: exitCode === expectedExitCode ? 'command-completed' : 'command-failed', type: exitCode === expectedExitCode ? 'command_completed' : 'command_failed', source: 'host', details: { exit_code: exitCode, timeout: timedOut } },
    { id: 'workspace-observed', type: 'workspace_observed', source: 'host', details: { changed_paths: changedPaths.length } },
  ]
  return sanitize({
    events,
    command_failures: commandFailure,
    warnings: [],
    unavailable: result.error && !timedOut ? [{ reason: result.error.message, command: commandText(command, args) }] : [],
    artifacts: artifacts.filter(artifact => artifact.observed).map((artifact, index) => ({ id: `artifact-${index + 1}`, surface_id: 'workspace-artifacts', ...artifact })),
    self_report: null,
    host_observed: {
      command: commandText(command, args),
      exit_code: exitCode,
      expected_exit_code: expectedExitCode,
      timeout: timedOut,
      stdout: trimOutput(result.stdout),
      stderr: trimOutput(result.stderr),
      workspace_before: before.observed,
      workspace_after: after.observed,
      changed_paths: changedPaths,
      duration_ms: durationMs,
    },
    final: exitCode === expectedExitCode ? `local command completed: ${command}` : `local command failed: ${command}`,
    usage: null,
    tool_calls: 0,
    elapsed_ms: durationMs,
    started_at: startedAt,
    completed_at: completedAt,
  })
}

export function localCommandEvidence(receipt) {
  return [
    ...(receipt.events ?? []).map((event, index) => ({ id: `event-${index + 1}`, source_kind: 'event', locator: `trace.events.${event.id}`, provenance: { source: event.source ?? 'host', observed: true }, value: event })),
    ...(receipt.command_failures ?? []).map((failure, index) => ({ id: `command-failure-${index + 1}`, source_kind: 'command-failure', locator: `trace.command_failures.${index}`, provenance: { source: 'host', observed: true }, value: failure })),
    ...(receipt.unavailable ?? []).map((item, index) => ({ id: `unavailable-${index + 1}`, source_kind: 'unavailable', locator: `trace.unavailable.${index}`, provenance: { source: 'host', observed: true }, value: item })),
    ...(receipt.artifacts ?? []).map((artifact, index) => ({ id: `artifact-${index + 1}`, source_kind: 'artifact', locator: `trace.artifacts.${index}`, provenance: { source: 'host', observed: true }, value: artifact })),
    { id: 'final-handoff-1', source_kind: 'final-handoff', locator: 'trace.final', provenance: { source: 'host', observed: true }, value: receipt.final },
  ]
}

export function relativeArtifactPath(root, path) {
  return relative(resolve(root), resolve(root, path)).split(sep).join('/')
}
