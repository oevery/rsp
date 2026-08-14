import type { ArchiveHistoryListResult } from '../history/model.js'
import type { ProjectStatusSnapshot } from '../status/model.js'
import type { HistoryDetailOutput } from '../types.js'
import type { TuiMessages } from './i18n/messages.js'
import type { TuiSpecsSource } from './specs-source.js'
import type { DashboardHistoryState, DashboardScope, HistoryDashboardItem } from './state.js'
import type { TuiWorkDocument, TuiWorkSource } from './work-source.js'
import { Box, Text, useApp, useInput, useStdout } from 'ink'
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react'
import { displayWidth, truncateDisplay } from './display.js'
import { HISTORY_DETAIL_MIN_HEIGHT, projectHistoryDetailLines, projectHistoryEvidence } from './history-detail.js'
import { formatHistoryDiagnostic, formatHistoryField, formatHistoryRow } from './history-display.js'
import { projectMarkdownLines, projectMarkdownLineViewport } from './markdown-presentation.js'
import { flattenSpecsTree } from './specs-display.js'
import { MarkdownDocumentDetail, RenderedDetailViewport, SpecsDetail, SpecsList, specsSelectionKey, SpecsSummary } from './specs-pane.js'
import { allItems, dashboardListWidth, initialDashboardState, reduceDashboard, visibleItems } from './state.js'
import { projectWorkDetailLines, WorkDetail, workStateLabel } from './work-pane.js'

export interface DashboardAppProps {
  initialSnapshot: ProjectStatusSnapshot
  initialDimensions?: { width: number, height: number }
  messages: TuiMessages
  inspectStatus: () => Promise<ProjectStatusSnapshot>
  inspectHistory: () => Promise<ArchiveHistoryListResult>
  inspectHistoryDetail: (path: string) => Promise<HistoryDetailOutput>
  inspectHistoryDocument?: (path: string) => Promise<{ path: string, content: string }>
  specsSource?: TuiSpecsSource
  workSource?: TuiWorkSource
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
    ['work', messages.work],
    ['specs', messages.specs],
    ['history', messages.history],
  ]
  const navigation = labels
    .map(([candidate, label]) => candidate === scope ? `[${label}]` : label)
    .join(' ')
  return truncateDisplay(`${messages.title}  ${navigation}`, width)
}

