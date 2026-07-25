import assert from 'node:assert/strict'
// eslint-disable-next-line test/no-import-node-test -- isolated fixture runs with `node --test`
import test from 'node:test'
import { summarizeDelivery } from '../src/summary.mjs'

test('summarizes normalized delivery values', () => {
  assert.equal(summarizeDelivery(' X-Request-ID ', 3), 'x-request-id:3')
})
