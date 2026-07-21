export interface MediaResource {
  id: string
  state: 'pending' | 'ready'
  url: string | null
}

export function previewSource(resource: MediaResource): string | null {
  return resource.state === 'ready' && resource.url ? resource.url : null
}

export function isDeliveryReady(resource: MediaResource): boolean {
  return resource.state === 'ready' && Boolean(resource.url)
}

export function playbackSource(resource: MediaResource): string | null {
  if (resource.state !== 'ready' || !resource.url)
    return null

  try {
    const parsed = new URL(resource.url)
    if ((parsed.protocol !== 'http:' && parsed.protocol !== 'https:') || parsed.username || parsed.password)
      return null
    return parsed.href
  }
  catch {
    return null
  }
}
