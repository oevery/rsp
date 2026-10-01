import type { EvaluationCaseEntry } from './cases.mjs'

export interface ProcessResult {
  exitCode: number | null
  stdout: string
  stderr: string
  error: string | null
  timedOut: boolean
  timeoutMs?: number | null
  cancelled?: boolean
  cancellationReason?: string | null
  outputLimited?: boolean
  durationMs: number
  finalOutput?: string | null
}
export interface Adapter {
  id: string
  settings: Record<string, string | boolean>
  redact?: (value: string) => string
  run: (input: { workspace: string, prompt: string, outputRoot: string, timeoutMs?: number | null, signal?: AbortSignal, onActivity?: (activity: ActivityMetadata) => void }) => Promise<ProcessResult>
}
export interface ActivityMetadata {
  phase?: string
  state?: string
  startedAt?: string
  lastOutputAt?: string | null
  stdoutBytes?: number
  stderrBytes?: number
  outputChunks?: number
}
export interface RunOptions {
  onActivity?: (activity: ActivityMetadata) => void
  compositionHash?: string
  sourceHash?: string
  adapter?: Adapter
  command?: string
  args?: string[]
  timeoutMs?: number | null
  signal?: AbortSignal
  composition?: string | null
  outputRoot?: string
}
export interface GitObservation {
  tree: Record<string, string>
  index: Record<string, string[]>
  committedContentHashes: Record<string, string>
  parents: string[]
  headLog: string[]
  message: string
}
export interface WorkspaceObservation {
  head: string
  workspaceRoot?: string
  git?: GitObservation
  baselineGit?: GitObservation
  status: string
  changedPaths: string[]
  artifacts: Record<string, string>
  committedFilesMatchWorktree?: Record<string, boolean | null>
  omittedArtifacts: string[]
  fileModes: Record<string, number>
  indexHash: string
  baselineIndexHash?: string
  files: Record<string, string>
  baseline?: Record<string, string>
  baselineHead?: string
  diff: string
  skillTreeHash: string
}
export interface EvaluationRunResult {
  id: string
  case: string
  reportDirectory: string
  timeoutMs: number | null
  cancelled: boolean
  cancellationReason: string | null
  result?: ProcessResult
  observation?: WorkspaceObservation
  verdict: { status: string, category: string, reason?: string }
}
export function prepareWorkspace(caseEntry: EvaluationCaseEntry, root: string, composition?: string | null): string
export function workspaceObservation(workspace: string, baseline?: WorkspaceObservation, priorityPaths?: string[]): WorkspaceObservation
export function runCase(caseEntry: EvaluationCaseEntry, root: string, options?: RunOptions): Promise<EvaluationRunResult>
export function createLocalAdapter(command: string, args?: string[]): Adapter
export function harnessIdentity(root: string): string
export function sourceIdentity(root: string): string
