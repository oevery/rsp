import { Buffer } from 'node:buffer'
import { lstatSync, readdirSync } from 'node:fs'
import { readdir } from 'node:fs/promises'
import { isAbsolute, join, relative } from 'node:path'

import { ARCHIVES_DIR, CHANGES_DIR, FOCUS_DIR } from './config.js'
import { inspectManagedDirectory, ManagedPathError, requireManagedDirectory, requireManagedFile } from './managed-path.js'

const WORK_SEGMENT_RE = /^[\p{Ll}\p{Lo}\p{Lm}\p{M}\p{Nd}]+(?:-[\p{Ll}\p{Lo}\p{Lm}\p{M}\p{Nd}]+)*$/u
const WORK_SEGMENT_MAX_CODE_POINTS = 100
const WORK_SEGMENT_MAX_UTF8_BYTES = 200
export const GROUP_BRIEF_FILENAME = '00-brief.md'

export type WorkRef = FlatChangeRef | GroupedChangeRef | GroupBriefRef
export type ExecutableWorkRef = FlatChangeRef | GroupedChangeRef
export type WorkRefErrorCode
  = 'invalid_work_ref'
    | 'invalid_work_root'
    | 'invalid_work_ref_path'
    | 'invalid_focus_root'
    | 'invalid_focus_path'
    | 'invalid_archive_root'
    | 'invalid_archive_path'
    | 'focus_marker_not_found'
    | 'archive_name_exhausted'
    | 'unsupported_work_depth'
    | 'non_executable_work_ref'
    | 'group_brief_missing'
    | 'invalid_group_brief'
    | 'group_child_undeclared'
    | 'work_ref_collision'
    | 'work_ref_not_found'
    | 'work_ref_not_file'
    | 'work_tree_read_failed'

interface WorkRefBase {
  name: string
  path: string
}

export interface FlatChangeRef extends WorkRefBase {
  kind: 'change'
  group: null
}

export interface GroupedChangeRef extends WorkRefBase {
  kind: 'group-change'
  group: string
}

export interface GroupBriefRef extends WorkRefBase {
  kind: 'group-brief'
  group: string
}

export interface ResolveWorkRefOptions {
  changesDir?: string
  canonical?: boolean
  executable?: boolean
  mustExist?: boolean
}

export interface WorkRefDiagnostic {
  code: WorkRefErrorCode
  input: string
  path: string
  message: string
}

export interface WorkTreeInspection {
  changes: ExecutableWorkRef[]
  briefs: GroupBriefRef[]
  diagnostics: WorkRefDiagnostic[]
}

export interface FocusMarkerRef {
  name: string
  path: string
}

export interface FocusTreeInspection {
  markers: FocusMarkerRef[]
  diagnostics: WorkRefDiagnostic[]
}

export interface ArchiveTreeInspection {
  rootExists: boolean
  files: string[]
  diagnostics: WorkRefDiagnostic[]
}

interface DiagnosticCollector {
  diagnostics: WorkRefDiagnostic[]
}

export class WorkRefError extends Error {
  constructor(
    public readonly code: WorkRefErrorCode,
    message: string,
    public readonly input: string,
  ) {
    super(message)
    this.name = 'WorkRefError'
  }
}

/** Normalize and validate one safe Unicode WorkRef segment at command ingress. */
export function normalizeWorkRefSegment(segment: string): string {
  const normalized = segment.normalize('NFC')
  if (
    !WORK_SEGMENT_RE.test(normalized)
    || [...normalized].length > WORK_SEGMENT_MAX_CODE_POINTS
    || Buffer.byteLength(normalized, 'utf8') > WORK_SEGMENT_MAX_UTF8_BYTES
  ) {
    throw new WorkRefError(
      'invalid_work_ref',
      `work identity segment "${segment}" must contain at most ${WORK_SEGMENT_MAX_CODE_POINTS} lowercase or caseless Unicode letters, marks, or decimal numbers separated only by internal hyphens and fit within ${WORK_SEGMENT_MAX_UTF8_BYTES} UTF-8 bytes`,
      segment,
    )
  }
  return normalized
}

