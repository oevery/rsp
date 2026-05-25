import { existsSync } from 'node:fs'
import { mkdir, unlink, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

import { CHANGES_DIR, FOCUS_DIR, pc } from '../core/config.js'
import { cleanupEmptyParentDirs, guardRspInitialized, isValidChangeName } from '../core/helpers.js'
import { withRspLock } from '../core/lock.js'

export async function focusChange(name: string) {
  if (!name) {
    console.error(`  ${pc.red('Usage:')} rsp focus <name>`)
    process.exit(1)
  }
  if (!isValidChangeName(name)) {
    console.error(`  ${pc.red('Error:')} change name must be kebab-case with optional subdirectory (lowercase, digits, hyphens, slashes)`)
    process.exit(1)
  }
  guardRspInitialized()

  const changePath = join(CHANGES_DIR, `${name}.md`)
  if (!existsSync(changePath)) {
    console.error(`  ${pc.red('Change not found:')} .rsp/changes/${name}.md`)
    process.exit(1)
  }

  return withRspLock('focus-change', async () => {
    await mkdir(FOCUS_DIR, { recursive: true })
    const focusEntry = join(FOCUS_DIR, name)
    await mkdir(dirname(focusEntry), { recursive: true })
    await writeFile(focusEntry, '')

    console.log(`  ${pc.green('Focused:')} ${name}`)
    console.log(`  ${pc.dim('focus.d')} → ${name}`)
    console.log()
  })
}

export async function unfocusChange(name: string) {
  if (!name) {
    console.error(`  ${pc.red('Usage:')} rsp unfocus <name>`)
    process.exit(1)
  }
  if (!isValidChangeName(name)) {
    console.error(`  ${pc.red('Error:')} change name must be kebab-case with optional subdirectory (lowercase, digits, hyphens, slashes)`)
    process.exit(1)
  }
  guardRspInitialized()

  const focusEntry = join(FOCUS_DIR, name)
  if (!existsSync(focusEntry)) {
    console.error(`  ${pc.red('Focus marker not found:')} .rsp/focus.d/${name}`)
    process.exit(1)
  }

  return withRspLock('unfocus-change', async () => {
    await unlink(focusEntry)
    await cleanupEmptyParentDirs(focusEntry, FOCUS_DIR)

    console.log(`  ${pc.green('Unfocused:')} ${name}`)
    console.log(`  ${pc.dim('focus.d cleared')} → ${name}`)
    console.log()
  })
}
