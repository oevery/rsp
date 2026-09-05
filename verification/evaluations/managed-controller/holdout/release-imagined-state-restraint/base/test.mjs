import assert from 'node:assert/strict'
import { produceReady } from './src/producer.mjs'
import { saveReady } from './src/save.mjs'

assert.deepEqual(saveReady(produceReady('ok')), { status: 'ready', value: 'ok', persisted: true })
