import type { CommandRunOptions, RuntimeDiagnostic } from '../types.js'
import { existsSync } from 'node:fs'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

import { CHANGES_DIR, pc, RSP_DIR } from '../core/config.js'
import { collectArchiveReadiness, countCheckboxes, getFocusedChangeNames, guardRspInitialized, hasMeaningfulBlockers, isValidChangeName, normalizeLogicalPath, parseFrontmatter, parseScenarios } from '../core/helpers.js'
import { emitJson, recordRuntimeDiagnostic, toErrorMessage } from '../core/output.js'

interface ShowResult {
  command: 'show'
  ok: true
  change: {
    name: string
    path: string | null
    kind: string
    isFocused: boolean
    progress: { done: number, total: number }
    blockers: boolean
    scenarioCount: number
    readiness: {
      incompleteTasks: number
      incompleteVerify: number
      activeBlockers: boolean
      missingScenarios: boolean
      deterministic: 'pass' | 'warnings'
      semantic: 'needs-review'
      archiveReady: 'yes' | 'judgment' | 'no'
    }
  }
  contextPaths: string[]
  runtime: RuntimeDiagnostic[]
}

export interface ShowOptions extends CommandRunOptions {
  focused?: boolean
}

function exitShowError(error: { code: string, message: string }, options: ShowOptions): never {
  if (options.json) {
    emitJson({
      command: 'show',
      ok: false,
      change: null,
      contextPaths: [],
      runtime: [],
      error,
    })
  }
  else {
    console.error(`  ${pc.red('Error:')} ${error.message}`)
  }
  process.exit(1)
}

export async function showChange(nameOrFocused: string | undefined, options: ShowOptions = {}): Promise<ShowResult> {
  const runtime: RuntimeDiagnostic[] = []
  const reportRuntime = (diagnostic: RuntimeDiagnostic) => recordRuntimeDiagnostic(runtime, diagnostic, Boolean(options.verbose) && !options.json)

  guardRspInitialized()

  let name: string

  if (options.focused) {
    const focused = await getFocusedChangeNames({ onError: reportRuntime })
    if (focused.size === 0) {
      exitShowError({ code: 'no_focused_change', message: 'no focused change exists' }, options)
    }
    if (focused.size > 1) {
      exitShowError({
        code: 'multiple_focused_changes',
        message: `multiple focused changes exist (${[...focused].join(', ')}). Specify a name or focus exactly one change.`,
      }, options)
    }
    name = [...focused][0]
  }
  else if (nameOrFocused) {
    if (!isValidChangeName(nameOrFocused)) {
      exitShowError({
        code: 'invalid_change_name',
        message: 'change name must be kebab-case with optional subdirectory (lowercase, digits, hyphens, slashes)',
      }, options)
    }
    name = nameOrFocused
  }
  else {
    exitShowError({ code: 'missing_change_name', message: 'Usage: rsp show <name|--focused> [--json] [--verbose]' }, options)
  }

  const srcPath = join(CHANGES_DIR, `${name}.md`)
  if (!existsSync(srcPath)) {
    exitShowError({ code: 'change_not_found', message: `.rsp/changes/${name}.md not found` }, options)
  }

  let content: string
  try {
    content = await readFile(srcPath, 'utf-8')
  }
  catch {
    exitShowError({ code: 'change_read_failed', message: `unable to read .rsp/changes/${name}.md` }, options)
  }

  let kind = '—'
  try {
    const fm = parseFrontmatter(content)
    kind = fm?.kind ? String(fm.kind) : '—'
  }
  catch (error) {
    kind = '(invalid)'
    reportRuntime({
      code: 'frontmatter_parse_failed',
      operation: 'parseFrontmatter',
      path: srcPath,
      message: toErrorMessage(error),
    })
  }

  const focusedSet = await getFocusedChangeNames({ onError: reportRuntime })
  const isFocused = focusedSet.has(name)

  const cb = countCheckboxes(content)
  const blockers = hasMeaningfulBlockers(content)
  const scenarios = parseScenarios(content)
  const readinessDetails = collectArchiveReadiness(content)

  const readiness = {
    incompleteTasks: readinessDetails.taskTodos.length,
    incompleteVerify: readinessDetails.verifyTodos.length,
    activeBlockers: readinessDetails.activeBlockers,
    missingScenarios: readinessDetails.missingScenarios,
    deterministic: readinessDetails.deterministic,
    semantic: readinessDetails.semantic,
    archiveReady: readinessDetails.archiveReady,
  }

  const contextPaths = [
    `.rsp/specs/design.md`,
    `.rsp/specs/INDEX.md`,
  ]
  if (existsSync(join(RSP_DIR, 'rules', 'project-rules.md')))
    contextPaths.push('.rsp/rules/project-rules.md')
  contextPaths.push('.rsp/rules/rsp-rules.md')

  const result: ShowResult = {
    command: 'show',
    ok: true,
    change: {
      name,
      path: normalizeLogicalPath(srcPath),
      kind,
      isFocused,
      progress: { done: cb.done, total: cb.total },
      blockers,
      scenarioCount: scenarios.length,
      readiness,
    },
    contextPaths,
    runtime,
  }

  if (options.json) {
    emitJson(result)
    return result
  }

  console.log()
  console.log(`  ${pc.bold('Change:')} ${pc.cyan(name)}`)
  console.log(`  ${pc.dim('Path:')} ${normalizeLogicalPath(srcPath)}`)
  console.log(`  ${pc.dim('Kind:')} ${kind}`)
  console.log(`  ${pc.dim('Focused:')} ${isFocused ? pc.green('yes') : pc.dim('no')}`)
  console.log(`  ${pc.dim('Progress:')} ${cb.done}/${cb.total}`)
  console.log(`  ${pc.dim('Blockers:')} ${blockers ? pc.yellow('yes') : pc.green('no')}`)
  console.log(`  ${pc.dim('Scenarios:')} ${scenarios.length}`)
  console.log()
  console.log(`  ${pc.bold('Readiness:')}`)
  console.log(`    ${pc.dim('Incomplete tasks:')} ${readiness.incompleteTasks > 0 ? pc.yellow(String(readiness.incompleteTasks)) : pc.green('0')}`)
  console.log(`    ${pc.dim('Incomplete verify:')} ${readiness.incompleteVerify > 0 ? pc.yellow(String(readiness.incompleteVerify)) : pc.green('0')}`)
  console.log(`    ${pc.dim('Active blockers:')} ${readiness.activeBlockers ? pc.yellow('yes') : pc.green('no')}`)
  console.log(`    ${pc.dim('Missing scenarios:')} ${readiness.missingScenarios ? pc.yellow('yes') : pc.green('no')}`)
  console.log(`    ${pc.dim('Deterministic:')} ${readiness.deterministic === 'pass' ? pc.green('pass') : pc.yellow('warnings')}`)
  console.log(`    ${pc.dim('Semantic review:')} ${pc.yellow('needed')}`)
  console.log(`    ${pc.dim('Archive ready:')} ${formatArchiveReady(readiness.archiveReady)}`)
  console.log()
  console.log(`  ${pc.bold('Context paths:')}`)
  for (const cp of contextPaths)
    console.log(`    ${pc.dim(cp)}`)
  console.log()

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
