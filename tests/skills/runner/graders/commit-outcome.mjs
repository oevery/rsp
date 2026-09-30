import { isDeepStrictEqual } from 'node:util'
import { hash } from '../core/files.mjs'
import { literalArgv, matchesCommand } from '../observers/command-argv.mjs'

export { matchesCommand } from '../observers/command-argv.mjs'

// An exact fixture contract, not a general permission to commit.
export function validateCommitContract(spec) {
  const contract = spec.hard?.commit
  const safePath = path => typeof path === 'string' && path.length > 0 && !path.startsWith('/') && !path.split('/').some(part => ['', '.', '..', '.git', '.agents', '.codex', '.tooling'].includes(part))
  if (!contract || contract.kind !== 'single-commit' || contract.command_evidence !== 'single-command-envelope'
    || Object.keys(contract).some(key => !['kind', 'files', 'message', 'verification_commands', 'commit_command', 'command_evidence'].includes(key))
    || !contract.files || typeof contract.files !== 'object' || Array.isArray(contract.files) || !Object.keys(contract.files).length
    || Object.entries(contract.files).some(([path, content]) => !safePath(path) || typeof content !== 'string' || !spec.hard.allowed_paths.includes(path))
    || typeof contract.message !== 'string' || !contract.message.trim()
    || !Array.isArray(contract.verification_commands) || !contract.verification_commands.length
    || contract.verification_commands.some(command => !literalArgv(command)?.length)
    || new Set(contract.verification_commands).size !== contract.verification_commands.length
    || !literalArgv(contract.commit_command)?.length
    || contract.verification_commands.includes(contract.commit_command)
    || spec.hard.workspace_unchanged) {
    throw new Error('Invalid exact commit contract')
  }
  return contract
}

export function gradeCommitOutcome(spec, observation, events) {
  const failures = []
  const fail = (code, path) => failures.push(path === undefined ? { code } : { code, path })
  let contract
  try {
    contract = validateCommitContract(spec)
  }
  catch { return { status: 'failed', failures: [{ code: 'invalid-commit-contract' }] } }
  const before = observation.baselineGit
  const after = observation.git
  if (!before?.tree || !before.index || !before.headLog || !after?.tree || !after.index || !after.headLog || !after.parents || !after.committedContentHashes)
    return { status: 'failed', failures: [{ code: 'commit-evidence-missing' }] }
  const paths = Object.keys(contract.files).sort()
  const owned = new Set(paths)
  if (observation.head === observation.baselineHead || !isDeepStrictEqual(after.parents, [observation.baselineHead])
    || !isDeepStrictEqual(after.headLog, [observation.head, ...before.headLog])) {
    fail('commit-history-mismatch')
  }
  const changed = Object.keys({ ...before.tree, ...after.tree }).filter(path => before.tree[path] !== after.tree[path]).sort()
  if (!isDeepStrictEqual(changed, paths))
    fail('commit-paths-mismatch')
  for (const path of paths) {
    if (!after.tree[path]?.startsWith('100644 ') || after.committedContentHashes[path] !== hash(contract.files[path]))
      fail('commit-content-mismatch', path)
    if (!isDeepStrictEqual(after.index[path], [`${after.tree[path]} 0`]))
      fail('owned-index-mismatch', path)
    if (observation.files[path] !== hash(`0:${contract.files[path]}`))
      fail('owned-worktree-mismatch', path)
  }
  for (const path of Object.keys({ ...before.index, ...after.index, ...before.tree })) {
    if (owned.has(path))
      continue
    if (!isDeepStrictEqual(before.index[path], before.tree[path] === undefined ? undefined : [`${before.tree[path]} 0`]))
      fail('unrelated-staged-boundary', path)
    if (!isDeepStrictEqual(before.index[path], after.index[path]))
      fail('unrelated-index-mutated', path)
  }
  if (!observation.baseline)
    fail('baseline-files-missing')
  for (const path of Object.keys({ ...observation.baseline, ...observation.files })) {
    if (!owned.has(path) && observation.baseline?.[path] !== observation.files[path])
      fail('unrelated-worktree-mutated', path)
  }
  if (after.message?.replace(/\n$/u, '') !== contract.message.replace(/\n$/u, ''))
    fail('commit-message-mismatch')
  // This case explicitly selects single-command evidence. A compound command
  // can be correct Skill behavior but cannot prove this fixture's per-command
  // exits. Do not project this restriction onto general Skill correctness.
  const commands = events.commands ?? []
  const commitIndices = commands.flatMap((command, index) => matchesCommand(command.command, contract.commit_command, observation.workspaceRoot) ? [index] : [])
  const commitIndex = commitIndices[0]
  const succeeded = command => command?.exitCode === 0 && command.status === 'completed' && command.evidenceRedacted !== true
  if (commitIndices.length !== 1 || !succeeded(commands[commitIndex]))
    fail('commit-command-unverified')
  for (const command of contract.verification_commands) {
    const matches = commands.slice(0, commitIndex ?? 0).filter(item => matchesCommand(item.command, command, observation.workspaceRoot))
    if (!matches.length || !succeeded(matches.at(-1)))
      fail('commit-verification-missing-or-failed', command)
  }
  return { status: failures.length ? 'failed' : 'passed', failures }
}

export async function check({ case: spec }) {
  try {
    validateCommitContract(spec)
    return { status: 'passed' }
  }
  catch { return { status: 'failed' } }
}

// Parse literal argv only. Never execute or expand shell source. Quoted argv
// and a single standard shell envelope are supported; substitutions, redirects,
// pipelines, compound statements and ambiguous escapes are not.

export async function verify({ case: spec, observation, events }) {
  return gradeCommitOutcome(spec, observation, events)
}
