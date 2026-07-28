export interface DocumentSectionDefinition<SectionId extends string> {
  id: SectionId
  heading: string
}

export interface RspDocumentSchema<SectionId extends string> {
  titlePrefix: string
  sections: readonly DocumentSectionDefinition<SectionId>[]
}

export const CHANGE_DOCUMENT_SCHEMA = {
  titlePrefix: '# Change:',
  sections: [
    { id: 'proposal', heading: 'Proposal' },
    { id: 'spec', heading: 'Spec' },
    { id: 'design', heading: 'Design' },
    { id: 'tasks', heading: 'Tasks' },
    { id: 'verify', heading: 'Verify' },
    { id: 'blockers', heading: 'Blockers' },
  ],
} as const satisfies RspDocumentSchema<string>

export type ChangeSectionId = typeof CHANGE_DOCUMENT_SCHEMA.sections[number]['id']

export const GROUP_BRIEF_DOCUMENT_SCHEMA = {
  titlePrefix: '# Change Group:',
  sections: [
    { id: 'goal', heading: 'Goal' },
    { id: 'scope', heading: 'Scope' },
    { id: 'sharedConstraints', heading: 'Shared Constraints' },
    { id: 'slices', heading: 'Slices' },
    { id: 'completionConditions', heading: 'Completion Conditions' },
    { id: 'durableOutcomes', heading: 'Durable Outcomes' },
    { id: 'blockers', heading: 'Blockers' },
  ],
} as const satisfies RspDocumentSchema<string>

export type GroupBriefSectionId = typeof GROUP_BRIEF_DOCUMENT_SCHEMA.sections[number]['id']

export interface DocumentSection<SectionId extends string> {
  id: SectionId
  heading: string
  canonical: boolean
  body: string
  headingStart: number
  headingEnd: number
  bodyStart: number
  bodyEnd: number
}

export interface ParsedRspDocument<SectionId extends string> {
  source: string
  schema: RspDocumentSchema<SectionId>
  title: string | null
  titles: string[]
  titleOccurrences: DocumentTitleOccurrence[]
  sections: ReadonlyMap<SectionId, readonly DocumentSection<SectionId>[]>
  unknownHeadings: string[]
  missingSections: SectionId[]
  duplicateSections: SectionId[]
}

export interface DocumentTitleOccurrence {
  value: string
  identityCompatible: boolean
  spaced: boolean
}

interface ObservedHeading {
  heading: string
  canonical: boolean
  start: number
  end: number
}

export class DocumentSectionCardinalityError extends Error {
  constructor(
    readonly sectionId: string,
    readonly count: number,
  ) {
    super(`document must contain exactly one ${sectionId} section; found ${count}`)
    this.name = 'DocumentSectionCardinalityError'
  }
}

/** Parse canonical RSP structure while retaining the original source and exact section spans. */
export function parseRspDocument<SectionId extends string>(
  source: string,
  schema: RspDocumentSchema<SectionId>,
): ParsedRspDocument<SectionId> {
  const definitionsByHeading = new Map(schema.sections.map(definition => [definition.heading, definition]))
  const observedHeadings = collectLevelTwoHeadings(source)
  const sections = new Map<SectionId, DocumentSection<SectionId>[]>()
  const unknownHeadings: string[] = []

  for (let index = 0; index < observedHeadings.length; index++) {
    const observed = observedHeadings[index]
    const definition = definitionsByHeading.get(observed.heading)
    if (!definition) {
      unknownHeadings.push(observed.heading)
      continue
    }
    const nextHeading = observedHeadings[index + 1]
    const bodyEnd = nextHeading ? lineBreakStart(source, nextHeading.start) : source.length
    const section: DocumentSection<SectionId> = {
      id: definition.id,
      heading: definition.heading,
      canonical: observed.canonical,
      body: source.slice(observed.end, bodyEnd).trim(),
      headingStart: observed.start,
      headingEnd: observed.end,
      bodyStart: observed.end,
      bodyEnd,
    }
    const matches = sections.get(definition.id) ?? []
    matches.push(section)
    sections.set(definition.id, matches)
  }

  const missingSections = schema.sections
    .filter(definition => !sections.has(definition.id))
    .map(definition => definition.id)
  const duplicateSections = schema.sections
    .filter(definition => (sections.get(definition.id)?.length ?? 0) > 1)
    .map(definition => definition.id)

  const titleOccurrences = collectDocumentTitles(source, schema.titlePrefix)
  const titles = titleOccurrences.map(title => title.value)
  return {
    source,
    schema,
    title: titles[0] ?? null,
    titles,
    titleOccurrences,
    sections,
    unknownHeadings,
    missingSections,
    duplicateSections,
  }
}

