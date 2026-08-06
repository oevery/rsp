import { existsSync } from 'node:fs'
import { join } from 'node:path'

import { toErrorMessage } from '../core/output.js'
import { disposeWorkspace, findTargetWorktree, getWorkspaceRecord, runGit } from './session.js'

export interface LandResult {
  ok: boolean
  conflict: boolean
  workRef: string
  sourceBranch: string
  targetBranch: string
  targetWorktree: string
  commits: string[]
  targetHeadBefore: string
  targetHeadAfter: string
  cleanedUp: boolean
  cleanupError?: string
  message?: string
}

export async function landWorkspace(
  workRef: string,
  options: { targetBranch: string, commits: string[], cleanup?: boolean },
): Promise<LandResult> {
  const record = await getWorkspaceRecord(workRef)
  if (options.targetBranch !== record.targetBranch)
    throw new Error(`target branch differs from workspace ownership: expected ${record.targetBranch}`)
  if (options.commits.length === 0)
    throw new Error('at least one explicit commit is required')

  const targetWorktree = await findTargetWorktree(record, options.targetBranch)
  const gitDirRaw = (await runGit(targetWorktree, ['rev-parse', '--git-dir'])).stdout
  const gitDir = gitDirRaw.startsWith('/') ? gitDirRaw : join(targetWorktree, gitDirRaw)
  for (const marker of ['MERGE_HEAD', 'CHERRY_PICK_HEAD', 'REBASE_HEAD', 'REVERT_HEAD']) {
    if (existsSync(join(gitDir, marker)))
      throw new Error(`target worktree already has an in-progress Git operation: ${marker}`)
  }

  const resolvedCommits: string[] = []
  const workspaceCommits = (await runGit(record.repository, ['rev-list', '--reverse', `${record.baseCommit}..${record.branch}`])).stdout.split('\n').filter(Boolean)
  for (const value of options.commits) {
    const commit = (await runGit(record.repository, ['rev-parse', '--verify', `${value}^{commit}`])).stdout
    if (!workspaceCommits.includes(commit))
      throw new Error(`commit is not owned by the workspace after its recorded base: ${value}`)
    if (resolvedCommits.includes(commit))
      throw new Error(`commit is listed more than once: ${value}`)
    const parents = (await runGit(record.repository, ['rev-list', '--parents', '-n', '1', commit])).stdout.split(' ')
    if (parents.length > 2)
      throw new Error(`merge commits require an explicit mainline and are unsupported: ${value}`)
    resolvedCommits.push(commit)
  }
  const positions = resolvedCommits.map(commit => workspaceCommits.indexOf(commit))
  if (positions.some((position, index) => index > 0 && position <= positions[index - 1]!))
    throw new Error('commits must follow their workspace history order')
  if (options.cleanup) {
    const unlanded = (await runGit(record.repository, ['rev-list', '--reverse', `${record.targetBranch}..${record.branch}`])).stdout.split('\n').filter(Boolean)
    if (unlanded.length !== resolvedCommits.length || unlanded.some((commit, index) => commit !== resolvedCommits[index]))
      throw new Error('cleanup requires the explicit commit list to equal every workspace commit ahead of the target')
  }

  const targetHeadBefore = (await runGit(targetWorktree, ['rev-parse', 'HEAD'])).stdout
  const cherryPick = await runGit(targetWorktree, ['cherry-pick', ...resolvedCommits], true)
  if (cherryPick.exitCode !== 0) {
    return {
      ok: false,
      conflict: existsSync(join(gitDir, 'CHERRY_PICK_HEAD')),
      workRef,
      sourceBranch: record.branch,
      targetBranch: options.targetBranch,
      targetWorktree,
      commits: resolvedCommits,
      targetHeadBefore,
      targetHeadAfter: (await runGit(targetWorktree, ['rev-parse', 'HEAD'])).stdout,
      cleanedUp: false,
      message: cherryPick.stderr || cherryPick.stdout,
    }
  }

  const targetHeadAfter = (await runGit(targetWorktree, ['rev-parse', 'HEAD'])).stdout
  let cleanedUp = false
  let cleanupError: string | undefined
  if (options.cleanup) {
    try {
      await disposeWorkspace(workRef, { landed: true })
      cleanedUp = true
    }
    catch (error) {
      cleanupError = toErrorMessage(error)
    }
  }
  return {
    ok: true,
    conflict: false,
    workRef,
    sourceBranch: record.branch,
    targetBranch: options.targetBranch,
    targetWorktree,
    commits: resolvedCommits,
    targetHeadBefore,
    targetHeadAfter,
    cleanedUp,
    cleanupError,
  }
}
