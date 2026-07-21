import { uploadWithProvider, type ProviderClient } from './provider'

export async function publishAsset(
  client: ProviderClient,
  bytes: Uint8Array,
  signal?: AbortSignal,
) {
  await uploadWithProvider(client, bytes, signal)
  return { ok: true as const }
}
