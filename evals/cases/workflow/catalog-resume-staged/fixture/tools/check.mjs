import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

assert.deepEqual(JSON.parse(readFileSync('catalog.json', 'utf8')), {
  currency: 'USD',
  items: [
    { id: 'notebook', title: 'Notebook', priceCents: 1500 },
    { id: 'pencil', title: 'Pencil', priceCents: 200 },
  ],
})
assert.deepEqual(JSON.parse(readFileSync('site/catalog.json', 'utf8')), {
  currency: 'USD',
  products: [
    { sku: 'notebook', label: 'Notebook', price: '15.00' },
    { sku: 'pencil', label: 'Pencil', price: '2.00' },
  ],
})
console.log('Source and storefront catalog verified.')