export function DashboardApp({ initialDimensions, initialSnapshot, inspectHistory, inspectHistoryDetail, inspectHistoryDocument, inspectStatus, messages, specsSource, workSource }: DashboardAppProps) {
  const { exit } = useApp()
  const { stdout } = useStdout()
  const dimensions = initialDimensions ?? { width: stdout.columns ?? 80, height: stdout.rows ?? 24 }
  const [state, dispatch] = useReducer(reduceDashboard, initialDashboardState(initialSnapshot, dimensions))
  const filterRefs = useRef<Record<DashboardScope, string>>({ work: '', specs: '', history: '' })
  const refreshing = useRef(false)
  const queuedRefresh = useRef(false)
  const historyRequest = useRef(0)
  const historyRefreshing = useRef(false)
  const queuedHistoryRefresh = useRef(false)
  const detailRequest = useRef(0)
  const specsTreeRequest = useRef(0)
  const specsDetailRequest = useRef(0)
  const specsSearchRequest = useRef(0)
  const specsRootsInitialized = useRef(false)
  const [specsExpanded, setSpecsExpanded] = useState<Set<string>>(new Set())
  const [specsSelectedPath, setSpecsSelectedPath] = useState<string | null>(null)
  const [specsSearchInput, setSpecsSearchInput] = useState('')
  const [specsContentSearch, setSpecsContentSearch] = useState(false)
  const [showSpecsSearchResults, setShowSpecsSearchResults] = useState(false)
  const [detailDocument, setDetailDocument] = useState<TuiWorkDocument | null>(null)
  const [detailDocumentState, setDetailDocumentState] = useState<'semantic' | 'loading' | 'document' | 'error'>('semantic')
  const [detailDocumentError, setDetailDocumentError] = useState<string | null>(null)
  const items = allItems(state)
  const selectedKey = state.navigation[state.scope].selectedKey
  const selected = items.find(item => item.key === selectedKey)
  const selectedHistory = selected?.type === 'history' ? selected : undefined
  const specsTreeRows = useMemo(() => {
    if (!state.specs.tree)
      return []
    const query = state.navigation.specs.filter.trim().toLocaleLowerCase()
    const rows = flattenSpecsTree(state.specs.tree, specsExpanded, { specs: messages.specs, decisionRecords: messages.decisions })
    if (!query)
      return rows
    return rows.filter((row) => {
      const text = row.type === 'root'
        ? `${row.label} ${row.path}`
        : row.type === 'directory'
          ? `${row.name} ${row.path}`
          : `${row.title} ${row.summary ?? ''} ${row.kind} ${row.path}`
      return text.toLocaleLowerCase().includes(query)
    })
  }, [messages.decisions, messages.specs, specsExpanded, state.navigation.specs.filter, state.specs.tree])
  const specsSearchMatches = state.specs.search.result?.matches ?? []
  const activeSpecsRows = showSpecsSearchResults ? specsSearchMatches : specsTreeRows
  const selectedSpecsIndex = Math.max(0, activeSpecsRows.findIndex(row => specsSelectionKey(row) === specsSelectedPath))
  const selectedSpecsRow = showSpecsSearchResults ? undefined : specsTreeRows[selectedSpecsIndex]
  const selectedSpecsMatch = showSpecsSearchResults ? specsSearchMatches[selectedSpecsIndex] : undefined
  const activeDocument = state.scope === 'specs'
    ? state.specs.detail.record?.document
    : detailDocumentState === 'document' ? detailDocument : null
  const semanticDetailLines = useMemo(() => {
    if (state.scope === 'work')
      return projectWorkDetailLines(selected, state.snapshot, messages, Math.max(8, state.width - 1))
    if (state.scope === 'history' && selectedHistory && state.history.detail.record?.path === selectedHistory.history.path)
      return projectHistoryDetailLines(state.history.detail.record, messages, Math.max(8, state.width - 1))
    return []
  }, [messages, selected, selectedHistory, state.history.detail.record, state.scope, state.snapshot, state.width])
  const activeDetailLines = useMemo(() => {
    const content = activeDocument?.content
    return content === undefined ? semanticDetailLines : projectMarkdownLines(content, Math.max(8, state.width - 1))
  }, [activeDocument?.content, semanticDetailLines, state.width])
  const detailDynamicChromeRows = state.scope === 'history'
    ? Number(state.history.status === 'loading' || state.history.status === 'error') + Number(Boolean(state.history.summary))
    : state.scope === 'specs'
      ? Number(state.specs.status === 'loading' || state.specs.status === 'stale' || state.specs.status === 'error')
      + Number(state.specs.search.loading)
      + Number(Boolean(state.specs.search.error))
      + Number(showSpecsSearchResults && Boolean(state.specs.search.result))
      : Number(state.refresh.running) + Number(Boolean(state.refresh.error)) + Number(state.snapshot.diagnostics.length > 0)
  const detailFixedChromeRows = state.scope === 'history' && detailDocumentState === 'semantic'
    ? 7
    : state.scope === 'work' && detailDocumentState === 'semantic'
      ? 5
      : 7
  const detailViewportHeight = Math.max(1, state.height - detailFixedChromeRows - detailDynamicChromeRows)
  const specsDetailViewport = useMemo(() => projectMarkdownLineViewport(activeDetailLines, {
    height: detailViewportHeight,
    offset: state.specs.detail.scroll,
  }), [activeDetailLines, detailViewportHeight, state.specs.detail.scroll])

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

  const loadSpecsTree = useCallback(async () => {
    if (!specsSource)
      return
    const requestId = ++specsTreeRequest.current
    dispatch({ type: 'specs-tree-requested', requestId })
    try {
      const result = await specsSource.tree()
      if (!specsRootsInitialized.current) {
        specsRootsInitialized.current = true
        setSpecsExpanded(new Set([result.tree.path, result.decisionRecords.path]))
      }
      dispatch({ type: 'specs-tree-loaded', requestId, result })
    }
    catch (error) {
      dispatch({ type: 'specs-tree-failed', requestId, message: error instanceof Error ? error.message : String(error) })
    }
  }, [specsSource])

  const loadSpecsDetail = useCallback(async (path: string) => {
    if (!specsSource)
      return
    const requestId = ++specsDetailRequest.current
    dispatch({ type: 'specs-detail-requested', requestId, path })
    try {
      dispatch({ type: 'specs-detail-loaded', requestId, record: await specsSource.detail(path) })
    }
    catch (error) {
      dispatch({ type: 'specs-detail-failed', requestId, message: error instanceof Error ? error.message : String(error) })
    }
  }, [specsSource])

  const searchSpecsContent = useCallback(async (literal: string) => {
    if (!specsSource)
      return
    const requestId = ++specsSearchRequest.current
    setShowSpecsSearchResults(true)
    dispatch({ type: 'specs-search-requested', requestId, query: literal })
    try {
      dispatch({ type: 'specs-search-loaded', requestId, result: await specsSource.search(literal) })
    }
    catch (error) {
      dispatch({ type: 'specs-search-failed', requestId, message: error instanceof Error ? error.message : String(error) })
    }
  }, [specsSource])

  useEffect(() => {
    if (state.scope === 'history' && state.history.status === 'idle')
      void loadHistory()
  }, [loadHistory, state.history.status, state.scope])

  useEffect(() => {
    if (specsSource && state.scope === 'specs' && state.specs.status === 'idle')
      void loadSpecsTree()
  }, [loadSpecsTree, specsSource, state.scope, state.specs.status])

  useEffect(() => {
    if (state.scope !== 'specs' || activeSpecsRows.length === 0)
      return
    const retained = activeSpecsRows.some(row => specsSelectionKey(row) === specsSelectedPath)
    if (!retained)
      setSpecsSelectedPath(specsSelectionKey(activeSpecsRows[0]))
  }, [activeSpecsRows, showSpecsSearchResults, specsSelectedPath, state.scope])

  useEffect(() => {
    setDetailDocument(null)
    setDetailDocumentState('semantic')
    setDetailDocumentError(null)
    dispatch({ type: 'specs-scroll', offset: 0 })
  }, [selectedKey, state.scope])

  const toggleDocumentView = useCallback(async () => {
    if (detailDocumentState === 'document' || detailDocumentState === 'error') {
      setDetailDocumentState('semantic')
      setDetailDocumentError(null)
      return
    }
    if (state.scope === 'work' && selected && selected.type !== 'history' && workSource) {
      setDetailDocumentState('loading')
      try {
        const path = selected.type === 'change' ? selected.record.output.path : selected.group.path
        if (!path)
          throw new Error(`Work document path is unavailable: ${selected.workRef}`)
        setDetailDocument(await workSource.document(path))
        setDetailDocumentState('document')
      }
      catch (error) {
        setDetailDocumentError(error instanceof Error ? error.message : String(error))
        setDetailDocumentState('error')
      }
    }
    else if (state.scope === 'history' && selected?.type === 'history' && inspectHistoryDocument) {
      setDetailDocumentState('loading')
      try {
        setDetailDocument(await inspectHistoryDocument(selected.history.path))
        setDetailDocumentState('document')
      }
      catch (error) {
        setDetailDocumentError(error instanceof Error ? error.message : String(error))
        setDetailDocumentState('error')
      }
    }
  }, [detailDocumentState, inspectHistoryDocument, selected, state.scope, workSource])

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
      if (specsContentSearch) {
        if (key.escape) {
          setSpecsContentSearch(false)
          setSpecsSearchInput('')
          dispatch({ type: 'mode', mode: 'list' })
          return
        }
        if (key.return) {
          const literal = specsSearchInput.trim()
          setSpecsContentSearch(false)
          setSpecsSearchInput('')
          dispatch({ type: 'mode', mode: 'list' })
          if (literal)
            void searchSpecsContent(literal)
          return
        }
        if (key.backspace || key.delete)
          setSpecsSearchInput(value => value.slice(0, -1))
        else if (input && !key.ctrl && !key.meta)
          setSpecsSearchInput(value => value + input)
        return
      }
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
      if (state.scope === 'specs' && showSpecsSearchResults)
        setShowSpecsSearchResults(false)
      else if (state.mode !== 'list')
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
    else if (state.mode === 'detail' && (key.upArrow || input === 'k')) {
      dispatch({ type: 'specs-scroll', offset: Math.max(0, specsDetailViewport.start - 1) })
    }
    else if (state.mode === 'detail' && (key.downArrow || input === 'j')) {
      dispatch({ type: 'specs-scroll', offset: specsDetailViewport.hasNext ? specsDetailViewport.start + 1 : specsDetailViewport.start })
    }
    else if (key.upArrow || input === 'k') {
      if (state.scope === 'specs' && activeSpecsRows.length > 0) {
        const index = Math.max(0, selectedSpecsIndex - 1)
        setSpecsSelectedPath(specsSelectionKey(activeSpecsRows[index]))
      }
      else {
        dispatch({ type: 'move', delta: -1 })
      }
    }
    else if (key.downArrow || input === 'j') {
      if (state.scope === 'specs' && activeSpecsRows.length > 0) {
        const index = Math.min(activeSpecsRows.length - 1, selectedSpecsIndex + 1)
        setSpecsSelectedPath(specsSelectionKey(activeSpecsRows[index]))
      }
      else {
        dispatch({ type: 'move', delta: 1 })
      }
    }
    else if (input === '/') {
      if (state.scope === 'specs')
        setShowSpecsSearchResults(false)
      dispatch({ type: 'mode', mode: 'search' })
    }
    else if (input === 's' && state.scope === 'specs') {
      setSpecsContentSearch(true)
      setSpecsSearchInput('')
      dispatch({ type: 'mode', mode: 'search' })
    }
    else if (input === '?') {
      dispatch({ type: 'mode', mode: state.mode === 'help' ? 'list' : 'help' })
    }
    else if (input === 'v' && state.mode === 'detail' && (state.scope === 'work' || state.scope === 'history')) {
      void toggleDocumentView()
    }
    else if (input === 'r') {
      if (state.scope === 'history') {
        void loadHistory()
      }
      else if (state.scope === 'specs') {
        setShowSpecsSearchResults(false)
        void loadSpecsTree()
      }
      else {
        void refreshStatus()
      }
    }
    else if (key.return) {
      if (state.scope === 'specs') {
        if (selectedSpecsMatch) {
          dispatch({ type: 'mode', mode: 'detail' })
          void loadSpecsDetail(selectedSpecsMatch.path)
        }
        else if (selectedSpecsRow?.type === 'document') {
          dispatch({ type: 'mode', mode: 'detail' })
          void loadSpecsDetail(selectedSpecsRow.path)
        }
        else if (selectedSpecsRow) {
          setSpecsExpanded((current) => {
            const next = new Set(current)
            if (next.has(selectedSpecsRow.path))
              next.delete(selectedSpecsRow.path)
            else
              next.add(selectedSpecsRow.path)
            return next
          })
        }
      }
      else {
        dispatch({ type: 'mode', mode: 'detail' })
      }
      if (state.scope === 'history' && selected?.type === 'history' && state.history.detail.record?.path !== selected.history.path)
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
        const label = workStateLabel(item, state.snapshot, messages)
        const kind = item.type === 'change' ? messages.changes : messages.groups
        const identity = item.title !== item.workRef
          ? `${item.workRef} — ${item.title}`
          : item.type === 'group' && item.group.slices.length
            ? `${item.workRef}: ${item.group.slices.map(slice => slice.name).join(', ')}`
            : item.workRef
        return (
          <Text key={item.key} inverse={selectedItem}>
            {selectedItem ? '›' : ' '}
            {' '}
            {truncateDisplay(identity, Math.max(8, listWidth - displayWidth(label) - displayWidth(kind) - 8))}
            {' '}
            [
            {label}
            ] [
            {kind}
            ]
          </Text>
        )
      })}
      {items.length === 0 && !(state.scope === 'history' && state.history.status === 'loading') && <Text dimColor>{state.navigation[state.scope].filter ? messages.noMatches : state.scope === 'history' ? messages.noHistory : messages.noWork}</Text>}
    </Box>
  )
  const specsCapacity = Math.max(1, state.height - 7)
  const specsViewportStart = Math.max(0, Math.min(
    Math.max(0, activeSpecsRows.length - specsCapacity),
    selectedSpecsIndex >= specsCapacity ? selectedSpecsIndex - specsCapacity + 1 : 0,
  ))
  const visibleSpecsRows = activeSpecsRows.slice(specsViewportStart, specsViewportStart + specsCapacity)
  const specsList = (
    <SpecsList
      filterActive={Boolean(state.navigation.specs.filter)}
      listWidth={listWidth}
      messages={messages}
      rows={visibleSpecsRows}
      searchLoading={state.specs.search.loading}
      selectedKey={specsSelectedPath}
      status={state.specs.status}
      wide={state.layout === 'wide'}
    />
  )

  const activeList = state.scope === 'specs' ? specsList : list
  return (
    <Box flexDirection="column" width={state.width} height={state.height}>
      <Text bold>{scopeNavigation(state.scope, messages, state.width)}</Text>
      {state.mode === 'search' && (
        specsContentSearch
          ? (
              <Box flexDirection="column">
                <Text>{messages.specsSearchPrompt}</Text>
                <Text>
                  {messages.specsSearch}
                  :
                  {' '}
                  {specsSearchInput}
                  _
                </Text>
              </Box>
            )
          : (
              <Text>
                {messages.filter}
                :
                {' '}
                {state.navigation[state.scope].filter}
                _
              </Text>
            )
      )}
      {state.scope === 'history' && state.history.status === 'loading' && <Text>{messages.historyLoading}</Text>}
      {state.scope === 'history' && state.history.status === 'error' && (
        <Text color="red">{formatHistoryDiagnostic(messages.historyRefreshFailed, state.history.error ?? '', state.width)}</Text>
      )}
      {state.scope === 'history' && state.history.summary && <Text dimColor>{truncateDisplay(`${state.history.summary.returned}/${state.history.summary.matched} ${messages.archivedChangesShown}${state.history.summary.hasMore ? ` · ${messages.historyBounded}` : ''}`, state.width)}</Text>}
      {state.scope === 'specs' && state.specs.status === 'loading' && <Text>{messages.specsLoading}</Text>}
      {state.scope === 'specs' && (state.specs.status === 'stale' || state.specs.status === 'error') && (
        <Text color={state.specs.status === 'stale' ? 'yellow' : 'red'}>
          {truncateDisplay(`${messages.specsRefreshFailed} ${state.specs.error ?? ''}${state.specs.status === 'stale' ? ` [${messages.stale}]` : ''}`, state.width)}
        </Text>
      )}
      {state.scope === 'specs' && state.specs.search.loading && <Text>{messages.specsSearchLoading}</Text>}
      {state.scope === 'specs' && state.specs.search.error && (
        <Text color="red">{formatHistoryDiagnostic(messages.specsSearchFailed, state.specs.search.error, state.width)}</Text>
      )}
      {state.scope === 'specs' && showSpecsSearchResults && state.specs.search.result && (
        <Text dimColor>
          {state.specs.search.result.summary.returned}
          /
          {state.specs.search.result.summary.matched}
          {' '}
          {messages.specsSearch}
          {state.specs.search.result.summary.hasMore ? ` · ${messages.truncated}` : ''}
        </Text>
      )}
      {state.scope === 'work' && state.refresh.running && <Text>{messages.refreshing}</Text>}
      {state.scope === 'work' && state.refresh.error && (
        <Text color="red">
          {messages.refreshFailed}
          {' '}
          {state.refresh.error}
        </Text>
      )}
      {state.scope === 'work' && state.snapshot.diagnostics.length > 0 && (
        <Text color="yellow">
          {messages.diagnostics}
          :
          {' '}
          {state.snapshot.diagnostics.map(item => item.code).join(', ')}
        </Text>
      )}
      {state.mode === 'detail'
        ? detailDocumentState === 'loading'
          ? <Text>{messages.specsDetailLoading}</Text>
          : detailDocumentState === 'error'
            ? <Text color="red">{detailDocumentError}</Text>
            : detailDocumentState === 'document' && detailDocument
              ? <MarkdownDocumentDetail kind={state.scope === 'history' ? selectedHistory?.history.kind ?? 'archive' : selected?.type ?? 'work'} messages={messages} path={detailDocument.path} title={selected?.title ?? detailDocument.path} viewport={specsDetailViewport} width={state.width} />
              : state.scope === 'history'
                ? selectedHistory && state.history.detail.record?.path === selectedHistory.history.path
                  ? (
                      <Box flexDirection="column" width={state.width}>
                        <Text bold>{formatHistoryField(messages.detail, selectedHistory.workRef, Math.max(8, state.width - 1))}</Text>
                        <Text>{formatHistoryField(messages.archiveDate, selectedHistory.history.date, Math.max(8, state.width - 1))}</Text>
                        <Text>{formatHistoryField(messages.kind, selectedHistory.history.kind, Math.max(8, state.width - 1))}</Text>
                        <Text>{formatHistoryField(messages.path, selectedHistory.history.path, Math.max(8, state.width - 1))}</Text>
                        <RenderedDetailViewport messages={messages} viewport={specsDetailViewport} />
                      </Box>
                    )
                  : <HistoryDetail height={state.height} history={state.history} item={selectedHistory} messages={messages} width={state.width} />
                : state.scope === 'specs'
                  ? <SpecsDetail messages={messages} specs={state.specs} viewport={specsDetailViewport} width={state.width} />
                  : (
                      <Box flexDirection="column" width={state.width}>
                        <Text bold>
                          {messages.detail}
                          :
                          {' '}
                          {selected?.workRef}
                        </Text>
                        <Text>
                          {messages.path}
                          :
                          {' '}
                          {selected?.type === 'change' ? selected.record.output.path : selected?.type === 'group' ? selected.group.path : ''}
                        </Text>
                        <RenderedDetailViewport messages={messages} viewport={specsDetailViewport} />
                      </Box>
                    )
        : state.layout === 'wide'
          ? (
              <Box flexGrow={1}>
                {activeList}
                {state.scope === 'history'
                  ? <HistorySummary item={selectedHistory} messages={messages} width={detailWidth} />
                  : state.scope === 'specs'
                    ? <SpecsSummary match={selectedSpecsMatch} messages={messages} row={selectedSpecsRow} width={detailWidth} />
                    : <WorkDetail expanded={false} item={selected} messages={messages} snapshot={state.snapshot} width={detailWidth} />}
              </Box>
            )
          : activeList}
      <Text dimColor>{truncateDisplay(messages.help, state.width)}</Text>
    </Box>
  )
}
