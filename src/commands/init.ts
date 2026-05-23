import type { InitArgs } from '../types.js'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

import { basename, join } from 'node:path'
import { pc, PKG_ROOT, RSP_DIR } from '../core/config.js'
import { generateDesignContent, generateProjectRulesContent, renderRspAgentsBlock, upsertRspAgentsBlock } from '../core/helpers.js'
import { withRspLock } from '../core/lock.js'
import { buildArchiveIndex } from './archive-index.js'
import { buildSpecsIndex } from './specs-index.js'

const CONFIG_TEMPLATE = `# RSP project configuration
# Uncomment any section below to override defaults.
#
# Built-in defaults:
#   statuses:            draft, ready, in-progress, blocked, done
#   priorities:          low, medium, high, critical
#   required_sections:   Spec, Plan
#
# statuses:
#   - draft
#   - ready
#   - in-progress
#   - blocked
#   - done
#
# priorities:
#   - low
#   - medium
#   - high
#   - critical
#
# required_sections:
#   - Spec
#   - Plan
`

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

async function ensureFile(path: string, content: string): Promise<boolean> {
  if (existsSync(path))
    return false
  await writeFile(path, content)
  return true
}

function toTitle(projectName: string): string {
  return projectName.startsWith('@') ? projectName.split('/')[1] || projectName : projectName
}

export async function initProject(args: InitArgs = {}) {
  const isNew = !existsSync(RSP_DIR)
  const projectName = await detectProjectName()

  return withRspLock('init', async () => {
    const dirs = [
      join(RSP_DIR, 'rules'),
      join(RSP_DIR, 'specs'),
      join(RSP_DIR, 'features'),
      join(RSP_DIR, 'active.d'),
      join(RSP_DIR, 'archives'),
    ]

    for (const d of dirs)
      await mkdir(d, { recursive: true })

    let created = false
    const bundledRules = await readFile(join(PKG_ROOT, 'rules', 'rsp-rules.md'), 'utf-8')

    created = (await ensureFile(join(RSP_DIR, 'rules', 'rsp-rules.md'), bundledRules)) || created
    created = (await ensureFile(join(RSP_DIR, 'config.yaml'), CONFIG_TEMPLATE)) || created
    const createdSpecsIndex = await ensureFile(join(RSP_DIR, 'specs', 'INDEX.md'), '# Specs Index\n\n_Project-level specs and design notes._\n')
    created = createdSpecsIndex || created
    const createdDesign = await ensureFile(join(RSP_DIR, 'specs', 'design.md'), generateDesignContent(projectName))
    created = createdDesign || created
    const createdArchivesIndex = await ensureFile(join(RSP_DIR, 'archives', 'INDEX.md'), '# Archive Index\n')
    created = createdArchivesIndex || created
    created = (await ensureFile(join(RSP_DIR, 'features', '.gitkeep'), '')) || created
    created = (await ensureFile(join(RSP_DIR, 'active.d', '.gitkeep'), '')) || created
    created = (await ensureFile(join(RSP_DIR, '.gitignore'), '# Transient files that should not be committed\n.lock\n')) || created

    if (args.withProjectRules)
      created = (await ensureFile(join(RSP_DIR, 'rules', 'project-rules.md'), generateProjectRulesContent(projectName))) || created

    if (createdSpecsIndex || createdDesign)
      await buildSpecsIndex({ acquireLock: false })
    if (createdArchivesIndex)
      await buildArchiveIndex({ acquireLock: false })

    const agentsPath = 'AGENTS.md'
    const title = toTitle(projectName)
    const mode = args.agentsMode ?? 'managed'

    if (!existsSync(agentsPath)) {
      if (mode === 'managed') {
        await writeFile(agentsPath, `# ${title}\n\n${upsertRspAgentsBlock('').content}\n`)
        created = true
      }
    }
    else if (mode === 'managed') {
      const existing = await readFile(agentsPath, 'utf-8')
      const next = upsertRspAgentsBlock(existing)
      if (next.changed) {
        await writeFile(agentsPath, next.content)
        created = true
      }
    }

    if (mode === 'print') {
      const managed = existsSync(agentsPath)
        ? upsertRspAgentsBlock(await readFile(agentsPath, 'utf-8')).content
        : `# ${title}\n\n${renderRspAgentsBlock()}\n`
      console.log(`\n${managed}\n`)
    }

    if (isNew) {
      console.log(`
  ${pc.green('RSP scaffolded.')}\n`)
      console.log(`  Created: .rsp/rules/\n           .rsp/specs/\n           .rsp/features/\n           .rsp/active.d/\n           .rsp/archives/\n           .rsp/.gitignore\n           .rsp/config.yaml\n           .rsp/specs/design.md\n           AGENTS.md\n`)
      console.log(`  ${pc.cyan('Next:')} rsp new <name>\n  ${pc.dim('Also:')} rsp status  rsp deps\n`)
    }
    else if (created) {
      console.log(`
  ${pc.green('RSP initialized.')}\n`)
    }
    else {
      console.log(`
  ${pc.yellow('RSP already initialized — nothing changed.')}\n`)
    }
  })
}
