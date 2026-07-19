import { mkdir, readFile, unlink, writeFile } from 'node:fs/promises'

import { LOCK_PATH, RSP_DIR } from './config.js'
import { requireManagedDirectory } from './managed-path.js'

/**
 * Acquire an exclusive file lock for the duration of an RSP operation.
 * Prevents concurrent rsp commands from corrupting focus.d/ and other state.
 * The lock is automatically released in a finally block.
 * If a stale lock is detected (PID no longer alive), it is cleaned up and retried.
 */
export async function withRspLock<T = void>(operation: string, fn: () => Promise<T>): Promise<T> {
  requireManagedDirectory(RSP_DIR, 'RSP root', { allowMissing: true })
  await mkdir(RSP_DIR, { recursive: true })

  try {
    await writeFile(LOCK_PATH, `${process.pid}\n${operation}\n${new Date().toISOString()}`, { flag: 'wx' })
  }
  catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'EEXIST')
      await handleStaleLock(operation)
    else
      throw err
  }

  try {
    return await fn()
  }
  finally {
    try {
      await unlink(LOCK_PATH)
    }
    catch {
      // ignore lock cleanup failures
    }
  }
}

/** Read the lock file and clean up if the owning process is dead. */
async function handleStaleLock(operation: string): Promise<void> {
  try {
    const content = await readFile(LOCK_PATH, 'utf-8')
    const lines = content.trim().split('\n')
    const pid = Number(lines[0])
    if (pid && Number.isFinite(pid)) {
      try {
        process.kill(pid, 0)
        // process is alive — real conflict
        const op = lines[1] || 'unknown'
        const ts = lines[2] || 'unknown'
        throw new Error(`RSP locked by pid ${pid} (${op}) since ${ts}`)
      }
      catch (e) {
        if (e instanceof Error && e.message.startsWith('RSP locked'))
          throw e
        const code = (e as NodeJS.ErrnoException).code
        if (code === 'ESRCH') {
          // PID not found — stale lock, clean up
          await unlink(LOCK_PATH)
          // retry: write the lock file again
          await writeFile(LOCK_PATH, `${process.pid}\n${operation}\n${new Date().toISOString()}`, { flag: 'wx' })
          return
        }
        throw e
      }
    }
    else {
      // malformed lock file, just remove it
      await unlink(LOCK_PATH)
      await writeFile(LOCK_PATH, `${process.pid}\n${operation}\n${new Date().toISOString()}`, { flag: 'wx' })
    }
  }
  catch (e) {
    if (e instanceof Error && e.message.startsWith('RSP locked'))
      throw e
    // if anything fails during cleanup, give up and throw
    throw new Error(`RSP is locked. Remove ${LOCK_PATH} manually if no other process is running.`)
  }
}
