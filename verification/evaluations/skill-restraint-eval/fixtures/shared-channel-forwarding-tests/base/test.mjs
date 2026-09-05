import assert from 'node:assert/strict'
import { createBridge } from './src/preload.mjs'

const messages = []
const bridge = createBridge({ send: channel => messages.push([channel]) })
bridge.closeSidebar()
assert.deepEqual(messages, [['sidebar:close']])
