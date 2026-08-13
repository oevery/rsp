import type {
  WebHistoryDetailProjection,
  WebManagedRunDetailProjection,
  WebManagedSseEvent,
  WebSnapshot,
  WebSnapshotSuccess,
  WebSpecsDetailProjection,
  WebSpecsSearchProjection,
} from '../../src/web/model.js'
import { normalizeLocale, resolveLocale } from './i18n.js'

const projectionVersion = { major: 1, minor: 1 }
export const AUTO_REFRESH_INTERVAL_MS = 30_000

export type WebView = 'overview' | 'specs' | 'history' | 'runs' | 'attention'
export type ManagedConnection = 'connecting' | 'live' | 'recovering' | 'disconnected'
export type DetailProjection = WebSpecsDetailProjection | WebHistoryDetailProjection | WebManagedRunDetailProjection

export interface PresentationFailure {
  code: string
  message?: string
  messageKey?: string
  messageValues?: Record<string, unknown>
}

export interface PresentationNotice extends PresentationFailure {
  tone: 'warning'
}

export interface AppState {
  locale: 'en' | 'zh-CN'
  view: WebView
  loading: boolean
  refreshing: boolean
  autoRefresh: boolean
  stale: boolean
  error: PresentationFailure | null
  notice: PresentationNotice | null
  snapshot: WebSnapshot | null
  detail: DetailProjection | null
  search: WebSpecsSearchProjection | null
  managedEventId: number | null
  managedConnection: ManagedConnection
}

interface SnapshotEnvelopeFailure {
  ok?: false
  error?: Partial<PresentationFailure>
}

type SnapshotEnvelope = WebSnapshotSuccess | SnapshotEnvelopeFailure | null | undefined

export function createInitialState(languages: readonly string[] = []): AppState {
  return {
    locale: resolveLocale(languages),
    view: 'overview',
    loading: true,
    refreshing: false,
    autoRefresh: true,
    stale: false,
    error: null,
    notice: null,
    snapshot: null,
    detail: null,
    search: null,
    managedEventId: null,
    managedConnection: 'connecting',
  }
}

export function applyLocaleSelection<T extends AppState>(state: T, locale: string): T {
  const resolved = normalizeLocale(locale)
  return resolved && resolved !== state.locale
    ? { ...state, locale: resolved }
    : state
}

export function applyAutoRefreshSelection<T extends AppState>(state: T, enabled: boolean): T {
  return typeof enabled === 'boolean' && enabled !== state.autoRefresh
    ? { ...state, autoRefresh: enabled }
    : state
}

export function applySnapshotSuccess(state: AppState, envelope: SnapshotEnvelope): AppState {
  const validation = validateSnapshotEnvelope(envelope)
  if (!validation.ok) {
    return applySnapshotFailure(state, {
      code: validation.code,
      message: validation.message,
      messageKey: validation.messageKey,
      messageValues: validation.messageValues,
    })
  }
  return {
    ...state,
    loading: false,
    refreshing: false,
    stale: false,
    error: null,
    notice: null,
    snapshot: validation.snapshot,
    detail: null,
    search: null,
  }
}

export function applySnapshotFailure(state: AppState, error: Partial<PresentationFailure> | null | undefined): AppState {
  return {
    ...state,
    loading: false,
    refreshing: false,
    stale: state.snapshot !== null,
    error: normalizedFailure(error, 'web_refresh_failed'),
  }
}

export function applyOperationFailure(state: AppState, error: Partial<PresentationFailure> | null | undefined): AppState {
  return {
    ...state,
    loading: false,
    notice: {
      tone: 'warning',
      ...normalizedFailure(error, 'web_operation_failed'),
    },
  }
}

export function shouldAutoRefresh(state: AppState, visibilityState = 'visible'): boolean {
  return state.autoRefresh === true
    && state.loading !== true
    && state.refreshing !== true
    && state.snapshot !== null
    && state.detail === null
    && state.search === null
    && visibilityState === 'visible'
}

