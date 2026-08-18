import assert from 'node:assert/strict'
import { resizeWindow } from '../src/window.mjs'

const calls = []
const windowRef = { resize: (...args) => calls.push(args) }

// preserves-window-identity
assert.equal(resizeWindow(windowRef, { width: 800, height: 600 }), windowRef)
