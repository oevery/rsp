import { describe, expect, it, vi } from 'vitest'
import { publishAsset } from '../src/publish'

describe('publishAsset', () => {
  it('returns provider-failed for an ordinary provider error', async () => {
    const client = {
      upload: vi.fn().mockRejectedValue(new Error('service-unavailable')),
    }

    await expect(publishAsset(client, new Uint8Array([9]))).resolves.toEqual({
      ok: false,
      error: 'provider-failed',
    })
  })
})
