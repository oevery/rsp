import { createHash } from 'node:crypto'
import { mkdir, mkdtemp, readdir, readFile, rm, symlink, writeFile } from 'node:fs/promises'
import { get } from 'node:http'
import { tmpdir } from 'node:os'
import { join, sep } from 'node:path'
import { afterEach, expect, it } from 'vitest'
import { viewerRuntime } from '../../../src/viewer/runtime.js'
import { createViewerService } from '../../../src/viewer/service.js'

const roots: string[] = []
const services: Awaited<ReturnType<typeof createViewerService>>[] = []
const assets = ['app.js', 'app.css', 'mermaid.js', 'chunks/diagram.js', 'chunks/diagram.css']

async function publish(root: string, paths = assets) {
  const hash = createHash('sha256')
  for (const file of (await readdir(join(root, 'dist'), { recursive: true })).map(file => file.split(sep).join('/')).sort()) {
    if (/\.(?:mjs|js|css)$/.test(file))
      hash.update(file).update(await readFile(join(root, 'dist', file)))
  }
  await writeFile(join(root, 'dist/viewer-build.json'), JSON.stringify({ identity: hash.digest('hex'), assets: paths }))
}

async function installation() {
  const root = await mkdtemp(join(tmpdir(), 'rsp-viewer-assets-'))
  roots.push(root)
  await mkdir(join(root, 'dist/viewer/chunks'), { recursive: true })
  await writeFile(join(root, 'package.json'), JSON.stringify({ version: '4.1.0' }))
  for (const asset of assets)
    await writeFile(join(root, 'dist/viewer', asset), asset.endsWith('.css') ? '.diagram { color: green }' : `export const resource = ${JSON.stringify(asset)}`)
  await writeFile(join(root, 'dist/viewer/chunks/unlisted.js'), 'not public')
  await writeFile(join(root, 'dist/cli.mjs'), 'not a browser resource')
  await publish(root)
  return root
}

async function start(root: string) {
  const service = await createViewerService({ ...await viewerRuntime(root), adminToken: 'control', readToken: 'read' })
  services.push(service)
  return `http://127.0.0.1:${service.port}`
}

afterEach(async () => {
  await Promise.all(services.splice(0).map(service => service.close()))
  await Promise.all(roots.splice(0).map(root => rm(root, { recursive: true, force: true })))
})

it('serves only declared browser chunks and pins their startup bytes behind local-origin checks', async () => {
  const root = await installation()
  const base = await start(root)
  const chunk = 'chunks/diagram.js'
  const original = await readFile(join(root, 'dist/viewer', chunk), 'utf8')
  const response = await fetch(`${base}/${chunk}`)
  expect(response.status).toBe(200)
  expect(response.headers.get('content-type')).toContain('javascript')
  expect(await response.text()).toBe(original)
  expect((await fetch(`${base}/chunks/diagram.css`)).headers.get('content-type')).toContain('text/css')
  expect(await (await fetch(`${base}/${chunk}`, { method: 'HEAD' })).text()).toBe('')
  expect((await fetch(`${base}/${chunk}`, { headers: { Origin: 'https://outside.invalid' } })).status).toBe(403)
  const foreignHost = await new Promise<number | undefined>((resolve, reject) => {
    get(`${base}/${chunk}`, { headers: { Host: 'outside.invalid' } }, (response) => {
      response.resume()
      resolve(response.statusCode)
    }).on('error', reject)
  })
  expect(foreignHost).toBe(403)
  for (const path of ['chunks/unlisted.js', 'cli.mjs', 'viewer-build.json', 'chunks/%2e%2e%2fcli.mjs']) {
    expect((await fetch(`${base}/${path}`, { headers: { Authorization: 'Bearer read' } })).status).toBe(404)
  }
  await writeFile(join(root, 'dist/viewer', chunk), 'replacement')
  expect(await (await fetch(`${base}/${chunk}`)).text()).toBe(original)
  await expect(start(root)).rejects.toThrow('assets do not match')
  await publish(root)
  const rebuilt = await start(root)
  expect(await (await fetch(`${rebuilt}/${chunk}`)).text()).toBe('replacement')
  expect(await (await fetch(`${base}/${chunk}`)).text()).toBe(original)
})

it('rejects unsafe, incomplete and symlinked asset manifests before listening', async () => {
  const root = await installation()
  for (const paths of [
    assets.filter(path => path !== 'app.css'),
    [...assets, 'app.js'],
    [...assets, '../cli.mjs'],
    [...assets, '/app.js'],
    [...assets, 'chunks/../app.js'],
    [...assets, 'chunks/%2e%2e/app.js'],
    [...assets, 'NOTICE.txt'],
    [...assets, 'chunks/missing.js'],
  ]) {
    await publish(root, paths)
    await expect(start(root)).rejects.toThrow('assets do not match')
  }
  await publish(root)
  await rm(join(root, 'dist/viewer/chunks/diagram.js'))
  await expect(start(root)).rejects.toThrow('assets do not match')
  await symlink(join(root, 'dist/cli.mjs'), join(root, 'dist/viewer/chunks/diagram.js'))
  await publish(root)
  await expect(start(root)).rejects.toThrow('assets do not match')
})
