import type { IncomingMessage, ServerResponse } from 'node:http'
import type { AddressInfo } from 'node:net'
import type { WebManagedSseEvent } from '../web/model.js'
import type { WebProjectionService } from '../web/service.js'
import type { BrokerPaths } from './host.js'
import type { BrokerStartLockClaim } from './lock.js'

import type {
  BrokerDiscoveryRecord,
  BrokerErrorResponse,
  BrokerHealthResponse,
  BrokerProjectSessionPublic,
  BrokerStatusResponse,
  BrokerVersionIdentity,
} from './protocol.js'
import type { BrokerSessionEvent } from './sessions.js'
import { Buffer } from 'node:buffer'
import { randomBytes, randomUUID } from 'node:crypto'
import { constants } from 'node:fs'
import { open } from 'node:fs/promises'
import { createServer } from 'node:http'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  executeManageRuntimeServiceRequest,
  MANAGE_RUNTIME_DESCRIPTOR,
} from '../runtime/manage.js'
import { RuntimeStoreError } from '../runtime/model.js'
import {
  WEB_MAX_DETAIL_PATH_CODE_POINTS,
  WEB_MAX_QUERY_CODE_POINTS,
} from '../web/model.js'
import { createWebProjector } from '../web/runner.js'
import { createWebProjectionService } from '../web/service.js'
import { processIdentityFor } from '../workspace/process.js'
import { isLoopbackPeer, parseLoopbackEndpoint } from './host.js'
import { assertBrokerStartLockClaim, releaseBrokerStartLockClaim } from './lock.js'
import {
  BROKER_DISCOVERY_SCHEMA,
  BROKER_MAX_JSON_RESPONSE_BYTES,
  BROKER_PROTOCOL_VERSION,
  BROKER_RUNTIME_SCHEMA_VERSION,
  BrokerError,
  parseBrokerDiscoveryRecord,
  publicBrokerIdentity,
} from './protocol.js'
import { BrokerProjectSessions, DEFAULT_BROKER_PROJECT_IDLE_MS, safeTokenEqual } from './sessions.js'
import { readBrokerJson, unlinkBrokerFileIfIdentity, writeBrokerJsonExclusiveAtomic } from './storage.js'

const MAX_REQUEST_BYTES = 16 * 1024
const MAX_WEB_HTML_BYTES = 1024 * 1024
const MAX_WEB_CSS_BYTES = 2 * 1024 * 1024
const MAX_WEB_JAVASCRIPT_BYTES = 8 * 1024 * 1024

export interface BrokerServerOptions {
  paths: BrokerPaths
  packageVersion: string
  idleMs?: number
  protocol?: BrokerVersionIdentity
  runtimeSchema?: BrokerVersionIdentity
  startupClaim?: BrokerStartLockClaim
  webAssetsRoot?: string
  webProjectorEntry?: string
  webService?: WebProjectionService
}

export interface BrokerServerHandle {
  record: BrokerDiscoveryRecord
  sessions: BrokerProjectSessions
  stopped: Promise<void>
  close: () => Promise<void>
}

