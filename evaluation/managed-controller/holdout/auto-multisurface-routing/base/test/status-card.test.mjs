import assert from 'node:assert/strict'
// eslint-disable-next-line test/no-import-node-test -- isolated fixture runs with `node --test`
import test from 'node:test'
import { renderStatusCard } from '../src/status-card.mjs'

test('renders the canonical ready status label', () => {
  assert.equal(renderStatusCard('Ready'), 'Status: Ready')
})
