import type { ManageRuntimeProjectProjection } from '../runtime/manage.js'
import type { RuntimeDatabaseInspection } from '../runtime/model.js'
import type { RuntimeEventStore } from '../runtime/store.js'
import type { WebSnapshot } from '../web/model.js'
import type { BrokerPaths } from './host.js'
import type { BrokerProjectIdentity, BrokerProjectSessionPublic } from './protocol.js'
import { Buffer } from 'node:buffer'
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'
import { projectManageProjectSnapshot } from '../runtime/manage.js'
import {
  disposeRuntimeDatabase,
  inspectRuntimeDatabase,
  openRuntimeEventStore,
  readRuntimeProjectProjectionSnapshot,
} from '../runtime/store.js'
import {
  WEB_BOOTSTRAP_TTL_MS,
  WEB_MAX_BOOTSTRAPS_PER_PROJECT,
  WEB_MAX_SESSIONS_PER_PROJECT,
  WEB_SESSION_TTL_MS,
} from '../web/model.js'
import { brokerProjectNamespace, discoverBrokerProject } from './project.js'
import { BrokerError } from './protocol.js'
import { ensurePrivateDirectory } from './storage.js'

export const DEFAULT_BROKER_PROJECT_IDLE_MS = 5 * 60 * 1000
const MAX_MANAGED_WEB_EVENTS = 64

export interface BrokerSessionEvent {
  type: 'session-ready' | 'session-unloaded' | 'broker-stopping'
  projectId: string
  at: string
}

export interface BrokerManagedProjectionEvent {
  id: number
  type: 'managed-projection' | 'managed-gap' | 'session-unloaded' | 'broker-stopping'
  projectId: string
  at: string
  projection?: ManageRuntimeProjectProjection
  expectedAfter?: number
  replayFrom?: number
}

interface BrokerManagedSubscriber {
  tokenDigest: string
  listener: (event: BrokerManagedProjectionEvent) => void
  onUnauthorized: () => void
}

interface BrokerProjectSession {
  identity: BrokerProjectIdentity
  accessToken: string
  namespacePath: string
  loadedAtMs: number
  lastAccessAtMs: number
  runtimeStore: RuntimeEventStore | null
  runtimeOpening: Promise<RuntimeEventStore> | null
  runtimeDisposing: Promise<string[]> | null
  webBootstraps: Map<string, number>
  webTokens: Map<string, number>
  webSnapshot: WebSnapshot | null
  webRefreshing: Promise<WebSnapshot> | null
  managedProjection: ManageRuntimeProjectProjection | null
  managedProjectionFingerprint: string | null
  managedRefreshing: Promise<ManageRuntimeProjectProjection> | null
  runtimeMigrationAttempted: boolean
  managedEventId: number
  managedEvents: BrokerManagedProjectionEvent[]
  managedSubscribers: Set<BrokerManagedSubscriber>
  subscribers: Set<(event: BrokerSessionEvent) => void>
}

interface BrokerRuntimeOperations {
  open: typeof openRuntimeEventStore
  inspect: typeof inspectRuntimeDatabase
  dispose: typeof disposeRuntimeDatabase
  project?: typeof readRuntimeProjectProjectionSnapshot
}

const defaultRuntimeOperations: BrokerRuntimeOperations = {
  open: openRuntimeEventStore,
  inspect: inspectRuntimeDatabase,
  dispose: disposeRuntimeDatabase,
}

export interface BrokerProjectRegistration {
  project: BrokerProjectSessionPublic
  accessToken: string
}

export interface BrokerProjectSubscription {
  project: BrokerProjectSessionPublic
  unsubscribe: () => void
}

export interface BrokerManagedWebSubscription {
  project: BrokerProjectSessionPublic
  unsubscribe: () => void
}

export interface BrokerWebBootstrap {
  bootstrapToken: string
  expiresAt: string
}

export interface BrokerWebSessionAuthorization {
  webToken: string
  expiresAt: string
}

