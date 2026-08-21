export interface ManagedControllerCase {
  id: string
  sources?: string[]
  evidence: string[]
  prohibited_actions: string[]
  required_contract: string[]
}

export interface ManagedControllerRecoveryManifest {
  continuation_contract?: ManagedControllerContinuationContract
}

export interface ManagedControllerContinuationContract {
  ordered_fields: string[]
  recovery_evidence: string[]
}

export interface ManagedControllerOutputManifest extends ManagedControllerRecoveryManifest {
  expected_output: string[]
  forbidden_output: string[]
}

export interface ManagedControllerHoldoutManifest extends ManagedControllerOutputManifest {
  automatic_activation?: boolean
  allowed_changes: string[]
  base_case?: string
  branch?: string
  expected_mode?: 'decline' | 'execute'
  expected_resources?: string[]
  id: string
  initial_commit_message?: string
  initialize_rsp?: boolean
  installed_skills?: string[]
  local_bare_remote?: boolean
  manager_only_changes?: string[]
  manager_only_commands?: string[]
  provider_expectations?: {
    route: 'direct' | 'selected'
    mode: 'direct' | 'solo' | 'delegated' | 'coordinated'
    dispatch: 'none' | 'sequential' | 'independent-verify' | 'parallel-wave'
    worker_dispatch_count: { min: number, max: number }
  }
  request: string
  required_changes?: string[]
  sandbox?: 'workspace-write' | 'danger-full-access'
  verification: string[]
  worker_assignments?: Array<{
    id: string
    assignment_identity?: string
    allowed_results: string[]
    allowed_changes: string[]
    allowed_commands: string[]
  }>
  commit_message?: {
    body_bullets_max: number
    body_bullets_min: number
    count: number
    required_trailers: Record<string, string>
    subject_language: 'english'
    subject_pattern: string
  }
}

export const MANAGED_WORKER_RECEIPT_MACHINE_CONTRACT: {
  version: number
  consumer: string
  transport: { encoding: string, prefix: string }
  identity: { field: string, mode: string }
  required_fields: string[]
  optional_fields: string[]
  field_types: Record<string, unknown>
  enums: Record<'boundary' | 'evidence_status' | 'release_claim', string[]>
}

