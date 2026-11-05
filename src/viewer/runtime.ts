import { createHash } from 'node:crypto'
import { readdir, readFile, realpath } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join, sep } from 'node:path'
import { PKG_ROOT } from '../core/config.js'

export const VIEWER_PROTOCOL = 1
export interface ServiceRecord { protocol: number, identity: string, port: number, pid: number, adminToken: string, readToken: string }
export async function viewerRuntime(installation = PKG_ROOT) {
  const root = await realpath(installation)
  const { version } = JSON.parse(await readFile(join(root, 'package.json'), 'utf8')) as { version: string }
  const build = (await readFile(join(root, 'dist/viewer-build.json'), 'utf8')).trim()
  const identity = createHash('sha256').update(JSON.stringify({ root, version, build, protocol: VIEWER_PROTOCOL })).digest('hex')
  const directory = join(homedir(), '.cache', 'rsp', 'viewer')
  return { root, version, build, identity, directory, recordPath: join(directory, `${identity}.json`), lockPath: join(directory, `${identity}.lock`) }
}

export async function snapshotViewerRuntime(root: string, identity: string) {
  const runtime = await viewerRuntime(root)
  if (runtime.identity !== identity)
    throw new Error('Viewer build changed during startup; retry')
  const hash = createHash('sha256')
  const assets = new Map<string, Awaited<ReturnType<typeof readFile>>>()
  // Match the package build digest while retaining only assets actually served.
  for (const file of (await readdir(join(root, 'dist'), { recursive: true })).map(file => file.split(sep).join('/')).sort()) {
    if (!/\.(?:mjs|js|css)$/.test(file))
      continue
    const content = await readFile(join(root, 'dist', file))
    hash.update(file).update(content)
    if (file === 'viewer/app.js' || file === 'viewer/app.css' || file === 'viewer/mermaid.js')
      assets.set(`/${file.slice('viewer/'.length)}`, content)
  }
  if (hash.digest('hex') !== JSON.parse(runtime.build).identity
    || assets.size !== 3
    || (await viewerRuntime(root)).identity !== identity) {
    throw new Error('Viewer assets do not match the startup build; rebuild or reinstall and retry')
  }
  return { version: runtime.version, assets }
}
export async function serviceRequest(record: ServiceRecord, path: string, body?: unknown, timeoutMs = 2500) {
  const response = await fetch(`http://127.0.0.1:${record.port}${path}`, { method: body === undefined ? 'GET' : 'POST', headers: { Authorization: `Bearer ${record.adminToken}`, ...(body === undefined ? {} : { 'Content-Type': 'application/json' }) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }), signal: AbortSignal.timeout(timeoutMs) })
  if (!response.ok)
    throw new Error(await response.text())
  const result = await response.json()
  if (result.identity !== record.identity || result.protocol !== VIEWER_PROTOCOL)
    throw new Error('Viewer identity/protocol mismatch')
  return result
}
export async function discoverService(path: string, identity: string): Promise<ServiceRecord | null> {
  try {
    const record = JSON.parse(await readFile(path, 'utf8')) as ServiceRecord
    if (record.identity !== identity || record.protocol !== VIEWER_PROTOCOL || !Number.isInteger(record.port) || record.port < 1 || record.port > 65535 || typeof record.adminToken !== 'string')
      return null
    await serviceRequest(record, '/control/status')
    return record
  }
  catch { return null }
}
