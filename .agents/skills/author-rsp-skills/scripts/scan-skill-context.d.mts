export interface SkillContextDiagnostics {
  bytes: number
  lines: number
  markdown_files: number
  words: number
}

export interface SkillContextPackage {
  diagnostics: SkillContextDiagnostics
  entrypoint: string
  kind: 'maintainer' | 'published'
  markdown_files: string[]
  name: string
  reachable_markdown: string[]
  unreachable_markdown: string[]
}

export interface SkillContextResult {
  diagnostics_only: true
  packages: SkillContextPackage[]
  repeated_prose: Array<{
    paths: string[]
    text: string
  }>
  root: string
  schema_version: 1
}

export function scanSkillContext(options?: { root?: string }): SkillContextResult

export function formatSkillContext(result: SkillContextResult): string

export function main(
  argv?: string[],
  io?: { stdout?: (value: string) => unknown },
): number
