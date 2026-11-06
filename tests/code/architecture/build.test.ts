import { spawn, spawnSync } from 'node:child_process'
import { cp, mkdir, mkdtemp, readFile, realpath, rm, symlink, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { setTimeout } from 'node:timers/promises'
import { expect, it } from 'vitest'
import { snapshotViewerRuntime, viewerRuntime } from '../../../src/viewer/runtime.js'

async function eventually<T>(read: () => Promise<T | undefined>, timeout = 15000): Promise<T> {
  const deadline = Date.now() + timeout
  while (Date.now() < deadline) {
    const value = await read().catch(() => undefined)
    if (value !== undefined)
      return value
    await setTimeout(50)
  }
  throw new Error('Development build did not publish the expected complete runtime')
}

it('rebuilds web, CSS and service inputs together, invalidates failed builds and recovers while watching', async () => {
  const root = await realpath(await mkdtemp(join(tmpdir(), 'rsp-development-build-')))
  await Promise.all(['src', 'scripts', 'tsup.config.ts', 'tsconfig.json', 'package.json'].map(path => cp(path, join(root, path), { recursive: true })))
  await mkdir(join(root, 'docs/site/public'), { recursive: true })
  await cp('docs/site/public/rsp-icon.svg', join(root, 'docs/site/public/rsp-icon.svg'))
  await symlink(join(process.cwd(), 'node_modules'), join(root, 'node_modules'))
  const child = spawn('pnpm', ['run', 'dev'], { cwd: root, stdio: 'pipe', detached: process.platform !== 'win32' })
  let output = ''
  child.stdout.on('data', chunk => output += chunk)
  child.stderr.on('data', chunk => output += chunk)
  const exited = new Promise<void>(resolve => child.once('exit', () => resolve()))
  const stop = async () => {
    if (child.exitCode === null && child.signalCode === null && child.pid) {
      if (process.platform === 'win32')
        child.kill('SIGTERM')
      else
        process.kill(-child.pid, 'SIGTERM')
    }
    await exited
  }
  const manifestPath = join(root, 'dist/viewer-build.json')
  const manifest = async () => JSON.parse(await readFile(manifestPath, 'utf8')) as { identity: string, assets: string[] }
  const complete = async (previous?: string) => {
    const next = await manifest()
    if (next.identity === previous)
      return undefined
    const runtime = await viewerRuntime(root)
    await snapshotViewerRuntime(root, runtime.identity)
    return next
  }
  try {
    const first = await eventually(() => complete())
    expect(first.assets.some(path => path.startsWith('chunks/'))).toBe(true)
    const app = join(root, 'src/viewer/web/app.tsx')
    const original = await readFile(app, 'utf8')
    const changed = `${original}\nconsole.info('watch-frontend-update')\n`
    await writeFile(app, changed)
    const second = await eventually(() => complete(first.identity))
    expect(await readFile(join(root, 'dist/viewer/app.js'), 'utf8')).toContain('watch-frontend-update')
    const service = join(root, 'src/viewer/service.ts')
    const style = join(root, 'src/viewer/web/style.css')
    await writeFile(service, `${await readFile(service, 'utf8')}\nconsole.info('watch-service-update')\n`)
    await writeFile(style, `${await readFile(style, 'utf8')}\n.watch-test { color: #123456 }\n`)
    const third = await eventually(async () => {
      const next = await complete(second.identity)
      return next && (await readFile(join(root, 'dist/viewer-service.mjs'), 'utf8')).includes('watch-service-update')
        && (await readFile(join(root, 'dist/viewer/app.css'), 'utf8')).includes('.watch-test')
        ? next
        : undefined
    })
    output = ''
    await writeFile(app, 'this is not valid TypeScript !')
    await eventually(async () => output.includes('RSP build failed') ? true : undefined)
    await expect(readFile(manifestPath)).rejects.toMatchObject({ code: 'ENOENT' })
    expect(child.exitCode).toBeNull()
    await writeFile(app, changed)
    const recovered = await eventually(() => complete())
    expect(recovered.identity).toBe(third.identity)

    // The watcher must invalidate even when its child cannot parse its entry point.
    const entry = join(root, 'scripts/build.mjs')
    const originalEntry = await readFile(entry, 'utf8')
    output = ''
    await writeFile(entry, 'export const broken = ;')
    await eventually(async () => output.includes('SyntaxError') ? true : undefined)
    await expect(readFile(manifestPath)).rejects.toMatchObject({ code: 'ENOENT' })
    expect(child.exitCode).toBeNull()
    await writeFile(entry, originalEntry)
    await eventually(() => complete())

    // Exercise the build entry itself without the watcher's invalidation guard.
    await stop()
    const module = join(root, 'scripts/build-viewer.mjs')
    const originalModule = await readFile(module, 'utf8')
    await writeFile(module, 'export const broken = ;')
    const failed = spawnSync(process.execPath, ['scripts/build.mjs'], { cwd: root, encoding: 'utf8', timeout: 15000 })
    expect(failed.status, failed.stderr).toBe(1)
    await expect(readFile(manifestPath)).rejects.toMatchObject({ code: 'ENOENT' })
    await writeFile(module, originalModule)
    const rebuilt = spawnSync(process.execPath, ['scripts/build.mjs'], { cwd: root, encoding: 'utf8', timeout: 15000 })
    expect(rebuilt.status, rebuilt.stderr).toBe(0)
    await eventually(() => complete())
  }
  catch (error) {
    throw new Error(`${(error as Error).message}\n${output.slice(-8000)}`, { cause: error })
  }
  finally {
    await stop()
    await rm(root, { recursive: true, force: true })
  }
}, 90000)
