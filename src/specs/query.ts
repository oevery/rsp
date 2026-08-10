import type { BigIntStats } from 'node:fs'
import type { FileHandle } from 'node:fs/promises'
import type { CommandDiagnostic } from '../types.js'
import type {
  GeneratedSpecsIndexClassification,
  SpecsDetailRecord,
  SpecsDirectoryNode,
  SpecsDocumentKind,
  SpecsDocumentRecord,
  SpecsHeading,
  SpecsInspection,
  SpecsSearchMatch,
  SpecsSearchResult,
  SpecsSourceIdentity,
} from './model.js'
import { Buffer } from 'node:buffer'
import { spawnSync } from 'node:child_process'
import { constants } from 'node:fs'
import { lstat, open, realpath } from 'node:fs/promises'
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from 'node:path'

import { inspectRspConfig, RSP_DIR } from '../core/config.js'
import { parseFrontmatter } from '../core/content.js'
import { DEFAULT_DECISION_RECORDS_PATH, resolveDecisionRecordsPath, validateDecisionRecordsFilesystemPath } from '../core/decisions.js'
import { normalizeLogicalPath } from '../core/filesystem.js'
import { inspectManagedFile, inspectManagedFileTree } from '../core/managed-path.js'
import {
  SPECS_DETAIL_CONTENT_CODE_POINTS,
  SPECS_MAX_CANDIDATES,
  SPECS_MAX_DIAGNOSTICS,
  SPECS_MAX_FILE_BYTES,
  SPECS_MAX_RESULT_LIMIT,
  SPECS_SEARCH_EXCERPT_CODE_POINTS,
} from './model.js'

const SPECS_ROOT = join(RSP_DIR, 'specs')
const GENERATED_INDEX_FILENAME = '00-index.md'
const LEGACY_GENERATED_INDEX_FILENAME = 'INDEX.md'
const READ_NO_FOLLOW_FLAGS = constants.O_RDONLY | (constants.O_NOFOLLOW ?? 0)

interface InspectedDocument extends SpecsDocumentRecord {
  sourcePath: string
}

interface InspectionAccumulator {
  documents: InspectedDocument[]
  generatedIndexes: GeneratedSpecsIndexClassification[]
  diagnostics: CommandDiagnostic[]
  candidateCount: number
  candidateLimitReported: boolean
}

export interface InspectSpecsOptions {
  cwd?: string
  maxCandidates?: number
  maxFileBytes?: number
  allowMissingDecisionRecords?: boolean
}

export interface SearchSpecsOptions {
  limit?: number
  excerptCodePoints?: number
}

export interface CurrentSpecsDocument extends SpecsDocumentRecord {
  content: string
}

export interface SpecsSearchWithSources {
  result: SpecsSearchResult
  documents: Map<string, CurrentSpecsDocument>
}

export class SpecsQueryError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message)
    this.name = 'SpecsQueryError'
  }
}

