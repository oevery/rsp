export interface CommitContract {
  kind: 'single-commit'
  command_evidence: 'single-command-envelope'
  files: Record<string, string>
  message: string
  verification_commands: string[]
  commit_command: string
}

export interface EvaluationCase {
  id: string
  kind: 'trigger' | 'behavior' | 'workflow' | 'regression'
  skill: string
  prompt: string
  project?: string
  oracle: string
  hard: { allowed_paths: string[], forbidden_actions: string[], workspace_unchanged?: boolean, commit?: CommitContract }
  rubric: Array<{ name: string, description: string }>
  [key: string]: unknown
}

export interface EvaluationCaseManifest {
  directory: string
  manifestPath: string
  id: string
  manifest: EvaluationCase
  visibility: 'public'
}

export interface EvaluationCaseEntry extends EvaluationCaseManifest {
  project: { id: string, hash: string, kind: string, commit?: string } | null
  inputHash: string
}

export function discoverCases(root?: string): EvaluationCaseManifest[]
export function resolveCase(root: string, entry: EvaluationCaseManifest): EvaluationCaseEntry
export function loadCase(root: string, id: string): EvaluationCaseEntry
