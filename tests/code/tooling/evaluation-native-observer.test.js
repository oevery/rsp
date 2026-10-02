import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, truncateSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { observeEvents } from '../../skills/runner/observers/events.mjs'
import { collectNativeEvidence } from '../../skills/runner/observers/native.mjs'

const temporary = []
const timestamp = '2026-09-29T00:00:00Z'
const jsonl = events => `${events.map(event => JSON.stringify(event)).join('\n')}\n`
function event(type, payload) {
  return { type, timestamp, payload }
}
function item(value, thread = 'child') {
  return event('event_msg', { type: 'item_completed', thread_id: thread, started_at_ms: 10, completed_at_ms: 20, item: value })
}
function rollout(id, parent = null, extra = []) {
  return [
    event('session_meta', { id, session_id: 'root', timestamp, memory_mode: 'disabled', source: parent ? { subagent: { thread_spawn: { parent_thread_id: parent } } } : 'cli', base_instructions: 'PRIVATE-INSTRUCTIONS' }),
    event('turn_context', { model: 'fixture-model', effort: 'medium', multi_agent_version: 'v1' }),
    ...extra,
    event('event_msg', { type: 'token_count', info: { total_token_usage: { input_tokens: 10, output_tokens: 2 } } }),
    event('event_msg', { type: 'task_complete', started_at: timestamp, completed_at: timestamp, last_agent_message: 'Worker result; inspect evidence before acceptance.' }),
  ]
}
function collab(tool, receivers, sender = 'root', id = tool) {
  return { type: 'item.completed', item: { id, type: 'collab_tool_call', tool, sender_thread_id: sender, receiver_thread_ids: receivers, status: 'completed' } }
}
function fixture() {
  const home = mkdtempSync(join(tmpdir(), 'rsp-native-observer-'))
  temporary.push(home)
  const sessions = join(home, 'sessions/2026/09/29')
  mkdirSync(sessions, { recursive: true })
  const save = (id, events) => writeFileSync(join(sessions, `${id}.jsonl`), jsonl(events))
  save('root', rollout('root'))
  save('child', rollout('child', 'root'))
  const root = [{ type: 'thread.started', thread_id: 'root' }, collab('spawn_agent', ['child']), collab('wait', ['child']), collab('close_agent', ['child'])]
  return { home, sessions, save, root, collect: () => collectNativeEvidence(home, jsonl(root)) }
}
afterEach(() => {
  for (const path of temporary.splice(0))
    rmSync(path, { recursive: true, force: true })
})

