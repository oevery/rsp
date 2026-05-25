import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

import { CHANGES_DIR, FOCUS_DIR, pc } from '../core/config.js'
import { generateChangeContent, guardRspInitialized, isValidChangeName } from '../core/helpers.js'
import { withRspLock } from '../core/lock.js'

/** Create a new single-file change under .rsp/changes/<name>.md and focus it when newly created. */
export async function createChange(name: string, summary = '', kind?: string) {
  if (!name) {
    console.error(`  ${pc.red('Usage:')} rsp create <name> [summary]`)
    process.exit(1)
  }
  if (!isValidChangeName(name)) {
    console.error(`  ${pc.red('Error:')} change name must be kebab-case with optional subdirectory (lowercase, digits, hyphens, slashes)`)
    process.exit(1)
  }
  guardRspInitialized()

  return withRspLock('create-change', async () => {
    const changePath = join(CHANGES_DIR, `${name}.md`)
    await mkdir(dirname(changePath), { recursive: true })

    const existed = existsSync(changePath)
    if (!existed) {
      const content = generateChangeContent(name, summary, kind)
      await writeFile(changePath, content)
      await mkdir(FOCUS_DIR, { recursive: true })
      const focusEntry = join(FOCUS_DIR, name)
      await mkdir(dirname(focusEntry), { recursive: true })
      await writeFile(focusEntry, '')
    }

    const label = existed ? 'Using' : pc.green('Created')
    console.log(`  ${label}: ${changePath}`)
    if (existed)
      console.log(`  ${pc.dim('Unchanged focus.')} Run: rsp focus ${name}`)
    else
      console.log(`  ${pc.dim('focused via focus.d')} → ${name}`)
    console.log(`  ${pc.cyan('Next:')} fill proposal/spec/design first, then implement and complete the tasks\n`)
  })
}
