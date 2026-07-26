import assert from 'node:assert/strict'
// eslint-disable-next-line test/no-import-node-test -- isolated fixture runs with `node --test`
import test from 'node:test'
import { formatGreeting } from '../src/greeting.mjs'

test('formats a greeting', () => {
  assert.equal(formatGreeting('RSP'), 'Hello, RSP!')
})
