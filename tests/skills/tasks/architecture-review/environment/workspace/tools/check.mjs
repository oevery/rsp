import assert from 'node:assert/strict'
import { invoice, preview } from '../src/main.mjs'

for (const value of [0, 1.239, 12.345, -1.239]) {
  const expected = { totalCents: Math.round(value * 100) }
  assert.deepEqual(preview(value), expected)
  assert.deepEqual(invoice(value), expected)
}
console.log('Preview and invoice pricing checks passed')
