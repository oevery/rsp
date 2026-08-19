import assert from 'node:assert/strict'
import test from 'node:test'
import { MediaWorkflow } from '../src/media-workflow.mjs'

test('stores generated media in the active workspace', async () => {
  const saved = []
  const workflow = new MediaWorkflow({
    provider: { generate: async () => ({ url: 'https://media.invalid/a.mp3' }) },
    records: { save: async (...args) => saved.push(args) },
    workspace: { currentId: () => 'workspace-a' },
  })

  await workflow.generate({ id: 'segment-1', text: 'hello' })
  assert.equal(saved[0][0], 'workspace-a')
  assert.equal(saved[0][2].state, 'ready')
})
