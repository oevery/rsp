import assert from 'node:assert/strict'
import { createCache } from '../src/cache.mjs'

let now = 100
const cache = createCache(() => now)
cache.set('item', 'first', 10)
assert.equal(cache.get('item'), 'first')
cache.set('item', 'replacement', 10)
now = 109
assert.equal(cache.get('item'), 'replacement')
assert.equal(cache.get('missing'), undefined)
console.log('Cache smoke check passed')
