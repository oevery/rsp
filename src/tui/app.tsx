import type { ArchiveHistoryListResult } from '../history/model.js'
import type { DependencyForestNode } from '../status/dependency-forest.js'
import type { ProjectStatusSnapshot } from '../status/model.js'
import type { HistoryDetailOutput } from '../types.js'
import type { TuiMessages } from './i18n/messages.js'
import type { DashboardHistoryState, DashboardItem, DashboardScope, HistoryDashboardItem } from './state.js'
import { Box, Text, useApp, useInput, useStdout } from 'ink'
import { useCallback, useEffect, useReducer, useRef } from 'react'
import { displayWidth, truncateDisplay } from './display.js'
import { HISTORY_DETAIL_MIN_HEIGHT, projectHistoryEvidence } from './history-detail.js'
import { formatHistoryDiagnostic, formatHistoryField, formatHistoryRow } from './history-display.js'
import { projectExternalBlockers, projectItemDependencyForest, projectItemState, projectNextAction } from './projection.js'
import { allItems, dashboardListWidth, initialDashboardState, reduceDashboard, visibleItems } from './state.js'

export interface DashboardAppProps {
  initialSnapshot: ProjectStatusSnapshot
  initialDimensions?: { width: number, height: number }
  messages: TuiMessages
  inspectStatus: () => Promise<ProjectStatusSnapshot>
  inspectHistory: () => Promise<ArchiveHistoryListResult>
  inspectHistoryDetail: (path: string) => Promise<HistoryDetailOutput>
}

