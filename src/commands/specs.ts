import type { SpecsDirectoryNode, SpecsInspection } from '../specs/model.js'
import type { CommandRunOptions } from '../types.js'
import { pc } from '../core/config.js'
import { guardRspInitialized } from '../core/filesystem.js'
import { emitJson } from '../core/output.js'
import { SPECS_DEFAULT_RESULT_LIMIT, SPECS_DETAIL_CONTENT_CODE_POINTS, SPECS_MAX_RESULT_LIMIT } from '../specs/model.js'
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

export async function showSpecs(input: SpecsCliQuery = {}, options: CommandRunOptions = {}) {
  guardRspInitialized()
  const mode: SpecsMode = input.search !== undefined ? 'search' : input.path ? 'detail' : 'tree'
  const validation = validateSpecsQuery(input, mode)
  if (!validation.ok)
    return emitSpecsError(mode, input, validation.error, null, options)

  let inspection: SpecsInspection
  try {
    inspection = await inspectSpecs()
  }
  catch (error) {
    const queryError = error instanceof SpecsQueryError
      ? error
      : new SpecsQueryError('specs_inspection_failed', error instanceof Error ? error.message : String(error))
    return emitSpecsError(mode, input, { code: queryError.code, message: queryError.message }, null, options)
  }
  if (mode === 'detail') {
    try {
      const projection = await projectSpecsDetail(inspection, validation.path!)
      const result = {
        command: 'specs' as const,
        ok: true as const,
        ...projection,
      }
      if (options.json)
        emitJson(result, options)
      else
        printSpecsDetail(result)
      return result
    }
    catch (error) {
      const queryError = error instanceof SpecsQueryError
        ? error
        : new SpecsQueryError('specs_detail_failed', error instanceof Error ? error.message : String(error))
      return emitSpecsError(mode, input, { code: queryError.code, message: queryError.message }, inspection, options)
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
      if (options.json)
        emitJson(result, options)
      else
        printSpecsSearch(result)
      return result
    }
    catch (error) {
      const queryError = error instanceof SpecsQueryError
        ? error
        : new SpecsQueryError('specs_search_failed', error instanceof Error ? error.message : String(error))
      return emitSpecsError(mode, input, { code: queryError.code, message: queryError.message }, inspection, options)
    }
  }

  try {
    const projection = projectSpecsTree(inspection)
    const result = {
      command: 'specs' as const,
      ok: true as const,
      ...projection,
    }
    if (options.json)
      emitJson(result, options)
    else
      printSpecsTree(result)
    return result
  }
  catch (error) {
    const queryError = error instanceof SpecsQueryError
      ? error
      : new SpecsQueryError('specs_tree_failed', error instanceof Error ? error.message : String(error))
    return emitSpecsError(mode, input, { code: queryError.code, message: queryError.message }, inspection, options)
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

function emitSpecsError(
  mode: SpecsMode,
  query: SpecsCliQuery,
  error: { code: string, message: string },
  inspection: SpecsInspection | null,
  options: CommandRunOptions,
) {
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
  if (options.json) {
    emitJson(result, options)
  }
  else {
    console.error(`  ${pc.red('Error:')} ${error.message}`)
    for (const diagnostic of result.diagnostics)
      console.error(`  ${pc.dim(`${diagnostic.path ?? '.rsp/specs'} — ${diagnostic.message}`)}`)
    if (result.diagnosticSummary.hasMore)
      console.error(`  ${pc.dim(`${result.diagnosticSummary.total - result.diagnosticSummary.returned} additional diagnostic(s) omitted`)}`)
  }
  return result
}

function printSpecsTree(result: {
  source: SpecsInspection['source']
  tree: SpecsDirectoryNode
  decisionRecords: SpecsDirectoryNode
  generatedIndexes: SpecsInspection['generatedIndexes']
}) {
  console.log()
  console.log(`  ${pc.bold('Specs')}`)
  console.log(`  ${pc.dim('Checkout:')} ${formatSource(result.source)}`)
  console.log()
  printDirectory(result.tree, 1)
  console.log()
  console.log(`  ${pc.bold('Decision Records')}`)
  printDirectory(result.decisionRecords, 1)
  if (result.generatedIndexes.length > 0) {
    console.log()
    console.log(`  ${pc.dim(`${result.generatedIndexes.length} recognized or reserved generated-index path(s) classified for migration.`)}`)
  }
  console.log()
}

function printDirectory(node: SpecsDirectoryNode, depth: number): void {
  const indent = '  '.repeat(depth)
  if (node.documents.length === 0 && node.directories.length === 0) {
    console.log(`${indent}${pc.dim('(empty)')}`)
    return
  }
  for (const document of node.documents) {
    const detail = document.summary
      ? `${document.title} — ${document.summary}`
      : document.title
    console.log(`${indent}${pc.cyan(document.path)} ${pc.dim(`[${document.kind}]`)} — ${detail}`)
  }
  for (const directory of node.directories) {
    console.log(`${indent}${pc.bold(`${directory.name}/`)}`)
    printDirectory(directory, depth + 1)
  }
}

function printSpecsDetail(result: { source: SpecsInspection['source'], document: Awaited<ReturnType<typeof projectSpecsDetail>>['document'] }): void {
  console.log()
  console.log(`  ${pc.bold(result.document.title)}`)
  console.log(`  ${pc.dim('Path:')} ${result.document.path}`)
  console.log(`  ${pc.dim('Kind:')} ${result.document.kind}`)
  console.log(`  ${pc.dim('Checkout:')} ${formatSource(result.source)}`)
  if (result.document.contentTruncated)
    console.log(`  ${pc.dim(`Content is bounded to ${SPECS_DETAIL_CONTENT_CODE_POINTS} code points.`)}`)
  console.log()
  console.log(result.document.content)
  if (!result.document.content.endsWith('\n'))
    console.log()
}

function printSpecsSearch(result: {
  query: { literal: string }
  source: SpecsInspection['source']
  matches: Awaited<ReturnType<typeof projectSpecsSearch>>['matches']
  summary: Awaited<ReturnType<typeof projectSpecsSearch>>['summary']
}): void {
  console.log()
  console.log(`  ${pc.bold('Specs search:')} ${result.query.literal}`)
  console.log(`  ${pc.dim('Checkout:')} ${formatSource(result.source)}`)
  console.log()
  if (result.matches.length === 0) {
    console.log(`  ${pc.dim('No matching Specs content.')}\n`)
    return
  }
  for (const match of result.matches) {
    console.log(`  ${pc.cyan(`${match.path}:${match.line}`)} ${pc.dim(`[${match.kind}]`)}`)
    console.log(`    ${match.title}`)
    if (match.heading)
      console.log(`    ${pc.dim(match.heading)}`)
    console.log(`    ${match.excerpt}`)
  }
  console.log()
  console.log(`  ${pc.dim(`${result.summary.returned}/${result.summary.matched} match(es) returned from ${result.summary.searched} document(s).`)}\n`)
}

function formatSource(source: SpecsInspection['source']): string {
  const revision = source.gitHead ? source.gitHead.slice(0, 12) : 'no-git'
  const state = source.dirty === null ? 'unknown' : source.dirty ? 'dirty' : 'clean'
  return `${revision} ${state} (${source.root})`
}

function publicQuery(query: SpecsCliQuery): Omit<SpecsCliQuery, 'positionalCount'> {
  const { positionalCount: _positionalCount, ...result } = query
  return result
}
