import { afterEach, describe, expect, it, vi } from 'vitest'
import { checkForUpdates } from '../../../src/core/update-check.js'

afterEach(() => vi.unstubAllGlobals())

describe('explicit stable update notices', () => {
  it('reports only a newer stable version without an upgrade effect', async () => {
    const current = '3.3.0'
    const next = `${Number(current.split('.')[0]) + 1}.0.0`
    const fetchMetadata = vi.fn().mockResolvedValue(new Response(JSON.stringify({ latest: next })))
    vi.stubGlobal('fetch', fetchMetadata)
    expect(await checkForUpdates('3.3.0')).toEqual({ status: 'available', current, latest: next })
    expect(fetchMetadata).toHaveBeenCalledWith('https://registry.npmjs.org/-/package/@oevery%2Frsp/dist-tags', expect.objectContaining({ signal: expect.any(AbortSignal), redirect: 'error' }))
    fetchMetadata.mockImplementation(async () => new Response(JSON.stringify({ latest: current })))
    expect((await checkForUpdates('3.3.0')).status).toBe('current')
    expect((await checkForUpdates('3.3.0+build-1')).status).toBe('current')
    expect((await checkForUpdates('3.3.0-beta.1+build-1')).status).toBe('available')
    fetchMetadata.mockResolvedValue(new Response(JSON.stringify({ latest: '0.0.1' })))
    expect((await checkForUpdates('3.3.0')).status).toBe('current')
  })

  it('keeps offline, timeout and invalid metadata informational', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new DOMException('offline timeout', 'TimeoutError')))
    expect((await checkForUpdates('3.3.0')).status).toBe('unavailable')
    for (const body of ['invalid', '{}', '{"latest":"latest"}', '{"latest":"99.0.0-beta.1"}', 'x'.repeat(16385)]) {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(body)))
      expect((await checkForUpdates('3.3.0')).status).toBe('unavailable')
    }
  })
})
