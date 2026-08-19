import assert from 'node:assert/strict'
import test from 'node:test'
import { DeliveryClient } from '../src/delivery-client.mjs'

const externalBaseUrl = process.env.FIXTURE_EXTERNAL_BASE_URL
const externalToken = process.env.FIXTURE_EXTERNAL_TOKEN
const optedIn = process.env.RSP_FIXTURE_RUN_AUTHENTICATED_DELIVERY === '1'
const unavailableReason = !optedIn || !externalBaseUrl || !externalToken
  ? 'requires RSP_FIXTURE_RUN_AUTHENTICATED_DELIVERY=1, FIXTURE_EXTERNAL_BASE_URL, and FIXTURE_EXTERNAL_TOKEN'
  : false

function credentialFreeHttpUrl(value) {
  const url = new URL(value)
  assert.equal(['http:', 'https:'].includes(url.protocol), true)
  assert.equal(url.username, '')
  assert.equal(url.password, '')
  return url
}

test('uploads and completes media with an authenticated external account', { skip: unavailableReason }, async () => {
  const controlBase = credentialFreeHttpUrl(externalBaseUrl)
  assert.equal(controlBase.protocol, 'https:')
  const controlUrl = path => new URL(path, `${controlBase.href.replace(/\/$/, '')}/`)
  const controlFetch = async (url, init = {}) => {
    const target = credentialFreeHttpUrl(url)
    assert.equal(target.origin, controlBase.origin)
    const response = await fetch(target, {
      ...init,
      headers: {
        ...init.headers,
        authorization: `Bearer ${externalToken}`,
      },
      redirect: 'error',
      signal: AbortSignal.timeout(15_000),
    })
    const finalUrl = credentialFreeHttpUrl(response.url)
    assert.equal(finalUrl.origin, controlBase.origin)
    return response
  }
  const controlPlane = {
    async complete(objectId) {
      const response = await controlFetch(
        controlUrl(`objects/${encodeURIComponent(objectId)}/complete`),
        { method: 'POST' },
      )
      assert.equal(response.ok, true)
      return response.json()
    },
    async createIntent(request) {
      const response = await controlFetch(controlUrl('intents'), {
        body: JSON.stringify({ mediaType: request.mediaType }),
        headers: { 'content-type': 'application/json' },
        method: 'POST',
      })
      assert.equal(response.ok, true)
      return response.json()
    },
  }
  const uploader = {
    async upload({ body, headers, url }) {
      const uploadUrl = credentialFreeHttpUrl(url)
      const response = await fetch(uploadUrl, {
        body,
        headers,
        method: 'PUT',
        redirect: 'error',
        signal: AbortSignal.timeout(15_000),
      })
      assert.equal(response.ok, true)
      credentialFreeHttpUrl(response.url)
    },
  }
  const client = new DeliveryClient({ controlPlane, uploader })

  const result = await client.deliver({
    body: new Uint8Array([1, 2, 3]),
    mediaType: 'audio/mpeg',
  })

  assert.equal(result.state, 'ready')
  assert.equal(typeof result.objectId, 'string')
  assert.ok(result.objectId.length > 0)
})
