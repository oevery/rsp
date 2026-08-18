import assert from 'node:assert/strict'
import { resizeWindow } from '../src/window.mjs'

const calls = []
const windowRef = { resize: (...args) => calls.push(args) }
assert.equal(resizeWindow(windowRef, 800, 600), windowRef)
assert.deepEqual(calls, [[800, 600]])