export async function startBrokerServer(options: BrokerServerOptions): Promise<BrokerServerHandle> {
  const processIdentity = await processIdentityFor(process.pid)
  if (!processIdentity)
    throw new BrokerError('broker_process_identity_unavailable', 'Unable to observe the Broker process-start identity')

  const instanceId = randomUUID()
  const controlToken = randomBytes(32).toString('base64url')
  const sessions = new BrokerProjectSessions(
    options.paths,
    options.idleMs ?? DEFAULT_BROKER_PROJECT_IDLE_MS,
  )
  const webAssetsRoot = options.webAssetsRoot
    ?? fileURLToPath(new URL('../web/static', import.meta.url))
  const webService = options.webService
    ?? createWebProjectionService(createWebProjector(options.webProjectorEntry))
  const sseResponses = new Set<ServerResponse>()
  let closePromise: Promise<void> | null = null
  let resolveStopped: (() => void) | null = null
  const stopped = new Promise<void>((resolve) => {
    resolveStopped = resolve
  })
  const server = createServer((request, response) => {
    void handleRequest(request, response).catch((error) => {
      if (!response.headersSent)
        writeError(response, error)
      else
        response.destroy(error instanceof Error ? error : new Error(String(error)))
    })
  })
  server.requestTimeout = 5_000
  server.headersTimeout = 5_000
  server.keepAliveTimeout = 2_000
  server.maxHeadersCount = 50

  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', () => {
      server.off('error', reject)
      resolve()
    })
  })
  const address = server.address() as AddressInfo | null
  if (!address || address.family === undefined) {
    await closeHttpServer(server)
    throw new BrokerError('broker_endpoint_unavailable', 'Broker did not receive a loopback HTTP endpoint')
  }
  const endpoint = `http://127.0.0.1:${address.port}`
  parseLoopbackEndpoint(endpoint)
  const record: BrokerDiscoveryRecord = {
    schema: BROKER_DISCOVERY_SCHEMA,
    instanceId,
    pid: process.pid,
    processIdentity,
    endpoint,
    protocol: { ...(options.protocol ?? BROKER_PROTOCOL_VERSION) },
    runtimeSchema: { ...(options.runtimeSchema ?? BROKER_RUNTIME_SCHEMA_VERSION) },
    packageVersion: options.packageVersion,
    controlToken,
    startedAt: new Date().toISOString(),
  }

  let discoveryPublished = false
  try {
    if (options.startupClaim)
      await assertBrokerStartLockClaim(options.paths, options.startupClaim)
    if (!await writeBrokerJsonExclusiveAtomic(options.paths.discovery, record))
      throw new BrokerError('broker_discovery_owned', 'Another Broker discovery owner appeared before daemon publication')
    discoveryPublished = true
    if (options.startupClaim
      && !await releaseBrokerStartLockClaim(options.paths, options.startupClaim)) {
      throw new BrokerError('broker_start_claim_lost', 'Broker daemon lost startup ownership while publishing discovery')
    }
  }
  catch (error) {
    if (discoveryPublished)
      await removeOwnedDiscoveryRecord(options.paths.discovery, record)
    if (options.startupClaim)
      await releaseBrokerStartLockClaim(options.paths, options.startupClaim).catch(() => false)
    sessions.close()
    await closeHttpServer(server)
    throw error
  }

  return {
    record,
    sessions,
    stopped,
    close,
  }

  async function handleRequest(request: IncomingMessage, response: ServerResponse): Promise<void> {
    applyResponseHeaders(response)
    const endpointIdentity = parseLoopbackEndpoint(record.endpoint)
    if (!isLoopbackPeer(request.socket.remoteAddress))
      throw new BrokerHttpError(403, 'broker_loopback_required', 'Broker requests must originate from loopback')
    if (request.headers.host !== endpointIdentity.hostHeader)
      throw new BrokerHttpError(403, 'broker_host_invalid', 'Broker Host header does not match the bound loopback endpoint')
    const origin = request.headers.origin
    if (origin !== undefined && origin !== endpointIdentity.endpoint)
      throw new BrokerHttpError(403, 'broker_origin_invalid', 'Broker browser requests must use the exact bound loopback origin')

    const url = new URL(request.url ?? '/', record.endpoint)
    if (url.origin !== endpointIdentity.endpoint)
      throw new BrokerHttpError(400, 'broker_request_target_invalid', 'Broker request target must use the bound loopback origin')
    const webPageMatch = url.pathname.match(/^\/web\/([a-f0-9]{64})\/$/u)
    if (webPageMatch) {
      requireExactQuery(url, [])
      requireMethod(request, 'GET')
      if (!sessions.has(webPageMatch[1]!))
        throw new BrokerHttpError(404, 'web_project_not_found', 'Web project session is not loaded')
      await writeStaticAsset(
        response,
        join(webAssetsRoot, 'index.html'),
        'text/html; charset=utf-8',
        MAX_WEB_HTML_BYTES,
      )
      return
    }
    if (url.pathname === '/web/assets/app.js'
      || url.pathname === '/web/assets/app.css') {
      requireExactQuery(url, [])
      requireMethod(request, 'GET')
      const filename = url.pathname.slice('/web/assets/'.length)
      const contentType = filename.endsWith('.js')
        ? 'text/javascript; charset=utf-8'
        : 'text/css; charset=utf-8'
      await writeStaticAsset(
        response,
        join(webAssetsRoot, filename),
        contentType,
        filename.endsWith('.js') ? MAX_WEB_JAVASCRIPT_BYTES : MAX_WEB_CSS_BYTES,
      )
      return
    }
    if (url.pathname === '/v1/web/bootstrap') {
      requireExactQuery(url, [])
      requireMethod(request, 'POST')
      requireExactOrigin(request, endpointIdentity.endpoint)
      const body = await readJsonBody(request)
      if (!isObject(body)
        || Object.keys(body).sort().join(',') !== 'bootstrapToken,projectId'
        || typeof body.projectId !== 'string'
        || !/^[a-f0-9]{64}$/u.test(body.projectId)
        || typeof body.bootstrapToken !== 'string'
        || body.bootstrapToken.length < 32
        || body.bootstrapToken.length > 128
        || /\s/u.test(body.bootstrapToken)) {
        throw new BrokerHttpError(400, 'web_bootstrap_request_invalid', 'Web bootstrap request is invalid')
      }
      const authorization = sessions.consumeWebBootstrap(body.projectId, body.bootstrapToken)
      writeJson(response, 200, {
        ok: true,
        projectId: body.projectId,
        webToken: authorization.webToken,
        expiresAt: authorization.expiresAt,
      })
      return
    }
    if (request.method === 'GET' && url.pathname === '/v1/health') {
      requireBearer(request, record.controlToken, 'broker_control_unauthorized')
      const body: BrokerHealthResponse = { ok: true, broker: publicBrokerIdentity(record) }
      writeJson(response, 200, body)
      return
    }
    if (request.method === 'GET' && url.pathname === '/v1/status') {
      requireBearer(request, record.controlToken, 'broker_control_unauthorized')
      const body = createBrokerStatusResponse(record, sessions.list())
      writeJson(response, 200, body)
      return
    }
    if (request.method === 'POST' && url.pathname === '/v1/projects/register') {
      requireBearer(request, record.controlToken, 'broker_control_unauthorized')
      const body = await readJsonBody(request)
      if (!isObject(body)
        || Object.keys(body).some(key => key !== 'root')
        || typeof body.root !== 'string'
        || body.root.length === 0
        || body.root.length > 4096) {
        throw new BrokerHttpError(400, 'broker_project_request_invalid', 'Project registration requires exactly one non-empty root string')
      }
      const registration = await sessions.register(body.root)
      writeJson(response, 200, {
        ok: true,
        project: registration.project,
        accessToken: registration.accessToken,
      })
      return
    }
    if (request.method === 'POST' && url.pathname === '/v1/control/stop') {
      requireBearer(request, record.controlToken, 'broker_control_unauthorized')
      writeJson(response, 202, { ok: true, stopping: true })
      setImmediate(() => void close())
      return
    }

    const projectMatch = url.pathname.match(/^\/v1\/projects\/([a-f0-9]{64})$/u)
    if (request.method === 'GET' && projectMatch) {
      const accessToken = bearerToken(request)
      const project = sessions.authorize(projectMatch[1]!, accessToken)
      writeJson(response, 200, { ok: true, project })
      return
    }
    const webBootstrapMatch = url.pathname.match(/^\/v1\/projects\/([a-f0-9]{64})\/web\/bootstrap$/u)
    if (webBootstrapMatch) {
      requireExactQuery(url, [])
      requireMethod(request, 'POST')
      const accessToken = bearerToken(request)
      const bootstrap = sessions.createWebBootstrap(webBootstrapMatch[1]!, accessToken)
      writeJson(response, 200, {
        ok: true,
        projectId: webBootstrapMatch[1],
        bootstrapToken: bootstrap.bootstrapToken,
        expiresAt: bootstrap.expiresAt,
      })
      return
    }
    const webSnapshotMatch = url.pathname.match(/^\/v1\/web\/projects\/([a-f0-9]{64})\/(snapshot|refresh)$/u)
    if (webSnapshotMatch) {
      requireExactQuery(url, [])
      requireMethod(request, webSnapshotMatch[2] === 'refresh' ? 'POST' : 'GET')
      const projectId = webSnapshotMatch[1]!
      const webToken = bearerToken(request)
      try {
        const snapshot = await sessions.webSnapshotFor(projectId, webToken, {
          refresh: webSnapshotMatch[2] === 'refresh',
          load: async (project) => {
            const managed = await sessions.managedRuntimeForWeb(projectId, webToken)
            const snapshot = await webService.snapshot(project, managed)
            encodeBrokerJsonResponse({ ok: true, snapshot })
            return snapshot
          },
        })
        writeJson(response, 200, { ok: true, snapshot })
      }
      catch (error) {
        const stale = safeCachedSnapshot(sessions, projectId, webToken)
        if (error instanceof BrokerError && error.code === 'web_session_unauthorized')
          throw error
        const code = error instanceof BrokerError ? error.code : 'web_refresh_failed'
        const message = error instanceof BrokerError ? error.message : 'Web snapshot refresh failed'
        writeJson(response, 503, {
          ok: false,
          error: { code, message },
          stale: stale
            ? { snapshotId: stale.snapshotId, generatedAt: stale.generatedAt }
            : null,
        })
      }
      return
    }
    const webHeartbeatMatch = url.pathname.match(/^\/v1\/web\/projects\/([a-f0-9]{64})\/session$/u)
    if (webHeartbeatMatch) {
      requireExactQuery(url, [])
      requireMethod(request, 'GET')
      const project = sessions.authorizeWeb(webHeartbeatMatch[1]!, bearerToken(request))
      writeJson(response, 200, {
        ok: true,
        projectId: project.projectId,
        at: new Date().toISOString(),
      })
      return
    }
    const webSpecsDetailMatch = url.pathname.match(/^\/v1\/web\/projects\/([a-f0-9]{64})\/specs\/detail$/u)
    if (webSpecsDetailMatch) {
      requireMethod(request, 'GET')
      requireExactQuery(url, ['path'])
      const path = requiredProjectPathQuery(url, 'path', WEB_MAX_DETAIL_PATH_CODE_POINTS)
      const project = sessions.authorizeWeb(webSpecsDetailMatch[1]!, bearerToken(request))
      writeJson(response, 200, {
        ok: true,
        projection: await webService.specsDetail(project, path),
      })
      return
    }
    const webSpecsSearchMatch = url.pathname.match(/^\/v1\/web\/projects\/([a-f0-9]{64})\/specs\/search$/u)
    if (webSpecsSearchMatch) {
      requireMethod(request, 'GET')
      requireAllowedQuery(url, ['limit', 'q'], ['q'])
      const literal = requiredBoundedQuery(url, 'q', WEB_MAX_QUERY_CODE_POINTS)
      const limit = boundedIntegerQuery(url, 'limit', 1, 20, 20)
      const project = sessions.authorizeWeb(webSpecsSearchMatch[1]!, bearerToken(request))
      writeJson(response, 200, {
        ok: true,
        projection: await webService.specsSearch(project, literal, limit),
      })
      return
    }
    const webHistoryDetailMatch = url.pathname.match(/^\/v1\/web\/projects\/([a-f0-9]{64})\/history\/detail$/u)
    if (webHistoryDetailMatch) {
      requireMethod(request, 'GET')
      requireExactQuery(url, ['historyId'])
      const historyId = requiredOpaqueLookupQuery(url, 'historyId')
      const project = sessions.authorizeWeb(webHistoryDetailMatch[1]!, bearerToken(request))
      writeJson(response, 200, {
        ok: true,
        projection: await webService.historyDetail(project, historyId),
      })
      return
    }
    const webRunDetailMatch = url.pathname.match(/^\/v1\/web\/projects\/([a-f0-9]{64})\/runs\/detail$/u)
    if (webRunDetailMatch) {
      requireMethod(request, 'GET')
      requireExactQuery(url, ['runId'])
      const runId = requiredBoundedQuery(url, 'runId', WEB_MAX_QUERY_CODE_POINTS)
      const projectId = webRunDetailMatch[1]!
      const webToken = bearerToken(request)
      const project = sessions.authorizeWeb(projectId, webToken)
      const managed = await sessions.managedRuntimeForWeb(projectId, webToken)
      writeJson(response, 200, {
        ok: true,
        projection: await webService.runDetail(project, managed, runId),
      })
      return
    }
    const webEventsMatch = url.pathname.match(/^\/v1\/web\/projects\/([a-f0-9]{64})\/events$/u)
    if (webEventsMatch) {
      requireExactQuery(url, [])
      requireMethod(request, 'GET')
      const projectId = webEventsMatch[1]!
      const webToken = bearerToken(request)
      const afterEventId = parseLastEventId(request)
      sessions.authorizeWeb(projectId, webToken)
      response.statusCode = 200
      response.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
      response.setHeader('Connection', 'keep-alive')
      response.flushHeaders()
      sseResponses.add(response)
      const project = sessions.authorizeWeb(projectId, webToken)
      let writeQueue = Promise.resolve()
      const subscription = await sessions.subscribeManagedWeb(
        projectId,
        webToken,
        afterEventId,
        (event) => {
          writeQueue = writeQueue.then(async () => {
            if (event.type !== 'managed-projection' || !event.projection) {
              writeManagedSse(response, {
                id: event.id,
                type: event.type,
                projectId: event.projectId,
                at: event.at,
                ...(event.expectedAfter === undefined ? {} : { expectedAfter: event.expectedAfter }),
                ...(event.replayFrom === undefined ? {} : { replayFrom: event.replayFrom }),
              })
              return
            }
            const projection = await webService.managed(project, event.projection)
            writeManagedSse(response, { ...event, projection })
          }).catch(() => {
            if (!response.destroyed)
              response.destroy()
          })
        },
        () => {
          if (!response.destroyed)
            response.end()
        },
      )
      const refresh = setInterval(() => {
        void sessions.managedRuntimeForWeb(projectId, webToken).catch(() => undefined)
      }, 1_000)
      refresh.unref()
      const keepAlive = setInterval(() => {
        if (!response.destroyed)
          response.write(': keepalive\n\n')
      }, 15_000)
      keepAlive.unref()
      response.once('close', cleanup)
      return

      function cleanup(): void {
        clearInterval(refresh)
        clearInterval(keepAlive)
        subscription.unsubscribe()
        sseResponses.delete(response)
      }
    }
    const manageRuntimeCapabilityMatch = url.pathname.match(
      /^\/v1\/projects\/([a-f0-9]{64})\/runtime\/manage\/capability$/u,
    )
    if (manageRuntimeCapabilityMatch) {
      requireExactQuery(url, [])
      requireMethod(request, 'GET')
      sessions.authorize(manageRuntimeCapabilityMatch[1]!, bearerToken(request))
      writeJson(response, 200, {
        ok: true,
        capability: MANAGE_RUNTIME_DESCRIPTOR,
      })
      return
    }
    const manageRuntimeMatch = url.pathname.match(
      /^\/v1\/projects\/([a-f0-9]{64})\/runtime\/manage$/u,
    )
    if (manageRuntimeMatch) {
      requireExactQuery(url, [])
      requireMethod(request, 'POST')
      const projectId = manageRuntimeMatch[1]!
      const accessToken = bearerToken(request)
      const body = await readJsonBody(request)
      const store = await sessions.runtimeFor(projectId, accessToken)
      const result = executeManageRuntimeServiceRequest(store, body)
      await sessions.publishManagedRuntime(projectId, accessToken)
      writeJson(response, 200, {
        ok: true,
        capability: MANAGE_RUNTIME_DESCRIPTOR,
        result,
      })
      return
    }
    const eventsMatch = url.pathname.match(/^\/v1\/projects\/([a-f0-9]{64})\/events$/u)
    if (request.method === 'GET' && eventsMatch) {
      const projectId = eventsMatch[1]!
      const accessToken = bearerToken(request)
      sessions.authorize(projectId, accessToken)
      response.statusCode = 200
      response.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
      response.setHeader('Connection', 'keep-alive')
      response.flushHeaders()
      sseResponses.add(response)
      const subscription = sessions.subscribe(projectId, accessToken, event => writeSse(response, event))
      const keepAlive = setInterval(() => {
        if (!response.destroyed)
          response.write(': keepalive\n\n')
      }, 15_000)
      keepAlive.unref()
      request.once('close', cleanup)
      response.once('close', cleanup)
      return

      function cleanup(): void {
        clearInterval(keepAlive)
        subscription.unsubscribe()
        sseResponses.delete(response)
      }
    }

    throw new BrokerHttpError(404, 'broker_route_not_found', 'Broker route not found')
  }

  async function close(): Promise<void> {
    if (closePromise)
      return closePromise
    closePromise = (async () => {
      sessions.close()
      for (const response of sseResponses) {
        if (!response.destroyed)
          response.end()
      }
      sseResponses.clear()
      await closeHttpServer(server)
      await removeOwnedDiscoveryRecord(options.paths.discovery, record)
      resolveStopped?.()
    })()
    return closePromise
  }
}

