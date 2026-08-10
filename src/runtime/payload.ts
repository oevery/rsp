import type { RuntimeJson } from './model.js'
import { Buffer } from 'node:buffer'

import { RuntimeStoreError } from './model.js'

const MAX_DEPTH = 8
const MAX_COLLECTION_ITEMS = 128
const MAX_TOTAL_KEYS = 512
const MAX_STRING_BYTES = 4 * 1024

const prohibitedKeyIdentities = new Set([
  'chainofthought',
  'completeconversation',
  'conversation',
  'credential',
  'credentials',
  'hiddenreasoning',
  'log',
  'logs',
  'message',
  'messages',
  'prompt',
  'prompts',
  'rawcommandlog',
  'rawoutput',
  'reasoning',
  'stderr',
  'stdout',
])

const sensitiveKeyFragments = [
  'apikey',
  'authorization',
  'bearer',
  'cookie',
  'password',
  'privatekey',
  'secret',
  'sessionid',
  'token',
]

const sensitiveValuePatterns = [
  /\bbearer\s+[\w.~+/=-]{8,}/iu,
  /\b(?:gh[pousr]|github_pat)_\w{16,}/iu,
  /\bAKIA[0-9A-Z]{16}\b/u,
  /\b(?:r|s)k_(?:live|test)_[A-Za-z0-9]{16,}\b/u,
  /\bnpm_[A-Za-z0-9]{20,}\b/u,
  /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/u,
  /\bglpat-[\w-]{20,}\b/u,
  /\bAIza[\w-]{35}\b/u,
  /\beyJ[\w-]{5,}\.[\w-]{5,}\.[\w-]{5,}\b/u,
  /-----BEGIN [A-Z ]*PRIVATE KEY-----/u,
  /\b(?:api[_-]?key|authorization|cookie|password|secret|token)\s*[:=]\s*\S+/iu,
  /\b[a-z][a-z0-9+.-]*:\/\/[^/\s:@]+:[^/\s@]+@/iu,
]

const openAiCredentialCandidatePattern = /\bsk-[\w-]{20,}\b/gu

export interface SanitizedRuntimePayload {
  value: RuntimeJson
  json: string
  redactionCount: number
}

export function sanitizeRuntimePayload(
  input: unknown,
  maximumBytes: number,
  label: string,
): SanitizedRuntimePayload {
  if (!Number.isSafeInteger(maximumBytes) || maximumBytes <= 0)
    throw new RuntimeStoreError('runtime_payload_bound_invalid', `Invalid payload bound for ${label}`)

  let totalKeys = 0
  let redactionCount = 0
  const value = visit(input, '$', 0)
  const json = JSON.stringify(value)
  const bytes = Buffer.byteLength(json)
  if (bytes > maximumBytes) {
    throw new RuntimeStoreError(
      'runtime_payload_too_large',
      `${label} exceeds ${maximumBytes} bytes after redaction`,
    )
  }
  return { value, json, redactionCount }

  function visit(current: unknown, path: string, depth: number): RuntimeJson {
    if (depth > MAX_DEPTH)
      throw new RuntimeStoreError('runtime_payload_invalid', `${label} exceeds the maximum nesting depth at ${path}`)
    if (current === null || typeof current === 'boolean')
      return current
    if (typeof current === 'number') {
      if (!Number.isFinite(current))
        throw new RuntimeStoreError('runtime_payload_invalid', `${label} contains a non-finite number at ${path}`)
      return current
    }
    if (typeof current === 'string')
      return sanitizeString(current, path)
    if (Array.isArray(current)) {
      if (current.length > MAX_COLLECTION_ITEMS) {
        throw new RuntimeStoreError(
          'runtime_payload_invalid',
          `${label} array exceeds ${MAX_COLLECTION_ITEMS} items at ${path}`,
        )
      }
      return current.map((item, index) => visit(item, `${path}[${index}]`, depth + 1))
    }
    if (typeof current !== 'object' || current === undefined) {
      throw new RuntimeStoreError(
        'runtime_payload_invalid',
        `${label} must contain only JSON values at ${path}`,
      )
    }
    const prototype = Object.getPrototypeOf(current)
    if (prototype !== Object.prototype && prototype !== null)
      throw new RuntimeStoreError('runtime_payload_invalid', `${label} contains a non-plain object at ${path}`)
    const entries = Object.entries(current as Record<string, unknown>)
    if (entries.length > MAX_COLLECTION_ITEMS) {
      throw new RuntimeStoreError(
        'runtime_payload_invalid',
        `${label} object exceeds ${MAX_COLLECTION_ITEMS} fields at ${path}`,
      )
    }
    const result: Record<string, RuntimeJson> = {}
    for (const [key, nested] of entries) {
      if (!key || Buffer.byteLength(key) > 256 || /[\0\r\n]/u.test(key))
        throw new RuntimeStoreError('runtime_payload_invalid', `${label} contains an invalid field name at ${path}`)
      totalKeys += 1
      if (totalKeys > MAX_TOTAL_KEYS)
        throw new RuntimeStoreError('runtime_payload_invalid', `${label} exceeds ${MAX_TOTAL_KEYS} total fields`)
      const identity = normalizeKey(key)
      if (prohibitedKeyIdentities.has(identity)) {
        throw new RuntimeStoreError(
          'runtime_payload_prohibited',
          `${label} cannot persist prompts, reasoning, conversations, credentials, command logs, or raw process output`,
        )
      }
      if (sensitiveKeyFragments.some(fragment => identity.includes(fragment))) {
        redactionCount += 1
        result[key] = '[REDACTED]'
        continue
      }
      result[key] = visit(nested, `${path}.${key}`, depth + 1)
    }
    return result
  }

  function sanitizeString(value: string, path: string): string {
    if (value.includes('\0'))
      throw new RuntimeStoreError('runtime_payload_invalid', `${label} contains a NUL byte at ${path}`)
    if (Buffer.byteLength(value) > MAX_STRING_BYTES) {
      throw new RuntimeStoreError(
        'runtime_payload_invalid',
        `${label} string exceeds ${MAX_STRING_BYTES} bytes at ${path}`,
      )
    }
    if (containsOpenAiCredential(value)
      || sensitiveValuePatterns.some(pattern => pattern.test(value))) {
      redactionCount += 1
      return '[REDACTED]'
    }
    return value
  }
}

function containsOpenAiCredential(value: string): boolean {
  for (const match of value.matchAll(openAiCredentialCandidatePattern)) {
    const candidate = match[0]
    const structuredPrefix = candidate.startsWith('sk-proj-')
      ? 'sk-proj-'
      : candidate.startsWith('sk-svcacct-')
        ? 'sk-svcacct-'
        : null
    if (structuredPrefix) {
      const payload = candidate.slice(structuredPrefix.length)
      if (payload.length >= 20 && /[A-Z0-9_]/u.test(payload))
        return true
      continue
    }

    const payload = candidate.slice(3)
    if (payload.length >= 32
      && /^[A-Za-z0-9]+$/u.test(payload)
      && /[A-Z]/u.test(payload)
      && /[a-z]/u.test(payload)
      && /\d/u.test(payload)) {
      return true
    }
  }
  return false
}

export function parseRuntimeJson(value: string, label: string): RuntimeJson {
  try {
    return JSON.parse(value) as RuntimeJson
  }
  catch {
    throw new RuntimeStoreError('runtime_database_corrupt', `Stored ${label} is not valid JSON`)
  }
}

function normalizeKey(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/gu, '')
}
