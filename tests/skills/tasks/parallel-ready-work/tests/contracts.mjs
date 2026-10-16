import assert from 'node:assert/strict'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

async function main() {
  const app = process.env.RSP_WORKSPACE || '/app'
  const { encodeField, exportRows } = await import(pathToFileURL(join(app, 'src/csv.mjs')))
  const { inWindow, overlap } = await import(pathToFileURL(join(app, 'src/window.mjs')))
  const rows = Object.freeze([
    Object.freeze(['tenant-A', 'he said "yes"', 'line\nbreak', null]),
    Object.freeze(['tenant-B', 'a,b', 'carriage\rreturn', 0]),
  ])
  assert.equal(exportRows(rows), 'tenant-A,"he said ""yes""","line\nbreak",\ntenant-B,"a,b","carriage\rreturn",0')
  assert.equal(encodeField('plain'), 'plain')
  assert.equal(encodeField(undefined), '')
  assert.equal(encodeField('"'), '""""')
  assert.equal(exportRows([]), '')
  assert.equal(rows[0][1], 'he said "yes"')
  console.log('CSV contract checks passed.')
  const events = Object.freeze([
    Object.freeze({ tenant: 'A', at: 10 }),
    Object.freeze({ tenant: 'B', at: 20 }),
    Object.freeze({ tenant: 'A', at: 19 }),
    Object.freeze({ tenant: 'C', at: 9 }),
  ])
  assert.deepEqual(inWindow(events, 10, 20), [events[0], events[2]])
  const visible = inWindow(events, 10, 20)
  for (const [index, original] of [events[0], events[2]].entries())
    assert.equal(visible[index], original)
  assert.deepEqual(inWindow(events, 10, 10), [])
  assert.deepEqual(inWindow(events, 20, 10), [])
  assert.equal(overlap({ start: 0, end: 10 }, { start: 10, end: 20 }), null)
  const left = Object.freeze({ start: 0, end: 20 })
  const right = Object.freeze({ start: 10, end: 30 })
  assert.deepEqual(overlap(left, right), { start: 10, end: 20 })
  assert.deepEqual(left, { start: 0, end: 20 })
  assert.deepEqual(right, { start: 10, end: 30 })
  assert.equal(overlap({ start: 8, end: 3 }, { start: 0, end: 10 }), null)
  console.log('Window contract checks passed.')
  assert.equal(encodeField('é,"\r\n'), '"é,""\r\n"')
  assert.equal(exportRows([[]]), '')
  assert.equal(overlap({ start: 4, end: 4 }, { start: 0, end: 10 }), null)
  assert.equal(overlap({ start: 0, end: 10 }, { start: 8, end: 3 }), null)
  for (const start of [-10, 0, 15]) {
    const event = Object.freeze({ at: start + 1, tenant: 'unchanged' })
    assert.deepEqual(inWindow([event], start, start + 1), [])
    assert.deepEqual(inWindow([event], start + 1, start + 2), [event])
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
