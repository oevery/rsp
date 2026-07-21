import { requestUploadIntent } from './generated/storage-api.js'

export interface UploadRequest {
  uploadUrl: string
  objectKey: string
  headers: Record<string, string>
}

export interface UploadTransport {
  upload(request: UploadRequest, body: Uint8Array): Promise<void>
}

export async function uploadAsset(transport: UploadTransport, body: Uint8Array): Promise<string> {
  const intent = await requestUploadIntent()
  await transport.upload(intent, body)
  return intent.objectKey
}
