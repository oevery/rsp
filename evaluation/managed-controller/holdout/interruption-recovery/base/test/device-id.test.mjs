import assert from 'node:assert/strict'
// eslint-disable-next-line test/no-import-node-test -- isolated fixture runs with `node --test`
import test from 'node:test'
import { normalizeDeviceId } from '../src/device-id.mjs'

test('preserves a complete ASCII decimal identifier', () => {
  assert.equal(normalizeDeviceId('0017'), '0017')
})

test('rejects non-decimal syntax', () => {
  assert.throws(() => normalizeDeviceId('17e0'), /decimal/i)
})
