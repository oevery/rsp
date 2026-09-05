import assert from 'node:assert/strict'
import test from 'node:test'
import { loadConfig } from '../src/config-loader.mjs'

test('loads a basic config through the shipped loader', () => {
  assert.deepEqual(loadConfig('mode=safe'), { mode: 'safe' })
})
