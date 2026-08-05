import type { CommandDiagnostic, IssueRelationship, RuntimeDiagnostic } from '../types.js'
import type { ProjectStatusRecord, ProjectStatusSnapshot } from './model.js'
import { readFile, stat } from 'node:fs/promises'

import { inspectChangeGroups } from '../core/change-group.js'
import { CONFIG_PATH, inspectRspConfig, resolveLanguagePolicy, resolveManagePolicy } from '../core/config.js'
import { inspectChangeDependencies } from '../core/dependency-plan.js'
import { CHANGE_DOCUMENT_SCHEMA, getDocumentSectionBody, getDocumentTitle, parseRspDocument } from '../core/document-model.js'
import { collectArchiveReadiness, countCheckboxes, hasMeaningfulBlockers, normalizeLogicalPath, parseFrontmatter } from '../core/helpers.js'
import { IssueRelationshipError, parseIssueRelationships } from '../core/issue-relationship.js'
import { toErrorMessage } from '../core/output.js'
import { inspectArchiveTree, inspectFocusTree, inspectWorkTree, resolveWorkRef, WorkRefError } from '../core/work-ref.js'
import { extractChangeSummary } from '../core/work-summary.js'
import { historyInspectionComplete, inspectArchiveHistory } from '../history/query.js'

export async function inspectProjectStatus(options: { nowMs?: number } = {}): Promise<ProjectStatusSnapshot> {
  const runtime: RuntimeDiagnostic[] = []
  const diagnostics: CommandDiagnostic[] = []
  let manage = resolveManagePolicy({})
  let language = resolveLanguagePolicy({})
  try {
    const configInspection = await inspectRspConfig()
    const configValid = configInspection.issues.length === 0
    manage = resolveManagePolicy(configInspection.config, { configValid })
    language = resolveLanguagePolicy(configInspection.config, { configValid })
    if (!configValid) {
      diagnostics.push({
        severity: 'error',
        code: 'invalid_config',
        path: CONFIG_PATH,
        message: configInspection.issues.join('; '),
      })
    }
  }
  catch (error) {
    manage = resolveManagePolicy({}, { configValid: false })
    language = resolveLanguagePolicy({}, { configValid: false })
    diagnostics.push({
      severity: 'error',
      code: 'invalid_config',
      path: CONFIG_PATH,
      message: toErrorMessage(error),
    })
  }
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
  const archiveTree = await inspectArchiveTree()
  const historyInspection = await inspectArchiveHistory({ archiveTree })
  diagnostics.push(...workTree.diagnostics.map(diagnostic => ({
    severity: 'error' as const,
    code: diagnostic.code,
    change: diagnostic.input,
    path: diagnostic.path,
    message: diagnostic.message,
  })))
  const groupInspection = await inspectChangeGroups({ workTree, focusTree, archiveTree })
  diagnostics.push(...groupInspection.diagnostics)
  const dependencyInspection = await inspectChangeDependencies({
    workTree,
    archiveTree,
    archiveHistory: historyInspection,
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
    let summary: string | null = null
    let title = name
    let blockerEntries: string[] = []
    let readiness = emptyReadiness(false)
    let ageDays: number | null = null
    const isFocused = focusedSet.has(name)
    let isBlocked = false
    let done = 0
    let total = 0
    let progressKnown = false
    let issues: IssueRelationship[] = []

    if (path) {
      try {
        const content = await readFile(path, 'utf-8')
        title = extractChangeTitle(content) ?? name
        summary = extractChangeSummary(content)
        blockerEntries = extractBlockerEntries(content)
        try {
          const frontmatter = parseFrontmatter(content)
          kind = frontmatter?.kind ? String(frontmatter.kind) : '—'
          issues = parseIssueRelationships(frontmatter)
        }
        catch (error) {
          kind = '(invalid)'
          const issueError = error instanceof IssueRelationshipError
          if (issueError) {
            diagnostics.push({
              severity: 'error',
              code: error.code,
              change: name,
              path,
              message: error.message,
            })
          }
          runtime.push({
            code: issueError ? error.code : 'frontmatter_parse_failed',
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
        summary,
        kind,
        progress: { done, total },
        ageDays,
        isFocused,
        isBlocked,
        path: path ? normalizeLogicalPath(path) : null,
        issues,
      },
      progressKnown,
      title,
      blockerEntries,
      readiness,
    })
  }

  return {
    manage,
    language,
    focused: [...focusedSet].sort(),
    records,
    groups: groupInspection.groups,
    plan: dependencyInspection.plan,
    archiveTrend: historyInspectionComplete(historyInspection) ? deriveArchiveTrend(historyInspection.records) : [],
    diagnostics: [...diagnostics, ...(historyInspection.rootExists ? historyInspection.diagnostics : [])],
    runtime: [...runtime, ...historyInspection.runtime],
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
  return getDocumentTitle(parseRspDocument(content, CHANGE_DOCUMENT_SCHEMA), 'spaced')
}

function extractBlockerEntries(content: string): string[] {
  const document = parseRspDocument(content, CHANGE_DOCUMENT_SCHEMA)
  return getDocumentSectionBody(document, 'blockers')
    .split('\n')
    .map(line => line.trim())
    .filter(line => /^[-*]\s+/.test(line))
    .map(line => line.replace(/^[-*]\s+/, '').trim())
    .filter(line => line.toLowerCase() !== 'none')
}

function deriveArchiveTrend(records: Array<{ date: string }>): Array<{ month: string, count: number }> {
  const counts = new Map<string, number>()
  for (const record of records) {
    const month = record.date.slice(0, 7)
    counts.set(month, (counts.get(month) ?? 0) + 1)
  }
  return [...counts].sort(([left], [right]) => left.localeCompare(right)).map(([month, count]) => ({ month, count }))
}
