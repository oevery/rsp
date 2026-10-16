import assert from 'node:assert/strict'
import { inWindow, overlap } from '../src/window.mjs'
const events = Object.freeze([
  Object.freeze({ tenant: 'A', at: 10 }),
  Object.freeze({ tenant: 'B', at: 20 }),
  Object.freeze({ tenant: 'A', at: 19 }),
  Object.freeze({ tenant: 'C', at: 9 })
])
assert.deepEqual(inWindow(events, 10, 20), [events[0], events[2]])
const visible = inWindow(events, 10, 20)
for (const [index, original] of [events[0], events[2]].entries())
  assert.equal(visible[index], original)
assert.deepEqual(inWindow(events, 10, 10), [])
assert.deepEqual(inWindow(events, 20, 10), [])
assert.equal(overlap({ start: 0, end: 10 }, { start: 10, end: 20 }), null)
assert.deepEqual(overlap({ start: 0, end: 20 }, { start: 10, end: 30 }), { start: 10, end: 20 })
assert.equal(overlap({ start: 8, end: 3 }, { start: 0, end: 10 }), null)
console.log('Window contract checks passed.')
