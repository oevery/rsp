import type { EvaluationCaseEntry } from './cases.mjs'
import type { Adapter, EvaluationRunResult } from './execute.mjs'

export interface ComparisonOptions {
  adapter: Adapter
  candidateComposition: string
  baselineComposition?: string | null
  repetitions?: number
  timeoutMs?: number
  outputRoot?: string
  seed?: string
}
export interface ComparisonResult {
  case: string
  repetitions: number
  scheduling: { order: string, seed: string, concurrency: number }
  runs: Array<EvaluationRunResult & { arm: 'baseline' | 'candidate', repetition: number }>
  summary: {
    execution: ExecutionSummary
    semantic: string
    status: string
    regression: string
  }
}
export interface ExecutionSummary {
  candidate: { passed: number, failed: number, inconclusive: number }
  baseline: { passed: number, failed: number, inconclusive: number }
  status: string
  regression: string
}
export function compareCase(caseEntry: EvaluationCaseEntry, root: string, options: ComparisonOptions): Promise<ComparisonResult>
export function summarizeRuns(runs: ComparisonResult['runs']): ExecutionSummary
export function summarizeEvaluation(runs: ComparisonResult['runs'], options?: { complete?: boolean }): ComparisonResult['summary']
