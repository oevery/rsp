export type UpstreamTier = 'core' | 'reference'
export type UpstreamStrategy = 'conform' | 'model' | 'adapt' | 'tooling'

export interface UpstreamSource {
  repository: string
  ref: string
  tier: UpstreamTier
  strategy: UpstreamStrategy
  paths: string[]
}

export interface UpstreamOptions {
  root?: string
  selector?: string
  patch?: boolean
}

export interface PrepareUpstreamOptions extends UpstreamOptions {
  source: string
  initial?: boolean
}

export interface UpstreamStatus {
  source: string
  repository: string
  ref: string
  tier: UpstreamTier
  strategy: UpstreamStrategy
  cachePath: string
  cacheState: 'missing' | 'ready' | 'unsynced'
  candidateCommit: string | null
  acceptedCommit: string | null
  pending: boolean
  researchState: 'missing' | 'draft' | 'complete' | 'stale'
  nextAction: 'sync' | 'fix-paths' | 'prepare' | 'prepare-initial' | 'distill' | 'accept' | 'none'
  pathCoverage: Array<{ pattern: string, matchedFiles: number }>
  unmatchedPaths: string[]
}

export interface SyncedUpstream extends UpstreamStatus {
  cacheState: 'ready'
  candidateCommit: string
}

export interface AcceptedUpstream extends SyncedUpstream {
  acceptedCommit: string
  pending: false
}

export interface UpstreamDiff {
  source: string
  acceptedCommit: string | null
  candidateCommit: string | null
  available: boolean
  output: string
  reason: string | null
}

export interface PreparedUpstream {
  source: string
  strategy: UpstreamStrategy
  baseCommit: string | null
  candidateCommit: string
  reportPath: string
  evidencePath: string
  evidenceHash: string
  created: boolean
}

export function loadUpstreamManifest(root?: string): Promise<{
  version: 1
  sources: Record<string, UpstreamSource>
}>

export function syncUpstreams(options?: UpstreamOptions): Promise<SyncedUpstream[]>
export function getUpstreamStatus(options?: UpstreamOptions): Promise<UpstreamStatus[]>
export function diffUpstreams(options?: UpstreamOptions): Promise<UpstreamDiff[]>
export function prepareUpstream(options: PrepareUpstreamOptions): Promise<PreparedUpstream>
export function acceptUpstreams(options?: UpstreamOptions): Promise<AcceptedUpstream[]>
