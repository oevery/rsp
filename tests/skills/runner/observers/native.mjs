import { Buffer } from 'node:buffer'
import { closeSync, constants, fstatSync, lstatSync, openSync, readdirSync, readSync } from 'node:fs'
import { join } from 'node:path'
import { Script } from 'node:vm'
import { literalArgv } from './command-argv.mjs'

const MAX_LOG = 16 * 1024 * 1024
const MAX_TOTAL = 64 * 1024 * 1024
const MAX_ENTRIES = 1024
const messageTypes = new Set(['UserMessage', 'AgentMessage', 'Reasoning', 'Plan', 'TodoList'])
const collabTools = new Set(['spawn_agent', 'send_input', 'resume_agent', 'wait', 'close_agent'])
const identifier = value => typeof value === 'string' && /^[\w.-]{1,200}$/.test(value)
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value)
const quoteArg = value => `'${value.replaceAll('\'', '\'\\\'\'')}'`

function compileFailed(program, output) {
  if (typeof program !== 'string' || !Array.isArray(output)
    || !output[0]?.text?.startsWith('Script failed\n')
    || !output.some(item => item.text?.startsWith('Script error:\nSyntaxError:'))) {
    return false
  }
  try {
    // Compile only; never execute the captured tool program.
    void new Script(`(async () => {\n${program}\n})`)
    return false
  }
  catch (error) {
    return error instanceof SyntaxError
  }
}

