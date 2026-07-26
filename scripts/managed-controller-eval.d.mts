export interface ManagedControllerCase {
  id: string
  evidence: string[]
  prohibited_actions: string[]
  required_contract: string[]
}

export interface ManagedControllerOutputManifest {
  expected_output: string[]
  forbidden_output: string[]
}

export interface ManagedControllerHoldoutManifest extends ManagedControllerOutputManifest {
  automatic_activation?: boolean
  allowed_changes: string[]
  base_case?: string
  branch?: string
  expected_mode?: 'decline' | 'execute'
  id: string
  initialize_rsp?: boolean
  installed_skills?: string[]
  local_bare_remote?: boolean
  request: string
  required_changes?: string[]
  sandbox?: 'workspace-write' | 'danger-full-access'
  verification: string[]
}

export interface PreparedManagedControllerRun {
  baseSha: string
  installedComposition: ManagedControllerComposition
  manifest: ManagedControllerHoldoutManifest
  prompt: string
  remotePath: string | null
  remoteRefsBefore: Array<{ ref: string, sha: string }>
  sourceComposition: ManagedControllerComposition
  workspace: string
}

export interface ManagedControllerComposition {
  hash: string
  skills: Array<{ name: string, hash: string }>
}

export interface ManagedControllerGitObservation {
  base_sha: string
  branch: string
  commit_touched_paths: string[]
  committed_paths: string[]
  commits: Array<{ paths: string[], sha: string, subject: string }>
  dirty: boolean
  head_sha: string
  net_committed_paths: string[]
  remote: string | null
  pushed_sha: string | null
  remote_matches_base: boolean
  remote_matches_head: boolean
  remote_refs_after: Array<{ ref: string, sha: string }>
  remote_refs_before: Array<{ ref: string, sha: string }>
  remote_refs_unchanged: boolean
  worktree_paths: string[]
}

export interface ManagedControllerOutputScore {
  expected_missing: string[]
  forbidden_present: string[]
}

export interface ManagedControllerObservation {
  changed_paths: string[]
  exit_code: number | null
  final: string
  forbidden_actions: { force_push: number, publication: number, push: number }
  remote_refs_unchanged: boolean
  source_stable: boolean
  timed_out: boolean
  verification_passed: boolean
}

export function loadManagedControllerCases(root: string): ManagedControllerCase[]
export function evaluateManagedController(root: string): Array<{ id: string, missing: string[], passed: boolean }>
export function prepareManagedControllerRun(options: {
  caseId: string
  outputRoot: string
  root: string
  variant: 'baseline' | 'candidate' | 'product'
}): PreparedManagedControllerRun
export function hashManagedControllerComposition(entries: Array<{ name: string, path: string }>): ManagedControllerComposition
export function observeManagedControllerGit(workspace: string, baseSha: string, remoteRefsBefore?: Array<{ ref: string, sha: string }> | null): ManagedControllerGitObservation
export function scoreManagedControllerObservation(manifest: ManagedControllerHoldoutManifest, observation: ManagedControllerObservation): {
  missing_required_paths: string[]
  output: ManagedControllerOutputScore
  result: 'passed' | 'failed'
  unauthorized_paths: string[]
}
export function summarizeManagedControllerEvents(raw: string): {
  forbidden_actions: { force_push: number, publication: number, push: number }
  tool_calls: number
  usage: unknown
}
export function readManagedControllerFlag(flags: string[], name: string): string | undefined
export function scoreManagedControllerOutput(manifest: ManagedControllerOutputManifest, final: string): ManagedControllerOutputScore
