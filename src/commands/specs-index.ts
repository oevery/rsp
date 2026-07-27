import { readFile, unlink } from 'node:fs/promises'
import { basename, dirname, isAbsolute, join, relative, sep } from 'node:path'

import { inspectRspConfig, pc, RSP_DIR } from '../core/config.js'
import { DEFAULT_DECISION_RECORDS_PATH, resolveDecisionRecordsPath } from '../core/decisions.js'
import { normalizeLogicalPath, parseFrontmatter } from '../core/helpers.js'
import { withRspLock } from '../core/lock.js'
import { inspectManagedFileTree, writeManagedFile } from '../core/managed-path.js'

export const SPECS_INDEX_FILENAME = '00-index.md'
export const LEGACY_SPECS_INDEX_FILENAME = 'INDEX.md'

interface IndexWrite {
  path: string
  content: string
}

interface SpecsIndexPlan {
  writes: IndexWrite[]
  removals: string[]
  expectedPaths: string[]
}

export interface SpecsIndexHealth {
  ok: boolean
  expectedPaths: string[]
  stalePaths: string[]
  obsoletePaths: string[]
  issues: string[]
}

export interface BuildSpecsIndexesOptions {
  acquireLock?: boolean
  quiet?: boolean
  /** Limit writes to this Spec directory and its ancestors. Inspection remains complete and fail closed. */
  affectedDirectory?: string
}

/** Reconcile generated direct-child 00-index.md navigation for the managed Specs tree. */
export async function buildSpecsIndex(options: BuildSpecsIndexesOptions = {}): Promise<boolean | undefined> {
  const { acquireLock = true, quiet = false, affectedDirectory } = options
  if (acquireLock)
    return withRspLock('specs-index', async () => buildSpecsIndex({ acquireLock: false, quiet, affectedDirectory }))

  const plan = await planSpecsIndexes(affectedDirectory)
  for (const write of plan.writes)
    await writeManagedFile(write.path, write.content, 'Specs index')
  for (const path of plan.removals)
    await unlink(path)

  const changed = plan.writes.length > 0 || plan.removals.length > 0
  if (!quiet) {
    if (changed)
      console.log(`  ${pc.green('Specs indexes updated:')} ${plan.writes.length} written, ${plan.removals.length} removed.\n`)
    else
      console.log(`  ${pc.dim('Specs indexes already up to date.')}\n`)
  }
  return changed
}

/** Inspect the same projection used by update without mutating managed files. */
export async function inspectSpecsIndexHealth(): Promise<SpecsIndexHealth> {
  try {
    const plan = await planSpecsIndexes()
    return {
      ok: plan.writes.length === 0 && plan.removals.length === 0,
      expectedPaths: plan.expectedPaths.map(toProjectPath),
      stalePaths: plan.writes.map(write => toProjectPath(write.path)),
      obsoletePaths: plan.removals.map(toProjectPath),
      issues: [],
    }
  }
  catch (error) {
    return {
      ok: false,
      expectedPaths: [],
      stalePaths: [],
      obsoletePaths: [],
      issues: [error instanceof Error ? error.message : String(error)],
    }
  }
}

async function planSpecsIndexes(affectedDirectory?: string): Promise<SpecsIndexPlan> {
  const specsDir = join(RSP_DIR, 'specs')
  const configInspection = await inspectRspConfig()
  if (configInspection.issues.length > 0)
    throw new Error(configInspection.issues.join('; '))
  const decisionRecordsPath = resolveDecisionRecordsPath(configInspection.config)

  const inspection = await inspectManagedFileTree(specsDir, 'Specs', { allowMissing: true })
  if (inspection.issues.length > 0)
    throw inspection.issues[0]
  if (!inspection.rootExists)
    return { writes: [], removals: [], expectedPaths: [] }

  const excludedDirectories = [DEFAULT_DECISION_RECORDS_PATH, decisionRecordsPath]
    .filter(path => isInside(specsDir, path))
  const isExcluded = (path: string) => excludedDirectories.some(directory => isInside(directory, path))

  const managedIndexFiles = inspection.files
    .filter(path => !isExcluded(path))
    .filter(path => basename(path) === SPECS_INDEX_FILENAME || path === join(specsDir, LEGACY_SPECS_INDEX_FILENAME))
  const recognizedIndexes = new Set<string>()
  for (const path of managedIndexFiles) {
    let metadata
    try {
      metadata = parseFrontmatter(await readFile(path, 'utf-8'))
    }
    catch (error) {
      throw new Error(`unable to inspect reserved Specs index ${toProjectPath(path)}: ${error instanceof Error ? error.message : String(error)}`)
    }
    const expectedSourceDirectory = path === join(specsDir, LEGACY_SPECS_INDEX_FILENAME)
      ? toProjectPath(specsDir)
      : toProjectPath(dirname(path))
    if (metadata?.kind !== 'generated-index'
      || metadata.index_type !== 'specs'
      || metadata.source_dir !== expectedSourceDirectory) {
      throw new Error(`reserved Specs index is not recognized generated content: ${toProjectPath(path)}`)
    }
    recognizedIndexes.add(path)
  }

  const specFiles = inspection.files
    .filter(path => path.endsWith('.md'))
    .filter(path => !isExcluded(path))
    .filter(path => basename(path) !== SPECS_INDEX_FILENAME)
    .filter(path => path !== join(specsDir, LEGACY_SPECS_INDEX_FILENAME))
    .sort()

  const directories = new Set<string>([specsDir])
  for (const file of specFiles) {
    let current = dirname(file)
    while (isInside(specsDir, current)) {
      directories.add(current)
      if (current === specsDir)
        break
      current = dirname(current)
    }
  }
  const orderedDirectories = [...directories].sort()
  const expectedPaths = orderedDirectories.map(directory => join(directory, SPECS_INDEX_FILENAME))
  const expectedSet = new Set(expectedPaths)

  const writableDirectories = affectedDirectory
    ? new Set(ancestorDirectories(specsDir, affectedDirectory))
    : directories
  const writes: IndexWrite[] = []
  for (const directory of orderedDirectories) {
    if (!writableDirectories.has(directory))
      continue
    const directFiles = specFiles.filter(path => dirname(path) === directory)
    const directDirectories = orderedDirectories.filter(path => path !== directory && dirname(path) === directory)
    const content = await renderSpecsIndex(specsDir, directory, directFiles, directDirectories)
    const path = join(directory, SPECS_INDEX_FILENAME)
    const existingContent = recognizedIndexes.has(path) ? await readFile(path, 'utf-8') : null
    if (existingContent !== content)
      writes.push({ path, content })
  }

  const removals = [...recognizedIndexes]
    .filter(path => path === join(specsDir, LEGACY_SPECS_INDEX_FILENAME)
      || (!expectedSet.has(path) && !affectedDirectory))
    .sort()

  return { writes, removals, expectedPaths }
}

