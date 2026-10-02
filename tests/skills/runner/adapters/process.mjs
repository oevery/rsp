import { Buffer } from 'node:buffer'
import { spawn } from 'node:child_process'
import { closeSync, openSync } from 'node:fs'
import { writeAll } from '../core/streams.mjs'

export function validateTimeout(timeoutMs) {
  if (timeoutMs !== undefined && timeoutMs !== null && (!Number.isInteger(timeoutMs) || timeoutMs < 1 || timeoutMs > 2147483647))
    throw new Error('Timeout must be an integer from 1 to 2147483647 milliseconds')
  return timeoutMs ?? null
}

export function cancellationReason(signal) {
  return typeof signal?.reason === 'string' ? signal.reason : 'cancelled'
}

export function runProcess(command, args, { cwd, env, input, timeoutMs, signal, onActivity, stdoutPath, stderrPath }) {
  timeoutMs = validateTimeout(timeoutMs)
  if (signal?.aborted)
    return Promise.resolve({ exitCode: null, stdout: '', stderr: '', error: null, timedOut: false, timeoutMs, cancelled: true, cancellationReason: cancellationReason(signal), outputLimited: false, durationMs: 0 })
  return new Promise((resolve) => {
    const descriptors = {}
    try {
      for (const [stream, path] of Object.entries({ stdout: stdoutPath, stderr: stderrPath })) {
        if (path)
          descriptors[stream] = openSync(path, 'w', 0o600)
      }
    }
    catch {
      for (const fd of Object.values(descriptors)) closeSync(fd)
      resolve({ exitCode: null, error: 'evidence-write-failed', stdout: '', stderr: '', timedOut: false, durationMs: 0 })
      return
    }
    const started = Date.now()
    const activity = { startedAt: new Date(started).toISOString(), lastOutputAt: null, stdoutBytes: 0, stderrBytes: 0, outputChunks: 0 }
    onActivity?.({ ...activity, state: 'process-started' })
    const child = spawn(command, args, { cwd, env, detached: process.platform !== 'win32', stdio: ['pipe', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    let timedOut = false
    let cancelled = false
    let error = null
    let killTimer
    function kill(signal) {
      try {
        if (process.platform !== 'win32' && child.pid)
          process.kill(-child.pid, signal)
        else
          child.kill(signal)
      }
      catch {}
    }
    function stop() {
      kill('SIGTERM')
      killTimer ??= setTimeout(kill, 250, 'SIGKILL')
    }
    const timer = timeoutMs === null
      ? undefined
      : setTimeout(() => {
          timedOut = true
          stop()
        }, timeoutMs)
    function cancel() {
      cancelled = true
      clearTimeout(timer)
      stop()
    }
    signal?.addEventListener('abort', cancel, { once: true })
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    function collect(chunk, stream) {
      activity.lastOutputAt = new Date().toISOString()
      activity[`${stream}Bytes`] += Buffer.byteLength(chunk)
      activity.outputChunks++
      onActivity?.({ ...activity })
      if (descriptors[stream] !== undefined) {
        try {
          writeAll(descriptors[stream], chunk)
        }
        catch {
          error = 'evidence-write-failed'
          stop()
        }
      }
      else if (stream === 'stdout') {
        stdout += chunk
      }
      else {
        stderr += chunk
      }
    }
    child.stdout.on('data', chunk => collect(chunk, 'stdout'))
    child.stderr.on('data', chunk => collect(chunk, 'stderr'))
    child.on('error', () => {
      error = 'process-spawn-failed'
    })
    child.stdin.on('error', () => {})
    child.on('close', (exitCode) => {
      clearTimeout(timer)
      clearTimeout(killTimer)
      signal?.removeEventListener('abort', cancel)
      // Also reap descendants that outlive the root process.
      kill('SIGKILL')
      for (const fd of Object.values(descriptors)) {
        try {
          closeSync(fd)
        }
        catch { error = 'evidence-write-failed' }
      }
      onActivity?.({ ...activity, state: 'process-ended' })
      resolve({ exitCode, stdout, stderr, error, timedOut, timeoutMs, cancelled, cancellationReason: cancelled ? cancellationReason(signal) : null, outputLimited: false, durationMs: Date.now() - started })
    })
    child.stdin.end(input)
  })
}
