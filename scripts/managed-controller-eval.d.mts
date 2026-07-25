export interface ManagedControllerCase {
  id: string
  evidence: string[]
  prohibited_actions: string[]
  required_contract: string[]
}

export interface ManagedControllerOutputManifest {
  expected_output: string[]
  forbidden_output: string[]
}

export interface ManagedControllerHoldoutManifest extends ManagedControllerOutputManifest {
  allowed_changes: string[]
  expected_mode?: 'decline' | 'execute'
  id: string
  request: string
  verification: string[]
}

export interface PreparedManagedControllerRun {
  manifest: ManagedControllerHoldoutManifest
  prompt: string
  workspace: string
}

export interface ManagedControllerOutputScore {
  expected_missing: string[]
  forbidden_present: string[]
}

export function loadManagedControllerCases(root: string): ManagedControllerCase[]
export function evaluateManagedController(root: string): Array<{ id: string, missing: string[], passed: boolean }>
export function prepareManagedControllerRun(options: {
  caseId: string
  outputRoot: string
  root: string
  variant: 'baseline' | 'candidate' | 'product'
}): PreparedManagedControllerRun
export function readManagedControllerFlag(flags: string[], name: string): string | undefined
export function scoreManagedControllerOutput(manifest: ManagedControllerOutputManifest, final: string): ManagedControllerOutputScore
