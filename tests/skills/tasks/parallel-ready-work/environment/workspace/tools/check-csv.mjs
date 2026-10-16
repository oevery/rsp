import assert from 'node:assert/strict'
import { encodeField, exportRows } from '../src/csv.mjs'
const rows = Object.freeze([
  Object.freeze(['tenant-A', 'he said "yes"', 'line\nbreak', null]),
  Object.freeze(['tenant-B', 'a,b', 'carriage\rreturn', 0])
])
assert.equal(exportRows(rows), 'tenant-A,"he said ""yes""","line\nbreak",\ntenant-B,"a,b","carriage\rreturn",0')
assert.equal(encodeField('plain'), 'plain')
assert.equal(encodeField(undefined), '')
assert.equal(encodeField('"'), '""""')
assert.equal(exportRows([]), '')
assert.equal(rows[0][1], 'he said "yes"')
console.log('CSV contract checks passed.')
