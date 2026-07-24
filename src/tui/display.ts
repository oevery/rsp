const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })

function isWide(codePoint: number): boolean {
  return codePoint >= 0x1100 && (
    codePoint <= 0x115F
    || codePoint === 0x2329
    || codePoint === 0x232A
    || (codePoint >= 0x2E80 && codePoint <= 0xA4CF && codePoint !== 0x303F)
    || (codePoint >= 0xAC00 && codePoint <= 0xD7A3)
    || (codePoint >= 0xF900 && codePoint <= 0xFAFF)
    || (codePoint >= 0xFE10 && codePoint <= 0xFE19)
    || (codePoint >= 0xFE30 && codePoint <= 0xFE6F)
    || (codePoint >= 0xFF00 && codePoint <= 0xFF60)
    || (codePoint >= 0xFFE0 && codePoint <= 0xFFE6)
    || (codePoint >= 0x1F300 && codePoint <= 0x1FAFF)
    || (codePoint >= 0x20000 && codePoint <= 0x3FFFD)
  )
}

export function displayWidth(value: string): number {
  let width = 0
  for (const { segment } of segmenter.segment(value)) {
    const codePoint = segment.codePointAt(0) ?? 0
    if (/^\p{Mark}$/u.test(segment) || codePoint === 0x200D)
      continue
    width += isWide(codePoint) ? 2 : 1
  }
  return width
}

export function truncateDisplay(value: string, maxWidth: number): string {
  if (displayWidth(value) <= maxWidth)
    return value
  if (maxWidth <= 1)
    return '…'.slice(0, maxWidth)
  let result = ''
  for (const { segment } of segmenter.segment(value)) {
    if (displayWidth(result + segment) > maxWidth - 1)
      break
    result += segment
  }
  return `${result}…`
}

export function wrapDisplay(value: string, maxWidth: number, firstPrefix = '', continuationPrefix = firstPrefix): string[] {
  const width = Math.max(1, maxWidth)
  if (displayWidth(firstPrefix) >= width)
    return [truncateDisplay(`${firstPrefix}${value}`, width)]

  const lines: string[] = []
  let prefix = firstPrefix
  let line = prefix
  const pushLine = () => {
    lines.push(line)
    prefix = continuationPrefix
    line = prefix
  }
  const appendUnbroken = (token: string) => {
    for (const { segment } of segmenter.segment(token)) {
      if (displayWidth(line + segment) > width && line !== prefix)
        pushLine()
      if (displayWidth(line + segment) > width) {
        lines.push(truncateDisplay(line + segment, width))
        prefix = continuationPrefix
        line = prefix
        continue
      }
      line += segment
    }
  }

  let pendingWhitespace = ''
  for (const token of value.split(/(\s+)/u).filter(Boolean)) {
    if (token.trim().length === 0) {
      if (line !== prefix)
        pendingWhitespace += token
      continue
    }

    const separator = line === prefix ? '' : pendingWhitespace
    if (displayWidth(line + separator + token) <= width) {
      line += `${separator}${token}`
    }
    else {
      if (line !== prefix && separator)
        pushLine()
      appendUnbroken(token)
    }
    pendingWhitespace = ''
  }
  if (line !== prefix || lines.length === 0)
    lines.push(line)
  return lines
}