export function applyManagedEvent(
  state: AppState,
  event: Partial<WebManagedSseEvent> | null | undefined,
): { state: AppState, refresh: boolean } {
  if (!event || !Number.isSafeInteger(event.id) || Number(event.id) < 1)
    return { state, refresh: true }
  const eventId = Number(event.id)
  if (event.type === 'managed-gap') {
    return {
      state: {
        ...state,
        managedEventId: eventId,
        managedConnection: 'recovering',
      },
      refresh: true,
    }
  }
  if (state.managedEventId !== null && eventId <= state.managedEventId)
    return { state, refresh: false }
  if (state.managedEventId !== null && eventId !== state.managedEventId + 1) {
    return {
      state: {
        ...state,
        managedEventId: eventId,
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
        managedEventId: eventId,
        managedConnection: 'live',
      },
      refresh: false,
    }
  }
  if (event.type === 'managed-projection' && event.projection && !state.snapshot) {
    return {
      state: {
        ...state,
        managedEventId: eventId,
        managedConnection: 'recovering',
      },
      refresh: true,
    }
  }
  return {
    state: {
      ...state,
      managedEventId: eventId,
      managedConnection: event.type === 'broker-stopping' || event.type === 'session-unloaded'
        ? 'disconnected'
        : state.managedConnection,
    },
    refresh: false,
  }
}

