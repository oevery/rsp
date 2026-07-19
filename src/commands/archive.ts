import { existsSync } from 'node:fs'
import { mkdir, readFile, rename, unlink } from 'node:fs/promises'
import { basename, join } from 'node:path'

import { resolveExecutableChange } from '../core/change-group.js'
import { CHANGES_DIR, FOCUS_DIR, pc } from '../core/config.js'
import { cleanupEmptyParentDirs, collectArchiveChecklist, guardRspInitialized } from '../core/helpers.js'
import { withRspLock } from '../core/lock.js'
import { toErrorMessage } from '../core/output.js'
import { resolveArchiveDirectory, resolveFocusMarkerPath, WorkRefError } from '../core/work-ref.js'
import { buildArchiveIndex } from './archive-index.js'

export interface ArchiveOptions {
  dryRun?: boolean
}

/** Archive a change and clear its focus marker. Never blocks — all checks are warnings. */
export async function archiveChange(name: string, options: ArchiveOptions = {}) {
  if (!name) {
    console.error(`  ${pc.red('Usage:')} rsp archive <name>`)
    process.exit(1)
  }
  guardRspInitialized()

  if (options.dryRun) {
    const workRef = await resolveArchiveWorkRefOrExit(name)
    const content = await readFile(workRef.path, 'utf-8')
    const checklist = collectArchiveChecklist(content)

    console.log()
    console.log(`  ${pc.bold('Archive dry-run for')} ${pc.cyan(name)}`)
    console.log()
    if (checklist.length === 0) {
      console.log(`  ${pc.green('✓')} Ready to archive. No deterministic warnings found.\n`)
    }
    else {
      for (const line of checklist)
        console.log(`  ${pc.yellow('⚠')} ${line}`)
      console.log()
      console.log(`  ${pc.dim('Review the warnings above before treating this work as fully closed.')}\n`)
    }
    return
  }

  try {
    return await withRspLock('archive-change', async () => {
      const workRef = await resolveExecutableChange(name, { mustExist: true })
      const srcPath = workRef.path
      const archiveSubdir = resolveArchiveDirectory(workRef)
      const focusEntry = resolveFocusMarkerPath(workRef)
      const content = await readFile(srcPath, 'utf-8')
      const checklist = collectArchiveChecklist(content)

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

      try {
        await buildArchiveIndex({ acquireLock: false })
      }
      catch (error) {
        postArchiveWarnings.push(`archive index rebuild failed: ${toErrorMessage(error)}`)
      }

      for (const warning of postArchiveWarnings)
        console.log(`  ${pc.yellow('⚠')} ${warning}`)
      if (postArchiveWarnings.length > 0)
        console.log(`  ${pc.dim('Archive completed, but follow-up cleanup was only partially successful.')}\n`)

      if (existsSync('.git')) {
        const archiveRelPath = workRef.group ? join(workRef.group, archiveName) : archiveName
        console.log(`  ${pc.cyan('Git workflow:')}\n`)
        console.log(`    git add .rsp/archives/${archiveRelPath}`)
        console.log(`    git commit -m "feat: archive ${name}"`)
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

async function resolveArchiveWorkRefOrExit(name: string) {
  try {
    const workRef = await resolveExecutableChange(name, { mustExist: true })
    resolveArchiveDirectory(workRef)
    resolveFocusMarkerPath(workRef)
    return workRef
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