/** Normalize one executable flat or direct Group-child identity. */
export function normalizeExecutableWorkRef(name: string): string {
  return normalizeWorkRefName(name, false)
}

/** Check a stored executable identity without silently normalizing it. */
export function isCanonicalExecutableWorkRef(name: string): boolean {
  try {
    return normalizeExecutableWorkRef(name) === name
  }
  catch {
    return false
  }
}

/** Check a stored Group segment without silently normalizing it. */
export function isCanonicalWorkRefSegment(segment: string): boolean {
  try {
    return normalizeWorkRefSegment(segment) === segment
  }
  catch {
    return false
  }
}

/** Resolve one logical open-work identity through the bounded RSP work model. */
export function resolveWorkRef(name: string, options: ResolveWorkRefOptions & { executable: true }): ExecutableWorkRef
export function resolveWorkRef(name: string, options?: ResolveWorkRefOptions): WorkRef
export function resolveWorkRef(name: string, options: ResolveWorkRefOptions = {}): WorkRef {
  const changesDir = options.changesDir ?? CHANGES_DIR
  const normalizedName = normalizeWorkRefName(name, true)
  if (options.canonical && normalizedName !== name) {
    throw new WorkRefError(
      'invalid_work_ref',
      `stored work identity "${name}" must use Unicode NFC normalization`,
      name,
    )
  }
  const segments = normalizedName.split('/')
  const isGroupBrief = segments.length === 2 && segments[1] === 'brief'

  assertValidWorkRoot(changesDir, normalizedName)
  assertNoNormalizationCollision(changesDir, segments, normalizedName, isGroupBrief)
  assertNoIdentityCollision(changesDir, segments, normalizedName, isGroupBrief ? GROUP_BRIEF_FILENAME : undefined)

  const path = join(changesDir, ...segments.slice(0, -1), isGroupBrief ? GROUP_BRIEF_FILENAME : `${segments.at(-1)}.md`)
  const ref: WorkRef = segments.length === 1
    ? { kind: 'change', name: normalizedName, path, group: null }
    : isGroupBrief
      ? { kind: 'group-brief', name: normalizedName, path, group: segments[0]! }
      : { kind: 'group-change', name: normalizedName, path, group: segments[0]! }

  if (ref.kind === 'group-change' && options.executable !== false)
    assertGroupBrief(changesDir, ref)

  if (options.executable && ref.kind === 'group-brief') {
    throw new WorkRefError(
      'non_executable_work_ref',
      `work identity "${name}" is a Group Brief and cannot be used as an executable Change`,
      name,
    )
  }
  assertRegularWorkFile(ref, Boolean(options.mustExist))

  return ref
}

function assertGroupBrief(changesDir: string, ref: GroupedChangeRef): void {
  const briefPath = join(changesDir, ref.group, GROUP_BRIEF_FILENAME)
  const kind = getPathKind(briefPath, ref.name)
  if (kind === 'missing') {
    throw new WorkRefError(
      'group_brief_missing',
      `Change Group "${ref.group}" requires a Group Brief; run: rsp group create ${ref.group}`,
      ref.name,
    )
  }
  if (kind !== 'file') {
    throw new WorkRefError(
      'work_ref_not_file',
      `Group Brief must be a regular file: ${briefPath}`,
      ref.name,
    )
  }
}

function assertRegularWorkFile(ref: WorkRef, mustExist: boolean): void {
  let stats
  try {
    stats = lstatSync(ref.path)
  }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      if (mustExist) {
        throw new WorkRefError(
          'work_ref_not_found',
          `open work file not found: ${ref.path}`,
          ref.name,
        )
      }
      return
    }
    throw asReadFailure(ref.path, ref.name, error)
  }
  if (!stats.isFile()) {
    throw new WorkRefError(
      'work_ref_not_file',
      `open work path is not a regular file: ${ref.path}`,
      ref.name,
    )
  }
}