/** Return title values using the compatibility boundary owned by a production consumer. */
export function getDocumentTitles<SectionId extends string>(
  document: ParsedRspDocument<SectionId>,
  compatibility: 'broad' | 'identity' | 'spaced' = 'broad',
): string[] {
  if (compatibility === 'broad')
    return document.titles
  return document.titleOccurrences
    .filter(title => compatibility === 'identity' ? title.identityCompatible : title.spaced)
    .map(title => title.value)
}

/** Return the first title value for one explicit compatibility boundary. */
export function getDocumentTitle<SectionId extends string>(
  document: ParsedRspDocument<SectionId>,
  compatibility: 'broad' | 'identity' | 'spaced' = 'broad',
): string | null {
  return getDocumentTitles(document, compatibility)[0] ?? null
}

/** Return every canonical occurrence for one semantic section identity. */
export function getDocumentSections<SectionId extends string>(
  document: ParsedRspDocument<SectionId>,
  sectionId: SectionId,
): readonly DocumentSection<SectionId>[] {
  return document.sections.get(sectionId) ?? []
}

/** Return the first canonical occurrence, matching the legacy read behavior. */
export function getDocumentSection<SectionId extends string>(
  document: ParsedRspDocument<SectionId>,
  sectionId: SectionId,
): DocumentSection<SectionId> | undefined {
  return getDocumentSections(document, sectionId)[0]
}

/** Return one semantic section body or an empty string when it is absent. */
export function getDocumentSectionBody<SectionId extends string>(
  document: ParsedRspDocument<SectionId>,
  sectionId: SectionId,
): string {
  return getDocumentSection(document, sectionId)?.body ?? ''
}

/** Return the semantic definition for one canonical persisted heading. */
export function getDocumentSectionDefinitionByHeading<SectionId extends string>(
  schema: RspDocumentSchema<SectionId>,
  heading: string,
): DocumentSectionDefinition<SectionId> | undefined {
  return schema.sections.find(candidate => candidate.heading === heading)
}

/** Return canonical persisted headings in schema order. */
export function getCanonicalSectionHeadings<SectionId extends string>(schema: RspDocumentSchema<SectionId>): string[] {
  return schema.sections.map(section => section.heading)
}

/** Render the one canonical persisted heading owned by a semantic section identity. */
export function renderDocumentSectionHeading<SectionId extends string>(
  schema: RspDocumentSchema<SectionId>,
  sectionId: SectionId,
): string {
  const definition = schema.sections.find(candidate => candidate.id === sectionId)
  if (!definition)
    throw new Error(`unknown document section: ${sectionId}`)
  return `## ${definition.heading}`
}

/** Render the one canonical persisted identity heading owned by a document schema. */
export function renderDocumentTitle<SectionId extends string>(schema: RspDocumentSchema<SectionId>, title: string): string {
  return `${schema.titlePrefix} ${title}`
}

/** Append one item to exactly one section without re-rendering any other source bytes. */
export function appendDocumentSectionItem<SectionId extends string>(
  document: ParsedRspDocument<SectionId>,
  sectionId: SectionId,
  item: string,
): string {
  const matches = getDocumentSections(document, sectionId)
  if (matches.length !== 1)
    throw new DocumentSectionCardinalityError(sectionId, matches.length)

  const insertAt = matches[0].bodyEnd
  const before = document.source.slice(0, insertAt)
  const separator = before.endsWith('\n\n') ? '' : before.endsWith('\n') ? '\n' : '\n\n'
  return `${before}${separator}${item}\n${document.source.slice(insertAt)}`
}

function collectLevelTwoHeadings(source: string): ObservedHeading[] {
  const headings: ObservedHeading[] = []
  const pattern = /^## ([^\r\n]+)\r?$/gm
  let match
  // eslint-disable-next-line no-cond-assign
  while ((match = pattern.exec(source)) !== null) {
    const heading = match[1].trimEnd()
    headings.push({
      heading,
      canonical: heading === match[1],
      start: match.index,
      end: match.index + match[0].length,
    })
  }
  return headings
}

function collectDocumentTitles(source: string, prefix: string): DocumentTitleOccurrence[] {
  const titles: DocumentTitleOccurrence[] = []
  for (const line of source.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed.startsWith(prefix))
      continue
    const identity = line.startsWith(prefix) ? line.slice(prefix.length).match(/^\s+(\S+)\s*$/) : null
    titles.push({
      value: trimmed.slice(prefix.length).trim(),
      identityCompatible: identity !== null,
      spaced: line.startsWith(`${prefix} `),
    })
  }
  return titles
}

function lineBreakStart(source: string, headingStart: number): number {
  if (headingStart > 0 && source[headingStart - 1] === '\n')
    return headingStart - 1
  return headingStart
}
