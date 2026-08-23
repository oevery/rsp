export interface ReleaseProviderComparisonPlan {
  execution: 'serial-paired'
  repetitions: number
  case: string
  metrics: string[]
  correctness: string[]
  baseline: { ref: string, commit: string, composition: { hash: string, skills: Array<Record<string, any>> } }
  candidate: {
    commit: string | null
    dirty: boolean | null
    fingerprintSha256: string | null
    composition: { hash: string, skills: Array<Record<string, any>> }
  }
  identities: { contractSha256: string, fixtureSha256: string, harnessSha256: string }
  providerExpectations: {
    route: 'direct' | 'selected'
    mode: 'direct' | 'solo' | 'delegated' | 'coordinated'
    dispatch: 'none' | 'sequential' | 'independent-verify' | 'parallel-wave'
    worker_dispatch_count: { min: number, max: number }
  }
  scheduling: {
    concurrency: 1
    order: 'alternating-ab-ba'
    maxPairAttempts: number
    maxContaminatedPairReplacements: number
  }
  policy: Record<string, any>
  omissions: string[]
}

export function executeSerialProviderPairs(options: {
  maxContaminatedPairReplacements?: number
  repetitions: number
  runArm: (schedule: Record<string, any>) => Promise<Record<string, any>>
  runCorrectnessPassed?: (run: Record<string, any>) => boolean
}): Promise<Array<Record<string, any>>>
export function classifyProviderAttempt(options: {
  infrastructureStatus?: string
  outcome?: string
  timedOut?: boolean
}): 'eligible' | 'infra-contaminated' | 'model-failed' | 'incomplete'

export function buildReleaseProviderComparisonPlan(
  repositoryRoot: string,
  options: { baselineRef: string, caseId?: string, repetitions?: number },
): ReleaseProviderComparisonPlan

export function buildReleaseProviderComparisonMatrixPlans(
  repositoryRoot: string,
  options: { baselineRef: string },
): ReleaseProviderComparisonPlan[]

export function createReleaseProviderComparisonSummary(
  plan: ReleaseProviderComparisonPlan,
  runs: Array<Record<string, any>>,
  refreshedPlan?: ReleaseProviderComparisonPlan,
): Record<string, any>

export function renderReleaseProviderComparisonMarkdown(summary: Record<string, any>): string

export function replayReleaseProviderComparison(options: {
  baselineRef: string
  caseId?: string
  outputRoot?: string
  repetitions?: number
  sourceReportPath: string
}): {
  jsonPath: string
  markdownPath: string
  summary: Record<string, any>
}

export function runReleaseProviderComparison(options: Record<string, any>): Promise<{
  jsonPath: string
  markdownPath: string
  summary: Record<string, any>
}>

export function runReleaseProviderComparisonMatrix(options: Record<string, any> & {
  baselineRef: string
  scenarioRunner?: (options: Record<string, any>) => Promise<{
    jsonPath: string
    markdownPath: string
    summary: Record<string, any>
  }>
}): Promise<{
  failedCase: string | null
  failure: 'scenario-failed' | 'scenario-identity-drift' | null
  results: Array<{ jsonPath: string, markdownPath: string, summary: Record<string, any> }>
  scenariosCompleted: number
  scenariosPlanned: number
  verdict: 'passed' | 'failed'
}>
