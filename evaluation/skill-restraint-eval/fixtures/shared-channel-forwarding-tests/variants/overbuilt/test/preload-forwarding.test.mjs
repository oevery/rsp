import assert from 'node:assert/strict'
import { createBridge } from '../../src/preload.mjs'

const messages = []
createBridge({ send: channel => messages.push(channel) }).closeSidebar()
assert.deepEqual(messages, ['sidebar:close'])
