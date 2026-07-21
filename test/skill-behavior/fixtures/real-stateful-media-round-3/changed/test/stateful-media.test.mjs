import assert from 'node:assert/strict'
import test from 'node:test'
import { MediaWorkflow } from '../src/media-workflow.mjs'
import { generateWithProvider, GenerationFailed, OperationCancelled } from '../src/provider-adapter.mjs'
import { SessionState } from '../src/session-state.mjs'

function memoryDrafts() {
  let value = null
  return { clear: () => value = null, get: () => value, set: next => value = next }
}

test('workspace change clears the previous transient draft', () => {
  const session = new SessionState(memoryDrafts())
  session.changeWorkspace('workspace-a')
  session.setDraft({ segmentId: 'segment-1' })
  session.changeWorkspace('workspace-b')
  assert.equal(session.currentDraft(), null)
})

test('same workspace preserves its draft', () => {
  const session = new SessionState(memoryDrafts())
  session.changeWorkspace('workspace-a')
  session.setDraft({ segmentId: 'segment-1' })
  session.changeWorkspace('workspace-a')
  assert.deepEqual(session.currentDraft(), { segmentId: 'segment-1' })
})

test('pre-abort is normalized', async () => {
  const controller = new AbortController()
  controller.abort()
  await assert.rejects(generateWithProvider({ generate: () => assert.fail() }, 'hello', controller.signal), OperationCancelled)
})

test('provider-specific abort is normalized', async () => {
  const error = Object.assign(new Error('stopped'), { code: 'PROVIDER_ABORTED' })
  await assert.rejects(generateWithProvider({ generate: async () => { throw error } }, 'hello'), OperationCancelled)
})

test('standard abort is normalized', async () => {
  const error = Object.assign(new Error('aborted'), { name: 'AbortError' })
  await assert.rejects(generateWithProvider({ generate: async () => { throw error } }, 'hello'), OperationCancelled)
})

test('workflow normalizes provider abort before persistence', async () => {
  let saved = false
  const error = Object.assign(new Error('stopped'), { code: 'PROVIDER_ABORTED' })
  const workflow = new MediaWorkflow({
    provider: { generate: async () => { throw error } },
    records: { save: async () => { saved = true } },
    workspace: { currentId: () => 'workspace-a' },
  })

  await assert.rejects(workflow.generate({ id: 'segment-1', text: 'hello' }), OperationCancelled)
  assert.equal(saved, false)
})

test('workflow does not persist a late provider success after cancellation', async () => {
  let resolveProvider
  let saved = false
  const controller = new AbortController()
  const workflow = new MediaWorkflow({
    provider: { generate: () => new Promise(resolve => { resolveProvider = resolve }) },
    records: { save: async () => { saved = true } },
    workspace: { currentId: () => 'workspace-a' },
  })

  const pending = workflow.generate({ id: 'segment-1', text: 'hello' }, controller.signal)
  controller.abort()
  resolveProvider({ url: 'https://media.invalid/a.mp3' })

  await assert.rejects(pending, OperationCancelled)
  assert.equal(saved, false)
})

test('workflow cancellation during save does not commit or return ready', async () => {
  let signalAtSave
  let notifySaveStarted
  let persisted = false
  const controller = new AbortController()
  const saveStarted = new Promise(resolve => { notifySaveStarted = resolve })
  const workflow = new MediaWorkflow({
    provider: { generate: async () => ({ url: 'https://media.invalid/a.mp3' }) },
    records: {
      save: async (_workspaceId, _segmentId, _record, { signal }) => {
        signalAtSave = signal
        notifySaveStarted()
        await new Promise((resolve, reject) => {
          signal.addEventListener('abort', () => {
            const error = Object.assign(new Error('save aborted'), { name: 'AbortError' })
            reject(error)
          }, { once: true })
        })
        persisted = true
      },
    },
    workspace: { currentId: () => 'workspace-a' },
  })

  const pending = workflow.generate({ id: 'segment-1', text: 'hello' }, controller.signal)
  await saveStarted
  assert.equal(signalAtSave, controller.signal)
  controller.abort()

  await assert.rejects(pending, OperationCancelled)
  assert.equal(persisted, false)
})

test('completed persistence wins over a later cancellation', async () => {
  let committed = false
  const controller = new AbortController()
  const workflow = new MediaWorkflow({
    provider: { generate: async () => ({ url: 'https://media.invalid/a.mp3' }) },
    records: {
      save: async () => {
        committed = true
        queueMicrotask(() => controller.abort())
      },
    },
    workspace: { currentId: () => 'workspace-a' },
  })

  const result = await workflow.generate({ id: 'segment-1', text: 'hello' }, controller.signal)
  assert.equal(committed, true)
  assert.equal(controller.signal.aborted, true)
  assert.equal(result.state, 'ready')
})

test('persistence failure wins over a later cancellation', async () => {
  const controller = new AbortController()
  const storageError = new Error('storage unavailable')
  const workflow = new MediaWorkflow({
    provider: { generate: async () => ({ url: 'https://media.invalid/a.mp3' }) },
    records: {
      save: async () => {
        queueMicrotask(() => controller.abort())
        throw storageError
      },
    },
    workspace: { currentId: () => 'workspace-a' },
  })

  await assert.rejects(
    workflow.generate({ id: 'segment-1', text: 'hello' }, controller.signal),
    error => error === storageError && !(error instanceof OperationCancelled),
  )
  assert.equal(controller.signal.aborted, true)
})

test('non-abort provider failure remains a generation failure', async () => {
  await assert.rejects(generateWithProvider({ generate: async () => { throw new Error('quota') } }, 'hello'), GenerationFailed)
})
