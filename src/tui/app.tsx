import type { DependencyForestNode } from '../status/dependency-forest.js'
import type { ProjectStatusSnapshot } from '../status/model.js'
import type { TuiMessages } from './i18n/messages.js'
import type { DashboardItem } from './state.js'
import { Box, Text, useApp, useInput, useStdout } from 'ink'
import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import { inspectProjectStatus } from '../status/inspect.js'
import { displayWidth, truncateDisplay } from './display.js'
import { projectExternalBlockers, projectItemDependencyForest, projectItemState, projectNextAction } from './projection.js'
import { allItems, dashboardListWidth, initialDashboardState, reduceDashboard, visibleItems } from './state.js'

export interface DashboardAppProps {
  initialSnapshot: ProjectStatusSnapshot
  messages: TuiMessages
}

function stateLabel(item: DashboardItem, snapshot: ProjectStatusSnapshot, messages: TuiMessages): string {
  const state = projectItemState(item, snapshot)
  const labels = state.focused ? [messages.focused, messages[state.execution]] : [messages[state.execution]]
  return labels.join(' · ')
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
  const reasonWidth = Math.max(8, contentWidth - displayWidth(childPrefix) - displayWidth(messages.reason) - 2)
  const reason = node.reason && (expanded ? node.reason : truncateDisplay(node.reason, reasonWidth))
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
      {node.children.map((child, index) => (
        <DependencyNode key={`${node.name}:${child.name}`} contentWidth={contentWidth} expanded={expanded} last={index === node.children.length - 1} messages={messages} node={child} prefix={childPrefix} snapshot={snapshot} />
      ))}
    </>
  )
}

