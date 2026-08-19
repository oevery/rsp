import { readdirSync, readFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { describe, expect, it } from 'vitest'

import {
  appendDocumentSectionItem,
  CHANGE_DOCUMENT_SCHEMA,
  DocumentSectionCardinalityError,
  getDocumentSection,
  getDocumentSectionBody,
  getDocumentSections,
  getDocumentTitle,
  getDocumentTitles,
  parseRspDocument,
} from '../../src/core/document-model.js'

describe('semantic document model', () => {
  it('indexes canonical sections by semantic identity without accepting near matches', () => {
    const source = `# Change: example

## Proposal
- Outcome: preserve structure

## Design Constraints
- not the canonical Design section

## Design
- canonical design

## Tasks
- [ ] migrate consumers

## Custom Notes
- preserve me

## Verify
- [ ] run tests

## Blockers
- none
`

    const document = parseRspDocument(source, CHANGE_DOCUMENT_SCHEMA)

    expect(document.title).toBe('example')
    expect(getDocumentSectionBody(document, 'design')).toBe('- canonical design')
    expect(getDocumentSectionBody(document, 'tasks')).toBe('- [ ] migrate consumers')
    expect(document.unknownHeadings).toEqual(['Design Constraints', 'Custom Notes'])
    expect(document.missingSections).toEqual(['spec'])
  })

  it('retains duplicate canonical sections as structural evidence', () => {
    const source = `# Change: duplicate

## Tasks
- [ ] first

## Tasks
- [ ] second
`
    const document = parseRspDocument(source, CHANGE_DOCUMENT_SCHEMA)

    expect(getDocumentSections(document, 'tasks')).toHaveLength(2)
    expect(getDocumentSection(document, 'tasks')?.body).toBe('- [ ] first')
    expect(document.duplicateSections).toEqual(['tasks'])
  })

  it('retains title evidence while preserving consumer-specific legacy boundaries', () => {
    const source = `  # Change:leading
# Change: invalid title
# Change: canonical
`
    const document = parseRspDocument(source, CHANGE_DOCUMENT_SCHEMA)

    expect(document.title).toBe('leading')
    expect(getDocumentTitle(document, 'spaced')).toBe('invalid title')
    expect(getDocumentTitles(document, 'identity')).toEqual(['canonical'])
  })

  it('appends through an exact section span without rewriting surrounding content', () => {
    const source = `# Change: lossless

## Tasks
- [x] existing

## Custom Notes
keep  spacing

## Verify
- [x] existing
`
    const document = parseRspDocument(source, CHANGE_DOCUMENT_SCHEMA)
    const updated = appendDocumentSectionItem(document, 'tasks', '- [ ] appended')

    expect(updated).toBe(`# Change: lossless

## Tasks
- [x] existing

- [ ] appended

## Custom Notes
keep  spacing

## Verify
- [x] existing
`)
  })

  it('rejects surgical mutation when section cardinality is not exactly one', () => {
    const document = parseRspDocument('## Tasks\n\n## Tasks\n', CHANGE_DOCUMENT_SCHEMA)

    expect(() => appendDocumentSectionItem(document, 'tasks', '- [ ] unsafe')).toThrow(DocumentSectionCardinalityError)
  })

  it('preserves the legacy reopen insertion boundary for CRLF artifacts', () => {
    const source = ['# Change: crlf', '', '## Tasks', '- [x] existing', '', '## Verify', '- [x] existing', ''].join('\r\n')
    const document = parseRspDocument(source, CHANGE_DOCUMENT_SCHEMA)

    expect(appendDocumentSectionItem(document, 'tasks', '- [ ] appended')).toBe(legacyAppend(source, 'Tasks', '- [ ] appended'))
  })

  it('keeps canonical Markdown section literals centralized in the document schema', () => {
    const sourceRoot = join(process.cwd(), 'src')
    const allowed = new Set(['core/document-model.ts'])
    const rawCanonicalHeading = /^## (?:Proposal|Spec|Design|Tasks|Verify|Blockers|Goal|Scope|Shared Constraints|Slices|Completion Conditions|Durable Outcomes)$/m

    for (const path of walkTypeScriptFiles(sourceRoot)) {
      const logicalPath = relative(sourceRoot, path).replaceAll('\\', '/')
      if (!allowed.has(logicalPath))
        expect(readFileSync(path, 'utf-8'), logicalPath).not.toMatch(rawCanonicalHeading)
    }
  })
})

function walkTypeScriptFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name)
    return entry.isDirectory() ? walkTypeScriptFiles(path) : entry.name.endsWith('.ts') ? [path] : []
  })
}

function legacyAppend(content: string, heading: string, item: string): string {
  const match = new RegExp(`^## ${heading}[ \\t]*\\r?$`, 'gm').exec(content)!
  const sectionBodyStart = match.index + match[0].length
  const nextHeading = content.indexOf('\n## ', sectionBodyStart)
  const insertAt = nextHeading < 0 ? content.length : nextHeading
  const before = content.slice(0, insertAt)
  const separator = before.endsWith('\n\n') ? '' : before.endsWith('\n') ? '\n' : '\n\n'
  return `${before}${separator}${item}\n${content.slice(insertAt)}`
}
