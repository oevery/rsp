export interface EvaluationCase {
  id: string
  kind: 'trigger' | 'behavior' | 'workflow' | 'regression'
  skill: string
  prompt: string
  fixture: string | null
  oracle: string
  hard: { allowed_paths: string[], forbidden_actions: string[], workspace_unchanged?: boolean, required_skill_read?: boolean }
  rubric: Array<{ name: string, description: string }>
  [key: string]: unknown
}

export interface EvaluationCaseEntry {
  directory: string
  manifestPath: string
  id: string
  manifest: EvaluationCase
  inputHash: string
  visibility: 'public' | 'holdout'
}

export function discoverCases(root?: string): EvaluationCaseEntry[]
export function loadCase(root: string, id: string): EvaluationCaseEntry