class BrokerHttpError extends BrokerError {
  constructor(
    public readonly status: number,
    code: string,
    message: string,
  ) {
    super(code, message)
  }
}

async function removeOwnedDiscoveryRecord(path: string, expected: BrokerDiscoveryRecord): Promise<void> {
  const stored = await readBrokerJson(path).catch(() => null)
  if (!stored)
    return
  let current: BrokerDiscoveryRecord
  try {
    current = parseBrokerDiscoveryRecord(stored.value)
  }
  catch {
    return
  }
  if (current.instanceId === expected.instanceId
    && current.pid === expected.pid
    && current.processIdentity === expected.processIdentity) {
    await unlinkBrokerFileIfIdentity(path, stored.file)
  }
}

function requireBearer(request: IncomingMessage, expected: string, code: string): void {
  const received = bearerToken(request)
  if (!safeTokenEqual(expected, received))
    throw new BrokerHttpError(401, code, 'Broker bearer token is invalid')
}

function bearerToken(request: IncomingMessage): string {
  const header = request.headers.authorization
  if (typeof header !== 'string' || !header.startsWith('Bearer '))
    throw new BrokerHttpError(401, 'broker_auth_required', 'Broker requests require one bearer token')
  const token = header.slice('Bearer '.length)
  if (!token || token.length > 512 || /\s/u.test(token))
    throw new BrokerHttpError(401, 'broker_auth_invalid', 'Broker bearer token is malformed')
  return token
}

