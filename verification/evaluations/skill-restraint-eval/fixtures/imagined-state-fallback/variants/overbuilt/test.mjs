import assert from 'node:assert/strict'
import { persistCompleted } from './src/producer.mjs'

assert.deepEqual(persistCompleted('lesson'), {
  status: 'ready',
  value: 'lesson',
  persisted: true,
  savedAt: '2026-08-23T00:00:00.000Z',
})
