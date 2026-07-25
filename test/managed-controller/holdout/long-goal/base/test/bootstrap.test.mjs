import assert from 'node:assert/strict'
// eslint-disable-next-line test/no-import-node-test -- isolated fixture runs with `node --test`
import test from 'node:test'
import { deliveryProtocol } from '../src/bootstrap.mjs'

test('returns the delivery protocol marker', () => {
  assert.equal(deliveryProtocol(), 'delivery-v1')
})