function Detail({ expanded, item, messages, snapshot, width }: { expanded: boolean, item: DashboardItem | undefined, messages: TuiMessages, snapshot: ProjectStatusSnapshot, width: number }) {
  if (!item)
    return <Text dimColor>{messages.noWork}</Text>
  const record = item.record
  const forest = projectItemDependencyForest(item, snapshot)
  const externalBlockers = projectExternalBlockers(item, snapshot)
  const nextAction = projectNextAction(item, snapshot)
  const blockers = externalBlockers.length
    ? externalBlockers.join('; ')
    : item.group?.blockers || snapshot.plan.blocked.some(blocked => blocked.change === item.workRef && blocked.external)
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
      <Text>
        {messages.progress}
        :
        {' '}
        {record ? `${record.output.progress.done}/${record.output.progress.total}` : `${item.group?.completion.done ?? 0}/${item.group?.completion.total ?? 0}`}
      </Text>
      <Text>
        {messages.status}
        :
        {' '}
        {stateLabel(item, snapshot, messages)}
      </Text>
      <Text bold>{messages.dependencies}</Text>
      {forest.length
        ? forest.map((node, index) => <DependencyNode key={node.name} contentWidth={Math.max(8, width - 1)} expanded={expanded} last={forest.length === 1 ? null : index === forest.length - 1} messages={messages} node={node} prefix="" snapshot={snapshot} />)
        : <Text>{messages.none}</Text>}
      {item.group && (
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

export function DashboardApp({ initialSnapshot, messages }: DashboardAppProps) {
  const { exit } = useApp()
  const { stdout } = useStdout()
  const dimensions = { width: stdout.columns ?? 80, height: stdout.rows ?? 24 }
  const [state, dispatch] = useReducer(reduceDashboard, initialDashboardState(initialSnapshot, dimensions))
  const filterRef = useRef('')
  const refreshing = useRef(false)
  const queuedRefresh = useRef(false)
  const items = allItems(state)
  const selected = items.find(item => item.workRef === state.selectedWorkRef)

  const refresh = useCallback(async () => {
    if (refreshing.current) {
      queuedRefresh.current = true
      dispatch({ type: 'refresh-requested' })
      return
    }
    refreshing.current = true
    dispatch({ type: 'refresh-requested' })
    do {
      queuedRefresh.current = false
      try {
        dispatch({ type: 'snapshot', snapshot: await inspectProjectStatus() })
      }
      catch (error) {
        dispatch({ type: 'refresh-failed', message: error instanceof Error ? error.message : String(error) })
      }
    } while (queuedRefresh.current)
    refreshing.current = false
  }, [])

  useEffect(() => {
    const resize = () => dispatch({ type: 'resize', width: stdout.columns ?? 80, height: stdout.rows ?? 24 })
    stdout.on('resize', resize)
    return () => {
      stdout.off('resize', resize)
    }
  }, [stdout])

  useInput((input, key) => {
    if (key.ctrl && input === 'c') {
      exit()
      return
    }
    if (state.mode === 'search') {
      if (key.escape || key.return) {
        dispatch({ type: 'mode', mode: 'list' })
        return
      }
      if (key.backspace || key.delete) {
        filterRef.current = filterRef.current.slice(0, -1)
        dispatch({ type: 'filter', value: filterRef.current })
        return
      }
      if (input && !key.ctrl && !key.meta) {
        filterRef.current += input
        dispatch({ type: 'filter', value: filterRef.current })
      }
      return
    }
    if (key.escape) {
      if (state.mode !== 'list')
        dispatch({ type: 'mode', mode: 'list' })
      else
        exit()
    }
    else if (input === 'q') {
      exit()
    }
    else if (key.tab) {
      dispatch({ type: 'scope', scope: state.scope === 'changes' ? 'groups' : 'changes' })
    }
    else if (key.upArrow || input === 'k') {
      dispatch({ type: 'move', delta: -1 })
    }
    else if (key.downArrow || input === 'j') {
      dispatch({ type: 'move', delta: 1 })
    }
    else if (input === '/') {
      dispatch({ type: 'mode', mode: 'search' })
    }
    else if (input === '?') {
      dispatch({ type: 'mode', mode: state.mode === 'help' ? 'list' : 'help' })
    }
    else if (input === 'r') {
      void refresh()
    }
    else if (key.return) {
      dispatch({ type: 'mode', mode: 'detail' })
    }
  })

  const title = useMemo(() => `${messages.title} · ${state.scope === 'changes' ? messages.changes : messages.groups}`, [messages, state.scope])
  if (state.layout === 'compact')
    return <Text>{messages.compact}</Text>
  if (state.mode === 'help') {
    return (
      <Box flexDirection="column">
        <Text bold>{messages.helpTitle}</Text>
        <Text>{messages.help}</Text>
        <Text>{messages.dependencyDirection}</Text>
        <Text>{messages.legend}</Text>
        <Text>{messages.legendMore}</Text>
        <Text>{messages.canonicalStates}</Text>
        <Text>{messages.closeHelp}</Text>
      </Box>
    )
  }

  const listWidth = dashboardListWidth(state.layout, state.width)
  const detailWidth = Math.max(8, state.width - listWidth - 2)
  const list = (
    <Box flexDirection="column" width={listWidth} marginRight={state.layout === 'wide' ? 2 : 0}>
      {visibleItems(state).map((item) => {
        const selectedItem = item.workRef === state.selectedWorkRef
        const label = stateLabel(item, state.snapshot, messages)
        const identity = item.group?.slices.length
          ? `${item.workRef}: ${item.group.slices.map(slice => slice.name).join(', ')}`
          : item.workRef
        return (
          <Text key={item.workRef} inverse={selectedItem}>
            {selectedItem ? '›' : ' '}
            {' '}
            {truncateDisplay(identity, Math.max(8, listWidth - displayWidth(label) - 5))}
            {' '}
            [
            {label}
            ]
          </Text>
        )
      })}
      {items.length === 0 && <Text dimColor>{state.filter ? messages.noMatches : messages.noWork}</Text>}
    </Box>
  )

  return (
    <Box flexDirection="column" width={state.width} height={state.height}>
      <Text bold>{title}</Text>
      {state.mode === 'search' && (
        <Text>
          {messages.filter}
          :
          {' '}
          {state.filter}
          _
        </Text>
      )}
      {state.refresh.running && <Text>{messages.refreshing}</Text>}
      {state.refresh.error && (
        <Text color="red">
          {messages.refreshFailed}
          {' '}
          {state.refresh.error}
        </Text>
      )}
      {state.snapshot.diagnostics.length > 0 && (
        <Text color="yellow">
          {messages.diagnostics}
          :
          {' '}
          {state.snapshot.diagnostics.map(item => item.code).join(', ')}
        </Text>
      )}
      {state.mode === 'detail'
        ? <Detail expanded item={selected} messages={messages} snapshot={state.snapshot} width={state.width} />
        : state.layout === 'wide'
          ? (
              <Box flexGrow={1}>
                {list}
                <Detail expanded={false} item={selected} messages={messages} snapshot={state.snapshot} width={detailWidth} />
              </Box>
            )
          : list}
      <Text dimColor>{messages.help}</Text>
    </Box>
  )
}
