import type { RuntimeDiagnostic } from '../types.js'
import { existsSync } from 'node:fs'
import { readdir, readFile, rmdir } from 'node:fs/promises'
import { basename, dirname, join, relative, sep } from 'node:path'
import { OBSOLETE_RSP_RULES_PATH, pc, RSP_DIR, RSP_RULES_PATH } from './config.js'
import { inspectManagedFile } from './managed-path.js'
import { toErrorMessage } from './output.js'

interface WalkOptions {
  onError?: (diagnostic: RuntimeDiagnostic) => void
}

export async function walkMarkdownFiles(dir: string, options: WalkOptions = {}): Promise<string[]> {
  const all = await walkFiles(dir, options)
  return all.filter(f => f.endsWith('.md'))
}

export interface UnsupportedRulesEntry {
  path: string
  kind: 'file' | 'directory'
}

export interface UnsupportedRulesInspection {
  entries: UnsupportedRulesEntry[]
  diagnostics: RuntimeDiagnostic[]
  directoryRemaining: boolean
}

export async function inspectUnsupportedRules(): Promise<UnsupportedRulesInspection> {
  const rulesDir = join(RSP_DIR, 'rules')
  const diagnostics: RuntimeDiagnostic[] = []
  const rawEntries = await walkAllEntries(rulesDir, diagnostics)
  const entries = rawEntries
    .filter(entry => entry.path !== OBSOLETE_RSP_RULES_PATH)
    .map(entry => ({ path: normalizeLogicalPath(relative(rulesDir, entry.path)), kind: entry.kind }))
  const obsoleteFallbackPresent = existsSync(OBSOLETE_RSP_RULES_PATH)
  return {
    entries,
    diagnostics,
    directoryRemaining: existsSync(rulesDir) && (!obsoleteFallbackPresent || entries.length > 0),
  }
}

async function walkAllEntries(dir: string, diagnostics: RuntimeDiagnostic[]): Promise<Array<{ path: string, kind: 'file' | 'directory' }>> {
  const entries: Array<{ path: string, kind: 'file' | 'directory' }> = []
  try {
    const items = await readdir(dir, { withFileTypes: true })
    for (const item of items) {
      const path = join(dir, item.name)
      const kind = item.isDirectory() ? 'directory' : 'file'
      entries.push({ path, kind })
      if (kind === 'directory')
        entries.push(...await walkAllEntries(path, diagnostics))
    }
  }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      diagnostics.push({ code: 'walk_failed', operation: 'readdir', path: dir, message: toErrorMessage(error) })
    }
  }
  return entries
}

export async function walkFiles(dir: string, options: WalkOptions = {}): Promise<string[]> {
  const files: string[] = []
  try {
    const items = await readdir(dir, { withFileTypes: true })
    for (const item of items) {
      if (item.name.startsWith('.'))
        continue
      const filePath = join(dir, item.name)
      if (item.isDirectory())
        files.push(...await walkFiles(filePath, options))
      else
        files.push(filePath)
    }
  }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      options.onError?.({ code: 'walk_failed', operation: 'readdir', path: dir, message: toErrorMessage(error) })
    }
  }
  return files
}

export function normalizeLogicalPath(pathValue: string): string {
  return pathValue.split(sep).join('/').replace(/\\/g, '/')
}

export const SPEC_NAME_RE = /^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/

export function isValidSpecName(name: string): boolean {
  return SPEC_NAME_RE.test(name)
}

export function guardRspInitialized(): void {
  const designPath = join(RSP_DIR, 'specs', 'design.md')
  const rules = inspectManagedFile(RSP_RULES_PATH, 'fallback protocol', { allowMissing: true })
  const design = inspectManagedFile(designPath, 'design Spec', { allowMissing: true })
  if (rules.issue || design.issue || !rules.exists || !design.exists) {
    const initialized = existsSync(RSP_DIR)
    console.error(`  ${pc.red('Error:')} ${initialized ? 'RSP project requires an update' : 'RSP is not initialized in this project'}`)
    console.error(`  ${pc.dim(initialized ? 'Run: rsp update' : 'Run: rsp init')}`)
    process.exit(1)
  }
}

export async function cleanupEmptyParentDirs(path: string, stopDir: string) {
  let parent = dirname(path)
  while (parent !== stopDir) {
    try {
      const remaining = await readdir(parent)
      if (remaining.length === 0)
        await rmdir(parent)
      else
        break
    }
    catch {
      break
    }
    parent = dirname(parent)
  }
}

export async function detectProjectName(): Promise<string> {
  try {
    if (existsSync('package.json')) {
      const raw = await readFile('package.json', 'utf-8')
      const pkg = JSON.parse(raw)
      if (pkg.name && pkg.name !== '')
        return pkg.name
    }
  }
  catch { /* fall through */ }
  return basename(process.cwd())
}
