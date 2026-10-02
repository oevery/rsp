import assert from 'node:assert/strict'
import { currency, priceCents } from '../src/price.mjs'

assert.equal(priceCents, 1500)
assert.equal(currency, 'USD')
console.log('PASS: Notebook 1500 cents; currency USD')
