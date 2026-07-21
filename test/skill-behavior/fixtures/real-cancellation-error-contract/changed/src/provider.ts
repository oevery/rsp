export interface ProviderClient {
  upload(bytes: Uint8Array, signal?: AbortSignal): Promise<void>
}

export class ProviderUploadError extends Error {
  constructor(cause: unknown) {
    super('provider-upload-failed', { cause })
    this.name = 'ProviderUploadError'
  }
}

export async function uploadWithProvider(
  client: ProviderClient,
  bytes: Uint8Array,
  signal?: AbortSignal,
) {
  try {
    await client.upload(bytes, signal)
  }
  catch (error) {
    throw new ProviderUploadError(error)
  }
}
