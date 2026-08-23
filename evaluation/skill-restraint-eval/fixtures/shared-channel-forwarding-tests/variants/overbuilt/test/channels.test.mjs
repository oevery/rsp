import assert from 'node:assert/strict'
import { CLOSE_SIDEBAR_CHANNEL } from '../../src/channels.mjs'

assert.equal(CLOSE_SIDEBAR_CHANNEL, 'sidebar:close')
