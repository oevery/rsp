import type { ReleaseBehaviorPlan } from './release-behavior-acceptance.mjs'

export interface ReleaseBehaviorReportEntry {
  path: string
  report: unknown
}

export type ReleaseBehaviorEvidenceResult
  = | { state: 'not-required', baselineRef: string | null, missingCases: string[] }
    | { state: 'missing', baselineRef: string, missingCases: string[], settings: ReleaseBehaviorPlan['settings'] | null }
    | { state: 'reused', baselineRef: string, reports: Array<{ case: string, reportPath: string }>, settings: ReleaseBehaviorPlan['settings'] }

export function assessReleaseBehaviorEvidence(
  root: string,
  plan: ReleaseBehaviorPlan,
  reports: ReleaseBehaviorReportEntry[],
): ReleaseBehaviorEvidenceResult
export function loadReleaseBehaviorReports(root: string): ReleaseBehaviorReportEntry[]
export function checkReleaseBehaviorEvidence(root: string): ReleaseBehaviorEvidenceResult
