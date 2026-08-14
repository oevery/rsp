import type { WorkspaceActivity, WorkspaceObservation, WorkspaceRecord } from '../workspace/session.js'
import { inspectRspConfig, resolveWorkspacePolicy } from '../core/config.js'
import { toErrorMessage } from '../core/output.js'
import { inspectWorkspaceFacts } from '../workspace/facts.js'
import {
  disposeWorkspace,
  observeWorkspace,
  prepareWorkspace,
  registerWorkspaceActivity,
  stopWorkspaceActivity,
} from '../workspace/session.js'

export interface WorkspaceCommandError {
  command: string
  ok: false
  error: { code: string, message: string }
}

export type PrepareWorkspaceCommandResult
  = | { command: 'workspace prepare', ok: true, resumed: boolean, record: WorkspaceRecord }
    | WorkspaceCommandError
export type ShowWorkspaceCommandResult
  = | { command: 'workspace status', ok: true, observation: WorkspaceObservation }
    | WorkspaceCommandError
export type InspectWorkspaceCommandResult
  = | { command: 'workspace inspect', ok: true, facts: Awaited<ReturnType<typeof inspectWorkspaceFacts>> }
    | WorkspaceCommandError
export type RegisterWorkspaceActivityCommandResult
  = | { command: 'workspace activity register', ok: true, workRef: string, activity: WorkspaceActivity }
    | WorkspaceCommandError
export type StopWorkspaceActivityCommandResult
  = | { command: 'workspace activity stop', ok: true, workRef: string, activity: WorkspaceActivity }
    | WorkspaceCommandError
export type DisposeWorkspaceCommandResult
  = | { command: 'workspace dispose', ok: true, workRef: string, record: WorkspaceRecord }
    | WorkspaceCommandError

export function publicActivity(activity: WorkspaceActivity) {
  return {
    id: activity.id,
    label: activity.label,
    pid: activity.pid,
    processGroupId: activity.processGroupId,
    resources: activity.resources,
    registeredAt: activity.registeredAt,
  }
}

export function publicRecord(record: WorkspaceRecord) {
  return {
    ...record,
    activities: Object.fromEntries(
      Object.entries(record.activities ?? {}).map(([id, activity]) => [id, publicActivity(activity)]),
    ),
  }
}

export function publicObservation(observation: WorkspaceObservation) {
  return { ...observation, record: publicRecord(observation.record) }
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

function workspaceCommandError(command: string, error: unknown): WorkspaceCommandError {
  return { command, ok: false, error: { code: workspaceErrorCode(error), message: toErrorMessage(error) } }
}

export async function prepareWorkspaceCommand(
  workRef: string,
  options: { targetBranch?: string } = {},
): Promise<PrepareWorkspaceCommandResult> {
  try {
    const configInspection = await inspectRspConfig()
    if (configInspection.issues.length > 0)
      throw new Error(configInspection.issues.join('; '))
    if (resolveWorkspacePolicy(configInspection.config).activation === 'disabled')
      throw new Error('workspace activation is disabled by project configuration')
    const result = await prepareWorkspace(workRef, { targetBranch: options.targetBranch })
    return { command: 'workspace prepare', ok: true, resumed: result.resumed, record: result.record }
  }
  catch (error) {
    return workspaceCommandError('workspace prepare', error)
  }
}

export async function showWorkspaceCommand(workRef: string): Promise<ShowWorkspaceCommandResult> {
  try {
    return { command: 'workspace status', ok: true, observation: await observeWorkspace(workRef) }
  }
  catch (error) {
    return workspaceCommandError('workspace status', error)
  }
}

export async function inspectWorkspaceCommand(workRef: string): Promise<InspectWorkspaceCommandResult> {
  try {
    return { command: 'workspace inspect', ok: true, facts: await inspectWorkspaceFacts(workRef) }
  }
  catch (error) {
    return workspaceCommandError('workspace inspect', error)
  }
}

export async function registerWorkspaceActivityCommand(
  workRef: string,
  options: { id: string, pid: number, label?: string, processGroupId?: number, resources?: string },
): Promise<RegisterWorkspaceActivityCommandResult> {
  try {
    const activity = await registerWorkspaceActivity(workRef, {
      id: options.id,
      pid: options.pid,
      label: options.label,
      processGroupId: options.processGroupId,
      resources: options.resources?.split(',').map(value => value.trim()).filter(Boolean),
    })
    return { command: 'workspace activity register', ok: true, workRef, activity }
  }
  catch (error) {
    return workspaceCommandError('workspace activity register', error)
  }
}

export async function stopWorkspaceActivityCommand(workRef: string, activityId: string): Promise<StopWorkspaceActivityCommandResult> {
  try {
    return { command: 'workspace activity stop', ok: true, workRef, activity: await stopWorkspaceActivity(workRef, activityId) }
  }
  catch (error) {
    return workspaceCommandError('workspace activity stop', error)
  }
}

export async function disposeWorkspaceCommand(
  workRef: string,
  options: { discard?: boolean } = {},
): Promise<DisposeWorkspaceCommandResult> {
  try {
    return { command: 'workspace dispose', ok: true, workRef, record: await disposeWorkspace(workRef, { discard: options.discard }) }
  }
  catch (error) {
    return workspaceCommandError('workspace dispose', error)
  }
}
