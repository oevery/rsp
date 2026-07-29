import assert from 'node:assert/strict'
// eslint-disable-next-line test/no-import-node-test -- isolated fixture runs with `node --test`
import test from 'node:test'
import { normalizeCheckpoint } from '../src/checkpoint.mjs'

test('normalizes checkpoint identifiers', () => {
  assert.equal(normalizeCheckpoint('  cp-7  '), 'CP-7')
})