async function renderSpecsIndex(specsDir: string, directory: string, files: string[], directories: string[]): Promise<string> {
  const sourceDir = toProjectPath(directory)
  const scope = normalizeLogicalPath(relative(specsDir, directory))
  const title = scope === '' ? 'Specs Index' : `Specs: ${scope}`
  const entries: Array<{ sortKey: string, line: string }> = []

  for (const childDirectory of directories) {
    const name = basename(childDirectory)
    entries.push({
      sortKey: `${name}/`,
      line: `| [${escapeLabel(`${name}/`)}](${encodeLink(`${name}/${SPECS_INDEX_FILENAME}`)}) | directory | ${escapeCell(name)} | — |`,
    })
  }
  for (const path of files) {
    const name = basename(path)
    const content = await readFile(path, 'utf-8')
    const metadata = parseFrontmatter(content)
    const metadataTitle = metadata && typeof metadata.title === 'string' ? metadata.title : ''
    const entryTitle = metadataTitle || extractTitle(content) || name.replace(/\.md$/, '')
    const summary = extractSummary(content, metadata?.summary)
    entries.push({
      sortKey: name,
      line: `| [${escapeLabel(name)}](${encodeLink(name)}) | spec | ${escapeCell(entryTitle)} | ${escapeCell(summary || '—')} |`,
    })
  }
  entries.sort((left, right) => left.sortKey < right.sortKey ? -1 : left.sortKey > right.sortKey ? 1 : 0)

  const lines = [
    '---',
    `title: ${JSON.stringify(title)}`,
    `summary: ${JSON.stringify(`Direct Specs and child Spec directories under ${sourceDir}.`)}`,
    'kind: generated-index',
    'index_type: specs',
    `source_dir: ${JSON.stringify(sourceDir)}`,
    `entry_count: ${entries.length}`,
    '---',
    '',
    `# ${title}`,
    '',
    '_Generated direct-child navigation. Edit the linked Specs, then run `rsp update`._',
    '',
  ]

  if (entries.length === 0) {
    lines.push('_No Specs or child Spec directories yet._')
  }
  else {
    lines.push('| Entry | Kind | Title | Summary |')
    lines.push('|-------|------|-------|---------|')
    lines.push(...entries.map(entry => entry.line))
  }
  return lines.join('\n')
}

function ancestorDirectories(root: string, directory: string): string[] {
  if (!isInside(root, directory))
    throw new Error(`affected Spec directory must stay inside ${toProjectPath(root)}: ${directory}`)
  const result: string[] = []
  let current = directory
  while (true) {
    result.push(current)
    if (current === root)
      return result
    current = dirname(current)
  }
}

function isInside(directory: string, path: string): boolean {
  const rel = relative(directory, path)
  return rel === '' || (!isAbsolute(rel) && rel !== '..' && !rel.startsWith(`..${sep}`))
}

function toProjectPath(path: string): string {
  return normalizeLogicalPath(relative('.', path))
}

function extractTitle(content: string): string {
  for (const rawLine of content.split('\n')) {
    if (rawLine.startsWith('# '))
      return rawLine.slice(2).trim()
  }
  return ''
}

function extractSummary(content: string, frontmatterSummary?: unknown): string {
  if (typeof frontmatterSummary === 'string' && frontmatterSummary.trim() !== '')
    return frontmatterSummary.trim()

  let inFrontmatter = false
  for (const rawLine of content.split('\n')) {
    const line = rawLine.trim()
    if (line === '---' || line === '...') {
      inFrontmatter = !inFrontmatter
      continue
    }
    if (inFrontmatter || line === '' || line.startsWith('#'))
      continue
    return line.replace(/^[-*]\s*/, '').trim()
  }
  return ''
}

function escapeCell(value: string): string {
  return value.replace(/\|/g, '\\|').replace(/\r?\n/g, ' ')
}

function escapeLabel(value: string): string {
  return value.replace(/([\\[\]])/g, '\\$1')
}

function encodeLink(value: string): string {
  return encodeURI(value).replace(/\(/g, '%28').replace(/\)/g, '%29')
}