export async function inspectSpecs(options: InspectSpecsOptions = {}): Promise<SpecsInspection> {
  const projectRoot = await realpath(resolve(options.cwd ?? process.cwd()))
  const specsRoot = resolve(projectRoot, SPECS_ROOT)
  const maxCandidates = options.maxCandidates ?? SPECS_MAX_CANDIDATES
  const maxFileBytes = options.maxFileBytes ?? SPECS_MAX_FILE_BYTES
  validatePositiveBound(maxCandidates, 'maxCandidates')
  validatePositiveBound(maxFileBytes, 'maxFileBytes')

  const configInspection = await inspectRspConfig(projectRoot)
  if (configInspection.issues.length > 0)
    throw new SpecsQueryError('invalid_config', configInspection.issues.join('; '))
  const decisionRecordsPath = resolveDecisionRecordsPath(configInspection.config)
  const decisionPathIssue = await validateDecisionRecordsFilesystemPath(decisionRecordsPath, projectRoot)
  if (decisionPathIssue)
    throw new SpecsQueryError('invalid_decision_records_path', decisionPathIssue)
  const decisionRecordsRoot = resolve(projectRoot, decisionRecordsPath)

  const accumulator: InspectionAccumulator = {
    documents: [],
    generatedIndexes: [],
    diagnostics: [],
    candidateCount: 0,
    candidateLimitReported: false,
  }
  const excludedSpecDirectories = [DEFAULT_DECISION_RECORDS_PATH, decisionRecordsPath]
    .map(path => resolve(projectRoot, path))
    .filter(path => isInside(specsRoot, path))

  await inspectDocumentRoot({
    projectRoot,
    root: specsRoot,
    label: 'Specs',
    kind: 'spec',
    excludedDirectories: excludedSpecDirectories,
    accumulator,
    maxCandidates,
    maxFileBytes,
    allowMissing: false,
  })
  await inspectDocumentRoot({
    projectRoot,
    root: decisionRecordsRoot,
    label: 'Decision Records',
    kind: 'decision-record',
    excludedDirectories: [],
    accumulator,
    maxCandidates,
    maxFileBytes,
    allowMissing: options.allowMissingDecisionRecords === true,
  })

  detectPathCollisions(accumulator)
  accumulator.documents.sort(compareDocument)
  accumulator.generatedIndexes.sort((left, right) => left.path.localeCompare(right.path))
  const boundedDiagnostics = accumulator.diagnostics.slice(0, SPECS_MAX_DIAGNOSTICS)
  return {
    source: await inspectSourceIdentity(projectRoot),
    roots: {
      specs: toProjectPath(projectRoot, specsRoot),
      decisions: toProjectPath(projectRoot, decisionRecordsRoot),
    },
    tree: buildDirectoryTree(projectRoot, specsRoot, 'spec', accumulator.documents),
    decisionRecords: buildDirectoryTree(projectRoot, decisionRecordsRoot, 'decision-record', accumulator.documents),
    documents: accumulator.documents.map(stripSource),
    generatedIndexes: accumulator.generatedIndexes,
    diagnostics: boundedDiagnostics,
    diagnosticSummary: {
      total: accumulator.diagnostics.length,
      returned: boundedDiagnostics.length,
      hasMore: accumulator.diagnostics.length > boundedDiagnostics.length,
    },
    runtime: [],
    limits: {
      candidates: maxCandidates,
      fileBytes: maxFileBytes,
      results: SPECS_MAX_RESULT_LIMIT,
      searchExcerptCodePoints: SPECS_SEARCH_EXCERPT_CODE_POINTS,
      detailContentCodePoints: SPECS_DETAIL_CONTENT_CODE_POINTS,
    },
  }
}

export function specsInspectionComplete(inspection: SpecsInspection): boolean {
  return inspection.diagnostics.every(diagnostic => diagnostic.severity !== 'error')
}

export async function readSpecsDetail(inspection: SpecsInspection, projectPath: string): Promise<SpecsDetailRecord> {
  const current = await readCurrentSpecsDocument(inspection, projectPath)
  const bounded = boundCodePoints(current.content, SPECS_DETAIL_CONTENT_CODE_POINTS)
  return {
    ...current,
    content: bounded.value,
    contentTruncated: bounded.truncated,
  }
}

export async function readCurrentSpecsDocument(
  inspection: SpecsInspection,
  projectPath: string,
): Promise<CurrentSpecsDocument> {
  const normalized = normalizeRequestedPath(projectPath)
  const document = inspection.documents.find(candidate => candidate.path === normalized)
  if (!document)
    throw new SpecsQueryError('specs_document_not_found', `Specs document not found: ${projectPath}`)

  const sourcePath = resolve(inspection.source.root, normalized)
  const current = await readCurrentDocument(
    sourcePath,
    inspection.source.root,
    document.path,
    inspection.limits.fileBytes,
  )
  const currentDocument = parseDocumentRecord(current.content, current.bytes, document.path, document.kind)
  return {
    ...currentDocument,
    content: current.content,
  }
}

export function parseCurrentSpecsDocument(
  content: string,
  bytes: number,
  path: string,
  kind: SpecsDocumentKind,
): CurrentSpecsDocument {
  return {
    ...parseDocumentRecord(content, bytes, path, kind),
    content,
  }
}

export async function searchSpecs(inspection: SpecsInspection, literal: string, options: SearchSpecsOptions = {}): Promise<SpecsSearchResult> {
  return (await searchSpecsWithSources(inspection, literal, options)).result
}

