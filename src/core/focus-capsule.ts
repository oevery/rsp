import { Buffer } from 'node:buffer'
import { TextDecoder } from 'node:util'

import { MAX_FOCUS_CAPSULE_BYTES } from './config.js'

const FOCUS_CAPSULE_VERSION = '<!-- rsp-focus:v1 -->'
const LEGACY_WARNING = 'legacy focus capsule has no structured recovery projection'

export interface FocusCapsuleRecovery {
  version: 'v1'
  current: string
  evidence: string
  next: string
  resumeCheck: string | null
  authoritative: false
}

export type FocusCapsuleInspection
  = | { kind: 'empty', content: '' }
    | { kind: 'legacy', content: string, warning: typeof LEGACY_WARNING }
    | { kind: 'valid-v1', content: string, recovery: FocusCapsuleRecovery }
    | { kind: 'invalid', code: 'focus_capsule_too_large' | 'focus_capsule_invalid_utf8' | 'focus_capsule_invalid_v1', message: string }

export function inspectFocusCapsuleBytes(bytes: Uint8Array): FocusCapsuleInspection {
  if (bytes.byteLength > MAX_FOCUS_CAPSULE_BYTES) {
    return {
      kind: 'invalid',
      code: 'focus_capsule_too_large',
      message: `focus capsule exceeds ${MAX_FOCUS_CAPSULE_BYTES} UTF-8 bytes`,
    }
  }

  let content: string
  try {
    content = new TextDecoder('utf-8', { fatal: true }).decode(bytes)
  }
  catch {
    return { kind: 'invalid', code: 'focus_capsule_invalid_utf8', message: 'focus capsule must contain valid UTF-8' }
  }

  if (Buffer.byteLength(content, 'utf-8') > MAX_FOCUS_CAPSULE_BYTES) {
    return {
      kind: 'invalid',
      code: 'focus_capsule_too_large',
      message: `focus capsule exceeds ${MAX_FOCUS_CAPSULE_BYTES} UTF-8 bytes`,
    }
  }

  if (content.length === 0)
    return { kind: 'empty', content: '' }

  return parseFocusCapsule(content)
}

export function parseFocusCapsule(content: string): FocusCapsuleInspection {
  if (content.length === 0)
    return { kind: 'empty', content: '' }

  const lines = content.split(/\r?\n/)
  const versionLines = lines.flatMap((line, index) => line.trim() === FOCUS_CAPSULE_VERSION ? [index] : [])
  const reservedDeclarationLines = lines.flatMap((line, index) => /^\s*<!--\s*rsp-focus\b/i.test(line) ? [index] : [])
  if (versionLines.length === 0 && reservedDeclarationLines.length > 0)
    return invalidV1('focus capsule version declaration must be exactly <!-- rsp-focus:v1 -->')
  if (versionLines.length === 0)
    return { kind: 'legacy', content, warning: LEGACY_WARNING }

  const firstContentLine = lines.findIndex(line => line.trim().length > 0)
  if (versionLines.length !== 1 || versionLines[0] !== firstContentLine) {
    return invalidV1('focus capsule v1 must contain exactly one leading version declaration')
  }

  const values = new Map<string, string[]>()
  for (const [index, line] of lines.entries()) {
    if (line.trim().length === 0 || index === versionLines[0])
      continue
    const match = /^(Current|Evidence|Next|Resume check):(.*)$/.exec(line)
    if (!match)
      return invalidV1(`focus capsule v1 contains an unknown non-empty line: ${line.trim()}`)
    const entries = values.get(match[1]) ?? []
    entries.push(match[2].trim())
    values.set(match[1], entries)
  }

  for (const field of ['Current', 'Evidence', 'Next'] as const) {
    const entries = values.get(field) ?? []
    if (entries.length !== 1 || entries[0].length === 0)
      return invalidV1(`focus capsule v1 requires exactly one non-empty ${field} field`)
  }

  const resumeChecks = values.get('Resume check') ?? []
  if (resumeChecks.length > 1 || (resumeChecks.length === 1 && resumeChecks[0].length === 0))
    return invalidV1('focus capsule v1 allows at most one non-empty Resume check field')

  return {
    kind: 'valid-v1',
    content,
    recovery: {
      version: 'v1',
      current: values.get('Current')![0],
      evidence: values.get('Evidence')![0],
      next: values.get('Next')![0],
      resumeCheck: resumeChecks[0] ?? null,
      authoritative: false,
    },
  }
}

function invalidV1(message: string): FocusCapsuleInspection {
  return { kind: 'invalid', code: 'focus_capsule_invalid_v1', message }
}
