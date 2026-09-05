export interface PublishProvider {
  getCredential(options?: { signal?: AbortSignal }): Promise<string>
  createIntent(credential: string, options?: { signal?: AbortSignal }): Promise<{ uploadId: string }>
  transfer(uploadId: string, bytes: Uint8Array, options?: { signal?: AbortSignal }): Promise<void>
  complete(uploadId: string, options?: { signal?: AbortSignal }): Promise<void>
}

export async function publish(
  provider: PublishProvider,
  bytes: Uint8Array,
  options: { signal?: AbortSignal } = {},
) {
  const credential = await provider.getCredential()
  const intent = await provider.createIntent(credential)
  await provider.transfer(intent.uploadId, bytes, { signal: options.signal })
  await provider.complete(intent.uploadId)
}
