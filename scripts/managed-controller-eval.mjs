#!/usr/bin/env node

import { Buffer } from 'node:buffer'
import { execFileSync, spawn } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cpSync, existsSync, lstatSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, realpathSync, rmSync, writeFileSync } from 'node:fs'
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { parse as parseYaml } from 'yaml'
import {
  hashSkillEvaluationValue,
  validateSkillEvaluationReceipt,
} from './skill-candidate-evaluation.mjs'
import { projectSkillEvaluationObservability } from './skill-evaluation-observability.mjs'

const CASE_ID = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const EVALUATION_RECEIPT_PATH = '.rsp-evaluation-receipt.json'
const WORKER_RECEIPT_PREFIX = 'RSP_WORKER_RECEIPT_JSON='
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

export function hashManagedControllerArtifact(content) {
  return hashContent(content)
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

function skillSourceRoot(root, variant, skill, skillSourceDirectory) {
  if (skillSourceDirectory)
    return join(skillSourceDirectory, skill)
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

function runCommand({ args, command, cwd, env = process.env, input, timeoutMs }) {
  return new Promise((resolveRun) => {
    const child = spawn(command, args, { cwd, env, stdio: ['pipe', 'pipe', 'pipe'] })
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

function commandInvocation(command, args) {
  return command.endsWith('.mjs')
    ? { command: process.execPath, args: [command, ...args] }
    : { command, args }
}

function commandVersion(command) {
  const invocation = commandInvocation(command, ['--version'])
  return execFileSync(invocation.command, invocation.args, { encoding: 'utf8' }).trim()
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

function observedSkillReference(workspace, installedSkills, argument) {
  if (typeof workspace !== 'string' || typeof argument !== 'string' || /[*?{}]/u.test(argument))
    return null
  const skillsRoot = resolve(workspace, '.agents', 'skills')
  const target = isAbsolute(argument) ? resolve(argument) : resolve(workspace, argument)
  const relativePath = relative(skillsRoot, target)
  if (!relativePath || relativePath.startsWith('..') || isAbsolute(relativePath))
    return null
  const parts = relativePath.split(sep)
  if (parts.length < 3 || !installedSkills.has(parts[0]) || parts[1] !== 'references')
    return null
  if (!existsSync(target))
    return null
  const stats = lstatSync(target)
  if (stats.isSymbolicLink() || !stats.isFile())
    return null
  return parts.join('/')
}

function observedSkillReferenceReads(command, workspace, installedSkills) {
  const readCommands = new Set(['cat', 'head', 'nl', 'sed', 'tail', 'wc'])
  const observed = []
  for (const argv of unwrapShellCommands(command)) {
    const executable = executableArgv(argv)
    if (!readCommands.has(basename(executable[0] ?? '')))
      continue
    for (const argument of executable.slice(1)) {
      const path = observedSkillReference(workspace, installedSkills, argument)
      if (path)
        observed.push(path)
    }
  }
  return observed
}

function eventDiagnosticText(event) {
  const values = [
    event?.message,
    event?.error?.code,
    event?.error?.message,
    event?.item?.message,
    event?.item?.error?.code,
    event?.item?.error?.message,
  ].filter(value => typeof value === 'string')
  return values.join(' ')
}

function explicitTransportEvent(event) {
  const structuredStatus = [
    event?.status_code,
    event?.http_status,
    event?.error?.status_code,
    event?.item?.status_code,
    event?.item?.http_status,
  ].some(Number.isInteger)
  const structuredCode = [event?.error?.code, event?.item?.error?.code]
    .some(value => typeof value === 'string' && /^(?:ECONNRESET|ECONNREFUSED|ENOTFOUND|EAI_AGAIN|ETIMEDOUT|rate_limit_exceeded)$/iu.test(value))
  return structuredStatus || structuredCode || ['error', 'request.failed', 'response.failed', 'turn.failed'].includes(event?.type)
}

function transportCategories(event) {
  const text = eventDiagnosticText(event)
  const statuses = [
    event?.status_code,
    event?.http_status,
    event?.error?.status_code,
    event?.item?.status_code,
    event?.item?.http_status,
  ].filter(Number.isInteger)
  const categories = []
  if (statuses.includes(429) || /\b(?:429|rate[ -]?limit|too many requests)\b/iu.test(text))
    categories.push('rate-limit')
  if (statuses.some(status => [408, 504].includes(status)) || /\b(?:408|504|ETIMEDOUT|timeout|timed out|gateway timeout)\b/iu.test(text))
    categories.push('timeout')
  if (statuses.some(status => [502, 503, 504].includes(status)) || /\b(?:502|503|504|bad gateway|service unavailable|upstream unavailable|upstream error)\b/iu.test(text))
    categories.push('gateway')
  if (/\b(?:ECONNRESET|ECONNREFUSED|ENOTFOUND|EAI_AGAIN|connection reset|connection refused|stream disconnected|network unreachable|socket hang up)\b/iu.test(text))
    categories.push('connection')
  return categories
}

function outputByteLength(item) {
  const value = item?.aggregated_output ?? item?.output ?? item?.result ?? item?.content ?? item?.agents_states
  if (value === undefined || value === null)
    return 0
  try {
    return Buffer.byteLength(typeof value === 'string' ? value : JSON.stringify(value))
  }
  catch {
    return 0
  }
}

export function summarizeManagedControllerEvents(raw, { installedSkills = [], workspace } = {}) {
  const forbiddenActions = { force_push: 0, publication: 0, push: 0 }
  const lifecycleCounts = {
    admission_count: null,
    delivery_count: null,
    dispatch_count: null,
    interrupt_count: null,
    release_count: null,
    settlement_count: null,
    wait_count: null,
  }
  const lifecycleOrder = []
  const observedResources = new Set()
  const installedSkillNames = new Set(installedSkills)
  let resourceObservationAvailable = false
  let modelInvocations = null
  let retryCount = 0
  let toolOutputBytes = 0
  let toolCalls = 0
  let usage = null
  const infrastructureCategories = new Set()
  const workerReceipts = new Map()
  for (const [eventIndex, line] of raw.split('\n').filter(Boolean).entries()) {
    try {
      const event = JSON.parse(line)
      if (['api.request.started', 'model.request.started', 'model.started'].includes(event.type))
        modelInvocations = (modelInvocations ?? 0) + 1
      if (explicitTransportEvent(event)) {
        const diagnosticText = eventDiagnosticText(event)
        if (/\b(?:retrying|retry attempt|will retry)\b/iu.test(diagnosticText))
          retryCount += 1
        for (const category of transportCategories(event))
          infrastructureCategories.add(category)
      }
      if (event.type === 'item.completed' && ['collab_tool_call', 'command_execution', 'mcp_tool_call', 'tool_call'].includes(event.item?.type)) {
        toolCalls += 1
        toolOutputBytes += outputByteLength(event.item)
        if (event.item?.type === 'command_execution' && typeof event.item.command === 'string') {
          resourceObservationAvailable = true
          if ((event.item.status === undefined || event.item.status === 'completed')
            && (event.item.exit_code === undefined || event.item.exit_code === 0)) {
            for (const path of observedSkillReferenceReads(event.item.command, workspace, installedSkillNames))
              observedResources.add(path)
          }
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
      if (event.type === 'item.completed' && ['collab_tool_call', 'mcp_tool_call', 'tool_call'].includes(event.item?.type)) {
        const toolName = managedWorkerToolName(event.item)
        const phase = managedWorkerToolPhase(toolName, event.item)
        const settledMessages = phase === 'wait' ? managedWorkerSettledMessages(event.item) : []
        if (phase && managedWorkerRuntimeUnavailable(phase, event.item))
          infrastructureCategories.add('worker-runtime-unavailable')
        if (phase && managedWorkerPhaseObserved(phase, event.item)) {
          const phaseCount = phase === 'dispatch' && Array.isArray(event.item.receiver_thread_ids)
            ? event.item.receiver_thread_ids.length
            : 1
          observeLifecyclePhase(lifecycleCounts, lifecycleOrder, phase, toolName, eventIndex, phaseCount)
          if (phase === 'delivery' && managedWorkerAdmissionObserved(event.item))
            observeLifecyclePhase(lifecycleCounts, lifecycleOrder, 'admission', toolName, eventIndex)
          if (phase === 'wait' && managedWorkerSettlementObserved(event.item))
            observeLifecyclePhase(lifecycleCounts, lifecycleOrder, 'settlement', toolName, eventIndex, Math.max(settledMessages.length, 1))
        }
        if (phase === 'wait') {
          for (const settled of settledMessages)
            workerReceipts.set(settled.worker_id, parseManagedWorkerReceipt(settled))
        }
      }
      if (event.type === 'turn.completed' && event.usage)
        usage = event.usage
    }
    catch {}
  }
  const workerLifecycle = {
    ...lifecycleCounts,
    order: lifecycleOrder,
    omissions: Object.entries(lifecycleCounts)
      .filter(([, count]) => count === null)
      .map(([field]) => `${field.replaceAll('_', ' ')} is unavailable`),
  }
  return {
    forbidden_actions: forbiddenActions,
    infrastructure: {
      categories: [...infrastructureCategories].sort(),
      retry_count: retryCount,
      status: infrastructureCategories.size > 0 ? 'contaminated' : 'no-contamination-observed',
    },
    model_invocations: modelInvocations,
    observed_resources: resourceObservationAvailable ? [...observedResources].sort() : null,
    tool_calls: toolCalls,
    tool_output_bytes: toolOutputBytes,
    usage,
    worker_lifecycle: workerLifecycle,
    worker_receipts: [...workerReceipts.values()].sort((left, right) => left.worker_id.localeCompare(right.worker_id)),
  }
}

function managedWorkerSettledMessages(item) {
  const states = item.agents_states
    ?? item.result?.agents_states
    ?? item.output?.agents_states
    ?? item.structuredContent?.agents_states
    ?? item.structured_content?.agents_states
  if (!states || typeof states !== 'object' || Array.isArray(states))
    return []
  return Object.entries(states)
    .filter(([, state]) => state && typeof state === 'object'
      && ['completed', 'failed', 'errored', 'cancelled', 'canceled'].includes(String(state.status ?? '').toLowerCase()))
    .map(([workerId, state]) => ({
      message: typeof state.message === 'string' ? state.message : '',
      worker_id: workerId,
    }))
}

function parseManagedWorkerReceipt({ message, worker_id: workerId }) {
  const line = message.split(/\r?\n/u).find(candidate => candidate.startsWith(WORKER_RECEIPT_PREFIX))
  if (!line)
    return { worker_id: workerId, status: 'missing', receipt: null, error: 'structured WorkerReceipt is missing' }
  try {
    const receipt = JSON.parse(line.slice(WORKER_RECEIPT_PREFIX.length))
    if (!receipt || typeof receipt !== 'object' || Array.isArray(receipt))
      throw new Error('WorkerReceipt must be one JSON object')
    return { worker_id: workerId, status: 'parsed', receipt, error: null }
  }
  catch (error) {
    return { worker_id: workerId, status: 'invalid', receipt: null, error: error instanceof Error ? error.message : String(error) }
  }
}

function managedWorkerToolName(item) {
  const candidate = item.name ?? item.tool_name ?? (typeof item.tool === 'string' ? item.tool : item.tool?.name) ?? item.function?.name
  if (typeof candidate !== 'string' || candidate.length === 0)
    return null
  const qualified = candidate.split(/[/:.]/u).filter(Boolean).at(-1) ?? candidate
  return qualified.split('__').filter(Boolean).at(-1)?.toLowerCase() ?? null
}

function managedWorkerToolPhase(toolName, item) {
  if (['create_agent', 'spawn_agent'].includes(toolName))
    return 'dispatch'
  if (['send_input', 'send_message_to_agent'].includes(toolName)) {
    if (managedWorkerInterruptRequested(item))
      return 'interrupt'
    return 'delivery'
  }
  if (['wait', 'wait_agent', 'wait_agents'].includes(toolName))
    return 'wait'
  if (toolName === 'interrupt_agent')
    return 'interrupt'
  if (toolName === 'close_agent')
    return 'release'
  return null
}

function managedWorkerToolEvidence(item) {
  const evidence = item.structuredContent ?? item.structured_content ?? item.result ?? item.output ?? item.content ?? item.agents_states
  try {
    return JSON.stringify(evidence ?? null)
  }
  catch {
    return String(evidence ?? '')
  }
}

function managedWorkerToolSucceeded(item) {
  return !item.error && !['failed', 'errored', 'cancelled', 'canceled'].includes(String(item.status ?? '').toLowerCase())
}

function managedWorkerRuntimeUnavailable(phase, item) {
  if (!['delivery', 'dispatch', 'wait'].includes(phase) || managedWorkerToolSucceeded(item))
    return false
  if (phase === 'dispatch'
    && item.type === 'collab_tool_call'
    && ['failed', 'errored'].includes(String(item.status ?? '').toLowerCase())
    && Array.isArray(item.receiver_thread_ids)
    && item.receiver_thread_ids.length === 0) {
    return true
  }
  return hasManagedWorkerRuntimeUnavailableCategory(
    item.error ?? item.structuredContent ?? item.structured_content ?? item.result ?? item.output ?? item.content,
  )
}

function hasManagedWorkerRuntimeUnavailableCategory(value) {
  if (Array.isArray(value))
    return value.some(hasManagedWorkerRuntimeUnavailableCategory)
  if (!value || typeof value !== 'object')
    return false
  return Object.entries(value).some(([key, nested]) => {
    if (['category', 'code', 'reason', 'status', 'type'].includes(key.toLowerCase())
      && typeof nested === 'string'
      && /^(?:runtime[_ -]?unavailable|unavailable|worker[_ -]?(?:runtime[_ -]?)?unavailable)$/iu.test(nested)) {
      return true
    }
    return hasManagedWorkerRuntimeUnavailableCategory(nested)
  })
}

function managedWorkerToolArguments(item) {
  const candidate = item.arguments ?? item.args ?? item.input ?? item.parameters
  if (typeof candidate !== 'string')
    return candidate
  try {
    return JSON.parse(candidate)
  }
  catch {
    return candidate
  }
}

function managedWorkerInterruptRequested(item) {
  const value = managedWorkerToolArguments(item)
  return Boolean(value && typeof value === 'object' && value.interrupt === true)
}

function managedWorkerPhaseObserved(phase, item) {
  if (!managedWorkerToolSucceeded(item))
    return false
  if (phase === 'dispatch' && Array.isArray(item.receiver_thread_ids) && item.receiver_thread_ids.length > 0)
    return true
  const evidence = managedWorkerToolEvidence(item)
  if (phase === 'dispatch')
    return /(?:agent|worker|session)[_-]?id/iu.test(evidence) || /\b(?:created|running)\b/iu.test(evidence)
  if (phase === 'release')
    return evidence !== 'null' && evidence !== 'undefined'
  return true
}

function managedWorkerAdmissionObserved(item) {
  if (!managedWorkerToolSucceeded(item))
    return false
  const evidence = item.structuredContent ?? item.structured_content ?? item.result ?? item.output ?? item.content
  return hasManagedWorkerAdmission(evidence)
}

function hasManagedWorkerAdmission(value) {
  if (Array.isArray(value))
    return value.some(hasManagedWorkerAdmission)
  if (value && typeof value === 'object') {
    return Object.entries(value).some(([key, nested]) => {
      const normalized = key.toLowerCase()
      if (['accepted', 'admitted'].includes(normalized) && nested === true)
        return true
      if (normalized === 'status' && typeof nested === 'string' && ['accepted', 'admitted', 'running'].includes(nested.toLowerCase()))
        return true
      return hasManagedWorkerAdmission(nested)
    })
  }
  if (typeof value !== 'string')
    return false
  try {
    return hasManagedWorkerAdmission(JSON.parse(value))
  }
  catch {
    return /\b(?:accepted|admitted|running)\b/iu.test(value)
  }
}

function managedWorkerSettlementObserved(item) {
  const evidence = managedWorkerToolEvidence(item)
  return /(?:"status"\s*:\s*"|\bstatus\s*[=:]\s*)(?:completed|failed|cancelled|canceled|errored|done|settled)\b/iu.test(evidence)
    || /"(?:completed|errored)"\s*:/iu.test(evidence)
}

function observeLifecyclePhase(counts, order, phase, tool, eventIndex, count = 1) {
  const field = `${phase}_count`
  counts[field] = (counts[field] ?? 0) + count
  order.push({ event_index: eventIndex, phase, tool })
}

export function projectManagedControllerEvaluationEvidence({
  durationMs,
  events,
  expectedResources,
  receipt,
  result,
  output,
  unauthorizedPaths,
  workerCompliance,
}) {
  const projected = projectSkillEvaluationObservability({
    elapsedMs: durationMs,
    expectedResources,
    modelInvocations: events.model_invocations,
    outcome: result,
    observedResources: events.observed_resources,
    outputContract: output,
    receiptObservations: null,
    toolCalls: events.tool_calls,
    toolOutputBytes: events.tool_output_bytes,
    unauthorizedPaths,
    usage: events.usage,
  })
  const workerFailed = workerCompliance?.status === 'failed'
  const observability = {
    ...projected,
    dimensions: {
      ...projected.dimensions,
      compliance: workerFailed
        ? { status: 'failed', evidence: {
            ...projected.dimensions.compliance.evidence,
            worker_assignments: workerCompliance,
          } }
        : projected.dimensions.compliance,
      boundary: workerFailed
        ? { status: 'failed', evidence: {
            ...(projected.dimensions.boundary.evidence ?? {}),
            worker_assignment_violations: workerCompliance.violations,
          } }
        : projected.dimensions.boundary,
    },
    host_observed: { worker_lifecycle: events.worker_lifecycle },
    worker_compliance: workerCompliance
      ? {
          ...workerCompliance,
          recovered_product_result: workerFailed && result === 'passed',
        }
      : null,
  }
  const agentReported = receipt
    ? {
        evaluation_receipt: {
          case_id: receipt.case_id,
          composition_sha256: receipt.composition_sha256,
          contract_sha256: receipt.contract_sha256,
          receipt_sha256: hashSkillEvaluationValue(receipt),
        },
        observations: receipt.observations,
      }
    : null
  return { agent_reported: agentReported, observability }
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

function parseCommitMessage(message) {
  const lines = message.replaceAll('\r\n', '\n').trimEnd().split('\n')
  const subject = lines.shift() ?? ''
  let trailerStart = lines.length
  const parsedTrailers = []
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    const line = lines[index]
    if (line.trim() === '')
      break
    const match = line.match(/^([a-z0-9-]+(?: [a-z0-9-]+)*):/i)
    if (!match)
      break
    trailerStart = index
    parsedTrailers.unshift({ key: match[1], value: line.slice(match[0].length).trimStart() })
  }
  const hasTrailerBlock = parsedTrailers.length > 0
    && (trailerStart === 0 || lines[trailerStart - 1]?.trim() === '')
  const bodyLines = hasTrailerBlock ? lines.slice(0, trailerStart) : lines
  while (bodyLines[0]?.trim() === '')
    bodyLines.shift()
  while (bodyLines.at(-1)?.trim() === '')
    bodyLines.pop()
  return {
    body: bodyLines.join('\n'),
    message: message.trimEnd(),
    subject,
    trailers: hasTrailerBlock ? parsedTrailers : [],
  }
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
  const commits = gitLines(workspace, ['log', '--format=%H', `${baseSha}..HEAD`]).map((sha) => {
    const parsed = parseCommitMessage(git(workspace, ['show', '--no-patch', '--format=%B', sha]))
    const paths = gitLines(workspace, ['diff-tree', '--root', '--no-commit-id', '--name-only', '-r', sha])
    return { ...parsed, paths, sha }
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
  return join(root, 'evaluation', 'managed-controller', 'fixtures')
}

function holdoutFixtures(root) {
  return join(root, 'evaluation', 'managed-controller', 'holdout')
}

function contractSources(root, item) {
  if (!item.sources) {
    const path = join(item.skill_variant === 'product' ? productRoot(root) : candidateRoot(root), 'SKILL.md')
    assertSafeFile(root, path, `${item.id} legacy skill source`)
    return [path]
  }
  assertStringArray(item.sources, `${item.id}.sources`)
  if ('skill_variant' in item)
    throw new Error(`${item.id} cannot combine sources with skill_variant`)
  if (new Set(item.sources).size !== item.sources.length)
    throw new Error(`${item.id}.sources must not contain duplicates`)
  return item.sources.map((source) => {
    if (isAbsolute(source))
      throw new Error(`${item.id}.sources must be root-relative`)
    const path = resolve(root, source)
    assertContained(root, path, `${item.id} source ${source}`)
    const repositoryPath = relative(root, path)
    const changesPath = join('.rsp', 'changes')
    if (repositoryPath === changesPath || repositoryPath.startsWith(`${changesPath}${sep}`))
      throw new Error(`${item.id}.sources must not reference lifecycle-transient .rsp/changes files`)
    assertSafeFile(root, path, `${item.id} source ${source}`)
    return path
  })
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
      if ('skill_variant' in item && !['candidate', 'product'].includes(item.skill_variant))
        throw new Error(`${item.id}.skill_variant must be candidate or product`)
      contractSources(root, item)
      return item
    })
}

export function evaluateManagedController(root) {
  return loadManagedControllerCases(root).map((item) => {
    const bodies = contractSources(root, item).map(path => readFileSync(path, 'utf8'))
    const missing = item.required_contract.filter(fragment => !bodies.some(body => body.includes(fragment)))
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
  if ('initial_commit_message' in manifest && (typeof manifest.initial_commit_message !== 'string' || manifest.initial_commit_message.length === 0))
    throw new Error(`${caseId}.initial_commit_message must be a non-empty string`)
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
  if (manifest.worker_assignments) {
    if (!Array.isArray(manifest.worker_assignments) || manifest.worker_assignments.length === 0)
      throw new Error(`${caseId}.worker_assignments must be a non-empty array`)
    const assignmentIds = new Set()
    for (const [index, assignment] of manifest.worker_assignments.entries()) {
      if (!assignment || typeof assignment !== 'object' || !CASE_ID.test(assignment.id ?? ''))
        throw new Error(`${caseId}.worker_assignments[${index}].id must be a valid id`)
      if (assignmentIds.has(assignment.id))
        throw new Error(`${caseId}.worker_assignments contains duplicate id ${assignment.id}`)
      assignmentIds.add(assignment.id)
      assertStringArray(assignment.allowed_changes, `${caseId}.worker_assignments[${index}].allowed_changes`)
      assertStringArray(assignment.allowed_commands, `${caseId}.worker_assignments[${index}].allowed_commands`)
    }
    if (manifest.provider_expectations
      && (manifest.provider_expectations.worker_dispatch_count.min !== manifest.worker_assignments.length
        || manifest.provider_expectations.worker_dispatch_count.max !== manifest.worker_assignments.length)) {
      throw new Error(`${caseId}.worker_assignments must match the exact provider worker dispatch count`)
    }
  }
  if (manifest.manager_only_changes)
    assertStringArray(manifest.manager_only_changes, `${caseId}.manager_only_changes`)
  if (manifest.manager_only_commands)
    assertStringArray(manifest.manager_only_commands, `${caseId}.manager_only_commands`)
  if (manifest.installed_skills)
    assertStringArray(manifest.installed_skills, `${caseId}.installed_skills`)
  if (manifest.expected_resources) {
    assertStringArray(manifest.expected_resources, `${caseId}.expected_resources`)
    const installedSkills = new Set(manifest.installed_skills ?? ['rsp-manage'])
    for (const path of manifest.expected_resources) {
      const parts = path.split('/')
      if (parts.length < 3 || !installedSkills.has(parts[0]) || parts[1] !== 'references'
        || parts.some(part => part.length === 0 || part === '.' || part === '..')) {
        throw new Error(`${caseId}.expected_resources must contain installed Skill reference paths`)
      }
      const skillRoot = join(root, 'skills', parts[0])
      const referencePath = join(root, 'skills', ...parts)
      assertContained(skillRoot, referencePath, `${caseId}.expected_resources`)
      if (!existsSync(referencePath))
        throw new Error(`${caseId}.expected_resources names a missing Skill reference: ${path}`)
      assertSafeFile(skillRoot, referencePath, `${caseId}.expected_resources ${path}`)
    }
  }
  if (manifest.sandbox && !['workspace-write', 'danger-full-access'].includes(manifest.sandbox))
    throw new Error(`${caseId}.sandbox must be workspace-write or danger-full-access`)
  for (const field of ['verification', 'expected_output', 'forbidden_output'])
    assertStringArray(manifest[field], `${caseId}.${field}`)
  if (manifest.commit_message) {
    const contract = manifest.commit_message
    if (!Number.isInteger(contract.count) || contract.count < 1)
      throw new Error(`${caseId}.commit_message.count must be a positive integer`)
    if (typeof contract.subject_pattern !== 'string' || contract.subject_pattern.length === 0)
      throw new Error(`${caseId}.commit_message.subject_pattern must be a non-empty string`)
    try {
      new RegExp(contract.subject_pattern, 'u').test('')
    }
    catch {
      throw new Error(`${caseId}.commit_message.subject_pattern must be a valid regular expression`)
    }
    if (contract.subject_language !== 'english')
      throw new Error(`${caseId}.commit_message.subject_language must be english`)
    if (!Number.isInteger(contract.body_bullets_min) || !Number.isInteger(contract.body_bullets_max)
      || contract.body_bullets_min < 0 || contract.body_bullets_max < contract.body_bullets_min) {
      throw new Error(`${caseId}.commit_message body bullet bounds are invalid`)
    }
    if (!contract.required_trailers || typeof contract.required_trailers !== 'object' || Array.isArray(contract.required_trailers))
      throw new Error(`${caseId}.commit_message.required_trailers must be a mapping`)
  }
  if (manifest.continuation_contract) {
    const contract = manifest.continuation_contract
    assertStringArray(contract.ordered_fields, `${caseId}.continuation_contract.ordered_fields`)
    assertStringArray(contract.recovery_evidence, `${caseId}.continuation_contract.recovery_evidence`)
    const canonicalFields = ['WorkRef', 'Authority', 'Current state', 'Changed artifacts', 'Fresh verification', 'Blockers', 'Next action']
    if (JSON.stringify(contract.ordered_fields) !== JSON.stringify(canonicalFields))
      throw new Error(`${caseId}.continuation_contract.ordered_fields must use the canonical seven-field order`)
  }
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
    expected_missing: manifest.expected_output.filter(fragment => !includesManagedControllerOutputFragment(normalized, fragment)),
    forbidden_present: manifest.forbidden_output.filter(fragment => includesForbiddenManagedControllerOutputFragment(normalized, fragment)),
  }
}

function includesManagedControllerOutputFragment(normalized, fragment) {
  return managedControllerOutputFragmentPositions(normalized, fragment).length > 0
}

function includesForbiddenManagedControllerOutputFragment(normalized, fragment) {
  return managedControllerOutputFragmentPositions(normalized, fragment)
    .some(position => !managedControllerFragmentIsNegated(normalized, position))
}

function managedControllerOutputFragmentPositions(normalized, fragment) {
  const normalizedFragment = fragment.toLowerCase()
  const positions = []
  let position = normalized.indexOf(normalizedFragment)
  while (position >= 0) {
    positions.push(position)
    position = normalized.indexOf(normalizedFragment, position + normalizedFragment.length)
  }

  const canonicalField = normalizedFragment.match(/^([^`\r\n]+?:\s*)([a-z0-9][a-z0-9_-]*)$/u)
  if (canonicalField) {
    const [, prefix, value] = canonicalField
    const pattern = new RegExp(`${escapeRegExp(prefix)}\`${escapeRegExp(value)}\``, 'gu')
    for (const match of normalized.matchAll(pattern))
      positions.push(match.index)
  }

  return [...new Set(positions)]
}

function managedControllerFragmentIsNegated(normalized, position) {
  const lineStart = normalized.lastIndexOf('\n', position - 1) + 1
  const prefix = normalized.slice(lineStart, position).trimStart()
  return /^(?:[-*]\s*)?no\b/u.test(prefix)
    && !/[.;:!?]/u.test(prefix)
    && !/\b(?:but|except|however)\b/u.test(prefix)
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export function scoreManagedRecoveryOutput(manifest, final) {
  const contract = manifest.continuation_contract
  if (!contract)
    return null
  const fieldPositions = contract.ordered_fields.map((field) => {
    const matches = [...final.matchAll(new RegExp(`(?:^|\\n)\\s*(?:[-*]\\s*)?${escapeRegExp(field)}\\s*[:：]`, 'gimu'))]
    return { count: matches.length, field, position: matches[0]?.index ?? -1 }
  })
  const missingFields = fieldPositions.filter(item => item.position < 0).map(item => item.field)
  const duplicateFields = fieldPositions.filter(item => item.count > 1).map(item => item.field)
  const presentPositions = fieldPositions.map(item => item.position)
  const orderedFields = missingFields.length === 0 && duplicateFields.length === 0
    && presentPositions.every((position, index) => index === 0 || position > presentPositions[index - 1])
  const recoveryEvidenceMatch = /(?:^|\n)\s*(?:[-*]\s*)?Recovery evidence\s*[:：]([^\n]*)/iu.exec(final)
  const normalizedRecoveryEvidence = (recoveryEvidenceMatch?.[1] ?? '').toLowerCase()
  const missingRecoveryEvidence = contract.recovery_evidence.filter(token => !normalizedRecoveryEvidence.includes(token.toLowerCase()))
  const recoveryEvidenceLine = recoveryEvidenceMatch !== null
  return {
    duplicate_fields: duplicateFields,
    missing_fields: missingFields,
    missing_recovery_evidence: missingRecoveryEvidence,
    ordered_fields: orderedFields,
    passed: orderedFields && recoveryEvidenceLine && missingRecoveryEvidence.length === 0,
    recovery_evidence_line: recoveryEvidenceLine,
  }
}

export function rescoreManagedControllerArtifact(manifest, metadata, final) {
  const output = scoreManagedControllerOutput(manifest, final)
  const recovery = scoreManagedRecoveryOutput(manifest, final)
  const hashMatches = typeof metadata.final_hash === 'string'
    && hashManagedControllerArtifact(final) === metadata.final_hash
  return {
    hash_matches: hashMatches,
    output,
    recovery,
    result: hashMatches
      && output.expected_missing.length === 0
      && output.forbidden_present.length === 0
      && (recovery?.passed ?? true)
      ? 'passed'
      : 'failed',
  }
}

function scoreCommitMessage(contract, commits = []) {
  if (!contract)
    return null
  const errors = []
  if (commits.length !== contract.count)
    errors.push(`expected ${contract.count} commit(s), observed ${commits.length}`)
  for (const [index, commit] of commits.entries()) {
    if (!new RegExp(contract.subject_pattern, 'u').test(commit.subject))
      errors.push(`commit ${index + 1} subject does not match ${contract.subject_pattern}`)
    if (contract.subject_language === 'english' && /[\u3400-\u9FFF]/u.test(commit.subject))
      errors.push(`commit ${index + 1} subject is not English`)
    const bullets = commit.body.split('\n').filter(line => /^\s*[-*]\s+\S/u.test(line)).length
    if (bullets < contract.body_bullets_min || bullets > contract.body_bullets_max)
      errors.push(`commit ${index + 1} body has ${bullets} bullets`)
    for (const [key, value] of Object.entries(contract.required_trailers)) {
      if (!commit.trailers.some(trailer => trailer.key === key && trailer.value === value))
        errors.push(`commit ${index + 1} is missing ${key}: ${value}`)
    }
  }
  return { errors, passed: errors.length === 0 }
}

function matchesAuthorizedPath(pattern, path) {
  const escaped = pattern
    .split('{date}')
    .map(fragment => fragment.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    .join('\\d{4}-\\d{2}-\\d{2}')
  return new RegExp(`^${escaped}$`).test(path)
}

function workerReceiptVerificationCommands(receipt) {
  if (!Array.isArray(receipt?.verification))
    return null
  const commands = []
  for (const item of receipt.verification) {
    if (!item || typeof item !== 'object' || typeof item.command !== 'string' || item.command.length === 0)
      return null
    commands.push(item.command)
  }
  return commands
}

function validWorkerReceiptShape(receipt) {
  return receipt
    && typeof receipt === 'object'
    && typeof receipt.assignment === 'string'
    && receipt.assignment.length > 0
    && typeof receipt.result === 'string'
    && receipt.result.length > 0
    && Array.isArray(receipt.changed_paths)
    && receipt.changed_paths.every(path => typeof path === 'string' && path.length > 0)
    && workerReceiptVerificationCommands(receipt) !== null
    && ['changed', 'unchanged'].includes(receipt.boundary)
    && ['invalid', 'unavailable', 'valid'].includes(receipt.evidence_status)
    && ['released', 'retained', 'unavailable'].includes(receipt.release_claim)
}

export function scoreManagedWorkerAssignments(manifest, events) {
  const assignments = manifest.worker_assignments
  if (!Array.isArray(assignments) || assignments.length === 0) {
    return {
      status: 'not-required',
      evidence_source: 'host-lifecycle-and-worker-claim',
      expected_dispatch_count: 0,
      host_dispatch_count: events.worker_lifecycle?.dispatch_count ?? null,
      receipt_rejection_count: 0,
      violations: [],
    }
  }

  const violations = []
  const invalidAssignments = new Set()
  const acceptedAssignments = new Set()
  let unassignedMissingClaims = 0
  let unexpectedRejectedReceipts = 0
  const expectedDispatchCount = assignments.length
  const knownAssignments = new Set(assignments.map(assignment => assignment.id))
  const hostDispatchCount = events.worker_lifecycle?.dispatch_count ?? null
  if (hostDispatchCount !== expectedDispatchCount) {
    violations.push({
      assignment: null,
      kind: 'host-dispatch-count',
      value: hostDispatchCount,
      expected: expectedDispatchCount,
    })
  }

  const claims = Array.isArray(events.worker_receipts) ? events.worker_receipts : []
  const parsedByAssignment = new Map()
  for (const claim of claims) {
    if (claim.status !== 'parsed' || !validWorkerReceiptShape(claim.receipt)) {
      const assignment = typeof claim.receipt?.assignment === 'string' ? claim.receipt.assignment : null
      violations.push({ assignment, kind: claim.status === 'missing' ? 'missing-receipt' : 'invalid-receipt', value: claim.error ?? null })
      if (assignment && knownAssignments.has(assignment))
        invalidAssignments.add(assignment)
      else if (assignment)
        unexpectedRejectedReceipts += 1
      else
        unassignedMissingClaims += 1
      continue
    }
    const assignment = claim.receipt.assignment
    if (parsedByAssignment.has(assignment)) {
      violations.push({ assignment, kind: 'duplicate-receipt', value: claim.worker_id })
      invalidAssignments.add(assignment)
      continue
    }
    parsedByAssignment.set(assignment, claim.receipt)
  }

  for (const assignment of assignments) {
    const receipt = parsedByAssignment.get(assignment.id)
    if (!receipt) {
      if (unassignedMissingClaims > 0)
        unassignedMissingClaims -= 1
      else if (!violations.some(violation => violation.assignment === assignment.id && ['invalid-receipt', 'missing-receipt'].includes(violation.kind)))
        violations.push({ assignment: assignment.id, kind: 'missing-receipt', value: null })
      invalidAssignments.add(assignment.id)
      continue
    }
    const assignmentViolations = []
    for (const path of receipt.changed_paths) {
      if ((manifest.manager_only_changes ?? []).some(pattern => matchesAuthorizedPath(pattern, path)))
        assignmentViolations.push({ assignment: assignment.id, kind: 'manager-only-path', value: path })
      else if (!assignment.allowed_changes.some(pattern => matchesAuthorizedPath(pattern, path)))
        assignmentViolations.push({ assignment: assignment.id, kind: 'unauthorized-worker-path', value: path })
    }
    for (const command of workerReceiptVerificationCommands(receipt)) {
      if ((manifest.manager_only_commands ?? []).includes(command))
        assignmentViolations.push({ assignment: assignment.id, kind: 'manager-only-command', value: command })
      else if (!assignment.allowed_commands.includes(command))
        assignmentViolations.push({ assignment: assignment.id, kind: 'unauthorized-worker-command', value: command })
    }
    if (receipt.boundary !== 'unchanged')
      assignmentViolations.push({ assignment: assignment.id, kind: 'changed-boundary', value: receipt.boundary })
    if (receipt.evidence_status !== 'valid')
      assignmentViolations.push({ assignment: assignment.id, kind: 'invalid-evidence', value: receipt.evidence_status })
    if (assignmentViolations.length > 0)
      invalidAssignments.add(assignment.id)
    else if (!invalidAssignments.has(assignment.id))
      acceptedAssignments.add(assignment.id)
    violations.push(...assignmentViolations)
  }

  for (const assignment of parsedByAssignment.keys()) {
    if (!knownAssignments.has(assignment)) {
      violations.push({ assignment, kind: 'unexpected-receipt', value: assignment })
      unexpectedRejectedReceipts += 1
    }
  }

  return {
    status: violations.length === 0 ? 'passed' : 'failed',
    evidence_source: 'host-lifecycle-and-worker-claim',
    expected_dispatch_count: expectedDispatchCount,
    host_dispatch_count: hostDispatchCount,
    receipt_rejection_count: assignments.filter(assignment => !acceptedAssignments.has(assignment.id)).length + unexpectedRejectedReceipts,
    violations,
  }
}

export function scoreManagedControllerObservation(manifest, observation, { workerComplianceEnforcement = 'required' } = {}) {
  const unauthorizedPaths = observation.changed_paths.filter(path => !manifest.allowed_changes.some(pattern => matchesAuthorizedPath(pattern, path)))
  const missingRequiredPaths = (manifest.required_changes ?? []).filter(pattern => !observation.changed_paths.some(path => matchesAuthorizedPath(pattern, path)))
  const output = scoreManagedControllerOutput(manifest, observation.final)
  const recovery = scoreManagedRecoveryOutput(manifest, observation.final)
  const commitMessage = scoreCommitMessage(manifest.commit_message, observation.commits)
  const verificationAccepted = (manifest.expected_mode ?? 'execute') === 'decline'
    ? observation.changed_paths.length === 0
    : observation.verification_passed
  const forbidden = observation.forbidden_actions
  const productPassed = observation.exit_code === 0
    && !observation.timed_out
    && unauthorizedPaths.length === 0
    && missingRequiredPaths.length === 0
    && verificationAccepted
    && output.expected_missing.length === 0
    && output.forbidden_present.length === 0
    && (recovery?.passed ?? true)
    && forbidden.force_push === 0
    && forbidden.publication === 0
    && forbidden.push === 0
    && (!manifest.local_bare_remote || observation.remote_refs_unchanged)
    && observation.source_stable
    && (commitMessage?.passed ?? true)
  const productResult = productPassed ? 'passed' : 'failed'
  const workerCompliancePassed = workerComplianceEnforcement === 'diagnostic'
    || observation.worker_compliance?.status !== 'failed'
  const result = productPassed && workerCompliancePassed ? 'passed' : 'failed'
  return {
    ...(commitMessage ? { commit_message: commitMessage } : {}),
    missing_required_paths: missingRequiredPaths,
    output,
    ...(recovery ? { recovery } : {}),
    ...(observation.worker_compliance ? { product_result: productResult } : {}),
    result,
    unauthorized_paths: unauthorizedPaths,
  }
}

export function prepareManagedControllerRun({ caseId, outputRoot, root, skillSourceDirectory, variant }) {
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
      const source = skillSourceRoot(root, variant, skill, skillSourceDirectory)
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
  git(workspace, ['commit', '--quiet', '-m', manifest.initial_commit_message ?? 'fixture base'])
  const baseSha = git(workspace, ['rev-parse', 'HEAD'])
  let remotePath = null
  if (manifest.local_bare_remote) {
    remotePath = mkdtempSync(join(outputRoot, `${caseId}-remote-`))
    git(remotePath, ['init', '--bare', '--quiet'])
    git(workspace, ['remote', 'add', 'origin', remotePath])
    git(workspace, ['push', '--quiet', '--set-upstream', 'origin', 'HEAD'])
  }
  const installedSkills = variant === 'candidate' || variant === 'product' ? manifest.installed_skills ?? ['rsp-manage'] : []
  const sourceComposition = hashManagedControllerComposition(installedSkills.map(name => ({
    name,
    path: skillSourceRoot(root, variant, name, skillSourceDirectory),
  })))
  const installedComposition = hashManagedControllerComposition(installedSkills.map(name => ({ name, path: join(workspace, '.agents', 'skills', name) })))
  const contractSha256 = hashContent(readFileSync(join(directory, 'case.yaml')))
  const remoteRefsBefore = remoteRefs(workspace, manifest.local_bare_remote ? 'origin' : null)
  const receiptIdentity = {
    case_id: caseId,
    composition_sha256: installedComposition.hash,
    contract_sha256: contractSha256,
  }
  const receiptShape = {
    ...receiptIdentity,
    observations: {
      trigger: null,
      first_fix_result: null,
      correction_count: null,
      worker_dispatch_count: null,
    },
  }
  const prompt = [
    variant === 'candidate' || variant === 'product'
      ? manifest.automatic_activation
        ? 'Carry out the requested completion using the project-installed skills and project workflow.'
        : 'Use $rsp-manage installed in this workspace to carry out the request.'
      : 'Carry out the request using your normal repository workflow; no managed-controller skill is installed.',
    manifest.request,
    ...(manifest.continuation_contract
      ? [
          `Return the incomplete continuation with these labels exactly once and in this order: ${manifest.continuation_contract.ordered_fields.join(', ')}.`,
          `Add one Recovery evidence line containing these exact machine tokens after the seven fields: ${manifest.continuation_contract.recovery_evidence.join(', ')}.`,
        ]
      : []),
    `Before the final response, write ${EVALUATION_RECEIPT_PATH} as one JSON object. Use this exact top-level JSON shape: ${JSON.stringify(receiptShape)}.`,
    'Keep case_id, composition_sha256, and contract_sha256 unchanged. Replace only the four observation values with directly observed values. Do not add an identity wrapper or any other key. Trigger is null or {"status":"passed|failed","evidence":<JSON>}; first_fix_result is null, passed, or failed; counts are null or non-negative integers. Do not stage or commit this transient file.',
    ...(manifest.provider_expectations
      ? [`For this provider scenario, when the expected routing is observed, set trigger exactly to ${JSON.stringify({
          status: 'passed',
          evidence: {
            dispatch: manifest.provider_expectations.dispatch,
            mode: manifest.provider_expectations.mode,
            route: manifest.provider_expectations.route,
          },
        })}. Do not place dispatch, mode, or route directly under trigger. Set worker_dispatch_count to the directly observed number; the accepted range is ${manifest.provider_expectations.worker_dispatch_count.min}..${manifest.provider_expectations.worker_dispatch_count.max}.`]
      : []),
    ...(manifest.worker_assignments
      ? [
          `This evaluation has a machine consumer for managed WorkerReceipts. For each settled worker, require exactly one single-line JSON transport prefixed with ${WORKER_RECEIPT_PREFIX}. The JSON object must encode the existing managed-exchange fields as: assignment, result, changed_paths, verification (objects with command, scope, outcome, omissions), boundary, evidence_status, release_claim, and optional worker and independence. Do not infer or repair a missing worker receipt.`,
          `Worker Assignment policy: ${JSON.stringify({
            assignments: manifest.worker_assignments,
            manager_only_changes: manifest.manager_only_changes ?? [],
            manager_only_commands: manifest.manager_only_commands ?? [],
          })}.`,
        ]
      : []),
    'Return a concise final status with completed work, fresh verification, remaining boundary, and next action.',
  ].join('\n\n')
  return { baseSha, contractSha256, installedComposition, manifest, prompt, remotePath, remoteRefsBefore, sourceComposition, workspace }
}

export function normalizeManagedControllerEvaluationReceipt(receipt, providerExpectations) {
  const trigger = receipt?.observations?.trigger
  if (!providerExpectations || !trigger || typeof trigger !== 'object' || Array.isArray(trigger))
    return receipt

  const keys = Object.keys(trigger).sort()
  const expectedEvidence = {
    dispatch: providerExpectations.dispatch,
    mode: providerExpectations.mode,
    route: providerExpectations.route,
  }
  if (JSON.stringify(keys) !== JSON.stringify(['dispatch', 'mode', 'route'])
    || trigger.dispatch !== expectedEvidence.dispatch
    || trigger.mode !== expectedEvidence.mode
    || trigger.route !== expectedEvidence.route) {
    return receipt
  }

  return {
    ...receipt,
    observations: {
      ...receipt.observations,
      trigger: { status: 'passed', evidence: expectedEvidence },
    },
  }
}

function consumeManagedControllerEvaluationReceipt(prepared, required) {
  const path = join(prepared.workspace, EVALUATION_RECEIPT_PATH)
  if (!existsSync(path)) {
    if (required)
      throw new Error(`managed-controller evaluation did not produce ${EVALUATION_RECEIPT_PATH}`)
    return null
  }
  try {
    assertSafeFile(prepared.workspace, path, 'managed-controller evaluation receipt')
    let parsed
    try {
      parsed = JSON.parse(readFileSync(path, 'utf8'))
    }
    catch {
      throw new Error('managed-controller evaluation receipt must contain valid JSON')
    }
    return validateSkillEvaluationReceipt(normalizeManagedControllerEvaluationReceipt(
      parsed,
      prepared.manifest.provider_expectations,
    ), {
      caseId: prepared.manifest.id,
      compositionSha256: prepared.installedComposition.hash,
      contractSha256: prepared.contractSha256,
    })
  }
  finally {
    rmSync(path, { force: true })
  }
}

export async function runManagedControllerEvaluation({ authFile, caseId, codexBin = 'codex', comparisonArm, effort, env = process.env, isolatedUserContext = false, model, modelCatalogJson, openaiBaseUrl, outputRoot, provider, root, skillSourceDirectory, timeoutMs, variant }) {
  if (comparisonArm !== undefined && !['baseline', 'candidate'].includes(comparisonArm))
    throw new Error(`invalid comparison arm: ${comparisonArm}`)
  const workerComplianceEnforcement = comparisonArm === 'baseline' ? 'diagnostic' : 'required'
  const prepared = prepareManagedControllerRun({ caseId, outputRoot, root, skillSourceDirectory, variant })
  const runDirectory = join(outputRoot, 'runs', basename(prepared.workspace))
  mkdirSync(runDirectory, { recursive: true })
  const finalPath = join(runDirectory, 'final.md')
  const eventsPath = join(runDirectory, 'events.jsonl')
  const metadataPath = join(runDirectory, 'metadata.json')
  const sourceRoot = skillSourceDirectory
    ? join(skillSourceDirectory, 'rsp-manage')
    : managedSkillRoot(root, variant)
  const sourceHash = hashTree(sourceRoot)
  const started = new Date()
  if (isolatedUserContext && (!authFile || !openaiBaseUrl || !modelCatalogJson))
    throw new Error('isolated managed-controller evaluation requires authFile, openaiBaseUrl, and modelCatalogJson')
  let isolatedHome = null
  const isolatedConfigArgs = isolatedUserContext
    ? [
        '--config',
        `openai_base_url=${JSON.stringify(openaiBaseUrl)}`,
        '--config',
        `model_catalog_json=${JSON.stringify(resolve(modelCatalogJson))}`,
      ]
    : []
  const mayDispatchWorkers = (prepared.manifest.provider_expectations?.worker_dispatch_count.max ?? 0) > 0
  const args = [
    'exec',
    ...(!mayDispatchWorkers ? ['--ephemeral'] : []),
    ...(isolatedUserContext ? ['--ignore-rules'] : []),
    '--sandbox',
    prepared.manifest.sandbox ?? 'workspace-write',
    '--model',
    model,
    '--config',
    `model_reasoning_effort="${effort}"`,
    ...isolatedConfigArgs,
    ...(provider ? ['--config', `model_provider="${provider}"`] : []),
    '--json',
    '--output-last-message',
    finalPath,
    '--cd',
    prepared.workspace,
    '-',
  ]
  let executed
  try {
    if (isolatedUserContext) {
      isolatedHome = mkdtempSync(join(outputRoot, '.codex-home-'))
      const authSource = resolve(authFile)
      assertSafeFile(dirname(authSource), authSource, 'managed-controller auth file')
      cpSync(authSource, join(isolatedHome, 'auth.json'))
    }
    const invocation = commandInvocation(codexBin, args)
    executed = await runCommand({
      args: invocation.args,
      command: invocation.command,
      cwd: prepared.workspace,
      env: isolatedHome
        ? { ...env, CODEX_HOME: isolatedHome, HOME: isolatedHome }
        : env,
      input: prepared.prompt,
      timeoutMs,
    })
  }
  finally {
    if (isolatedHome)
      rmSync(isolatedHome, { force: true, recursive: true })
  }
  writeFileSync(eventsPath, executed.stdout)
  if (executed.stderr)
    writeFileSync(join(runDirectory, 'stderr.log'), executed.stderr)
  const ended = new Date()
  const durationMs = ended.getTime() - started.getTime()
  const receipt = consumeManagedControllerEvaluationReceipt(prepared, executed.code === 0)
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
  const installedSkills = variant === 'candidate' || variant === 'product' ? prepared.manifest.installed_skills ?? ['rsp-manage'] : []
  const events = summarizeManagedControllerEvents(executed.stdout, {
    installedSkills,
    workspace: prepared.workspace,
  })
  const workerCompliance = scoreManagedWorkerAssignments(prepared.manifest, events)
  const sourceCompositionAfter = hashManagedControllerComposition(installedSkills.map(name => ({
    name,
    path: skillSourceRoot(root, variant, name, skillSourceDirectory),
  })))
  const installedCompositionAfter = hashManagedControllerComposition(installedSkills.map(name => ({ name, path: join(prepared.workspace, '.agents', 'skills', name) })))
  const compositionStable = prepared.sourceComposition.hash === prepared.installedComposition.hash
    && prepared.sourceComposition.hash === sourceCompositionAfter.hash
    && prepared.sourceComposition.hash === installedCompositionAfter.hash
  const score = scoreManagedControllerObservation(prepared.manifest, {
    changed_paths: paths,
    commits: gitObservation.commits,
    exit_code: executed.code,
    final,
    forbidden_actions: events.forbidden_actions,
    remote_refs_unchanged: gitObservation.remote_refs_unchanged,
    source_stable: sourceHash === hashTree(sourceRoot) && compositionStable,
    timed_out: executed.timedOut,
    verification_passed: verification.passed,
    worker_compliance: workerCompliance,
  }, {
    workerComplianceEnforcement,
  })
  const evaluationEvidence = projectManagedControllerEvaluationEvidence({
    durationMs,
    events,
    expectedResources: prepared.manifest.expected_resources,
    receipt,
    result: score.product_result,
    output: score.output,
    unauthorizedPaths: score.unauthorized_paths,
    workerCompliance,
  })
  const { agent_reported: agentReported, observability } = evaluationEvidence
  const metadata = {
    agent_reported: agentReported,
    case_id: caseId,
    contract_sha256: prepared.contractSha256,
    duration_ms: durationMs,
    ended_at: ended.toISOString(),
    events,
    exit_code: executed.code,
    final_hash: hashManagedControllerArtifact(final),
    output: score.output,
    product_result: score.product_result,
    observation_sha256: hashSkillEvaluationValue(observability),
    observability,
    // Retain the legacy beta projection as an explicit absence. Older retained
    // metadata with populated fields remains readable, while new producer
    // claims live only under agent_reported and cannot be mistaken for host evidence.
    evaluation_receipt: null,
    receipt_observations: null,
    ...(score.recovery ? { recovery: score.recovery } : {}),
    paths: { events: eventsPath, final: finalPath, metadata: metadataPath, workspace: prepared.workspace },
    result: score.result,
    ...(score.commit_message ? { commit_message: score.commit_message } : {}),
    settings: { codex: commandVersion(codexBin), effort, isolated_user_context: isolatedUserContext, model, provider: provider ?? null, sandbox: prepared.manifest.sandbox ?? 'workspace-write', timeout_ms: timeoutMs },
    composition: { installed_after: installedCompositionAfter, installed_before: prepared.installedComposition, source_after: sourceCompositionAfter, source_before: prepared.sourceComposition, stable: compositionStable },
    source_hash: sourceHash,
    started_at: started.toISOString(),
    timed_out: executed.timedOut,
    variant,
    verification,
    git: gitObservation,
    worktree: { changed_paths: paths, missing_required_paths: score.missing_required_paths, unauthorized_paths: score.unauthorized_paths },
    worker_compliance: workerCompliance,
    worker_compliance_enforcement: workerComplianceEnforcement,
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
