import { existsSync } from 'node:fs'
import { mkdir, unlink } from 'node:fs/promises'
import { dirname } from 'node:path'

import { resolveExecutableChange } from '../core/change-group.js'
import { FOCUS_DIR, pc } from '../core/config.js'
import { cleanupEmptyParentDirs, guardRspInitialized } from '../core/helpers.js'
import { withRspLock } from '../core/lock.js'
import { writeManagedFile } from '../core/managed-path.js'
import { resolveFocusMarkerPath, resolveWorkRef, WorkRefError } from '../core/work-ref.js'

export async function focusChange(name: string) {
  if (!name) {
    console.error(`  ${pc.red('Usage:')} rsp focus <name>`)
    process.exit(1)
  }
  guardRspInitialized()

  try {
    return await withRspLock('focus-change', async () => {
      const workRef = await resolveExecutableChange(name, { mustExist: true })
      const focusEntry = resolveFocusMarkerPath(workRef)
      await mkdir(FOCUS_DIR, { recursive: true })
      await mkdir(dirname(focusEntry), { recursive: true })
      await writeManagedFile(focusEntry, '', 'focus marker')

      console.log(`  ${pc.green('Focused:')} ${name}`)
      console.log(`  ${pc.dim('focus.d')} → ${name}`)
      console.log()
    })
  }
  catch (error) {
    exitWorkRefError(error)
  }
}

export async function unfocusChange(name: string) {
  if (!name) {
    console.error(`  ${pc.red('Usage:')} rsp unfocus <name>`)
    process.exit(1)
  }
  guardRspInitialized()

  try {
    return await withRspLock('unfocus-change', async () => {
      const workRef = resolveWorkRef(name, { executable: false, mustExist: false })
      const focusEntry = resolveFocusMarkerPath(workRef)
      if (!existsSync(focusEntry))
        throw new WorkRefError('focus_marker_not_found', `.rsp/focus.d/${name}`, name)
      await unlink(focusEntry)
      await cleanupEmptyParentDirs(focusEntry, FOCUS_DIR)

      console.log(`  ${pc.green('Unfocused:')} ${name}`)
      console.log(`  ${pc.dim('focus.d cleared')} → ${name}`)
      console.log()
    })
  }
  catch (error) {
    exitWorkRefError(error)
  }
}

function exitWorkRefError(error: unknown): never {
  if (error instanceof WorkRefError) {
    if (error.code === 'focus_marker_not_found')
      console.error(`  ${pc.red('Focus marker not found:')} ${error.message}`)
    else
      console.error(`  ${pc.red('Error:')} ${error.message}`)
    process.exit(1)
  }
  throw error
}
