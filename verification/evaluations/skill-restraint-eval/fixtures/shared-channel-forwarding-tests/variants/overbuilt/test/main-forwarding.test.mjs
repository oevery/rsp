import assert from 'node:assert/strict'
import { sendCloseSidebar } from '../../src/main.mjs'

const messages = []
sendCloseSidebar({ send: channel => messages.push(channel) })
assert.deepEqual(messages, ['sidebar:close'])
