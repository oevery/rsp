export interface WebRedactionContext {
  checkoutRoots?: readonly string[]
  sensitiveUrls?: readonly string[]
}

export interface WebSensitiveTextRange {
  start: number
  end: number
  startLine: number
  endLine: number
}

const sensitivePatterns = [
  /\bbearer\s+[\w.~+/=-]{8,}/giu,
  /\b(?:gh[pousr]|github_pat)_\w{16,}/gu,
  /\bAKIA[0-9A-Z]{16}\b/gu,
  /\b(?:r|s)k_(?:live|test)_[A-Za-z0-9]{16,}\b/gu,
  /\bnpm_[A-Za-z0-9]{20,}\b/gu,
  /\bxox[baprs]-[A-Za-z0-9-]{10,}\b/gu,
  /\bglpat-[\w-]{20,}\b/gu,
  /\bAIza[\w-]{35}\b/gu,
  /\beyJ[\w-]{5,}\.[\w-]{5,}\.[\w-]{5,}\b/gu,
  /\b(?:api[_-]?key|authorization|cookie|password|secret|token)\s*[:=]\s*\S+/giu,
  /\b[a-z][a-z0-9+.-]*:\/\/[^/\s:@]+:[^/\s@]+@/giu,
]

const openAiCredentialCandidatePattern = /\bsk-[\w-]{20,}\b/gu

export function redactWebText(value: string, context: WebRedactionContext = {}): string {
  let redacted = redactExactContext(value, context)
  redacted = redactPrivateKeyBlocks(redacted)
  for (const pattern of sensitivePatterns)
    redacted = redacted.replace(pattern, '[REDACTED]')
  redacted = redacted.replace(openAiCredentialCandidatePattern, candidate =>
    isOpenAiCredential(candidate) ? '[REDACTED]' : candidate)
  return redacted
}

export function boundWebText(
  value: string,
  maximumCodePoints: number,
  context: WebRedactionContext = {},
): string {
  const redacted = redactWebText(value.replace(/\0/gu, ''), context)
  const codePoints = [...redacted]
  return codePoints.length > maximumCodePoints
    ? `${codePoints.slice(0, maximumCodePoints).join('')}…`
    : redacted
}

export function boundWebTextItems(
  values: readonly string[],
  maximumCodePoints: number,
  context: WebRedactionContext = {},
): string[] {
  const ranges = findPrivateKeyRanges(values.join('\n'))
  const redacted: string[] = []
  let previousSensitive = false
  for (const [index, value] of values.entries()) {
    const sensitive = isWebSensitiveLine(ranges, index + 1)
    if (sensitive) {
      if (!previousSensitive)
        redacted.push('[REDACTED]')
      previousSensitive = true
      continue
    }
    previousSensitive = false
    redacted.push(boundWebText(value, maximumCodePoints, context))
  }
  return redacted
}

export function findPrivateKeyRanges(value: string): WebSensitiveTextRange[] {
  const ranges: WebSensitiveTextRange[] = []
  const beginPattern = /-----BEGIN ([A-Z0-9 ]*PRIVATE KEY)-----/gu
  let cursor = 0
  for (const match of value.matchAll(beginPattern)) {
    const start = match.index
    if (start < cursor)
      continue
    const endMarker = `-----END ${match[1]}-----`
    const endStart = value.indexOf(endMarker, start + match[0].length)
    const end = endStart >= 0 ? endStart + endMarker.length : value.length
    ranges.push({
      start,
      end,
      startLine: lineNumberAt(value, start),
      endLine: lineNumberAt(value, Math.max(start, end - 1)),
    })
    cursor = end
  }
  return ranges
}

export function isWebSensitiveLine(
  ranges: readonly Pick<WebSensitiveTextRange, 'startLine' | 'endLine'>[],
  line: number,
): boolean {
  return ranges.some(range => line >= range.startLine && line <= range.endLine)
}

export function mergeWebRedactionContexts(
  ...contexts: WebRedactionContext[]
): WebRedactionContext {
  return {
    checkoutRoots: uniqueExactValues(contexts.flatMap(context => context.checkoutRoots ?? [])),
    sensitiveUrls: uniqueExactValues(contexts.flatMap(context => context.sensitiveUrls ?? [])),
  }
}

function redactExactContext(value: string, context: WebRedactionContext): string {
  let redacted = value
  const roots = uniqueExactValues(context.checkoutRoots ?? [])
    .filter(root => root !== '/' && root !== '\\')
    .flatMap(root => root.includes('\\') ? [root, root.replaceAll('\\', '/')] : [root])
  const sensitiveUrls = uniqueExactValues(context.sensitiveUrls ?? [])
    .filter(candidate => candidate.length >= 8)
  for (const root of roots.sort((left, right) => right.length - left.length))
    redacted = replaceCheckoutRoot(redacted, root)
  return redactSensitiveUrlTokens(redacted, sensitiveUrls)
}

