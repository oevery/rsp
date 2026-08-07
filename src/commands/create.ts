import { existsSync } from 'node:fs'
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

import { resolveExecutableChange } from '../core/change-group.js'
import { CHANGES_DIR, FOCUS_DIR, pc } from '../core/config.js'
import { cleanupEmptyParentDirs, generateChangeContent, guardRspInitialized } from '../core/helpers.js'
import { createIssueRelationship } from '../core/issue-relationship.js'
import { withRspLock } from '../core/lock.js'
import { writeManagedFile } from '../core/managed-path.js'
import { resolveFocusMarkerPath, WorkRefError } from '../core/work-ref.js'

/** Create a new single-file change under .rsp/changes/<name>.md and focus it when newly created. */
export async function createChange(name: string, summary = '', kind?: string, options: { issue?: string, issueRelation?: string } = {}) {
  if (!name) {
    console.error(`  ${pc.red('Usage:')} rsp create <name> [summary]`)
    process.exit(1)
  }
  const hasIssueOption = options.issue !== undefined
  if (options.issueRelation && !hasIssueOption)
    throw new Error('--issue-relation requires --issue')
  const issues = options.issue !== undefined ? [createIssueRelationship(options.issue, options.issueRelation)] : []
  guardRspInitialized()

  try {
    return await withRspLock('create-change', async () => {
      const workRef = await resolveExecutableChange(name)
      const changePath = workRef.path
      const existed = existsSync(changePath)
      if (existed && hasIssueOption)
        throw new Error(`Change already exists; --issue cannot update ${workRef.name}`)
      if (!existed) {
        const focusEntry = resolveFocusMarkerPath(workRef)
        const content = generateChangeContent(workRef.name, summary, kind, { issues })
        await mkdir(dirname(changePath), { recursive: true })
        let changeCreated = false
        try {
          await writeFile(changePath, content, { flag: 'wx' })
          changeCreated = true
          await mkdir(FOCUS_DIR, { recursive: true })
          await mkdir(dirname(focusEntry), { recursive: true })
          await writeManagedFile(focusEntry, '', 'focus marker')
        }
        catch (error) {
          if (changeCreated) {
            try {
              await unlink(changePath)
              await cleanupEmptyParentDirs(changePath, CHANGES_DIR)
            }
            catch {
              // Preserve the original failure; doctor will report any residual path.
            }
          }
          throw error
        }
      }

      const label = existed ? 'Using' : pc.green('Created')
      console.log(`  ${label}: ${changePath}`)
      if (existed)
        console.log(`  ${pc.dim('Unchanged focus.')} Run: rsp focus ${workRef.name}`)
      else
        console.log(`  ${pc.dim('focused via focus.d')} → ${workRef.name}`)
      console.log(`  ${pc.cyan('Next:')} fill proposal/spec/design first, then implement and complete the tasks\n`)
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
