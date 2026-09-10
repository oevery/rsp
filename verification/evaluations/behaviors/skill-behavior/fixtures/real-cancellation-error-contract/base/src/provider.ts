export interface ProviderClient {
  upload(bytes: Uint8Array, signal?: AbortSignal): Promise<void>
}

export async function uploadWithProvider(
  client: ProviderClient,
  bytes: Uint8Array,
  signal?: AbortSignal,
) {
  await client.upload(bytes, signal)
}
