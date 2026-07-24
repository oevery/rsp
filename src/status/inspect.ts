import type { CommandDiagnostic, RuntimeDiagnostic } from '../types.js'
import type { ProjectStatusRecord, ProjectStatusSnapshot } from './model.js'
import { existsSync } from 'node:fs'
import { readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'

import { inspectChangeGroups } from '../core/change-group.js'
import { ARCHIVES_DIR } from '../core/config.js'
import { inspectChangeDependencies } from '../core/dependency-plan.js'
import { collectArchiveReadiness, countCheckboxes, extractSection, hasMeaningfulBlockers, normalizeLogicalPath, parseFrontmatter } from '../core/helpers.js'
import { toErrorMessage } from '../core/output.js'
import { inspectFocusTree, inspectWorkTree, resolveWorkRef, WorkRefError } from '../core/work-ref.js'

export async function inspectProjectStatus(options: { nowMs?: number } = {}): Promise<ProjectStatusSnapshot> {
  const runtime: RuntimeDiagnostic[] = []
  const diagnostics: CommandDiagnostic[] = []
  const focusTree = await inspectFocusTree()
  for (const diagnostic of focusTree.diagnostics) {
    diagnostics.push({
      severity: 'error',
      code: diagnostic.code,
      change: diagnostic.input,
      path: diagnostic.path,
      message: diagnostic.message,
    })
  }
  const rawFocusedSet = new Set(focusTree.markers.map(marker => marker.name))
  const focusedSet = new Set<string>()
  const focusedPaths = new Map<string, string>()
  for (const name of rawFocusedSet) {
    try {
      const ref = resolveWorkRef(name, { executable: true })
      focusedSet.add(ref.name)
      focusedPaths.set(ref.name, ref.path)
    }
    catch (error) {
      if (!(error instanceof WorkRefError))
        throw error
      diagnostics.push({
        severity: 'error',
        code: error.code,
        path: `.rsp/focus.d/${name}`,
        change: name,
        message: error.message,
      })
    }
  }

  const workTree = await inspectWorkTree()
  diagnostics.push(...workTree.diagnostics.map(diagnostic => ({
    severity: 'error' as const,
    code: diagnostic.code,
    change: diagnostic.input,
    path: diagnostic.path,
    message: diagnostic.message,
  })))
  const groupInspection = await inspectChangeGroups({ workTree, focusTree })
  diagnostics.push(...groupInspection.diagnostics)
  const dependencyInspection = await inspectChangeDependencies({
    workTree,
    preferredOrder: groupInspection.groups.flatMap(group => group.slices.map(slice => slice.name)),
  })
  diagnostics.push(...dependencyInspection.diagnostics)

  const changeMap = new Map(workTree.changes.map(ref => [ref.name, ref.path]))
  const allNames = [...new Set([...changeMap.keys(), ...focusedSet])].sort()
  const records: ProjectStatusRecord[] = []
  const nowMs = options.nowMs ?? Date.now()

  for (const name of allNames) {
    const path = changeMap.get(name)
    let kind = '—'
    let title = name
    let blockerEntries: string[] = []
    let readiness = emptyReadiness(false)
    let ageDays: number | null = null
    const isFocused = focusedSet.has(name)
    let isBlocked = false
    let done = 0
    let total = 0
    let progressKnown = false

    if (path) {
      try {
        const content = await readFile(path, 'utf-8')
        title = extractChangeTitle(content) ?? name
        blockerEntries = extractBlockerEntries(content)
        try {
          const frontmatter = parseFrontmatter(content)
          kind = frontmatter?.kind ? String(frontmatter.kind) : '—'
        }
        catch (error) {
          kind = '(invalid)'
          runtime.push({
            code: 'frontmatter_parse_failed',
            operation: 'parseFrontmatter',
            path,
            message: toErrorMessage(error),
          })
        }
        isBlocked = dependencyInspection.activeBlockers.get(name) ?? hasMeaningfulBlockers(content)
        const checkboxes = countCheckboxes(content)
        done = checkboxes.done
        total = checkboxes.total
        progressKnown = true
        const details = collectArchiveReadiness(content, { activeBlockers: isBlocked })
        readiness = {
          incompleteTasks: details.taskTodos.length,
          incompleteVerify: details.verifyTodos.length,
          activeBlockers: details.activeBlockers,
          missingScenarios: details.missingScenarios,
          deterministic: details.deterministic,
          semantic: details.semantic,
          archiveReady: details.archiveReady,
        }
      }
      catch (error) {
        diagnostics.push({
          severity: 'error',
          code: 'change_read_failed',
          change: name,
          path,
          message: 'unable to read open Change',
          hint: toErrorMessage(error),
        })
        runtime.push({
          code: 'change_read_failed',
          operation: 'readFile',
          path,
          message: toErrorMessage(error),
        })
      }

      try {
        const metadata = await stat(path)
        ageDays = Math.floor((nowMs - metadata.mtime.getTime()) / (1000 * 60 * 60 * 24))
      }
      catch (error) {
        diagnostics.push({
          severity: 'error',
          code: 'change_stat_failed',
          change: name,
          path,
          message: 'unable to inspect open Change metadata',
          hint: toErrorMessage(error),
        })
        runtime.push({
          code: 'change_stat_failed',
          operation: 'stat',
          path,
          message: toErrorMessage(error),
        })
      }
    }
    else {
      kind = '(missing)'
      const path = focusedPaths.get(name)!
      diagnostics.push({
        severity: 'error',
        code: 'focused_change_missing',
        change: name,
        path,
        message: 'focus marker points to a missing Change file',
      })
      runtime.push({
        code: 'focused_change_missing',
        operation: 'resolveChange',
        path,
        message: 'focus marker points to a missing change file',
      })
    }

    records.push({
      output: {
        name,
        kind,
        progress: { done, total },
        ageDays,
        isFocused,
        isBlocked,
        path: path ? normalizeLogicalPath(path) : null,
      },
      progressKnown,
      title,
      blockerEntries,
      readiness,
    })
  }

  return {
    focused: [...focusedSet].sort(),
    records,
    groups: groupInspection.groups,
    plan: dependencyInspection.plan,
    archiveTrend: await readArchiveTrend(runtime),
    diagnostics,
    runtime,
  }
}

function emptyReadiness(activeBlockers: boolean): ProjectStatusRecord['readiness'] {
  return {
    incompleteTasks: 0,
    incompleteVerify: 0,
    activeBlockers,
    missingScenarios: false,
    deterministic: 'pass',
    semantic: 'needs-review',
    archiveReady: activeBlockers ? 'no' : 'judgment',
  }
}

function extractChangeTitle(content: string): string | null {
  const heading = content.split(/\r?\n/).find(line => line.startsWith('# Change: '))
  return heading?.slice('# Change: '.length).trim() || null
}

function extractBlockerEntries(content: string): string[] {
  return extractSection(content, 'Blockers')
    .split('\n')
    .map(line => line.trim())
    .filter(line => /^[-*]\s+/.test(line))
    .map(line => line.replace(/^[-*]\s+/, '').trim())
    .filter(line => line.toLowerCase() !== 'none')
}

async function readArchiveTrend(runtime: RuntimeDiagnostic[]): Promise<Array<{ month: string, count: number }>> {
  const indexPath = join(ARCHIVES_DIR, 'INDEX.md')
  if (!existsSync(indexPath))
    return []

  try {
    const content = await readFile(indexPath, 'utf-8')
    const dateRe = /^\| (\d{4}-\d{2})-\d{2} \|/gm
    const counts: Record<string, number> = {}
    let match
    // eslint-disable-next-line no-cond-assign
    while ((match = dateRe.exec(content)) !== null) {
      const month = match[1]
      counts[month] = (counts[month] || 0) + 1
    }
    return Object.keys(counts).sort().map(month => ({ month, count: counts[month] }))
  }
  catch (error) {
    runtime.push({
      code: 'archive_index_read_failed',
      operation: 'readFile',
      path: indexPath,
      message: toErrorMessage(error),
    })
    return []
  }
}
