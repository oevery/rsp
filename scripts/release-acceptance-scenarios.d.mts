export interface ReleaseProjectScenario {
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
  fixtureRoot: string
  manifestPath: string
}

export const REQUIRED_PROJECT_COVERAGE: string[]
export function fixtureTreeSha256(directory: string): string

export function discoverReleaseProjectScenarios(repositoryRoot: string): {
  coverage: string[]
  requiredCoverage: string[]
  scenarios: ReleaseProjectScenario[]
}
