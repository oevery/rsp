import type { RuntimeDiagnostic, StatusJsonShape } from '../types.js'
import { pc } from './config.js'

export function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export function emitJson(data: unknown, options: { compact?: boolean } = {}): void {
  const indentation = options.compact ? undefined : 2
  process.stdout.write(`${JSON.stringify(data, null, indentation)}\n`)
}

export function emitStatusJsonError(error: { code: string, message: string }, options: { focused: boolean, blocked: boolean, compact?: boolean }) {
  const payload: StatusJsonShape & { error: { code: string, message: string } } = {
    command: 'status',
    ok: false,
    filters: {
      focused: options.focused,
      blocked: options.blocked,
      stale: null,
    },
    focused: [],
    records: [],
    groups: [],
    plan: {
      ready: [],
      edges: [],
      blocked: [],
      waves: [],
    },
    summary: {
      total: 0,
      focused: 0,
      blocked: 0,
    },
    archiveTrend: [],
    nextActions: [],
    diagnostics: [],
    runtime: [],
    error,
  }
  emitJson(payload, options)
}

export function recordRuntimeDiagnostic(runtime: RuntimeDiagnostic[], diagnostic: RuntimeDiagnostic, verbose = false): void {
  runtime.push(diagnostic)
  if (verbose) {
    console.error(`  ${pc.dim(`[verbose] ${diagnostic.operation} ${diagnostic.path}: ${diagnostic.message}`)}`)
  }
}
