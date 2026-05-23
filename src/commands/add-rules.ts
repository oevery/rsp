import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, dirname, join } from 'node:path'

import { pc, RSP_DIR } from '../core/config.js'
import { generateProjectRulesContent, generateRulesContent } from '../core/helpers.js'
import { withRspLock } from '../core/lock.js'

const NAME_RE = /^[a-z0-9-]+(?:\/[a-z0-9-]+)*$/

async function detectProjectName(): Promise<string> {
  try {
    if (existsSync('package.json')) {
      const raw = await readFile('package.json', 'utf-8')
      const pkg = JSON.parse(raw)
      if (pkg.name && pkg.name !== '')
        return pkg.name
    }
  }
  catch { /* fall through */ }
  return basename(process.cwd())
}

export async function addRules(name: string, projectName = 'project') {
  return withRspLock('add-rules', async () => {
    if (!name || !NAME_RE.test(name)) {
      console.error(`  ${pc.red('Error:')} rule name must be kebab-case with optional subdirectory`)
      process.exit(1)
    }

    const dir = join(RSP_DIR, 'rules')
    const path = join(dir, `${name}.md`)
    if (existsSync(path)) {
      console.error(`  ${pc.red('Error:')} rule file already exists: .rsp/rules/${name}.md`)
      process.exit(1)
    }

    await mkdir(dirname(path), { recursive: true })
    const resolvedProjectName = projectName === 'project' ? await detectProjectName() : projectName
    const content = name === 'project-rules' ? generateProjectRulesContent(resolvedProjectName) : generateRulesContent(name)
    await writeFile(path, content)
    console.log(`  ${pc.green('Created:')} .rsp/rules/${name}.md\n`)
  })
}
