import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { setTimeout as realSetTimeout } from 'node:timers/promises'
import { expect, it, vi } from 'vitest'
import { runProcess } from '../../skills/runner/adapters/process.mjs'
import { loadCase } from '../../skills/runner/core/cases.mjs'
import { runCase } from '../../skills/runner/core/execute.mjs'

it('retains timeout and malformed evidence as inconclusive, and unauthorized writes as failures', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'rsp-failure-test-'))
  const entry = loadCase(process.cwd(), 'preserve-user-files')
  try {
    const timeout = await runProcess(process.execPath, ['-e', 'setInterval(() => {}, 1000)'], { cwd: directory, env: {}, input: '', timeoutMs: 50 })
    expect(timeout.timedOut).toBe(true)
    expect(timeout.timeoutMs).toBe(50)
    for (const mode of ['timeout', 'cancelled', 'malformed', 'unauthorized']) {
      const result = await runCase(entry, process.cwd(), { outputRoot: directory, adapter: {
        id: 'local-test',
        settings: { model: 'none' },
        async run({ workspace }) {
          writeFileSync(join(workspace, 'src/requested.mjs'), 'export const requested = true')
          if (mode === 'unauthorized')
            writeFileSync(join(workspace, 'user-notes.txt'), 'lost')
          return { exitCode: 0, timedOut: mode === 'timeout', cancelled: mode === 'cancelled', cancellationReason: mode === 'cancelled' ? 'SIGINT' : null, stdout: mode === 'malformed' ? 'not-json' : JSON.stringify({ type: 'turn.completed' }), stderr: '', finalOutput: 'done' }
        },
      } })
      expect(result.verdict.status).toBe(mode === 'unauthorized' ? 'failed' : 'inconclusive')
      if (mode === 'cancelled') {
        expect(result).toMatchObject({ timeoutMs: null, cancelled: true, cancellationReason: 'SIGINT', verdict: { reason: 'execution-cancelled' } })
        expect(result.observation.changedPaths).toContain('src/requested.mjs')
        expect(JSON.parse(readFileSync(join(result.reportDirectory, 'run.json'))).result.exitCode).toBe(0)
      }
    }
  }
  finally { rmSync(directory, { recursive: true, force: true }) }
})

it.skipIf(process.platform === 'win32')('has no default deadline, retains output on cancellation and rejects overflowing timers', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'rsp-no-deadline-'))
  const ready = join(directory, 'ready')
  const controller = new AbortController()
  let pending
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  try {
    for (const timeoutMs of [0, -1, 1.5, 2147483648, Number.MAX_SAFE_INTEGER])
      expect(() => runProcess(process.execPath, [], { cwd: directory, timeoutMs })).toThrow('Timeout must be')
    const script = `
      const fs = require('node:fs')
      process.on('SIGTERM', () => process.exit(0))
      console.log('retained output')
      fs.writeFileSync(${JSON.stringify(ready)}, 'ready')
      setInterval(() => {}, 1000)
    `
    pending = runProcess(process.execPath, ['-e', script], { cwd: directory, env: {}, input: '', signal: controller.signal })
    const limit = Date.now() + 3000
    while (!existsSync(ready) && Date.now() < limit)
      await realSetTimeout(10)
    expect(existsSync(ready)).toBe(true)
    await vi.advanceTimersByTimeAsync(600001)
    controller.abort('SIGINT')
    const result = await pending
    expect(result).toMatchObject({ exitCode: 0, timeoutMs: null, timedOut: false, cancelled: true, cancellationReason: 'SIGINT', stdout: 'retained output\n' })
    expect(vi.getTimerCount()).toBe(0)
  }
  finally {
    controller.abort('cleanup')
    await vi.advanceTimersByTimeAsync(250)
    await pending
    vi.useRealTimers()
    rmSync(directory, { recursive: true, force: true })
  }
}, 5000)

it('stops before executor entry when already cancelled while saving workspace observations', async () => {
  const directory = mkdtempSync(join(tmpdir(), 'rsp-cancel-boundary-'))
  const controller = new AbortController()
  controller.abort('SIGTERM')
  const adapter = { id: 'local-test', settings: {}, run: vi.fn() }
  try {
    const run = await runCase(loadCase(process.cwd(), 'preserve-user-files'), process.cwd(), { outputRoot: directory, adapter, signal: controller.signal })
    expect(adapter.run).not.toHaveBeenCalled()
    expect(run).toMatchObject({ cancelled: true, cancellationReason: 'SIGTERM', verdict: { status: 'inconclusive' } })
    expect(run.observation).toBeDefined()
    expect(existsSync(join(run.reportDirectory, 'events.jsonl'))).toBe(true)
  }
  finally { rmSync(directory, { recursive: true, force: true }) }
})
