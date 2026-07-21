export interface DisciplineCompositionCase {
  evidence: string[]
  expected: {
    next_action: string
    returned_owner: string
  }
  id: string
  prohibited_actions: string[]
  required_contract: string[]
  sources: string[]
}

export interface DisciplineCompositionResult {
  id: string
  missing: string[]
  passed: boolean
}

export function loadDisciplineCompositionCases(root: string): DisciplineCompositionCase[]
export function evaluateDisciplineComposition(root: string): DisciplineCompositionResult[]
