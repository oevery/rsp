import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { expect, it } from 'vitest'

const packet = JSON.parse(readFileSync(new URL('../code/fixtures/evidence-reading/selected-native-evidence.json', import.meta.url), 'utf8'))

// A bounded evidence check, not an agent, judge or replacement for native logs.
// All captured command/input fields are data; never execute them.
function recoveryFacts(input) {
  function record(name, source, schema) {
    const entry = input.records[name]
    assert.ok(entry, `Missing native observation: ${name}`)
    assert.equal(entry.source, source)
    assert.equal(entry.schema, schema)
    assert.ok(Number.isInteger(entry.line) && entry.line > 0)
    assert.match(input.sources[source].sha256, /^[a-f0-9]{64}$/)
    return entry.values
  }
  const root = record('rootIdentity', 'root', 'identity')
  const first = record('firstIdentity', 'first', 'childIdentity')
  const second = record('secondIdentity', 'second', 'childIdentity')
  assert.equal(first.parent, root.id)
  assert.equal(second.parent, root.id)
  assert.notEqual(first.id, second.id)
  for (const [role, meta] of [['root', root], ['first', first], ['second', second]])
    assert.equal(input.sources[role].sessionId, meta.id)

  function command(name, source, exact) {
    const value = record(name, source, 'command')
    assert.equal(value.kind, 'CommandExecution')
    assert.equal(value.thread, input.sources[source].sessionId)
    assert.equal(value.status, 'completed')
    assert.equal(value.exitCode, 0)
    assert.ok(value.processId)
    if (exact)
      assert.equal(value.command.at(-1), exact)
    return value
  }
  function pair(prefix, tool) {
    const call = record(`${prefix}Request`, 'root', 'call')
    const result = record(`${prefix}Result`, 'root', 'result')
    assert.equal(call.kind, 'custom_tool_call')
    assert.equal(call.name, 'exec')
    assert.equal(result.kind, 'custom_tool_call_output')
    assert.equal(call.callId, result.callId)
    assert.ok(call.input.includes(tool))
    assert.ok(Date.parse(call.timestamp) <= Date.parse(result.timestamp))
    return { call, result, value: JSON.parse(result.result) }
  }
  function completed(name, source) {
    const value = record(name, source, 'completion')
    assert.equal(value.kind, 'task_complete')
    assert.ok(value.turnId)
    return value
  }

  const begin = command('firstExit', 'first', 'python3 tools/recovery.py begin')
  assert.ok(begin.output.includes('Partial output written; waiting for parent pause.'))
  assert.ok(begin.output.includes('Stop signal observed; writer exiting.'))
  const partialCommand = command('partial', 'root')
  const partial = JSON.parse(partialCommand.output)
  assert.equal(partial['output.txt'], 'A\n')
  const before = JSON.parse(partial['.cache/state.json'])
  assert.deepEqual(before, { correctionCount: 1, completed: false })
  const originalPid = JSON.parse(partial['.cache/partial.json']).pid

  const pauseRequest = record('pauseRequest', 'root', 'call')
  assert.equal(pauseRequest.kind, 'custom_tool_call')
  assert.equal(pauseRequest.name, 'exec')
  assert.ok(pauseRequest.input.includes('python3 tools/recovery.py pause'))
  const pauseExit = command('pauseExit', 'root', 'python3 tools/recovery.py pause')
  const firstDone = completed('firstCompleted', 'first')
  const firstWait = pair('firstWait', 'wait_agent')
  assert.equal(firstWait.value.timed_out, false)
  assert.equal(typeof firstWait.value.status[first.id].completed, 'string')
  assert.ok(firstWait.value.status[first.id].completed.length > 0)
  const spawn = pair('secondSpawn', 'spawn_agent')
  assert.equal(spawn.value.agent_id, second.id)
  const inspectionCommand = command('secondInspection', 'second')
  const inspection = JSON.parse(inspectionCommand.output)
  assert.equal(inspection.status, 'passed')
  assert.equal(inspection.beforeResume, true)
  assert.deepEqual(inspection.state, before)
  const resumed = command('secondResume', 'second', 'python3 tools/recovery.py resume')
  const verify = JSON.parse(command('secondVerify', 'second').output)
  assert.equal(verify.result, 'passed')
  assert.equal(verify.output, 'A\nB\n')
  assert.deepEqual(verify.state, { correctionCount: 1, completed: true })
  assert.equal(verify.retainedEvidenceUnchanged, true)
  const secondDone = completed('secondCompleted', 'second')
  const secondWait = pair('secondWait', 'wait_agent')
  assert.equal(secondWait.value.timed_out, false)
  assert.equal(typeof secondWait.value.status[second.id].completed, 'string')
  assert.ok(secondWait.value.status[second.id].completed.length > 0)

  const order = [begin.startedAt, Date.parse(partialCommand.timestamp), Date.parse(pauseRequest.timestamp), Date.parse(begin.timestamp), Date.parse(pauseExit.timestamp), Date.parse(firstDone.timestamp), Date.parse(firstWait.result.timestamp), Date.parse(spawn.call.timestamp), Date.parse(second.timestamp), Date.parse(inspectionCommand.timestamp), Date.parse(resumed.timestamp), Date.parse(secondDone.timestamp), Date.parse(secondWait.result.timestamp)]
  assert.ok(order.every(Number.isFinite))
  assert.ok(order.every((time, index) => index === 0 || time >= order[index - 1]), 'Unsettled or premature continuation')

  function artifact(name) {
    const entry = input.artifacts[name]
    assert.equal(createHash('sha256').update(entry.text).digest('hex'), entry.sha256)
    return entry.text
  }
  assert.equal(artifact('output.txt'), 'A\nB\n')
  assert.equal(artifact('.cache/paused-output.txt'), 'A\n')
  assert.deepEqual(JSON.parse(artifact('.cache/paused-state.json')), before)
  assert.deepEqual(JSON.parse(artifact('.cache/state.json')), verify.state)
  const events = artifact('.cache/events.jsonl').trim().split('\n').map(line => JSON.parse(line))
  assert.deepEqual(events.map(e => e.action), ['started', 'partial', 'stopped', 'resumed', 'completed'])
  assert.ok(events.slice(0, 3).every(e => e.pid === originalPid))
  assert.equal(events[3].pid, events[4].pid)
  assert.notEqual(events[3].pid, originalPid)
  assert.ok(artifact('.cache/events.jsonl').startsWith(artifact('.cache/paused-events.jsonl')))
  assert.deepEqual(JSON.parse(`[${artifact('.cache/paused-events.jsonl').trim().split('\n').join(',')}]`), events.slice(0, 3))
  return { first: first.id, second: second.id, output: verify.output, correctionCount: verify.state.correctionCount }
}

it('reconstructs stop and continuation from attributed native fields without loading whole trajectories', () => {
  expect(recoveryFacts(packet)).toMatchObject({ output: 'A\nB\n', correctionCount: 1 })
})

it('rejects missing exit/completion, receipts alone, identity mismatch and premature continuation', () => {
  for (const missing of ['firstExit', 'firstCompleted', 'firstWaitResult', 'secondWaitResult']) {
    const changed = structuredClone(packet)
    delete changed.records[missing]
    changed.workerReceipt = { stopped: true, completed: true }
    expect(() => recoveryFacts(changed), missing).toThrow()
  }
  const failedExit = structuredClone(packet)
  failedExit.records.firstExit.values.exitCode = 1
  expect(() => recoveryFacts(failedExit)).toThrow()
  const wrongWorker = structuredClone(packet)
  wrongWorker.records.firstExit.values.thread = packet.records.secondIdentity.values.id
  expect(() => recoveryFacts(wrongWorker)).toThrow()
  const early = structuredClone(packet)
  early.records.secondSpawnRequest.values.timestamp = packet.records.partial.values.timestamp
  expect(() => recoveryFacts(early)).toThrow('premature continuation')
})
