export class MediaWorkflow {
  constructor({ provider, records, workspace }) {
    this.provider = provider
    this.records = records
    this.workspace = workspace
  }

  async generate(segment) {
    const workspaceId = this.workspace.currentId()
    const media = await this.provider.generate(segment.text)
    const record = {
      createdAt: new Date().toISOString(),
      segmentId: segment.id,
      state: 'ready',
      url: media.url,
    }

    await this.records.save(workspaceId, segment.id, record)
    return record
  }
}
