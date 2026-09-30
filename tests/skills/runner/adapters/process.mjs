import { spawn } from 'node:child_process'

export function runProcess(command, args, { cwd, env, input, timeoutMs = 600000 }) {
  return new Promise((resolve) => {
    const started = Date.now()
    const child = spawn(command, args, { cwd, env, detached: process.platform !== 'win32', stdio: ['pipe', 'pipe', 'pipe'] })
    let stdout = ''
    let stderr = ''
    let timedOut = false
    let outputLimited = false
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
    const timer = setTimeout(() => {
      timedOut = true
      stop()
    }, timeoutMs)
    child.stdout.setEncoding('utf8')
    child.stderr.setEncoding('utf8')
    function collect(chunk, stream) {
      if (stdout.length + stderr.length + chunk.length > 8 * 1024 * 1024) {
        outputLimited = true
        stop()
        return
      }
      if (stream === 'stdout')
        stdout += chunk
      else
        stderr += chunk
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
      // Also reap descendants that outlive the root process.
      kill('SIGKILL')
      resolve({ exitCode, stdout, stderr, error, timedOut, outputLimited, durationMs: Date.now() - started })
    })
    child.stdin.end(input)
  })
}
