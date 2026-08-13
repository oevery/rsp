import type { RuntimeDatabaseInspection } from '../runtime/model.js'
import type { RuntimeEventStore } from '../runtime/store.js'
import type { BrokerPaths } from './host.js'
import type { BrokerProjectIdentity, BrokerProjectSessionPublic } from './protocol.js'
import { Buffer } from 'node:buffer'
import { randomBytes, timingSafeEqual } from 'node:crypto'
import {
  disposeRuntimeDatabase,
  inspectRuntimeDatabase,
  openRuntimeEventStore,
} from '../runtime/store.js'
import { brokerProjectNamespace, discoverBrokerProject } from './project.js'
import { BrokerError } from './protocol.js'
import { ensurePrivateDirectory } from './storage.js'

export const DEFAULT_BROKER_PROJECT_IDLE_MS = 5 * 60 * 1000

export interface BrokerSessionEvent {
  type: 'session-ready' | 'session-unloaded' | 'broker-stopping'
  projectId: string
  at: string
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
  subscribers: Set<(event: BrokerSessionEvent) => void>
}

interface BrokerRuntimeOperations {
  open: typeof openRuntimeEventStore
  inspect: typeof inspectRuntimeDatabase
  dispose: typeof disposeRuntimeDatabase
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
      if (session.subscribers.size > 0 || now - session.lastAccessAtMs < this.idleMs) {
        continue
      }
      const event: BrokerSessionEvent = {
        type: 'session-unloaded',
        projectId,
        at: new Date(now).toISOString(),
      }
      for (const listener of session.subscribers)
        listener(event)
      session.subscribers.clear()
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
      session.subscribers.clear()
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
}

export function safeTokenEqual(expected: string, received: string): boolean {
  const first = Buffer.from(expected)
  const second = Buffer.from(received)
  return first.length === second.length && timingSafeEqual(first, second)
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
