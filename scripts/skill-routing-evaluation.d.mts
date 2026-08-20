export interface PublishedSkill {
  description: string
  name: string
}

export interface SkillRoutingPositiveCase {
  expected_owner: string
  id: string
  prompt: string
}

export interface SkillRoutingHardNegativeCase extends SkillRoutingPositiveCase {
  excluded_owner: string
}

export interface SkillRoutingPairwiseCase extends SkillRoutingPositiveCase {
  competing_owner: string
}

export interface SkillRoutingManifest {
  collision_threshold: number
  hard_negative: SkillRoutingHardNegativeCase[]
  owners: string[]
  pairwise: SkillRoutingPairwiseCase[]
  positive: SkillRoutingPositiveCase[]
  version: number
}

export interface SkillRoutingObservation {
  competing_owner?: string
  excluded_owner?: string
  expected_owner: string
  id: string
  kind: 'positive' | 'hard_negative' | 'pairwise'
  observed_owner: string | null
  passed: boolean
  reason: string | null
  scores: Record<string, number>
}

export interface SkillRoutingCollision {
  left: string
  right: string
  score: number
  threshold: number
}

export interface SkillRoutingEvaluation {
  cases: SkillRoutingObservation[]
  collisions: SkillRoutingCollision[]
  limitations: string[]
  result: 'passed' | 'failed'
  scope: { focused_owners: string[], published_skills: number }
  version: number
}

export const SKILL_ROUTING_MANIFEST_VERSION: 1
export const MINIMUM_CASES_PER_OWNER: 3

export function loadPublishedSkillCatalog(root: string): PublishedSkill[]
export function loadSkillRoutingManifest(root: string, catalog?: PublishedSkill[]): SkillRoutingManifest
export function rankSkillPrompt(catalog: PublishedSkill[], prompt: string): Array<{ name: string, score: number }>
export function evaluateSkillRouting(input: {
  catalog: PublishedSkill[]
  manifest: SkillRoutingManifest
}): SkillRoutingEvaluation
export function runSkillRoutingEvaluation(root: string): SkillRoutingEvaluation
