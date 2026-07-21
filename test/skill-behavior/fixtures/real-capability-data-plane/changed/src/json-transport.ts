import type { DataPlaneRequest, ObjectTransport } from './object-store'

export class JsonObjectTransport implements ObjectTransport {
  constructor(private readonly deliver: (body: string) => Promise<void>) {}

  async send(request: DataPlaneRequest) {
    await this.deliver(JSON.stringify(request))
  }
}
