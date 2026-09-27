import type { EvaluationCaseEntry } from './cases.mjs'

export interface ProcessResult {
  exitCode: number | null
  stdout: string
  stderr: string
  error: string | null
  timedOut: boolean
  outputLimited?: boolean
  durationMs: number
  finalOutput?: string | null
}
export interface Adapter {
  id: string
  settings: Record<string, string | boolean>
  redact?: (value: string) => string
  run: (input: { workspace: string, prompt: string, outputRoot: string, timeoutMs?: number }) => Promise<ProcessResult>
}
export interface RunOptions {
  compositionHash?: string
  sourceHash?: string
  adapter?: Adapter
  command?: string
  args?: string[]
  timeoutMs?: number
  composition?: string | null
  outputRoot?: string
  arm?: 'baseline' | 'candidate'
}
export interface WorkspaceObservation {
  head: string
  status: string
  changedPaths: string[]
  artifacts: Record<string, string>
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
  result?: ProcessResult
  observation?: WorkspaceObservation
  verdict: { status: string, category: string, reason?: string }
}
export function prepareWorkspace(caseEntry: EvaluationCaseEntry, root: string, composition?: string | null): string
export function workspaceObservation(workspace: string, baseline?: WorkspaceObservation): WorkspaceObservation
export function runCase(caseEntry: EvaluationCaseEntry, root: string, options?: RunOptions): Promise<EvaluationRunResult>
export function createLocalAdapter(command: string, args?: string[]): Adapter
export function harnessIdentity(root: string): string
export function sourceIdentity(root: string): string
