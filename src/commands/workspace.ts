import type { WorkspaceActivity, WorkspaceObservation, WorkspaceRecord } from '../workspace/session.js'
import { inspectRspConfig, resolveWorkspacePolicy } from '../core/config.js'
import { emitJson, toErrorMessage } from '../core/output.js'
import { inspectWorkspaceFacts } from '../workspace/facts.js'
import {
  disposeWorkspace,
  observeWorkspace,
  prepareWorkspace,
  registerWorkspaceActivity,
  stopWorkspaceActivity,
} from '../workspace/session.js'

interface WorkspaceCommandError {
  command: string
  ok: false
  error: {
    code: string
    message: string
  }
}

function publicActivity(activity: WorkspaceActivity) {
  return {
    id: activity.id,
    label: activity.label,
    pid: activity.pid,
    processGroupId: activity.processGroupId,
    resources: activity.resources,
    registeredAt: activity.registeredAt,
  }
}

function publicRecord(record: WorkspaceRecord) {
  return {
    ...record,
    activities: Object.fromEntries(
      Object.entries(record.activities ?? {}).map(([id, activity]) => [id, publicActivity(activity)]),
    ),
  }
}

function publicObservation(observation: WorkspaceObservation) {
  return {
    ...observation,
    record: publicRecord(observation.record),
  }
}

function workspaceErrorCode(error: unknown): string {
  const message = toErrorMessage(error)
  if (message.startsWith('workspace not found for '))
    return 'workspace_not_found'
  if (message.startsWith('workspace has uncommitted changes: '))
    return 'workspace_dirty'
  if (/^workspace has \d+ commit\(s\) not present on /u.test(message))
    return 'workspace_commits_ahead'
  if (message === 'workspace activation is disabled by project configuration')
    return 'workspace_activation_disabled'
  if (message.startsWith('workspace activity not found: '))
    return 'workspace_activity_not_found'
  return 'workspace_command_failed'
}

function workspaceCommandError(
  command: string,
  error: unknown,
  options: { json?: boolean },
): WorkspaceCommandError {
  if (!options.json)
    throw error

  const result: WorkspaceCommandError = {
    command,
    ok: false,
    error: {
      code: workspaceErrorCode(error),
      message: toErrorMessage(error),
    },
  }
  emitJson(result)
  return result
}

export async function prepareWorkspaceCommand(
  workRef: string,
  options: { targetBranch?: string, json?: boolean } = {},
): Promise<{ resumed: boolean, record: WorkspaceRecord } | WorkspaceCommandError> {
  try {
    const configInspection = await inspectRspConfig()
    if (configInspection.issues.length > 0)
      throw new Error(configInspection.issues.join('; '))
    if (resolveWorkspacePolicy(configInspection.config).activation === 'disabled')
      throw new Error('workspace activation is disabled by project configuration')
    const result = await prepareWorkspace(workRef, { targetBranch: options.targetBranch })
    if (options.json) {
      emitJson({ command: 'workspace prepare', ok: true, resumed: result.resumed, workspace: publicRecord(result.record) })
      return result
    }
    console.log(`  ${result.resumed ? 'Resumed' : 'Prepared'}: ${result.record.workRef}`)
    console.log(`  branch: ${result.record.branch}`)
    console.log(`  path: ${result.record.path}`)
    console.log(`  target: ${result.record.targetBranch} @ ${result.record.baseCommit}`)
    return result
  }
  catch (error) {
    return workspaceCommandError('workspace prepare', error, options)
  }
}

export async function showWorkspaceCommand(
  workRef: string,
  options: { json?: boolean } = {},
): Promise<WorkspaceObservation | WorkspaceCommandError> {
  try {
    const observation = await observeWorkspace(workRef)
    if (options.json) {
      emitJson({ command: 'workspace status', ok: true, workspace: publicObservation(observation) })
      return observation
    }
    console.log(`  Workspace: ${observation.record.workRef}`)
    console.log(`  branch: ${observation.record.branch}`)
    console.log(`  path: ${observation.record.path}`)
    console.log(`  registered: ${observation.registered ? 'yes' : 'no'}`)
    console.log(`  dirty paths: ${observation.dirty.length}`)
    console.log(`  commits ahead of ${observation.record.targetBranch}: ${observation.aheadOfTarget}`)
    console.log(`  activities: ${Object.keys(observation.record.activities ?? {}).join(', ') || 'none'}`)
    return observation
  }
  catch (error) {
    return workspaceCommandError('workspace status', error, options)
  }
}