describe('native v1 host evidence', () => {
  it('collects attributed host facts and aggregates usage without leaking instructions', () => {
    const f = fixture()
    const { evidence, childEvents } = f.collect()
    expect(evidence).toMatchObject({ complete: true, reasons: [], rootThreadId: 'root', usage: { input_tokens: 20, output_tokens: 4 } })
    expect(evidence.threads).toHaveLength(2)
    expect(evidence.threads[1]).toMatchObject({ id: 'child', parentId: 'root', model: 'fixture-model', memoryMode: 'disabled', completed: true })
    expect(evidence.dispatches.map(d => d.tool)).toEqual(['spawn_agent', 'wait', 'close_agent'])
    expect(childEvents).toEqual([])
    expect(JSON.stringify(evidence)).not.toContain('PRIVATE-INSTRUCTIONS')
  })

  it('lowers real command and file events, preserving argv, failure, actor and time', () => {
    const f = fixture()
    const argv = [process.execPath, '-e', 'process.stdout.write(JSON.stringify(process.argv.slice(1)))', 'a\'b', '$(false)', 'x\ny', '']
    f.save('child', rollout('child', 'root', [
      event('response_item', { type: 'custom_tool_call', call_id: 'outer', name: 'exec', input: 'PRIVATE-CALL' }),
      item({ id: 'cmd', type: 'CommandExecution', command: argv, aggregated_output: 'failed', exit_code: 7, status: 'failed' }),
      event('response_item', { type: 'custom_tool_call_output', call_id: 'outer', output: 'PRIVATE-OUTPUT' }),
      item({ id: 'edit', type: 'FileChange', status: 'completed', changes: { 'src/a.js': { type: 'update', unified_diff: '@@ diff', move_path: 'src/b.js' } } }),
      item({ id: 'prose', type: 'AgentMessage', content: 'I am the root final answer' }),
    ]))
    const { evidence, childEvents } = f.collect()
    expect(evidence.complete).toBe(true)
    expect(childEvents).toHaveLength(3)
    expect(childEvents[2].item).toMatchObject({ type: 'tool_program', program: 'PRIVATE-CALL' })
    expect(childEvents[0]).toMatchObject({ source_thread_id: 'child', started_at_ms: 10, completed_at_ms: 20, item: { type: 'command_execution', argv, exit_code: 7, status: 'failed' } })
    const shell = spawnSync('/bin/sh', ['-c', childEvents[0].item.command], { encoding: 'utf8' })
    expect(shell.status).toBe(0)
    expect(JSON.parse(shell.stdout)).toEqual(argv.slice(3))
    const observed = observeEvents(jsonl([{ type: 'item.completed', item: { type: 'agent_message', text: 'root answer' } }, ...childEvents]))
    expect(observed.finalOutput).toBe('root answer')
    expect(observed.commands[0]).toMatchObject({ exitCode: 7, status: 'failed' })
    expect(observed.writes).toEqual(['src/a.js'])
    expect(observed.completed).toBe(false)
    expect(evidence.threads[1].writes).toEqual(['src/a.js', 'src/b.js'])
  })

  it('does not accept root self-claims as dispatch or child completion', () => {
    const f = fixture()
    f.root.splice(1, 3, { type: 'item.completed', item: { type: 'agent_message', text: 'Spawned child reviewer; all complete; memory disabled.' } })
    expect(f.collect().evidence).toMatchObject({ complete: false, reasons: expect.arrayContaining(['sessions:unmatched-thread']), usage: null })
  })

  it('rejects an observed root action omitted by the session stream', () => {
    const f = fixture()
    f.root.push({ type: 'item.completed', item: { id: 'extra', type: 'command_execution', command: 'git push', status: 'completed', exit_code: 0, aggregated_output: '' } })
    expect(f.collect().evidence).toMatchObject({ complete: false, rootActionsMatched: false, reasons: expect.arrayContaining(['root:action-stream-mismatch']) })
  })

  it.each(['missing', 'foreign', 'incomplete', 'memory', 'restarted'])('fails closed for %s child evidence', (mode) => {
    const f = fixture()
    let child = rollout('child', mode === 'foreign' ? 'other' : 'root')
    if (mode === 'missing')
      rmSync(join(f.sessions, 'child.jsonl'))
    if (mode === 'incomplete')
      child = child.filter(e => e.payload?.type !== 'task_complete')
    if (mode === 'memory')
      delete child[0].payload.memory_mode
    if (mode === 'restarted')
      child.push(event('event_msg', { type: 'task_started' }))
    if (mode !== 'missing')
      f.save('child', child)
    const result = f.collect()
    expect(result.evidence.complete).toBe(false)
    if (mode === 'missing')
      expect(result.evidence.usage).toBeNull()
  })

  it('keeps optional missing usage null without failing an otherwise complete trace', () => {
    const f = fixture()
    f.save('child', rollout('child', 'root').filter(e => e.payload?.type !== 'token_count'))
    expect(f.collect().evidence).toMatchObject({ complete: true, usage: null, reasons: [] })
  })

  it('preserves a rejecting worker report separately from the root and observes effort', () => {
    const f = fixture()
    const child = rollout('child', 'root')
    child.at(-1).payload.last_agent_message = 'Checks exited zero, but reject acceptance: the tenant contract is missing.'
    f.save('child', child)
    const { evidence, childEvents } = f.collect()
    expect(evidence.threads[1]).toMatchObject({ effort: 'medium', reports: [expect.objectContaining({ source: 'worker-statement', text: child.at(-1).payload.last_agent_message })] })
    expect(observeEvents(jsonl(childEvents)).finalOutput).toBeNull()
    delete child[1].payload.effort
    f.save('child', child)
    expect(f.collect().evidence.reasons).toContain('thread:missing-or-changing-effort')
  })

  it('retains an exec program with no host action as unobserved, not a successful write', () => {
    const f = fixture()
    const program = 'await tools.apply_patch(patch)'
    f.save('child', rollout('child', 'root', [
      event('response_item', { type: 'custom_tool_call', call_id: 'wrapper', name: 'exec', input: program }),
      event('response_item', { type: 'custom_tool_call_output', call_id: 'wrapper', output: 'I wrote it successfully' }),
    ]))
    const { evidence, childEvents } = f.collect()
    expect(evidence).toMatchObject({ complete: false, reasons: expect.arrayContaining(['item:unobserved-tool-call']) })
    expect(childEvents.map(e => e.item.type)).toEqual(['tool_program', 'unobserved_tool'])
    expect(childEvents[0].item.program).toBe(program)
    expect(observeEvents(jsonl(childEvents))).toMatchObject({ writes: [], completed: false, finalOutput: null })
  })

  it.each([true, false])('accepts a host-reported pre-execution syntax error only when compilation confirms it: %s', (invalid) => {
    const f = fixture()
    const program = invalid ? 'text(\'unterminated' : 'await tools.apply_patch(patch)'
    f.save('child', rollout('child', 'root', [
      event('response_item', { type: 'custom_tool_call', call_id: 'compile-failure', name: 'exec', input: program }),
      event('response_item', { type: 'custom_tool_call_output', call_id: 'compile-failure', output: [
        { type: 'input_text', text: 'Script failed\nWall time 0.0 seconds\nOutput:\n' },
        { type: 'input_text', text: 'Script error:\nSyntaxError: Invalid or unexpected token' },
      ] }),
    ]))
    const { evidence, childEvents } = f.collect()
    expect(evidence.complete).toBe(invalid)
    expect(observeEvents(jsonl(childEvents)).writes).toEqual([])
    expect(childEvents.some(e => e.item.type === 'tool_program')).toBe(true)
  })

  it('does not duplicate root actions or emit child prose and checks context native version', () => {
    const f = fixture()
    f.save('root', rollout('root', null, [item({ id: 'root-command', type: 'CommandExecution', command: ['true'], exit_code: 0, aggregated_output: '', status: 'completed' }, 'root')]))
    expect(f.collect().childEvents).toEqual([])
    const child = rollout('child', 'root')
    child[0].payload.multi_agent_version = 'v1'
    child[1].payload.multi_agent_version = 'v2'
    f.save('child', child)
    expect(f.collect().evidence.reasons).toContain('thread:unverified-native-version')
  })

  it('preserves unknown tools without their private payload and does not invent exit codes', () => {
    const f = fixture()
    f.save('child', rollout('child', 'root', [
      item({ id: 'mcp', type: 'NewHostTool', arguments: 'PRIVATE-ARGUMENTS' }),
      item({ id: 'cmd', type: 'CommandExecution', command: ['false'], status: 'in_progress' }),
      event('response_item', { type: 'function_call', name: 'unknown', call_id: 'new-tool' }),
      event('response_item', { type: 'function_call_output', call_id: 'new-tool' }),
    ]))
    const result = f.collect()
    expect(result.evidence.complete).toBe(false)
    expect(result.childEvents.filter(e => e.item.type === 'unobserved_tool')).toHaveLength(2)
    expect(result.childEvents.find(e => e.item.type === 'command_execution').item.exit_code).toBeUndefined()
    expect(JSON.stringify(result)).not.toContain('PRIVATE-ARGUMENTS')
  })

  it('recursively validates grandchildren against host parents', () => {
    const f = fixture()
    const call = collab('spawn_agent', ['grandchild'], 'child', 'nested').item
    f.save('child', rollout('child', 'root', [item({ ...call, type: 'CollabAgentToolCall' })]))
    f.save('grandchild', rollout('grandchild', 'child', [item({ id: 'gc', type: 'CommandExecution', command: ['true'], status: 'completed', exit_code: 0, aggregated_output: '' }, 'grandchild')]))
    const result = f.collect()
    expect(result.evidence.complete).toBe(true)
    expect(result.evidence.usage).toEqual({ input_tokens: 30, output_tokens: 6 })
    expect(result.childEvents.some(e => e.source_thread_id === 'grandchild')).toBe(true)
  })

  it('attributes complete native logs larger than the former log quota', () => {
    const f = fixture()
    f.save('child', rollout('child', 'root', Array.from({ length: 270 }, () => event('fixture_padding', { text: 'x'.repeat(65536) }))))
    const result = f.collect()
    expect(result.evidence.complete).toBe(true)
    expect(result.evidence.usage).toEqual({ input_tokens: 20, output_tokens: 4 })
    expect(result.evidence.threads.find(thread => thread.id === 'child').completed).toBe(true)
  })

  it.each(['malformed', 'truncated', 'binary', 'symlink'])('rejects unsafe or malformed %s logs', (mode) => {
    const f = fixture()
    const path = join(f.sessions, 'bad.jsonl')
    if (mode === 'malformed')
      writeFileSync(path, '{bad}\n')
    if (mode === 'truncated')
      writeFileSync(path, JSON.stringify(event('session_meta', { id: 'unfinished' })))
    if (mode === 'binary') {
      writeFileSync(path, '')
      truncateSync(path, 16 * 1024 * 1024 + 1)
    }
    if (mode === 'symlink')
      symlinkSync(join(f.sessions, 'child.jsonl'), path)
    expect(f.collect().evidence.complete).toBe(false)
  })

  it('retains wait receivers from the start event and rejects dangling calls', () => {
    const f = fixture()
    const wait = collab('wait', ['child'], 'root', 'wait-2')
    f.root.push({ ...wait, type: 'item.started' }, { ...wait, item: { ...wait.item, receiver_thread_ids: [] } })
    expect(f.collect().evidence.dispatches.at(-1).receiverId).toBe('child')
    f.root.push({ ...collab('spawn_agent', [], 'root', 'pending'), type: 'item.started' })
    expect(f.collect().evidence).toMatchObject({ complete: false, reasons: expect.arrayContaining(['dispatch:unresolved-call']) })
  })
})
