export type SkillEvaluationDimensionStatus = 'passed' | 'failed' | 'not-observed'

export interface SkillEvaluationObservation {
  dimensions: Record<'trigger' | 'compliance' | 'boundary' | 'task_result', {
    status: SkillEvaluationDimensionStatus
    evidence?: unknown
  }>
  measurements?: Record<string, unknown>
  omissions?: string[]
}

export interface SkillEvaluationReceiptObservations {
  correction_count: number | null
  first_fix_result: 'passed' | 'failed' | null
  trigger: { status: 'passed' | 'failed', evidence?: unknown } | null
  worker_dispatch_count: number | null
}

export interface SkillEvaluationReceipt {
  case_id: string
  composition_sha256: string
  contract_sha256: string
  observations: SkillEvaluationReceiptObservations
}

export interface BoundSkillEvaluationObservation {
  case_id: string
  composition_sha256: string
  contract_sha256: string
  receipt_sha256: string
  observation_sha256: string
  receipt_observations: SkillEvaluationReceiptObservations
  observability: SkillEvaluationObservation
}

export interface SkillCandidateEvaluationManifest {
  current_identity: string | { sha256: string }
  candidate_identity: string | { sha256: string }
  cases: Array<{
    id: string
    contract_sha256: string
    unseen: boolean
    current: BoundSkillEvaluationObservation
    candidate: BoundSkillEvaluationObservation
  }>
}

export interface SkillCandidateEvaluationResult {
  result: 'candidate-eligible' | 'retain-current' | 'incomplete'
  identities: { current: string, candidate: string }
  regressions: Array<{
    case_id: string
    dimension: string
    current: 'passed'
    candidate: SkillEvaluationDimensionStatus
  }>
  candidate_failures: Array<{ case_id: string, dimension: string, status: 'failed' }>
  missing_evidence: Array<{
    case_id: string | null
    variant: 'current' | 'candidate' | null
    dimension: string | null
    reason: string
  }>
  cases: Array<{
    id: string
    contract_sha256: string
    unseen: boolean
    observations: {
      current: { composition_sha256: string, receipt_sha256: string, observation_sha256: string }
      candidate: { composition_sha256: string, receipt_sha256: string, observation_sha256: string }
    }
    dimensions: Record<string, {
      current: SkillEvaluationDimensionStatus
      candidate: SkillEvaluationDimensionStatus
    }>
    diagnostics: {
      first_fix_result: {
        current: 'passed' | 'failed' | null
        candidate: 'passed' | 'failed' | null
        changed: boolean | null
      }
      measurements: Record<string, {
        current: number | null
        candidate: number | null
        delta: number | null
      }>
    }
  }>
  authority: { mutate_skills: false, publish: false }
}

export function evaluateSkillCandidate(
  manifest: SkillCandidateEvaluationManifest,
): SkillCandidateEvaluationResult
export function loadSkillCandidateManifest(path: string): unknown
export function hashSkillEvaluationValue(value: unknown): string
export function validateSkillEvaluationReceipt(
  receipt: unknown,
  expected?: { caseId?: string, compositionSha256?: string, contractSha256?: string },
): SkillEvaluationReceipt
export function validateSkillEvaluationReceiptObservability(
  receiptObservations: SkillEvaluationReceiptObservations | null,
  observability: SkillEvaluationObservation,
  label?: string,
): SkillEvaluationObservation