async function readJsonBody(request: IncomingMessage): Promise<unknown> {
  const contentType = request.headers['content-type']
  if (contentType !== 'application/json')
    throw new BrokerHttpError(415, 'broker_content_type_invalid', 'Broker JSON requests require Content-Type: application/json')
  const chunks: Buffer[] = []
  let total = 0
  for await (const chunk of request) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk)
    total += buffer.length
    if (total > MAX_REQUEST_BYTES)
      throw new BrokerHttpError(413, 'broker_request_too_large', `Broker request exceeds ${MAX_REQUEST_BYTES} bytes`)
    chunks.push(buffer)
  }
  try {
    return JSON.parse(Buffer.concat(chunks, total).toString('utf8'))
  }
  catch {
    throw new BrokerHttpError(400, 'broker_request_invalid_json', 'Broker request body is not valid JSON')
  }
}

function writeSse(response: ServerResponse, event: BrokerSessionEvent): void {
  if (response.destroyed)
    return
  response.write(`event: ${event.type}\n`)
  response.write(`data: ${JSON.stringify(event)}\n\n`)
  if (event.type === 'broker-stopping' || event.type === 'session-unloaded')
    response.end()
}

function writeManagedSse(response: ServerResponse, event: WebManagedSseEvent): void {
  if (response.destroyed)
    return
  const content = encodeBrokerJsonResponse(event).toString('utf8').trimEnd()
  response.write(`id: ${event.id}\n`)
  response.write(`event: ${event.type}\n`)
  response.write(`data: ${content}\n\n`)
  if (event.type === 'broker-stopping' || event.type === 'session-unloaded')
    response.end()
}

