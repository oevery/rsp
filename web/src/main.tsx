import type {
  WebHistoryRecord,
  WebManagedSseEvent,
  WebSnapshotSuccess,
  WebSpecsSearchProjection,
} from '../../src/web/model.js'
import type { AppActions } from './app.js'
import type { WebLocale } from './i18n.js'
import type { AppState, DetailProjection, WebView } from './state.js'
import { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { ObservatoryApp } from './app.js'
import { messagesFor, translate } from './i18n.js'
import {
  applyAutoRefreshSelection,
  applyLocaleSelection,
  applyManagedEvent,
  applyOperationFailure,
  applyProjectionSuccess,
  applySnapshotFailure,
  applySnapshotSuccess,

  AUTO_REFRESH_INTERVAL_MS,
  createInitialState,
  createProjectionRequestCoordinator,
  createSseParser,

  historyDetailRequestPaths,
  isRouteContractMismatch,
  presentationFailure,

  shouldAutoRefresh,
  WebPresentationError,
  WebRequestError,

} from './state.js'

export {
  applyAutoRefreshSelection,
  applyLocaleSelection,
  applyManagedEvent,
  applyOperationFailure,
  applyProjectionSuccess,
  applySnapshotFailure,
  applySnapshotSuccess,
  AUTO_REFRESH_INTERVAL_MS,
  createInitialState,
  createProjectionRequestCoordinator,
  createSseParser,
  historyDetailRequestPaths,
  isRouteContractMismatch,
} from './state.js'

interface BootstrapAuthorization {
  ok?: boolean
  projectId?: string
  webToken?: string
}

interface ProjectionEnvelope<T> {
  projection: T
}

export function BrowserObservatory({
  projectId,
  bootstrap,
}: {
  projectId: string | null
  bootstrap: string | null
}): React.ReactNode {
  const [state, setReactState] = useState<AppState>(() => createInitialState(globalThis.navigator?.languages ?? []))
  const stateRef = useRef(state)
  const webTokenRef = useRef<string | null>(null)
  const refreshPromiseRef = useRef<Promise<boolean> | null>(null)
  const projectionRequestsRef = useRef(createProjectionRequestCoordinator())
  const managedEventQueueRef = useRef(Promise.resolve())

  function commit(next: AppState | ((current: AppState) => AppState)): AppState {
    const value = typeof next === 'function' ? next(stateRef.current) : next
    stateRef.current = value
    setReactState(value)
    return value
  }

  async function authenticatedJson<T>(
    path: string,
    options: RequestInit = {},
    allowFailureEnvelope = false,
  ): Promise<T> {
    const webToken = webTokenRef.current
    if (!webToken)
      throw new WebPresentationError('sessionUnauthorized')
    return fetchJson<T>(path, {
      ...options,
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${webToken}`,
        ...(options.headers ?? {}),
      },
    }, allowFailureEnvelope)
  }

  async function performRefresh(force: boolean): Promise<boolean> {
    if (!projectId)
      return false
    projectionRequestsRef.current.invalidate()
    commit(current => ({ ...current, refreshing: true }))
    try {
      const envelope = await authenticatedJson<WebSnapshotSuccess | { ok: false, error?: { code?: string, message?: string } }>(
        `/v1/web/projects/${projectId}/${force ? 'refresh' : 'snapshot'}`,
        { method: force ? 'POST' : 'GET' },
        true,
      )
      if (envelope.ok === true)
        projectionRequestsRef.current.invalidate()
      commit(current => envelope.ok === true
        ? applySnapshotSuccess(current, envelope)
        : applySnapshotFailure(current, envelope.error))
      return envelope.ok === true
    }
    catch (error) {
      commit(current => applySnapshotFailure(current, {
        code: 'web_refresh_failed',
        ...presentationFailure(error, 'snapshotRefreshFailed'),
      }))
      return false
    }
  }

  async function refresh(force: boolean): Promise<boolean> {
    if (refreshPromiseRef.current)
      return refreshPromiseRef.current
    const promise = performRefresh(force)
    refreshPromiseRef.current = promise
    try {
      return await promise
    }
    finally {
      if (refreshPromiseRef.current === promise)
        refreshPromiseRef.current = null
    }
  }

  async function loadDetail(
    path: string,
    legacyPath: string | null = null,
    compatibilityRoute = false,
  ): Promise<void> {
    const request = projectionRequestsRef.current.begin('detail', stateRef.current.snapshot)
    try {
      let result: ProjectionEnvelope<DetailProjection>
      let usedLegacyRoute = compatibilityRoute
      try {
        result = await authenticatedJson(path, { signal: request.signal })
      }
      catch (error) {
        if (!legacyPath || !isRouteContractMismatch(error))
          throw error
        result = await authenticatedJson(legacyPath, { signal: request.signal })
        usedLegacyRoute = true
      }
      const nextState = applyProjectionSuccess(
        stateRef.current,
        'detail',
        result.projection,
        request,
        projectionRequestsRef.current,
      )
      if (nextState === stateRef.current)
        return
      commit(usedLegacyRoute
        ? {
            ...nextState,
            notice: {
              tone: 'warning',
              code: 'web_broker_legacy_history_route',
              messageKey: 'legacyHistoryRoute',
            },
          }
        : nextState)
    }
    catch (error) {
      if (!projectionRequestsRef.current.isCurrent(request, stateRef.current.snapshot))
        return
      commit(current => applyOperationFailure(current, {
        code: 'web_detail_failed',
        ...presentationFailure(error, 'detailProjectionFailed'),
      }))
    }
  }

  async function searchSpecs(query: string): Promise<void> {
    if (!projectId)
      return
    const request = projectionRequestsRef.current.begin('search', stateRef.current.snapshot)
    try {
      const result = await authenticatedJson<ProjectionEnvelope<WebSpecsSearchProjection>>(
        `/v1/web/projects/${projectId}/specs/search?q=${encodeURIComponent(query)}&limit=20`,
        { signal: request.signal },
      )
      const nextState = applyProjectionSuccess(
        stateRef.current,
        'search',
        result.projection,
        request,
        projectionRequestsRef.current,
      )
      if (nextState !== stateRef.current)
        commit(nextState)
    }
    catch (error) {
      if (!projectionRequestsRef.current.isCurrent(request, stateRef.current.snapshot))
        return
      commit(current => applyOperationFailure(current, {
        code: 'web_specs_search_failed',
        ...presentationFailure(error, 'specsSearchFailed'),
      }))
    }
  }

  async function heartbeat(): Promise<void> {
    if (!projectId)
      return
    try {
      await authenticatedJson(`/v1/web/projects/${projectId}/session`)
    }
    catch (error) {
      commit(current => applySnapshotFailure(current, {
        code: 'web_session_lost',
        ...presentationFailure(error, 'sessionUnavailable'),
      }))
    }
  }

  async function handleManagedEvent(event: WebManagedSseEvent): Promise<void> {
    const previousEventId = stateRef.current.managedEventId
    const applied = applyManagedEvent(stateRef.current, event)
    commit(applied.state)
    if (stateRef.current.managedEventId !== previousEventId)
      projectionRequestsRef.current.invalidate()
    if (applied.refresh) {
      const refreshed = await refresh(true)
      commit(current => ({
        ...current,
        managedEventId: event.type === 'managed-gap'
          ? event.id
          : current.managedEventId === null
            ? event.id
            : Math.max(current.managedEventId, event.id),
        managedConnection: refreshed ? 'live' : 'recovering',
      }))
    }
  }

  async function connectManagedEvents(signal: AbortSignal): Promise<void> {
    if (!projectId)
      return
    let retryMs = 250
    while (!signal.aborted) {
      try {
        commit(current => ({ ...current, managedConnection: 'connecting' }))
        const headers: Record<string, string> = {
          Accept: 'text/event-stream',
          Authorization: `Bearer ${webTokenRef.current}`,
        }
        if (stateRef.current.managedEventId !== null)
          headers['Last-Event-ID'] = String(stateRef.current.managedEventId)
        const response = await fetch(`/v1/web/projects/${projectId}/events`, {
          headers,
          cache: 'no-store',
          credentials: 'omit',
          redirect: 'error',
          signal,
        })
        if (!response.ok || !response.body)
          throw new WebPresentationError('eventStreamFailed', { status: response.status })
        commit(current => ({ ...current, managedConnection: 'live' }))
        retryMs = 250
        const decoder = new TextDecoder()
        const parser = createSseParser((event) => {
          managedEventQueueRef.current = managedEventQueueRef.current
            .then(() => handleManagedEvent(event as unknown as WebManagedSseEvent))
            .catch(() => undefined)
        })
        const reader = response.body.getReader()
        while (!signal.aborted) {
          const { done, value } = await reader.read()
          if (done)
            break
          parser.push(decoder.decode(value, { stream: true }))
        }
        parser.push(decoder.decode())
        parser.finish()
      }
      catch {
        if (signal.aborted)
          break
        commit(current => ({ ...current, managedConnection: 'disconnected' }))
      }
      await abortableDelay(retryMs, signal)
      retryMs = Math.min(retryMs * 2, 5_000)
    }
  }

  useEffect(() => {
    document.documentElement.lang = state.locale
    document.title = translate(messagesFor(state.locale), 'appTitle')
  }, [state.locale])

  useEffect(() => {
    const lifecycle = new AbortController()
    let heartbeatId: number | null = null
    let refreshId: number | null = null
    async function bootstrapSession(): Promise<void> {
      if (!projectId || !bootstrap) {
        commit(current => applySnapshotFailure(current, {
          code: 'web_bootstrap_missing',
          messageKey: 'bootstrapMissing',
        }))
        return
      }
      try {
        const authorization = await fetchJson<BootstrapAuthorization>('/v1/web/bootstrap', {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ projectId, bootstrapToken: bootstrap }),
          signal: lifecycle.signal,
        })
        if (authorization.ok !== true
          || authorization.projectId !== projectId
          || typeof authorization.webToken !== 'string') {
          throw new WebPresentationError('invalidWebSession')
        }
        webTokenRef.current = authorization.webToken
        await refresh(false)
        if (lifecycle.signal.aborted)
          return
        heartbeatId = window.setInterval(() => void heartbeat(), 30_000)
        refreshId = window.setInterval(() => {
          if (shouldAutoRefresh(stateRef.current, document.visibilityState))
            void refresh(true)
        }, AUTO_REFRESH_INTERVAL_MS)
        void connectManagedEvents(lifecycle.signal)
      }
      catch (error) {
        if (lifecycle.signal.aborted)
          return
        commit(current => applySnapshotFailure(current, {
          code: 'web_bootstrap_failed',
          ...presentationFailure(error, 'bootstrapFailed'),
        }))
      }
    }
    void bootstrapSession()
    const visibility = (): void => {
      if (shouldAutoRefresh(stateRef.current, document.visibilityState))
        void refresh(true)
    }
    document.addEventListener('visibilitychange', visibility)
    return () => {
      lifecycle.abort()
      if (heartbeatId !== null)
        window.clearInterval(heartbeatId)
      if (refreshId !== null)
        window.clearInterval(refreshId)
      document.removeEventListener('visibilitychange', visibility)
      projectionRequestsRef.current.invalidate()
    }
  }, [projectId, bootstrap])

  const actions = useMemo<AppActions>(() => ({
    onLocale(locale: WebLocale) {
      commit(current => applyLocaleSelection(current, locale))
    },
    onView(view: WebView) {
      projectionRequestsRef.current.cancel('detail')
      projectionRequestsRef.current.cancel('search')
      commit(current => ({ ...current, view, detail: null, search: null }))
    },
    onRefresh() {
      void refresh(true)
    },
    onAutoRefresh() {
      const next = commit(current => applyAutoRefreshSelection(current, current.autoRefresh !== true))
      if (shouldAutoRefresh(next, document.visibilityState))
        void refresh(true)
    },
    onSpec(path: string) {
      if (projectId)
        void loadDetail(`/v1/web/projects/${projectId}/specs/detail?path=${encodeURIComponent(path)}`)
    },
    onHistory(record: WebHistoryRecord, ambiguous: boolean) {
      if (!projectId)
        return
      if (ambiguous) {
        commit(current => applyOperationFailure(current, {
          code: 'web_broker_legacy_history_ambiguous',
          messageKey: 'legacyHistoryAmbiguous',
        }))
        return
      }
      const paths = historyDetailRequestPaths(projectId, record.lookupId, record.workRef)
      if (paths.current)
        void loadDetail(paths.current, paths.legacy, !record.lookupId)
    },
    onRun(lookupId: string) {
      if (!projectId)
        return
      commit(current => ({ ...current, view: 'runs' }))
      void loadDetail(`/v1/web/projects/${projectId}/runs/detail?runId=${encodeURIComponent(lookupId)}`)
    },
    onSearch(query: string) {
      void searchSpecs(query)
    },
    onCopyRecoveryCommand() {
      void globalThis.navigator?.clipboard?.writeText?.('rsp web').catch(() => undefined)
    },
  }), [projectId])

  return <ObservatoryApp state={state} actions={actions} />
}

async function fetchJson<T>(
  path: string,
  options: RequestInit,
  allowFailureEnvelope = false,
): Promise<T> {
  const response = await fetch(path, {
    ...options,
    cache: 'no-store',
    credentials: 'omit',
    redirect: 'error',
  })
  const value = await response.json().catch(() => null) as T
  if (!response.ok && !allowFailureEnvelope) {
    const failure = value as { error?: { code?: string, message?: string } } | null
    throw new WebRequestError(
      response.status,
      failure?.error?.code,
      failure?.error?.message,
    )
  }
  return value
}

async function abortableDelay(milliseconds: number, signal: AbortSignal): Promise<void> {
  if (signal.aborted)
    return
  await new Promise<void>((resolve) => {
    const timeout = window.setTimeout(done, milliseconds)
    signal.addEventListener('abort', done, { once: true })
    function done(): void {
      window.clearTimeout(timeout)
      signal.removeEventListener('abort', done)
      resolve()
    }
  })
}

function startBrowserApp(): void {
  const app = document.querySelector<HTMLElement>('#app')
  if (!app)
    return
  const projectMatch = window.location.pathname.match(/^\/web\/([a-f0-9]{64})\/$/u)
  const bootstrap = new URLSearchParams(window.location.hash.slice(1)).get('bootstrap')
  window.history.replaceState(null, '', window.location.pathname)
  createRoot(app).render(
    <BrowserObservatory
      projectId={projectMatch?.[1] ?? null}
      bootstrap={bootstrap}
    />,
  )
}

if (typeof document !== 'undefined')
  startBrowserApp()
