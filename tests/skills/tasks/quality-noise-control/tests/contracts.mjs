import assert from 'node:assert/strict'
import { join } from 'node:path'
import { test } from 'node:test'
import { setImmediate } from 'node:timers/promises'
import { pathToFileURL } from 'node:url'

async function verify() {
  const root = process.env.RSP_WORKSPACE || '/app'
  const { NoiseController } = await import(pathToFileURL(join(root, 'src/noise.mjs')))
  const { latch, ReceiverLink } = await import(pathToFileURL(join(root, 'src/link.mjs')))
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

  test('a later write waits for confirmation readback', async () => {
    const link = new ReceiverLink()
    const controller = new NoiseController(link)
    link.readGate = latch()
    link.readStarted = latch()
    const first = controller.set(1)
    const second = controller.set(2)
    await link.readStarted.promise
    await setImmediate()
    assert.equal(link.writes.length, 1)
    link.readGate.release()
    assert.deepEqual(await Promise.all([first, second]), [1, 2])
    assert.equal(link.writes.length, 2)
  })
  test('refresh restores use without replaying an unconfirmed write', async () => {
    const link = new ReceiverLink()
    const controller = new NoiseController(link)
    link.failWrite = true
    const failed = controller.set(1)
    const queued = controller.set(2)
    await assert.rejects(failed)
    await assert.rejects(queued)
    assert.equal(controller.level, null)
    assert.equal(link.writes.length, 1)
    await controller.refresh()
    assert.equal(link.epoch, 2)
    assert.equal(link.writes.length, 1)
    assert.equal(await controller.set(3), 3)
    assert.equal(link.writes.length, 2)
  })

  test('recovery readback completes before another setting writes', async () => {
    const link = new ReceiverLink()
    const controller = new NoiseController(link)
    link.failWrite = true
    await assert.rejects(controller.set(1))
    link.readGate = latch()
    link.readStarted = latch()
    const refresh = controller.refresh()
    await link.readStarted.promise
    const next = controller.set(2)
    const completed = Promise.allSettled([refresh, next])
    try {
      await setImmediate()
      assert.equal(link.writes.length, 1)
    }
    finally {
      link.readGate.release()
      await completed
    }
    assert.equal(await refresh, 1)
    assert.equal(await next, 2)
  })
  test('failed recovery readback retains quarantine', async () => {
    const link = new ReceiverLink()
    const controller = new NoiseController(link)
    link.failWrite = true
    await assert.rejects(controller.set(1))
    const read = link.read.bind(link)
    link.read = async () => {
      throw new Error('read failed')
    }
    await assert.rejects(controller.refresh())
    link.read = read
    await assert.rejects(controller.set(2))
    assert.equal(controller.level, null)
    assert.equal(link.writes.length, 1)
    assert.equal(await controller.refresh(), 1)
    assert.equal(await controller.set(2), 2)
  })
  test('invalid requested levels never reach the wire', async () => {
    const link = new ReceiverLink()
    const controller = new NoiseController(link)
    for (const level of [-1, 4, 1.5])
      await assert.rejects(controller.set(level))
    assert.equal(link.writes.length, 0)
    assert.equal(controller.level, null)
  })
  test('invalid recovery observations do not replace the confirmed level', async () => {
    const link = new ReceiverLink()
    const controller = new NoiseController(link)
    await controller.set(2)
    link.actual = 4
    await assert.rejects(controller.refresh())
    assert.equal(controller.level, 2)
  })
  test('invalid recovery retains quarantine until a valid refresh', async () => {
    const link = new ReceiverLink()
    const controller = new NoiseController(link)
    await controller.set(2)
    link.failWrite = true
    await assert.rejects(controller.set(1))
    const writes = link.writes.length
    link.actual = 4
    await assert.rejects(controller.refresh())
    assert.equal(controller.level, 2)
    await assert.rejects(controller.set(3))
    assert.equal(link.writes.length, writes)
    link.actual = 1
    assert.equal(await controller.refresh(), 1)
    assert.equal(controller.level, 1)
    assert.equal(link.writes.length, writes)
    assert.equal(await controller.set(3), 3)
    assert.equal(link.writes.length, writes + 1)
  })
}

verify().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
