import type { RuntimeDiagnostic } from '../types.js'
import { pc } from './config.js'

export function toErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}

export function emitJson(data: unknown, options: { compact?: boolean } = {}): void {
  const indentation = options.compact ? undefined : 2
  process.stdout.write(`${JSON.stringify(data, null, indentation)}\n`)
}

export function recordRuntimeDiagnostic(runtime: RuntimeDiagnostic[], diagnostic: RuntimeDiagnostic, verbose = false): void {
  runtime.push(diagnostic)
  if (verbose) {
    console.error(`  ${pc.dim(`[verbose] ${diagnostic.operation} ${diagnostic.path}: ${diagnostic.message}`)}`)
  }
}