export async function searchSpecsWithSources(
  inspection: SpecsInspection,
  literal: string,
  options: SearchSpecsOptions = {},
): Promise<SpecsSearchWithSources> {
  const query = literal.trim()
  if (query === '')
    throw new SpecsQueryError('invalid_specs_search', 'Specs search literal must be non-empty')
  const limit = options.limit ?? 20
  if (!Number.isInteger(limit) || limit < 1 || limit > SPECS_MAX_RESULT_LIMIT)
    throw new SpecsQueryError('invalid_specs_limit', `Specs search limit must be an integer from 1 through ${SPECS_MAX_RESULT_LIMIT}`)
  const excerptCodePoints = options.excerptCodePoints ?? SPECS_SEARCH_EXCERPT_CODE_POINTS
  if (!Number.isInteger(excerptCodePoints) || excerptCodePoints < 40 || excerptCodePoints > 1000)
    throw new SpecsQueryError('invalid_specs_excerpt', 'Specs search excerpt must be an integer from 40 through 1000 code points')

  const lowered = query.toLowerCase()
  const matches: SpecsSearchMatch[] = []
  const documents = new Map<string, CurrentSpecsDocument>()
  let matched = 0
  for (const document of inspection.documents) {
    const current = await readCurrentDocument(
      resolve(inspection.source.root, document.path),
      inspection.source.root,
      document.path,
      inspection.limits.fileBytes,
    )
    const currentDocument = parseDocumentRecord(current.content, current.bytes, document.path, document.kind)
    const lines = current.content.split(/\r?\n/)
    let heading: string | null = null
    for (let index = 0; index < lines.length; index++) {
      const parsedHeading = parseMarkdownHeading(lines[index])
      if (parsedHeading)
        heading = parsedHeading.title
      const position = lines[index].toLowerCase().indexOf(lowered)
      if (position < 0)
        continue
      matched += 1
      if (matches.length < limit) {
        if (!documents.has(document.path)) {
          documents.set(document.path, {
            ...currentDocument,
            content: current.content,
          })
        }
        matches.push({
          path: document.path,
          kind: document.kind,
          title: currentDocument.title,
          heading,
          line: index + 1,
          excerpt: excerptAround(
            lines[index],
            [...lines[index].slice(0, position)].length,
            [...query].length,
            excerptCodePoints,
          ),
        })
      }
    }
  }

  return {
    result: {
      matches,
      summary: {
        candidates: inspection.documents.length,
        searched: inspection.documents.length,
        matched,
        returned: matches.length,
        hasMore: matched > matches.length,
      },
    },
    documents,
  }
}

async function inspectDocumentRoot(options: {
  projectRoot: string
  root: string
  label: string
  kind: SpecsDocumentKind
  excludedDirectories: string[]
  accumulator: InspectionAccumulator
  maxCandidates: number
  maxFileBytes: number
  allowMissing: boolean
}): Promise<void> {
  const inspection = await inspectManagedFileTree(options.root, options.label, { allowMissing: options.allowMissing })
  for (const issue of inspection.issues) {
    options.accumulator.diagnostics.push({
      severity: 'error',
      code: 'specs_tree_invalid',
      path: toProjectPath(options.projectRoot, issue.path),
      message: issue.message,
    })
  }
  if (!inspection.rootExists)
    return

  for (const path of inspection.files) {
    if (options.excludedDirectories.some(directory => isInside(directory, path)))
      continue
    const projectPath = toProjectPath(options.projectRoot, path)
    const reserved = reservedIndexKind(options.root, path)
    if (reserved) {
      await classifyGeneratedIndex(path, options.projectRoot, projectPath, options.maxFileBytes, options.accumulator)
      continue
    }
    if (!path.endsWith('.md'))
      continue
    options.accumulator.candidateCount += 1
    if (options.accumulator.candidateCount > options.maxCandidates) {
      if (!options.accumulator.candidateLimitReported) {
        options.accumulator.diagnostics.push({
          severity: 'error',
          code: 'specs_candidate_limit_exceeded',
          path: projectPath,
          message: `Specs candidate limit exceeded (${options.maxCandidates})`,
        })
        options.accumulator.candidateLimitReported = true
      }
      continue
    }
    await inspectDocument(path, options.projectRoot, projectPath, options.kind, options.maxFileBytes, options.accumulator)
  }
}

