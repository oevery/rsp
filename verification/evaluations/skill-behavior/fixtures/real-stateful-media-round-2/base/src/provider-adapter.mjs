export class OperationCancelled extends Error {}

export async function generateWithProvider(provider, text, signal) {
  return provider.generate(text, { signal })
}
