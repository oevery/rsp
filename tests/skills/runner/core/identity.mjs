import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { hash, treeFiles } from './files.mjs'

// Bind the shared policy and runner to each retained execution.
export function executionIdentity(root) {
  return hash({
    runner: treeFiles(join(root, 'tests/skills/runner'), { rejectLinks: true }),
    config: hash(readFileSync(join(root, 'tests/skills/config.toml'))),
  })
}

export function gradingIdentity(root) {
  const files = treeFiles(join(root, 'tests/skills/runner/graders'), { rejectLinks: true })
  delete files['packet.mjs']
  delete files['semantic-review.mjs']
  return hash(files)
}
