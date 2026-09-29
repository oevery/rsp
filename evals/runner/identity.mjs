import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { hash, treeFiles } from './files.mjs'

// Execution binds shared runtime policy and execution roles, not reviewer defaults.
export function executionIdentity(root) {
  return hash({
    trees: Object.fromEntries(['adapters', 'observers'].map(name => [name, treeFiles(join(root, 'evals', name), { rejectLinks: true })])),
    files: Object.fromEntries(['config/base.toml', 'config/coordinator.toml', 'config/implementer.toml', 'config/verifier.toml', 'runner/execute.mjs', 'runner/files.mjs', 'runner/cases.mjs', 'runner/identity.mjs', 'graders/packet.mjs'].map(name => [name, hash(readFileSync(join(root, 'evals', name)))])),
  })
}

export function gradingIdentity(root) {
  const files = treeFiles(join(root, 'evals/graders'), { rejectLinks: true })
  delete files['packet.mjs']
  delete files['semantic-review.mjs']
  return hash(files)
}