/** Resolve a Markdown file path through the same bounded open-work model. */
export function resolveWorkRefPath(path: string, options: ResolveWorkRefOptions & { executable: true }): ExecutableWorkRef
export function resolveWorkRefPath(path: string, options?: ResolveWorkRefOptions): WorkRef
export function resolveWorkRefPath(path: string, options: ResolveWorkRefOptions = {}): WorkRef {
  const changesDir = options.changesDir ?? CHANGES_DIR
  const logicalPath = normalizeLogicalPath(relative(changesDir, path))
  if (
    isAbsolute(logicalPath)
    || logicalPath === '..'
    || logicalPath.startsWith('../')
    || !logicalPath.endsWith('.md')
  ) {
    throw new WorkRefError(
      'invalid_work_ref_path',
      `work path must be a Markdown file inside ${changesDir}: ${path}`,
      path,
    )
  }

  const segments = logicalPath.split('/')
  if (segments.length === 2 && segments[1] === 'brief.md') {
    throw new WorkRefError(
      'invalid_work_ref_path',
      `unsupported legacy Group Brief path: ${path}`,
      path,
    )
  }
  const name = segments.length === 2 && segments[1] === GROUP_BRIEF_FILENAME
    ? `${segments[0]}/brief`
    : logicalPath.slice(0, -3)
  return resolveWorkRef(name, { ...options, canonical: true })
}

/** Narrow a WorkRef to the only shapes executable before Change Group lifecycle support. */
function isExecutableWorkRef(ref: WorkRef): ref is ExecutableWorkRef {
  return ref.kind !== 'group-brief'
}

/** Resolve a focus marker only through a real focus root and group prefix. */
export function resolveFocusMarkerPath(ref: WorkRef, options: { focusDir?: string } = {}): string {
  const focusDir = options.focusDir ?? FOCUS_DIR
  assertManagedRoot(focusDir, ref.name, 'invalid_focus_root', 'focus root', true)
  assertNoManagedNormalizationCollision(focusDir, ref.name.split('/'), ref.name, 'invalid_focus_path')
  if (ref.group) {
    assertOptionalManagedDirectory(
      join(focusDir, ref.group),
      ref.name,
      'invalid_focus_path',
      'focus path',
    )
  }
  const markerPath = join(focusDir, ...ref.name.split('/'))
  try {
    requireManagedFile(markerPath, 'focus marker', { allowMissing: true })
  }
  catch (error) {
    if (error instanceof ManagedPathError)
      throw new WorkRefError('invalid_focus_path', error.message, ref.name)
    throw error
  }
  return markerPath
}

/** Resolve an archive directory only through a real archive root and group prefix. */
export function resolveArchiveDirectory(ref: WorkRef, options: { archivesDir?: string } = {}): string {
  const archivesDir = options.archivesDir ?? ARCHIVES_DIR
  assertManagedRoot(archivesDir, ref.name, 'invalid_archive_root', 'archive root', true)
  if (!ref.group)
    return archivesDir

  assertNoManagedNormalizationCollision(archivesDir, [ref.group], ref.name, 'invalid_archive_path')

  const groupPath = join(archivesDir, ref.group)
  assertOptionalManagedDirectory(groupPath, ref.name, 'invalid_archive_path', 'archive path')
  return groupPath
}

/** Inspect bounded focus markers without following symlinked roots or entries. */
export async function inspectFocusTree(options: { changesDir?: string, focusDir?: string } = {}): Promise<FocusTreeInspection> {
  const focusDir = options.focusDir ?? FOCUS_DIR
  const changesDir = options.changesDir ?? CHANGES_DIR
  const result: FocusTreeInspection = { markers: [], diagnostics: [] }
  const rootInspection = inspectManagedDirectory(focusDir, 'focus root', { allowMissing: true })
  if (rootInspection.issue) {
    addDiagnostic(result, new WorkRefError('invalid_focus_root', rootInspection.issue.message, focusDir), focusDir)
    return result
  }
  if (!rootInspection.exists)
    return result

  const rootEntries = await readDirectory(focusDir, focusDir, result)
  if (!rootEntries)
    return result

  for (const entry of rootEntries) {
    const path = join(focusDir, entry.name)
    if (entry.name === '.gitkeep' && entry.isFile())
      continue
    if (entry.isDirectory()) {
      if (!isCanonicalWorkRefSegment(entry.name)) {
        addDiagnostic(result, new WorkRefError(
          'invalid_work_ref',
          `stored work identity "${entry.name}" must be a safe Unicode NFC segment`,
          entry.name,
        ), path)
        continue
      }
      await inspectFocusGroup(entry.name, path, changesDir, result)
      continue
    }
    if (!entry.isFile()) {
      addDiagnostic(result, new WorkRefError(
        'invalid_focus_path',
        `focus path must be a regular marker file or real directory: ${path}`,
        entry.name,
      ), path)
      continue
    }
    collectFocusMarker(entry.name, path, changesDir, result)
  }

  result.markers.sort((a, b) => a.name.localeCompare(b.name))
  return result
}

