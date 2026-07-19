import type { InitArgs } from '../types.js'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'

import { join } from 'node:path'
import { CHANGES_DIR, clearConfigCache, CONFIG_PATH, FOCUS_DIR, inspectRspConfig, pc, PKG_ROOT, RSP_DIR, RSP_RULES_PATH, VALID_KINDS } from '../core/config.js'
import { ensureDecisionRecordsDirectory, resolveDecisionRecordsPath, validateDecisionRecordsFilesystemPath } from '../core/decisions.js'
import { detectProjectName, generateChangeContent, generateDesignContent, upsertRspAgentsBlock } from '../core/helpers.js'
import { withRspLock } from '../core/lock.js'
import { buildArchiveIndex } from './archive-index.js'
import { buildSpecsIndex } from './specs-index.js'

function generateConfigTemplate(): string {
  const fmtList = (items: string[], indent: number) => items.map(i => `${' '.repeat(indent)}# - ${i}`).join('\n')
  return `# RSP project configuration
# Uncomment any section below to customize classification values.
#
# Built-in defaults:
#   kinds:               ${VALID_KINDS.join(', ')}
#
# kinds:
${fmtList(VALID_KINDS, 2)}

# Decision Records default to .rsp/specs/decisions.
# Set one project-relative external authoritative directory when the Host Project already owns ADRs.
# decisions:
#   path: docs/adr
`
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

  const mode = args.agentsMode ?? 'managed'
  if (mode !== 'managed' && mode !== 'print') {
    console.error(`  ${pc.red('Error:')} unsupported --agents-mode "${mode}". Use: managed or print`)
    process.exit(1)
  }

  return withRspLock('init', async () => {
    if (existsSync(CONFIG_PATH)) {
      clearConfigCache()
      const existingConfig = await inspectRspConfig()
      if (existingConfig.decisionRecordsIssue)
        throw new Error(existingConfig.decisionRecordsIssue)
      const existingDecisionRecordsPath = resolveDecisionRecordsPath(existingConfig.config)
      const filesystemIssue = await validateDecisionRecordsFilesystemPath(existingDecisionRecordsPath)
      if (filesystemIssue)
        throw new Error(filesystemIssue)
    }

    const dirs = [
      join(RSP_DIR, 'specs'),
      CHANGES_DIR,
      FOCUS_DIR,
      join(RSP_DIR, 'archives'),
    ]

    for (const d of dirs)
      await mkdir(d, { recursive: true })

    let created = false
    const bundledRules = await readFile(join(PKG_ROOT, 'rules', 'rsp-rules.md'), 'utf-8')

    created = (await ensureFile(RSP_RULES_PATH, bundledRules)) || created
    created = (await ensureFile(join(RSP_DIR, 'config.yaml'), generateConfigTemplate())) || created
    clearConfigCache()
    const configInspection = await inspectRspConfig()
    if (configInspection.decisionRecordsIssue)
      throw new Error(configInspection.decisionRecordsIssue)
    const decisionRecordsPath = resolveDecisionRecordsPath(configInspection.config)
    created = (await ensureDecisionRecordsDirectory(decisionRecordsPath)) || created
    const createdSpecsIndex = await ensureFile(join(RSP_DIR, 'specs', 'INDEX.md'), '# Specs Index\n\n_Additional project-level specs beyond `design.md`._\n')
    created = createdSpecsIndex || created
    const createdDesign = await ensureFile(join(RSP_DIR, 'specs', 'design.md'), generateDesignContent(projectName))
    created = createdDesign || created
    const createdArchivesIndex = await ensureFile(join(RSP_DIR, 'archives', 'INDEX.md'), '# Archive Index\n')
    created = createdArchivesIndex || created
    created = (await ensureFile(join(CHANGES_DIR, '.gitkeep'), '')) || created
    created = (await ensureFile(join(FOCUS_DIR, '.gitkeep'), '')) || created
    created = (await ensureFile(join(RSP_DIR, '.gitignore'), '# Transient files that should not be committed\n.lock\n')) || created

    if (args.withProjectSetup) {
      const changePath = join(CHANGES_DIR, 'project-setup.md')
      const focusMarker = join(FOCUS_DIR, 'project-setup')
      created = (await ensureFile(changePath, generateChangeContent('project-setup'))) || created
      created = (await ensureFile(focusMarker, '')) || created
    }

    if (createdSpecsIndex || createdDesign)
      await buildSpecsIndex({ acquireLock: false })
    if (createdArchivesIndex)
      await buildArchiveIndex({ acquireLock: false })

    const agentsPath = 'AGENTS.md'
    const title = toTitle(projectName)
    let agentsUpdated = false

    if (!existsSync(agentsPath)) {
      await writeFile(agentsPath, `# ${title}\n\n${upsertRspAgentsBlock('').content}\n`)
      created = true
      agentsUpdated = true
    }
    else {
      const existing = await readFile(agentsPath, 'utf-8')
      const next = upsertRspAgentsBlock(existing)
      if (next.changed) {
        await writeFile(agentsPath, next.content)
        created = true
        agentsUpdated = true
      }
    }

    if (mode === 'print') {
      const managed = await readFile(agentsPath, 'utf-8')
      console.log(`\n${managed}\n`)
    }

    if (isNew) {
      const createdProjectSetup = args.withProjectSetup ? '\n           .rsp/changes/project-setup.md\n           .rsp/focus.d/project-setup' : ''
      const createdAgents = agentsUpdated ? '\n           AGENTS.md' : ''
      const next = args.withProjectSetup ? 'fill .rsp/changes/project-setup.md' : 'rsp create project-setup'
      console.log(`
  ${pc.green('RSP scaffolded.')}\n`)
      console.log(`  Created: .rsp/rsp-rules.md\n           .rsp/specs/\n           ${decisionRecordsPath}/\n           .rsp/changes/\n           .rsp/focus.d/\n           .rsp/archives/\n           .rsp/.gitignore\n           .rsp/config.yaml\n           .rsp/specs/design.md${createdProjectSetup}${createdAgents}\n`)
      console.log(`  ${pc.cyan('Next:')} ${next}\n  ${pc.dim('Then:')} fill .rsp/specs/design.md\n  ${pc.dim('Also:')} rsp status  rsp check\n`)
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
