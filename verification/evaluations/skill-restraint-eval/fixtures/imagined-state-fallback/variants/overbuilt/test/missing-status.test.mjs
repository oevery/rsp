import assert from 'node:assert/strict'
import { saveReady } from '../../src/save.mjs'

assert.equal(saveReady({ value: 'lesson' }).status, 'ready')
