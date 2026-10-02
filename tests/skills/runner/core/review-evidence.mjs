import { Buffer } from 'node:buffer'
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { observeEvents } from '../observers/events.mjs'
import { writeJson } from './files.mjs'
import { streamLines } from './streams.mjs'

// Navigation only: original records remain authoritative, including unknown fields.
export function writeReviewViews(record, target) {
  const result = record.result ?? {}
  const observation = record.observation ?? {}
  const trace = observeEvents(streamLines(result, 'stdout', target))
  const pick = (value, keys) => Object.fromEntries(keys.map(key => [key, value?.[key] ?? null]))
  const equal = (a, b) => a == null || b == null ? null : a === b
  const summary = {
    record: 'run.json',
    execution: pick(result, ['exitCode', 'cancelled', 'timedOut', 'outputLimited', 'error', 'durationMs']),
    cancellation: pick(record, ['cancelled', 'cancellationReason']),
    checks: Object.fromEntries(['hard', 'task', 'coordination', 'verdict', 'semantic'].map(key => [key, { ...pick(record[key], ['status', 'category']), details: `run.json:${key}` }])),
    observedChecks: Object.fromEntries(Object.entries(observation.checks ?? {}).map(([key, value]) => [key, { ...pick(value, ['exitCode', 'status']), details: `run.json:observation.checks.${key}` }])),
    git: { ...pick(observation, ['head', 'baselineHead', 'indexHash', 'baselineIndexHash', 'changedPaths', 'committedFilesMatchWorktree']), headUnchanged: equal(observation.head, observation.baselineHead), indexUnchanged: equal(observation.indexHash, observation.baselineIndexHash), details: 'run.json:observation' },
    trace: { available: typeof result.stdout === 'string' || Boolean(result.stdoutFile), completed: trace.completed, failed: trace.failed, parseFailures: trace.parseFailures.length, pendingToolCalls: trace.pendingToolCalls, toolCalls: trace.toolCalls, details: 'events.jsonl' },
  }
  writeJson(join(target, 'summary.json'), summary)
  mkdirSync(join(target, 'tool-events'), { recursive: true, mode: 0o700 })
  const indexPath = join(target, 'tool-index.jsonl')
  writeFileSync(indexPath, '', { mode: 0o600 })
  let offset = -1
  for (const line of streamLines(result, 'stdout', target)) {
    offset++
    let event
    try {
      event = JSON.parse(line)
    }
    catch { continue }
    if (event?.type !== 'item.completed' || !['command_execution', 'file_change', 'mcp_tool_call', 'tool_call', 'collab_tool_call', 'web_search'].includes(event.item?.type))
      continue
    const item = event.item
    const evidence = `tool-events/${String(offset + 1).padStart(6, '0')}.json`
    writeJson(join(target, evidence), event)
    appendFileSync(indexPath, `${JSON.stringify({ traceLine: offset + 1, type: item.type, status: item.status ?? null, exitCode: item.exit_code ?? null, commandPreview: typeof item.command === 'string' ? item.command.slice(0, 240) : null, commandTruncated: typeof item.command === 'string' && item.command.length > 240, eventBytes: Buffer.byteLength(line.replace(/\n$/u, '')), evidence })}\n`)
  }
  const retention = record.retainedEvidence == null ? null : Object.fromEntries(Object.entries(record.retainedEvidence).map(([name, value]) => [name, { retained: Array.isArray(value?.retained) ? value.retained.length : null, omitted: Array.isArray(value?.omitted) ? value.omitted.length : null, details: `run.json:retainedEvidence.${name}` }]))
  return { summary: 'summary.json', tools: 'tool-index.jsonl', retention }
}
