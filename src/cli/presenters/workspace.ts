import type { CommitResult } from '../../commands/commit.js'
import type { landWorkspaceCommand } from '../../commands/land.js'
import type {
  DisposeWorkspaceCommandResult,
  InspectWorkspaceCommandResult,
  PrepareWorkspaceCommandResult,
  RegisterWorkspaceActivityCommandResult,
  ShowWorkspaceCommandResult,
  StopWorkspaceActivityCommandResult,
  WorkspaceCommandError,
} from '../../commands/workspace.js'
import { publicActivity, publicObservation, publicRecord } from '../../commands/workspace.js'
import { emitJson } from '../../core/output.js'

type LandWorkspaceCommandResult = Awaited<ReturnType<typeof landWorkspaceCommand>>

function presentWorkspaceError(result: WorkspaceCommandError, json: boolean): void {
  if (json)
    emitJson(result)
  else
    throw new Error(result.error.message)
}

export function presentPrepareWorkspace(result: PrepareWorkspaceCommandResult, json: boolean): void {
  if (!result.ok)
    return presentWorkspaceError(result, json)
  if (json)
    return emitJson({ command: result.command, ok: true, resumed: result.resumed, workspace: publicRecord(result.record) })
  console.log(`  ${result.resumed ? 'Resumed' : 'Prepared'}: ${result.record.workRef}`)
  console.log(`  branch: ${result.record.branch}`)
  console.log(`  path: ${result.record.path}`)
  console.log(`  target: ${result.record.targetBranch} @ ${result.record.baseCommit}`)
}

export function presentShowWorkspace(result: ShowWorkspaceCommandResult, json: boolean): void {
  if (!result.ok)
    return presentWorkspaceError(result, json)
  const observation = result.observation
  if (json)
    return emitJson({ command: result.command, ok: true, workspace: publicObservation(observation) })
  console.log(`  Workspace: ${observation.record.workRef}`)
  console.log(`  branch: ${observation.record.branch}`)
  console.log(`  path: ${observation.record.path}`)
  console.log(`  registered: ${observation.registered ? 'yes' : 'no'}`)
  console.log(`  dirty paths: ${observation.dirty.length}`)
  console.log(`  commits ahead of ${observation.record.targetBranch}: ${observation.aheadOfTarget}`)
  console.log(`  activities: ${Object.keys(observation.record.activities ?? {}).join(', ') || 'none'}`)
}

export function presentInspectWorkspace(result: InspectWorkspaceCommandResult, json: boolean): void {
  if (!result.ok)
    return presentWorkspaceError(result, json)
  if (json)
    return emitJson({ command: result.command, ok: true, facts: result.facts })
  console.log(`  Workspace facts: ${result.facts.workspace.workRef}`)
  console.log(`  tracked paths: ${result.facts.repository.trackedPaths.length}${result.facts.repository.trackedPathsTruncated ? '+' : ''}`)
  console.log(`  local-only paths: ${result.facts.repository.localOnlyPaths.length}${result.facts.repository.localOnlyPathsTruncated ? '+' : ''}`)
  console.log(`  changed paths: ${result.facts.repository.changedPaths.length}`)
  console.log(`  commits ahead of ${result.facts.workspace.targetBranch}: ${result.facts.repository.commitsAheadOfTarget}`)
}

export function presentRegisterWorkspaceActivity(result: RegisterWorkspaceActivityCommandResult, json: boolean): void {
  if (!result.ok)
    return presentWorkspaceError(result, json)
  if (json)
    return emitJson({ command: result.command, ok: true, workRef: result.workRef, activity: publicActivity(result.activity) })
  console.log(`  Registered activity: ${result.activity.id}`)
  console.log(`  pid: ${result.activity.pid}`)
  if (result.activity.processGroupId)
    console.log(`  process group: ${result.activity.processGroupId}`)
  console.log(`  resources: ${result.activity.resources.join(', ') || 'none'}`)
}

export function presentStopWorkspaceActivity(result: StopWorkspaceActivityCommandResult, json: boolean): void {
  if (!result.ok)
    return presentWorkspaceError(result, json)
  if (json)
    return emitJson({ command: result.command, ok: true, workRef: result.workRef, activity: publicActivity(result.activity) })
  console.log(`  Stopped activity: ${result.activity.id}`)
  console.log(`  pid: ${result.activity.pid}`)
}

export function presentDisposeWorkspace(result: DisposeWorkspaceCommandResult, json: boolean): void {
  if (!result.ok)
    return presentWorkspaceError(result, json)
  if (json)
    return emitJson({ command: result.command, ok: true, workRef: result.workRef, branch: result.record.branch, path: result.record.path })
  console.log(`  Disposed: ${result.workRef}`)
  console.log(`  removed branch: ${result.record.branch}`)
  console.log(`  removed worktree: ${result.record.path}`)
}

export function presentLandWorkspace(result: LandWorkspaceCommandResult, json: boolean): void {
  if (json) {
    emitJson({ command: 'land', ...result })
    return
  }
  if (!result.ok) {
    console.error(`  Landing stopped: ${result.conflict ? 'cherry-pick conflict' : 'cherry-pick failed'}`)
    console.error(`  target worktree: ${result.targetWorktree}`)
    console.error(`  source workspace preserved: ${result.sourceBranch}`)
    if (result.message)
      console.error(`  Git: ${result.message}`)
    return
  }
  console.log(`  Landed: ${result.commits.join(', ')}`)
  console.log(`  target: ${result.targetBranch} @ ${result.targetHeadAfter}`)
  if (result.cleanupError) {
    console.warn(`  workspace cleanup: incomplete (${result.cleanupError})`)
    console.warn(`  source workspace preserved: ${result.sourceBranch}`)
  }
  else {
    console.log(`  workspace cleanup: ${result.cleanedUp ? 'completed' : 'not requested'}`)
  }
}

export function presentCommit(result: CommitResult, json: boolean): void {
  if (json)
    emitJson(result)
  else if (result.ok)
    console.log(`  Committed: ${result.commit}`)
  else
    console.error(`  Commit stopped: ${result.message}`)
}
