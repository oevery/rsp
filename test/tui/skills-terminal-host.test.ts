import type { PackagedSkillInventory } from '../../src/commands/skills.js'
import type { SkillsTuiRuntime } from '../../src/skills-tui/entry.js'
import { EventEmitter } from 'node:events'
import { Writable } from 'node:stream'
import { describe, expect, it, vi } from 'vitest'
import { runSkillsTui } from '../../src/skills-tui/entry.js'

const inventory: PackagedSkillInventory = {
  package: { name: '@oevery/rsp', version: '1.0.0' },
  target: '.agents/skills',
  skills: [],
}

function runtime(overrides: Partial<SkillsTuiRuntime> = {}) {
  const events = new EventEmitter()
  const output = new Writable({
    write(_chunk, _encoding, callback) {
      callback()
    },
  })
  const cleanup = vi.fn()
  const unmount = vi.fn()
  const reportError = vi.fn()
  const value: SkillsTuiRuntime = {
    inspect: vi.fn(async () => inventory),
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

describe('runSkillsTui host lifecycle', () => {
  it('returns cancellation and restores the terminal exactly once after normal exit', async () => {
    const host = runtime()
    await expect(runSkillsTui('en', host.value)).resolves.toEqual({ kind: 'cancelled' })
    expect(host.cleanup).toHaveBeenCalledTimes(1)
    expect(host.unmount).toHaveBeenCalledTimes(1)
    for (const signal of ['SIGHUP', 'SIGINT', 'SIGTERM'])
      expect(host.events.listenerCount(signal)).toBe(0)
  })

  it('returns an error and restores the terminal when inventory inspection fails', async () => {
    const host = runtime({ inspect: vi.fn(async () => {
      throw new Error('invalid inventory')
    }) })
    await expect(runSkillsTui('en', host.value)).resolves.toEqual({ kind: 'error' })
    expect(host.cleanup).toHaveBeenCalledTimes(1)
    expect(host.unmount).not.toHaveBeenCalled()
    expect(host.reportError).toHaveBeenCalledWith('  Error: invalid inventory')
  })
})