/** Collect host facts only, within bounded isolated-home logs; never infer roles. */
export function collectNativeEvidence(home, rootStdout) {
  const reasons = new Set()
  const fail = reason => reasons.add(reason)
  const parse = (raw, label) => {
    if (typeof raw !== 'string' || Buffer.byteLength(raw) > MAX_LOG) {
      fail(`${label}:oversize-or-missing-log`)
      return []
    }
    if (!raw.endsWith('\n'))
      fail(`${label}:truncated-log`)
    const events = []
    for (const line of raw.split('\n')) {
      if (!line.trim())
        continue
      try {
        const event = JSON.parse(line)
        if (!object(event) || typeof event.type !== 'string')
          throw new Error('Invalid event')
        events.push(event)
      }
      catch {
        fail(`${label}:malformed-log`)
      }
    }
    return events
  }
  const rootEvents = parse(rootStdout, 'root')
  const starts = rootEvents.filter(event => event.type === 'thread.started')
  const rootThreadId = starts.length === 1 && identifier(starts[0].thread_id) ? starts[0].thread_id : null
  if (!rootThreadId)
    fail('root:missing-or-ambiguous-thread')
  const logs = new Map()
  let total = 0
  let entries = 0
  function walk(directory, depth = 0) {
    if (depth > 8) {
      fail('sessions:depth-limit')
      return
    }
    try {
      if (lstatSync(directory).isSymbolicLink()) {
        fail('sessions:symlink')
        return
      }
      for (const entry of readdirSync(directory, { withFileTypes: true })) {
        if (++entries > MAX_ENTRIES) {
          fail('sessions:entry-limit')
          return
        }
        const path = join(directory, entry.name)
        if (entry.isSymbolicLink()) {
          fail('sessions:symlink')
        }
        else if (entry.isDirectory()) {
          walk(path, depth + 1)
        }
        else if (entry.name.endsWith('.jsonl')) {
          let fd
          try {
            fd = openSync(path, constants.O_RDONLY | constants.O_NOFOLLOW | constants.O_NONBLOCK)
            const stat = fstatSync(fd)
            total += stat.size
            if (!stat.isFile() || stat.size > MAX_LOG || total > MAX_TOTAL) {
              fail('sessions:oversize-or-nonregular-log')
              continue
            }
            // Read at most the stat size plus one byte, even if a producer is
            // still appending. A moving snapshot cannot certify completeness.
            const buffer = Buffer.alloc(stat.size + 1)
            let bytes = 0
            while (bytes < buffer.length) {
              const count = readSync(fd, buffer, bytes, buffer.length - bytes, null)
              if (!count)
                break
              bytes += count
            }
            if (bytes !== stat.size || fstatSync(fd).size !== stat.size)
              fail('sessions:changing-log')
            const events = parse(buffer.subarray(0, bytes).toString('utf8'), 'session')
            const metas = events.filter(event => event.type === 'session_meta')
            const meta = metas[0]?.payload
            const id = meta?.id ?? meta?.session_id
            // Native v1 children retain the root session_id; id is the thread.
            if (metas.length !== 1 || !identifier(id)) {
              fail('sessions:invalid-identity')
              continue
            }
            if (logs.has(id))
              fail('sessions:duplicate-thread')
            logs.set(id, { meta, events })
          }
          catch {
            fail('sessions:unreadable-log')
          }
          finally {
            if (fd !== undefined)
              closeSync(fd)
          }
        }
      }
    }
    catch {
      fail('sessions:unreadable-directory')
    }
  }
  walk(join(home, 'sessions'))
  const dispatches = []
  const expectedParents = new Map()
  function dispatch(events, actor) {
    const pending = new Map()
    for (const event of events) {
      const item = event.item
      if (item?.type !== 'collab_tool_call')
        continue
      if (!collabTools.has(item.tool)) {
        fail('dispatch:unknown-tool')
        continue
      }
      if (!identifier(item.id) || item.sender_thread_id !== actor || !Array.isArray(item.receiver_thread_ids)
        || item.receiver_thread_ids.some(id => !identifier(id))) {
        fail('dispatch:invalid-attribution')
        continue
      }
      if (event.type !== 'item.completed') {
        pending.set(item.id, item)
        continue
      }
      const receivers = item.receiver_thread_ids.length ? item.receiver_thread_ids : pending.get(item.id)?.receiver_thread_ids ?? []
      pending.delete(item.id)
      if (item.status !== 'completed' || (item.tool === 'spawn_agent' && !receivers.length))
        fail('dispatch:unresolved-call')
      for (const receiver of receivers) {
        dispatches.push({ senderId: actor, receiverId: receiver, tool: item.tool, status: item.status ?? null })
        if (item.tool === 'spawn_agent') {
          if (expectedParents.has(receiver) || receiver === rootThreadId)
            fail('dispatch:duplicate-or-cyclic-child')
          expectedParents.set(receiver, actor)
        }
      }
    }
    if (pending.size)
      fail('dispatch:unresolved-call')
  }
  dispatch(rootEvents, rootThreadId)
  const childEvents = []
  const rootActions = []
  const threads = []
  const usages = []
  const visited = new Set()
  const queue = rootThreadId ? [rootThreadId] : []
  while (queue.length) {
    const id = queue.shift()
    if (visited.has(id))
      continue
    visited.add(id)
    const log = logs.get(id)
    if (!log) {
      fail('thread:missing-session')
      continue
    }
    const { meta, events } = log
    const parentId = meta.source?.subagent?.thread_spawn?.parent_thread_id ?? meta.parent_thread_id ?? null
    if (parentId !== (expectedParents.get(id) ?? null)
      || (meta.parent_thread_id && meta.parent_thread_id !== parentId)) {
      fail('thread:foreign-parent')
    }
    const contexts = events.filter(event => event.type === 'turn_context').map(event => event.payload)
    const models = new Set(contexts.map(context => context?.model))
    const model = models.size === 1 && typeof contexts[0]?.model === 'string' ? contexts[0].model : null
    const efforts = new Set(contexts.map(context => context?.effort))
    const effort = efforts.size === 1 && typeof contexts[0]?.effort === 'string' ? contexts[0].effort : null
    if (!model)
      fail('thread:missing-or-changing-model')
    if (!effort)
      fail('thread:missing-or-changing-effort')
    if (meta.memory_mode !== 'disabled')
      fail('thread:memory-not-disabled')
    if ((meta.multi_agent_version ?? contexts[0]?.multi_agent_version) !== 'v1'
      || contexts.some(context => context?.multi_agent_version !== 'v1')) {
      fail('thread:unverified-native-version')
    }
    let completion = null
    const reports = []
    let usage = null
    const lowered = []
    const commands = []
    const writes = []
    const pendingItems = new Set()
    for (const event of events) {
      const p = event.payload
      if (event.type !== 'event_msg' || !object(p))
        continue
      if (p.type === 'task_started' || p.type === 'turn_aborted')
        completion = null
      if (p.type === 'task_complete') {
        completion = { startedAt: p.started_at ?? null, completedAt: p.completed_at ?? event.timestamp ?? null }
        if (id !== rootThreadId) {
          if (typeof p.last_agent_message === 'string' && p.last_agent_message.trim())
            reports.push({ source: 'worker-statement', turnId: p.turn_id ?? null, completedAt: completion.completedAt, text: p.last_agent_message })
          else
            fail('thread:missing-worker-result')
        }
      }
      if (p.type === 'token_count')
        usage = p.info?.total_token_usage ?? null
      if (!['item_started', 'item_updated', 'item_completed'].includes(p.type))
        continue
      if (p.thread_id !== id)
        fail('item:foreign-actor')
      const item = p.item
      if (!object(item)) {
        fail('item:malformed')
        continue
      }
      if (messageTypes.has(item.type))
        continue
      if (p.type === 'item_completed')
        pendingItems.delete(item.id)
      else
        pendingItems.add(item.id)
      const canonical = {
        type: p.type.replace('_', '.'),
        source_thread_id: id,
        timestamp: event.timestamp ?? null,
        started_at_ms: p.started_at_ms ?? null,
        completed_at_ms: p.completed_at_ms ?? null,
        item: { id: item.id, type: 'unobserved_tool', status: item.status },
      }
      if (item.type === 'CommandExecution') {
        if (!Array.isArray(item.command) || !item.command.length || item.command.some(arg => typeof arg !== 'string')) {
          fail('command:invalid-argv')
        }
        else {
          canonical.item = {
            id: item.id,
            type: 'command_execution',
            command: item.command.map(quoteArg).join(' '),
            argv: item.command,
            status: item.status,
            aggregated_output: item.aggregated_output,
            exit_code: item.exit_code,
            output_truncated: item.output_truncated ?? item.truncated,
          }
          if (p.type === 'item_completed') {
            commands.push(canonical.item.command)
            if (!Number.isInteger(item.exit_code) || typeof item.aggregated_output !== 'string' || item.truncated || item.output_truncated)
              fail('command:incomplete-result')
          }
        }
      }
      else if (item.type === 'FileChange') {
        if (!object(item.changes) || Object.values(item.changes).some(change => !object(change) || typeof change.type !== 'string')) {
          fail('file-change:malformed')
        }
        else {
          canonical.item = { id: item.id, type: 'file_change', status: item.status, changes: Object.entries(item.changes).map(([path, change]) => ({ path, kind: change.type, unified_diff: change.unified_diff, move_path: change.move_path })) }
          if (p.type === 'item_completed')
            writes.push(...canonical.item.changes.flatMap(change => [change.path, ...(change.move_path ? [change.move_path] : [])]))
        }
      }
      else if (item.type === 'CollabAgentToolCall') {
        canonical.item = { id: item.id, type: 'collab_tool_call', tool: item.tool, status: item.status, sender_thread_id: item.sender_thread_id, receiver_thread_ids: item.receiver_thread_ids }
      }
      else {
        fail('item:unknown-tool')
      }
      lowered.push(canonical)
    }
    if (!completion?.completedAt || pendingItems.size)
      fail('thread:unresolved-worker')
    // Native exec envelopes and their inner items have different IDs. Require
    // actual host items within the call/output interval, not claims in output.
    const envelopes = new Map()
    const knownEnvelopes = new Set(['exec', 'exec_command', 'write_stdin', 'apply_patch', ...collabTools])
    const unobserved = (callId, timestamp) => {
      fail('item:unobserved-tool-call')
      lowered.push({ type: 'item.completed', source_thread_id: id, timestamp: timestamp ?? null, item: { id: callId, type: 'unobserved_tool' } })
    }
    for (const event of events) {
      const p = event.payload
      if (event.type === 'response_item' && ['function_call', 'custom_tool_call'].includes(p?.type)) {
        envelopes.set(p.call_id, { known: knownEnvelopes.has(p.name), observed: false, program: p.name === 'exec' ? p.input : null })
        if (p.name === 'exec') {
          // The JavaScript wrapper can contain actions beyond lowered host
          // items. Preserve its program for review; never execute or interpret
          // it here. The adapter redacts executable evidence before persistence.
          lowered.push({ type: 'item.completed', source_thread_id: id, timestamp: event.timestamp ?? null, item: { id: p.call_id, type: 'tool_program', program: p.input } })
          if (typeof p.input !== 'string')
            fail('item:missing-tool-program')
        }
      }
      if (event.type === 'event_msg' && p?.type === 'item_completed' && p.item && !messageTypes.has(p.item.type)) {
        for (const envelope of envelopes.values())
          envelope.observed = true
      }
      if (event.type === 'response_item' && ['function_call_output', 'custom_tool_call_output'].includes(p?.type)) {
        const envelope = envelopes.get(p.call_id)
        if (!envelope?.known || (!envelope.observed && !compileFailed(envelope.program, p.output)))
          unobserved(p.call_id, event.timestamp)
        envelopes.delete(p.call_id)
      }
    }
    for (const callId of envelopes.keys())
      unobserved(callId)
    if (id !== rootThreadId) {
      childEvents.push(...lowered)
      dispatch(lowered, id)
    }
    else {
      rootActions.push(...lowered.filter(event => ['command_execution', 'file_change'].includes(event.item.type)))
      childEvents.push(...lowered.filter(event => ['tool_program', 'unobserved_tool'].includes(event.item.type)))
    }
    threads.push({ id, parentId, model, effort, reports, memoryMode: meta.memory_mode ?? null, completed: Boolean(completion?.completedAt), startedAt: completion?.startedAt ?? meta.timestamp ?? null, completedAt: completion?.completedAt ?? null, commands, writes })
    usages.push(usage)
    for (const child of expectedParents.keys()) {
      if (!visited.has(child))
        queue.push(child)
    }
  }
  for (const id of logs.keys()) {
    if (!visited.has(id))
      fail('sessions:unmatched-thread')
  }
  for (const d of dispatches) {
    if (!expectedParents.has(d.receiverId))
      fail('dispatch:unknown-receiver')
  }
  const usageKeys = usages.length && object(usages[0]) ? Object.keys(usages[0]).sort() : []
  const completeAttribution = ![...reasons].some(reason => /^(?:root:|session|dispatch:|thread:foreign-parent|thread:missing-session)/.test(reason))
  const knownUsage = completeAttribution && logs.size === visited.size && usages.length === visited.size && usageKeys.includes('input_tokens') && usageKeys.includes('output_tokens')
    && usages.every(usage => object(usage) && JSON.stringify(Object.keys(usage).sort()) === JSON.stringify(usageKeys)
      && Object.values(usage).every(value => Number.isSafeInteger(value) && value >= 0))
  const usage = knownUsage ? Object.fromEntries(usageKeys.map(key => [key, usages.reduce((sum, value) => sum + value[key], 0)])) : null
  const rootBindings = reconcileRootActions(rootEvents, rootActions)
  const rootActionsMatched = rootBindings !== null
  if (!rootActionsMatched)
    fail('root:action-stream-mismatch')
  return { evidence: { complete: reasons.size === 0, reasons: [...reasons], rootThreadId, threads, dispatches, usage, rootActionsMatched }, childEvents, rootActions, rootBindings }
}

