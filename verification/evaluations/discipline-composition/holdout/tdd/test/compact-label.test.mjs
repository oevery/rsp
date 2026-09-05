import assert from 'node:assert/strict'
// eslint-disable-next-line test/no-import-node-test -- isolated fixture runs with `node --test`
import test from 'node:test'
import { compactLabel } from '../src/compact-label.mjs'

test('preserves labels that fit', () => {
  assert.equal(compactLabel('ready', 8), 'ready')
})