export interface PreparedManagedControllerRun {
  baseSha: string
  contractSha256: string
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
  commits: Array<{
    body: string
    message: string
    paths: string[]
    sha: string
    subject: string
    trailers: Array<{ key: string, value: string }>
  }>
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

export interface ManagedControllerRecoveryScore {
  duplicate_fields: string[]
  missing_fields: string[]
  missing_recovery_evidence: string[]
  ordered_fields: boolean
  passed: boolean
  recovery_evidence_line: boolean
}

export interface ManagedControllerArtifactScore {
  hash_matches: boolean
  output: ManagedControllerOutputScore
  recovery: ManagedControllerRecoveryScore | null
  result: 'passed' | 'failed'
}

export interface ManagedControllerObservation {
  changed_paths: string[]
  commits?: ManagedControllerGitObservation['commits']
  exit_code: number | null
  final: string
  forbidden_actions: { force_push: number, publication: number, push: number }
  remote_refs_unchanged: boolean
  source_stable: boolean
  timed_out: boolean
  verification_passed: boolean
  worker_compliance?: ManagedControllerWorkerCompliance
}

export interface ManagedControllerWorkerReceiptObservation {
  worker_id: string
  status: 'invalid' | 'missing' | 'parsed'
  receipt: Record<string, unknown> | null
  error: string | null
}

export interface ManagedControllerWorkerCompliance {
  status: 'failed' | 'not-required' | 'passed'
  evidence_source: 'host-lifecycle-and-worker-claim'
  expected_dispatch_count: number
  host_dispatch_count: number | null
  receipt_rejection_count: number
  recovered_product_result?: boolean
  violations: Array<{ assignment: string | null, kind: string, value: unknown, expected?: unknown }>
}

export interface ManagedControllerEvaluationMetadata {
  agent_reported: ManagedControllerAgentReportedEvaluation | null
  case_id: string
  contract_sha256: string
  duration_ms: number
  events: {
    forbidden_actions: { force_push: number, publication: number, push: number }
    infrastructure: { categories: string[], retry_count: number, status: 'contaminated' | 'no-contamination-observed' }
    model_invocations: number | null
    observed_resources: string[] | null
    tool_calls: number
    tool_output_bytes: number
    usage: unknown
    worker_lifecycle: ManagedControllerWorkerLifecycleObservation
    worker_receipts: ManagedControllerWorkerReceiptObservation[]
  }
  output: ManagedControllerOutputScore
  paths: { events: string, final: string, metadata: string, workspace: string }
  evaluation_receipt: {
    case_id: string
    composition_sha256: string
    contract_sha256: string
    receipt_sha256: string
  } | null
  observation_sha256: string
  observability: {
    dimensions: Record<'trigger' | 'compliance' | 'boundary' | 'task_result', {
      status: 'passed' | 'failed' | 'not-observed'
      evidence: unknown
    }>
    measurements: {
      corrections: number | null
      first_fix_result: 'passed' | 'failed' | null
      worker_dispatch_count: number | null
      tool_calls: number | null
      model_invocations: number | null
      tool_output_bytes: number | null
      elapsed_ms: number | null
      tokens: {
        cache_write_input: number | null
        cached_input: number | null
        input: number | null
        output: number | null
        reasoning_output: number | null
        total: number | null
        uncached_input: number | null
      }
    }
    omissions: string[]
    resources: ManagedControllerResourceObservation
    host_observed: { worker_lifecycle: ManagedControllerWorkerLifecycleObservation }
    worker_compliance: ManagedControllerWorkerCompliance | null
  }
  receipt_observations: {
    correction_count: number | null
    first_fix_result: 'passed' | 'failed' | null
    trigger: { status: 'passed' | 'failed', evidence?: unknown } | null
    worker_dispatch_count: number | null
  } | null
  recovery?: ManagedControllerRecoveryScore
  result: 'passed' | 'failed'
  product_result?: 'passed' | 'failed'
  variant: 'baseline' | 'candidate' | 'product'
  verification: { code: number | null, passed: boolean, stderr: string, stdout: string }
  worktree: { changed_paths: string[], missing_required_paths: string[], unauthorized_paths: string[] }
  worker_compliance: ManagedControllerWorkerCompliance
  worker_compliance_enforcement: 'diagnostic' | 'required'
}

export interface ManagedControllerEvaluationReceiptIdentity {
  case_id: string
  composition_sha256: string
  contract_sha256: string
  receipt_sha256: string
}

export interface ManagedControllerReceiptObservations {
  correction_count: number | null
  first_fix_result: 'passed' | 'failed' | null
  trigger: { status: 'passed' | 'failed', evidence?: unknown } | null
  worker_dispatch_count: number | null
}

export interface ManagedControllerAgentReportedEvaluation {
  evaluation_receipt: ManagedControllerEvaluationReceiptIdentity
  observations: ManagedControllerReceiptObservations
}

export interface ManagedControllerWorkerLifecycleObservation {
  admission_count: number | null
  delivery_count: number | null
  dispatch_count: number | null
  interrupt_count: number | null
  release_count: number | null
  settlement_count: number | null
  wait_count: number | null
  order: Array<{ event_index: number, phase: 'dispatch' | 'admission' | 'delivery' | 'wait' | 'interrupt' | 'settlement' | 'release', tool: string }>
  omissions: string[]
}

export interface ManagedControllerResourceObservation {
  expected_resources: string[] | null
  observed_resources: string[] | null
  unexpected_resources: string[] | null
  missing_resources: string[] | null
}

export function loadManagedControllerCases(root: string): ManagedControllerCase[]
export function evaluateManagedController(root: string): Array<{ id: string, missing: string[], passed: boolean }>
export function prepareManagedControllerRun(options: {
  caseId: string
  outputRoot: string
  root: string
  skillSourceDirectory?: string
  variant: 'baseline' | 'candidate' | 'product'
}): PreparedManagedControllerRun
export function runManagedControllerEvaluation(options: {
  authFile?: string
  caseId: string
  codexBin?: string
  comparisonArm?: 'baseline' | 'candidate'
  effort: string
  env?: NodeJS.ProcessEnv
  isolatedUserContext?: boolean
  model: string
  modelCatalogJson?: string
  openaiBaseUrl?: string
  outputRoot: string
  provider?: string
  root: string
  skillSourceDirectory?: string
  timeoutMs: number
  variant: 'baseline' | 'candidate' | 'product'
}): Promise<ManagedControllerEvaluationMetadata>
export function hashManagedControllerArtifact(content: string): string
export function hashManagedControllerComposition(entries: Array<{ name: string, path: string }>): ManagedControllerComposition
export function observeManagedControllerGit(workspace: string, baseSha: string, remoteRefsBefore?: Array<{ ref: string, sha: string }> | null): ManagedControllerGitObservation
export function normalizeManagedControllerEvaluationReceipt(
  receipt: unknown,
  providerExpectations: ManagedControllerHoldoutManifest['provider_expectations'],
): unknown
export function scoreManagedControllerObservation(manifest: ManagedControllerHoldoutManifest, observation: ManagedControllerObservation, options?: {
  workerComplianceEnforcement?: 'diagnostic' | 'required'
}): {
  commit_message?: { errors: string[], passed: boolean }
  missing_required_paths: string[]
  output: ManagedControllerOutputScore
  product_result?: 'passed' | 'failed'
  recovery?: ManagedControllerRecoveryScore
  result: 'passed' | 'failed'
  unauthorized_paths: string[]
}
export function scoreManagedWorkerAssignments(
  manifest: Pick<ManagedControllerHoldoutManifest, 'manager_only_changes' | 'manager_only_commands' | 'worker_assignments'>,
  events: { worker_lifecycle?: Partial<ManagedControllerWorkerLifecycleObservation>, worker_receipts?: ManagedControllerWorkerReceiptObservation[] },
): ManagedControllerWorkerCompliance
export function summarizeManagedControllerEvents(raw: string, options?: {
  installedSkills?: string[]
  workspace?: string
}): {
  forbidden_actions: { force_push: number, publication: number, push: number }
  infrastructure: { categories: string[], retry_count: number, status: 'contaminated' | 'no-contamination-observed' }
  model_invocations: number | null
  observed_resources: string[] | null
  tool_calls: number
  tool_output_bytes: number
  usage: unknown
  worker_lifecycle: ManagedControllerWorkerLifecycleObservation
  worker_receipts: ManagedControllerWorkerReceiptObservation[]
}
export function projectManagedControllerEvaluationEvidence(options: {
  durationMs: number
  events: ReturnType<typeof summarizeManagedControllerEvents>
  expectedResources?: string[]
  receipt: {
    case_id: string
    composition_sha256: string
    contract_sha256: string
    observations: ManagedControllerReceiptObservations
  } | null
  result: 'passed' | 'failed'
  output: ManagedControllerOutputScore
  unauthorizedPaths: string[]
  workerCompliance?: ManagedControllerWorkerCompliance
}): {
  agent_reported: ManagedControllerAgentReportedEvaluation | null
  observability: ManagedControllerEvaluationMetadata['observability']
}
export function readManagedControllerFlag(flags: string[], name: string): string | undefined
export function scoreManagedControllerOutput(manifest: ManagedControllerOutputManifest, final: string): ManagedControllerOutputScore
export function scoreManagedRecoveryOutput(manifest: ManagedControllerRecoveryManifest, final: string): ManagedControllerRecoveryScore | null
export function rescoreManagedControllerArtifact(
  manifest: ManagedControllerOutputManifest,
  metadata: { final_hash?: unknown },
  final: string,
): ManagedControllerArtifactScore