function parseLastEventId(request: IncomingMessage): number | null {
  const value = request.headers['last-event-id']
  if (value === undefined)
    return null
  if (typeof value !== 'string' || !/^(?:0|[1-9]\d*)$/u.test(value))
    throw new BrokerHttpError(400, 'web_event_cursor_invalid', 'Web event cursor is invalid')
  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed < 0)
    throw new BrokerHttpError(400, 'web_event_cursor_invalid', 'Web event cursor is invalid')
  return parsed
}

function writeJson(response: ServerResponse, status: number, value: unknown): void {
  const content = encodeBrokerJsonResponse(value)
  response.statusCode = status
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.setHeader('Content-Length', content.byteLength)
  response.end(content)
}

function writeError(response: ServerResponse, error: unknown): void {
  const status = error instanceof BrokerHttpError
    ? error.status
    : error instanceof RuntimeStoreError
      ? runtimeErrorStatus(error)
      : error instanceof BrokerError && (
        error.code === 'broker_project_unauthorized'
        || error.code === 'web_bootstrap_invalid'
        || error.code === 'web_session_unauthorized'
      )
        ? 401
        : 500
  const code = error instanceof BrokerError ? error.code : 'broker_internal_error'
  const runtimeCode = error instanceof RuntimeStoreError ? error.code : null
  const runtimeMessage = error instanceof RuntimeStoreError ? error.message : null
  const body: BrokerErrorResponse = {
    ok: false,
    error: {
      code: runtimeCode ?? code,
      message: runtimeMessage ?? (error instanceof BrokerError ? error.message : 'Broker request failed'),
    },
  }
  writeJson(response, status, body)
}