export class BrokerProjectSessions {
  private readonly sessions = new Map<string, BrokerProjectSession>()
  private readonly registrations = new Map<string, Promise<BrokerProjectSession>>()
  private readonly timer: NodeJS.Timeout

  constructor(
    private readonly paths: BrokerPaths,
    private readonly idleMs = DEFAULT_BROKER_PROJECT_IDLE_MS,
    private readonly now: () => number = Date.now,
    private readonly runtimeOperations: BrokerRuntimeOperations = defaultRuntimeOperations,
  ) {
    if (!Number.isSafeInteger(idleMs) || idleMs < 10)
      throw new BrokerError('broker_idle_invalid', 'Broker project idle timeout must be an integer of at least 10 milliseconds')
    const sweepMs = Math.max(10, Math.min(30_000, Math.floor(idleMs / 2)))
    this.timer = setInterval(() => this.sweep(), sweepMs)
    this.timer.unref()
  }

  async register(root: string): Promise<BrokerProjectRegistration> {
    const identity = await discoverBrokerProject(root)
    let session = this.sessions.get(identity.projectId)
    if (!session) {
      let registration = this.registrations.get(identity.projectId)
      if (!registration) {
        registration = this.createSession(identity)
        this.registrations.set(identity.projectId, registration)
      }
      try {
        session = await registration
      }
      finally {
        if (this.registrations.get(identity.projectId) === registration)
          this.registrations.delete(identity.projectId)
      }
    }
    if (!sameProjectIdentity(session.identity, identity))
      throw new BrokerError('broker_project_collision', `Broker project identity collision for ${identity.root}`)
    this.touch(session)
    return {
      project: publicSession(session),
      accessToken: session.accessToken,
    }
  }

  authorize(projectId: string, accessToken: string): BrokerProjectSessionPublic {
    const session = this.authorizedSession(projectId, accessToken)
    this.touch(session)
    return publicSession(session)
  }

  createWebBootstrap(projectId: string, accessToken: string): BrokerWebBootstrap {
    const session = this.authorizedSession(projectId, accessToken)
    const now = this.now()
    this.pruneWebCredentials(session, now)
    discardOldestEntries(session.webBootstraps, WEB_MAX_BOOTSTRAPS_PER_PROJECT - 1)
    const bootstrapToken = randomBytes(32).toString('base64url')
    const expiresAtMs = now + WEB_BOOTSTRAP_TTL_MS
    session.webBootstraps.set(tokenDigest(bootstrapToken), expiresAtMs)
    this.touch(session)
    return {
      bootstrapToken,
      expiresAt: new Date(expiresAtMs).toISOString(),
    }
  }

  consumeWebBootstrap(projectId: string, bootstrapToken: string): BrokerWebSessionAuthorization {
    const session = this.sessions.get(projectId)
    if (!session)
      throw new BrokerError('web_bootstrap_invalid', 'Web bootstrap is not valid for the requested project')
    const now = this.now()
    this.pruneWebCredentials(session, now)
    const digest = tokenDigest(bootstrapToken)
    const expiresAt = session.webBootstraps.get(digest)
    session.webBootstraps.delete(digest)
    if (expiresAt === undefined || expiresAt <= now)
      throw new BrokerError('web_bootstrap_invalid', 'Web bootstrap is invalid or expired')
    discardOldestEntries(session.webTokens, WEB_MAX_SESSIONS_PER_PROJECT - 1)
    const webToken = randomBytes(32).toString('base64url')
    const webExpiresAt = now + WEB_SESSION_TTL_MS
    session.webTokens.set(tokenDigest(webToken), webExpiresAt)
    this.pruneManagedSubscribers(session)
    this.touch(session)
    return {
      webToken,
      expiresAt: new Date(webExpiresAt).toISOString(),
    }
  }

  authorizeWeb(projectId: string, webToken: string): BrokerProjectSessionPublic {
    const session = this.authorizedWebSession(projectId, webToken)
    this.touch(session)
    return publicSession(session)
  }

