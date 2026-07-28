import { mkdir, rename, writeFile } from 'node:fs/promises'
import { join } from 'node:path'

import { generateGroupBriefContent, hasArchivedGroupBrief, inspectChangeGroups } from '../core/change-group.js'
import { CHANGES_DIR, pc } from '../core/config.js'
import { cleanupEmptyParentDirs, guardRspInitialized } from '../core/helpers.js'
import { withRspLock } from '../core/lock.js'
import { resolveManagedDirectoryChain } from '../core/managed-path.js'
import { toErrorMessage } from '../core/output.js'
import { resolveArchiveDirectory, resolveWorkRef, WorkRefError } from '../core/work-ref.js'
import { resolveArchiveName } from './archive.js'

class ChangeGroupError extends Error {
  override name = 'ChangeGroupError'
}

export async function createChangeGroup(name: string, goal = ''): Promise<void> {
  if (!name) {
    console.error(`  ${pc.red('Usage:')} rsp group create <name> [goal]`)
    process.exit(1)
  }
  guardRspInitialized()

  try {
    await withRspLock('create-change-group', async () => {
      const ref = resolveWorkRef(`${name}/brief`)
      if (ref.kind !== 'group-brief')
        throw new WorkRefError('invalid_work_ref', `invalid Change Group name: ${name}`, name)
      const groupName = ref.group
      if (await hasArchivedGroupBrief(groupName))
        throw new ChangeGroupError(`archived Change Group cannot be reopened: ${groupName}`)

      const groupDirectory = resolveManagedDirectoryChain(CHANGES_DIR, [groupName], 'Change Group path')
      await mkdir(groupDirectory, { recursive: true })
      try {
        await writeFile(ref.path, generateGroupBriefContent(groupName, goal), { flag: 'wx' })
      }
      catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'EEXIST')
          throw new ChangeGroupError(`Change Group already exists: ${groupName}`)
        throw error
      }

      console.log(`  ${pc.green('Created Change Group:')} ${groupName}`)
      console.log(`  ${pc.dim('Unfocused Group Brief:')} ${ref.path}`)
      console.log(`  ${pc.cyan('Next:')} fill the brief, then create direct child Changes with rsp create ${groupName}/<change>\n`)
    })
  }
  catch (error) {
    if (error instanceof WorkRefError || error instanceof ChangeGroupError) {
      console.error(`  ${pc.red('Error:')} ${error.message}`)
      process.exit(1)
    }
    throw error
  }
}

export async function closeChangeGroup(name: string): Promise<void> {
  if (!name) {
    console.error(`  ${pc.red('Usage:')} rsp group close <name>`)
    process.exit(1)
  }
  guardRspInitialized()

  try {
    await withRspLock('close-change-group', async () => {
      const ref = resolveWorkRef(`${name}/brief`, { mustExist: true })
      if (ref.kind !== 'group-brief')
        throw new ChangeGroupError(`invalid Change Group name: ${name}`)

      const inspection = await inspectChangeGroups()
      const groupName = ref.group
      const group = inspection.groups.find(candidate => candidate.name === groupName)
      if (!group)
        throw new ChangeGroupError(`Change Group not found: ${groupName}`)
      const reasons = collectCloseReasons(group, inspection.diagnostics.filter(diagnostic => diagnostic.change === groupName && diagnostic.severity === 'error').map(diagnostic => diagnostic.message))
      if (reasons.length > 0)
        throw new ChangeGroupError(`Change Group "${groupName}" is not ready to close: ${reasons.join('; ')}`)

      const archiveDirectory = resolveArchiveDirectory(ref)
      const date = new Date().toISOString().slice(0, 10)
      const archiveName = resolveArchiveName(archiveDirectory, date, 'brief')
      await mkdir(archiveDirectory, { recursive: true })
      await rename(ref.path, join(archiveDirectory, archiveName))
      const warnings: string[] = []
      try {
        await cleanupEmptyParentDirs(ref.path, CHANGES_DIR)
      }
      catch (error) {
        warnings.push(`changes directory cleanup failed: ${toErrorMessage(error)}`)
      }
      console.log(`  ${pc.green('Closed Change Group:')} ${groupName}`)
      console.log(`  ${pc.dim('Archived Group Brief:')} ${join(archiveDirectory, archiveName)}\n`)
      for (const warning of warnings)
        console.log(`  ${pc.yellow('⚠')} ${warning}`)
      if (warnings.length > 0)
        console.log(`  ${pc.yellow('Group close completed, but follow-up cleanup was only partially successful.')}\n`)
    })
  }
  catch (error) {
    if (error instanceof WorkRefError || error instanceof ChangeGroupError) {
      console.error(`  ${pc.red('Error:')} ${error.message}`)
      process.exit(1)
    }
    throw error
  }
}

function collectCloseReasons(group: Awaited<ReturnType<typeof inspectChangeGroups>>['groups'][number], errors: string[]): string[] {
  const reasons = [...errors, ...group.warnings]
  const open = group.slices.filter(slice => slice.state === 'open').map(slice => slice.name)
  const missing = group.slices.filter(slice => slice.state === 'missing').map(slice => slice.name)
  if (open.length > 0)
    reasons.push(`open slices: ${open.join(', ')}`)
  if (missing.length > 0)
    reasons.push(`missing slices: ${missing.join(', ')}`)
  if (group.completion.total === 0)
    reasons.push('no completion conditions are declared')
  else if (group.completion.done !== group.completion.total)
    reasons.push(`completion conditions incomplete: ${group.completion.done}/${group.completion.total}`)
  if (group.blockers)
    reasons.push('active group blockers remain')
  return [...new Set(reasons)]
}
