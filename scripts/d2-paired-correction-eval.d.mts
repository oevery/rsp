export interface DesignReturnScore {
  fields: Array<{ id: string, present: boolean }>
  missing_fields: string[]
  deterministic_correction_requests: number
}

export function scoreDesignReturn(content: string): DesignReturnScore
export function evaluateD2Pairs(root: string): {
  cases: Array<{
    id: string
    baseline: { path: string, sha256: string, score: DesignReturnScore }
    candidate: { path: string, sha256: string, score: DesignReturnScore }
    candidate_has_fewer_correction_requests: boolean
  }>
  definition: string
  evidence_class: string
  metric: string
  passed: boolean
  required_fields: string[]
}