  cachedWebSnapshot(projectId: string, webToken: string): WebSnapshot | null {
    const session = this.authorizedWebSession(projectId, webToken)
    this.touch(session)
    return session.webSnapshot
  }

  async webSnapshotFor(
    projectId: string,
    webToken: string,
    options: {
      refresh: boolean
      load: (project: BrokerProjectIdentity) => Promise<WebSnapshot>
    },
  ): Promise<WebSnapshot> {
    const session = this.authorizedWebSession(projectId, webToken)
    this.touch(session)
    if (!options.refresh && session.webSnapshot)
      return session.webSnapshot
    if (session.webRefreshing)
      return session.webRefreshing
    const refreshing = options.load(session.identity)
    session.webRefreshing = refreshing
    try {
      const snapshot = await refreshing
      if (this.sessions.get(projectId) !== session)
        throw new BrokerError('broker_project_unloaded', `Broker project ${projectId} unloaded while refreshing its Web snapshot`)
      session.webSnapshot = snapshot
      return snapshot
    }
    finally {
      if (session.webRefreshing === refreshing)
        session.webRefreshing = null
    }
  }

  async managedRuntimeForWeb(
    projectId: string,
    webToken: string,
  ): Promise<ManageRuntimeProjectProjection> {
    const session = this.authorizedWebSession(projectId, webToken)
    this.touch(session)
    return this.refreshManagedProjection(session)
  }

  async publishManagedRuntime(
    projectId: string,
    accessToken: string,
  ): Promise<ManageRuntimeProjectProjection> {
    const session = this.authorizedSession(projectId, accessToken)
    this.touch(session)
    return this.refreshManagedProjection(session)
  }

  async subscribeManagedWeb(
    projectId: string,
    webToken: string,
    afterEventId: number | null,
    listener: (event: BrokerManagedProjectionEvent) => void,
    onUnauthorized: () => void = () => {},
  ): Promise<BrokerManagedWebSubscription> {
    const session = this.authorizedWebSession(projectId, webToken)
    const subscriber: BrokerManagedSubscriber = {
      tokenDigest: tokenDigest(webToken),
      listener,
      onUnauthorized,
    }
    this.touch(session)
    await this.refreshManagedProjection(session)
    const authorized = this.authorizedWebSession(projectId, webToken)
    if (authorized !== session)
      throw new BrokerError('web_session_unauthorized', 'Web session is no longer authorized')
    this.touch(session)
    const oldest = session.managedEvents[0]?.id ?? session.managedEventId
    if (afterEventId !== null
      && (afterEventId < oldest - 1 || afterEventId > session.managedEventId)) {
      listener({
        id: session.managedEventId,
        type: 'managed-gap',
        projectId,
        at: new Date(this.now()).toISOString(),
        expectedAfter: session.managedEventId,
        replayFrom: oldest,
      })
    }
    else {
      for (const event of session.managedEvents) {
        if (afterEventId === null || event.id > afterEventId)
          listener(event)
      }
    }
    session.managedSubscribers.add(subscriber)
    let subscribed = true
    return {
      project: publicSession(session),
      unsubscribe: () => {
        if (!subscribed)
          return
        subscribed = false
        session.managedSubscribers.delete(subscriber)
        this.touch(session)
      },
    }
  }

  subscribe(
    projectId: string,
    accessToken: string,
    listener: (event: BrokerSessionEvent) => void,
  ): BrokerProjectSubscription {
    const session = this.authorizedSession(projectId, accessToken)
    this.touch(session)
    session.subscribers.add(listener)
    listener({
      type: 'session-ready',
      projectId,
      at: new Date(this.now()).toISOString(),
    })
    let subscribed = true
    return {
      project: publicSession(session),
      unsubscribe: () => {
        if (!subscribed)
          return
        subscribed = false
        session.subscribers.delete(listener)
        this.touch(session)
      },
    }
  }

