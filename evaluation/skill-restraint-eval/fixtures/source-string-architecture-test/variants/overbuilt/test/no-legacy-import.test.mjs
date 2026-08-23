import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../../src/service.mjs', import.meta.url), 'utf8')
assert.equal(source.includes('legacy.mjs'), false)
