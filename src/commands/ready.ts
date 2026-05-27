import type { CommandRunOptions, RuntimeDiagnostic } from '../types.js'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { CHANGES_DIR, pc } from '../core/config.js'
import { collectArchiveReadiness, guardRspInitialized, isValidChangeName, normalizeLogicalPath } from '../core/helpers.js'
import { emitJson } from '../core/output.js'

interface ReadyResult {
  command: 'ready'
  ok: true
  change: string
  path: string | null
  readiness: {
    incompleteTasks: number
    incompleteVerify: number
    activeBlockers: boolean
    missingScenarios: boolean
    deterministic: 'pass' | 'warnings'
    semantic: 'needs-review'
    archiveReady: 'yes' | 'judgment' | 'no'
  }
  warnings: string[]
  runtime: RuntimeDiagnostic[]
}

export async function showReady(name: string, options: CommandRunOptions = {}): Promise<ReadyResult> {
  if (!name) {
    console.error(`  ${pc.red('Usage:')} rsp ready <name>`)
    process.exit(1)
  }
  if (!isValidChangeName(name)) {
    console.error(`  ${pc.red('Error:')} change name must be kebab-case with optional subdirectory (lowercase, digits, hyphens, slashes)`)
    process.exit(1)
  }
  guardRspInitialized()

  const srcPath = join(CHANGES_DIR, `${name}.md`)
  if (!existsSync(srcPath)) {
    console.error(`  ${pc.red('Change not found:')} .rsp/changes/${name}.md`)
    process.exit(1)
  }

  const runtime: RuntimeDiagnostic[] = []

  let content: string
  try {
    content = await readFile(srcPath, 'utf-8')
  }
  catch {
    console.error(`  ${pc.red('Error:')} unable to read .rsp/changes/${name}.md`)
    process.exit(1)
  }

  const readinessDetails = collectArchiveReadiness(content)
  const checklist = readinessDetails.warnings
  const readiness = {
    incompleteTasks: readinessDetails.taskTodos.length,
    incompleteVerify: readinessDetails.verifyTodos.length,
    activeBlockers: readinessDetails.activeBlockers,
    missingScenarios: readinessDetails.missingScenarios,
    deterministic: readinessDetails.deterministic,
    semantic: readinessDetails.semantic,
    archiveReady: readinessDetails.archiveReady,
  }

  const result: ReadyResult = {
    command: 'ready',
    ok: true,
    change: name,
    path: normalizeLogicalPath(srcPath),
    readiness,
    warnings: checklist,
    runtime,
  }

  if (options.json) {
    emitJson(result)
    return result
  }

  console.log()
  console.log(`  ${pc.bold('Archive readiness for')} ${pc.cyan(name)}`)
  console.log()

  if (checklist.length === 0) {
    console.log(`  ${pc.green('✓')} Ready to archive. No deterministic warnings found.\n`)
  }
  else {
    for (const line of checklist)
      console.log(`  ${pc.yellow('⚠')} ${line}`)
    console.log()
    console.log(`  ${pc.dim('Review the warnings above before treating this work as fully closed.')}`)
    console.log(`  ${pc.dim('Run:')} rsp archive ${name}\n`)
  }

  console.log(`  ${pc.dim('Deterministic readiness:')} ${readiness.deterministic === 'pass' ? pc.green('pass') : pc.yellow('warnings')}`)
  console.log(`  ${pc.dim('Semantic review:')} ${pc.yellow('needed')}`)
  console.log(`  ${pc.dim('Archive ready:')} ${formatArchiveReady(readiness.archiveReady)}\n`)

  return result
}

function formatArchiveReady(value: 'yes' | 'judgment' | 'no'): string {
  switch (value) {
    case 'yes':
      return pc.green('yes')
    case 'no':
      return pc.yellow('no')
    case 'judgment':
      return pc.yellow('judgment')
  }
}
