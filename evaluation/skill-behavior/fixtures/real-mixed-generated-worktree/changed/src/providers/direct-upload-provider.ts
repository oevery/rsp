import type { UploadIntent } from '../generated/storage-api.js'
import type { UploadTransport } from '../upload-adapter.js'

export async function uploadDirectly(
  transport: UploadTransport,
  intent: UploadIntent,
  body: Uint8Array,
): Promise<void> {
  await transport.upload(intent, body)
}
