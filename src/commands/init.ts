import { existsSync } from 'node:fs'
import { cp, mkdir, readFile, writeFile } from 'node:fs/promises'
import { basename, join } from 'node:path'

import { pc, PKG_ROOT, RSP_DIR } from '../core/config.js'
import { withRspLock } from '../core/lock.js'

/** Detect project name from package.json or fall back to directory name. */
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

/** AGENTS.md body declaring RSP collaboration mode */
const AGENTS_BODY = `## Collaboration Mode
This project uses **RSP** (Rules, Specs, Plans) — see \`.rsp/rules/\` for the full workflow definition (start with \`rsp-rules.md\`).

Key conventions:
- \`.rsp/rules/\` — technical constraints and coding conventions
- \`.rsp/specs/\` — project-level architecture and design reference
- \`.rsp/features/<name>.md\` — feature definitions (spec + plan + tests)
- \`.rsp/active.d/\` — currently active features (path = feature name)
- \`.rsp/archive/\` — completed features

## Workflow
- Run \`rsp status\` to see current project state
- Run \`rsp new <name>\` to start a new feature
- Run \`rsp close <name>\` to archive a completed feature`

/** Default config.yaml template — RSP built-in defaults, commented out for reference */
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

/**
 * Scaffold the .rsp/ directory structure and AGENTS.md in the current project.
 */
export async function initProject() {
  const isNew = !existsSync(RSP_DIR)
  return withRspLock('init', async () => {
    const dirs = [
      join(RSP_DIR, 'rules'),
      join(RSP_DIR, 'specs'),
      join(RSP_DIR, 'features'),
      join(RSP_DIR, 'archive'),
    ]

    let created = false

    for (const d of dirs)
      await mkdir(d, { recursive: true })

    const rulesDest = join(RSP_DIR, 'rules', 'rsp-rules.md')
    if (!existsSync(rulesDest)) {
      await cp(join(PKG_ROOT, 'rules', 'rsp-rules.md'), rulesDest)
      created = true
    }

    const configPath = join(RSP_DIR, 'config.yaml')
    if (!existsSync(configPath)) {
      await writeFile(configPath, CONFIG_TEMPLATE)
      created = true
    }

    const specIndexPath = join(RSP_DIR, 'specs', 'INDEX.md')
    if (!existsSync(specIndexPath)) {
      await writeFile(specIndexPath, '# Specs Index\n\n_Extracted from archived features._\n')
      created = true
    }

    const gitignorePath = join(RSP_DIR, '.gitignore')
    if (!existsSync(gitignorePath)) {
      await writeFile(gitignorePath, '# Transient files that should not be committed\n.lock\n')
      created = true
    }

    const agentsPath = 'AGENTS.md'
    const projectName = await detectProjectName()
    if (existsSync(agentsPath)) {
      const existing = await readFile(agentsPath, 'utf-8')
      const rspRe = /\bRSP\b/
      if (!rspRe.test(existing)) {
        const h2Match = existing.match(/^## /m)
        if (h2Match) {
          const before = existing.slice(0, h2Match.index)
          const after = existing.slice(h2Match.index)
          await writeFile(agentsPath, `${before}${AGENTS_BODY}\n\n---\n\n${after}`)
        }
        else {
          await writeFile(agentsPath, `${existing}\n\n${AGENTS_BODY}\n`)
        }
        created = true
      }
    }
    else {
      const title = projectName.startsWith('@') ? projectName.split('/')[1] || projectName : projectName
      await writeFile(agentsPath, `# ${title}\n\n${AGENTS_BODY}\n`)
      created = true
    }

    if (isNew) {
      console.log(`\n  ${pc.green('RSP scaffolded.')}\n`)
      console.log(`  Created: .rsp/rules/\n           .rsp/specs/\n           .rsp/features/\n           .rsp/archive/\n           .rsp/.gitignore\n           .rsp/config.yaml\n           AGENTS.md\n`)
      console.log(`  ${pc.cyan('Next:')} rsp new <name>\n  ${pc.dim('Also:')} rsp status  rsp deps\n`)
    }
    else if (created) {
      console.log(`\n  ${pc.green('RSP initialized.')}\n`)
    }
    else {
      console.log(`\n  ${pc.yellow('RSP already initialized — nothing changed.')}\n`)
    }
  })
}
