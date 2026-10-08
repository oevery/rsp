import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
assert.deepEqual(JSON.parse(readFileSync('catalog.json','utf8')), {currency:'USD',notebookPriceCents:1200})
assert.deepEqual(JSON.parse(readFileSync('site/catalog.json','utf8')), {currency:'USD',notebookPrice:'12.00'})
console.log('Current 1200-cent snapshot verified; no future price decision is certified.')
