import type { ProjectStatusSnapshot } from '../../src/status/model.js'
import type { TuiRuntime } from '../../src/tui/entry.js'
import { EventEmitter } from 'node:events'
import { Writable } from 'node:stream'
import { describe, expect, it, vi } from 'vitest'
import { runTui } from '../../src/tui/entry.js'

const emptySnapshot: ProjectStatusSnapshot = {
  focused: [],
  records: [],
  groups: [],
  plan: { nodes: [], ready: [], edges: [], blocked: [], waves: [] },
  archiveTrend: [],
  diagnostics: [],
  runtime: [],
}

function runtime(overrides: Partial<TuiRuntime> = {}) {
  const events = new EventEmitter()
  const output = new Writable({
    write(_chunk, _encoding, callback) {
      callback()
    },
  })
  const cleanup = vi.fn()
  const unmount = vi.fn()
  const reportError = vi.fn()
  const value: TuiRuntime = {
    inspect: vi.fn(async () => emptySnapshot),
    inspectHistory: vi.fn(async () => ({ records: [], summary: { matched: 0, returned: 0, hasMore: false } })),
    inspectHistoryDetail: vi.fn(async () => { throw new Error('no selected history record') }),
    render: vi.fn(() => ({ unmount, waitUntilExit: vi.fn(async () => {}) })),
    openSession: vi.fn(() => ({ cleanup })),
    host: {
      env: {},
      stdout: output,
      once: (signal, listener) => events.once(signal, listener),
      off: (signal, listener) => events.off(signal, listener),
      exit: vi.fn(((code?: number) => { throw new Error(`unexpected exit ${code}`) }) as never),
    },
    reportError,
    ...overrides,
  }
  return { value, events, cleanup, unmount, reportError }
}

describe('runTui host lifecycle', () => {
  it('removes every signal listener and cleans the terminal exactly once on normal exit', async () => {
    const host = runtime()
    expect(await runTui('en', host.value)).toBe(0)
    expect(host.cleanup).toHaveBeenCalledTimes(1)
    expect(host.unmount).toHaveBeenCalledTimes(1)
    expect(host.value.inspectHistory).not.toHaveBeenCalled()
    for (const signal of ['SIGHUP', 'SIGINT', 'SIGTERM'])
      expect(host.events.listenerCount(signal)).toBe(0)
  })

  it('cleans exactly once and returns one when initial inspection fails', async () => {
    const host = runtime({ inspect: vi.fn(async () => {
      throw new Error('inspection failed')
    }) })
    expect(await runTui('en', host.value)).toBe(1)
    expect(host.cleanup).toHaveBeenCalledTimes(1)
    expect(host.unmount).not.toHaveBeenCalled()
    expect(host.reportError).toHaveBeenCalledWith('  Error: inspection failed')
  })

  it('cleans exactly once and returns one when rendering fails', async () => {
    const host = runtime({ render: vi.fn(() => {
      throw new Error('render failed')
    }) })
    expect(await runTui('en', host.value)).toBe(1)
    expect(host.cleanup).toHaveBeenCalledTimes(1)
    expect(host.unmount).not.toHaveBeenCalled()
    expect(host.reportError).toHaveBeenCalledWith('  Error: render failed')
  })
})
