const projectionVersion = { major: 1, minor: 1 }

export function createInitialState() {
  return {
    view: 'overview',
    loading: true,
    stale: false,
    error: null,
    snapshot: null,
    detail: null,
    search: null,
    managedEventId: null,
    managedConnection: 'connecting',
  }
}

export function applySnapshotSuccess(state, envelope) {
  const validation = validateSnapshotEnvelope(envelope)
  if (!validation.ok) {
    return applySnapshotFailure(state, {
      code: validation.code,
      message: validation.message,
    })
  }
  return {
    ...state,
    loading: false,
    stale: false,
    error: null,
    snapshot: envelope.snapshot,
    detail: null,
    search: null,
  }
}

export function applySnapshotFailure(state, error) {
  return {
    ...state,
    loading: false,
    stale: state.snapshot !== null,
    error: {
      code: typeof error?.code === 'string' ? error.code : 'web_refresh_failed',
      message: typeof error?.message === 'string' ? error.message : 'Snapshot refresh failed',
    },
  }
}

export function applyManagedEvent(state, event) {
  if (!event || !Number.isSafeInteger(event.id) || event.id < 1)
    return { state, refresh: true }
  if (event.type === 'managed-gap') {
    return {
      state: {
        ...state,
        managedEventId: event.id,
        managedConnection: 'recovering',
      },
      refresh: true,
    }
  }
  if (state.managedEventId !== null && event.id <= state.managedEventId)
    return { state, refresh: false }
  if (state.managedEventId !== null && event.id !== state.managedEventId + 1) {
    return {
      state: {
        ...state,
        managedEventId: event.id,
        managedConnection: 'recovering',
      },
      refresh: true,
    }
  }
  if (event.type === 'managed-projection' && event.projection && state.snapshot) {
    return {
      state: {
        ...state,
        snapshot: {
          ...state.snapshot,
          managed: event.projection,
        },
        detail: state.detail?.mode === 'run-detail' ? null : state.detail,
        managedEventId: event.id,
        managedConnection: 'live',
      },
      refresh: false,
    }
  }
  if (event.type === 'managed-projection' && event.projection && !state.snapshot) {
    return {
      state: {
        ...state,
        managedEventId: event.id,
        managedConnection: 'recovering',
      },
      refresh: true,
    }
  }
  return {
    state: {
      ...state,
      managedEventId: event.id,
      managedConnection: event.type === 'broker-stopping' || event.type === 'session-unloaded'
        ? 'disconnected'
        : state.managedConnection,
    },
    refresh: false,
  }
}

export function createSseParser(onEvent) {
  let buffer = ''
  let data = []
  let id = null
  let type = 'message'
  function dispatch() {
    if (data.length === 0) {
      id = null
      type = 'message'
      return
    }
    const raw = data.join('\n')
    data = []
    let value
    try {
      value = JSON.parse(raw)
    }
    catch {
      id = null
      type = 'message'
      return
    }
    onEvent({
      ...value,
      ...(id === null ? {} : { id: Number(id) }),
      type: value?.type ?? type,
    })
    id = null
    type = 'message'
  }
  return {
    push(chunk) {
      buffer += chunk
      while (true) {
        const newline = buffer.indexOf('\n')
        if (newline < 0)
          break
        const line = buffer.slice(0, newline).replace(/\r$/u, '')
        buffer = buffer.slice(newline + 1)
        if (line === '') {
          dispatch()
          continue
        }
        if (line.startsWith(':'))
          continue
        const separator = line.indexOf(':')
        const field = separator < 0 ? line : line.slice(0, separator)
        const value = separator < 0 ? '' : line.slice(separator + 1).replace(/^ /u, '')
        if (field === 'data')
          data.push(value)
        else if (field === 'id')
          id = value
        else if (field === 'event')
          type = value
      }
    },
    finish() {
      if (buffer.length > 0)
        buffer += '\n'
      dispatch()
      buffer = ''
    },
  }
}