function reconcileRootActions(stdout, rollout) {
  const actionKey = (event) => {
    const item = event.item
    if (item.type === 'command_execution') {
      const argv = item.argv ?? literalArgv(item.command)
      return argv ? JSON.stringify([event.type, item.type, argv, item.status, item.exit_code]) : null
    }
    if (!Array.isArray(item.changes))
      return null
    return JSON.stringify([event.type, item.type, item.status, item.changes.map(change => [change.path, typeof change.kind === 'string' ? change.kind : change.kind?.type]).sort()])
  }
  const actions = events => events.filter(event => event.type === 'item.completed' && ['command_execution', 'file_change'].includes(event.item?.type))
  const observed = actions(stdout)
  const retained = actions(rollout)
  if (observed.length !== retained.length || new Set(observed.map(event => event.item.id)).size !== observed.length)
    return null
  const remaining = [...retained]
  const bindings = []
  for (const event of observed) {
    const key = actionKey(event)
    const index = key === null ? -1 : remaining.findIndex(other => actionKey(other) === key)
    if (index < 0 || !identifier(event.item.id))
      return null
    const matched = remaining.splice(index, 1)[0]
    bindings.push({ id: event.item.id, timestamp: matched.timestamp, started_at_ms: matched.started_at_ms, completed_at_ms: matched.completed_at_ms })
  }
  return bindings
}
