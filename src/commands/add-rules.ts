import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'

import { pc, RSP_DIR } from '../core/config.js'
import { detectProjectName, generateProjectRulesContent, generateRulesContent, guardRspInitialized, isValidChangeName } from '../core/helpers.js'
import { withRspLock } from '../core/lock.js'

export async function addRules(name: string, projectName = 'project') {
  if (!name || !isValidChangeName(name)) {
    console.error(`  ${pc.red('Error:')} rule name must be kebab-case with optional subdirectory`)
    process.exit(1)
  }
  guardRspInitialized()

  const path = join(RSP_DIR, 'rules', `${name}.md`)
  if (existsSync(path)) {
    console.error(`  ${pc.red('Error:')} rule file already exists: .rsp/rules/${name}.md`)
    process.exit(1)
  }

  return withRspLock('add-rules', async () => {
    await mkdir(dirname(path), { recursive: true })
    const resolvedProjectName = projectName === 'project' ? await detectProjectName() : projectName
    const content = name === 'project-rules' ? generateProjectRulesContent(resolvedProjectName) : generateRulesContent(name)
    await writeFile(path, content)
    console.log(`  ${pc.green('Created:')} .rsp/rules/${name}.md\n`)
  })
}
