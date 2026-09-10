import { strict as assert } from 'node:assert'
import { isDeliveryReady, playbackSource, previewSource } from '../src/media-resource.js'

const publicResource = {
  id: 'public-track',
  state: 'ready' as const,
  url: 'https://media.example.invalid/tracks/public.mp3',
}

assert.equal(previewSource(publicResource), publicResource.url)
assert.equal(isDeliveryReady(publicResource), true)
assert.equal(playbackSource(publicResource), publicResource.url)