function uniqueExactValues(values: readonly string[]): string[] {
  return [...new Set(values.filter(value => typeof value === 'string' && value !== ''))]
}

function redactPrivateKeyBlocks(value: string): string {
  const ranges = findPrivateKeyRanges(value)
  if (ranges.length === 0)
    return value
  let redacted = ''
  let cursor = 0
  for (const range of ranges) {
    redacted += `${value.slice(cursor, range.start)}[REDACTED]`
    cursor = range.end
  }
  return `${redacted}${value.slice(cursor)}`
}

function replaceCheckoutRoot(value: string, root: string): string {
  let result = ''
  let cursor = 0
  while (cursor < value.length) {
    const index = value.indexOf(root, cursor)
    if (index < 0)
      return `${result}${value.slice(cursor)}`
    const before = index === 0 ? '' : value[index - 1]!
    const afterIndex = index + root.length
    const after = afterIndex >= value.length ? '' : value[afterIndex]!
    result += value.slice(cursor, index)
    if (isRootBoundaryBefore(before) && isRootBoundaryAfter(after)) {
      result += '[CHECKOUT]'
      cursor = afterIndex
    }
    else {
      result += value.slice(index, afterIndex)
      cursor = afterIndex
    }
  }
  return result
}

function isRootBoundaryBefore(value: string): boolean {
  return value === '' || !isPathTokenCharacter(value)
}

function isRootBoundaryAfter(value: string): boolean {
  return value === ''
    || value === '/'
    || value === '\\'
    || !isPathTokenCharacter(value)
}

function isPathTokenCharacter(value: string): boolean {
  return /[\p{L}\p{N}._~%-]/u.test(value)
}

function redactSensitiveUrlTokens(value: string, sensitiveUrls: string[]): string {
  const normalized = new Set(sensitiveUrls.map(normalizeUrl).filter((url): url is string => url !== null))
  if (normalized.size === 0)
    return value
  return value.replace(
    /https?:\/\/[^\s<>"'`]+/giu,
    (token, offset: number, source: string) => redactUrlToken(token, normalized, source.slice(0, offset)),
  )
}

function redactUrlToken(
  token: string,
  sensitiveUrls: Set<string>,
  prefix: string,
): string {
  let candidate = token
  let suffix = ''
  const markdownDelimiters = trailingMarkdownDelimiters(prefix)
  let markdownDelimiterIndex = markdownDelimiters.length - 1
  while (candidate !== '') {
    const normalized = normalizeUrl(candidate)
    if (normalized && sensitiveUrls.has(normalized))
      return `[REDACTED]${suffix}`
    const markdownDelimiter = markdownDelimiterIndex >= 0
      ? markdownDelimiters[markdownDelimiterIndex]
      : undefined
    if (markdownDelimiter) {
      if (candidate.endsWith(markdownDelimiter)) {
        candidate = candidate.slice(0, -markdownDelimiter.length)
        suffix = `${markdownDelimiter}${suffix}`
        markdownDelimiterIndex -= 1
        continue
      }
    }
    const trailing = candidate.at(-1)!
    if (!/[),.;:!?\]}]/u.test(trailing))
      break
    candidate = candidate.slice(0, -1)
    suffix = `${trailing}${suffix}`
  }
  return token
}

function trailingMarkdownDelimiters(prefix: string): string[] {
  const delimiters: string[] = []
  let cursor = prefix.length
  while (cursor > 0 && delimiters.length < 4) {
    const leading = prefix.slice(0, cursor)
    const delimiter = ['**', '~~', '_'].find(candidate => leading.endsWith(candidate))
    if (!delimiter)
      break
    delimiters.push(delimiter)
    cursor -= delimiter.length
  }
  return delimiters
}

function normalizeUrl(value: string): string | null {
  try {
    const parsed = new URL(value)
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:')
      return null
    return parsed.href
  }
  catch {
    return null
  }
}

function lineNumberAt(value: string, offset: number): number {
  let line = 1
  for (let index = 0; index < offset; index++) {
    if (value[index] === '\n')
      line += 1
  }
  return line
}

function isOpenAiCredential(candidate: string): boolean {
  const structuredPrefix = candidate.startsWith('sk-proj-')
    ? 'sk-proj-'
    : candidate.startsWith('sk-svcacct-')
      ? 'sk-svcacct-'
      : null
  if (structuredPrefix) {
    const payload = candidate.slice(structuredPrefix.length)
    return payload.length >= 20 && /[A-Z0-9_]/u.test(payload)
  }

  const payload = candidate.slice(3)
  return payload.length >= 32
    && /^[A-Za-z0-9]+$/u.test(payload)
    && /[A-Z]/u.test(payload)
    && /[a-z]/u.test(payload)
    && /\d/u.test(payload)
}
