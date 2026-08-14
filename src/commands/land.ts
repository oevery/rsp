import { landWorkspace } from '../workspace/land.js'

export async function landWorkspaceCommand(
  workRef: string,
  options: { targetBranch: string, commits: string, cleanup?: boolean },
) {
  const commits = options.commits.split(',').map(value => value.trim()).filter(Boolean)
  const result = await landWorkspace(workRef, {
    targetBranch: options.targetBranch,
    commits,
    cleanup: options.cleanup,
  })
  return result
}
