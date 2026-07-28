export interface StructuralAuditCase {
  id: string
  request: string
  tags: string[]
  expected: {
    result: 'findings' | 'clean' | 'scoped uncertainty'
    min_findings: number
    max_findings: number
    required_terms: string[]
    forbidden_terms: string[]
  }
}

export interface StructuralAuditScore {
  passed: boolean
  blockers: string[]
  observed: { result: string | null, findings: number }
}

export function loadStructuralAuditCases(root: string): StructuralAuditCase[]
export function scoreStructuralAuditOutput(manifest: StructuralAuditCase, final: string): StructuralAuditScore