  list(): BrokerProjectSessionPublic[] {
    return [...this.sessions.values()]
      .map(publicSession)
      .sort((first, second) => first.projectId.localeCompare(second.projectId))
  }

  sessionCount(): number {
    return this.sessions.size
  }

  has(projectId: string): boolean {
    return this.sessions.has(projectId)
  }

  sweep(): string[] {
    const now = this.now()
    const unloaded: string[] = []
    for (const [projectId, session] of this.sessions) {
      this.pruneWebCredentials(session, now)
      if (session.subscribers.size > 0
        || session.managedSubscribers.size > 0
        || now - session.lastAccessAtMs < this.idleMs) {
        continue
      }
      const event: BrokerSessionEvent = {
        type: 'session-unloaded',
        projectId,
        at: new Date(now).toISOString(),
      }
      for (const listener of session.subscribers)
        listener(event)
      this.emitManagedTerminal(session, 'session-unloaded', now)
      session.subscribers.clear()
      session.managedSubscribers.clear()
      this.releaseRuntime(session)
      this.sessions.delete(projectId)
      unloaded.push(projectId)
    }
    return unloaded
  }

  close(): void {
    clearInterval(this.timer)
    const at = new Date(this.now()).toISOString()
    for (const [projectId, session] of this.sessions) {
      const event: BrokerSessionEvent = { type: 'broker-stopping', projectId, at }
      for (const listener of session.subscribers)
        listener(event)
      this.emitManagedTerminal(session, 'broker-stopping', this.now())
      session.subscribers.clear()
      session.managedSubscribers.clear()
      this.releaseRuntime(session)
    }
    this.sessions.clear()
  }

  namespaceFor(projectId: string, accessToken: string): string {
    return this.authorizedSession(projectId, accessToken).namespacePath
  }

  async runtimeFor(projectId: string, accessToken: string): Promise<RuntimeEventStore> {
    const session = this.authorizedSession(projectId, accessToken)
    this.touch(session)
    if (session.runtimeDisposing) {
      await session.runtimeDisposing
      if (this.sessions.get(projectId) !== session) {
        throw new BrokerError(
          'broker_project_unloaded',
          `Broker project ${projectId} unloaded while its runtime store was being disposed`,
        )
      }
    }
    if (session.runtimeStore)
      return session.runtimeStore
    if (session.runtimeOpening)
      return session.runtimeOpening
    const opening = this.runtimeOperations.open({
      namespacePath: session.namespacePath,
      project: session.identity,
    })
    session.runtimeOpening = opening
    try {
      const store = await opening
      if (this.sessions.get(projectId) !== session) {
        store.close()
        throw new BrokerError(
          'broker_project_unloaded',
          `Broker project ${projectId} unloaded while its runtime store was opening`,
        )
      }
      session.runtimeStore = store
      return store
    }
    finally {
      if (session.runtimeOpening === opening)
        session.runtimeOpening = null
    }
  }

  async inspectRuntimeFor(
    projectId: string,
    accessToken: string,
  ): Promise<RuntimeDatabaseInspection> {
    const session = this.authorizedSession(projectId, accessToken)
    this.touch(session)
    return this.runtimeOperations.inspect(session.namespacePath, session.identity)
  }

  async disposeRuntimeFor(projectId: string, accessToken: string): Promise<string[]> {
    const session = this.authorizedSession(projectId, accessToken)
    this.touch(session)
    if (session.runtimeDisposing)
      return session.runtimeDisposing
    const disposal = this.disposeSessionRuntime(session)
    session.runtimeDisposing = disposal
    try {
      return await disposal
    }
    finally {
      if (session.runtimeDisposing === disposal)
        session.runtimeDisposing = null
    }
  }

