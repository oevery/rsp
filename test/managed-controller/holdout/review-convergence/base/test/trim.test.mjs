import assert from 'node:assert/strict'
// eslint-disable-next-line test/no-import-node-test -- isolated fixture runs with `node --test`
import test from 'node:test'
import { normalizeLabel } from '../src/normalize.mjs'

test('trims label boundaries', () => {
  assert.equal(normalizeLabel('  alpha  '), 'alpha')
})
