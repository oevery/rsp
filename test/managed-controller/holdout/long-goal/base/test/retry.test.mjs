import assert from 'node:assert/strict'
// eslint-disable-next-line test/no-import-node-test -- isolated fixture runs with `node --test`
import test from 'node:test'
import { normalizeRetryCount } from '../src/retry.mjs'

test('accepts an integer retry count', () => {
  assert.equal(normalizeRetryCount(3), 3)
})

test('rejects invalid retry counts', () => {
  assert.throws(() => normalizeRetryCount(6), /retry/i)
  assert.throws(() => normalizeRetryCount('3'), /retry/i)
})
