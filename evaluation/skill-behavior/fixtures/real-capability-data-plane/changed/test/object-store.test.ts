import { describe, expect, it, vi } from 'vitest'
import { uploadBytes } from '../src/object-store'

describe('uploadBytes', () => {
  it('sends the prepared target and bytes', async () => {
    const send = vi.fn().mockResolvedValue(undefined)
    const completeUpload = vi.fn().mockResolvedValue(undefined)
    const prepareUpload = vi.fn().mockResolvedValue({
      url: 'https://storage.example.invalid/upload',
      headers: { 'content-type': 'application/octet-stream' },
      workspaceId: 'workspace-a',
      completionToken: 'opaque-completion-token',
      auditContext: { operation: 'lesson-audio' },
    })

    await uploadBytes(
      { prepareUpload, completeUpload },
      { send },
      'clip.bin',
      new Uint8Array([1, 2, 3]),
    )

    expect(send).toHaveBeenCalledWith(expect.objectContaining({
      url: 'https://storage.example.invalid/upload',
      bytes: new Uint8Array([1, 2, 3]),
    }))
    expect(completeUpload).toHaveBeenCalledWith({ completionToken: 'opaque-completion-token' })
  })
})
