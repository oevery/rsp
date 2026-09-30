import assert from 'node:assert/strict'
import { lineTotal } from '../src/pricing.mjs'
import { checkout } from '../src/checkout.mjs'
assert.equal(lineTotal({ unitCents: 101, quantity: 1, discountPercent: 50 }), 51)
assert.equal(lineTotal({ unitCents: 101, quantity: 2, discountPercent: 50 }), 101)
const lines = Object.freeze([Object.freeze({ unitCents: 2500, quantity: 1, discountPercent: 25 })])
assert.deepEqual(checkout('tenant-A', lines), { tenant: 'tenant-A', subtotalCents: 1875, shippingCents: 250, totalCents: 2125 })
assert.equal(checkout('tenant-B', [{ unitCents: 2000, quantity: 1, discountPercent: 0 }]).shippingCents, 0)
assert.equal(checkout('tenant-B', [{ unitCents: 1999, quantity: 1, discountPercent: 0 }]).shippingCents, 250)
assert.equal(checkout('tenant-B', [{ unitCents: 1000, quantity: 2, discountPercent: 0 }]).totalCents, 2000)
console.log('Checkout contract checks passed.')
