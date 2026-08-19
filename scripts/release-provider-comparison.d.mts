export interface ReleaseProviderComparisonPlan {
  execution: 'serial-paired'
  repetitions: number
  case: string
  metrics: string[]
  correctness: string[]
  baseline: Record<string, any>
  candidate: Record<string, any>
  identities: Record<string, string>
  policy: Record<string, any>
  omissions: string[]
}

export function buildReleaseProviderComparisonPlan(
  repositoryRoot: string,
  options: { baselineRef: string, repetitions?: number },
): ReleaseProviderComparisonPlan

export function createReleaseProviderComparisonSummary(
  plan: ReleaseProviderComparisonPlan,
  runs: Array<Record<string, any>>,
  refreshedPlan?: ReleaseProviderComparisonPlan,
): Record<string, any>

export function renderReleaseProviderComparisonMarkdown(summary: Record<string, any>): string

export function runReleaseProviderComparison(options: Record<string, any>): Promise<{
  jsonPath: string
  markdownPath: string
  summary: Record<string, any>
}>
