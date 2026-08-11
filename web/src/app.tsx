import type { CSSProperties, FormEvent, ReactNode } from 'react'
import type {
  WebDocumentMetadata,
  WebHistoryRecord,
  WebManagedFreshness,
  WebManagedProjection,
  WebManagedRunDetailProjection,
  WebMarkdownBlock,
  WebMarkdownInline,
  WebMarkdownProjection,
  WebOverviewProjection,
  WebSpecsSearchProjection,
} from '../../src/web/model.js'
import type { WebLocale, WebMessages } from './i18n.js'
import type { InvocationTreeModel, InvocationTreeNode } from './run-tree.js'
import type { AppState, PresentationFailure, WebView } from './state.js'
import { useMemo, useState } from 'react'
import { messagesFor, translate } from './i18n.js'
import {
  buildRunGraphModel,
  nodeKey,
  runGraphLaneY,
  runGraphNodeX,
} from './run-graph.js'
import {
  buildInvocationTree,

} from './run-tree.js'
import {

  formatTimestamp,

} from './state.js'

export interface AppActions {
  onLocale: (locale: WebLocale) => void
  onView: (view: WebView) => void
  onRefresh: () => void
  onAutoRefresh: () => void
  onSpec: (path: string) => void
  onHistory: (record: WebHistoryRecord, ambiguous: boolean) => void
  onRun: (lookupId: string) => void
  onSearch: (query: string) => void
  onCopyRecoveryCommand: () => void
}

const noopActions: AppActions = {
  onLocale: () => undefined,
  onView: () => undefined,
  onRefresh: () => undefined,
  onAutoRefresh: () => undefined,
  onSpec: () => undefined,
  onHistory: () => undefined,
  onRun: () => undefined,
  onSearch: () => undefined,
  onCopyRecoveryCommand: () => undefined,
}

export function ObservatoryApp({
  state,
  actions = noopActions,
}: {
  state: AppState
  actions?: AppActions
}): ReactNode {
  const locale = state.locale
  const messages = messagesFor(locale)
  if (state.loading && !state.snapshot)
    return <p className="loading">{translate(messages, 'loading')}</p>
  if (!state.snapshot) {
    return (
      <section className="card unavailable-card">
        <h1>{translate(messages, 'unavailableTitle')}</h1>
        <p>{renderErrorMessage(state.error, messages, 'noSnapshot')}</p>
        <p>{translate(messages, 'reloadRecovery')}</p>
        <div className="recovery-command">
          <code>rsp web</code>
          <button type="button" data-action="copy-recovery-command" onClick={actions.onCopyRecoveryCommand}>
            {translate(messages, 'copyCommand')}
          </button>
        </div>
      </section>
    )
  }

  const snapshot = state.snapshot
  return (
    <div className={`shell ${state.view === 'runs' ? 'is-runs-view' : ''}`}>
      <header className="topbar">
        <div className="brand">
          <h1>{translate(messages, 'appTitle')}</h1>
          <p>{translate(messages, 'localProjection', { identity: shortIdentity(snapshot.source.projectId, messages) })}</p>
        </div>
        <div className="meta checkout-meta">
          <span>
            {translate(
              messages,
              snapshot.source.dirty === true
                ? 'dirtyCheckout'
                : snapshot.source.dirty === false
                  ? 'cleanCheckout'
                  : 'unknownCheckout',
            )}
          </span>
          <span>{formatTimestamp(snapshot.generatedAt, locale)}</span>
        </div>
      </header>
      {state.stale && (
        <section className="banner" role="status">
          <strong>{translate(messages, 'staleTitle')}</strong>
          {renderErrorMessage(state.error, messages, 'staleFallback')}
        </section>
      )}
      {state.notice && (
        <section className="banner" data-tone={state.notice.tone ?? 'warning'} role="status">
          <strong>{translate(messages, 'operationWarning')}</strong>
          {renderErrorMessage(state.notice, messages, 'operationFailed')}
        </section>
      )}
      <nav className="toolbar" aria-label={translate(messages, 'viewsLabel')}>
        <div className="tabs">
          <TabButton view="overview" label={translate(messages, 'overview')} current={state.view} onSelect={actions.onView} />
          <TabButton view="specs" label={translate(messages, 'specs')} current={state.view} onSelect={actions.onView} />
          <TabButton view="history" label={translate(messages, 'history')} current={state.view} onSelect={actions.onView} />
          <TabButton view="runs" label={translate(messages, 'runs')} current={state.view} onSelect={actions.onView} />
          <TabButton view="attention" label={translate(messages, 'attention')} current={state.view} onSelect={actions.onView} />
        </div>
        <div className="meta toolbar-actions">
          <span className="live-state" data-state={state.managedConnection}>
            {translate(messages, connectionMessageKey(state.managedConnection))}
          </span>
          <span className="language-switch" role="group" aria-label={translate(messages, 'languageLabel')}>
            <button
              className="locale-button"
              type="button"
              data-locale="zh-CN"
              aria-pressed={locale === 'zh-CN'}
              onClick={() => actions.onLocale('zh-CN')}
            >
              {translate(messages, 'switchToChinese')}
            </button>
            <button
              className="locale-button"
              type="button"
              data-locale="en"
              aria-pressed={locale === 'en'}
              onClick={() => actions.onLocale('en')}
            >
              {translate(messages, 'switchToEnglish')}
            </button>
          </span>
          <button
            className="auto-refresh-button"
            type="button"
            data-action="auto-refresh"
            aria-pressed={state.autoRefresh}
            onClick={actions.onAutoRefresh}
          >
            {translate(messages, 'autoRefresh')}
          </button>
          <button
            className="refresh-button"
            type="button"
            data-action="refresh"
            disabled={state.refreshing}
            onClick={actions.onRefresh}
          >
            {translate(messages, state.refreshing ? 'refreshing' : 'refresh')}
          </button>
        </div>
      </nav>
      <CurrentView state={state} messages={messages} locale={locale} actions={actions} />
    </div>
  )
}

function CurrentView({
  state,
  messages,
  locale,
  actions,
}: {
  state: AppState
  messages: WebMessages
  locale: WebLocale
  actions: AppActions
}): ReactNode {
  if (!state.snapshot)
    return null
  if (state.view === 'specs')
    return <SpecsView state={state} messages={messages} actions={actions} />
  if (state.view === 'history')
    return <HistoryView state={state} messages={messages} actions={actions} />
  if (state.view === 'runs')
    return <RunsView state={state} messages={messages} locale={locale} actions={actions} />
  if (state.view === 'attention')
    return <AttentionView managed={state.snapshot.managed} messages={messages} actions={actions} />
  return <OverviewView overview={state.snapshot.overview} messages={messages} />
}

