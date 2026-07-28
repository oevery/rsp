import { existsSync } from 'node:fs'
import { mkdir, readFile, rename, unlink } from 'node:fs/promises'
import { basename, join } from 'node:path'

import { resolveExecutableChange } from '../core/change-group.js'
import { CHANGES_DIR, FOCUS_DIR, pc } from '../core/config.js'
import { inspectChangeDependencies } from '../core/dependency-plan.js'
import { cleanupEmptyParentDirs, collectArchiveChecklist, guardRspInitialized } from '../core/helpers.js'
import { withRspLock } from '../core/lock.js'
import { toErrorMessage } from '../core/output.js'
import { resolveArchiveDirectory, resolveFocusMarkerPath, WorkRefError } from '../core/work-ref.js'

/** Archive a change and clear its focus marker. Never blocks — all checks are warnings. */
export async function archiveChange(name: string) {
  if (!name) {
    console.error(`  ${pc.red('Usage:')} rsp archive <name>`)
    process.exit(1)
  }
  guardRspInitialized()

  try {
    return await withRspLock('archive-change', async () => {
      const workRef = await resolveExecutableChange(name, { mustExist: true })
      const srcPath = workRef.path
      const archiveSubdir = resolveArchiveDirectory(workRef)
      const focusEntry = resolveFocusMarkerPath(workRef)
      const content = await readFile(srcPath, 'utf-8')
      const dependencyInspection = await inspectChangeDependencies()
      const checklist = collectArchiveChecklist(content, {
        activeBlockers: dependencyInspection.activeBlockers.get(name),
      })

      for (const line of checklist)
        console.log(`  ${pc.yellow('⚠')} ${line}`)
      if (checklist.length > 0)
        console.log(`  ${pc.dim('Archive will continue. Review the warnings above before treating this work as fully closed.')}\n`)

      const date = new Date().toISOString().slice(0, 10)
      const base = basename(workRef.name)
      await mkdir(archiveSubdir, { recursive: true })
      const archiveName = resolveArchiveName(archiveSubdir, date, base)
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

      const clearedMsg = focusCleared ? `  ${pc.dim('focus marker cleared')}\n` : ''
      console.log(`  ${pc.green('Archived:')} ${archiveName}\n${clearedMsg}`)

      for (const warning of postArchiveWarnings)
        console.log(`  ${pc.yellow('⚠')} ${warning}`)
      if (postArchiveWarnings.length > 0)
        console.log(`  ${pc.dim('Archive completed, but follow-up cleanup was only partially successful.')}\n`)

      if (existsSync('.git')) {
        console.log(`  ${pc.cyan('Git delivery:')}\n`)
        console.log(`    git status --short`)
        console.log(`    Inspect the complete archive transition; stage and commit only with separate Git authority.`)
        console.log()
      }
    })
  }
  catch (error) {
    if (error instanceof WorkRefError) {
      console.error(`  ${pc.red('Error:')} ${error.message}`)
      process.exit(1)
    }
    throw error
  }
}

/** Resolve a unique archive filename. First collision gets a "-2" suffix to keep "-1" unambiguous. */
export function resolveArchiveName(archiveSubdir: string, date: string, base: string): string {
  const initialName = `${date}_${base}.md`
  if (!existsSync(join(archiveSubdir, initialName)))
    return initialName

  const MAX_SUFFIX = 9999
  for (let index = 2; index <= MAX_SUFFIX; index++) {
    const candidate = `${date}_${base}-${index}.md`
    if (!existsSync(join(archiveSubdir, candidate)))
      return candidate
  }

  throw new WorkRefError(
    'archive_name_exhausted',
    `archive name collision exceeded ${MAX_SUFFIX} attempts for ${base}`,
    base,
  )
}
