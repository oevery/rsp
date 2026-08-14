import type { DependencyForestNode } from '../status/dependency-forest.js'
import type { ProjectStatusSnapshot } from '../status/model.js'
import type { TuiMessages } from './i18n/messages.js'
import type { MarkdownLine } from './markdown-presentation.js'
import type { DashboardItem } from './state.js'
import { Box, Text } from 'ink'
import { displayWidth, truncateDisplay, wrapDisplay } from './display.js'
import { projectExternalBlockers, projectItemDependencyForest, projectItemState, projectNextAction } from './projection.js'

export function projectWorkDetailLines(item: DashboardItem | undefined, snapshot: ProjectStatusSnapshot, messages: TuiMessages, width: number): MarkdownLine[] {
  if (!item || item.type === 'history')
    return [{ spans: [{ text: messages.noWork, dim: true }] }]
  const lines: MarkdownLine[] = []
  const add = (text: string, style: Omit<MarkdownLine['spans'][number], 'text'> = {}) => {
    for (const value of wrapDisplay(text, Math.max(1, width)))
      lines.push({ spans: [{ text: value, ...style }] })
  }
  if (item.title !== item.workRef)
    add(`${messages.summary}: ${item.title}`)
  add(`${messages.progress}: ${item.type === 'change' ? `${item.record.output.progress.done}/${item.record.output.progress.total}` : `${item.group.completion.done}/${item.group.completion.total}`}`)
  add(`${messages.status}: ${workStateLabel(item, snapshot, messages)}`)
  add(messages.dependencies, { bold: true })
  const forest = projectItemDependencyForest(item, snapshot)
  const visit = (node: DependencyForestNode, prefix: string, last: boolean | null) => {
    const connector = last === null ? '' : last ? '└── ' : '├── '
    const state = node.state === 'archived' ? messages.resolved : messages[node.state === 'missing' ? 'blocked' : node.state]
    add(`${prefix}${connector}${dependencySymbol(node, snapshot)} ${node.name}  ${state}${node.shared ? ` · ↩ ${messages.shared}` : ''}`)
    if (node.reason)
      add(`${prefix}${last === false ? '│   ' : '    '}${messages.reason}: ${node.reason}`, { dim: true })
    const childPrefix = prefix + (last === null ? '' : last ? '    ' : '│   ')
    node.children.forEach((child, index) => visit(child, childPrefix, index === node.children.length - 1))
  }
  if (forest.length)
    forest.forEach((node, index) => visit(node, '', forest.length === 1 ? null : index === forest.length - 1))
  else
    add(messages.none)
  if (item.type === 'group')
    add(`${messages.changes}: ${item.group.slices.length ? item.group.slices.map(slice => `${slice.name} (${slice.state})`).join(', ') : messages.none}`)
  const external = projectExternalBlockers(item, snapshot)
  const blockers = external.length ? external.join('; ') : (item.type === 'group' && item.group.blockers) || snapshot.plan.blocked.some(blocked => blocked.change === item.workRef && blocked.external) ? messages.yes : messages.none
  add(`${messages.blockers}: ${blockers}`)
  const next = projectNextAction(item, snapshot)
  add(`${next.kind === 'command' ? messages.nextCommand : next.kind === 'blocked' ? messages.nextAction : messages.reviewGroupBrief}: ${next.kind === 'blocked' ? messages.awaitingOwnerDecision : next.value}`)
  return lines
}

export function workStateLabel(item: DashboardItem, snapshot: ProjectStatusSnapshot, messages: TuiMessages): string {
  if (item.type === 'history')
    return item.history.kind
  const state = projectItemState(item, snapshot)
  return (state.focused ? [messages.focused, messages[state.execution]] : [messages[state.execution]]).join(' · ')
}

function dependencySymbol(node: DependencyForestNode, snapshot: ProjectStatusSnapshot): string {
  if (snapshot.focused.includes(node.name))
    return '◎'
  if (node.state === 'ready')
    return '●'
  if (node.state === 'archived')
    return '✓'
  if (node.state === 'blocked' || node.state === 'missing')
    return '!'
  return '○'
}

