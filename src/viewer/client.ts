import { spawn } from 'node:child_process'
import { randomBytes } from 'node:crypto'
import { chmod, mkdir, readFile, realpath, rm, stat, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { setTimeout as delay } from 'node:timers/promises'
import { discoverService, serviceRequest, viewerRuntime } from './runtime.js'

async function startService() {
  const runtime = await viewerRuntime()
  await mkdir(runtime.directory, { recursive: true, mode: 0o700 })
  await chmod(runtime.directory, 0o700)
  for (let attempt = 0; attempt < 100; attempt++) {
    const existing = await discoverService(runtime.recordPath, runtime.identity)
    if (existing)
      return existing
    try {
      await mkdir(runtime.lockPath, { mode: 0o700 })
    }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST')
        throw error
      try {
        const pid = Number(await readFile(join(runtime.lockPath, 'pid'), 'utf8'))
        if (Number.isInteger(pid) && pid > 0) {
          try {
            process.kill(pid, 0)
          }
          catch (dead) {
            if ((dead as NodeJS.ErrnoException).code === 'ESRCH')
              await rm(runtime.lockPath, { recursive: true, force: true })
          }
        }
      }
      catch {
        // A starter can die between creating the directory and publishing its PID.
        try {
          if (Date.now() - (await stat(runtime.lockPath)).mtimeMs > 10_000)
            await rm(runtime.lockPath, { recursive: true, force: true })
        }
        catch { /* The lock was concurrently released. */ }
      }
      await delay(150)
      continue
    }
    try {
      await writeFile(join(runtime.lockPath, 'pid'), String(process.pid), { mode: 0o600 })
      const current = await discoverService(runtime.recordPath, runtime.identity)
      if (current)
        return current
      const child = spawn(process.execPath, [join(runtime.root, 'dist/viewer-service.mjs')], { detached: true, stdio: 'ignore', env: { ...process.env, RSP_VIEWER_BOOT: JSON.stringify({ ...runtime, adminToken: randomBytes(32).toString('hex'), readToken: randomBytes(32).toString('hex') }) } })
      child.unref()
      let spawnError: Error | undefined
      child.on('error', (error) => {
        spawnError = error
      })
      for (let poll = 0; poll < 100; poll++) {
        if (spawnError)
          throw spawnError
        const record = await discoverService(runtime.recordPath, runtime.identity)
        if (record)
          return record
        await delay(100)
      }
      throw new Error('Viewer service did not become ready; rebuild this package and retry')
    }
    finally {
      await rm(runtime.lockPath, { recursive: true, force: true })
    }
  }
  throw new Error('Another viewer startup has not completed; retry after it exits')
}
export async function runView(action?: string, open = true) {
  if (action && !['status', 'stop'].includes(action))
    throw new Error('rsp view accepts only status, stop, or --no-open')
  const runtime = await viewerRuntime()
  if (action) {
    const service = await discoverService(runtime.recordPath, runtime.identity)
    if (!service) {
      console.log('Viewer service is not running for this runtime.')
      return
    }
    if (action === 'stop') {
      await serviceRequest(service, '/control/stop', {})
      for (let attempt = 0; attempt < 25 && await discoverService(runtime.recordPath, runtime.identity); attempt++)
        await delay(40)
      console.log('Viewer stopped; all workspaces in this runtime are disconnected.')
      return
    }
    const status = await serviceRequest(service, '/control/status')
    console.log(JSON.stringify({ runtime: runtime.identity, pid: status.pid, port: status.port, workspaces: status.workspaces }, null, 2))
    return
  }
  const service = await startService()
  const registered = await serviceRequest(service, '/control/register', { root: await realpath(process.cwd()) }, 30_000)
  const url = `http://127.0.0.1:${service.port}/?workspace=${registered.workspace}#token=${service.readToken}`
  console.log(url)
  if (open) {
    const command = process.platform === 'darwin' ? 'open' : process.platform === 'win32' ? 'explorer.exe' : 'xdg-open'
    const browser = spawn(command, [url], { detached: true, stdio: 'ignore' })
    browser.on('error', () => console.error('Could not open browser; use the printed URL.'))
    browser.unref()
  }
}
