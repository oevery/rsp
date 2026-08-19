import { strict as assert } from 'node:assert'
import { uploadAsset, type UploadRequest, type UploadTransport } from '../src/upload-adapter.js'

class RecordingTransport implements UploadTransport {
  requests: UploadRequest[] = []

  async upload(request: UploadRequest): Promise<void> {
    this.requests.push(request)
  }
}

const transport = new RecordingTransport()
assert.equal(await uploadAsset(transport, new Uint8Array()), 'public-object')
assert.equal(transport.requests.length, 1)
