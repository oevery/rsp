import type { ChangeDependencyPlanOutput, ChangeGroupStatusOutput, RuntimeDiagnostic } from '../types.js'
import type { DependencyForestNode } from './dependency-forest.js'
import type { ProjectStatusView } from './model.js'
import { pc } from '../core/config.js'
import { projectDependencyForest } from './dependency-forest.js'

const COL_CHANGE = 32
const COL_KIND = 10
const COL_AGE = 7
const COL_PROGRESS = 10

export function printStatusRuntimeDiagnostics(runtime: RuntimeDiagnostic[]): void {
  for (const diagnostic of runtime)
    console.error(`  ${pc.dim(`[verbose] ${diagnostic.operation} ${diagnostic.path}: ${diagnostic.message}`)}`)
}

export function printStatusPlain(view: ProjectStatusView, options: { verbose?: boolean } = {}): void {
  console.log()
  console.log(`  ${pc.bold('RSP status')}`)
  console.log()
  if (options.verbose)
    console.log(`  ${pc.bold('Manage:')} activation ${view.manage.activation} · closeout ${view.manage.closeout}`)
  if (options.verbose && (view.language.artifacts !== null || view.language.commit !== null))
    console.log(`  ${pc.bold('Language:')} artifacts ${view.language.artifacts ?? 'unset'} · commit ${view.language.commit ?? 'unset'}`)
  if (options.verbose)
    console.log()

  for (const diagnostic of view.diagnostics) {
    const label = diagnostic.change ?? diagnostic.path
    console.log(`  ${pc.red('✗')} ${label ? `${label} — ` : ''}${diagnostic.message}`)
  }
  if (view.diagnostics.length > 0)
    console.log()

  if (view.focused.length > 0) {
    console.log(`  ${pc.cyan('Focused:')} ${view.focused.join(', ')}`)
    console.log()
  }
  else {
    console.log(`  ${pc.dim('No focused change.')}`)
    for (const action of view.nextActions)
      console.log(`    ${pc.dim(action)}`)
    console.log()
  }

  printChangeGroups(view.groups)
  if (options.verbose)
    printDependencyPlan(view.plan, view.records)

  if (!view.hasExecutableChanges) {
    if (view.ok)
      console.log(`  ${pc.dim('No executable changes found.')} ${view.groups.length === 0 ? 'Run: rsp create <name>' : 'Review the Change Group guidance above.'}\n`)
    else
      console.log(`  ${pc.dim('No executable changes can be shown until the work-tree issues are resolved.')}\n`)
    return
  }

  if (view.records.length === 0) {
    console.log(`  ${pc.dim('No changes match the current filters.')}\n`)
    return
  }

  if ((process.stdout.columns ?? 100) < 88 || view.records.some(record => record.output.name.length >= COL_CHANGE)) {
    for (const { output: record, progressKnown } of view.records) {
      const state = [record.isFocused ? 'focused' : 'open', record.isBlocked ? 'blocked' : null].filter(Boolean).join(' · ')
      console.log(`  ${pc.bold('Change:')} ${record.isBlocked ? pc.yellow(record.name) : record.name}`)
      if (record.summary)
        console.log(`    ${pc.dim(`Summary: ${record.summary}`)}`)
      console.log(`    ${state} · ${record.kind} · age ${record.ageDays ?? '—'}d · progress ${progressKnown ? `${record.progress.done}/${record.progress.total}` : '—'}`)
    }
  }
  else {
    const pad = (value: string, width: number) => value.padEnd(width)
    console.log(`  ${pad('Change', COL_CHANGE)} ${pad('Kind', COL_KIND)} ${pad('Age(d)', COL_AGE)} ${pad('Progress', COL_PROGRESS)}`)
    console.log(`  ${'─'.repeat(COL_CHANGE)} ${'─'.repeat(COL_KIND)} ${'─'.repeat(COL_AGE)} ${'─'.repeat(COL_PROGRESS)}`)

    for (const { output: record, progressKnown } of view.records) {
      const marker = record.isFocused ? pc.cyan('*') : ' '
      const namePadded = record.name.padEnd(COL_CHANGE - 1)
      const kindPadded = record.kind.padEnd(COL_KIND)
      const agePadded = (record.ageDays === null ? '—' : String(record.ageDays)).padEnd(COL_AGE)
      const progressPadded = (progressKnown ? `${record.progress.done}/${record.progress.total}` : '—').padEnd(COL_PROGRESS)
      const nameDisplay = record.isBlocked ? pc.yellow(namePadded) : namePadded
      const ageDisplay = record.isFocused ? pc.cyan(agePadded) : agePadded
      console.log(`  ${marker}${nameDisplay} ${kindPadded} ${ageDisplay} ${progressPadded}`)
      if (record.summary)
        console.log(`    ${pc.dim(`Summary: ${record.summary}`)}`)
    }
  }

  console.log()
  console.log(`  ${pc.bold('Summary:')} ${view.summary.total} change(s), ${view.summary.focused} focused, ${pc.yellow(String(view.summary.blocked))} blocked`)
  console.log(`  ${pc.dim('Next action:')} ${formatDependencyNextAction(view.plan, view.records)}`)
  console.log()
  if (options.verbose)
    printArchiveTrend(view.archiveTrend)
}