async function classifyGeneratedIndex(
  path: string,
  projectRoot: string,
  projectPath: string,
  maxFileBytes: number,
  accumulator: InspectionAccumulator,
): Promise<void> {
  try {
    const current = await readCurrentDocument(path, projectRoot, projectPath, maxFileBytes)
    const recognized = isRecognizedGeneratedSpecsIndex(current.content, projectPath)
    accumulator.generatedIndexes.push({
      path: projectPath,
      classification: recognized ? 'safe-removal' : 'owner-controlled',
      reason: recognized
        ? 'metadata recognizes the reserved path as a generated Specs index'
        : 'reserved path content is not recognized generated Specs-index output',
    })
    if (!recognized) {
      accumulator.diagnostics.push({
        severity: 'error',
        code: 'unrecognized_reserved_specs_index',
        path: projectPath,
        message: `reserved Specs index is owner-controlled and cannot be treated as generated content: ${projectPath}`,
      })
    }
  }
  catch (error) {
    accumulator.generatedIndexes.push({
      path: projectPath,
      classification: 'owner-controlled',
      reason: 'reserved path could not be boundedly inspected as generated Specs-index output',
    })
    accumulator.diagnostics.push({
      severity: 'error',
      code: error instanceof SpecsQueryError ? error.code : 'specs_index_read_failed',
      path: projectPath,
      message: `unable to inspect reserved Specs index ${projectPath}: ${error instanceof Error ? error.message : String(error)}`,
    })
  }
}

export function isRecognizedGeneratedSpecsIndex(content: string, projectPath: string): boolean {
  const metadata = parseFrontmatter(content)
  const expectedSourceDirectory = normalizeLogicalPath(dirname(projectPath))
  return metadata?.kind === 'generated-index'
    && metadata.index_type === 'specs'
    && metadata.source_dir === expectedSourceDirectory
}

async function inspectDocument(
  path: string,
  projectRoot: string,
  projectPath: string,
  kind: SpecsDocumentKind,
  maxFileBytes: number,
  accumulator: InspectionAccumulator,
): Promise<void> {
  try {
    const current = await readCurrentDocument(path, projectRoot, projectPath, maxFileBytes)
    const metadata = parseFrontmatter(current.content)
    if (metadata?.kind === 'generated-index')
      return
    accumulator.documents.push({
      sourcePath: path,
      ...parseDocumentRecord(current.content, current.bytes, projectPath, kind),
    })
  }
  catch (error) {
    accumulator.diagnostics.push({
      severity: 'error',
      code: error instanceof SpecsQueryError ? error.code : 'specs_file_read_failed',
      path: projectPath,
      message: `unable to read Specs document ${projectPath}: ${error instanceof Error ? error.message : String(error)}`,
    })
  }
}

function detectPathCollisions(accumulator: InspectionAccumulator): void {
  const seen = new Map<string, string>()
  for (const document of accumulator.documents) {
    const canonical = document.path.normalize('NFC')
    const existing = seen.get(canonical)
    if (existing && existing !== document.path) {
      accumulator.diagnostics.push({
        severity: 'error',
        code: 'specs_path_collision',
        path: document.path,
        message: `Specs path normalization collision: ${existing} and ${document.path}`,
      })
    }
    else {
      seen.set(canonical, document.path)
    }
    if (canonical !== document.path) {
      accumulator.diagnostics.push({
        severity: 'error',
        code: 'specs_path_not_canonical',
        path: document.path,
        message: `Specs path must use canonical NFC form: ${document.path}`,
      })
    }
  }
}

function buildDirectoryTree(projectRoot: string, root: string, kind: SpecsDocumentKind, documents: InspectedDocument[]): SpecsDirectoryNode {
  const rootPath = toProjectPath(projectRoot, root)
  const tree: SpecsDirectoryNode = {
    name: basename(root),
    path: rootPath,
    directories: [],
    documents: [],
  }
  for (const document of documents.filter(candidate => candidate.kind === kind)) {
    const rel = relative(root, document.sourcePath)
    if (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel))
      continue
    const segments = normalizeLogicalPath(rel).split('/')
    let current = tree
    for (const segment of segments.slice(0, -1)) {
      let child = current.directories.find(directory => directory.name === segment)
      if (!child) {
        child = {
          name: segment,
          path: `${current.path}/${segment}`,
          directories: [],
          documents: [],
        }
        current.directories.push(child)
        current.directories.sort((left, right) => left.name.localeCompare(right.name))
      }
      current = child
    }
    current.documents.push(stripSource(document))
    current.documents.sort(compareDocument)
  }
  return tree
}