export function createProjectionRequestCoordinator() {
  let generation = 0
  const current = {
    detail: null,
    search: null,
  }
  function cancel(kind) {
    const ticket = current[kind]
    ticket?.controller.abort()
    current[kind] = null
  }
  return {
    begin(kind, snapshot) {
      if (kind !== 'detail' && kind !== 'search')
        throw new Error('Projection request kind is invalid')
      current[kind]?.controller.abort()
      const ticket = {
        kind,
        generation,
        snapshotIdentity: snapshotRequestIdentity(snapshot),
        controller: new AbortController(),
      }
      current[kind] = ticket
      return {
        kind: ticket.kind,
        generation: ticket.generation,
        snapshotIdentity: ticket.snapshotIdentity,
        signal: ticket.controller.signal,
        ticket,
      }
    },
    cancel,
    invalidate() {
      generation += 1
      for (const kind of ['detail', 'search'])
        cancel(kind)
    },
    isCurrent(request, snapshot) {
      return Boolean(request)
        && request.generation === generation
        && request.snapshotIdentity === snapshotRequestIdentity(snapshot)
        && request.signal?.aborted !== true
        && current[request.kind] === request.ticket
    },
  }
}

export function applyProjectionSuccess(state, kind, projection, request, coordinator) {
  if (!coordinator.isCurrent(request, state.snapshot))
    return state
  return {
    ...state,
    [kind]: projection,
    error: null,
  }
}

export function validateSnapshotEnvelope(envelope) {
  if (!envelope || envelope.ok !== true || !envelope.snapshot)
    return { ok: false, code: envelope?.error?.code ?? 'web_snapshot_invalid', message: envelope?.error?.message ?? 'Snapshot response is invalid' }
  const version = envelope.snapshot.projection
  if (!version || version.major !== projectionVersion.major || version.minor !== projectionVersion.minor) {
    return {
      ok: false,
      code: 'web_projection_incompatible',
      message: `Projection ${version?.major ?? '?'}.${version?.minor ?? '?'} is incompatible with this browser bundle`,
    }
  }
  if (typeof envelope.snapshot.snapshotId !== 'string'
    || typeof envelope.snapshot.generatedAt !== 'string'
    || !envelope.snapshot.overview
    || !envelope.snapshot.specs
    || !envelope.snapshot.history
    || !envelope.snapshot.managed) {
    return { ok: false, code: 'web_snapshot_invalid', message: 'Snapshot response is incomplete' }
  }
  return { ok: true }
}

export function renderAppHtml(state) {
  if (state.loading && !state.snapshot)
    return '<p class="loading">Loading the local Web Observatory…</p>'
  if (!state.snapshot) {
    return `<section class="card"><h1>Web Observatory unavailable</h1><p>${escapeHtml(state.error?.message ?? 'No valid snapshot is available.')}</p></section>`
  }

  const snapshot = state.snapshot
  const staleBanner = state.stale
    ? `<section class="banner" role="status"><strong>Stale snapshot</strong>${escapeHtml(state.error?.message ?? 'The latest refresh failed. The previous complete snapshot is still shown.')}</section>`
    : ''
  return `<div class="shell">
    <header class="topbar">
      <div class="brand">
        <h1>RSP Web Observatory</h1>
        <p>Local, read-only projection · ${escapeHtml(shortIdentity(snapshot.source.projectId))}</p>
      </div>
      <div class="meta">
        <span>${snapshot.source.dirty === true ? 'dirty checkout' : snapshot.source.dirty === false ? 'clean checkout' : 'checkout state unknown'}</span>
        <span>${escapeHtml(formatTimestamp(snapshot.generatedAt))}</span>
      </div>
    </header>
    ${staleBanner}
    <nav class="toolbar" aria-label="Observatory views">
      <div class="tabs">
        ${tabButton('overview', 'Overview', state.view)}
        ${tabButton('specs', 'Specs', state.view)}
        ${tabButton('history', 'History', state.view)}
        ${tabButton('runs', 'Runs', state.view)}
        ${tabButton('attention', 'Attention', state.view)}
      </div>
      <div class="meta">
        <span class="live-state" data-state="${escapeHtml(state.managedConnection)}">${escapeHtml(state.managedConnection)}</span>
        <button type="button" data-action="refresh">Refresh atomically</button>
      </div>
    </nav>
    ${renderView(state)}
  </div>`
}