function runtimeErrorStatus(error: RuntimeStoreError): number {
  if (error.code.includes('too_large'))
    return 413
  if (error.code.includes('unavailable'))
    return 503
  if (error.code.includes('not_found') || error.code.includes('absent'))
    return 404
  if (error.code.includes('conflict') || error.code.includes('mismatch'))
    return 409
  return 400
}

function applyResponseHeaders(response: ServerResponse): void {
  response.setHeader('Cache-Control', 'no-store')
  response.setHeader('Pragma', 'no-cache')
  response.setHeader('X-Content-Type-Options', 'nosniff')
  response.setHeader('Referrer-Policy', 'no-referrer')
  response.setHeader('X-Frame-Options', 'DENY')
  response.setHeader('Content-Security-Policy', [
    `default-src 'none'`,
    `script-src 'self'`,
    `style-src 'self'`,
    `connect-src 'self'`,
    `img-src 'self' data:`,
    `base-uri 'none'`,
    `form-action 'none'`,
    `frame-ancestors 'none'`,
    `object-src 'none'`,
    `manifest-src 'none'`,
  ].join('; '))
  response.setHeader('Permissions-Policy', 'camera=(), display-capture=(), geolocation=(), microphone=(), payment=(), usb=()')
}

async function writeStaticAsset(
  response: ServerResponse,
  path: string,
  contentType: string,
  maximumBytes: number,
): Promise<void> {
  const noFollow = constants.O_NOFOLLOW ?? 0
  let handle
  try {
    handle = await open(path, constants.O_RDONLY | noFollow)
  }
  catch {
    throw new BrokerHttpError(404, 'web_asset_not_found', 'Web asset is not available')
  }
  try {
    const before = await handle.stat({ bigint: true })
    if (!before.isFile())
      throw new BrokerHttpError(404, 'web_asset_not_found', 'Web asset is not available')
    if (before.size > BigInt(maximumBytes))
      throw new BrokerHttpError(500, 'web_asset_too_large', 'Web asset exceeds its configured package bound')
    const buffer = Buffer.alloc(Number(before.size) + 1)
    const { bytesRead } = await handle.read(buffer, 0, buffer.byteLength, 0)
    const after = await handle.stat({ bigint: true })
    if (bytesRead !== Number(before.size)
      || after.dev !== before.dev
      || after.ino !== before.ino
      || after.size !== before.size
      || after.mtimeNs !== before.mtimeNs) {
      throw new BrokerHttpError(500, 'web_asset_changed', 'Web asset changed while it was being served')
    }
    const content = buffer.subarray(0, bytesRead)
    response.statusCode = 200
    response.setHeader('Content-Type', contentType)
    response.setHeader('Content-Length', content.byteLength)
    response.end(content)
  }
  finally {
    await handle.close()
  }
}

