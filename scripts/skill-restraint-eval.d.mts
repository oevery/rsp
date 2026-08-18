import type { SkillEvaluationObservation } from './skill-candidate-evaluation.mjs'

export interface PreparedSkillRestraintCase {
  case: Record<string, any>
  case_id: string
  contract_sha256: string
  variant: string
  workspace: string
}

export interface SkillRestraintAdjudication {
  case_id: string
  contract_sha256: string
  final_output_sha256: string
  variant: string
  verdict: {
    decision: string
    independent_consequences: 'preserved' | 'not-applicable'
    restraint: 'passed' | 'failed'
    trigger: 'passed' | 'failed'
  }
}

export function loadSkillRestraintCase(root: string, id: string): {
  contract_sha256: string
  directory: string
  value: Record<string, any>
}
export function listSkillRestraintCases(root: string): Array<Record<string, any>>
export function prepareSkillRestraintCase(input: {
  caseId: string
  outputRoot?: string
  root: string
  variant: string
}): PreparedSkillRestraintCase
export function bindSkillRestraintAdjudication(input: {
  caseId: string
  contractSha256: string
  finalOutput: string
  variant: string
  verdict: SkillRestraintAdjudication['verdict']
}): SkillRestraintAdjudication
export function scoreSkillRestraintCase(input: {
  adjudication: SkillRestraintAdjudication
  finalOutput: string
  prepared: PreparedSkillRestraintCase
}): {
  adjudication_sha256: string
  case_id: string
  command: Record<string, any>
  contract_sha256: string
  observation: SkillEvaluationObservation
  result: 'passed' | 'failed'
  variant: string
  workspace: { actual_changed_paths: string[], issues: string[] }
}
