import assert from 'node:assert/strict'
// eslint-disable-next-line test/no-import-node-test -- isolated fixture runs with `node --test`
import test from 'node:test'
import { formatDisplayName } from '../src/display-name.mjs'

test('formats a display name', () => {
  assert.equal(formatDisplayName('Ada Lovelace'), 'Ada Lovelace')
})
