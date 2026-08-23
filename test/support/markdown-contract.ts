export type SemanticTerm = string | RegExp

export interface SemanticClause {
  all: SemanticTerm[]
  none?: SemanticTerm[]
}

function withoutCodeFences(markdown: string): string {
  return markdown.replace(/```[\s\S]*?```/g, '')
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

export function semanticUnits(markdown: string): string[] {
  const units: string[] = []
  let current: string[] = []

  const flush = () => {
    const unit = current.join(' ').replace(/\s+/g, ' ').trim()
    if (unit)
      units.push(unit)
    current = []
  }

  for (const line of withoutCodeFences(markdown).split(/\r?\n/u)) {
    if (!line.trim()) {
      flush()
      continue
    }
    if (/^\s*(?:[-*+]|\d+\.)\s+/u.test(line))
      flush()
    current.push(line.trim())
  }
  flush()
  return units
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
  const unit = findSemanticUnit(markdown, terms)
  if (!unit)
    return markdown
  return markdown.replace(unit, mutate(unit))
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
  let cursor = -1
  for (const marker of markers) {
    const next = markdown.indexOf(marker, cursor + 1)
    if (next < 0)
      return false
    cursor = next
  }
  return true
}