function printChangeGroups(groups: ChangeGroupStatusOutput[]): void {
  if (groups.length === 0)
    return
  console.log(`  ${pc.bold('Change Groups')}`)
  for (const group of groups) {
    const archived = group.slices.filter(slice => slice.state === 'archived').length
    const readiness = group.readyToClose ? pc.green('ready to close') : pc.dim('not ready')
    const blocked = group.blockers ? ` ${pc.yellow('blocked')}` : ''
    console.log(`  ${group.name}: ${archived}/${group.slices.length} archived, completion ${group.completion.done}/${group.completion.total}, ${readiness}${blocked}`)
    if (group.summary)
      console.log(`    ${pc.dim(`Summary: ${group.summary}`)}`)
  }
  console.log()
}

function printDependencyPlan(plan: ChangeDependencyPlanOutput, records: ProjectStatusView['records']): void {
  console.log(`  ${pc.bold('Dependency graph')}`)
  console.log(`  ${pc.dim('(parent requires children)')}`)
  const roots = projectDependencyForest(plan)
  const detailColumn = Math.max(40, ...plan.nodes.map(node => node.name.length + 8))
  const renderNode = (node: DependencyForestNode, prefix: string, last: boolean | null): void => {
    const connector = last === null ? '' : last ? '└── ' : '├── '
    const symbol = node.selection === 'selected' ? '◎' : node.state === 'ready' ? '●' : node.state === 'archived' ? '✓' : node.state === 'missing' || node.state === 'blocked' ? '!' : '○'
    const identity = `${prefix}${connector}${symbol} ${node.name}`.padEnd(detailColumn)
    const record = records.find(candidate => candidate.output.name === node.name)
    const ownership = node.selection === 'prerequisite' ? 'prerequisite' : record?.output.isFocused ? 'focused' : 'open'
    const state = node.state === 'archived' ? 'resolved' : node.state
    console.log(`  ${identity} ${ownership} · ${state}${node.shared ? ' · ↩ shared' : ''}${node.reason ? ` — ${node.reason}` : ''}`)
    const childPrefix = prefix + (last === null ? '' : last ? '    ' : '│   ')
    for (const [index, child] of node.children.entries())
      renderNode(child, childPrefix, index === node.children.length - 1)
  }
  if (roots.length === 0)
    console.log(`  ${pc.dim('none')}`)
  else
    roots.forEach(node => renderNode(node, '', null))
  const external = plan.blocked.filter(blocker => blocker.external).map(blocker => blocker.change)
  if (external.length > 0)
    console.log(`  ${pc.dim('External blockers:')} ${external.join(', ')}`)
  console.log(`  ${pc.dim('Legend:')} ◎ focused/open  ● ready  ○ waiting  ✓ resolved prerequisite  ! blocked`)
  console.log()
}

function formatDependencyNextAction(plan: ChangeDependencyPlanOutput, records: ProjectStatusView['records']): string {
  const implementationReady = plan.ready.filter((name) => {
    const record = records.find(candidate => candidate.output.name === name)
    return !record || record.readiness.incompleteTasks > 0 || record.readiness.incompleteRequiredVerify > 0
  })
  const completedReady = plan.ready.filter(name => !implementationReady.includes(name))
  if (implementationReady.length > 0)
    return implementationReady.join(', ')
  if (completedReady.length > 0)
    return `review for durable update/archive: ${completedReady.join(', ')}`
  return pc.dim('none')
}

function printArchiveTrend(trend: Array<{ month: string, count: number }>): void {
  if (trend.length === 0)
    return
  console.log(`  ${pc.bold('Archive trend:')}`)
  const bar = trend.map(({ month, count }) => pc.dim(`${month} ${'█'.repeat(Math.min(count, 20))} ${count}`)).join('\n  ')
  console.log(`  ${bar}`)
  console.log()
}
