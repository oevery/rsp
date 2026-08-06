import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

export function processExists(pid: number): boolean {
  try {
    process.kill(pid, 0)
    return true
  }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ESRCH')
      return false
    throw error
  }
}

export async function processIdentityFor(pid: number): Promise<string | null> {
  if (!processExists(pid))
    return null

  if (process.platform === 'linux') {
    try {
      const value = await readFile(`/proc/${pid}/stat`, 'utf8')
      const fields = value.slice(value.lastIndexOf(')') + 2).trim().split(/\s+/)
      const startTicks = fields[19]
      return startTicks ? `linux-start-ticks:${startTicks}` : null
    }
    catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT')
        return null
      throw error
    }
  }

  if (process.platform === 'win32') {
    const script = `(Get-Process -Id ${pid} -ErrorAction Stop).StartTime.ToUniversalTime().Ticks`
    try {
      const result = await execFileAsync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', script], {
        encoding: 'utf8',
        windowsHide: true,
      })
      const value = result.stdout.trim()
      return value ? `windows-start-ticks:${value}` : null
    }
    catch {
      return null
    }
  }

  try {
    const result = await execFileAsync('ps', ['-o', 'lstart=', '-p', String(pid)], {
      encoding: 'utf8',
    })
    const value = result.stdout.trim()
    return value ? `unix-lstart:${value}` : null
  }
  catch {
    return null
  }
}