export function createSseParser(onEvent: (event: Record<string, unknown>) => void): {
  push: (chunk: string) => void
  finish: () => void
} {
  let buffer = ''
  let data: string[] = []
  let id: string | null = null
  let type = 'message'
  function dispatch(): void {
    if (data.length === 0) {
      id = null
      type = 'message'
      return
    }
    const raw = data.join('\n')
    data = []
    let value: unknown
    try {
      value = JSON.parse(raw)
    }
    catch {
      id = null
      type = 'message'
      return
    }
    if (!isObject(value)) {
      id = null
      type = 'message'
      return
    }
    onEvent({
      ...value,
      ...(id === null ? {} : { id: Number(id) }),
      type: typeof value.type === 'string' ? value.type : type,
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

type ProjectionRequestKind = 'detail' | 'search'

interface ProjectionTicket {
  kind: ProjectionRequestKind
  generation: number
  snapshotIdentity: string
  controller: AbortController
}

export interface ProjectionRequest {
  kind: ProjectionRequestKind
  generation: number
  snapshotIdentity: string
  signal: AbortSignal
  ticket: ProjectionTicket
}

export interface ProjectionRequestCoordinator {
  begin: (kind: ProjectionRequestKind, snapshot: WebSnapshot | null) => ProjectionRequest
  cancel: (kind: ProjectionRequestKind) => void
  invalidate: () => void
  isCurrent: (request: ProjectionRequest | null | undefined, snapshot: WebSnapshot | null) => boolean
}

export function createProjectionRequestCoordinator(): ProjectionRequestCoordinator {
  let generation = 0
  const current: Record<ProjectionRequestKind, ProjectionTicket | null> = {
    detail: null,
    search: null,
  }
  function cancel(kind: ProjectionRequestKind): void {
    const ticket = current[kind]
    ticket?.controller.abort()
    current[kind] = null
  }
  return {
    begin(kind, snapshot) {
      current[kind]?.controller.abort()
      const ticket: ProjectionTicket = {
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
      cancel('detail')
      cancel('search')
    },
    isCurrent(request, snapshot) {
      return Boolean(request)
        && request?.generation === generation
        && request.snapshotIdentity === snapshotRequestIdentity(snapshot)
        && request.signal.aborted !== true
        && current[request.kind] === request.ticket
    },
  }
}

export function applyProjectionSuccess(
  state: AppState,
  kind: ProjectionRequestKind,
  projection: DetailProjection | WebSpecsSearchProjection,
  request: ProjectionRequest,
  coordinator: ProjectionRequestCoordinator,
): AppState {
  if (!coordinator.isCurrent(request, state.snapshot))
    return state
  if (kind === 'detail') {
    return {
      ...state,
      detail: projection as DetailProjection,
      notice: null,
    }
  }
  return {
    ...state,
    search: projection as WebSpecsSearchProjection,
    notice: null,
  }
}

export function validateSnapshotEnvelope(envelope: SnapshotEnvelope):
  | { ok: true, snapshot: WebSnapshot }
  | { ok: false, code: string, message?: string, messageKey?: string, messageValues?: Record<string, unknown> } {
  if (!envelope || envelope.ok !== true || !('snapshot' in envelope) || !envelope.snapshot) {
    const failure = envelope && 'error' in envelope ? envelope.error : undefined
    return failure?.message
      ? { ok: false, code: failure.code ?? 'web_snapshot_invalid', message: failure.message }
      : { ok: false, code: failure?.code ?? 'web_snapshot_invalid', messageKey: 'invalidSnapshot' }
  }
  const version = envelope.snapshot.projection
  if (!version || version.major !== projectionVersion.major || version.minor !== projectionVersion.minor) {
    return {
      ok: false,
      code: 'web_projection_incompatible',
      messageKey: 'incompatibleProjection',
      messageValues: { version: `${version?.major ?? '?'}.${version?.minor ?? '?'}` },
    }
  }
  if (typeof envelope.snapshot.snapshotId !== 'string'
    || typeof envelope.snapshot.generatedAt !== 'string'
    || !envelope.snapshot.overview
    || !envelope.snapshot.specs
    || !envelope.snapshot.history
    || !envelope.snapshot.managed) {
    return { ok: false, code: 'web_snapshot_invalid', messageKey: 'incompleteSnapshot' }
  }
  return { ok: true, snapshot: envelope.snapshot }
}

export function formatTimestamp(value: string, locale: string = 'en'): string {
  const parsed = new Date(value)
  return Number.isFinite(parsed.getTime()) ? parsed.toLocaleString(normalizeLocale(locale) ?? 'en') : value
}

export function escapeHtml(value: string): string {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll('\'', '&#39;')
}

export class WebRequestError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code?: unknown, message?: unknown) {
    super(typeof message === 'string' ? message : `HTTP ${status}`)
    this.status = status
    this.code = typeof code === 'string' ? code : 'web_request_failed'
  }
}

export class WebPresentationError extends Error {
  readonly messageKey: string
  readonly messageValues: Record<string, unknown>

  constructor(messageKey: string, messageValues: Record<string, unknown> = {}) {
    super(messageKey)
    this.messageKey = messageKey
    this.messageValues = messageValues
  }
}

export function presentationFailure(error: unknown, fallbackKey: string): Omit<PresentationFailure, 'code'> {
  if (error instanceof WebPresentationError) {
    return {
      messageKey: error.messageKey,
      messageValues: error.messageValues,
    }
  }
  if (error instanceof Error)
    return { message: error.message }
  return { messageKey: fallbackKey }
}

function normalizedFailure(
  error: Partial<PresentationFailure> | null | undefined,
  fallbackCode: string,
): PresentationFailure {
  return {
    code: typeof error?.code === 'string' ? error.code : fallbackCode,
    ...(typeof error?.message === 'string' ? { message: error.message } : {}),
    ...(typeof error?.messageKey === 'string' ? { messageKey: error.messageKey } : {}),
    ...(error?.messageValues && typeof error.messageValues === 'object'
      ? { messageValues: error.messageValues }
      : {}),
  }
}

function snapshotRequestIdentity(snapshot: WebSnapshot | null): string {
  if (!snapshot)
    return 'none'
  return JSON.stringify({
    snapshotId: snapshot.snapshotId,
    projectId: snapshot.source?.projectId,
    identities: snapshot.source?.identities,
  })
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
