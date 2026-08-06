import type { WorkspaceActivity, WorkspaceObservation, WorkspaceRecord } from '../workspace/session.js'
import { emitJson } from '../core/output.js'
import { inspectWorkspaceFacts } from '../workspace/facts.js'
import {
  disposeWorkspace,
  observeWorkspace,
  prepareWorkspace,
  registerWorkspaceActivity,
  stopWorkspaceActivity,
} from '../workspace/session.js'

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

export async function prepareWorkspaceCommand(
  workRef: string,
  options: { targetBranch?: string, json?: boolean } = {},
) {
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

export async function showWorkspaceCommand(workRef: string, options: { json?: boolean } = {}) {
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

export async function inspectWorkspaceCommand(workRef: string, options: { json?: boolean } = {}) {
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
) {
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

export async function stopWorkspaceActivityCommand(
  workRef: string,
  activityId: string,
  options: { json?: boolean } = {},
) {
  const activity = await stopWorkspaceActivity(workRef, activityId)
  if (options.json) {
    emitJson({ command: 'workspace activity stop', ok: true, workRef, activity: publicActivity(activity) })
    return activity
  }
  console.log(`  Stopped activity: ${activity.id}`)
  console.log(`  pid: ${activity.pid}`)
  return activity
}

export async function disposeWorkspaceCommand(
  workRef: string,
  options: { discard?: boolean, json?: boolean } = {},
) {
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
