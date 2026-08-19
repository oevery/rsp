import assert from 'node:assert/strict'
import test from 'node:test'
import { canDeliver } from '../src/delivery-gate.mjs'
import { MediaWorkflow } from '../src/media-workflow.mjs'
import { BatchRunner } from '../src/batch-runner.mjs'

test('late result stays with its initiating workspace', async () => {
  let current = 'workspace-a'
  let resolveProvider
  const saved = []
  const workflow = new MediaWorkflow({
    provider: { generate: () => new Promise(resolve => resolveProvider = resolve) },
    records: { save: async (...args) => saved.push(args) },
    workspace: { currentId: () => current },
  })

  const pending = workflow.generate({ id: 'segment-1', text: 'hello' })
  current = 'workspace-b'
  resolveProvider({ url: 'https://media.invalid/a.mp3' })
  await pending
  assert.equal(saved[0][0], 'workspace-a')
})

test('batch cancellation aborts the signal passed to the workflow', () => {
  let receivedSignal
  const runner = new BatchRunner({
    generate: (_segment, signal) => {
      receivedSignal = signal
      return new Promise(() => {})
    },
  })
  const operation = runner.run([{ id: 'segment-1' }])
  assert.equal(receivedSignal.aborted, false)
  operation.cancel()
  assert.equal(receivedSignal.aborted, true)
})

test('delivery rejects unsafe persisted URLs', () => {
  assert.equal(canDeliver({ state: 'ready', url: 'https://media.invalid/a.mp3' }), true)
  assert.equal(canDeliver({ state: 'ready', url: 'file:///tmp/a.mp3' }), false)
  assert.equal(canDeliver({ state: 'ready', url: 'https://user:secret@media.invalid/a.mp3' }), false)
  assert.equal(canDeliver({ state: 'ready', url: 'not a url' }), false)
})
