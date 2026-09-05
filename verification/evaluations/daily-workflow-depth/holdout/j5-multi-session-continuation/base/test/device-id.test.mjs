import assert from 'node:assert/strict'
// eslint-disable-next-line test/no-import-node-test -- fixture executes with node --test in an isolated package
import { test } from 'node:test'

import { normalizeDeviceId } from '../src/device-id.mjs'

test('preserves an ASCII decimal device id', () => {
  assert.equal(normalizeDeviceId('00123'), '00123')
})

test('rejects alternative syntax', () => {
  for (const value of ['1e2', ' 12 ', '１２'])
    assert.throws(() => normalizeDeviceId(value), /ASCII decimal/)
})