  private async disposeSessionRuntime(session: BrokerProjectSession): Promise<string[]> {
    const opening = session.runtimeOpening
    if (opening) {
      try {
        const store = await opening
        if (session.runtimeStore === store)
          session.runtimeStore = null
        store.close()
      }
      catch {
        // Disposal remains the recovery path when opening failed.
      }
    }
    session.runtimeStore?.close()
    session.runtimeStore = null
    return this.runtimeOperations.dispose({
      projectId: session.identity.projectId,
      cacheRoot: this.paths.root,
      projectsRoot: this.paths.projects,
      namespacePath: session.namespacePath,
    })
  }

  private authorizedSession(projectId: string, accessToken: string): BrokerProjectSession {
    const session = this.sessions.get(projectId)
    if (!session || !safeTokenEqual(session.accessToken, accessToken))
      throw new BrokerError('broker_project_unauthorized', 'Project token is not valid for the requested Broker project')
    return session
  }

  private touch(session: BrokerProjectSession): void {
    session.lastAccessAtMs = this.now()
  }

  private async createSession(identity: BrokerProjectIdentity): Promise<BrokerProjectSession> {
    await ensurePrivateDirectory(this.paths.projects)
    const namespacePath = brokerProjectNamespace(this.paths.projects, identity.projectId)
    await ensurePrivateDirectory(namespacePath)
    const existing = this.sessions.get(identity.projectId)
    if (existing)
      return existing
    const now = this.now()
    const session: BrokerProjectSession = {
      identity,
      accessToken: randomBytes(32).toString('base64url'),
      namespacePath,
      loadedAtMs: now,
      lastAccessAtMs: now,
      runtimeStore: null,
      runtimeOpening: null,
      runtimeDisposing: null,
      webBootstraps: new Map(),
      webTokens: new Map(),
      webSnapshot: null,
      webRefreshing: null,
      managedProjection: null,
      managedProjectionFingerprint: null,
      managedRefreshing: null,
      runtimeMigrationAttempted: false,
      managedEventId: 0,
      managedEvents: [],
      managedSubscribers: new Set(),
      subscribers: new Set(),
    }
    this.sessions.set(identity.projectId, session)
    return session
  }

  private releaseRuntime(session: BrokerProjectSession): void {
    session.runtimeStore?.close()
    session.runtimeStore = null
    const opening = session.runtimeOpening
    session.runtimeOpening = null
    if (opening)
      void opening.then(store => store.close()).catch(() => undefined)
  }

  private authorizedWebSession(projectId: string, webToken: string): BrokerProjectSession {
    const session = this.sessions.get(projectId)
    if (!session)
      throw new BrokerError('web_session_unauthorized', 'Web session is not valid for the requested project')
    const now = this.now()
    this.pruneWebCredentials(session, now)
    const expiresAt = session.webTokens.get(tokenDigest(webToken))
    if (expiresAt === undefined || expiresAt <= now)
      throw new BrokerError('web_session_unauthorized', 'Web session is invalid or expired')
    return session
  }

  private async refreshManagedProjection(
    session: BrokerProjectSession,
  ): Promise<ManageRuntimeProjectProjection> {
    while (session.managedRefreshing) {
      try {
        await session.managedRefreshing
      }
      catch {
        // The next serialized refresh remains allowed to recover independently.
      }
    }
    const refreshing = this.loadManagedProjection(session)
    session.managedRefreshing = refreshing
    try {
      return await refreshing
    }
    finally {
      if (session.managedRefreshing === refreshing)
        session.managedRefreshing = null
    }
  }

