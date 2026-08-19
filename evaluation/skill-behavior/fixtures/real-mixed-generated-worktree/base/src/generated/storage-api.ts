// Generated file. Do not edit by hand.
export interface UploadIntent {
  uploadUrl: string
  objectKey: string
  headers: Record<string, string>
}

export async function requestUploadIntent(): Promise<UploadIntent> {
  return {
    uploadUrl: 'https://uploads.example.invalid/public-object',
    objectKey: 'public-object',
    headers: { 'content-type': 'application/octet-stream' },
  }
}
