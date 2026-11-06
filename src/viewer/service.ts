import type { Server } from 'node:http'
import type { ArchitectureResult } from '../architecture/model.js'
import type { ArchitecturePayload, DocumentPayload } from './protocol.js'
import { Buffer } from 'node:buffer'
import { timingSafeEqual } from 'node:crypto'
import { realpath, rm, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { digest, queryArchitecture } from '../architecture/model.js'
import { clearConfigCache } from '../core/config.js'
import { readProjectRuntime } from '../core/project-version.js'
import { viewerEntries } from './build-assets.mjs'
import { readAsset, renderDocument } from './documents.js'
import { layoutArchitecture } from './layout.js'
import { snapshotViewerRuntime, VIEWER_PROTOCOL, viewerRuntime } from './runtime.js'
import { describeWorkspace } from './workspaces.js'

export const IDLE_MS = 30 * 60 * 1000
export const WORKSPACE_GRACE_MS = 5 * 60 * 1000
export class ReadingActivity {
  lastReading: number
  readonly workspaces = new Map<string, number>()
  constructor(now: number) {
    this.lastReading = now
  }

  heartbeat(id: string, now: number) {
    this.lastReading = now
    this.workspaces.set(id, now)
  }

  expired(now: number) {
    return now - this.lastReading >= IDLE_MS
  }

  inactive(id: string, now: number) {
    return now - (this.workspaces.get(id) ?? 0) >= WORKSPACE_GRACE_MS
  }
}
interface Workspace {
  id: string
  root: string
  graphKey?: string
  layout?: Awaited<ReturnType<typeof layoutArchitecture>>
  focus?: { id: string, graphKey: string, pending: Promise<Awaited<ReturnType<typeof layoutArchitecture>>> }
  model?: ArchitectureResult
  pending?: Promise<unknown>
  error?: string
  layoutMs?: number
}
function authorized(actual: string | undefined, token: string) {
  const expected = Buffer.from(`Bearer ${token}`)
  const received = Buffer.from(actual ?? '')
  return received.length === expected.length && timingSafeEqual(received, expected)
}
export async function createViewerService(options: { identity: string, root: string, adminToken: string, readToken: string, recordPath?: string }) {
  const runtime = await snapshotViewerRuntime(options.root, options.identity)
  const workspaces = new Map<string, Workspace>()
  const activity = new ReadingActivity(Date.now())
  // Graphviz work is serialized across projects; duplicate requests share one task.
  let layoutQueue = Promise.resolve()
  let server: Server
  let closing = false
  let timer: ReturnType<typeof setInterval>
  async function close() {
    if (closing)
      return
    closing = true
    clearInterval(timer)
    workspaces.clear()
    server.closeAllConnections()
    await new Promise<void>(resolve => server.close(() => resolve()))
    if (options.recordPath)
      await rm(options.recordPath, { force: true })
  }
  async function validateRuntime(root: string) {
    const selected = await readProjectRuntime(root)
    if (selected.mode === 'package' && selected.version && selected.version !== runtime.version)
      throw new Error(`Workspace selects RSP ${selected.version}; open it using that runtime`)
  }
  async function load(workspace: Workspace) {
    if (workspace.pending)
      return workspace.pending
    workspace.pending = (async () => {
      try {
        await validateRuntime(workspace.root)
        clearConfigCache()
        const model = await queryArchitecture({ root: workspace.root })
        if (!model.configured)
          throw new Error('Architecture is not configured: .rsp/architecture.json')
        const graphKey = digest(JSON.stringify({ nodes: model.nodes.map(({ bindings, ...node }) => ({ ...node, bindings: bindings.map(({ anchor: _anchor, ...binding }) => binding) })), relations: model.relations, views: model.views }))
        if (workspace.graphKey !== graphKey || !workspace.layout) {
          const queued = layoutQueue.then(async () => {
            const started = performance.now()
            const layout = await layoutArchitecture(model, workspace.id)
            workspace.layoutMs = performance.now() - started
            workspace.layout = layout
            workspace.graphKey = graphKey
          })
          layoutQueue = queued.catch(() => {})
          await queued
        }
        workspace.model = model
        workspace.error = undefined
      }
      catch (error) {
        workspace.error = (error as Error).message
        throw error
      }
      finally {
        workspace.pending = undefined
      }
    })()
    return workspace.pending
  }
  server = createServer(async (request, response) => {
    const origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`
    const send = (status: number, type: string, value: string | Buffer) => {
      response.writeHead(status, { 'Content-Type': type, 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'no-referrer', 'Content-Security-Policy': 'default-src \'self\'; script-src \'self\'; style-src \'self\' \'unsafe-inline\'; font-src \'self\' data:; img-src \'self\' data: blob:; connect-src \'self\'; frame-ancestors \'none\'; object-src \'none\'; base-uri \'none\'' })
      response.end(request.method === 'HEAD' ? undefined : value)
    }
    const json = (value: unknown) => send(200, 'application/json; charset=utf-8', JSON.stringify(value))
    try {
      if (request.headers.host !== origin.slice(7) || (request.headers.origin && request.headers.origin !== origin)) {
        send(403, 'text/plain', 'Local origin only')
        return
      }
      const url = new URL(request.url!, origin)
      if (url.pathname.startsWith('/control/')) {
        if (!authorized(request.headers.authorization, options.adminToken)) {
          send(403, 'text/plain', 'Unauthorized registration/control')
          return
        }
        const base = { identity: options.identity, protocol: VIEWER_PROTOCOL }
        if (url.pathname === '/control/status' && request.method === 'GET') {
          json({ ...base, pid: process.pid, port: (server.address() as { port: number }).port, workspaces: [...workspaces.values()].map(workspace => ({ id: workspace.id, root: workspace.root, active: !!workspace.model, revision: workspace.model?.source.revision, error: workspace.error, layoutMs: workspace.layoutMs })) })
          return
        }
        if (request.method !== 'POST') {
          send(405, 'text/plain', 'POST required')
          return
        }
        if (url.pathname === '/control/stop') {
          json(base)
          setImmediate(() => void close())
          return
        }
        if (url.pathname === '/control/register') {
          let body = ''
          for await (const chunk of request) {
            body += chunk
            if (body.length > 16384)
              throw new Error('Registration request too large')
          }
          const root = await realpath(JSON.parse(body).root)
          await validateRuntime(root)
          const id = digest(root).slice(0, 24)
          const workspace = workspaces.get(id) ?? { id, root }
          workspaces.set(id, workspace)
          activity.heartbeat(id, Date.now())
          await load(workspace)
          json({ ...base, workspace: id })
          return
        }
        send(404, 'text/plain', 'Unknown control request')
        return
      }
      if (!['GET', 'HEAD'].includes(request.method ?? '')) {
        send(405, 'text/plain', 'Read-only')
        return
      }
      if (url.pathname === '/') {
        send(200, 'text/html; charset=utf-8', `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>RSP Architecture</title><link rel="stylesheet" href="/${viewerEntries.style}"></head><body><div id="root"></div><script type="module" src="/${viewerEntries.app}"></script></body></html>`)
        return
      }
      const asset = runtime.assets.get(url.pathname)
      if (asset) {
        send(200, asset.type, asset.content)
        return
      }
      if (!authorized(request.headers.authorization, options.readToken)) {
        send(403, 'text/plain', 'Unauthorized reading session')
        return
      }
      if (url.pathname === '/api/workspaces') {
        json(await Promise.all([...workspaces.values()].map(({ id, root }) => describeWorkspace({ id, root }))))
        return
      }
      const match = /^\/api\/workspaces\/([a-f0-9]{24})\/(model|heartbeat|document|asset)$/.exec(url.pathname)
      const workspace = match ? workspaces.get(match[1]!) : undefined
      if (!match || !workspace) {
        send(404, 'text/plain', 'Unknown workspace')
        return
      }
      const id = workspace.id
      if (match[2] === 'heartbeat') {
        activity.heartbeat(id, Date.now())
        json({ workspace: id })
        return
      }
      activity.heartbeat(id, Date.now())
      await load(workspace)
      if (match[2] === 'model') {
        const model = workspace.model!
        const graphRevision = workspace.graphKey!
        const focus = url.searchParams.get('focus')
        let layout = workspace.layout!
        if (focus) {
          if (!model.nodes.some(node => node.id === focus)) {
            json({ workspace: id, root: workspace.root, revision: model.source.revision, graphRevision, architecture: model, layout, missingFocus: focus, focus } satisfies ArchitecturePayload)
            return
          }
          if (workspace.focus?.id !== focus || workspace.focus.graphKey !== workspace.graphKey) {
            const pending = layoutQueue.then(() => layoutArchitecture(model, id, focus))
            layoutQueue = pending.then(() => {}, () => {})
            workspace.focus = { id: focus, graphKey: workspace.graphKey!, pending }
          }
          layout = await workspace.focus.pending
        }
        json({ workspace: id, root: workspace.root, revision: model.source.revision, graphRevision, architecture: model, layout, focus: focus ?? '' } satisfies ArchitecturePayload)
        return
      }
      const file = url.searchParams.get('file') ?? ''
      if (match[2] === 'document') {
        json({ workspace: id, ...await renderDocument(workspace.root, workspace.model!, file) } satisfies DocumentPayload)
        return
      }
      const image = await readAsset(workspace.root, workspace.model!, file)
      response.setHeader('ETag', `"${image.revision}"`)
      send(200, image.type, image.content)
    }
    catch (error) {
      send(409, 'text/plain; charset=utf-8', (error as Error).message)
    }
  })
  await new Promise<void>((resolve, reject) => {
    server.once('error', reject)
    server.listen(0, '127.0.0.1', resolve)
  })
  async function sweep(now = Date.now()) {
    if (activity.expired(now)) {
      await close()
      return
    }
    for (const workspace of workspaces.values()) {
      if (activity.inactive(workspace.id, now) && !workspace.pending) {
        workspace.model = undefined
        workspace.layout = undefined
        workspace.focus = undefined
        workspace.graphKey = undefined
      }
    }
  }
  timer = setInterval(() => void sweep(), 10_000)
  timer.unref()
  return { server, close, sweep, activity, port: (server.address() as { port: number }).port }
}

async function runServiceMain() {
  if (!process.env.RSP_VIEWER_BOOT)
    return
  const boot = JSON.parse(process.env.RSP_VIEWER_BOOT)
  delete process.env.RSP_VIEWER_BOOT
  const runtime = await viewerRuntime()
  if (runtime.identity !== boot.identity || runtime.root !== boot.root)
    throw new Error('Viewer build changed during startup; retry')
  const service = await createViewerService(boot)
  await writeFile(boot.recordPath, JSON.stringify({ protocol: VIEWER_PROTOCOL, identity: boot.identity, port: service.port, pid: process.pid, adminToken: boot.adminToken, readToken: boot.readToken }), { mode: 0o600 })
  for (const signal of ['SIGINT', 'SIGTERM'] as const) process.once(signal, () => void service.close())
}

void runServiceMain().catch(() => {
  process.exitCode = 1
})
