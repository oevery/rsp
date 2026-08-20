export interface ReleaseProviderComparisonPlan {
  case: string
  repetitions: number
  baseline: { ref: string, commit: string, composition: { hash: string } }
  candidate: {
    commit: string | null
    dirty: boolean | null
    fingerprintSha256: string | null
    composition: { hash: string }
  }
  identities: { contractSha256: string, fixtureSha256: string, harnessSha256: string }
}

export interface ReleaseProviderReportEntry {
  path: string
  report: Record<string, any>
}

export type ReleaseProviderEvidenceResult
  = | { state: 'not-required', baselineRef: string | null, compositionSha256: string | null }
    | { state: 'missing', baselineRef: string, compositionSha256: string }
    | { state: 'reused', baselineRef: string, reportPath: string, repetitions: number, compositionSha256: string }

export type ReleaseProviderEvidenceMatrixResult
  = | { state: 'not-required', baselineRef: string | null, compositionSha256: string | null }
    | { state: 'missing', baselineRef: string, compositionSha256: string, missingCases: string[] }
    | {
      state: 'reused'
      baselineRef: string
      compositionSha256: string
      reports: Array<{ case: string, reportPath: string, repetitions: number }>
    }

export function previousReleaseTag(root: string, targetTag: string): string | null
export function assessReleaseProviderEvidence(plan: ReleaseProviderComparisonPlan, reports: ReleaseProviderReportEntry[]): ReleaseProviderEvidenceResult
export function assessReleaseProviderEvidenceMatrix(
  plans: ReleaseProviderComparisonPlan[],
  reports: ReleaseProviderReportEntry[],
): ReleaseProviderEvidenceMatrixResult
export function loadReleaseProviderReports(root: string): ReleaseProviderReportEntry[]
export function checkReleaseProviderEvidence(root: string): ReleaseProviderEvidenceMatrixResult
