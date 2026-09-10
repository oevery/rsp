export interface EvaluationPlan {
  kind: string
  case: string
  goal: string
  directory: string
  fixture: string
  verification: string[]
  rubric: string[]
  execution: 'not-run'
  acceptance: 'inconclusive'
}
export interface EvaluationSample {
  repetition?: number
  execution: string
  acceptance: string
  warnings?: string[]
  metadata?: string | null
}
export function listEvaluationCases(root: string, kind: string): string[]
export function loadEvaluationCase(root: string, kind: string, caseId: string): { directory: string, manifest: Record<string, any>, fixture: string }
export function planEvaluation(root: string, kind: string, caseId: string): EvaluationPlan
export function evaluationExitCode(reports: EvaluationSample[]): number
export function executeEvaluation(options: {
  root?: string
  kind: string
  caseId: string
  repetitions?: number
  runner?: (options: Record<string, any>) => Promise<Record<string, any>>
  [key: string]: unknown
}): Promise<{ runs: EvaluationSample[], planned: number, executed: number, report: string, exitCode: number }>
export function main(argv?: string[], root?: string): Promise<any>
