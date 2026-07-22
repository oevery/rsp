export interface NativeDesignRuntimeIsolation {
  missing_project_skill_reads: string[]
  passed: boolean
  violations: string[]
}

export interface NativeDesignPhaseBoundary {
  actual: string[]
  allowed: string[]
  missing: string[]
  passed: boolean
  phase: string
  unauthorized: string[]
}

export interface NativeDesignCompositionResult {
  blockers: string[]
  evidence_class: 'same-case-real-host-observations'
  exact_package_sha256: string | null
  published_skill_inventory: string[]
  passed: boolean
  recommendation: 'hold-release-preparation' | 'resume-release-preparation'
}

export function loadNativeDesignContract(root: string): { manifest: Record<string, any>, oracle: Record<string, any>, paths: Record<string, string> }
export function masksOnlyDesign(before: string, after: string): boolean
export function validateNativeDesignRuntimeIsolation(phases: Array<{ observations?: Array<{ command: string, kind: string }> }>): NativeDesignRuntimeIsolation
export function validateNativeDesignPhaseChanges(manifest: Record<string, any>, phaseChanges: Record<string, string[]>): { passed: boolean, phases: NativeDesignPhaseBoundary[] }
export function validateCurrentNativeDesignArtifact(root: string, packageEvidence: Record<string, any>): { behavior_files_match: boolean, current: Record<string, any>, executed_skills_match: boolean, inventory_matches: boolean, passed: boolean, published_skills_match: boolean }
export function scoreNativeDesignEvidence(input: Record<string, any>): { blockers: string[], gates: Record<string, boolean>, passed: boolean }
export function evaluateNativeDesignComposition(root: string, options?: { runRoot?: string }): NativeDesignCompositionResult
export function runRealNativeDesignComposition(input: Record<string, any>): Promise<Record<string, any>>
