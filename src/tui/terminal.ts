import type { Writable } from 'node:stream'

export interface TerminalSession {
  cleanup: () => void
}

export function openTerminalSession(stdout: Writable, options: { screenReader: boolean }): TerminalSession {
  let cleaned = false
  if (!options.screenReader)
    stdout.write('\u001B[?1049h\u001B[?25l')
  return {
    cleanup() {
      if (cleaned)
        return
      cleaned = true
      if (!options.screenReader)
        stdout.write('\u001B[?25h\u001B[?1049l')
    },
  }
}
