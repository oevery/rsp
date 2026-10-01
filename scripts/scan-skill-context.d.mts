export interface SkillContextDiagnostics {
  bytes: number
  lines: number
  markdown_files: number
  words: number
}

export interface SkillContextPackage {
  diagnostics: SkillContextDiagnostics
  diagnostics_by_role: {
    total: SkillContextDocumentDiagnostics
    entrypoint: SkillContextDocumentDiagnostics
    references: SkillContextDocumentDiagnostics
    distribution: SkillContextDocumentDiagnostics
  }
  distribution_files: string[]
  distribution_markdown: string[]
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

export interface SkillContextDocumentDiagnostics extends SkillContextDiagnostics {
  files: number
}

export function scanSkillContext(options?: { root?: string, packages?: string[] }): SkillContextResult

export function formatSkillContext(result: SkillContextResult): string

export function main(
  argv?: string[],
  io?: { stdout?: (value: string) => unknown },
): number
