import { execFile } from 'node:child_process'
import { createHash } from 'node:crypto'
import { cp, mkdir, mkdtemp, readdir, readFile, realpath, rm, symlink, writeFile } from 'node:fs/promises'
import { createServer } from 'node:http'
import { homedir, tmpdir } from 'node:os'
import { join, sep } from 'node:path'
import { promisify } from 'node:util'
import { expect, it } from 'vitest'
import { viewerRuntime } from '../../../src/viewer/runtime.js'
import { createViewerService, IDLE_MS, WORKSPACE_GRACE_MS } from '../../../src/viewer/service.js'

const execute = promisify(execFile)
it('isolates runtime installations/builds and rejects stale discovery without stopping an unrelated listener', async () => {
  const temporary = await realpath(await mkdtemp(join(tmpdir(), 'rsp-viewer-runtime-')))
  const installation = join(temporary, 'installation')
  const project = join(temporary, 'project')
  await mkdir(installation)
  await mkdir(join(project, '.rsp'), { recursive: true })
  await cp('dist', join(installation, 'dist'), { recursive: true })
  await cp('package.json', join(installation, 'package.json'))
  await symlink(join(process.cwd(), 'node_modules'), join(installation, 'node_modules'))
  await writeFile(join(project, '.rsp/architecture.json'), JSON.stringify({ schemaVersion: 1, nodes: [{ id: 'app', title: 'App', description: 'Runtime test' }], relations: [], views: [], bindings: [] }))
  const cli = join(installation, 'dist/cli.mjs')
  const run = async (...args: string[]) => (await execute(process.execPath, [cli, ...args], { cwd: project, timeout: 20_000 })).stdout.trim()
  const manifest = join(installation, 'dist/viewer-build.json')
  const original = await readFile(manifest, 'utf8')
  const asset = join(installation, 'dist/viewer/app.js')
  const originalAsset = await readFile(asset, 'utf8')
  let recordPath: string | undefined
  let stops = 0
  const foreign = createServer((request, response) => {
    if (request.url === '/control/stop')
      stops++
    response.end(JSON.stringify({ identity: 'foreign', protocol: 1 }))
  })
  await new Promise<void>(resolve => foreign.listen(0, '127.0.0.1', resolve))
  try {
    const urls = await Promise.all([run('view', '--no-open'), run('view', '--no-open')])
    expect(urls[0]).toBe(urls[1])
    const initial = JSON.parse(await run('view', 'status'))
    expect(initial.workspaces).toHaveLength(1)
    await writeFile(asset, `${originalAsset}\n// rebuilt installation\n`)
    const hash = createHash('sha256')
    for (const file of (await readdir(join(installation, 'dist'), { recursive: true })).map(file => file.split(sep).join('/')).sort()) {
      if (/\.(?:mjs|js|css)$/.test(file))
        hash.update(file).update(await readFile(join(installation, 'dist', file)))
    }
    await writeFile(manifest, JSON.stringify({ ...JSON.parse(original), identity: hash.digest('hex') }))
    await run('view', '--no-open')
    const rebuilt = JSON.parse(await run('view', 'status'))
    expect(rebuilt.runtime).not.toBe(initial.runtime)
    expect(rebuilt.port).not.toBe(initial.port)
    await run('view', 'stop')
    await writeFile(asset, originalAsset)
    await writeFile(manifest, original)
    expect(JSON.parse(await run('view', 'status')).pid).toBe(initial.pid)
    await run('view', 'stop')
    recordPath = join(homedir(), '.cache/rsp/viewer', `${initial.runtime}.json`)
    await writeFile(recordPath, JSON.stringify({ protocol: 1, identity: initial.runtime, port: (foreign.address() as { port: number }).port, pid: process.pid, adminToken: 'unrelated', readToken: 'unrelated' }), { mode: 0o600 })
    expect(await run('view', 'stop')).toContain('not running')
    expect(stops).toBe(0)
    await run('view', '--no-open')
    const recovered = JSON.parse(await run('view', 'status'))
    expect(recovered.port).not.toBe((foreign.address() as { port: number }).port)
    expect(foreign.listening).toBe(true)
    await run('view', 'stop')
    expect(stops).toBe(0)
  }
  finally {
    try {
      await run('view', 'stop')
    }
    catch {}
    await writeFile(asset, originalAsset)
    await writeFile(manifest, original)
    try {
      await run('view', 'stop')
    }
    catch {}
    await new Promise<void>(resolve => foreign.close(() => resolve()))
    if (recordPath)
      await rm(recordPath, { force: true })
    await rm(temporary, { recursive: true, force: true })
  }
}, 60_000)

it('releases inactive models, reconstructs them and closes its port at the controlled idle deadline', async () => {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'rsp-viewer-idle-')))
  await mkdir(join(root, '.rsp'))
  const file = join(root, '.rsp/architecture.json')
  const model = { schemaVersion: 1, nodes: [{ id: 'app', title: 'App', description: 'Before release' }], relations: [], views: [], bindings: [] }
  await writeFile(file, JSON.stringify(model))
  const service = await createViewerService({ ...await viewerRuntime(process.cwd()), adminToken: 'control', readToken: 'read' })
  const base = `http://127.0.0.1:${service.port}`
  const headers = { Authorization: 'Bearer control' }
  try {
    const registration = await (await fetch(`${base}/control/register`, { method: 'POST', headers, body: JSON.stringify({ root }) })).json()
    const now = Date.now()
    await service.sweep(now + WORKSPACE_GRACE_MS)
    const status = await (await fetch(`${base}/control/status`, { headers })).json()
    expect(status.workspaces[0].active).toBe(false)
    model.nodes[0]!.description = 'Reconstructed dirty source'
    await writeFile(file, JSON.stringify(model))
    const reopened = await (await fetch(`${base}/api/workspaces/${registration.workspace}/model`, { headers: { Authorization: 'Bearer read' } })).json()
    expect(reopened.architecture.nodes[0].description).toBe('Reconstructed dirty source')
    await service.sweep(service.activity.lastReading + IDLE_MS)
    await expect(fetch(`${base}/control/status`, { headers })).rejects.toThrow()
  }
  finally {
    await service.close()
    await rm(root, { recursive: true, force: true })
  }
})
