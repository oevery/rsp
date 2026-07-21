export interface DailyWorkflowEvidenceReference {
  kind: 'contract' | 'host-metadata' | 'host-output' | 'oracle' | 'repository-command'
  path: string
  locator: string
}

export interface DailyWorkflowJourneyResult {
  id: string
  missing: unknown[]
  passed: boolean
  prohibited: unknown[]
  status: { actual: string, expected: string }
}

export interface DailyWorkflowDepthResult {
  blockers: string[]
  d2: { passed: boolean }
  evidence_class: 'same-case-real-host-observations'
  exact_package_sha256: string | null
  journeys: DailyWorkflowJourneyResult[]
  oracle_replay_passed: boolean
  package_boundary_intact: boolean
  passed: boolean
  recommendation: 'hold-release-preparation' | 'resume-release-preparation'
  stable_skills: string[]
  rejected_product_owner: 'rsp-manage'
}

export interface RuntimeIsolationResult {
  missing_project_skill_reads: string[]
  passed: boolean
  violations: string[]
}

export function validateEvidenceReference(root: string, reference: DailyWorkflowEvidenceReference, label: string): void
export function validateJ3RuntimeIsolation(phases: Array<{ observations?: Array<{ command: string, kind: string }> }>): RuntimeIsolationResult
export function validateJ4RuntimeIsolation(phases: Array<{ observations?: Array<{ command: string, kind: string }> }>): RuntimeIsolationResult
export function evaluateDailyWorkflowDepth(root: string): DailyWorkflowDepthResult
