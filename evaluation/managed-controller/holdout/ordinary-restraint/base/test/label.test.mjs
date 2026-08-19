import assert from 'node:assert/strict'
// eslint-disable-next-line test/no-import-node-test -- isolated fixture runs with `node --test`
import test from 'node:test'
import { formatLabel } from '../src/label.mjs'

test('trims a display label', () => {
  assert.equal(formatLabel(' Ready '), 'Ready')
})
