import assert from 'node:assert/strict'
import { mkdirSync, appendFileSync } from 'node:fs'
import { value } from '../src/value.mjs'
mkdirSync('.cache', { recursive: true })
appendFileSync('.cache/check-runs', 'run\n')
assert.equal(value, 2)
console.log('value contract passed')
