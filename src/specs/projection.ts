import type {
  SpecsDetailRecord,
  SpecsDirectoryNode,
  SpecsDocumentRecord,
  SpecsInspection,
  SpecsSearchMatch,
  SpecsSearchResult,
} from './model.js'
import { readSpecsDetail, searchSpecs, specsInspectionComplete, SpecsQueryError } from './query.js'

interface SpecsProjectionBase {
  source: SpecsInspection['source']
  roots: SpecsInspection['roots']
  generatedIndexes: SpecsInspection['generatedIndexes']
  diagnostics: SpecsInspection['diagnostics']
  diagnosticSummary: SpecsInspection['diagnosticSummary']
  runtime: SpecsInspection['runtime']
  limits: SpecsInspection['limits']
}

export interface SpecsTreeProjection extends SpecsProjectionBase {
  mode: 'tree'
  tree: SpecsDirectoryNode
  decisionRecords: SpecsDirectoryNode
  documents: SpecsDocumentRecord[]
}

export interface SpecsDetailProjection extends SpecsProjectionBase {
  mode: 'detail'
  document: SpecsDetailRecord
}

export interface SpecsSearchProjection extends SpecsProjectionBase {
  mode: 'search'
  query: {
    literal: string
    limit: number
    excerptCodePoints: number
  }
  matches: SpecsSearchMatch[]
  summary: SpecsSearchResult['summary']
}

export function projectSpecsTree(inspection: SpecsInspection): SpecsTreeProjection {
  assertCompleteInspection(inspection)
  return {
    ...projectionBase(inspection),
    mode: 'tree',
    tree: inspection.tree,
    decisionRecords: inspection.decisionRecords,
    documents: inspection.documents,
  }
}

export async function projectSpecsDetail(inspection: SpecsInspection, path: string): Promise<SpecsDetailProjection> {
  assertCompleteInspection(inspection)
  return {
    ...projectionBase(inspection),
    mode: 'detail',
    document: await readSpecsDetail(inspection, path),
  }
}

export async function projectSpecsSearch(
  inspection: SpecsInspection,
  literal: string,
  options: { limit: number, excerptCodePoints: number },
): Promise<SpecsSearchProjection> {
  assertCompleteInspection(inspection)
  const result = await searchSpecs(inspection, literal, options)
  return {
    ...projectionBase(inspection),
    mode: 'search',
    query: {
      literal,
      limit: options.limit,
      excerptCodePoints: options.excerptCodePoints,
    },
    matches: result.matches,
    summary: result.summary,
  }
}

function assertCompleteInspection(inspection: SpecsInspection): void {
  if (!specsInspectionComplete(inspection)) {
    throw new SpecsQueryError(
      'specs_inspection_incomplete',
      'Specs inspection is incomplete; resolve the reported diagnostics before using the projection',
    )
  }
}

function projectionBase(inspection: SpecsInspection): SpecsProjectionBase {
  return {
    source: inspection.source,
    roots: inspection.roots,
    generatedIndexes: inspection.generatedIndexes,
    diagnostics: inspection.diagnostics,
    diagnosticSummary: inspection.diagnosticSummary,
    runtime: inspection.runtime,
    limits: inspection.limits,
  }
}
