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
