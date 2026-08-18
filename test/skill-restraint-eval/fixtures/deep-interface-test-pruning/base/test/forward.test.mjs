import assert from 'node:assert/strict'
import { normalize } from '../src/forward.mjs'

assert.equal(normalize(' lesson '), 'LESSON')
