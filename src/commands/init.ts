import type { InitArgs } from '../types.js'
import { existsSync } from 'node:fs'
import { mkdir, readFile } from 'node:fs/promises'

import { join } from 'node:path'
import { generateChangeContent, generateDesignContent, upsertRspAgentsBlock } from '../core/artifacts.js'
import { CHANGES_DIR, clearConfigCache, CONFIG_PATH, FOCUS_DIR, generateConfigTemplate, inspectRspConfig, pc, PKG_ROOT, reconcileRspConfigDefaults, RSP_DIR, RSP_RULES_PATH } from '../core/config.js'
import { ensureDecisionRecordsDirectory, resolveDecisionRecordsPath, validateDecisionRecordsFilesystemPath } from '../core/decisions.js'
import { detectProjectName } from '../core/filesystem.js'
import { withRspLock } from '../core/lock.js'
import { ensureManagedFile, inspectManagedFile, requireManagedDirectory, writeManagedFile } from '../core/managed-path.js'
import { resolveFocusMarkerPath, resolveWorkRef } from '../core/work-ref.js'
import { removeLegacyArchiveIndex } from './archive-index-migration.js'
import { buildSpecsIndex } from './specs-index.js'

export { generateConfigTemplate }

async function ensureFile(path: string, content: string): Promise<boolean> {
  return ensureManagedFile(path, content, 'managed file')
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

  const agentsPath = 'AGENTS.md'
  const initialAgentsInspection = inspectManagedFile(agentsPath, 'AGENTS.md', { allowMissing: true })
  if (initialAgentsInspection.issue)
    throw initialAgentsInspection.issue

  return withRspLock('init', async () => {
    const agentsInspection = inspectManagedFile(agentsPath, 'AGENTS.md', { allowMissing: true })
    if (agentsInspection.issue)
      throw agentsInspection.issue

    if (existsSync(CONFIG_PATH)) {
      clearConfigCache()
      const existingConfig = await inspectRspConfig()
      if (existingConfig.issues.length > 0)
        throw new Error(existingConfig.issues.join('; '))
      const existingDecisionRecordsPath = resolveDecisionRecordsPath(existingConfig.config)
      const filesystemIssue = await validateDecisionRecordsFilesystemPath(existingDecisionRecordsPath)
      if (filesystemIssue)
        throw new Error(filesystemIssue)
    }

    const dirs = [
      { path: join(RSP_DIR, 'specs'), label: 'specs root' },
      { path: CHANGES_DIR, label: 'open work root' },
      { path: FOCUS_DIR, label: 'focus root' },
      { path: join(RSP_DIR, 'archives'), label: 'archive root' },
    ]

    for (const directory of dirs)
      requireManagedDirectory(directory.path, directory.label, { allowMissing: true })
    for (const directory of dirs)
      await mkdir(directory.path, { recursive: true })

    let created = false
    const bundledRules = await readFile(join(PKG_ROOT, 'rules', 'rsp-rules.md'), 'utf-8')

    created = (await ensureFile(RSP_RULES_PATH, bundledRules)) || created
    if (existsSync(CONFIG_PATH)) {
      const existing = await readFile(CONFIG_PATH, 'utf-8')
      const reconciled = reconcileRspConfigDefaults(existing)
      if (reconciled.changed) {
        await writeManagedFile(CONFIG_PATH, reconciled.content, 'config file')
        created = true
      }
    }
    else {
      created = (await ensureFile(join(RSP_DIR, 'config.yaml'), generateConfigTemplate())) || created
    }
    clearConfigCache()
    const configInspection = await inspectRspConfig()
    if (configInspection.issues.length > 0)
      throw new Error(configInspection.issues.join('; '))
    const decisionRecordsPath = resolveDecisionRecordsPath(configInspection.config)
    created = (await ensureDecisionRecordsDirectory(decisionRecordsPath)) || created
    const createdDesign = await ensureFile(join(RSP_DIR, 'specs', 'design.md'), generateDesignContent(projectName))
    created = createdDesign || created
    created = (await removeLegacyArchiveIndex()) || created
    created = (await ensureFile(join(CHANGES_DIR, '.gitkeep'), '')) || created
    created = (await ensureFile(join(FOCUS_DIR, '.gitkeep'), '')) || created
    created = (await ensureFile(join(RSP_DIR, '.gitignore'), '# Transient files that should not be committed\n.lock\n')) || created

    if (args.withProjectSetup) {
      const projectSetupRef = resolveWorkRef('project-setup', { executable: true })
      const changePath = projectSetupRef.path
      const focusMarker = resolveFocusMarkerPath(projectSetupRef)
      created = (await ensureFile(changePath, generateChangeContent('project-setup'))) || created
      created = (await ensureFile(focusMarker, '')) || created
    }

    created = (await buildSpecsIndex({ acquireLock: false })) || created
    const title = toTitle(projectName)
    let agentsUpdated = false

    if (!agentsInspection.exists) {
      await writeManagedFile(agentsPath, `# ${title}\n\n${upsertRspAgentsBlock('').content}\n`, 'AGENTS.md')
      created = true
      agentsUpdated = true
    }
    else {
      const existing = await readFile(agentsPath, 'utf-8')
      const next = upsertRspAgentsBlock(existing)
      if (next.changed) {
        await writeManagedFile(agentsPath, next.content, 'AGENTS.md')
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
