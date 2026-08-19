import { generateWithProvider, OperationCancelled } from './provider-adapter.mjs'

function isPersistenceAbort(error) {
  return error instanceof OperationCancelled
    || error?.name === 'AbortError'
    || error?.code === 'PERSISTENCE_ABORTED'
}

export class MediaWorkflow {
  constructor({ provider, records, workspace }) {
    this.provider = provider
    this.records = records
    this.workspace = workspace
  }

  async generate(segment, signal) {
    const workspaceId = this.workspace.currentId()
    const media = await generateWithProvider(this.provider, segment.text, signal)
    const record = { segmentId: segment.id, state: 'ready', url: media.url }
    if (signal?.aborted)
      throw new OperationCancelled('Operation cancelled')
    try {
      await this.records.save(workspaceId, segment.id, record, { signal })
    }
    catch (error) {
      if (isPersistenceAbort(error))
        throw new OperationCancelled('Operation cancelled', { cause: error })
      throw error
    }
    return record
  }
}
