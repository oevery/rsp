import type { CommandDiagnostic, CommandRunOptions, RuntimeDiagnostic, StatusJsonShape, StatusRecordOutput } from '../types.js'
import { existsSync } from 'node:fs'
import { readFile, stat } from 'node:fs/promises'
import { join } from 'node:path'

import { ARCHIVES_DIR, pc } from '../core/config.js'
import { countCheckboxes, hasMeaningfulBlockers, normalizeLogicalPath, parseFrontmatter } from '../core/helpers.js'
import { emitJson, recordRuntimeDiagnostic, toErrorMessage } from '../core/output.js'
import { inspectFocusTree, inspectWorkTree, resolveWorkRef, WorkRefError } from '../core/work-ref.js'

const COL_CHANGE = 32
const COL_KIND = 10
const COL_AGE = 7
const COL_PROGRESS = 10

interface StatusRecord {
  name: string
  kind: string
  progress: string
  age: string
  isFocused: boolean
  isBlocked: boolean
}

interface StatusOptions {
  focused?: boolean
  blocked?: boolean
  stale?: number
}

/** Display project status: focused changes, progress, blockers, age, and archive trends. */
export async function showStatus(options: StatusOptions = {}, runOptions: CommandRunOptions = {}): Promise<StatusJsonShape> {
  const runtime: RuntimeDiagnostic[] = []
  const diagnostics: CommandDiagnostic[] = []
  const reportRuntime = (diagnostic: RuntimeDiagnostic) => recordRuntimeDiagnostic(runtime, diagnostic, Boolean(runOptions.verbose) && !runOptions.json)

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

  const changeMap: Record<string, string> = {}
  for (const ref of workTree.changes)
    changeMap[ref.name] = ref.path

  const allNames = [...new Set([...Object.keys(changeMap), ...focusedSet])].sort()

  const records: StatusRecord[] = []
  const outputRecords: StatusRecordOutput[] = []

  for (const name of allNames) {
    const fp = changeMap[name]
    let kind = '—'
    let progress = '—'
    let ageDays: number | null = null
    const isFocused = focusedSet.has(name)
    let isBlocked = false
    let done = 0
    let total = 0

    if (fp) {
      try {
        const content = await readFile(fp, 'utf-8')
        try {
          const fm = parseFrontmatter(content)
          kind = fm?.kind ? String(fm.kind) : '—'
        }
        catch (error) {
          kind = '(invalid)'
          reportRuntime({
            code: 'frontmatter_parse_failed',
            operation: 'parseFrontmatter',
            path: fp,
            message: toErrorMessage(error),
          })
        }
        isBlocked = hasMeaningfulBlockers(content)
        const cb = countCheckboxes(content)
        done = cb.done
        total = cb.total
        progress = `${done}/${total}`
      }
      catch (error) {
        diagnostics.push({
          severity: 'error',
          code: 'change_read_failed',
          change: name,
          path: fp,
          message: 'unable to read open Change',
          hint: toErrorMessage(error),
        })
        reportRuntime({
          code: 'change_read_failed',
          operation: 'readFile',
          path: fp,
          message: toErrorMessage(error),
        })
      }

      try {
        const s = await stat(fp)
        ageDays = Math.floor((Date.now() - s.mtime.getTime()) / (1000 * 60 * 60 * 24))
      }
      catch (error) {
        diagnostics.push({
          severity: 'error',
          code: 'change_stat_failed',
          change: name,
          path: fp,
          message: 'unable to inspect open Change metadata',
          hint: toErrorMessage(error),
        })
        reportRuntime({
          code: 'change_stat_failed',
          operation: 'stat',
          path: fp,
          message: toErrorMessage(error),
        })
      }
    }
    else {
      kind = '(missing)'
      diagnostics.push({
        severity: 'error',
        code: 'focused_change_missing',
        change: name,
        path: focusedPaths.get(name)!,
        message: 'focus marker points to a missing Change file',
      })
      reportRuntime({
        code: 'focused_change_missing',
        operation: 'resolveChange',
        path: focusedPaths.get(name)!,
        message: 'focus marker points to a missing change file',
      })
    }

    const age = ageDays === null ? '—' : String(ageDays)
    records.push({ name, kind, progress, age, isFocused, isBlocked })
    outputRecords.push({
      name,
      kind,
      progress: { done, total },
      ageDays,
      isFocused,
      isBlocked,
      path: fp ? normalizeLogicalPath(fp) : null,
    })
  }

  const filteredRecords = records.filter((record) => {
    if (options.focused && !record.isFocused)
      return false
    if (options.blocked && !record.isBlocked)
      return false
    if (typeof options.stale === 'number') {
      const ageDays = Number(record.age)
      if (!Number.isFinite(ageDays) || ageDays < options.stale)
        return false
    }
    return true
  })

  const filteredOutputRecords = outputRecords.filter((record) => {
    if (options.focused && !record.isFocused)
      return false
    if (options.blocked && !record.isBlocked)
      return false
    if (typeof options.stale === 'number') {
      if (record.ageDays === null || record.ageDays < options.stale)
        return false
    }
    return true
  })

  const blockedCount = filteredOutputRecords.filter(r => r.isBlocked).length
  const ok = diagnostics.every(diagnostic => diagnostic.severity !== 'error')
  const nextActions = ok
    ? buildStatusNextActions(focusedSet.size, Object.keys(changeMap).sort(), Boolean(options.focused || options.blocked || typeof options.stale === 'number'))
    : ['Run: rsp doctor']
  const statusResult: StatusJsonShape = {
    command: 'status',
    ok,
    filters: {
      focused: Boolean(options.focused),
      blocked: Boolean(options.blocked),
      stale: typeof options.stale === 'number' ? options.stale : null,
    },
    focused: [...focusedSet].sort(),
    records: filteredOutputRecords,
    summary: {
      total: filteredOutputRecords.length,
      focused: filteredOutputRecords.filter(r => r.isFocused).length,
      blocked: blockedCount,
    },
    nextActions,
    archiveTrend: await readArchiveTrend(runtime, runOptions),
    diagnostics,
    runtime,
  }

  if (runOptions.json) {
    emitJson(statusResult)
    return statusResult
  }

  console.log()
  console.log(`  ${pc.bold('RSP status')}`)
  console.log()

  for (const diagnostic of diagnostics) {
    const label = diagnostic.change ?? diagnostic.path
    console.log(`  ${pc.red('✗')} ${label ? `${label} — ` : ''}${diagnostic.message}`)
  }
  if (diagnostics.length > 0)
    console.log()

  if (focusedSet.size > 0) {
    console.log(`  ${pc.cyan('Focused:')} ${[...focusedSet].join(', ')}`)
    console.log()
  }
  else {
    console.log(`  ${pc.dim('No focused change.')}`)
    for (const action of nextActions)
      console.log(`    ${pc.dim(action)}`)
    console.log()
  }

  if (allNames.length === 0) {
    if (ok)
      console.log(`  ${pc.dim('No changes found.')} Run: rsp create <name>\n`)
    else
      console.log(`  ${pc.dim('No executable changes can be shown until the work-tree issues are resolved.')}\n`)
    return statusResult
  }

  if (filteredRecords.length === 0) {
    console.log(`  ${pc.dim('No changes match the current filters.')}\n`)
    return statusResult
  }

  const pad = (s: string, w: number) => s.padEnd(w)
  console.log(`  ${pad('Change', COL_CHANGE)} ${pad('Kind', COL_KIND)} ${pad('Age(d)', COL_AGE)} ${pad('Progress', COL_PROGRESS)}`)
  console.log(`  ${'─'.repeat(COL_CHANGE)} ${'─'.repeat(COL_KIND)} ${'─'.repeat(COL_AGE)} ${'─'.repeat(COL_PROGRESS)}`)

  for (const r of filteredRecords) {
    const marker = r.isFocused ? pc.cyan('*') : ' '
    const namePadded = r.name.padEnd(COL_CHANGE - 1)
    const kindPadded = r.kind.padEnd(COL_KIND)
    const agePadded = r.age.padEnd(COL_AGE)
    const progressPadded = r.progress.padEnd(COL_PROGRESS)

    const nameDisplay = r.isBlocked ? pc.yellow(namePadded) : namePadded
    const ageDisplay = r.isFocused ? pc.cyan(agePadded) : agePadded

    console.log(`  ${marker}${nameDisplay} ${kindPadded} ${ageDisplay} ${progressPadded}`)
  }

  console.log()

  console.log(`  ${pc.bold('Summary:')} ${statusResult.summary.total} change(s), ${statusResult.summary.focused} focused, ${pc.yellow(String(statusResult.summary.blocked))} blocked`)
  console.log()

  printArchiveTrend(statusResult.archiveTrend)

  if (statusResult.summary.blocked > 0) {
    const blocked = filteredRecords.filter(r => r.isBlocked)
    console.log(`  ${pc.yellow('Blocked:')} ${blocked.map(r => r.name).join(', ')}`)
    console.log()
  }

  return statusResult
}

