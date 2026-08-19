export interface MediaResource {
  id: string
  state: 'pending' | 'ready'
  url: string | null
}

export function previewSource(resource: MediaResource): string | null {
  return resource.state === 'ready' ? resource.url : null
}

export function isDeliveryReady(resource: MediaResource): boolean {
  return resource.state === 'ready' && resource.url !== null
}

export function playbackSource(resource: MediaResource): string | null {
  return previewSource(resource)
}
