export class OperationCancelled extends Error {}
export class GenerationFailed extends Error {
  constructor(cause) {
    super('Media generation failed', { cause })
  }
}

function isProviderAbort(error, signal) {
  return signal?.aborted || error?.name === 'AbortError' || error?.code === 'PROVIDER_ABORTED'
}

export async function generateWithProvider(provider, text, signal) {
  if (signal?.aborted)
    throw new OperationCancelled('Operation cancelled')

  try {
    const media = await provider.generate(text, { signal })
    if (signal?.aborted)
      throw new OperationCancelled('Operation cancelled')
    return media
  }
  catch (error) {
    if (error instanceof OperationCancelled)
      throw error
    if (isProviderAbort(error, signal))
      throw new OperationCancelled('Operation cancelled', { cause: error })
    throw new GenerationFailed(error)
  }
}