function extractHeadings(content: string): SpecsHeading[] {
  const headings: SpecsHeading[] = []
  const lines = content.split(/\r?\n/)
  for (let index = 0; index < lines.length; index++) {
    const heading = parseMarkdownHeading(lines[index])
    if (!heading)
      continue
    headings.push({
      depth: heading.depth,
      title: heading.title,
      line: index + 1,
    })
  }
  return headings
}

function parseMarkdownHeading(line: string): Pick<SpecsHeading, 'depth' | 'title'> | null {
  let depth = 0
  while (depth < 6 && line[depth] === '#')
    depth += 1
  if (depth === 0 || line[depth] === '#' || !isWhitespace(line[depth]))
    return null

  let contentStart = depth
  while (contentStart < line.length && isWhitespace(line[contentStart]))
    contentStart += 1
  if (contentStart === line.length)
    return null

  const rawTitle = line.slice(contentStart)
  let titleEnd = rawTitle.length
  while (titleEnd > 0 && isSpaceOrTab(rawTitle[titleEnd - 1]))
    titleEnd -= 1

  let closingStart = titleEnd
  while (closingStart > 0 && rawTitle[closingStart - 1] === '#')
    closingStart -= 1
  const closingPredecessor = closingStart === 0
    ? line[contentStart - 1]
    : rawTitle[closingStart - 1]
  if (closingStart < titleEnd && isSpaceOrTab(closingPredecessor)) {
    titleEnd = closingStart
    while (titleEnd > 0 && isSpaceOrTab(rawTitle[titleEnd - 1]))
      titleEnd -= 1
  }

  const title = rawTitle.slice(0, titleEnd).trim()
  return { depth, title }
}

function isWhitespace(character: string | undefined): boolean {
  return character !== undefined && character.trim() === ''
}

function isSpaceOrTab(character: string | undefined): boolean {
  return character === ' ' || character === '\t'
}

function extractSummary(content: string, frontmatterSummary: unknown): string | null {
  if (typeof frontmatterSummary === 'string' && frontmatterSummary.trim() !== '')
    return frontmatterSummary.trim()

  const frontmatter = content.match(/^---\r?\n[\s\S]*?\r?\n(?:---|\.\.\.)\r?\n/)
  const body = frontmatter ? content.slice(frontmatter[0].length) : content
  for (const rawLine of body.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (line === '' || line.startsWith('#') || line.startsWith('<!--'))
      continue
    return line.replace(/^[-*]\s*/, '').trim() || null
  }
  return null
}

async function inspectSourceIdentity(projectRoot: string): Promise<SpecsSourceIdentity> {
  const root = normalizeLogicalPath(projectRoot)
  const head = runGit(['rev-parse', 'HEAD'], projectRoot)
  const branch = runGit(['symbolic-ref', '--quiet', '--short', 'HEAD'], projectRoot)
  const status = spawnSync('git', ['status', '--porcelain=v1', '--untracked-files=normal'], {
    cwd: root,
    encoding: 'utf-8',
    maxBuffer: 256 * 1024,
  })
  return {
    root,
    gitHead: head,
    gitBranch: branch,
    dirty: status.status === 0
      ? status.stdout.trim() !== ''
      : status.error && (status.error as NodeJS.ErrnoException).code === 'ENOBUFS'
        ? true
        : null,
  }
}

function runGit(args: string[], cwd: string): string | null {
  const result = spawnSync('git', args, { cwd, encoding: 'utf-8', maxBuffer: 64 * 1024 })
  return result.status === 0 ? result.stdout.trim() || null : null
}