/** Inspect bounded archive files without following symlinked roots or entries. */
export async function inspectArchiveTree(options: { archivesDir?: string } = {}): Promise<ArchiveTreeInspection> {
  const archivesDir = options.archivesDir ?? ARCHIVES_DIR
  const result: ArchiveTreeInspection = { rootExists: false, files: [], diagnostics: [] }
  const rootInspection = inspectManagedDirectory(archivesDir, 'archive root', { allowMissing: true })
  if (rootInspection.issue) {
    addDiagnostic(result, new WorkRefError('invalid_archive_root', rootInspection.issue.message, archivesDir), archivesDir)
    return result
  }
  if (!rootInspection.exists)
    return result
  result.rootExists = true

  const rootEntries = await readDirectory(archivesDir, archivesDir, result)
  if (!rootEntries)
    return result

  for (const entry of rootEntries) {
    const path = join(archivesDir, entry.name)
    if (entry.name === 'INDEX.md' && entry.isFile())
      continue
    if (entry.isDirectory()) {
      if (!isCanonicalWorkRefSegment(entry.name)) {
        addArchivePathDiagnostic(result, entry.name, path)
        continue
      }
      await inspectArchiveGroup(entry.name, path, result)
      continue
    }
    if (!entry.isFile() || !entry.name.endsWith('.md')) {
      addArchivePathDiagnostic(result, entry.name, path)
      continue
    }
    result.files.push(path)
  }

  result.files.sort()
  return result
}

/** Inspect the complete open-work tree once for all command projections. */
export async function inspectWorkTree(options: { changesDir?: string } = {}): Promise<WorkTreeInspection> {
  const changesDir = options.changesDir ?? CHANGES_DIR
  const result: WorkTreeInspection = { changes: [], briefs: [], diagnostics: [] }
  try {
    assertValidWorkRoot(changesDir, changesDir)
  }
  catch (error) {
    if (!(error instanceof WorkRefError))
      throw error
    addDiagnostic(result, error, changesDir)
    return result
  }

  const rootEntries = await readDirectory(changesDir, changesDir, result)
  if (!rootEntries)
    return result

  const rootDirectories = new Set(rootEntries.filter(entry => entry.isDirectory()).map(entry => entry.name))
  const rootMarkdownNames = new Set(rootEntries
    .filter(entry => entry.isFile() && entry.name.endsWith('.md'))
    .map(entry => entry.name.slice(0, -3)))
  const collidingGroups = new Set([...rootDirectories].filter(name => rootMarkdownNames.has(name)))

  for (const entry of rootEntries) {
    const path = join(changesDir, entry.name)
    if (entry.name === '.gitkeep' && entry.isFile())
      continue

    if (entry.isDirectory()) {
      if (!isCanonicalWorkRefSegment(entry.name)) {
        addDiagnostic(result, new WorkRefError(
          'invalid_work_ref',
          `stored work identity "${entry.name}" must be a safe Unicode NFC segment`,
          entry.name,
        ), path)
        continue
      }
      const colliding = collidingGroups.has(entry.name)
      if (colliding) {
        addDiagnostic(result, new WorkRefError(
          'work_ref_collision',
          `work identity "${entry.name}" is claimed by both a file and a directory`,
          entry.name,
        ), path)
      }
      await inspectGroupDirectory(entry.name, path, changesDir, result, colliding)
      continue
    }

    if (!entry.isFile() || !entry.name.endsWith('.md')) {
      addInvalidEntryDiagnostic(result, entry.name, path)
      continue
    }

    const name = entry.name.slice(0, -3)
    if (collidingGroups.has(name)) {
      continue
    }
    collectResolvedPath(path, changesDir, result)
  }

  result.changes.sort((a, b) => a.name.localeCompare(b.name))
  result.briefs.sort((a, b) => a.name.localeCompare(b.name))
  return result
}

