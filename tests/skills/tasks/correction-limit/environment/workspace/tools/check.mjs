import assert from 'node:assert/strict'
import { visibleRecords } from '../src/expiry.mjs'
const records = Object.freeze([
  Object.freeze({ tenant: 'A', expiresAt: 100, payload: 'expired' }),
  Object.freeze({ tenant: 'B', expiresAt: 101, payload: 'future' }),
  Object.freeze({ tenant: 'A', expiresAt: null, payload: 'perpetual' }),
  Object.freeze({ tenant: 'C', payload: 'absent' })
])
assert.deepEqual(visibleRecords(records, 100), [records[1], records[2], records[3]])
assert.equal(visibleRecords(records, 100)[0], records[1])
assert.deepEqual(visibleRecords([{ expiresAt: 0 }], 0), [])
assert.deepEqual(visibleRecords([{ expiresAt: -1 }], -1), [])
assert.deepEqual(visibleRecords([], 100), [])
assert.equal(records.length, 4)
console.log('Expiry boundary and preservation checks passed.')
