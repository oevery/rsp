import assert from 'node:assert/strict'
import { normalizeName } from './src/service.mjs'

assert.equal(normalizeName(' Lesson '), 'lesson')
