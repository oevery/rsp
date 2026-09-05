import assert from 'node:assert/strict'
// eslint-disable-next-line test/no-import-node-test -- isolated fixture runs with `node --test`
import test from 'node:test'
import { parsePort } from '../src/parse-port.mjs'

test('parses a positive port', () => {
  assert.equal(parsePort('8080'), 8080)
})