export function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll('\'', '&#39;')
}

function renderView(state) {
  if (state.view === 'specs')
    return renderSpecs(state)
  if (state.view === 'history')
    return renderHistory(state)
  if (state.view === 'runs')
    return renderRuns(state)
  if (state.view === 'attention')
    return renderAttention(state.snapshot.managed)
  return renderOverview(state.snapshot.overview)
}

function renderOverview(overview) {
  const current = overview.current
  return `<section class="grid">
    <article class="card span-8">
      <span class="label">Current work</span>
      <h2>${escapeHtml(current.workRef ?? 'No current WorkRef')}</h2>
      <p>${escapeHtml(current.goal ?? 'No open work goal is available.')}</p>
      <div class="meta"><span class="pill">${escapeHtml(current.state)}</span></div>
    </article>
    <article class="card span-4">
      <span class="label">Next action</span>
      <p>${escapeHtml(current.nextAction ?? 'No next action is currently derived.')}</p>
    </article>
    ${metricCard('Open', overview.summary.open)}
    ${metricCard('Focused', overview.summary.focused)}
    ${metricCard('Blocked', overview.summary.blocked)}
    <article class="card span-8">
      <h3>Open work</h3>
      ${renderList(overview.records, record => `<li class="list-item">
        <strong>${escapeHtml(record.workRef)}</strong>
        <span>${escapeHtml(record.goal ?? 'No summary')}</span>
        <span class="meta">${escapeHtml(record.kind)} · ${escapeHtml(record.progress.done)}/${escapeHtml(record.progress.total)} · ${escapeHtml(record.state)}</span>
      </li>`)}
    </article>
    <article class="card span-4">
      <h3>Blockers</h3>
      ${renderTextList(current.blockers, 'No blocker is reported for the current work.')}
    </article>
    <article class="card span-12">
      <h3>Diagnostics</h3>
      ${renderList(overview.diagnostics, diagnostic => `<li class="list-item">
        <strong>${escapeHtml(diagnostic.code)}</strong>
        <span>${escapeHtml(diagnostic.message)}</span>
        ${diagnostic.path ? `<span class="meta">${escapeHtml(diagnostic.path)}</span>` : ''}
      </li>`, 'No diagnostics.')}
    </article>
  </section>`
}

function renderSpecs(state) {
  const specs = state.snapshot.specs
  const detail = state.detail?.mode === 'detail' ? state.detail : null
  const search = state.search?.mode === 'search' ? state.search : null
  return `<section class="grid">
    <article class="card span-12">
      <form class="searchbar" data-action="spec-search">
        <input name="q" maxlength="200" required placeholder="Bounded literal search">
        <button type="submit">Search Specs</button>
      </form>
      ${search ? `<p class="meta">${search.summary.returned}/${search.summary.matched} match(es)</p>${renderList(search.matches, renderSpecSearchMatch, 'No matches.')}` : ''}
    </article>
    <article class="card span-4">
      <h3>Documents</h3>
      <p class="meta">${specs.summary.returned}/${specs.summary.total} bounded records</p>
      ${renderList(specs.documents, document => `<li class="list-item">
        <button type="button" data-spec-path="${escapeHtml(document.path)}">${escapeHtml(document.title)}</button>
        <span>${escapeHtml(document.summary ?? document.path)}</span>
        <span class="meta">${escapeHtml(document.kind)} · ${escapeHtml(document.bytes)} bytes</span>
      </li>`)}
    </article>
    <article class="card span-8">
      <h3>${escapeHtml(detail?.document?.title ?? 'Document detail')}</h3>
      ${detail
        ? `<p class="meta">${escapeHtml(detail.document.path)}${detail.document.contentTruncated ? ' · bounded excerpt' : ''}</p><pre>${escapeHtml(detail.document.content)}</pre>`
        : '<p class="empty">Select a current Spec or Decision Record. Markdown is parsed only by the server projection.</p>'}
    </article>
  </section>`
}

