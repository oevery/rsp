import assert from 'node:assert/strict'
// eslint-disable-next-line test/no-import-node-test -- isolated fixture runs with `node --test`
import test from 'node:test'
import { normalizeMode } from '../src/normalize-mode.mjs'

test('normalizes an explicit mode', () => {
  assert.equal(normalizeMode({ APP_MODE: ' FAST ' }), 'fast')
})

test('uses safe mode when configuration is empty', () => {
  assert.equal(normalizeMode({ APP_MODE: '' }), 'safe')
})