async function inspectGroupDirectory(group: string, groupPath: string, changesDir: string, result: WorkTreeInspection, colliding: boolean): Promise<void> {
  const entries = await readDirectory(groupPath, group, result)
  if (!entries)
    return

  const briefEntry = entries.find(entry => entry.name === GROUP_BRIEF_FILENAME)
  if (!briefEntry) {
    addDiagnostic(result, new WorkRefError(
      'group_brief_missing',
      `Change Group "${group}" requires a Group Brief; run: rsp group create ${group}`,
      group,
    ), join(groupPath, GROUP_BRIEF_FILENAME))
  }
  else if (!briefEntry.isFile()) {
    addDiagnostic(result, new WorkRefError(
      'work_ref_not_file',
      `Group Brief must be a regular file: ${join(groupPath, GROUP_BRIEF_FILENAME)}`,
      group,
    ), join(groupPath, GROUP_BRIEF_FILENAME))
  }

  for (const entry of entries) {
    const input = `${group}/${entry.name}`
    const path = join(groupPath, entry.name)
    if (entry.name === GROUP_BRIEF_FILENAME && !entry.isFile())
      continue
    if (entry.name === 'brief.md') {
      addInvalidEntryDiagnostic(result, input, path)
      continue
    }
    if (entry.isDirectory()) {
      addDiagnostic(result, new WorkRefError(
        'unsupported_work_depth',
        `work identity "${input}" exceeds the supported one-level Change Group depth`,
        input,
      ), path)
      continue
    }
    if (!entry.isFile() || !entry.name.endsWith('.md')) {
      addInvalidEntryDiagnostic(result, input, path)
      continue
    }
    if (!colliding)
      collectResolvedPath(path, changesDir, result)
  }
}

async function inspectFocusGroup(group: string, groupPath: string, changesDir: string, result: FocusTreeInspection): Promise<void> {
  const entries = await readDirectory(groupPath, group, result)
  if (!entries)
    return
  for (const entry of entries) {
    const input = `${group}/${entry.name}`
    const path = join(groupPath, entry.name)
    if (entry.isDirectory()) {
      addDiagnostic(result, new WorkRefError(
        'unsupported_work_depth',
        `work identity "${input}" exceeds the supported one-level Change Group depth`,
        input,
      ), path)
      continue
    }
    if (!entry.isFile()) {
      addDiagnostic(result, new WorkRefError(
        'invalid_focus_path',
        `focus path must be a regular marker file: ${path}`,
        input,
      ), path)
      continue
    }
    collectFocusMarker(input, path, changesDir, result)
  }
}

async function inspectArchiveGroup(group: string, groupPath: string, result: ArchiveTreeInspection): Promise<void> {
  const entries = await readDirectory(groupPath, group, result)
  if (!entries)
    return
  for (const entry of entries) {
    const input = `${group}/${entry.name}`
    const path = join(groupPath, entry.name)
    if (!entry.isFile() || !entry.name.endsWith('.md')) {
      addArchivePathDiagnostic(result, input, path)
      continue
    }
    result.files.push(path)
  }
}

function collectFocusMarker(input: string, path: string, changesDir: string, result: FocusTreeInspection): void {
  try {
    const ref = resolveWorkRef(input, { changesDir, canonical: true, executable: true })
    result.markers.push({ name: ref.name, path })
  }
  catch (error) {
    if (!(error instanceof WorkRefError))
      throw error
    addDiagnostic(result, error, path)
  }
}

function collectResolvedPath(path: string, changesDir: string, result: WorkTreeInspection): void {
  try {
    const ref = resolveWorkRefPath(path, { changesDir })
    if (isExecutableWorkRef(ref))
      result.changes.push(ref)
    else
      result.briefs.push(ref)
  }
  catch (error) {
    if (!(error instanceof WorkRefError))
      throw error
    addDiagnostic(result, error, path)
  }
}

