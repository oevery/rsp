export interface ReleaseAcceptanceProjectScenario {
  id: string
  kind: 'existing-rsp' | 'fresh-adoption' | 'published-upgrade'
  coverage: string[]
  derivedFrom: string
  fixtureSha256: string
  gitWorktree: { staged: string, unstaged: string, untracked: string } | null
  nestedProjectDirectory: string | null
  preserve: string[]
  sanitizationVersion: string
  sourceVersion: string | null
  specName: string
  fixturePath: string
  manifestPath: string
}

export interface ReleaseAcceptanceStep {
  id: string
  label: string
  command: string
  args: string[]
  commandText: string
  coverage: string[]
  streamStdout?: boolean
}

export interface ReleaseAcceptancePlan {
  mode: 'release-acceptance'
  execution: 'serial-fail-fast'
  counts: {
    steps: number
    projectScenarios: number
    projectCoverageTags: number
  }
  requiredStepCoverage: string[]
  stepCoverage: string[]
  omissions: string[]
  steps: ReleaseAcceptanceStep[]
  projects: {
    coverage: string[]
    requiredCoverage: string[]
    scenarios: ReleaseAcceptanceProjectScenario[]
  }
}

export const RELEASE_ACCEPTANCE_STEPS: ReleaseAcceptanceStep[]
export const RELEASE_ACCEPTANCE_OMISSIONS: string[]

export function computeReleaseSourceIdentity(repositoryRoot: string): {
  commit: string | null
  dirty: boolean | null
  fingerprintSha256: string | null
}

export function buildReleaseAcceptancePlan(
  repositoryRoot: string,
): ReleaseAcceptancePlan

export function createAcceptanceRunDirectory(outputRoot: string, id: string): string

export function renderReleaseAcceptanceMarkdown(report: Record<string, any>): string