function stateLabel(item: DashboardItem, snapshot: ProjectStatusSnapshot, messages: TuiMessages): string {
  if (item.type === 'history')
    return item.history.kind
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

function CurrentDetail({ expanded, item, messages, snapshot, width }: { expanded: boolean, item: DashboardItem | undefined, messages: TuiMessages, snapshot: ProjectStatusSnapshot, width: number }) {
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
        {stateLabel(item, snapshot, messages)}
      </Text>
      <Text bold>{messages.dependencies}</Text>
      {forest.length
        ? forest.map((node, index) => <DependencyNode key={node.name} contentWidth={Math.max(8, width - 1)} expanded={expanded} last={forest.length === 1 ? null : index === forest.length - 1} messages={messages} node={node} prefix="" snapshot={snapshot} />)
        : <Text>{messages.none}</Text>}
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

function HistorySummary({ item, messages, width }: { item: HistoryDashboardItem | undefined, messages: TuiMessages, width: number }) {
  if (!item)
    return <Text dimColor>{messages.noHistory}</Text>
  const contentWidth = Math.max(8, width - 1)
  return (
    <Box flexDirection="column" paddingLeft={1} width={width}>
      <Text bold>{formatHistoryField(messages.detail, item.workRef, contentWidth)}</Text>
      <Text>{formatHistoryField(messages.archiveDate, item.history.date, contentWidth)}</Text>
      <Text>{formatHistoryField(messages.kind, item.history.kind, contentWidth)}</Text>
      <Text>{truncateDisplay(`${messages.summary}: ${item.history.summary}${item.history.summaryTruncated ? '…' : ''}`, Math.max(8, width - 1))}</Text>
      <Text>{truncateDisplay(`${messages.path}: ${item.history.path}`, Math.max(8, width - 1))}</Text>
      <Text dimColor>{messages.enterHistoryDetail}</Text>
    </Box>
  )
}

function Evidence({ value }: { value: { heading: string, lines: string[] } }) {
  return (
    <Box flexDirection="column">
      <Text bold>{value.heading}</Text>
      {value.lines.map((line, index) => <Text key={index}>{line}</Text>)}
    </Box>
  )
}

function HistoryDetail({ height, history, item, messages, width }: { height: number, history: DashboardHistoryState, item: HistoryDashboardItem | undefined, messages: TuiMessages, width: number }) {
  if (!item)
    return <Text dimColor>{messages.noHistory}</Text>
  if (height < HISTORY_DETAIL_MIN_HEIGHT)
    return <Text>{messages.historyDetailCompact}</Text>
  const detail = history.detail.record?.path === item.history.path ? history.detail.record : null
  const contentWidth = Math.max(8, width - 1)
  const listChromeRows = history.status === 'loading' || history.status === 'error' ? 1 : 0
  const detailChromeRows = history.detail.loadingPath === item.history.path || (history.detail.error && history.detail.errorPath === item.history.path) ? 1 : 0
  const evidence = detail
    ? projectHistoryEvidence(detail.evidence, {
        height,
        width: contentWidth,
        dynamicRows: listChromeRows + detailChromeRows,
        headings: {
          tasks: `${messages.tasks}: ${detail.checkboxes.tasks.done}/${detail.checkboxes.tasks.total}`,
          verify: `${messages.verify}: ${detail.checkboxes.verify.done}/${detail.checkboxes.verify.total}`,
          blockers: `${messages.blockers}:`,
        },
        none: messages.none,
        truncationMarker: messages.truncated,
      })
    : []
  return (
    <Box flexDirection="column" width={width}>
      <Text bold>{formatHistoryField(messages.detail, item.workRef, contentWidth)}</Text>
      <Text>{formatHistoryField(messages.archiveDate, item.history.date, contentWidth)}</Text>
      <Text>{formatHistoryField(messages.kind, item.history.kind, contentWidth)}</Text>
      <Text>{formatHistoryField(messages.path, item.history.path, contentWidth)}</Text>
      {history.detail.loadingPath === item.history.path && <Text>{messages.historyDetailLoading}</Text>}
      {history.detail.error && history.detail.errorPath === item.history.path && (
        <Text color="red">{formatHistoryDiagnostic(messages.historyDetailFailed, history.detail.error, contentWidth)}</Text>
      )}
      {detail && (
        <>
          {height >= 12 && <Text>{truncateDisplay(`${messages.summary}: ${detail.summary}${detail.summaryTruncated ? '…' : ''}`, contentWidth)}</Text>}
          <Text>
            {messages.scenarios}
            :
            {' '}
            {detail.scenarioCount}
          </Text>
          {evidence.length > 0
            ? (
                <>
                  {evidence.map(section => <Evidence key={section.key} value={section} />)}
                </>
              )
            : <Text dimColor>{messages.historyEvidenceHidden}</Text>}
        </>
      )}
    </Box>
  )
}

function scopeNavigation(scope: DashboardScope, messages: TuiMessages, width: number): string {
  const labels: Array<[DashboardScope, string]> = [
    ['changes', messages.changes],
    ['groups', messages.groups],
    ['history', messages.history],
  ]
  const navigation = labels
    .map(([candidate, label]) => candidate === scope ? `[${label}]` : label)
    .join(' ')
  return truncateDisplay(`${messages.title}  ${navigation}`, width)
}

export function DashboardApp({ initialDimensions, initialSnapshot, inspectHistory, inspectHistoryDetail, inspectStatus, messages }: DashboardAppProps) {
  const { exit } = useApp()
  const { stdout } = useStdout()
  const dimensions = initialDimensions ?? { width: stdout.columns ?? 80, height: stdout.rows ?? 24 }
  const [state, dispatch] = useReducer(reduceDashboard, initialDashboardState(initialSnapshot, dimensions))
  const filterRefs = useRef<Record<DashboardScope, string>>({ changes: '', groups: '', history: '' })
  const refreshing = useRef(false)
  const queuedRefresh = useRef(false)
  const historyRequest = useRef(0)
  const historyRefreshing = useRef(false)
  const queuedHistoryRefresh = useRef(false)
  const detailRequest = useRef(0)
  const items = allItems(state)
  const selectedKey = state.navigation[state.scope].selectedKey
  const selected = items.find(item => item.key === selectedKey)

  const loadHistory = useCallback(async () => {
    if (historyRefreshing.current) {
      queuedHistoryRefresh.current = true
      dispatch({ type: 'history-list-queued' })
      return
    }
    historyRefreshing.current = true
    do {
      queuedHistoryRefresh.current = false
      const requestId = ++historyRequest.current
      dispatch({ type: 'history-list-requested', requestId })
      try {
        dispatch({ type: 'history-list-loaded', requestId, result: await inspectHistory() })
      }
      catch (error) {
        dispatch({ type: 'history-list-failed', requestId, message: error instanceof Error ? error.message : String(error) })
      }
    } while (queuedHistoryRefresh.current)
    historyRefreshing.current = false
  }, [inspectHistory])

  const refreshStatus = useCallback(async () => {
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
        dispatch({ type: 'snapshot', snapshot: await inspectStatus() })
      }
      catch (error) {
        dispatch({ type: 'refresh-failed', message: error instanceof Error ? error.message : String(error) })
      }
    } while (queuedRefresh.current)
    refreshing.current = false
  }, [inspectStatus])

  const loadDetail = useCallback(async (path: string) => {
    const requestId = ++detailRequest.current
    dispatch({ type: 'history-detail-requested', requestId, path })
    try {
      dispatch({ type: 'history-detail-loaded', requestId, record: await inspectHistoryDetail(path) })
    }
    catch (error) {
      dispatch({ type: 'history-detail-failed', requestId, message: error instanceof Error ? error.message : String(error) })
    }
  }, [inspectHistoryDetail])

  useEffect(() => {
    if (state.scope === 'history' && state.history.status === 'idle')
      void loadHistory()
  }, [loadHistory, state.history.status, state.scope])

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
      if (key.backspace || key.delete)
        filterRefs.current[state.scope] = filterRefs.current[state.scope].slice(0, -1)
      else if (input && !key.ctrl && !key.meta)
        filterRefs.current[state.scope] += input
      dispatch({ type: 'filter', value: filterRefs.current[state.scope] })
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
      dispatch({ type: 'scope-next' })
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
      void (state.scope === 'history' ? loadHistory() : refreshStatus())
    }
    else if (key.return) {
      dispatch({ type: 'mode', mode: 'detail' })
      if (selected?.type === 'history' && state.history.detail.record?.path !== selected.history.path)
        void loadDetail(selected.history.path)
    }
  })

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
        const selectedItem = item.key === selectedKey
        if (item.type === 'history') {
          return (
            <Text key={item.key} inverse={selectedItem}>
              {selectedItem ? '›' : ' '}
              {' '}
              {formatHistoryRow(item.history, Math.max(1, listWidth - 2))}
            </Text>
          )
        }
        const label = stateLabel(item, state.snapshot, messages)
        const identity = item.title !== item.workRef
          ? `${item.workRef} — ${item.title}`
          : item.type === 'group' && item.group.slices.length
            ? `${item.workRef}: ${item.group.slices.map(slice => slice.name).join(', ')}`
            : item.workRef
        return (
          <Text key={item.key} inverse={selectedItem}>
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
      {items.length === 0 && !(state.scope === 'history' && state.history.status === 'loading') && <Text dimColor>{state.navigation[state.scope].filter ? messages.noMatches : state.scope === 'history' ? messages.noHistory : messages.noWork}</Text>}
    </Box>
  )

  const selectedHistory = selected?.type === 'history' ? selected : undefined
  return (
    <Box flexDirection="column" width={state.width} height={state.height}>
      <Text bold>{scopeNavigation(state.scope, messages, state.width)}</Text>
      {state.mode === 'search' && (
        <Text>
          {messages.filter}
          :
          {' '}
          {state.navigation[state.scope].filter}
          _
        </Text>
      )}
      {state.scope === 'history' && state.history.status === 'loading' && <Text>{messages.historyLoading}</Text>}
      {state.scope === 'history' && state.history.status === 'error' && (
        <Text color="red">{formatHistoryDiagnostic(messages.historyRefreshFailed, state.history.error ?? '', state.width)}</Text>
      )}
      {state.scope === 'history' && state.history.summary && <Text dimColor>{truncateDisplay(`${state.history.summary.returned}/${state.history.summary.matched} ${messages.archivedChangesShown}${state.history.summary.hasMore ? ` · ${messages.historyBounded}` : ''}`, state.width)}</Text>}
      {state.scope !== 'history' && state.refresh.running && <Text>{messages.refreshing}</Text>}
      {state.scope !== 'history' && state.refresh.error && (
        <Text color="red">
          {messages.refreshFailed}
          {' '}
          {state.refresh.error}
        </Text>
      )}
      {state.scope !== 'history' && state.snapshot.diagnostics.length > 0 && (
        <Text color="yellow">
          {messages.diagnostics}
          :
          {' '}
          {state.snapshot.diagnostics.map(item => item.code).join(', ')}
        </Text>
      )}
      {state.mode === 'detail'
        ? state.scope === 'history'
          ? <HistoryDetail height={state.height} history={state.history} item={selectedHistory} messages={messages} width={state.width} />
          : <CurrentDetail expanded item={selected} messages={messages} snapshot={state.snapshot} width={state.width} />
        : state.layout === 'wide'
          ? (
              <Box flexGrow={1}>
                {list}
                {state.scope === 'history' ? <HistorySummary item={selectedHistory} messages={messages} width={detailWidth} /> : <CurrentDetail expanded={false} item={selected} messages={messages} snapshot={state.snapshot} width={detailWidth} />}
              </Box>
            )
          : list}
      <Text dimColor>{truncateDisplay(messages.help, state.width)}</Text>
    </Box>
  )
}