function renderHistory(state) {
  const history = state.snapshot.history
  const detail = state.detail?.mode === 'detail' ? state.detail : null
  return `<section class="grid">
    <article class="card span-4">
      <h3>Archived Changes</h3>
      <p class="meta">${history.summary.returned}/${history.summary.total} bounded records</p>
      ${renderList(history.records, record => `<li class="list-item">
        <button type="button" data-history-workref="${escapeHtml(record.workRef)}">${escapeHtml(record.workRef)}</button>
        <span>${escapeHtml(record.summary)}</span>
        <span class="meta">${escapeHtml(record.date)} · ${escapeHtml(record.kind)}</span>
      </li>`)}
    </article>
    <article class="card span-8">
      <h3>${escapeHtml(detail?.record?.workRef ?? 'Archive detail')}</h3>
      ${detail ? renderHistoryDetail(detail.record) : '<p class="empty">Select one archived Change for bounded task, verification, and blocker evidence.</p>'}
    </article>
  </section>`
}

function renderRuns(state) {
  const managed = state.snapshot.managed
  const detail = state.detail?.mode === 'run-detail' ? state.detail : null
  if (!managed.available)
    return renderManagedUnavailable(managed, 'Runs')
  return `<section class="grid">
    <article class="card span-4">
      <h3>Managed runs</h3>
      <p class="meta">${escapeHtml(managed.runsSummary.returned)}/${escapeHtml(managed.runsSummary.total)} bounded runs · projection only</p>
      ${renderList(managed.runs, run => `<li class="list-item">
        <button type="button" data-run-id="${escapeHtml(run.lookupId)}">${escapeHtml(run.workRef || run.runId)}</button>
        <span>${escapeHtml(run.phase ?? 'No observed phase')}</span>
        <span class="meta">${escapeHtml(run.status)} · ${escapeHtml(run.dispatches)} dispatch(es) · ${escapeHtml(run.receipts)} receipt(s)</span>
        ${renderFreshness(run.freshness)}
      </li>`, 'No managed runs are retained for this checkout.')}
    </article>
    <article class="card span-8">
      ${detail ? renderRunDetail(detail) : '<h3>Run detail</h3><p class="empty">Select a run to inspect its bounded topology, receipts, evidence, stop boundaries, and ordered timeline.</p>'}
    </article>
  </section>`
}

function renderAttention(managed) {
  if (!managed.available)
    return renderManagedUnavailable(managed, 'Attention')
  return `<section class="grid">
    <article class="card span-12">
      <h3>Managed attention</h3>
      <p class="meta">${escapeHtml(managed.attentionSummary.returned)}/${escapeHtml(managed.attentionSummary.total)} Manage-owned item(s) · read-only</p>
      ${renderList(managed.attention, item => `<li class="list-item attention-item">
        <div class="summary"><span class="pill">${escapeHtml(item.kind)}</span>${item.runId && item.runLookupId ? `<button type="button" data-run-id="${escapeHtml(item.runLookupId)}">${escapeHtml(item.runId)}</button>` : ''}</div>
        <span>${escapeHtml(item.summary)}</span>
        <span class="meta">${escapeHtml(item.sourceRefs.map(ref => `${ref.type}:${ref.id}@${ref.sequence}`).join(' · ') || 'No source reference')}</span>
      </li>`, 'No Manage-owned attention is currently projected.')}
    </article>
  </section>`
}