function OverviewView({ overview, messages }: { overview: WebOverviewProjection, messages: WebMessages }): ReactNode {
  const current = overview.current
  return (
    <section className="grid">
      <article className="card span-8 hero-card">
        <span className="label">{translate(messages, 'currentWork')}</span>
        <h2>{current.workRef ?? translate(messages, 'noCurrentWorkRef')}</h2>
        <p>{current.goal ?? translate(messages, 'noOpenGoal')}</p>
        <div className="meta"><span className="pill">{current.state}</span></div>
      </article>
      <article className="card span-4 next-action-card">
        <span className="label">{translate(messages, 'nextAction')}</span>
        <p>{current.nextAction ?? translate(messages, 'noNextAction')}</p>
      </article>
      <MetricCard label={translate(messages, 'open')} value={overview.summary.open} />
      <MetricCard label={translate(messages, 'focused')} value={overview.summary.focused} />
      <MetricCard label={translate(messages, 'blocked')} value={overview.summary.blocked} />
      <article className="card span-8 work-list-card">
        <h3>{translate(messages, 'openWork')}</h3>
        <List
          items={overview.records}
          empty={translate(messages, 'noRecords')}
          renderItem={record => (
            <>
              <strong>{record.workRef}</strong>
              <span>{record.goal ?? translate(messages, 'noSummary')}</span>
              <span className="meta">
                {record.kind}
                {' '}
                ·
                {' '}
                {record.progress.done}
                /
                {record.progress.total}
                {' '}
                ·
                {' '}
                {record.state}
              </span>
            </>
          )}
        />
      </article>
      <article className="card span-4 side-card">
        <h3>{translate(messages, 'blockers')}</h3>
        <TextList items={current.blockers} empty={translate(messages, 'noCurrentBlocker')} />
      </article>
      <article className="card span-12">
        <h3>{translate(messages, 'diagnostics')}</h3>
        <List
          items={overview.diagnostics}
          empty={translate(messages, 'noDiagnostics')}
          renderItem={diagnostic => (
            <>
              <strong>{diagnostic.code}</strong>
              <span>{diagnostic.message}</span>
              {diagnostic.path && <span className="meta">{diagnostic.path}</span>}
            </>
          )}
        />
      </article>
    </section>
  )
}

function SpecsView({ state, messages, actions }: { state: AppState, messages: WebMessages, actions: AppActions }): ReactNode {
  const specs = state.snapshot!.specs
  const detail = state.detail?.mode === 'detail' && 'source' in state.detail ? state.detail : null
  const search = state.search?.mode === 'search' ? state.search : null
  function submit(event: FormEvent<HTMLFormElement>): void {
    event.preventDefault()
    const query = String(new FormData(event.currentTarget).get('q') ?? '').trim()
    if (query)
      actions.onSearch(query)
  }
  return (
    <section className="grid master-detail has-search">
      <article className="card span-12 search-card">
        <form className="searchbar" data-action="spec-search" onSubmit={submit}>
          <input name="q" maxLength={200} required placeholder={translate(messages, 'boundedSearchPlaceholder')} />
          <button type="submit">{translate(messages, 'searchSpecs')}</button>
        </form>
        {search && (
          <>
            <p className="meta">{translate(messages, 'matches', search.summary)}</p>
            <List<WebSpecsSearchProjection['matches'][number]>
              items={search.matches}
              empty={translate(messages, 'noMatches')}
              renderItem={match => (
                <>
                  <button type="button" data-spec-path={match.path} onClick={() => actions.onSpec(match.path)}>{match.title}</button>
                  <span>{match.excerpt}</span>
                  <span className="meta">
                    {match.path}
                    :
                    {match.line}
                    {match.heading ? ` · ${match.heading}` : ''}
                  </span>
                </>
              )}
            />
          </>
        )}
      </article>
      <article className="card span-4 collection-card">
        <h3>{translate(messages, 'documents')}</h3>
        <p className="meta">{translate(messages, 'boundedRecords', specs.summary)}</p>
        <List
          items={specs.documents}
          empty={translate(messages, 'noRecords')}
          renderItem={document => (
            <>
              <button type="button" data-spec-path={document.path} onClick={() => actions.onSpec(document.path)}>{document.title}</button>
              <span>{document.summary ?? document.path}</span>
              <span className="meta">
                {document.kind}
                {' '}
                ·
                {' '}
                {translate(messages, 'bytes', { value: document.bytes })}
              </span>
            </>
          )}
        />
      </article>
      <article className="card span-8 detail-card">
        <h3>{detail?.document.title ?? translate(messages, 'documentDetail')}</h3>
        {detail
          ? <MarkdownDocument key={`${detail.source.identities.specs}:${detail.document.path}`} document={detail.document} messages={messages} />
          : <p className="empty">{translate(messages, 'selectSpec')}</p>}
      </article>
    </section>
  )
}

function MarkdownDocument({
  document,
  messages,
}: {
  document: {
    path: string
    content: string
    contentTruncated: boolean
    markdown: WebMarkdownProjection
    metadata?: WebDocumentMetadata
    summary?: string | null
  }
  messages: WebMessages
}): ReactNode {
  const [mode, setMode] = useState<'rendered' | 'source'>('rendered')
  const incomplete = document.contentTruncated || document.markdown.bounded
  return (
    <>
      <div className="document-toolbar">
        <p className="meta">
          {document.path}
          {incomplete ? ` · ${translate(messages, 'boundedExcerpt')}` : ''}
        </p>
        <span className="document-mode-switch" role="group" aria-label={translate(messages, 'documentMode')}>
          <button
            type="button"
            aria-pressed={mode === 'rendered'}
            onClick={() => setMode('rendered')}
          >
            {translate(messages, 'renderedDocument')}
          </button>
          <button
            type="button"
            aria-pressed={mode === 'source'}
            onClick={() => setMode('source')}
          >
            {translate(messages, 'sourceDocument')}
          </button>
        </span>
      </div>
      {(incomplete || document.markdown.unsupported) && (
        <p className="document-warning" role="status">
          {translate(messages, incomplete ? 'incompleteDocument' : 'unsupportedDocument')}
        </p>
      )}
      {mode === 'rendered' && (document.metadata?.kind || document.metadata?.status || document.summary) && (
        <aside className="document-metadata" aria-label={translate(messages, 'documentMetadata')}>
          {(document.metadata?.kind || document.metadata?.status) && (
            <div className="document-metadata-fields">
              {document.metadata.kind && (
                <span>
                  <strong>{translate(messages, 'documentKind')}</strong>
                  {' '}
                  {document.metadata.kind}
                </span>
              )}
              {document.metadata.status && (
                <span>
                  <strong>{translate(messages, 'documentStatus')}</strong>
                  {' '}
                  {document.metadata.status}
                </span>
              )}
            </div>
          )}
          {document.summary && <p>{document.summary}</p>}
        </aside>
      )}
      {mode === 'source'
        ? <pre data-document-mode="source">{document.content}</pre>
        : (
            <div className="markdown-document" data-document-mode="rendered">
              {document.markdown.blocks.map((block, index) => (
                <MarkdownBlock key={index} block={block} messages={messages} />
              ))}
            </div>
          )}
    </>
  )
}

