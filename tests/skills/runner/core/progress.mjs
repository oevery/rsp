import { join } from 'node:path'
import { writeJson } from './files.mjs'

// Output activity only, not event parsing, provider liveness or success evidence.
export function createProgress(outputRoot) {
  const state = { schema: 'skill-progress-v1', phase: 'starting', startedAt: new Date().toISOString(), lastOutputAt: null, stdoutBytes: 0, stderrBytes: 0, outputChunks: 0, state: 'observing' }
  let timer
  let lastWrite = 0
  let error = null
  const flush = () => {
    clearTimeout(timer)
    timer = undefined
    if (error)
      return
    state.observedAt = new Date().toISOString()
    try {
      writeJson(join(outputRoot, 'progress.json'), state)
    }
    catch {
      // Best-effort telemetry must never throw from a data event or timer and
      // bypass process cleanup. Final reports explicitly retain this failure.
      error = 'PROGRESS_WRITE_FAILED'
      process.stderr.write('PROGRESS_WRITE_FAILED: Activity persistence unavailable; final results remain authoritative.\n')
      return
    }
    lastWrite = Date.now()
  }
  flush()
  return {
    get error() { return error },
    activity(update) {
      if (error)
        return
      const switched = (update.caseId !== undefined && update.caseId !== state.caseId) || (update.role !== undefined && update.role !== state.role)
      const phaseChanged = update.phase !== undefined && update.phase !== state.phase
      const force = switched || phaseChanged || update.state !== undefined
      if (switched)
        Object.assign(state, { processStartedAt: null, lastOutputAt: null, stdoutBytes: 0, stderrBytes: 0, outputChunks: 0 })
      if (phaseChanged || switched)
        state.phaseStartedAt = new Date().toISOString()
      // Explicit allowlist: never serialize an adapter payload or raw chunk.
      for (const key of ['phase', 'lastOutputAt', 'stdoutBytes', 'stderrBytes', 'outputChunks', 'state', 'caseId', 'role']) {
        if (update[key] !== undefined)
          state[key] = update[key]
      }
      if (update.startedAt)
        state.processStartedAt = update.startedAt
      if (force || Date.now() - lastWrite >= 250)
        flush()
      else
        timer ??= setTimeout(flush, 250)
    },
    finish() {
      state.state = 'ended'
      flush()
    },
  }
}