function renderManagedUnavailable(managed, title) {
  return `<section class="grid">
    <article class="card span-12 unavailable">
      <span class="label">${escapeHtml(title)}</span>
      <h2>Managed runtime unavailable</h2>
      <p>${escapeHtml(managed.diagnostic?.message ?? 'No compatible managed runtime projection is available for this checkout.')}</p>
      ${managed.diagnostic?.action ? `<p class="meta">${escapeHtml(managed.diagnostic.action)}</p>` : ''}
      <p class="meta">Overview, Specs, and History remain available. This state does not imply acceptance or failure.</p>
    </article>
  </section>`
}

function renderRunDetail(detail) {
  const run = detail.run
  return `<h3>${escapeHtml(run.run?.workRef ?? run.run?.runId ?? 'Managed run')}</h3>
    <div class="summary">
      <span class="pill">${escapeHtml(run.status)}</span>
      <span class="meta">${escapeHtml(run.phase ?? 'No phase')} · sequence ${escapeHtml(run.freshness.sourceSequence)}</span>
    </div>
    ${renderFreshness(detail.freshness)}
    <div class="detail-grid">
      <section>
        <h4>Topology</h4>
        ${renderList(run.actors, actor => `<li class="list-item">
          <strong>${escapeHtml(actor.actorId)}</strong>
          <span>${escapeHtml(actor.actorType)}${actor.lane ? ` · ${escapeHtml(actor.lane)}` : ''}</span>
        </li>`, 'No actors observed.')}
      </section>
      <section>
        <h4>Dispatches and receipts</h4>
        ${renderList(run.dispatches, dispatch => `<li class="list-item">
          <strong>${escapeHtml(dispatch.dispatchId)}</strong>
          <span>${escapeHtml(dispatch.lane)} → ${escapeHtml(dispatch.workerId)}</span>
          ${dispatch.objectiveRef ? `<span>Objective: ${escapeHtml(dispatch.objectiveRef)}</span>` : ''}
          <span class="meta">${escapeHtml(dispatch.receiptState)} · ${escapeHtml(dispatch.terminalState)} · deliveries ${escapeHtml(dispatch.deliveryCount)} · duplicates ${escapeHtml(dispatch.duplicateCount)} · conflicts ${escapeHtml(dispatch.conflictCount)}</span>
          ${dispatch.stopBoundary ? `<span>Stop: ${escapeHtml(dispatch.stopBoundary)}</span>` : ''}
        </li>`, 'No dispatches observed.')}
      </section>
    </div>
    <h4>Evidence</h4>
    ${renderTextList(run.evidenceRefs, 'No decisive evidence references are projected.')}
    <h4>Changed paths and verification</h4>
    ${renderList(run.receipts, receipt => `<li class="list-item">
      <strong>${escapeHtml(receipt.receiptId)} · ${escapeHtml(receipt.result)}</strong>
      <span>${escapeHtml(receipt.changedPaths.join(', ') || 'No changed paths')}</span>
      <span class="meta">${escapeHtml(receipt.verificationRefs.join(' · ') || 'No verification references')} · duplicates ${escapeHtml(receipt.duplicateCount)} · conflicts ${escapeHtml(receipt.conflictCount)}</span>
      ${receipt.stopBoundary ? `<span>Stop: ${escapeHtml(receipt.stopBoundary)}</span>` : ''}
    </li>`, 'No receipts observed.')}
    <h4>Attention</h4>
    ${renderList(detail.attention, item => `<li class="list-item"><strong>${escapeHtml(item.kind)}</strong><span>${escapeHtml(item.summary)}</span></li>`, 'No attention for this run.')}
    <h4>Ordered timeline</h4>
    ${renderList(run.timeline, item => `<li class="timeline-item">
      <span class="sequence">${escapeHtml(item.sequence)}</span>
      <span><strong>${escapeHtml(item.kind)}</strong>${item.summary ? ` · ${escapeHtml(item.summary)}` : ''}</span>
      <span class="meta">${escapeHtml(item.actorId)}${item.dispatchId ? ` · ${escapeHtml(item.dispatchId)}` : ''}${item.parentState ? ` · parent ${escapeHtml(item.parentState)}` : ''} · ${item.outOfOrder ? 'out-of-order' : 'ordered'} · duplicates ${escapeHtml(item.duplicateCount)} · conflicts ${escapeHtml(item.conflictCount)}</span>
    </li>`, 'No timeline observations.')}
    ${run.truncated ? '<p class="banner">Projection is bounded; reread current authority before acting.</p>' : ''}`
}

