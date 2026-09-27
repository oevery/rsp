import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { hash, treeFiles } from './files.mjs'

// Execution includes packet projection, not judge prompts, defaults or policy.
export function executionIdentity(root) {
  return hash({
    trees: Object.fromEntries(['adapters', 'observers'].map(name => [name, treeFiles(join(root, 'evals', name), { rejectLinks: true })])),
    files: Object.fromEntries(['runner/execute.mjs', 'runner/files.mjs', 'runner/cases.mjs', 'runner/identity.mjs', 'graders/packet.mjs'].map(name => [name, hash(readFileSync(join(root, 'evals', name)))])),
  })
}

export function gradingIdentity(root) {
  const files = treeFiles(join(root, 'evals/graders'), { rejectLinks: true })
  delete files['packet.mjs']
  delete files['semantic-review.mjs']
  return hash(files)
}
