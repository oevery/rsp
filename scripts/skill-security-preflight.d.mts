export interface SkillSecurityFinding {
  rule: string
  path: string
  line: number | null
  column: number | null
  message: string
}

export interface SuppressedSkillSecurityFinding extends SkillSecurityFinding {
  reason: string
  sha256: string
}

export interface SkillSecurityPreflightResult {
  version: number
  ok: boolean
  scanned_files: number
  findings: SkillSecurityFinding[]
  suppressed: SuppressedSkillSecurityFinding[]
  total_findings: number
  total_suppressed: number
  truncated: boolean
}

export interface SkillSecurityPreflightOptions {
  root?: string
  suppressions?: string
  maxFindings?: number
}

export const SKILL_SECURITY_RULESET_VERSION: number
export const DEFAULT_MAX_FINDINGS: number

export function scanSkillSecurityPreflight(
  options?: SkillSecurityPreflightOptions,
): SkillSecurityPreflightResult
export function formatSkillSecurityPreflight(result: SkillSecurityPreflightResult): string
export function main(
  argv?: string[],
  io?: { stdout?: (value: string) => void, stderr?: (value: string) => void },
): number
