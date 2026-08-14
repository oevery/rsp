import type { SpecsInspection } from '../specs/model.js'
import { guardRspInitialized } from '../core/filesystem.js'
import { SPECS_DEFAULT_RESULT_LIMIT, SPECS_MAX_RESULT_LIMIT } from '../specs/model.js'
import { projectSpecsDetail, projectSpecsSearch, projectSpecsTree } from '../specs/projection.js'
import { inspectSpecs, SpecsQueryError } from '../specs/query.js'

export interface SpecsCliQuery {
  path?: string
  search?: string
  limit?: string
  excerpt?: string
  positionalCount?: number
}

type SpecsMode = 'tree' | 'detail' | 'search'

export type SpecsResult
  = ({ command: 'specs', ok: true } & ReturnType<typeof projectSpecsTree>)
    | ({ command: 'specs', ok: true } & Awaited<ReturnType<typeof projectSpecsDetail>>)
    | ({ command: 'specs', ok: true } & Awaited<ReturnType<typeof projectSpecsSearch>>)
    | SpecsErrorResult

export interface SpecsErrorResult {
  command: 'specs'
  ok: false
  mode: SpecsMode
  query: Omit<SpecsCliQuery, 'positionalCount'>
  source: SpecsInspection['source'] | null
  roots: SpecsInspection['roots'] | null
  tree: null
  decisionRecords: null
  document: null
  matches: never[]
  generatedIndexes: SpecsInspection['generatedIndexes']
  diagnostics: SpecsInspection['diagnostics']
  diagnosticSummary: SpecsInspection['diagnosticSummary']
  runtime: SpecsInspection['runtime']
  limits: SpecsInspection['limits'] | null
  error: { code: string, message: string }
}

export async function showSpecs(input: SpecsCliQuery = {}): Promise<SpecsResult> {
  guardRspInitialized()
  const mode: SpecsMode = input.search !== undefined ? 'search' : input.path ? 'detail' : 'tree'
  const validation = validateSpecsQuery(input, mode)
  if (!validation.ok)
    return createSpecsError(mode, input, validation.error, null)

  let inspection: SpecsInspection
  try {
    inspection = await inspectSpecs()
  }
  catch (error) {
    const queryError = error instanceof SpecsQueryError
      ? error
      : new SpecsQueryError('specs_inspection_failed', error instanceof Error ? error.message : String(error))
    return createSpecsError(mode, input, { code: queryError.code, message: queryError.message }, null)
  }
  if (mode === 'detail') {
    try {
      const projection = await projectSpecsDetail(inspection, validation.path!)
      const result = {
        command: 'specs' as const,
        ok: true as const,
        ...projection,
      }
      return result
    }
    catch (error) {
      const queryError = error instanceof SpecsQueryError
        ? error
        : new SpecsQueryError('specs_detail_failed', error instanceof Error ? error.message : String(error))
      return createSpecsError(mode, input, { code: queryError.code, message: queryError.message }, inspection)
    }
  }

  if (mode === 'search') {
    try {
      const projection = await projectSpecsSearch(inspection, validation.search!, {
        limit: validation.limit,
        excerptCodePoints: validation.excerpt,
      })
      const result = {
        command: 'specs' as const,
        ok: true as const,
        ...projection,
      }
      return result
    }
    catch (error) {
      const queryError = error instanceof SpecsQueryError
        ? error
        : new SpecsQueryError('specs_search_failed', error instanceof Error ? error.message : String(error))
      return createSpecsError(mode, input, { code: queryError.code, message: queryError.message }, inspection)
    }
  }

  try {
    const projection = projectSpecsTree(inspection)
    const result = {
      command: 'specs' as const,
      ok: true as const,
      ...projection,
    }
    return result
  }
  catch (error) {
    const queryError = error instanceof SpecsQueryError
      ? error
      : new SpecsQueryError('specs_tree_failed', error instanceof Error ? error.message : String(error))
    return createSpecsError(mode, input, { code: queryError.code, message: queryError.message }, inspection)
  }
}

function validateSpecsQuery(input: SpecsCliQuery, mode: SpecsMode):
  | { ok: true, path?: string, search?: string, limit: number, excerpt: number }
  | { ok: false, error: { code: string, message: string } } {
  if ((input.positionalCount ?? (input.path ? 1 : 0)) > 1)
    return invalid('specs_positional_args_unsupported', 'specs accepts at most one positional document path')
  if (input.path && input.search !== undefined)
    return invalid('specs_detail_search_conflict', 'Specs detail path cannot be combined with --search')
  if (mode !== 'search' && (input.limit !== undefined || input.excerpt !== undefined))
    return invalid('specs_search_options_without_search', '--limit and --excerpt require --search')
  const search = input.search?.trim()
  if (input.search !== undefined && !search)
    return invalid('invalid_specs_search', '--search must be non-empty')
  const limit = input.limit === undefined ? SPECS_DEFAULT_RESULT_LIMIT : Number(input.limit)
  if ((input.limit !== undefined && !/^[1-9]\d*$/.test(input.limit)) || !Number.isInteger(limit) || limit < 1 || limit > SPECS_MAX_RESULT_LIMIT)
    return invalid('invalid_specs_limit', `--limit must be an integer from 1 through ${SPECS_MAX_RESULT_LIMIT}`)
  const excerpt = input.excerpt === undefined ? 240 : Number(input.excerpt)
  if ((input.excerpt !== undefined && !/^[1-9]\d*$/.test(input.excerpt)) || !Number.isInteger(excerpt) || excerpt < 40 || excerpt > 1000)
    return invalid('invalid_specs_excerpt', '--excerpt must be an integer from 40 through 1000 code points')
  return {
    ok: true,
    path: input.path,
    search,
    limit,
    excerpt,
  }
}

function invalid(code: string, message: string) {
  return { ok: false as const, error: { code, message } }
}

function createSpecsError(
  mode: SpecsMode,
  query: SpecsCliQuery,
  error: { code: string, message: string },
  inspection: SpecsInspection | null,
): SpecsErrorResult {
  const result = {
    command: 'specs' as const,
    ok: false as const,
    mode,
    query: publicQuery(query),
    source: inspection?.source ?? null,
    roots: inspection?.roots ?? null,
    tree: null,
    decisionRecords: null,
    document: null,
    matches: [],
    generatedIndexes: inspection?.generatedIndexes ?? [],
    diagnostics: inspection?.diagnostics ?? [],
    diagnosticSummary: inspection?.diagnosticSummary ?? { total: 0, returned: 0, hasMore: false },
    runtime: inspection?.runtime ?? [],
    limits: inspection?.limits ?? null,
    error,
  }
  return result
}

function publicQuery(query: SpecsCliQuery): Omit<SpecsCliQuery, 'positionalCount'> {
  const { positionalCount: _positionalCount, ...result } = query
  return result
}
