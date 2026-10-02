import type { CommitResult } from '../../commands/commit.js'
import { emitJson } from '../../core/output.js'

export function presentCommit(result: CommitResult, json: boolean): void {
  if (json) {
    emitJson(result)
    return
  }
  if (!result.ok) {
    if (result.attempt !== 'not_attempted') {
      console.error(`  Git attempt: ${result.attempt}; creation: ${result.creation}`)
      if (result.commit)
        console.error(`  Observed commit: ${result.commit}`)
      console.error('  Inspect Git state before any further action; no automatic retry or amend.')
    }
    console.error(`  Commit stopped: ${result.message}`)
    return
  }
  console.log(`  Committed: ${result.commit}`)
  console.log(`  HEAD: ${result.headBefore ?? '(unborn)'} -> ${result.headAfter}`)
  console.log(`  committed paths: ${result.committedPaths?.join(', ') || 'none'}`)
  console.log(`  remaining worktree paths: ${result.remainingWorktreePaths?.join(', ') || 'none'}`)
  console.log('  stored message:')
  for (const line of (result.storedMessage ?? '').split('\n'))
    console.log(`    ${line}`)
}
