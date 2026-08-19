import assert from 'node:assert/strict'
// eslint-disable-next-line test/no-import-node-test -- isolated fixture runs with `node --test`
import test from 'node:test'
import { parseLimit } from '../src/parse-limit.mjs'

test('parses limits inside the supported range', () => {
  assert.equal(parseLimit('1'), 1)
  assert.equal(parseLimit('100'), 100)
})

test('rejects non-decimal numeric syntax', () => {
  assert.equal(parseLimit('1e2'), null)
})
