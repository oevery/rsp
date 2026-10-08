import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { priceCents } from '../src/price.mjs'
assert.equal(priceCents, 1500)
assert.deepEqual(JSON.parse(readFileSync(new URL('../site/price.json', import.meta.url), 'utf8')), { currency: 'USD', price: '15.00' })
console.log('Price source and storefront verified')
