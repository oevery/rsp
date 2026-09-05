export interface LocalExecutionReceipt {
  events: Array<{ id: string, type: string, source: string, details: Record<string, unknown> }>
  command_failures: Array<Record<string, unknown>>
  warnings: Array<Record<string, unknown>>
  unavailable: Array<Record<string, unknown>>
  artifacts: Array<Record<string, unknown>>
  self_report: null
  host_observed: Record<string, unknown>
  final: string
  usage: Record<string, unknown> | null
  tool_calls: number
  elapsed_ms: number
  started_at: string
  completed_at: string
}

export function executeLocalCommand(options: { root: string, command: string, args?: string[], cwd?: string, timeoutMs?: number, artifactPaths?: string[], environment?: Record<string, string>, expectedExitCode?: number }): LocalExecutionReceipt
export function localCommandEvidence(receipt: LocalExecutionReceipt): Array<Record<string, unknown>>
export function relativeArtifactPath(root: string, path: string): string
