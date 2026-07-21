import { describe, expect, it, vi } from 'vitest'
import { publish } from '../src/publish'

describe('publish', () => {
  it('passes the caller signal to the transfer', async () => {
    const controller = new AbortController()
    const provider = {
      getCredential: vi.fn().mockResolvedValue('temporary-credential'),
      createIntent: vi.fn().mockResolvedValue({ uploadId: 'upload-1' }),
      transfer: vi.fn().mockResolvedValue(undefined),
      complete: vi.fn().mockResolvedValue(undefined),
    }

    await publish(provider, new Uint8Array([4, 5]), { signal: controller.signal })

    expect(provider.transfer).toHaveBeenCalledWith(
      'upload-1',
      new Uint8Array([4, 5]),
      { signal: controller.signal },
    )
  })
})
