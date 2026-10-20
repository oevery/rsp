import assert from 'node:assert/strict'
import { test } from 'node:test'
import { ReceiverSession } from '../src/session.mjs'
test('registered handsets receive a targeted question', () => {
  const sent = []
  const session = new ReceiverSession('R-A', { send: packet => sent.push(packet) })
  session.register({ id: 'one', model: 'H-A' })
  session.register({ id: 'two', model: 'H-A' })
  session.send(['two'], 'hello')
  assert.deepEqual(sent, [{ protocol: 'alpha', targets: ['two'], text: 'hello' }])
})

test('mixed handsets receive their required encodings', () => {
  const packets = []
  const session = new ReceiverSession('R-A', { send: packet => packets.push(packet) })
  session.register({ id: 'one', model: 'H-A' })
  session.register({ id: 'two', model: 'H-B' })
  session.send(null, 'hello')
  assert.deepEqual(packets.toSorted((a, b) => a.protocol.localeCompare(b.protocol)), [{ protocol: 'alpha', targets: ['one'], text: 'hello' }, { protocol: 'beta', targets: ['two'], text: 'HELLO' }])
})
