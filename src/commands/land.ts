import { emitJson } from '../core/output.js'
import { landWorkspace } from '../workspace/land.js'

export async function landWorkspaceCommand(
  workRef: string,
  options: { targetBranch: string, commits: string, cleanup?: boolean, json?: boolean },
) {
  const commits = options.commits.split(',').map(value => value.trim()).filter(Boolean)
  const result = await landWorkspace(workRef, {
    targetBranch: options.targetBranch,
    commits,
    cleanup: options.cleanup,
  })
  if (options.json) {
    emitJson({ command: 'land', ...result })
    return result
  }
  if (!result.ok) {
    console.error(`  Landing stopped: ${result.conflict ? 'cherry-pick conflict' : 'cherry-pick failed'}`)
    console.error(`  target worktree: ${result.targetWorktree}`)
    console.error(`  source workspace preserved: ${result.sourceBranch}`)
    if (result.message)
      console.error(`  Git: ${result.message}`)
    return result
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
  return result
}