function renderFreshness(freshness) {
  return `<div class="freshness" data-state="${escapeHtml(freshness.state)}">
    <span class="pill">${escapeHtml(freshness.state)}</span>
    <span class="meta">source sequence ${escapeHtml(freshness.sourceSequence)} · ${escapeHtml(formatTimestamp(freshness.generatedAt))}</span>
    ${freshness.reasons.length > 0 ? `<span>${escapeHtml(freshness.reasons.join(' · '))}</span>` : ''}
  </div>`
}

function renderHistoryDetail(record) {
  return `<p>${escapeHtml(record.summary)}</p>
    <div class="summary">
      <span class="pill">${escapeHtml(record.kind)}</span>
      <span class="meta">${escapeHtml(record.date)} · ${escapeHtml(record.scenarioCount)} scenario(s)</span>
    </div>
    <h3>Tasks</h3>
    ${renderTextList(record.evidence.tasks.items, 'No retained task evidence.')}
    <h3>Verification</h3>
    ${renderTextList(record.evidence.verify.items, 'No retained verification evidence.')}
    <h3>Blockers</h3>
    ${renderTextList(record.evidence.blockers.items, 'No retained blockers.')}`
}

function renderSpecSearchMatch(match) {
  return `<li class="list-item">
    <button type="button" data-spec-path="${escapeHtml(match.path)}">${escapeHtml(match.title)}</button>
    <span>${escapeHtml(match.excerpt)}</span>
    <span class="meta">${escapeHtml(match.path)}:${escapeHtml(match.line)}${match.heading ? ` · ${escapeHtml(match.heading)}` : ''}</span>
  </li>`
}

function metricCard(label, value) {
  return `<article class="card span-4"><span class="label">${escapeHtml(label)}</span><div class="metric">${Number(value) || 0}</div></article>`
}

function tabButton(view, label, current) {
  return `<button type="button" data-view="${view}"${view === current ? ' aria-current="page"' : ''}>${label}</button>`
}

function renderTextList(items, empty) {
  return renderList(items, item => `<li class="list-item">${escapeHtml(item)}</li>`, empty)
}

function renderList(items, renderItem, empty = 'No records.') {
  if (!Array.isArray(items) || items.length === 0)
    return `<p class="empty">${escapeHtml(empty)}</p>`
  return `<ul class="list">${items.map(renderItem).join('')}</ul>`
}

function shortIdentity(value) {
  return typeof value === 'string' ? value.slice(0, 12) : 'unknown'
}

function formatTimestamp(value) {
  const parsed = new Date(value)
  return Number.isFinite(parsed.getTime()) ? parsed.toLocaleString() : value
}

if (typeof document !== 'undefined')
  void startBrowserApp()

