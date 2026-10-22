import { compareVersions, isExactVersion } from './project-version.js'

export interface UpdateNotice {
  status: 'current' | 'available' | 'unavailable'
  current: string
  latest?: string
}

/** Explicit metadata-only check. Ordinary commands never call the registry. */
export async function checkForUpdates(current: string): Promise<UpdateNotice> {
  try {
    const response = await fetch('https://registry.npmjs.org/-/package/@oevery%2Frsp/dist-tags', {
      signal: AbortSignal.timeout(2000),
      redirect: 'error',
    })
    if (!response.ok)
      throw new Error('registry unavailable')
    const body = await response.text()
    if (body.length > 16384)
      throw new Error('registry metadata exceeded bound')
    const latest: unknown = JSON.parse(body)?.latest
    if (typeof latest !== 'string' || !isExactVersion(latest) || !/^\d+\.\d+\.\d+$/.test(latest))
      throw new Error('invalid stable version')
    return { status: compareVersions(latest, current) > 0 ? 'available' : 'current', current, latest }
  }
  catch {
    return { status: 'unavailable', current }
  }
}