function buildStatusNextActions(focusedCount: number, openChanges: string[], filtered: boolean): string[] {
  if (focusedCount > 0)
    return []
  if (openChanges.length === 0)
    return ['Run: rsp create <name>']
  if (filtered) {
    return [
      'Run: rsp status',
      'Run: rsp focus <name>',
      'Or run: rsp create <name>',
    ]
  }
  const firstChanges = openChanges.slice(0, 3).join(', ')
  const extra = openChanges.length > 3 ? ` (+${openChanges.length - 3} more)` : ''
  return [
    `Open changes: ${firstChanges}${extra}`,
    `Run: rsp focus ${openChanges[0]}`,
    'Or run: rsp create <name>',
  ]
}

/** Display archive trend: count per month from archive INDEX.md. */
async function readArchiveTrend(runtime: RuntimeDiagnostic[], runOptions: CommandRunOptions): Promise<Array<{ month: string, count: number }>> {
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

    const months = Object.keys(counts).sort()
    if (months.length === 0)
      return []

    return months.map(month => ({ month, count: counts[month] }))
  }
  catch (error) {
    recordRuntimeDiagnostic(runtime, {
      code: 'archive_index_read_failed',
      operation: 'readFile',
      path: indexPath,
      message: toErrorMessage(error),
    }, Boolean(runOptions.verbose) && !runOptions.json)
    return []
  }
}

function printArchiveTrend(trend: Array<{ month: string, count: number }>) {
  if (trend.length === 0)
    return

  console.log(`  ${pc.bold('Archive trend:')}`)
  const bar = trend.map(({ month, count }) => pc.dim(`${month} ${'█'.repeat(Math.min(count, 20))} ${count}`)).join('\n  ')
  console.log(`  ${bar}`)
  console.log()
}
