import assert from 'node:assert/strict'
import { formatName } from './src/name.mjs'

assert.equal(formatName('  Ada   Lovelace  '), 'Ada Lovelace')