export async function inspectWorkspaceCommand(
  workRef: string,
  options: { json?: boolean } = {},
): Promise<Awaited<ReturnType<typeof inspectWorkspaceFacts>> | WorkspaceCommandError> {
  try {
    const facts = await inspectWorkspaceFacts(workRef)
    if (options.json) {
      emitJson({ command: 'workspace inspect', ok: true, facts })
      return facts
    }
    console.log(`  Workspace facts: ${workRef}`)
    console.log(`  tracked paths: ${facts.repository.trackedPaths.length}${facts.repository.trackedPathsTruncated ? '+' : ''}`)
    console.log(`  local-only paths: ${facts.repository.localOnlyPaths.length}${facts.repository.localOnlyPathsTruncated ? '+' : ''}`)
    console.log(`  changed paths: ${facts.repository.changedPaths.length}`)
    console.log(`  commits ahead of ${facts.workspace.targetBranch}: ${facts.repository.commitsAheadOfTarget}`)
    return facts
  }
  catch (error) {
    return workspaceCommandError('workspace inspect', error, options)
  }
}

export async function registerWorkspaceActivityCommand(
  workRef: string,
  options: {
    id: string
    pid: number
    label?: string
    processGroupId?: number
    resources?: string
    json?: boolean
  },
): Promise<WorkspaceActivity | WorkspaceCommandError> {
  try {
    const activity = await registerWorkspaceActivity(workRef, {
      id: options.id,
      pid: options.pid,
      label: options.label,
      processGroupId: options.processGroupId,
      resources: options.resources?.split(',').map(value => value.trim()).filter(Boolean),
    })
    if (options.json) {
      emitJson({ command: 'workspace activity register', ok: true, workRef, activity: publicActivity(activity) })
      return activity
    }
    console.log(`  Registered activity: ${activity.id}`)
    console.log(`  pid: ${activity.pid}`)
    if (activity.processGroupId)
      console.log(`  process group: ${activity.processGroupId}`)
    console.log(`  resources: ${activity.resources.join(', ') || 'none'}`)
    return activity
  }
  catch (error) {
    return workspaceCommandError('workspace activity register', error, options)
  }
}

export async function stopWorkspaceActivityCommand(
  workRef: string,
  activityId: string,
  options: { json?: boolean } = {},
): Promise<WorkspaceActivity | WorkspaceCommandError> {
  try {
    const activity = await stopWorkspaceActivity(workRef, activityId)
    if (options.json) {
      emitJson({ command: 'workspace activity stop', ok: true, workRef, activity: publicActivity(activity) })
      return activity
    }
    console.log(`  Stopped activity: ${activity.id}`)
    console.log(`  pid: ${activity.pid}`)
    return activity
  }
  catch (error) {
    return workspaceCommandError('workspace activity stop', error, options)
  }
}

export async function disposeWorkspaceCommand(
  workRef: string,
  options: { discard?: boolean, json?: boolean } = {},
): Promise<WorkspaceRecord | WorkspaceCommandError> {
  try {
    const record = await disposeWorkspace(workRef, { discard: options.discard })
    if (options.json) {
      emitJson({ command: 'workspace dispose', ok: true, workRef, branch: record.branch, path: record.path })
      return record
    }
    console.log(`  Disposed: ${workRef}`)
    console.log(`  removed branch: ${record.branch}`)
    console.log(`  removed worktree: ${record.path}`)
    return record
  }
  catch (error) {
    return workspaceCommandError('workspace dispose', error, options)
  }
}