function requireExactOrigin(request: IncomingMessage, expected: string): void {
  if (request.headers.origin !== expected)
    throw new BrokerHttpError(403, 'web_origin_required', 'Web bootstrap requires the exact Broker origin')
}

function requireMethod(request: IncomingMessage, expected: 'GET' | 'POST'): void {
  if (request.method !== expected)
    throw new BrokerHttpError(405, 'web_method_not_allowed', `Web route requires ${expected}`)
}

function requireExactQuery(url: URL, names: string[]): void {
  const actual = [...new Set(url.searchParams.keys())].sort()
  const expected = [...names].sort()
  if (actual.join(',') !== expected.join(','))
    throw new BrokerHttpError(400, 'web_query_invalid', 'Web query parameters do not match the route contract')
  for (const name of actual) {
    if (url.searchParams.getAll(name).length !== 1)
      throw new BrokerHttpError(400, 'web_query_invalid', 'Web query parameters must not be repeated')
  }
}

function requireAllowedQuery(url: URL, allowedNames: string[], requiredNames: string[]): void {
  const actual = [...new Set(url.searchParams.keys())].sort()
  const allowed = new Set(allowedNames)
  if (actual.some(name => !allowed.has(name)) || requiredNames.some(name => !actual.includes(name)))
    throw new BrokerHttpError(400, 'web_query_invalid', 'Web query parameters do not match the route contract')
  for (const name of actual) {
    if (url.searchParams.getAll(name).length !== 1)
      throw new BrokerHttpError(400, 'web_query_invalid', 'Web query parameters must not be repeated')
  }
}

