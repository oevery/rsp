import { getWorkspaceRecord, observeWorkspace, runGit } from './session.js'

const MAX_PATHS = 1000
const MAX_LOCAL_ONLY_PATHS = 200

function lines(value: string): string[] {
  return value.split('\n').map(line => line.trim()).filter(Boolean)
}

function bounded(values: string[], limit: number): { values: string[], truncated: boolean } {
  const unique = [...new Set(values)].sort()
  return {
    values: unique.slice(0, limit),
    truncated: unique.length > limit,
  }
}

function statusPath(line: string): string {
  const value = line.slice(3)
  const rename = value.lastIndexOf(' -> ')
  return rename >= 0 ? value.slice(rename + 4) : value
}

export interface WorkspaceFacts {
  schema: 1
  workspace: {
    workRef: string
    root: string
    branch: string
    targetBranch: string
    baseCommit: string
  }
  repository: {
    trackedPaths: string[]
    trackedPathsTruncated: boolean
    localOnlyPaths: string[]
    localOnlyPathsTruncated: boolean
    changedPaths: string[]
    dirtyPaths: string[]
    commitsAheadOfTarget: number
  }
}

export async function inspectWorkspaceFacts(workRef: string): Promise<WorkspaceFacts> {
  const record = await getWorkspaceRecord(workRef)
  const observation = await observeWorkspace(workRef)
  const tracked = bounded(lines((await runGit(record.path, ['ls-files'])).stdout), MAX_PATHS)
  const localOnly = bounded(
    lines((await runGit(record.path, ['status', '--short', '--ignored'])).stdout)
      .filter(line => line.startsWith('!! '))
      .map(statusPath),
    MAX_LOCAL_ONLY_PATHS,
  )
  const committedChanges = lines((await runGit(record.repository, [
    'diff',
    '--name-only',
    `${record.baseCommit}..${record.branch}`,
  ], true)).stdout)
  const dirtyPaths = observation.dirty.map(statusPath)
  return {
    schema: 1,
    workspace: {
      workRef,
      root: record.path,
      branch: record.branch,
      targetBranch: record.targetBranch,
      baseCommit: record.baseCommit,
    },
    repository: {
      trackedPaths: tracked.values,
      trackedPathsTruncated: tracked.truncated,
      localOnlyPaths: localOnly.values,
      localOnlyPathsTruncated: localOnly.truncated,
      changedPaths: [...new Set([...committedChanges, ...dirtyPaths])].sort(),
      dirtyPaths,
      commitsAheadOfTarget: observation.aheadOfTarget,
    },
  }
}