async function readDirectory(path: string, input: string, result: DiagnosticCollector) {
  try {
    return (await readdir(path, { withFileTypes: true })).sort((a, b) => a.name.localeCompare(b.name))
  }
  catch (error) {
    addDiagnostic(result, asReadFailure(path, input, error), path)
    return null
  }
}

function addInvalidEntryDiagnostic(result: DiagnosticCollector, input: string, path: string): void {
  addDiagnostic(result, new WorkRefError(
    'invalid_work_ref_path',
    `unsupported entry in the open-work tree: ${path}`,
    input,
  ), path)
}

function addArchivePathDiagnostic(result: DiagnosticCollector, input: string, path: string): void {
  addDiagnostic(result, new WorkRefError(
    'invalid_archive_path',
    `unsupported entry in the archive tree: ${path}`,
    input,
  ), path)
}

function addDiagnostic(result: DiagnosticCollector, error: WorkRefError, path: string): void {
  if (result.diagnostics.some(item => item.code === error.code && item.input === error.input))
    return
  result.diagnostics.push({ code: error.code, input: error.input, path, message: error.message })
}

function normalizeWorkRefName(name: string, allowGroupBrief: boolean): string {
  const segments = name.split('/')
  if (segments.length > 2) {
    throw new WorkRefError(
      'unsupported_work_depth',
      `work identity "${name}" exceeds the supported one-level Change Group depth`,
      name,
    )
  }
  if (!name || segments.some(segment => !segment)) {
    throw new WorkRefError(
      'invalid_work_ref',
      `work identity "${name}" must contain one or two safe Unicode segments`,
      name,
    )
  }
  const normalizedSegments = segments.map(normalizeWorkRefSegment)
  const child = normalizedSegments[1]
  if (segments.length === 2 && child === GROUP_BRIEF_FILENAME.slice(0, -3)) {
    throw new WorkRefError(
      'invalid_work_ref',
      `work identity "${name}" uses the reserved Group Brief filename`,
      name,
    )
  }
  if (segments.length === 2 && child === 'brief' && !allowGroupBrief) {
    throw new WorkRefError(
      'non_executable_work_ref',
      `work identity "${name}" is a Group Brief and cannot be used as an executable Change`,
      name,
    )
  }
  return normalizedSegments.join('/')
}

function assertNoNormalizationCollision(changesDir: string, segments: string[], input: string, isGroupBrief: boolean): void {
  for (let depth = 0; depth < segments.length; depth++) {
    const parent = join(changesDir, ...segments.slice(0, depth))
    const parentKind = getPathKind(parent, input)
    if (parentKind === 'missing')
      return
    if (parentKind !== 'directory')
      continue
    let entries
    try {
      entries = readdirSync(parent, { withFileTypes: true })
    }
    catch (error) {
      throw asReadFailure(parent, input, error)
    }
    const expected = segments[depth]
    for (const entry of entries) {
      let candidate: string | null = null
      if (entry.isDirectory())
        candidate = entry.name
      else if (entry.isFile() && entry.name.endsWith('.md'))
        candidate = entry.name.slice(0, -3)
      if (depth === segments.length - 1 && isGroupBrief && entry.name === GROUP_BRIEF_FILENAME)
        candidate = 'brief'
      if (candidate && candidate !== expected && candidate.normalize('NFC') === expected) {
        throw new WorkRefError(
          'work_ref_collision',
          `work identity "${input}" collides with non-canonical stored identity "${candidate}" after Unicode NFC normalization`,
          input,
        )
      }
    }
  }
}

