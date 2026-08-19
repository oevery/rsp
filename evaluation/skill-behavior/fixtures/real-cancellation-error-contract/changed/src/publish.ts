import { uploadWithProvider, type ProviderClient } from './provider'

export type PublishResult =
  | { ok: true }
  | { ok: false, error: 'cancelled' | 'provider-failed' }

export async function publishAsset(
  client: ProviderClient,
  bytes: Uint8Array,
  signal?: AbortSignal,
): Promise<PublishResult> {
  try {
    await uploadWithProvider(client, bytes, signal)
    return { ok: true }
  }
  catch (error) {
    if (error instanceof Error && error.name === 'AbortError')
      return { ok: false, error: 'cancelled' }

    return { ok: false, error: 'provider-failed' }
  }
}
