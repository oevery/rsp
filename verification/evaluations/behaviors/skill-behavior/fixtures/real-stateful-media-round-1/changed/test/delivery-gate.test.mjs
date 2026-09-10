import assert from 'node:assert/strict'
import test from 'node:test'
import { canDeliver } from '../src/delivery-gate.mjs'

test('requires a ready record with a URL', () => {
  assert.equal(canDeliver({ state: 'ready', url: 'https://media.invalid/a.mp3' }), true)
  assert.equal(canDeliver({ state: 'ready', url: '' }), false)
  assert.equal(canDeliver({ state: 'pending', url: 'https://media.invalid/a.mp3' }), false)
})
