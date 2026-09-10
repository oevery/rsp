import assert from 'node:assert/strict'
import { createBridge } from './src/preload.mjs'
import { closeSidebar } from './src/sidebar.mjs'

const messages = []
const bridge = createBridge({ send: channel => messages.push([channel]) })
closeSidebar(bridge)
assert.deepEqual(messages, [['sidebar:close']])