function normalizeRequestedPath(pathValue: string): string {
  const trimmed = pathValue.trim()
  if (trimmed === '')
    throw new SpecsQueryError('invalid_specs_path', 'Specs detail path must be non-empty')
  const normalized = normalizeLogicalPath(trimmed.replace(/^\.\//, ''))
  if (isAbsolute(trimmed) || normalized === '..' || normalized.startsWith('../'))
    throw new SpecsQueryError('invalid_specs_path', 'Specs detail path must be one project-relative path returned by rsp specs')
  return normalized
}

function reservedIndexKind(root: string, path: string): 'current' | 'legacy' | null {
  if (basename(path) === GENERATED_INDEX_FILENAME)
    return 'current'
  if (path === join(root, LEGACY_GENERATED_INDEX_FILENAME))
    return 'legacy'
  return null
}

function excerptAround(line: string, matchStart: number, matchLength: number, limit: number): string {
  const codePoints = [...line]
  if (codePoints.length <= limit)
    return codePoints.join('').trim()
  const before = Math.max(0, matchStart - Math.floor((limit - matchLength) / 2))
  const value = codePoints.slice(before, before + limit).join('').trim()
  return `${before > 0 ? '…' : ''}${value}${before + limit < codePoints.length ? '…' : ''}`
}

async function readCurrentDocument(
  path: string,
  root: string,
  projectPath: string,
  maxFileBytes: number,
): Promise<{ content: string, bytes: number }> {
  const changed = () => new SpecsQueryError('specs_file_changed', `Specs document is no longer a readable regular file: ${projectPath}`)
  const sourcePath = resolve(path)
  const sourceRoot = resolve(root)
  const relativePath = relative(sourceRoot, sourcePath)
  if (relativePath === ''
    || relativePath === '..'
    || relativePath.startsWith(`..${sep}`)
    || isAbsolute(relativePath)) {
    throw changed()
  }

  const inspection = inspectManagedFile(sourcePath, 'Specs document')
  if (inspection.issue)
    throw changed()

  let inspectedRoot: BigIntStats
  let inspected
  let realRoot: string
  try {
    inspectedRoot = await lstat(sourceRoot, { bigint: true })
    inspected = await lstat(sourcePath, { bigint: true })
    realRoot = await realpath(sourceRoot)
    const resolvedPath = await realpath(sourcePath)
    if (!inspectedRoot.isDirectory()
      || !inspected.isFile()
      || resolvedPath !== resolve(realRoot, relativePath)
      || !isContained(realRoot, resolvedPath)) {
      throw changed()
    }
  }
  catch (error) {
    if (error instanceof SpecsQueryError)
      throw error
    throw changed()
  }

  let handle
  try {
    handle = await open(sourcePath, READ_NO_FOLLOW_FLAGS)
  }
  catch {
    throw changed()
  }
  try {
    const opened = await handle.stat({ bigint: true })
    const currentRoot = await realpath(sourceRoot)
    const currentPath = await realpath(sourcePath)
    if (!opened.isFile()
      || currentRoot !== realRoot
      || currentPath !== resolve(currentRoot, relativePath)
      || !isContained(currentRoot, currentPath)
      || !sameIdentity(inspected, opened)
      || !sameSnapshot(inspected, opened)) {
      throw changed()
    }
    if (opened.size > BigInt(maxFileBytes))
      throw new SpecsQueryError('specs_file_too_large', `Specs document exceeds the ${maxFileBytes}-byte inspection limit: ${projectPath}`)
    const current = await readBoundedDocument(handle, opened, projectPath, maxFileBytes)
    await validateCurrentSpecsPath({
      sourcePath,
      sourceRoot,
      relativePath,
      realRoot,
      inspectedRoot,
      finalHandle: current.final,
      projectPath,
    })
    return {
      content: current.content,
      bytes: current.bytes,
    }
  }
  catch (error) {
    if (error instanceof SpecsQueryError)
      throw error
    throw changed()
  }
  finally {
    await handle.close()
  }
}

async function readBoundedDocument(
  handle: FileHandle,
  opened: BigIntStats,
  projectPath: string,
  maxFileBytes: number,
): Promise<{ content: string, bytes: number, final: BigIntStats }> {
  const buffer = Buffer.allocUnsafe(maxFileBytes + 1)
  let bytes = 0
  while (bytes < buffer.length) {
    const result = await handle.read(buffer, bytes, buffer.length - bytes, bytes)
    if (result.bytesRead === 0)
      break
    bytes += result.bytesRead
  }
  const final = await handle.stat({ bigint: true })
  if (bytes > maxFileBytes || final.size > BigInt(maxFileBytes))
    throw new SpecsQueryError('specs_file_too_large', `Specs document exceeds the ${maxFileBytes}-byte inspection limit: ${projectPath}`)
  if (!sameIdentity(opened, final)
    || !sameSnapshot(opened, final)
    || final.size !== BigInt(bytes)) {
    throw new SpecsQueryError('specs_file_changed', `Specs document is no longer a readable regular file: ${projectPath}`)
  }
  return {
    content: buffer.subarray(0, bytes).toString('utf-8'),
    bytes,
    final,
  }
}

async function validateCurrentSpecsPath(options: {
  sourcePath: string
  sourceRoot: string
  relativePath: string
  realRoot: string
  inspectedRoot: BigIntStats
  finalHandle: BigIntStats
  projectPath: string
}): Promise<void> {
  const changed = () => new SpecsQueryError('specs_file_changed', `Specs document is no longer a readable regular file: ${options.projectPath}`)
  try {
    const currentRoot = await lstat(options.sourceRoot, { bigint: true })
    const currentPath = await lstat(options.sourcePath, { bigint: true })
    const realCurrentRoot = await realpath(options.sourceRoot)
    const realCurrentPath = await realpath(options.sourcePath)
    if (!currentRoot.isDirectory()
      || !currentPath.isFile()
      || !sameIdentity(options.inspectedRoot, currentRoot)
      || realCurrentRoot !== options.realRoot
      || realCurrentPath !== resolve(realCurrentRoot, options.relativePath)
      || !isContained(realCurrentRoot, realCurrentPath)
      || !sameIdentity(currentPath, options.finalHandle)
      || !sameSnapshot(currentPath, options.finalHandle)) {
      throw changed()
    }
  }
  catch (error) {
    if (error instanceof SpecsQueryError)
      throw error
    throw changed()
  }
}

function sameIdentity(
  left: { dev: bigint, ino: bigint },
  right: { dev: bigint, ino: bigint },
): boolean {
  return left.dev === right.dev && left.ino === right.ino
}

function sameSnapshot(
  left: { size: bigint, mtimeNs: bigint, ctimeNs: bigint },
  right: { size: bigint, mtimeNs: bigint, ctimeNs: bigint },
): boolean {
  return left.size === right.size
    && left.mtimeNs === right.mtimeNs
    && left.ctimeNs === right.ctimeNs
}

function isContained(root: string, path: string): boolean {
  const candidate = relative(root, path)
  return candidate !== ''
    && candidate !== '..'
    && !candidate.startsWith(`..${sep}`)
    && !isAbsolute(candidate)
}

function boundCodePoints(value: string, limit: number): { value: string, truncated: boolean } {
  const codePoints = [...value]
  return {
    value: codePoints.slice(0, limit).join(''),
    truncated: codePoints.length > limit,
  }
}

function stripSource(document: InspectedDocument): SpecsDocumentRecord {
  const { sourcePath: _sourcePath, ...record } = document
  return record
}

function parseDocumentRecord(content: string, bytes: number, path: string, kind: SpecsDocumentKind): SpecsDocumentRecord {
  const metadata = parseFrontmatter(content)
  const headings = extractHeadings(content)
  return {
    path,
    kind,
    title: typeof metadata?.title === 'string' && metadata.title.trim() !== ''
      ? metadata.title.trim()
      : headings.find(heading => heading.depth === 1)?.title ?? basename(path, '.md'),
    summary: extractSummary(content, metadata?.summary),
    bytes,
    headings,
  }
}

function compareDocument(left: SpecsDocumentRecord, right: SpecsDocumentRecord): number {
  return left.path.localeCompare(right.path)
}

function validatePositiveBound(value: number, label: string): void {
  if (!Number.isInteger(value) || value < 1)
    throw new SpecsQueryError('invalid_specs_bound', `${label} must be a positive integer`)
}

function isInside(directory: string, path: string): boolean {
  const rel = relative(directory, path)
  return rel === '' || (!isAbsolute(rel) && rel !== '..' && !rel.startsWith(`..${sep}`))
}

function toProjectPath(projectRoot: string, path: string): string {
  return normalizeLogicalPath(relative(projectRoot, path)) || '.'
}
