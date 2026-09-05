export type SemanticTerm = string | RegExp

export interface SemanticClause {
  all: SemanticTerm[]
  none?: SemanticTerm[]
}

interface SemanticUnitSpan {
  end: number
  start: number
  value: string
}

function withoutCodeFences(markdown: string): string {
  return markdown.replace(/```[\s\S]*?```/g, block => block.replace(/[^\r\n]/g, ' '))
}

function matchesTerm(value: string, term: SemanticTerm): boolean {
  return typeof term === 'string' ? value.includes(term) : term.test(value)
}

export function markdownHeadings(markdown: string, levels = [2, 3]): string[] {
  const allowed = new Set(levels)
  return [...withoutCodeFences(markdown).matchAll(/^(#{1,6}) (.+)$/gm)]
    .filter(match => allowed.has(match[1]!.length))
    .map(match => match[2]!)
}

export function markdownLinks(markdown: string): string[] {
  return [...withoutCodeFences(markdown).matchAll(/\[[^\]]+\]\(([^)]+)\)/g)]
    .map(match => match[1]!)
}

export function markdownSection(markdown: string, heading: string): string {
  const lines = markdown.split(/\r?\n/)
  const start = lines.findIndex(line => /^#{1,6} /.test(line) && line.replace(/^#{1,6} /, '') === heading)
  if (start < 0)
    return ''

  const level = lines[start]!.match(/^(#{1,6}) /)![1]!.length
  const end = lines.findIndex((line, index) =>
    index > start
    && /^#{1,6} /.test(line)
    && line.match(/^(#{1,6}) /)![1]!.length <= level,
  )
  return lines.slice(start + 1, end < 0 ? undefined : end).join('\n')
}

function semanticUnitSpans(markdown: string): SemanticUnitSpan[] {
  const units: SemanticUnitSpan[] = []
  let current: string[] = []
  let currentStart = -1
  let currentEnd = -1

  const flush = () => {
    const unit = current.join(' ').replace(/\s+/g, ' ').trim()
    if (unit)
      units.push({ end: currentEnd, start: currentStart, value: unit })
    current = []
    currentStart = -1
    currentEnd = -1
  }

  const masked = withoutCodeFences(markdown)
  let offset = 0
  for (const line of masked.split(/\r?\n/u)) {
    if (!line.trim()) {
      flush()
      offset += line.length + (masked.slice(offset + line.length).startsWith('\r\n') ? 2 : 1)
      continue
    }
    if (/^\s*(?:[-*+]|\d+\.)\s+/u.test(line))
      flush()
    if (currentStart < 0)
      currentStart = offset
    current.push(line.trim())
    currentEnd = offset + line.length
    offset += line.length + (masked.slice(offset + line.length).startsWith('\r\n') ? 2 : 1)
  }
  flush()
  return units
}

export function semanticUnits(markdown: string): string[] {
  return semanticUnitSpans(markdown).map(unit => unit.value)
}

export function findSemanticUnit(markdown: string, terms: SemanticTerm[]): string | undefined {
  return semanticUnits(markdown).find(unit => terms.every(term => matchesTerm(unit, term)))
}

export function satisfiesSemanticContract(markdown: string, clauses: SemanticClause[]): boolean {
  return clauses.every(clause => semanticUnits(markdown).some(unit =>
    clause.all.every(term => matchesTerm(unit, term))
    && (clause.none ?? []).every(term => !matchesTerm(unit, term)),
  ))
}

export function mutateSemanticUnit(
  markdown: string,
  terms: SemanticTerm[],
  mutate: (unit: string) => string,
): string {
  const unit = semanticUnitSpans(markdown).find(({ value }) => terms.every(term => matchesTerm(value, term)))
  if (!unit)
    return markdown
  return `${markdown.slice(0, unit.start)}${mutate(unit.value)}${markdown.slice(unit.end)}`
}

export function inlineCodeValues(markdown: string): string[] {
  return [...markdown.matchAll(/`([^`\n]+)`/g)].map(match => match[1]!)
}

export function inlineCodeValuesInUnit(markdown: string, terms: SemanticTerm[]): string[] {
  return inlineCodeValues(findSemanticUnit(markdown, terms) ?? '')
}

export function canonicalEnum(markdown: string, name: string): string[] {
  const escapedName = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const match = markdown.match(new RegExp(`\`${escapedName}\`[^\\n]*?\\bexactly\\b([^\\n.;]+)`, 'u'))
  if (!match)
    return []
  return inlineCodeValues(match[1]!)
}

export function markdownListItem(markdown: string, label: string): string {
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return markdown.match(new RegExp(`^- ${escapedLabel}\\b.*$`, 'mu'))?.[0] ?? ''
}

export function orderedMarkers(markdown: string, markers: string[]): boolean {
  const visibleMarkdown = withoutCodeFences(markdown)
  let cursor = -1
  for (const marker of markers) {
    const next = visibleMarkdown.indexOf(marker, cursor + 1)
    if (next < 0)
      return false
    cursor = next
  }
  return true
}