function MarkdownBlock({ block, messages }: { block: WebMarkdownBlock, messages: WebMessages }): ReactNode {
  switch (block.type) {
    case 'heading': {
      const Heading = `h${block.depth}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'
      return <Heading>{renderMarkdownInlines(block.children, messages)}</Heading>
    }
    case 'paragraph':
      return <p>{renderMarkdownInlines(block.children, messages)}</p>
    case 'list': {
      const ListTag = block.ordered ? 'ol' : 'ul'
      return (
        <ListTag {...(block.ordered && block.start !== null ? { start: block.start } : {})}>
          {block.items.map((item, index) => (
            <li key={index} className={item.checked === null ? undefined : 'task-list-item'}>
              {item.checked !== null && (
                <input
                  type="checkbox"
                  checked={item.checked}
                  disabled
                  aria-label={translate(messages, item.checked ? 'completedTask' : 'openTask')}
                />
              )}
              <div>
                {item.blocks.map((itemBlock, blockIndex) => (
                  <MarkdownBlock key={blockIndex} block={itemBlock} messages={messages} />
                ))}
              </div>
            </li>
          ))}
        </ListTag>
      )
    }
    case 'blockquote':
      return (
        <blockquote>
          {block.blocks.map((child, index) => <MarkdownBlock key={index} block={child} messages={messages} />)}
        </blockquote>
      )
    case 'code':
      return (
        <pre className="markdown-code">
          <code {...(block.language ? { 'data-language': block.language } : {})}>{block.value}</code>
        </pre>
      )
    case 'thematic-break':
      return <hr />
    case 'unsupported':
      return <p className="unsupported-markdown">{unsupportedMarkdownLabel(messages)}</p>
  }
}

function renderMarkdownInlines(inlines: WebMarkdownInline[], messages: WebMessages): ReactNode[] {
  return inlines.map((inline, index) => {
    switch (inline.type) {
      case 'text':
        return inline.value
      case 'emphasis':
        return <em key={index}>{renderMarkdownInlines(inline.children, messages)}</em>
      case 'strong':
        return <strong key={index}>{renderMarkdownInlines(inline.children, messages)}</strong>
      case 'inline-code':
        return <code key={index}>{inline.value}</code>
      case 'link':
        return (
          <a
            key={index}
            href={inline.href}
            title={inline.title ?? undefined}
            target="_blank"
            rel="noopener noreferrer"
            referrerPolicy="no-referrer"
          >
            {renderMarkdownInlines(inline.children, messages)}
          </a>
        )
      case 'break':
        return <br key={index} />
      case 'unsupported':
        return (
          <span key={index} className="unsupported-markdown">
            {renderMarkdownInlines(inline.children, messages)}
            {' '}
            {unsupportedMarkdownLabel(messages)}
          </span>
        )
    }
    return null
  })
}

function unsupportedMarkdownLabel(messages: WebMessages): string {
  return `[${translate(messages, 'unsupportedContent')}]`
}

function HistoryView({ state, messages, actions }: { state: AppState, messages: WebMessages, actions: AppActions }): ReactNode {
  const history = state.snapshot!.history
  const detail = state.detail?.mode === 'detail' && 'record' in state.detail ? state.detail : null
  const workRefCounts = new Map<string, number>()
  for (const record of history.records)
    workRefCounts.set(record.workRef, (workRefCounts.get(record.workRef) ?? 0) + 1)
  return (
    <section className="grid master-detail">
      <article className="card span-4 collection-card">
        <h3>{translate(messages, 'archivedChanges')}</h3>
        <p className="meta">{translate(messages, 'boundedRecords', history.summary)}</p>
        <List
          items={history.records}
          empty={translate(messages, 'noRecords')}
          renderItem={(record) => {
            const hasLookup = validOpaqueLookup(record.lookupId)
            const legacyAmbiguous = !hasLookup && (workRefCounts.get(record.workRef) ?? 0) > 1
            return (
              <>
                <button
                  type="button"
                  {...(hasLookup ? { 'data-history-id': record.lookupId } : {})}
                  data-history-work-ref={record.workRef}
                  {...(legacyAmbiguous ? { 'data-history-ambiguous': 'true' } : {})}
                  onClick={() => actions.onHistory(record, legacyAmbiguous)}
                >
                  {record.workRef}
                </button>
                <span>{record.summary}</span>
                <span className="meta">
                  {record.date}
                  {' '}
                  ·
                  {' '}
                  {record.kind}
                </span>
              </>
            )
          }}
        />
      </article>
      <article className="card span-8 detail-card">
        <h3>{detail?.record.workRef ?? translate(messages, 'archiveDetail')}</h3>
        {detail ? <HistoryDetail detail={detail} messages={messages} /> : <p className="empty">{translate(messages, 'selectArchive')}</p>}
      </article>
    </section>
  )
}

function RunsView({
  state,
  messages,
  locale,
  actions,
}: {
  state: AppState
  messages: WebMessages
  locale: WebLocale
  actions: AppActions
}): ReactNode {
  const managed = state.snapshot!.managed
  const detail = state.detail?.mode === 'run-detail' ? state.detail : null
  const multipleRuns = managed.runs.length > 1
  if (!managed.available)
    return <ManagedUnavailable managed={managed} titleKey="runs" messages={messages} />
  return (
    <section className={`runs-workspace ${multipleRuns ? 'has-run-picker' : 'is-single-run'}`}>
      {multipleRuns && (
        <details className="run-picker">
          <summary>
            <span>
              <strong>{translate(messages, 'managedRuns')}</strong>
              <span className="meta">{translate(messages, 'boundedRuns', managed.runsSummary)}</span>
            </span>
            <span className="run-picker-current">
              {detail?.run.run?.workRef ?? detail?.run.run?.runId ?? translate(messages, 'selectRunShort')}
            </span>
          </summary>
          <List
            items={managed.runs}
            empty={translate(messages, 'noManagedRuns')}
            renderItem={run => (
              <>
                <button
                  type="button"
                  data-run-id={run.lookupId}
                  aria-current={detail?.run.run?.runId === run.runId ? 'true' : undefined}
                  title={run.workRef || run.runId}
                  onClick={() => actions.onRun(run.lookupId)}
                >
                  {run.workRef || run.runId}
                </button>
                <span className="meta">
                  {run.phase ?? translate(messages, 'noObservedPhase')}
                  {' '}
                  ·
                  {translate(messages, `runStatus_${run.status}`)}
                  {' '}
                  ·
                  {translate(messages, 'dispatchCount', { value: run.dispatches })}
                  {' '}
                  ·
                  {translate(messages, 'receiptCount', { value: run.receipts })}
                </span>
                <Freshness freshness={run.freshness} messages={messages} locale={locale} showReasons={false} />
              </>
            )}
          />
        </details>
      )}
      <article
        className="run-workbench"
        key={detail?.run.run?.runId ?? 'empty-run-detail'}
      >
        {detail
          ? (
              <RunDetail
                detail={detail}
                messages={messages}
                locale={locale}
              />
            )
          : (
              <div className="run-empty-state">
                <h3>{translate(messages, 'runDetail')}</h3>
                <p className="empty">{translate(messages, 'selectRun')}</p>
                {!multipleRuns && managed.runs[0] && (
                  <button
                    type="button"
                    data-run-id={managed.runs[0].lookupId}
                    onClick={() => actions.onRun(managed.runs[0]!.lookupId)}
                  >
                    {translate(messages, 'openRun')}
                  </button>
                )}
              </div>
            )}
      </article>
    </section>
  )
}

function AttentionView({
  managed,
  messages,
  actions,
}: {
  managed: WebManagedProjection
  messages: WebMessages
  actions: AppActions
}): ReactNode {
  if (!managed.available)
    return <ManagedUnavailable managed={managed} titleKey="attention" messages={messages} />
  return (
    <section className="grid">
      <article className="card span-12 attention-card">
        <h3>{translate(messages, 'managedAttention')}</h3>
        <p className="meta">{translate(messages, 'attentionCount', managed.attentionSummary)}</p>
        <List
          items={managed.attention}
          empty={translate(messages, 'noManagedAttention')}
          itemClassName="list-item attention-item"
          renderItem={item => (
            <>
              <div className="summary">
                <span className="pill">{item.kind}</span>
                {item.runId && item.runLookupId && (
                  <button type="button" data-run-id={item.runLookupId} onClick={() => actions.onRun(item.runLookupId!)}>{item.runId}</button>
                )}
              </div>
              <span>{item.summary}</span>
              <span className="meta">
                {item.sourceRefs.map(ref => `${ref.type}:${ref.id}@${ref.sequence}`).join(' · ') || translate(messages, 'noSourceReference')}
              </span>
            </>
          )}
        />
      </article>
    </section>
  )
}

function ManagedUnavailable({
  managed,
  titleKey,
  messages,
}: {
  managed: WebManagedProjection
  titleKey: string
  messages: WebMessages
}): ReactNode {
  return (
    <section className="grid">
      <article className="card span-12 unavailable">
        <span className="label">{translate(messages, titleKey)}</span>
        <h2>{translate(messages, 'managedUnavailable')}</h2>
        <p>{managed.diagnostic?.message ?? translate(messages, 'noManagedProjection')}</p>
        {managed.diagnostic?.action && <p className="meta">{managed.diagnostic.action}</p>}
        <p className="meta">{translate(messages, 'managedUnavailableBoundary')}</p>
      </article>
    </section>
  )
}

function RunDetail({
  detail,
  messages,
  locale,
}: {
  detail: WebManagedRunDetailProjection
  messages: WebMessages
  locale: WebLocale
}): ReactNode {
  const run = detail.run
  const invocationModel = useMemo(() => buildInvocationTree(run), [run])
  const anomalousInvocations = invocationModel.nodes.filter(node => node.anomalyCount > 0)
  const firstAnomaly = anomalousInvocations[0] ?? null
  const [auditMode, setAuditMode] = useState<'sequence' | 'raw' | null>(null)
  const [selectedDispatchId, setSelectedDispatchId] = useState<string | null>(firstAnomaly?.dispatchId ?? null)
  const selectedAnomalyIndex = anomalousInvocations.findIndex(node => node.dispatchId === selectedDispatchId)
  const title = run.run?.workRef ?? run.run?.runId ?? translate(messages, 'managedRun')
  const hasAnomalies = invocationModel.summary.anomalies > 0
  const selectAnomaly = (index: number): void => {
    const target = anomalousInvocations[index]
    if (target)
      setSelectedDispatchId(target.dispatchId)
  }
  return (
    <div className="run-explorer">
      <header className="run-detail-header">
        <div className="run-heading">
          <span className="label">{translate(messages, 'runDetail')}</span>
          <h3 className="run-title" title={title}>{title}</h3>
          <div className="run-context-meta">
            <span>{run.phase ?? translate(messages, 'noPhase')}</span>
            <span aria-hidden="true">·</span>
            <span>
              {translate(messages, 'auditSequence')}
              {' '}
              <strong>
                #
                {run.freshness.sourceSequence}
              </strong>
            </span>
          </div>
        </div>
        <div className="run-header-actions">
          <div className="run-status-summary" aria-label={translate(messages, 'runStatusSummary')}>
            <span className="status-chip status-run">
              <span>{translate(messages, 'runStatus')}</span>
              <strong>{translate(messages, `runStatus_${run.status}`)}</strong>
            </span>
            <span className={`status-chip status-freshness is-${detail.freshness.state}`}>
              <span>{translate(messages, 'freshnessStatus')}</span>
              <strong>{translate(messages, `freshness_${detail.freshness.state}`)}</strong>
            </span>
          </div>
          {hasAnomalies && (
            <div className="anomaly-navigation" aria-label={translate(messages, 'anomalyNavigation')}>
              <span>
                {translate(messages, 'anomalyPosition', {
                  current: selectedAnomalyIndex >= 0 ? selectedAnomalyIndex + 1 : '—',
                  total: anomalousInvocations.length,
                })}
              </span>
              <button
                type="button"
                data-action="previous-anomaly"
                aria-label={translate(messages, 'previousAnomaly')}
                disabled={selectedAnomalyIndex <= 0}
                onClick={() => selectAnomaly(selectedAnomalyIndex - 1)}
              >
                ↑
              </button>
              <button
                type="button"
                data-action="next-anomaly"
                aria-label={translate(messages, 'nextAnomaly')}
                disabled={selectedAnomalyIndex < 0 || selectedAnomalyIndex >= anomalousInvocations.length - 1}
                onClick={() => selectAnomaly(selectedAnomalyIndex + 1)}
              >
                ↓
              </button>
            </div>
          )}
        </div>
      </header>
      <div className={`run-explorer-summary ${hasAnomalies ? 'has-anomalies' : 'is-clear'}`} role="status">
        <strong>
          {translate(messages, hasAnomalies ? 'runOutcomeWithAnomalies' : 'runOutcomeClear', {
            value: invocationModel.summary.anomalies,
          })}
        </strong>
        <Freshness freshness={detail.freshness} messages={messages} locale={locale} />
        {firstAnomaly && (
          <button
            type="button"
            className="run-outcome-action"
            onClick={() => {
              setSelectedDispatchId(firstAnomaly.dispatchId)
            }}
          >
            {translate(messages, 'inspectFirstAnomaly')}
          </button>
        )}
      </div>
      <InvocationTree
        run={run}
        model={invocationModel}
        selectedDispatchId={selectedDispatchId}
        onSelect={setSelectedDispatchId}
        messages={messages}
      />
      <section className={`run-audit-panel ${auditMode ? 'is-open' : ''}`}>
        <header className="run-audit-header">
          <div>
            <span className="label">{translate(messages, 'auditPanel')}</span>
            <strong>{translate(messages, 'auditPanelHint')}</strong>
          </div>
          <div className="run-audit-switch" role="group" aria-label={translate(messages, 'auditPanel')}>
            {(['sequence', 'raw'] as const).map(value => (
              <button
                type="button"
                aria-pressed={auditMode === value}
                onClick={() => setAuditMode(current => current === value ? null : value)}
                key={value}
              >
                {translate(messages, `runView_${value}`)}
              </button>
            ))}
          </div>
        </header>
        {auditMode === 'sequence' && (
          <div
            id="run-view-sequence"
            className="run-audit-content"
            role="region"
            aria-label={translate(messages, 'runView_sequence')}
          >
            <RunGraph
              key={run.run?.runId ?? run.freshness.sourceSequence}
              run={run}
              messages={messages}
              selectedDispatchId={selectedDispatchId}
              onSelectDispatch={setSelectedDispatchId}
            />
          </div>
        )}
        {auditMode === 'raw' && (
          <RawRunEvents
            run={run}
            selectedDispatchId={selectedDispatchId}
            onSelect={setSelectedDispatchId}
            messages={messages}
          />
        )}
      </section>
      {run.truncated && <p className="banner">{translate(messages, 'boundedProjectionWarning')}</p>}
    </div>
  )
}

function InvocationTree({
  run,
  model,
  selectedDispatchId,
  onSelect,
  messages,
}: {
  run: WebManagedRunDetailProjection['run']
  model: InvocationTreeModel
  selectedDispatchId: string | null
  onSelect: (dispatchId: string | null) => void
  messages: WebMessages
}): ReactNode {
  const [expanded, setExpanded] = useState(() => new Set(model.nodes.map(node => node.dispatchId)))
  const [query, setQuery] = useState('')
  const [anomaliesOnly, setAnomaliesOnly] = useState(false)
  const selected = selectedDispatchId ? model.byDispatchId.get(selectedDispatchId) ?? null : null
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const matches = (node: InvocationTreeNode): boolean => {
    const searchable = [
      node.dispatch.workerRole,
      node.dispatch.workerDisplayName,
      node.dispatch.workerId,
      node.dispatch.dispatchId,
      node.dispatch.objectiveRef,
    ].filter(Boolean).join('\n').toLocaleLowerCase()
    return (!normalizedQuery || searchable.includes(normalizedQuery))
      && (!anomaliesOnly || node.anomalyCount > 0)
  }
  const visible = (node: InvocationTreeNode): boolean =>
    matches(node) || node.children.some(visible)
  const toggle = (dispatchId: string): void => {
    setExpanded((current) => {
      const next = new Set(current)
      if (next.has(dispatchId))
        next.delete(dispatchId)
      else
        next.add(dispatchId)
      return next
    })
  }

  return (
    <section id="run-view-invocations" className="invocation-view" aria-labelledby="invocation-tree-title">
      <div className="invocation-toolbar">
        <div>
          <h4 id="invocation-tree-title">{translate(messages, 'invocationTree')}</h4>
          <p className="meta">
            {translate(messages, 'invocationTreeSummary', model.summary)}
          </p>
        </div>
        <div className="invocation-filters" role="group" aria-label={translate(messages, 'invocationFilters')}>
          <input
            type="search"
            value={query}
            placeholder={translate(messages, 'searchInvocations')}
            aria-label={translate(messages, 'searchInvocations')}
            onChange={event => setQuery(event.target.value)}
          />
          <button
            type="button"
            aria-pressed={anomaliesOnly}
            onClick={() => setAnomaliesOnly(value => !value)}
          >
            {translate(messages, 'anomaliesOnly', { value: model.summary.anomalies })}
          </button>
        </div>
      </div>
      <div className={`invocation-layout ${selected ? 'has-inspector' : ''}`}>
        <div className="invocation-tree-table">
          <div className="invocation-table-header">
            <span>{translate(messages, 'invocationColumnCall')}</span>
            <span>{translate(messages, 'invocationColumnWorker')}</span>
            <span>{translate(messages, 'invocationColumnResult')}</span>
            <span>{translate(messages, 'invocationColumnSequence')}</span>
            <span>{translate(messages, 'invocationColumnReceipt')}</span>
          </div>
          <div className="invocation-tree" role="tree" aria-label={translate(messages, 'invocationTree')}>
            <div className="invocation-manager-root" aria-hidden="true">
              <span className="invocation-manager-label">
                <span className="invocation-connector" aria-hidden="true" />
                <strong>{translate(messages, 'managerLane')}</strong>
              </span>
              <span>{run.managerId ?? translate(messages, 'unknownIdentity')}</span>
              <span>—</span>
              <span>—</span>
              <span>—</span>
            </div>
            {model.roots.filter(visible).map(node => (
              <InvocationTreeBranch
                node={node}
                depth={1}
                expanded={expanded}
                selectedDispatchId={selectedDispatchId}
                visible={visible}
                onToggle={toggle}
                onSelect={onSelect}
                messages={messages}
                key={node.dispatchId}
              />
            ))}
            {model.roots.length === 0 && <p className="empty">{translate(messages, 'noDispatches')}</p>}
          </div>
        </div>
        {selected && <InvocationInspector node={selected} messages={messages} onClose={() => onSelect(null)} />}
      </div>
    </section>
  )
}

function InvocationTreeBranch({
  node,
  depth,
  expanded,
  selectedDispatchId,
  visible,
  onToggle,
  onSelect,
  messages,
}: {
  node: InvocationTreeNode
  depth: number
  expanded: Set<string>
  selectedDispatchId: string | null
  visible: (node: InvocationTreeNode) => boolean
  onToggle: (dispatchId: string) => void
  onSelect: (dispatchId: string | null) => void
  messages: WebMessages
}): ReactNode {
  const isExpanded = expanded.has(node.dispatchId)
  const hasChildren = node.children.some(visible)
  const selected = selectedDispatchId === node.dispatchId
  const role = node.dispatch.workerRole ?? node.dispatch.lane
  const ordinal = node.roleOrdinal ?? node.workerOrdinal
  const callLabel = [
    translate(messages, 'invocationCall', { role, ordinal }),
    node.dispatch.objectiveRef ? translate(messages, 'objective', { value: node.dispatch.objectiveRef }) : null,
    translate(messages, `relationship_${node.relationship}`),
  ].filter(Boolean).join(' · ')
  const workerLabel = node.dispatch.workerDisplayName
    ? `${node.dispatch.workerDisplayName} · ${node.dispatch.workerId}`
    : node.dispatch.workerId
  const resultLabel = [
    translate(messages, `invocation_${node.dispatch.terminalState}`),
    node.anomalyCount > 0 ? translate(messages, 'anomalyCount', { value: node.anomalyCount }) : null,
  ].filter(Boolean).join(' · ')
  const sequenceLabel = `#${node.sequenceStart}${node.sequenceEnd === node.sequenceStart ? '' : `–${node.sequenceEnd}`}`
  const receiptLabel = [
    translate(messages, `receipt_${node.dispatch.receiptState}`),
    node.dispatch.receiptResult,
  ].filter(Boolean).join(' · ')
  const accessibleLabel = translate(messages, 'invocationTreeItemLabel', {
    call: callLabel,
    worker: workerLabel,
    result: resultLabel,
    sequence: sequenceLabel,
    receipt: receiptLabel,
  })
  return (
    <div role="none">
      <div
        role="treeitem"
        tabIndex={0}
        aria-label={accessibleLabel}
        aria-selected={selected}
        aria-level={depth}
        aria-expanded={hasChildren ? isExpanded : undefined}
        className={`invocation-row ${selected ? 'is-selected' : ''} ${node.anomalyCount > 0 ? 'has-anomaly' : ''}`}
        data-dispatch-id={node.dispatchId}
        onClick={() => onSelect(node.dispatchId)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowRight' && hasChildren && !isExpanded) {
            event.preventDefault()
            onToggle(node.dispatchId)
          }
          if (event.key === 'ArrowLeft' && hasChildren && isExpanded) {
            event.preventDefault()
            onToggle(node.dispatchId)
          }
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            onSelect(node.dispatchId)
          }
        }}
      >
        <div
          className="invocation-call-cell"
          style={{ '--tree-depth': depth } as CSSProperties}
        >
          <span
            className={`invocation-expand ${hasChildren ? '' : 'is-empty'}`}
            aria-hidden="true"
            onClick={(event) => {
              event.stopPropagation()
              if (hasChildren)
                onToggle(node.dispatchId)
            }}
          >
            {hasChildren ? isExpanded ? '⌄' : '›' : <span className="invocation-node-marker" aria-hidden="true" />}
          </span>
          <span className="invocation-select">
            <strong>{translate(messages, 'invocationCall', { role, ordinal })}</strong>
            {node.dispatch.objectiveRef && (
              <span className="invocation-objective">
                {node.dispatch.objectiveRef}
              </span>
            )}
            <span className="invocation-meta">
              {translate(messages, `relationship_${node.relationship}`)}
            </span>
          </span>
        </div>
        <span className="invocation-cell invocation-worker-cell" data-label={translate(messages, 'invocationColumnWorker')}>
          <strong>{node.dispatch.workerDisplayName ?? node.dispatch.workerId}</strong>
          <span className="invocation-secondary">
            {node.dispatch.workerId}
          </span>
        </span>
        <span className="invocation-cell invocation-result-cell" data-label={translate(messages, 'invocationColumnResult')}>
          <span className={`invocation-state is-${node.dispatch.terminalState}`}>
            {translate(messages, `invocation_${node.dispatch.terminalState}`)}
          </span>
          {node.anomalyCount > 0 && (
            <span className="invocation-anomaly-count">
              {translate(messages, 'anomalyCount', { value: node.anomalyCount })}
            </span>
          )}
        </span>
        <span className="invocation-cell invocation-sequence-cell" data-label={translate(messages, 'invocationColumnSequence')}>
          <strong>
            #
            {node.sequenceStart}
            {node.sequenceEnd === node.sequenceStart ? '' : `–${node.sequenceEnd}`}
          </strong>
        </span>
        <span className="invocation-cell invocation-receipt-cell" data-label={translate(messages, 'invocationColumnReceipt')}>
          <strong>{translate(messages, `receipt_${node.dispatch.receiptState}`)}</strong>
          {node.dispatch.receiptResult && <span>{node.dispatch.receiptResult}</span>}
        </span>
      </div>
      {hasChildren && isExpanded && node.children.filter(visible).map(child => (
        <InvocationTreeBranch
          node={child}
          depth={depth + 1}
          expanded={expanded}
          selectedDispatchId={selectedDispatchId}
          visible={visible}
          onToggle={onToggle}
          onSelect={onSelect}
          messages={messages}
          key={child.dispatchId}
        />
      ))}
    </div>
  )
}