function DependencyNode({ contentWidth, expanded, last, messages, node, prefix, snapshot }: { contentWidth: number, expanded: boolean, last: boolean | null, messages: TuiMessages, node: DependencyForestNode, prefix: string, snapshot: ProjectStatusSnapshot }) {
  const connector = last === null ? '' : last ? '└── ' : '├── '
  const childPrefix = prefix + (last === null ? '' : last ? '    ' : '│   ')
  const state = node.state === 'archived' ? messages.resolved : messages[node.state === 'missing' ? 'blocked' : node.state]
  const reason = node.reason && (expanded ? node.reason : truncateDisplay(node.reason, Math.max(8, contentWidth - displayWidth(childPrefix) - displayWidth(messages.reason) - 2)))
  return (
    <>
      <Text>
        {prefix}
        {connector}
        {dependencySymbol(node, snapshot)}
        {' '}
        {node.name}
        {'  '}
        {state}
        {node.shared ? ` · ↩ ${messages.shared}` : ''}
      </Text>
      {reason && (
        <Box paddingLeft={displayWidth(childPrefix)}>
          <Text dimColor>
            {messages.reason}
            :
            {' '}
            {reason}
          </Text>
        </Box>
      )}
      {node.children.map((child, index) => <DependencyNode key={`${node.name}:${child.name}`} contentWidth={contentWidth} expanded={expanded} last={index === node.children.length - 1} messages={messages} node={child} prefix={childPrefix} snapshot={snapshot} />)}
    </>
  )
}

export function WorkDetail({ expanded, item, messages, snapshot, width }: { expanded: boolean, item: DashboardItem | undefined, messages: TuiMessages, snapshot: ProjectStatusSnapshot, width: number }) {
  if (!item || item.type === 'history')
    return <Text dimColor>{messages.noWork}</Text>
  const forest = projectItemDependencyForest(item, snapshot)
  const externalBlockers = projectExternalBlockers(item, snapshot)
  const nextAction = projectNextAction(item, snapshot)
  const blockers = externalBlockers.length
    ? externalBlockers.join('; ')
    : (item.type === 'group' && item.group.blockers) || snapshot.plan.blocked.some(blocked => blocked.change === item.workRef && blocked.external)
        ? messages.yes
        : messages.none
  return (
    <Box flexDirection="column" paddingLeft={1} width={width}>
      <Text bold>
        {messages.detail}
        :
        {' '}
        {item.workRef}
      </Text>
      {item.title !== item.workRef && (
        <Text>
          {messages.summary}
          :
          {' '}
          {truncateDisplay(item.title, Math.max(8, width - displayWidth(messages.summary) - 3))}
        </Text>
      )}
      <Text>
        {messages.progress}
        :
        {' '}
        {item.type === 'change' ? `${item.record.output.progress.done}/${item.record.output.progress.total}` : `${item.group.completion.done}/${item.group.completion.total}`}
      </Text>
      <Text>
        {messages.status}
        :
        {' '}
        {workStateLabel(item, snapshot, messages)}
      </Text>
      <Text bold>{messages.dependencies}</Text>
      {forest.length ? forest.map((node, index) => <DependencyNode key={node.name} contentWidth={Math.max(8, width - 1)} expanded={expanded} last={forest.length === 1 ? null : index === forest.length - 1} messages={messages} node={node} prefix="" snapshot={snapshot} />) : <Text>{messages.none}</Text>}
      {item.type === 'group' && (
        <Text>
          {messages.changes}
          :
          {' '}
          {item.group.slices.length ? item.group.slices.map(slice => `${slice.name} (${slice.state})`).join(', ') : messages.none}
        </Text>
      )}
      <Text>
        {messages.blockers}
        :
        {' '}
        {blockers}
      </Text>
      <Text>
        {nextAction.kind === 'command' ? messages.nextCommand : nextAction.kind === 'blocked' ? messages.nextAction : messages.reviewGroupBrief}
        :
        {' '}
        {nextAction.kind === 'blocked' ? messages.awaitingOwnerDecision : nextAction.value}
      </Text>
    </Box>
  )
}
