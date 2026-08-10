import type { CommandDiagnostic, RuntimeDiagnostic } from '../types.js'

export const SPECS_DEFAULT_RESULT_LIMIT = 20
export const SPECS_MAX_RESULT_LIMIT = 100
export const SPECS_MAX_CANDIDATES = 1000
export const SPECS_MAX_FILE_BYTES = 512 * 1024
export const SPECS_SEARCH_EXCERPT_CODE_POINTS = 240
export const SPECS_DETAIL_CONTENT_CODE_POINTS = 12000
export const SPECS_MAX_DIAGNOSTICS = 20

export type SpecsDocumentKind = 'spec' | 'decision-record'

export interface SpecsSourceIdentity {
  root: string
  gitHead: string | null
  gitBranch: string | null
  dirty: boolean | null
}

export interface SpecsHeading {
  depth: number
  title: string
  line: number
}

export interface SpecsDocumentRecord {
  path: string
  kind: SpecsDocumentKind
  title: string
  summary: string | null
  bytes: number
  headings: SpecsHeading[]
}

export interface SpecsDirectoryNode {
  name: string
  path: string
  directories: SpecsDirectoryNode[]
  documents: SpecsDocumentRecord[]
}

export interface GeneratedSpecsIndexClassification {
  path: string
  classification: 'safe-removal' | 'owner-controlled'
  reason: string
}

export interface SpecsInspection {
  source: SpecsSourceIdentity
  roots: {
    specs: string
    decisions: string
  }
  tree: SpecsDirectoryNode
  decisionRecords: SpecsDirectoryNode
  documents: SpecsDocumentRecord[]
  generatedIndexes: GeneratedSpecsIndexClassification[]
  diagnostics: CommandDiagnostic[]
  diagnosticSummary: {
    total: number
    returned: number
    hasMore: boolean
  }
  runtime: RuntimeDiagnostic[]
  limits: {
    candidates: number
    fileBytes: number
    results: number
    searchExcerptCodePoints: number
    detailContentCodePoints: number
  }
}

export interface SpecsDetailRecord extends SpecsDocumentRecord {
  content: string
  contentTruncated: boolean
}

export interface SpecsSearchMatch {
  path: string
  kind: SpecsDocumentKind
  title: string
  heading: string | null
  line: number
  excerpt: string
}

export interface SpecsSearchResult {
  matches: SpecsSearchMatch[]
  summary: {
    candidates: number
    searched: number
    matched: number
    returned: number
    hasMore: boolean
  }
}
