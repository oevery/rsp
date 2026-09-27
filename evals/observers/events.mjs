import { exposedSkills } from './skill-reads.mjs'

export function observeEvents(raw, skillReference) {
  const events = []
  const parseFailures = []
  const commands = []
  const writes = []
  const skillReads = []
  let skillReadUncertain = !skillReference
  let modelInvocations = null
  let usage = null
  let finalOutput = null
  for (const [index, line] of String(raw ?? '').split('\n').filter(line => line.trim()).entries()) {
    try {
      const event = JSON.parse(line)
      if (!event || typeof event.type !== 'string')
        throw new Error('Missing event type')
      events.push(event)
      if (['api.request.started', 'model.request.started', 'model.started'].includes(event.type))
        modelInvocations = (modelInvocations ?? 0) + 1
      // Unknown/new tool kinds and unfinished calls must not imply no reads.
      if (['item.started', 'item.updated', 'item.completed'].includes(event.type) && !['agent_message', 'reasoning', 'todo_list'].includes(event.item?.type))
        skillReadUncertain = true
      if (event.type === 'item.completed') {
        if (event.item?.type === 'command_execution') {
          const command = event.item.command
          if (typeof command !== 'string')
            throw new Error('Missing command')
          commands.push({ command, exitCode: event.item.exit_code, status: event.item.status })
          // Commands are opaque programs, not a filesystem read audit. Even a
          // successful command with no guidance output cannot prove absence.
          skillReads.push(...exposedSkills(event.item.aggregated_output, skillReference))
        }
        if (event.item?.type === 'file_change') {
          if (!Array.isArray(event.item.changes) || event.item.changes.some(change => typeof change?.path !== 'string'))
            throw new Error('Missing file change paths')
          writes.push(...event.item.changes.map(change => change.path))
        }
        if (event.item?.type === 'agent_message')
          finalOutput = event.item.text ?? null
      }
      if (event.type === 'turn.completed')
        usage = event.usage ?? null
    }
    catch {
      parseFailures.push({ eventIndex: index, kind: 'invalid-event' })
    }
  }
  return {
    events,
    parseFailures,
    commands,
    writes,
    skillReads: [...new Set(skillReads)].sort(),
    skillReadUncertain,
    completed: events.some(event => event.type === 'turn.completed'),
    failed: events.some(event => ['turn.failed', 'error'].includes(event.type)),
    toolCalls: events.filter(event => event.type === 'item.completed' && ['command_execution', 'file_change', 'mcp_tool_call', 'tool_call', 'collab_tool_call', 'web_search'].includes(event.item?.type)).length,
    modelInvocations,
    usage,
    finalOutput,
  }
}
