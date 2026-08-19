export class MediaWorkflow {
  constructor({ provider, records, workspace }) {
    this.provider = provider
    this.records = records
    this.workspace = workspace
  }

  async generate(segment, signal) {
    const media = await this.provider.generate(segment.text, { signal })
    const record = {
      createdAt: new Date().toISOString(),
      segmentId: segment.id,
      state: 'ready',
      url: media.url,
    }

    await this.records.save(this.workspace.currentId(), segment.id, record)
    return record
  }
}
