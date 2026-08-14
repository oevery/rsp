import { existsSync, readdirSync } from 'node:fs'
import { mkdir, readFile, rename, unlink } from 'node:fs/promises'
import { basename, join } from 'node:path'

import { resolveExecutableChange } from '../core/change-group.js'
import { CHANGES_DIR, FOCUS_DIR, RSP_DIR, RSP_RULES_PATH } from '../core/config.js'
import { inspectChangeDependencies } from '../core/dependency-plan.js'
import { cleanupEmptyParentDirs } from '../core/filesystem.js'
import { withRspLock } from '../core/lock.js'
import { inspectManagedFile } from '../core/managed-path.js'
import { toErrorMessage } from '../core/output.js'
import { collectArchiveReadiness } from '../core/readiness.js'
import { resolveArchiveDirectory, resolveFocusMarkerPath, WorkRefError } from '../core/work-ref.js'

/** Archive a change and clear its focus marker after the deterministic completion gate passes. */
export type ArchiveChangeResult
  = | { ok: true, archiveName: string, focusCleared: boolean, readinessWarnings: string[], cleanupWarnings: string[], git: boolean }
    | { ok: false, kind: 'usage' | 'error' | 'blocked', message: string, warnings?: string[] }

export async function archiveChange(name: string): Promise<ArchiveChangeResult> {
  if (!name) {
    return { ok: false, kind: 'usage', message: 'rsp archive <name>' }
  }
  const initialization = inspectInitialization()
  if (initialization)
    return { ok: false, kind: 'error', message: initialization }

  try {
    return await withRspLock('archive-change', async () => {
      const workRef = await resolveExecutableChange(name, { mustExist: true })
      const srcPath = workRef.path
      const archiveSubdir = resolveArchiveDirectory(workRef)
      const focusEntry = resolveFocusMarkerPath(workRef)
      const date = new Date().toISOString().slice(0, 10)
      const base = basename(workRef.name)
      const archiveName = resolveArchiveName(archiveSubdir, date, base)
      const content = await readFile(srcPath, 'utf-8')
      const dependencyInspection = await inspectChangeDependencies()
      const readiness = collectArchiveReadiness(content, {
        activeBlockers: dependencyInspection.activeBlockers.get(workRef.name),
      })
      const checklist = readiness.warnings

      if (readiness.archiveReady === 'no') {
        return {
          ok: false,
          kind: 'blocked',
          message: 'complete all Tasks and required Verify items, and resolve active blockers.',
          warnings: checklist,
        }
      }

      await mkdir(archiveSubdir, { recursive: true })
      await rename(srcPath, join(archiveSubdir, archiveName))

      const postArchiveWarnings: string[] = []

      let focusCleared = false
      if (existsSync(focusEntry)) {
        try {
          await unlink(focusEntry)
          await cleanupEmptyParentDirs(focusEntry, FOCUS_DIR)
          focusCleared = true
        }
        catch (error) {
          postArchiveWarnings.push(`focus marker cleanup failed: ${toErrorMessage(error)}`)
        }
      }

      try {
        await cleanupEmptyParentDirs(srcPath, CHANGES_DIR)
      }
      catch (error) {
        postArchiveWarnings.push(`changes directory cleanup failed: ${toErrorMessage(error)}`)
      }

      return { ok: true, archiveName, focusCleared, readinessWarnings: checklist, cleanupWarnings: postArchiveWarnings, git: existsSync('.git') }
    })
  }
  catch (error) {
    if (error instanceof WorkRefError) {
      return { ok: false, kind: 'error', message: error.message }
    }
    throw error
  }
}

function inspectInitialization(): string | undefined {
  const rules = inspectManagedFile(RSP_RULES_PATH, 'fallback protocol', { allowMissing: true })
  const design = inspectManagedFile(join(RSP_DIR, 'specs', 'design.md'), 'design Spec', { allowMissing: true })
  if (!rules.issue && !design.issue && rules.exists && design.exists)
    return undefined
  const initialized = existsSync(RSP_DIR)
  return `${initialized ? 'RSP project requires an update' : 'RSP is not initialized in this project'}\n  ${initialized ? 'Run: rsp update' : 'Run: rsp init'}`
}

/** Resolve a unique archive filename. First collision gets a "-2" suffix to keep "-1" unambiguous. */
export function resolveArchiveName(archiveSubdir: string, date: string, base: string): string {
  const initialName = `${date}_${base}.md`
  if (!archiveNameExists(archiveSubdir, initialName))
    return initialName

  const MAX_SUFFIX = 9999
  for (let index = 2; index <= MAX_SUFFIX; index++) {
    const candidate = `${date}_${base}-${index}.md`
    if (!archiveNameExists(archiveSubdir, candidate))
      return candidate
  }

  throw new WorkRefError(
    'archive_name_exhausted',
    `archive name collision exceeded ${MAX_SUFFIX} attempts for ${base}`,
    base,
  )
}

function archiveNameExists(archiveSubdir: string, name: string): boolean {
  if (!existsSync(archiveSubdir))
    return false
  return readdirSync(archiveSubdir).some((entry) => {
    if (entry.normalize('NFC') !== name)
      return false
    if (entry !== name) {
      throw new WorkRefError(
        'work_ref_collision',
        `archive name has a Unicode normalization collision: ${entry} and ${name}`,
        name,
      )
    }
    return true
  })
}