function requiredBoundedQuery(url: URL, name: string, maximumCodePoints: number): string {
  const value = url.searchParams.get(name)
  if (!value || value.trim() !== value || [...value].length > maximumCodePoints || /[\0\r\n]/u.test(value))
    throw new BrokerHttpError(400, 'web_query_invalid', `Web query ${name} is invalid`)
  return value
}

function requiredProjectPathQuery(url: URL, name: string, maximumCodePoints: number): string {
  const value = requiredBoundedQuery(url, name, maximumCodePoints)
  const segments = value.split('/')
  if (value.startsWith('/')
    || value.includes('\\')
    || segments.some(segment => !segment || segment === '.' || segment === '..')) {
    throw new BrokerHttpError(400, 'web_query_invalid', `Web query ${name} must be a safe project-relative path`)
  }
  return value
}

function requiredOpaqueLookupQuery(url: URL, name: string): string {
  const value = requiredBoundedQuery(url, name, 64)
  if (!/^[a-f0-9]{64}$/u.test(value))
    throw new BrokerHttpError(400, 'web_query_invalid', `${name} must be one exact opaque lookup identity`)
  return value
}

function boundedIntegerQuery(url: URL, name: string, minimum: number, maximum: number, fallback: number): number {
  const value = url.searchParams.get(name)
  if (value === null)
    return fallback
  if (!/^[1-9]\d*$/u.test(value))
    throw new BrokerHttpError(400, 'web_query_invalid', `Web query ${name} is invalid`)
  const parsed = Number(value)
  if (!Number.isSafeInteger(parsed) || parsed < minimum || parsed > maximum)
    throw new BrokerHttpError(400, 'web_query_invalid', `Web query ${name} must be from ${minimum} through ${maximum}`)
  return parsed
}

function safeCachedSnapshot(
  sessions: BrokerProjectSessions,
  projectId: string,
  webToken: string,
) {
  try {
    return sessions.cachedWebSnapshot(projectId, webToken)
  }
  catch {
    return null
  }
}

export function createBrokerStatusResponse(
  record: BrokerDiscoveryRecord,
  availableSessions: BrokerProjectSessionPublic[],
): BrokerStatusResponse {
  const broker = publicBrokerIdentity(record)
  const sessions: BrokerProjectSessionPublic[] = []
  for (const session of availableSessions) {
    const candidate: BrokerStatusResponse = {
      ok: true,
      broker,
      sessionCount: availableSessions.length,
      sessions: [...sessions, session],
      sessionsTruncated: true,
    }
    if (brokerJsonResponseBytes(candidate) > BROKER_MAX_JSON_RESPONSE_BYTES)
      break
    sessions.push(session)
  }
  let response: BrokerStatusResponse = {
    ok: true,
    broker,
    sessionCount: availableSessions.length,
    sessions,
    sessionsTruncated: sessions.length < availableSessions.length,
  }
  while (brokerJsonResponseBytes(response) > BROKER_MAX_JSON_RESPONSE_BYTES && sessions.length > 0) {
    sessions.pop()
    response = {
      ...response,
      sessions: [...sessions],
      sessionsTruncated: sessions.length < availableSessions.length,
    }
  }
  return response
}

export function encodeBrokerJsonResponse(value: unknown): Buffer {
  const content = Buffer.from(`${JSON.stringify(value)}\n`)
  if (content.byteLength > BROKER_MAX_JSON_RESPONSE_BYTES) {
    throw new BrokerError(
      'broker_response_too_large',
      `Broker JSON response exceeds ${BROKER_MAX_JSON_RESPONSE_BYTES} bytes`,
    )
  }
  return content
}

function brokerJsonResponseBytes(value: unknown): number {
  return Buffer.byteLength(`${JSON.stringify(value)}\n`)
}

async function closeHttpServer(server: ReturnType<typeof createServer>): Promise<void> {
  if (!server.listening)
    return
  await new Promise<void>((resolve, reject) => {
    server.close(error => error ? reject(error) : resolve())
    server.closeIdleConnections()
    server.closeAllConnections()
  })
}

function isObject(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
