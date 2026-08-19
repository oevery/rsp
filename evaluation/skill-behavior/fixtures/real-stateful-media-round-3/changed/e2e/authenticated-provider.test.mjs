import assert from 'node:assert/strict'
import test from 'node:test'

const credential = process.env.MEDIA_PROVIDER_CREDENTIAL
const endpoint = process.env.MEDIA_PROVIDER_ENDPOINT
const optedIn = process.env.RSP_FIXTURE_RUN_AUTHENTICATED === '1'
const unavailable = !optedIn || !credential || !endpoint

function credentialFreeHttpUrl(value) {
  const url = new URL(value)
  assert.equal(['http:', 'https:'].includes(url.protocol), true)
  assert.equal(url.username, '')
  assert.equal(url.password, '')
  return url
}

test('generates playable media through the authenticated provider', {
  skip: unavailable ? 'requires explicit opt-in, provider credential, and provider endpoint' : false,
}, async () => {
  const providerEndpoint = credentialFreeHttpUrl(endpoint)
  assert.equal(providerEndpoint.protocol, 'https:')

  const response = await fetch(providerEndpoint, {
    body: JSON.stringify({ text: 'authenticated acceptance sample' }),
    headers: {
      authorization: `Bearer ${credential}`,
      'content-type': 'application/json',
    },
    method: 'POST',
    redirect: 'error',
    signal: AbortSignal.timeout(15_000),
  })
  assert.equal(response.ok, true)
  const finalProviderUrl = credentialFreeHttpUrl(response.url)
  assert.equal(finalProviderUrl.protocol, 'https:')

  const payload = await response.json()
  const mediaUrl = credentialFreeHttpUrl(payload.url)

  const media = await fetch(mediaUrl, {
    redirect: 'error',
    signal: AbortSignal.timeout(15_000),
  })
  assert.equal(media.ok, true)
  credentialFreeHttpUrl(media.url)
  assert.match(media.headers.get('content-type') ?? '', /^(audio|video)\//)
  assert.ok(media.body)

  const reader = media.body.getReader()
  try {
    const first = await reader.read()
    assert.equal(first.done, false)
    assert.ok(first.value.byteLength > 0)
  }
  finally {
    await reader.cancel()
  }
})
