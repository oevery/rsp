import type { WebProjector } from './model.js'
import { execFile } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { BrokerError } from '../broker/protocol.js'
import { isWebOverviewProjection } from './model.js'

const execFileAsync = promisify(execFile)
const WEB_PROJECTOR_MAX_BYTES = 128 * 1024
const WEB_PROJECTOR_TIMEOUT_MS = 5_000

export function createWebProjector(
  entry = fileURLToPath(new URL('./web-projector.mjs', import.meta.url)),
  options: {
    maxBufferBytes?: number
    timeoutMs?: number
  } = {},
): WebProjector {
  const maxBufferBytes = options.maxBufferBytes ?? WEB_PROJECTOR_MAX_BYTES
  const timeoutMs = options.timeoutMs ?? WEB_PROJECTOR_TIMEOUT_MS
  return {
    async overview(root) {
      let stdout: string
      try {
        const result = await execFileAsync(process.execPath, [entry], {
          cwd: root,
          encoding: 'utf8',
          maxBuffer: maxBufferBytes,
          timeout: timeoutMs,
          windowsHide: true,
        })
        stdout = result.stdout
      }
      catch {
        throw new BrokerError('web_overview_unavailable', 'Unable to derive the current project overview')
      }
      let parsed: unknown
      try {
        parsed = JSON.parse(stdout)
      }
      catch {
        throw new BrokerError('web_projection_invalid', 'Web overview projector returned invalid JSON')
      }
      if (!isObject(parsed)
        || parsed.ok !== true
        || !isWebOverviewProjection(parsed.overview)
        || !Array.isArray(parsed.openWorkRefs)
        || !parsed.openWorkRefs.every(isWorkRef)
        || !Array.isArray(parsed.sensitiveUrls)
        || !parsed.sensitiveUrls.every(isSensitiveUrl)) {
        throw new BrokerError('web_projection_invalid', 'Web overview projector returned an incompatible projection')
      }
      return {
        projection: parsed.overview,
        openWorkRefs: [...new Set(parsed.openWorkRefs)].sort(),
        sensitiveUrls: [...new Set(parsed.sensitiveUrls)].sort(),
      }
    },
  }
}

function isObject(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isWorkRef(value: unknown): value is string {
  return typeof value === 'string'
    && value.length > 0
    && value.length <= 512
    && !value.includes('\0')
}

function isSensitiveUrl(value: unknown): value is string {
  if (typeof value !== 'string')
    return false
  try {
    const parsed = new URL(value)
    return (parsed.protocol === 'http:' || parsed.protocol === 'https:')
      && parsed.username === ''
      && parsed.password === ''
      && parsed.hash === ''
  }
  catch {
    return false
  }
}
