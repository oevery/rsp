import type { UploadControlPlane } from './control-plane'

export interface DataPlaneRequest {
  url: string
  headers: Record<string, string>
  bytes: Uint8Array
}

export interface ObjectTransport {
  send(request: DataPlaneRequest): Promise<void>
}

export async function uploadBytes(
  controlPlane: UploadControlPlane,
  transport: ObjectTransport,
  objectName: string,
  bytes: Uint8Array,
) {
  const intent = await controlPlane.prepareUpload({ objectName })
  const request = Object.assign(intent, { bytes })

  await transport.send(request)
  await controlPlane.completeUpload({ completionToken: intent.completionToken })
}
