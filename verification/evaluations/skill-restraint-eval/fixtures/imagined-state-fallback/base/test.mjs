import assert from 'node:assert/strict'
import { persistCompleted } from './src/producer.mjs'

assert.deepEqual(persistCompleted('lesson'), { status: 'ready', value: 'lesson', persisted: true })
