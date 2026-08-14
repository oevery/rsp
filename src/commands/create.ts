import { existsSync } from 'node:fs'
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

import { generateChangeContent } from '../core/artifacts.js'
import { resolveExecutableChange } from '../core/change-group.js'
import { CHANGES_DIR, FOCUS_DIR, RSP_DIR, RSP_RULES_PATH } from '../core/config.js'
import { cleanupEmptyParentDirs } from '../core/filesystem.js'
import { createIssueRelationship } from '../core/issue-relationship.js'
import { withRspLock } from '../core/lock.js'
import { inspectManagedFile, writeManagedFile } from '../core/managed-path.js'
import { resolveFocusMarkerPath, WorkRefError } from '../core/work-ref.js'

/** Create a new single-file change under .rsp/changes/<name>.md and focus it when newly created. */
export async function createChange(
  name: string,
  summary = '',
  kind?: string,
  options: { issue?: string, issueRelation?: string, deprecatedLite?: boolean } = {},
): Promise<CreateChangeResult> {
  if (!name) {
    return { ok: false, kind: 'usage', message: 'rsp create <name> [summary]' }
  }
  const warning = options.deprecatedLite
    ? 'create option "--lite" is deprecated and ignored; using the standard kind-aware Change template'
    : undefined
  const hasIssueOption = options.issue !== undefined
  if (options.issueRelation && !hasIssueOption)
    throw new Error('--issue-relation requires --issue')
  const issues = options.issue !== undefined ? [createIssueRelationship(options.issue, options.issueRelation)] : []
  const initialization = inspectInitialization()
  if (initialization)
    return { ok: false, kind: 'error', message: initialization, warning }

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

      return { ok: true, existed, changePath, workRef: workRef.name, warning }
    })
  }
  catch (error) {
    if (error instanceof WorkRefError) {
      return { ok: false, kind: 'error', message: error.message, warning }
    }
    throw error
  }
}

export type CreateChangeResult
  = | { ok: true, existed: boolean, changePath: string, workRef: string, warning?: string }
    | { ok: false, kind: 'usage' | 'error', message: string, warning?: string }

function inspectInitialization(): string | undefined {
  const rules = inspectManagedFile(RSP_RULES_PATH, 'fallback protocol', { allowMissing: true })
  const design = inspectManagedFile(`${RSP_DIR}/specs/design.md`, 'design Spec', { allowMissing: true })
  if (!rules.issue && !design.issue && rules.exists && design.exists)
    return undefined
  const initialized = existsSync(RSP_DIR)
  return `${initialized ? 'RSP project requires an update' : 'RSP is not initialized in this project'}\n  ${initialized ? 'Run: rsp update' : 'Run: rsp init'}`
}