function InvocationInspector({
  node,
  messages,
  onClose,
}: {
  node: InvocationTreeNode
  messages: WebMessages
  onClose: () => void
}): ReactNode {
  const dispatch = node.dispatch
  return (
    <aside className="invocation-inspector" aria-live="polite" tabIndex={0}>
      <div className="invocation-inspector-heading">
        <div>
          <span className="label">{translate(messages, 'invocationDetail')}</span>
          <h4>{dispatch.workerRole ?? dispatch.lane}</h4>
        </div>
        <div className="invocation-inspector-actions">
          <span className={`invocation-state is-${dispatch.terminalState}`}>
            {translate(messages, `invocation_${dispatch.terminalState}`)}
          </span>
          <button
            type="button"
            className="invocation-inspector-close"
            aria-label={translate(messages, 'closeInspector')}
            onClick={onClose}
          >
            ×
          </button>
        </div>
      </div>
      {dispatch.workerDisplayName && <p><strong>{dispatch.workerDisplayName}</strong></p>}
      <dl className="invocation-facts">
        <dt>{translate(messages, 'dispatchIdentity')}</dt>
        <dd>{dispatch.dispatchId}</dd>
        <dt>{translate(messages, 'workerIdentity')}</dt>
        <dd>{dispatch.workerId}</dd>
        <dt>{translate(messages, 'parentInvocation')}</dt>
        <dd>{node.parentDispatchId ?? translate(messages, `relationship_${node.relationship}`)}</dd>
        <dt>{translate(messages, 'sequenceRange')}</dt>
        <dd>
          #
          {node.sequenceStart}
          –
          {node.sequenceEnd}
        </dd>
        <dt>{translate(messages, 'invocationResult')}</dt>
        <dd>{dispatch.receiptResult ?? dispatch.receiptState}</dd>
      </dl>
      {dispatch.objectiveRef && <p>{translate(messages, 'objective', { value: dispatch.objectiveRef })}</p>}
      <h5>{translate(messages, 'attachedObservations')}</h5>
      <ul className="list invocation-observations">
        {node.events.map(event => (
          <li className="list-item" key={event.eventId}>
            <strong>
              #
              {event.sequence}
              {' '}
              ·
              {event.kind}
            </strong>
            <span>{event.summary ?? event.eventId}</span>
          </li>
        ))}
        {node.receipts.map(receipt => (
          <li className="list-item" key={receipt.receiptId}>
            <strong>
              #
              {receipt.sequence}
              {' '}
              ·
              {translate(messages, 'receipt')}
            </strong>
            <span>
              {receipt.result}
              {' '}
              ·
              {' '}
              {receipt.receiptId}
            </span>
          </li>
        ))}
        {node.events.length === 0 && node.receipts.length === 0 && (
          <li className="empty">{translate(messages, 'noAttachedObservations')}</li>
        )}
      </ul>
    </aside>
  )
}

