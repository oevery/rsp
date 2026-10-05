import { lstatSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { hashFile } from '../core/files.mjs'
import { fileLines, writeLines } from '../core/streams.mjs'

const calls = new Set(['function_call', 'custom_tool_call', 'function_call_output', 'custom_tool_call_output'])
const items = new Set(['CommandExecution', 'FileChange', 'McpToolCall', 'CollabAgentToolCall', 'WebSearch'])

// Retain tool evidence only, never session instructions, messages or configuration.
export function retainSessionTools(home, target, sanitize) {
  const gaps = []
  let records = 0
  function* visit(path, source) {
    try {
      const stat = lstatSync(path)
      if (stat.isSymbolicLink() || (!stat.isDirectory() && !stat.isFile())) {
        gaps.push({ source, reason: 'link-or-special-file' })
        return
      }
      if (stat.isDirectory()) {
        for (const name of readdirSync(path).sort())
          yield* visit(join(path, name), `${source}/${name}`)
        return
      }
      if (!path.endsWith('.jsonl'))
        return
      let sessionId = null
      let line = 0
      for (const text of fileLines(path)) {
        line++
        let event
        try {
          event = JSON.parse(text)
        }
        catch {
          gaps.push({ source, line, reason: 'malformed-record' })
          continue
        }
        if (event?.type === 'session_meta') {
          if (typeof event.payload?.id === 'string')
            sessionId = event.payload.id
          continue
        }
        const payload = event?.payload
        if (!(event?.type === 'response_item' && calls.has(payload?.type))
          && !(event?.type === 'event_msg' && ['item_started', 'item_updated', 'item_completed'].includes(payload?.type) && items.has(payload?.item?.type))) {
          continue
        }
        if (!sessionId)
          gaps.push({ source, line, reason: 'missing-session-id' })
        records++
        yield `${JSON.stringify(sanitize({ source, line, sessionId, event }))}\n`
      }
    }
    catch { gaps.push({ source, reason: 'unavailable-session-file' }) }
  }
  const file = 'session-tools.jsonl'
  writeLines(join(target, file), visit(join(home, 'sessions'), 'sessions'))
  if (!records)
    gaps.push({ reason: 'no-tool-records' })
  return { file, hash: hashFile(join(target, file)), records, gaps: sanitize(gaps) }
}

export function sessionToolLines(evidence, directory) {
  if (!directory || evidence?.file !== 'session-tools.jsonl' || typeof evidence.hash !== 'string')
    throw new Error('Invalid retained tool evidence reference')
  const path = join(directory, evidence.file)
  if (!lstatSync(path).isFile() || hashFile(path) !== evidence.hash)
    throw new Error('Retained tool evidence identity mismatch')
  return fileLines(path)
}
