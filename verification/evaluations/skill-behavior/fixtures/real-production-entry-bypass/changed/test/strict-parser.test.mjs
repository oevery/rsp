import assert from 'node:assert/strict'
import test from 'node:test'
import { parseConfig } from '../src/strict-parser.mjs'

test('rejects blank config keys', () => {
  assert.throws(() => parseConfig('=unsafe'), /must not be blank/)
})
