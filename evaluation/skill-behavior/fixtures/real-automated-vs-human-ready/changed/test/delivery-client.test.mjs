import assert from 'node:assert/strict'
import test from 'node:test'
import { DeliveryClient } from '../src/delivery-client.mjs'

test('projects the intent into a credential-free data-plane request', async () => {
  const uploads = []
  const completions = []
  const client = new DeliveryClient({
    controlPlane: {
      complete: async (...args) => { completions.push(args); return { state: 'ready' } },
      createIntent: async () => ({
        controlCredential: 'must-not-cross-boundary',
        objectId: 'object-1',
        uploadHeaders: { 'content-type': 'audio/mpeg' },
        uploadUrl: 'https://uploads.invalid/object-1',
        workspaceMetadata: { workspaceId: 'workspace-a' },
      }),
    },
    uploader: { upload: async value => uploads.push(value) },
  })
  const body = new Uint8Array([1, 2, 3])

  const result = await client.deliver({ body, mediaType: 'audio/mpeg' })

  assert.deepEqual(Object.keys(uploads[0]).sort(), ['body', 'headers', 'url'])
  assert.equal(uploads[0].body, body)
  assert.equal(completions[0][0], 'object-1')
  assert.deepEqual(result, { state: 'ready' })
})

test('does not complete when upload fails', async () => {
  let completed = false
  const client = new DeliveryClient({
    controlPlane: {
      complete: async () => { completed = true },
      createIntent: async () => ({ objectId: 'object-1', uploadHeaders: {}, uploadUrl: 'https://uploads.invalid/object-1' }),
    },
    uploader: { upload: async () => { throw new Error('offline') } },
  })

  await assert.rejects(client.deliver({ body: new Uint8Array() }), /offline/)
  assert.equal(completed, false)
})
