import assert from 'node:assert/strict'
import { submitLabel } from './src/public-module.mjs'

assert.equal(submitLabel(' lesson '), 'LESSON')
