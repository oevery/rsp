export function observeEvents(raw) {
  const events = []
  const parseFailures = []
  const commands = []
  const writes = []
  const pendingTools = new Set()
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
      if (['item.started', 'item.updated', 'item.completed'].includes(event.type) && !['agent_message', 'reasoning', 'todo_list'].includes(event.item?.type)) {
        if (event.type === 'item.completed') {
          pendingTools.delete(event.item?.id)
        }
        else if (typeof event.item?.id === 'string') {
          pendingTools.add(event.item.id)
        }
        else {
          pendingTools.add(null)
        }
      }
      if (event.type === 'item.completed') {
        if (event.item?.type === 'command_execution') {
          const command = event.item.command
          if (typeof command !== 'string')
            throw new Error('Missing command')
          commands.push({ command, exitCode: event.item.exit_code, status: event.item.status, evidenceRedacted: event.item.command_redacted === true, ...(event.source_thread_id && { actor: event.source_thread_id, timestamp: event.timestamp }) })
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
    pendingToolCalls: pendingTools.size,
    completed: events.some(event => event.type === 'turn.completed'),
    failed: events.some(event => ['turn.failed', 'error'].includes(event.type)),
    toolCalls: events.filter(event => event.type === 'item.completed' && ['command_execution', 'file_change', 'mcp_tool_call', 'tool_call', 'collab_tool_call', 'web_search'].includes(event.item?.type)).length,
    modelInvocations,
    usage,
    finalOutput,
  }
}
