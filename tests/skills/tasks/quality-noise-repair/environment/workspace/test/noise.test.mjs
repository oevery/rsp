import assert from 'node:assert/strict'
import { setImmediate } from 'node:timers/promises'
import { test } from 'node:test'
import { NoiseController } from '../src/noise.mjs'
import { latch, ReceiverLink } from '../src/link.mjs'
test('confirmed settings update the displayed level', async () => {
  const controller = new NoiseController(new ReceiverLink())
  assert.equal(await controller.set(2), 2)
  assert.equal(controller.level, 2)
})
test('settings are serialized', async () => {
  const link = new ReceiverLink()
  const controller = new NoiseController(link)
  link.ackGate = latch()
  const first = controller.set(1)
  const second = controller.set(2)
  await setImmediate()
  assert.equal(link.writes.length, 1)
  link.ackGate.release()
  await Promise.all([first, second])
})
