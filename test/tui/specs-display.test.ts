import type { SpecsDirectoryNode, SpecsDocumentRecord, SpecsSearchMatch } from '../../src/specs/model.js'
import type { SpecsTreeProjection } from '../../src/specs/projection.js'
import { describe, expect, it } from 'vitest'
import { displayWidth } from '../../src/tui/display.js'
import {
  flattenSpecsTree,
  formatSpecsSearchRow,
  formatSpecsTreeRow,
} from '../../src/tui/specs-display.js'

function document(path: string, title: string, kind: SpecsDocumentRecord['kind'] = 'spec', summary: string | null = null): SpecsDocumentRecord {
  return { path, title, kind, summary, bytes: 10, headings: [] }
}

function directory(path: string, name: string, directories: SpecsDirectoryNode[] = [], documents: SpecsDocumentRecord[] = []): SpecsDirectoryNode {
  return { path, name, directories, documents }
}

const specsRoot = directory('.rsp/specs', 'specs', [
  directory('.rsp/specs/platform', 'platform', [
    directory('.rsp/specs/platform/api', 'api', [], [
      document('.rsp/specs/platform/api/http.md', 'HTTP API', 'spec', '稳定的宽字符接口约定'),
    ]),
  ], [document('.rsp/specs/platform/overview.md', 'Platform Overview')]),
], [document('.rsp/specs/design.md', 'Project Design', 'spec', 'Stable facts')])

const decisionsRoot = directory('.rsp/specs/decisions', 'decisions', [], [
  document('.rsp/specs/decisions/transport.md', 'Choose HTTP', 'decision-record', 'Transport rationale'),
])

const projection = {
  mode: 'tree',
  source: { root: '/project', gitHead: 'abc', gitBranch: 'main', dirty: false },
  roots: { specs: '.rsp/specs', decisions: '.rsp/specs/decisions' },
  tree: specsRoot,
  decisionRecords: decisionsRoot,
  documents: [],
  generatedIndexes: [],
  diagnostics: [],
  diagnosticSummary: { total: 0, returned: 0, hasMore: false },
  runtime: [],
  limits: { candidates: 1000, fileBytes: 1024, results: 20, searchExcerptCodePoints: 240, detailContentCodePoints: 12000 },
} satisfies SpecsTreeProjection

describe('specs tree display projection', () => {
  it('keeps Specs and Decision Records as separate explicit roots', () => {
    const rows = flattenSpecsTree(projection, new Set())
    expect(rows).toEqual([
      expect.objectContaining({ type: 'root', rootKind: 'specs', label: 'Specs', key: '.rsp/specs', depth: 0, expanded: false }),
      expect.objectContaining({ type: 'root', rootKind: 'decision-records', label: 'Decision Records', key: '.rsp/specs/decisions', depth: 0, expanded: false }),
    ])
  })

  it('reveals nested directories only when their exact directory keys are expanded', () => {
    const collapsedNested = flattenSpecsTree(projection, new Set(['.rsp/specs', '.rsp/specs/decisions']))
    expect(collapsedNested.map(row => row.key)).toEqual([
      '.rsp/specs',
      '.rsp/specs/platform',
      '.rsp/specs/design.md',
      '.rsp/specs/decisions',
      '.rsp/specs/decisions/transport.md',
    ])

    const expandedNested = flattenSpecsTree(projection, new Set([
      '.rsp/specs',
      '.rsp/specs/platform',
      '.rsp/specs/platform/api',
      '.rsp/specs/decisions',
    ]))
    expect(expandedNested.map(row => [row.key, row.depth])).toEqual([
      ['.rsp/specs', 0],
      ['.rsp/specs/platform', 1],
      ['.rsp/specs/platform/api', 2],
      ['.rsp/specs/platform/api/http.md', 3],
      ['.rsp/specs/platform/overview.md', 2],
      ['.rsp/specs/design.md', 1],
      ['.rsp/specs/decisions', 0],
      ['.rsp/specs/decisions/transport.md', 1],
    ])
  })

  it('preserves exact project-relative document identity and presentation metadata', () => {
    const rows = flattenSpecsTree(projection, new Set(['.rsp/specs', '.rsp/specs/platform', '.rsp/specs/platform/api']))
    expect(rows).toContainEqual(expect.objectContaining({
      type: 'document',
      key: '.rsp/specs/platform/api/http.md',
      path: '.rsp/specs/platform/api/http.md',
      title: 'HTTP API',
      summary: '稳定的宽字符接口约定',
      kind: 'spec',
    }))
  })

  it.each([12, 40])('bounds tree rows containing wide characters to %i display cells', (width) => {
    const rows = flattenSpecsTree(projection, new Set(['.rsp/specs', '.rsp/specs/platform', '.rsp/specs/platform/api']))
    expect(rows.map(row => formatSpecsTreeRow(row, width)).every(row => displayWidth(row) <= width)).toBe(true)
  })
})

describe('specs search and document display', () => {
  it('formats bounded search rows with path, kind, line, heading, and excerpt', () => {
    const match: SpecsSearchMatch = {
      path: '.rsp/specs/platform/api/http.md',
      kind: 'spec',
      title: 'HTTP API',
      heading: '运行时边界',
      line: 42,
      excerpt: '当前工作树中的宽字符内容应当安全截断',
    }
    const row = formatSpecsSearchRow(match, 48)
    expect(displayWidth(row)).toBeLessThanOrEqual(48)
    expect(row).toContain('[spec]')
    expect(row).toContain('.rsp/specs')
    expect(row).toContain(':42')
  })
})
