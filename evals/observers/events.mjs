import { isKnownOutput, observeGuidance } from './skill-reads.mjs'

export function observeEvents(raw, skillReference, outputReference) {
  const events = []
  const parseFailures = []
  const commands = []
  const writes = []
  const skillReads = []
  let skillReadUncertain = !skillReference
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
      // Observe guidance exposed in captured outputs, not filesystem reads.
      // Completed business-file reads are valid negative exposure evidence;
      // missing outputs, unknown tools and unfinished calls are not.
      if (['item.started', 'item.updated', 'item.completed'].includes(event.type) && !['agent_message', 'reasoning', 'todo_list'].includes(event.item?.type)) {
        if (event.type === 'item.completed') {
          pendingTools.delete(event.item?.id)
        }
        else if (typeof event.item?.id === 'string') {
          pendingTools.add(event.item.id)
        }
        else {
          skillReadUncertain = true
          pendingTools.add(null)
        }
        if (event.item?.type !== 'command_execution')
          skillReadUncertain = true
      }
      if (event.type === 'item.completed') {
        if (event.item?.type === 'command_execution') {
          const command = event.item.command
          if (typeof command !== 'string')
            throw new Error('Missing command')
          commands.push({ command, exitCode: event.item.exit_code, status: event.item.status, evidenceRedacted: event.item.command_redacted === true })
          if (typeof event.item.aggregated_output !== 'string' || event.item.output_truncated === true || event.item.truncated === true
            || (event.item.status !== undefined && event.item.status !== 'completed')) {
            skillReadUncertain = true
          }
          const { exposed, partial } = observeGuidance(event.item.aggregated_output, skillReference)
          skillReads.push(...exposed)
          if (partial || !isKnownOutput(event.item.aggregated_output, outputReference))
            skillReadUncertain = true
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
    skillReadUncertain: skillReadUncertain || pendingTools.size > 0 || parseFailures.length > 0,
    pendingToolCalls: pendingTools.size,
    completed: events.some(event => event.type === 'turn.completed'),
    failed: events.some(event => ['turn.failed', 'error'].includes(event.type)),
    toolCalls: events.filter(event => event.type === 'item.completed' && ['command_execution', 'file_change', 'mcp_tool_call', 'tool_call', 'collab_tool_call', 'web_search'].includes(event.item?.type)).length,
    modelInvocations,
    usage,
    finalOutput,
  }
}
