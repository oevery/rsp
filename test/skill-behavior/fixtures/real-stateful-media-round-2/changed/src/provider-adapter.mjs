export class OperationCancelled extends Error {}
export class GenerationFailed extends Error {
  constructor(cause) {
    super('Media generation failed', { cause })
  }
}

export async function generateWithProvider(provider, text, signal) {
  if (signal?.aborted)
    throw new OperationCancelled('Operation cancelled')

  try {
    return await provider.generate(text, { signal })
  }
  catch (error) {
    throw new GenerationFailed(error)
  }
}