async function startBrowserApp() {
  const app = document.querySelector('#app')
  const projectMatch = window.location.pathname.match(/^\/web\/([a-f0-9]{64})\/$/u)
  const bootstrap = new URLSearchParams(window.location.hash.slice(1)).get('bootstrap')
  window.history.replaceState(null, '', window.location.pathname)
  let state = createInitialState()
  let webToken = null
  let managedEventQueue = Promise.resolve()
  const projectionRequests = createProjectionRequestCoordinator()

  if (!app || !projectMatch || !bootstrap) {
    state = applySnapshotFailure(state, {
      code: 'web_bootstrap_missing',
      message: 'This page requires a fresh one-time bootstrap from rsp web.',
    })
    render()
    return
  }
  const projectId = projectMatch[1]

  try {
    const authorization = await fetchJson('/v1/web/bootstrap', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ projectId, bootstrapToken: bootstrap }),
    })
    if (!authorization || authorization.ok !== true || authorization.projectId !== projectId || typeof authorization.webToken !== 'string')
      throw new Error('Broker returned an invalid Web session')
    webToken = authorization.webToken
    await refresh(false)
    void connectManagedEvents()
    window.setInterval(() => void heartbeat(), 30_000)
  }
  catch (error) {
    state = applySnapshotFailure(state, {
      code: 'web_bootstrap_failed',
      message: error instanceof Error ? error.message : 'Unable to bootstrap the Web session',
    })
    render()
  }

  function render() {
    app.innerHTML = renderAppHtml(state)
    app.onclick = event => void handleClick(event)
    app.onsubmit = event => void handleSubmit(event)
  }

  async function handleClick(event) {
    const target = event.target instanceof Element ? event.target.closest('button') : null
    if (!target)
      return
    if (target.dataset.view) {
      projectionRequests.cancel('detail')
      state = { ...state, view: target.dataset.view, detail: null }
      render()
      return
    }
    if (target.dataset.action === 'refresh') {
      await refresh(true)
      return
    }
    if (target.dataset.runId) {
      state = { ...state, view: 'runs' }
      render()
      await loadDetail(`/v1/web/projects/${projectId}/runs/detail?runId=${encodeURIComponent(target.dataset.runId)}`)
      return
    }
    if (target.dataset.specPath) {
      await loadDetail(`/v1/web/projects/${projectId}/specs/detail?path=${encodeURIComponent(target.dataset.specPath)}`)
      return
    }
    if (target.dataset.historyWorkref)
      await loadDetail(`/v1/web/projects/${projectId}/history/detail?workRef=${encodeURIComponent(target.dataset.historyWorkref)}`)
  }

  async function handleSubmit(event) {
    const form = event.target
    if (!(form instanceof HTMLFormElement) || form.dataset.action !== 'spec-search')
      return
    event.preventDefault()
    const query = String(new FormData(form).get('q') ?? '').trim()
    if (!query)
      return
    const request = projectionRequests.begin('search', state.snapshot)
    try {
      const result = await authenticatedJson(
        `/v1/web/projects/${projectId}/specs/search?q=${encodeURIComponent(query)}&limit=20`,
        { signal: request.signal },
      )
      const nextState = applyProjectionSuccess(
        state,
        'search',
        result.projection,
        request,
        projectionRequests,
      )
      if (nextState === state)
        return
      state = nextState
    }
    catch (error) {
      if (!projectionRequests.isCurrent(request, state.snapshot))
        return
      state = applySnapshotFailure(state, {
        code: 'web_specs_search_failed',
        message: error instanceof Error ? error.message : 'Specs search failed',
      })
    }
    render()
  }

  async function refresh(force) {
    projectionRequests.invalidate()
    let refreshed = false
    try {
      const envelope = await authenticatedJson(
        `/v1/web/projects/${projectId}/${force ? 'refresh' : 'snapshot'}`,
        { method: force ? 'POST' : 'GET' },
        true,
      )
      if (envelope.ok === true)
        projectionRequests.invalidate()
      refreshed = envelope.ok === true
      state = envelope.ok === true
        ? applySnapshotSuccess(state, envelope)
        : applySnapshotFailure(state, envelope.error)
    }
    catch (error) {
      state = applySnapshotFailure(state, {
        code: 'web_refresh_failed',
        message: error instanceof Error ? error.message : 'Snapshot refresh failed',
      })
    }
    render()
    return refreshed
  }

  async function loadDetail(path) {
    const request = projectionRequests.begin('detail', state.snapshot)
    try {
      const result = await authenticatedJson(path, { signal: request.signal })
      const nextState = applyProjectionSuccess(
        state,
        'detail',
        result.projection,
        request,
        projectionRequests,
      )
      if (nextState === state)
        return
      state = nextState
    }
    catch (error) {
      if (!projectionRequests.isCurrent(request, state.snapshot))
        return
      state = applySnapshotFailure(state, {
        code: 'web_detail_failed',
        message: error instanceof Error ? error.message : 'Detail projection failed',
      })
    }
    render()
  }

  async function heartbeat() {
    try {
      await authenticatedJson(`/v1/web/projects/${projectId}/session`)
    }
    catch (error) {
      state = applySnapshotFailure(state, {
        code: 'web_session_lost',
        message: error instanceof Error ? error.message : 'Web session is no longer available',
      })
      render()
    }
  }

  async function connectManagedEvents() {
    let retryMs = 250
    while (true) {
      try {
        state = { ...state, managedConnection: 'connecting' }
        render()
        const headers = {
          Accept: 'text/event-stream',
          Authorization: `Bearer ${webToken}`,
        }
        if (state.managedEventId !== null)
          headers['Last-Event-ID'] = String(state.managedEventId)
        const response = await fetch(`/v1/web/projects/${projectId}/events`, {
          headers,
          cache: 'no-store',
          credentials: 'omit',
          redirect: 'error',
        })
        if (!response.ok || !response.body)
          throw new Error(`Managed event stream failed with HTTP ${response.status}`)
        state = { ...state, managedConnection: 'live' }
        render()
        retryMs = 250
        const decoder = new TextDecoder()
        const parser = createSseParser((event) => {
          managedEventQueue = managedEventQueue
            .then(() => handleManagedEvent(event))
            .catch(() => undefined)
        })
        const reader = response.body.getReader()
        while (true) {
          const { done, value } = await reader.read()
          if (done)
            break
          parser.push(decoder.decode(value, { stream: true }))
        }
        parser.push(decoder.decode())
        parser.finish()
      }
      catch {
        state = {
          ...state,
          managedConnection: 'disconnected',
        }
        render()
      }
      await new Promise(resolve => window.setTimeout(resolve, retryMs))
      retryMs = Math.min(retryMs * 2, 5_000)
    }
  }

  async function handleManagedEvent(event) {
    const previousEventId = state.managedEventId
    const applied = applyManagedEvent(state, event)
    state = applied.state
    if (state.managedEventId !== previousEventId)
      projectionRequests.invalidate()
    if (applied.refresh) {
      const refreshed = await refresh(true)
      state = {
        ...state,
        managedEventId: event.type === 'managed-gap'
          ? event.id
          : state.managedEventId === null
            ? event.id
            : Math.max(state.managedEventId, event.id),
        managedConnection: refreshed ? 'live' : 'recovering',
      }
    }
    render()
  }

  async function authenticatedJson(path, options = {}, allowFailureEnvelope = false) {
    if (!webToken)
      throw new Error('Web session is not authorized')
    return fetchJson(path, {
      ...options,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${webToken}`,
        ...(options.headers ?? {}),
      },
    }, allowFailureEnvelope)
  }
}

function snapshotRequestIdentity(snapshot) {
  if (!snapshot)
    return 'none'
  return JSON.stringify({
    snapshotId: snapshot.snapshotId,
    projectId: snapshot.source?.projectId,
    identities: snapshot.source?.identities,
  })
}

async function fetchJson(path, options, allowFailureEnvelope = false) {
  const response = await fetch(path, {
    ...options,
    cache: 'no-store',
    credentials: 'omit',
    redirect: 'error',
  })
  const value = await response.json().catch(() => null)
  if (!response.ok && !allowFailureEnvelope)
    throw new Error(value?.error?.message ?? `Request failed with HTTP ${response.status}`)
  return value
}
