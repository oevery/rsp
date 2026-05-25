import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

import { pc, RSP_DIR } from '../core/config.js'
import { detectProjectName, generateDesignContent, generateSpecContent, guardRspInitialized, isValidChangeName } from '../core/helpers.js'
import { withRspLock } from '../core/lock.js'
import { buildSpecsIndex } from './specs-index.js'

export async function addSpec(name: string, projectName = 'project') {
  if (!name || !isValidChangeName(name)) {
    console.error(`  ${pc.red('Error:')} spec name must be kebab-case with optional subdirectory`)
    process.exit(1)
  }
  guardRspInitialized()

  const path = join(RSP_DIR, 'specs', `${name}.md`)
  if (existsSync(path)) {
    console.error(`  ${pc.red('Error:')} spec file already exists: .rsp/specs/${name}.md`)
    process.exit(1)
  }

  return withRspLock('add-spec', async () => {
    await mkdir(dirname(path), { recursive: true })
    const resolvedProjectName = projectName === 'project' ? await detectProjectName() : projectName
    const content = name === 'design' ? generateDesignContent(resolvedProjectName) : generateSpecContent(name)
    await writeFile(path, content)
    await buildSpecsIndex({ acquireLock: false })
    console.log(`  ${pc.green('Created:')} .rsp/specs/${name}.md\n`)
  })
}