function assertNoManagedNormalizationCollision(
  root: string,
  segments: string[],
  input: string,
  code: 'invalid_focus_path' | 'invalid_archive_path',
): void {
  for (let depth = 0; depth < segments.length; depth++) {
    const parent = join(root, ...segments.slice(0, depth))
    const parentKind = getPathKind(parent, input)
    if (parentKind === 'missing')
      return
    if (parentKind !== 'directory')
      continue
    let entries
    try {
      entries = readdirSync(parent, { withFileTypes: true })
    }
    catch (error) {
      throw asReadFailure(parent, input, error)
    }
    const expected = segments[depth]
    const alias = entries.find(entry => entry.name !== expected && entry.name.normalize('NFC') === expected)
    if (alias) {
      throw new WorkRefError(
        code,
        `managed identity "${input}" collides with non-canonical stored entry "${alias.name}" after Unicode NFC normalization`,
        input,
      )
    }
  }
}

function assertNoIdentityCollision(changesDir: string, segments: string[], input: string, finalFilename?: string): void {
  for (let depth = 1; depth <= segments.length; depth++) {
    const identityPath = join(changesDir, ...segments.slice(0, depth))
    const filePath = finalFilename && depth === segments.length
      ? join(changesDir, ...segments.slice(0, -1), finalFilename)
      : `${identityPath}.md`
    const fileKind = getPathKind(filePath, input)
    const identityKind = getPathKind(identityPath, input)
    const isPrefix = depth < segments.length
    const isFlatIdentity = segments.length === 1
    const identity = segments.slice(0, depth).join('/')

    if (fileKind !== 'missing' && fileKind !== 'file') {
      throw new WorkRefError(
        'work_ref_not_file',
        `open work path is not a regular file: ${filePath}`,
        input,
      )
    }
    if ((fileKind === 'file' && identityKind === 'directory') || (isPrefix && fileKind === 'file') || (isFlatIdentity && identityKind === 'directory')) {
      throw new WorkRefError(
        'work_ref_collision',
        `work identity "${identity}" is or would be claimed by both a file and a directory`,
        input,
      )
    }
    if (isPrefix && identityKind !== 'missing' && identityKind !== 'directory') {
      throw new WorkRefError(
        'invalid_work_ref_path',
        `open work path must be a real directory: ${identityPath}`,
        input,
      )
    }
    if (!isPrefix && !isFlatIdentity && identityKind === 'directory') {
      throw new WorkRefError(
        'unsupported_work_depth',
        `work identity "${identity}" exceeds the supported one-level Change Group depth`,
        input,
      )
    }
    if (!isPrefix && identityKind !== 'missing' && identityKind !== 'directory') {
      throw new WorkRefError(
        'invalid_work_ref_path',
        `unsupported entry in the open-work tree: ${identityPath}`,
        input,
      )
    }
  }
}

function assertValidWorkRoot(changesDir: string, input: string): void {
  assertManagedRoot(changesDir, input, 'invalid_work_root', 'open work root')
}

function assertManagedRoot(
  path: string,
  input: string,
  code: 'invalid_work_root' | 'invalid_focus_root' | 'invalid_archive_root',
  label: string,
  allowMissing = false,
): void {
  try {
    requireManagedDirectory(path, label, { allowMissing })
  }
  catch (error) {
    if (error instanceof ManagedPathError)
      throw new WorkRefError(code, error.message, input)
    throw error
  }
}

function assertOptionalManagedDirectory(
  path: string,
  input: string,
  code: 'invalid_focus_path' | 'invalid_archive_path',
  label: string,
): void {
  try {
    requireManagedDirectory(path, label, { allowMissing: true })
  }
  catch (error) {
    if (error instanceof ManagedPathError)
      throw new WorkRefError(code, error.message, input)
    throw error
  }
}

function getPathKind(path: string, input: string): 'missing' | 'file' | 'directory' | 'other' {
  try {
    const stats = lstatSync(path)
    if (stats.isFile())
      return 'file'
    if (stats.isDirectory())
      return 'directory'
    return 'other'
  }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT')
      return 'missing'
    throw asReadFailure(path, input, error)
  }
}

function asReadFailure(path: string, input: string, error: unknown): WorkRefError {
  const message = error instanceof Error ? error.message : String(error)
  return new WorkRefError(
    'work_tree_read_failed',
    `unable to inspect open work path ${path}: ${message}`,
    input,
  )
}

function normalizeLogicalPath(path: string): string {
  return path.split('\\').join('/')
}
