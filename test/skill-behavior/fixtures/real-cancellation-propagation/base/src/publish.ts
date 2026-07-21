export interface PublishProvider {
  getCredential(): Promise<string>
  createIntent(credential: string): Promise<{ uploadId: string }>
  transfer(uploadId: string, bytes: Uint8Array): Promise<void>
  complete(uploadId: string): Promise<void>
}

export async function publish(
  provider: PublishProvider,
  bytes: Uint8Array,
) {
  const credential = await provider.getCredential()
  const intent = await provider.createIntent(credential)
  await provider.transfer(intent.uploadId, bytes)
  await provider.complete(intent.uploadId)
}
