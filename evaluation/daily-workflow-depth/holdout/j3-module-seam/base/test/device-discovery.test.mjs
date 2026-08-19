import assert from 'node:assert/strict'
// eslint-disable-next-line test/no-import-node-test -- fixture executes with node --test in an isolated package
import { test } from 'node:test'

import { projectDeviceEvent } from '../client/packages/device-discovery/src/index.ts'

test('projects an immutable normalized device event', () => {
  const result = projectDeviceEvent({ connected: true, id: ' receiver-01 ' })
  assert.deepEqual(result, { connected: true, id: 'receiver-01' })
  assert.equal(Object.isFrozen(result), true)
})

test('rejects an empty device id', () => {
  assert.throws(() => projectDeviceEvent({ connected: false, id: '   ' }), /device id/i)
})
