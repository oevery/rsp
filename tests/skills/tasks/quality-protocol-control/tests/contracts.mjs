import assert from 'node:assert/strict'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

async function verify() {
  const root = process.env.RSP_WORKSPACE || '/app'
  const { ReceiverSession } = await import(pathToFileURL(join(root, 'src/session.mjs')))
  const packets = []
  const receiver = new ReceiverSession('R-A', { send: packet => packets.push(packet) })
  receiver.register({ id: 'one', model: 'H-A' })
  receiver.register({ id: 'two', model: 'H-B' })
  receiver.send(null, 'hello')
  assert.deepEqual(packets.toSorted((a, b) => a.protocol.localeCompare(b.protocol)), [{ protocol: 'alpha', targets: ['one'], text: 'hello' }, { protocol: 'beta', targets: ['two'], text: 'HELLO' }])
  packets.length = 0
  receiver.send(['two'], 'next')
  assert.deepEqual(packets, [{ protocol: 'beta', targets: ['two'], text: 'NEXT' }])
  const count = packets.length
  for (const targets of [['missing'], ['two', 'one', 'missing']]) {
    assert.throws(() => receiver.send(targets, 'bad'))
    assert.equal(packets.length, count)
  }
  const beta = new ReceiverSession('R-B', { send: packet => packets.push(packet) })
  beta.register({ id: 'three', model: 'H-B' })
  assert.deepEqual(beta.send(null, 'word'), [{ protocol: 'beta', targets: ['three'], text: 'WORD' }])
  console.log('Protocol ownership and wire behavior passed')
}

verify().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