  private async loadManagedProjection(
    session: BrokerProjectSession,
  ): Promise<ManageRuntimeProjectProjection> {
    const projectRuntime = this.runtimeOperations.project ?? readRuntimeProjectProjectionSnapshot
    let snapshot = await projectRuntime({
      namespacePath: session.namespacePath,
      project: session.identity,
    })
    if (snapshot.state === 'migration-required' && !session.runtimeMigrationAttempted) {
      session.runtimeMigrationAttempted = true
      try {
        await this.runtimeFor(session.identity.projectId, session.accessToken)
        snapshot = await projectRuntime({
          namespacePath: session.namespacePath,
          project: session.identity,
        })
      }
      catch {
        // Keep the read-only migration diagnostic visible without retrying on every poll.
      }
    }
    if (this.sessions.get(session.identity.projectId) !== session) {
      throw new BrokerError(
        'broker_project_unloaded',
        `Broker project ${session.identity.projectId} unloaded while refreshing its managed projection`,
      )
    }
    const projection = projectManageProjectSnapshot(
      session.identity.projectId,
      snapshot,
      () => new Date(this.now()),
    )
    const fingerprint = managedProjectionFingerprint(projection)
    if (fingerprint !== session.managedProjectionFingerprint) {
      session.managedProjection = projection
      session.managedProjectionFingerprint = fingerprint
      const event: BrokerManagedProjectionEvent = {
        id: ++session.managedEventId,
        type: 'managed-projection',
        projectId: session.identity.projectId,
        at: new Date(this.now()).toISOString(),
        projection,
      }
      session.managedEvents.push(event)
      if (session.managedEvents.length > MAX_MANAGED_WEB_EVENTS)
        session.managedEvents.splice(0, session.managedEvents.length - MAX_MANAGED_WEB_EVENTS)
      for (const subscriber of session.managedSubscribers)
        subscriber.listener(event)
    }
    return projection
  }

  private emitManagedTerminal(
    session: BrokerProjectSession,
    type: 'session-unloaded' | 'broker-stopping',
    now: number,
  ): void {
    const event: BrokerManagedProjectionEvent = {
      id: ++session.managedEventId,
      type,
      projectId: session.identity.projectId,
      at: new Date(now).toISOString(),
    }
    for (const subscriber of session.managedSubscribers)
      subscriber.listener(event)
  }

  private pruneWebCredentials(session: BrokerProjectSession, now: number): void {
    for (const [digest, expiresAt] of session.webBootstraps) {
      if (expiresAt <= now)
        session.webBootstraps.delete(digest)
    }
    for (const [digest, expiresAt] of session.webTokens) {
      if (expiresAt <= now)
        session.webTokens.delete(digest)
    }
    this.pruneManagedSubscribers(session)
  }

  private pruneManagedSubscribers(session: BrokerProjectSession): void {
    for (const subscriber of session.managedSubscribers) {
      if (session.webTokens.has(subscriber.tokenDigest))
        continue
      session.managedSubscribers.delete(subscriber)
      subscriber.onUnauthorized()
    }
  }
}

export function safeTokenEqual(expected: string, received: string): boolean {
  const first = Buffer.from(expected)
  const second = Buffer.from(received)
  return first.length === second.length && timingSafeEqual(first, second)
}

function managedProjectionFingerprint(projection: ManageRuntimeProjectProjection): string {
  return createHash('sha256').update(JSON.stringify({
    ...projection,
    generatedAt: null,
    runs: projection.runs.map(run => ({
      ...run,
      freshness: {
        ...run.freshness,
        generatedAt: null,
      },
    })),
  })).digest('hex')
}

function tokenDigest(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

function discardOldestEntries(map: Map<string, number>, maximumBeforeInsert: number): void {
  while (map.size > maximumBeforeInsert) {
    const oldest = map.keys().next().value
    if (oldest === undefined)
      return
    map.delete(oldest)
  }
}

function sameProjectIdentity(first: BrokerProjectIdentity, second: BrokerProjectIdentity): boolean {
  return first.projectId === second.projectId
    && first.root === second.root
    && first.filesystem.device === second.filesystem.device
    && first.filesystem.inode === second.filesystem.inode
}

function publicSession(session: BrokerProjectSession): BrokerProjectSessionPublic {
  return {
    projectId: session.identity.projectId,
    root: session.identity.root,
    filesystem: { ...session.identity.filesystem },
    loadedAt: new Date(session.loadedAtMs).toISOString(),
    lastAccessAt: new Date(session.lastAccessAtMs).toISOString(),
  }
}
