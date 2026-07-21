export interface AssistedLoopCase {
  evidence: string[]
  expected: {
    next_action: string
    returned_owner: string
  }
  id: string
  prohibited_actions: string[]
  required_contract: string[]
  sources: string[]
  stage: string
}

export interface AssistedLoopResult {
  id: string
  missing: string[]
  passed: boolean
}

export function loadAssistedLoopCases(root: string): AssistedLoopCase[]
export function evaluateAssistedLoop(root: string): AssistedLoopResult[]
