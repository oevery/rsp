export interface EvaluationCase {
  expected: {
    code: 'blocked' | 'clean' | 'issues_found' | 'skipped'
    document: 'blocked' | 'clean' | 'issues_found' | 'skipped'
    observations: string[]
    prohibited_actions: string[]
  }
  id: string
  request: string
  tags: string[]
}

export interface PreparedEvaluation {
  case: EvaluationCase
  promptPath: string
  variant: 'baseline' | 'candidate'
  workspace: string
}

export function loadEvaluationCases(root: string): EvaluationCase[]
export function prepareEvaluation(options: {
  caseId: string
  outputRoot?: string
  root: string
  variant: 'baseline' | 'candidate'
}): PreparedEvaluation