function RawRunEvents({
  run,
  selectedDispatchId,
  onSelect,
  messages,
}: {
  run: WebManagedRunDetailProjection['run']
  selectedDispatchId: string | null
  onSelect: (dispatchId: string | null) => void
  messages: WebMessages
}): ReactNode {
  return (
    <section id="run-view-raw" role="region" aria-label={translate(messages, 'rawEvents')} className="run-audit-content raw-events">
      <h4>{translate(messages, 'rawEvents')}</h4>
      <p className="meta">{translate(messages, 'rawEventsHint')}</p>
      <ul className="list">
        {run.timeline.map(item => (
          <li
            className={`list-item raw-event ${item.dispatchId === selectedDispatchId ? 'is-selected' : ''}`}
            key={nodeKey(item.type, item.id)}
          >
            <button type="button" onClick={() => onSelect(item.dispatchId)}>
              <strong>
                #
                {item.sequence}
                {' '}
                ·
                {item.type}
                {' '}
                ·
                {item.kind}
              </strong>
            </button>
            <span>{item.summary ?? item.id}</span>
            <span className="meta">
              {item.actorId}
              {item.dispatchId ? ` · ${item.dispatchId}` : ''}
              {item.parentRef ? ` · ${translate(messages, 'parentRef', { value: item.parentRef })}` : ''}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}

function RunGraph({
  run,
  messages,
  selectedDispatchId,
  onSelectDispatch,
}: {
  run: WebManagedRunDetailProjection['run']
  messages: WebMessages
  selectedDispatchId: string | null
  onSelectDispatch: (dispatchId: string | null) => void
}): ReactNode {
  const model = useMemo(() => buildRunGraphModel(run), [run])
  const [dispatchFilter, setDispatchFilter] = useState('')
  const [actorFilter, setActorFilter] = useState('')
  const [kindFilter, setKindFilter] = useState('')
  const [localSelectedKey, setLocalSelectedKey] = useState<string | null>(null)
  const actors = [...new Set(model.nodes.map(node => node.actorId).filter(Boolean))].sort()
  const kinds = [...new Set(model.nodes.map(node => node.kind))].sort()
  const localSelected = model.nodes.find(node => node.key === localSelectedKey) ?? null
  const selectedKey = localSelected?.dispatchId === selectedDispatchId
    ? localSelectedKey
    : selectedDispatchId
      ? nodeKey('dispatch', selectedDispatchId)
      : null
  const selected = model.nodes.find(node => node.key === selectedKey) ?? null
  const matches = (node: typeof model.nodes[number]): boolean =>
    (!dispatchFilter || node.dispatchId === dispatchFilter)
    && (!actorFilter || node.actorId === actorFilter)
    && (!kindFilter || node.kind === kindFilter)
  const nodeByKey = new Map(model.nodes.map(node => [node.key, node]))
  const selectNode = (key: string): void => {
    const node = nodeByKey.get(key)
    const nextKey = selectedKey === key ? null : key
    setLocalSelectedKey(nextKey)
    onSelectDispatch(nextKey ? node?.dispatchId ?? null : null)
  }
  const accessibleSummary = translate(messages, 'runGraphSummary', {
    lanes: model.lanes.length,
    dispatches: model.summary.dispatches,
    events: model.summary.events,
    receipts: model.summary.receipts,
    anomalies: model.summary.anomalies,
  })

  return (
    <section className="run-graph" aria-labelledby="run-graph-title">
      <div className="run-graph-heading">
        <div>
          <h4 id="run-graph-title">{translate(messages, 'runGraph')}</h4>
          <p className="meta" id="run-graph-summary">{accessibleSummary}</p>
        </div>
        <span className="pill">{translate(messages, 'sequenceOrdered')}</span>
      </div>
      <div className="run-graph-filters" aria-label={translate(messages, 'runGraphFilters')}>
        <label>
          <span>{translate(messages, 'filterDispatch')}</span>
          <select value={dispatchFilter} onChange={event => setDispatchFilter(event.target.value)}>
            <option value="">{translate(messages, 'allDispatches')}</option>
            {model.lanes
              .filter(lane => lane.dispatchId)
              .map(lane => <option value={lane.dispatchId!} key={lane.id}>{lane.dispatchId}</option>)}
          </select>
        </label>
        <label>
          <span>{translate(messages, 'filterActor')}</span>
          <select value={actorFilter} onChange={event => setActorFilter(event.target.value)}>
            <option value="">{translate(messages, 'allActors')}</option>
            {actors.map(actor => <option value={actor} key={actor}>{actor}</option>)}
          </select>
        </label>
        <label>
          <span>{translate(messages, 'filterEventType')}</span>
          <select value={kindFilter} onChange={event => setKindFilter(event.target.value)}>
            <option value="">{translate(messages, 'allEventTypes')}</option>
            {kinds.map(kind => <option value={kind} key={kind}>{kind}</option>)}
          </select>
        </label>
      </div>
      <div className="run-graph-frame">
        <div className="run-graph-labels">
          {model.lanes.map(lane => (
            <div className="run-graph-lane-label" key={lane.id} title={lane.label}>
              <strong>{lane.dispatchId ? translate(messages, 'dispatchLane') : translate(messages, 'managerLane')}</strong>
              <span>{lane.label}</span>
            </div>
          ))}
        </div>
        <div className="run-graph-scroll" data-testid="run-graph-scroll">
          <svg
            className="run-graph-plot"
            width={model.width}
            height={model.height}
            viewBox={`0 0 ${model.width} ${model.height}`}
            role="group"
            aria-labelledby="run-graph-title run-graph-summary"
          >
            {model.lanes.map((lane, index) => (
              <line
                className="run-graph-lane"
                x1="0"
                x2={model.width}
                y1={index * 76 + 38}
                y2={index * 76 + 38}
                key={lane.id}
              />
            ))}
            {model.edges.map((edge) => {
              const source = nodeByKey.get(edge.sourceKey)!
              const target = nodeByKey.get(edge.targetKey)!
              const visible = matches(source) && matches(target)
              const sourceX = runGraphNodeX(source.sequence)
              const sourceY = runGraphLaneY(model, source.laneId)
              const targetX = runGraphNodeX(target.sequence)
              const targetY = runGraphLaneY(model, target.laneId)
              const bend = Math.max(24, Math.abs(targetX - sourceX) / 2)
              return (
                <path
                  className={`run-graph-edge ${edge.state === 'after' ? 'is-anomaly' : ''} ${visible ? '' : 'is-filtered'}`}
                  d={`M ${sourceX} ${sourceY} C ${sourceX + bend} ${sourceY}, ${targetX - bend} ${targetY}, ${targetX} ${targetY}`}
                  key={edge.key}
                />
              )
            })}
            {model.nodes.map((node) => {
              const x = runGraphNodeX(node.sequence)
              const y = runGraphLaneY(model, node.laneId)
              const anomaly = node.parentState === 'missing' || node.parentState === 'after'
              const terminalAttention = node.type === 'dispatch'
                && node.terminalState !== null
                && node.terminalState !== 'safe'
              const active = matches(node)
              const selectedNode = selectedKey === node.key
              return (
                <g
                  className={`run-graph-node is-${node.type} ${anomaly ? 'is-anomaly' : ''} ${terminalAttention ? 'has-terminal-attention' : ''} ${active ? '' : 'is-filtered'} ${selectedNode ? 'is-selected' : ''}`}
                  data-node-key={node.key}
                  data-sequence={node.sequence}
                  role="button"
                  tabIndex={active ? 0 : -1}
                  aria-label={translate(messages, 'runGraphNodeLabel', {
                    sequence: node.sequence,
                    kind: node.kind,
                    actor: node.actorId,
                    dispatch: node.dispatchId ?? translate(messages, 'managerLane'),
                    terminal: node.terminalState ?? translate(messages, 'notApplicable'),
                  })}
                  aria-pressed={selectedNode}
                  onClick={() => selectNode(node.key)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      selectNode(node.key)
                    }
                  }}
                  key={node.key}
                >
                  {node.type === 'receipt'
                    ? <polygon points={`${x},${y - 12} ${x + 12},${y} ${x},${y + 12} ${x - 12},${y}`} />
                    : node.type === 'dispatch'
                      ? <rect x={x - 13} y={y - 11} width="26" height="22" rx="5" />
                      : <circle cx={x} cy={y} r="10" />}
                  <text className="run-graph-sequence" x={x} y={y - 18}>{node.sequence}</text>
                  {anomaly && <text className="run-graph-anomaly" x={x + 13} y={y - 9}>!</text>}
                  {node.type === 'dispatch' && node.terminalState && (
                    <text className="run-graph-terminal" x={x} y={y + 25}>{node.terminalState}</text>
                  )}
                  <title>{`${node.kind} · ${node.id} · ${node.actorId}`}</title>
                </g>
              )
            })}
          </svg>
        </div>
      </div>
      {selected
        ? (
            <div className="run-graph-inspector" aria-live="polite">
              <strong>{selected.kind}</strong>
              <span>{selected.id}</span>
              <span className="meta">
                {translate(messages, 'sequence', { value: selected.sequence })}
                {' · '}
                {selected.actorId}
                {selected.dispatchId ? ` · ${selected.dispatchId}` : ''}
                {selected.parentRef ? ` · ${translate(messages, 'parentRef', { value: selected.parentRef })}` : ''}
              </span>
              {selected.timestamp && <span className="meta">{translate(messages, 'displayTimestamp', { value: selected.timestamp })}</span>}
              {(selected.duplicateCount > 0 || selected.conflictCount > 0) && (
                <span className="meta">
                  {translate(messages, 'duplicates', { value: selected.duplicateCount })}
                  {' · '}
                  {translate(messages, 'conflicts', { value: selected.conflictCount })}
                </span>
              )}
              {selected.summary && <span>{selected.summary}</span>}
            </div>
          )
        : <p className="empty run-graph-inspector">{translate(messages, 'selectGraphNode')}</p>}
      <h4>{translate(messages, 'orderedTimeline')}</h4>
      {run.timeline.length === 0
        ? <p className="empty">{translate(messages, 'noTimeline')}</p>
        : (
            <ul className="list run-graph-timeline">
              {run.timeline.map((item) => {
                const key = nodeKey(item.type, item.id)
                const highlighted = selectedKey === key
                const graphNode = nodeByKey.get(key)
                const filtered = graphNode ? !matches(graphNode) : false
                return (
                  <li
                    className={`timeline-item ${highlighted ? 'is-selected' : ''} ${filtered ? 'is-filtered' : ''}`}
                    data-node-key={key}
                    data-filtered={filtered}
                    key={key}
                  >
                    <span className="sequence">{item.sequence}</span>
                    <span className="timeline-event">
                      <button className="timeline-select" type="button" aria-pressed={highlighted} onClick={() => selectNode(key)}>
                        <strong>{item.kind}</strong>
                      </button>
                      {item.summary ? ` · ${item.summary}` : ''}
                    </span>
                    <span className="meta timeline-meta">
                      {item.actorId}
                      {item.dispatchId ? ` · ${item.dispatchId}` : ''}
                      {item.parentRef ? ` · ${translate(messages, 'parentRef', { value: item.parentRef })}` : ''}
                      {item.parentState ? ` · ${translate(messages, 'parent', { value: item.parentState })}` : ''}
                      {item.receiptState ? ` · ${translate(messages, 'receiptState', { value: item.receiptState })}` : ''}
                      {item.terminalState ? ` · ${translate(messages, 'terminalState', { value: item.terminalState })}` : ''}
                      {' · '}
                      {translate(messages, item.outOfOrder ? 'outOfOrder' : 'ordered')}
                      {' · '}
                      {translate(messages, 'duplicates', { value: item.duplicateCount })}
                      {' · '}
                      {translate(messages, 'conflicts', { value: item.conflictCount })}
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
    </section>
  )
}

function HistoryDetail({
  detail,
  messages,
}: {
  detail: Extract<AppState['detail'], { mode: 'detail' }> & { record: any }
  messages: WebMessages
}): ReactNode {
  const record = detail.record
  return (
    <div className="history-document">
      <div className="history-document-summary">
        <p>{record.summary}</p>
        <div className="summary">
          <span className="pill">{record.kind}</span>
          <span className="meta">
            {record.date}
            {' '}
            ·
            {' '}
            {translate(messages, 'scenarios', { value: record.scenarioCount })}
          </span>
        </div>
        <div className="history-metrics" aria-label={translate(messages, 'archiveEvidenceSummary')}>
          <span>{translate(messages, 'taskProgress', record.checkboxes.tasks)}</span>
          <span>{translate(messages, 'verifyProgress', record.checkboxes.verify)}</span>
        </div>
      </div>
      <MarkdownDocument document={detail.document} messages={messages} />
    </div>
  )
}

function Freshness({
  freshness,
  messages,
  locale,
  showReasons = true,
}: {
  freshness: WebManagedFreshness
  messages: WebMessages
  locale: WebLocale
  showReasons?: boolean
}): ReactNode {
  return (
    <div className="freshness" data-state={freshness.state}>
      <span className="meta">
        {translate(messages, 'sourceSequence', { value: freshness.sourceSequence })}
        {' '}
        ·
        {' '}
        {formatTimestamp(freshness.generatedAt, locale)}
      </span>
      {showReasons && freshness.reasons.length > 0 && (
        <details className="freshness-reasons">
          <summary>{translate(messages, 'freshnessReasons', { value: freshness.reasons.length })}</summary>
          <ul>
            {freshness.reasons.map(reason => <li key={reason}>{reason}</li>)}
          </ul>
        </details>
      )}
    </div>
  )
}

function MetricCard({ label, value }: { label: string, value: number }): ReactNode {
  return (
    <article className="card span-4 metric-card">
      <span className="label">{label}</span>
      <div className="metric">{Number(value) || 0}</div>
    </article>
  )
}

function TabButton({
  view,
  label,
  current,
  onSelect,
}: {
  view: WebView
  label: string
  current: WebView
  onSelect: (view: WebView) => void
}): ReactNode {
  return <button type="button" data-view={view} aria-current={view === current ? 'page' : undefined} onClick={() => onSelect(view)}>{label}</button>
}

function TextList({ items, empty }: { items: readonly string[], empty: string }): ReactNode {
  return <List items={items} empty={empty} renderItem={item => <>{item}</>} />
}

function List<T>({
  items,
  renderItem,
  empty,
  itemClassName = 'list-item',
}: {
  items: readonly T[] | undefined
  renderItem: (item: T, index: number) => ReactNode
  empty: string
  itemClassName?: string
}): ReactNode {
  if (!items || items.length === 0)
    return <p className="empty">{empty}</p>
  return <ul className="list">{items.map((item, index) => <li className={itemClassName} key={itemKey(item, index)}>{renderItem(item, index)}</li>)}</ul>
}

function itemKey(item: unknown, index: number): string {
  if (item && typeof item === 'object') {
    for (const key of ['lookupId', 'receiptId', 'dispatchId', 'actorId', 'path', 'workRef', 'sequence']) {
      const value = (item as Record<string, unknown>)[key]
      if (typeof value === 'string' || typeof value === 'number')
        return `${key}:${value}`
    }
  }
  return `item:${index}`
}

function shortIdentity(value: string | undefined, messages: WebMessages): string {
  return typeof value === 'string' ? value.slice(0, 12) : translate(messages, 'unknownIdentity')
}

function renderErrorMessage(error: PresentationFailure | null, messages: WebMessages, fallbackKey: string): string {
  if (typeof error?.message === 'string')
    return error.message
  if (typeof error?.messageKey === 'string')
    return translate(messages, error.messageKey, error.messageValues)
  return translate(messages, fallbackKey)
}

function connectionMessageKey(connection: AppState['managedConnection']): string {
  return {
    connecting: 'connectionConnecting',
    live: 'connectionLive',
    recovering: 'connectionRecovering',
    disconnected: 'connectionDisconnected',
  }[connection]
}

function validOpaqueLookup(value: unknown): value is string {
  return typeof value === 'string' && /^[a-f0-9]{64}$/u.test(value)
}
