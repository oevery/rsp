import assert from 'node:assert/strict'
// eslint-disable-next-line test/no-import-node-test -- isolated fixture runs with `node --test`
import test from 'node:test'
import { normalizeHeaderName } from '../src/header.mjs'

test('normalizes a header name', () => {
  assert.equal(normalizeHeaderName(' X-Request-ID '), 'x-request-id')
})

test('rejects an empty header name', () => {
  assert.throws(() => normalizeHeaderName('  '), /header/i)
})
