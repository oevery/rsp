import type { ArchiveChangeResult } from '../../commands/archive.js'
import type { CreateChangeResult } from '../../commands/create.js'
import type { FocusResult } from '../../commands/focus.js'
import type { ChangeGroupResult } from '../../commands/group.js'
import type { ReadyResult } from '../../commands/ready.js'
import type { ReopenChangeResult } from '../../commands/reopen.js'
import { pc } from '../../core/config.js'
import { presentReady } from './inspection.js'

function presentFailure(result: { kind: 'usage' | 'error', message: string, candidates?: string[], remainingCandidates?: number }): void {
  const label = result.kind === 'usage' ? 'Usage:' : 'Error:'
  console.error(`  ${pc.red(label)} ${result.message}`)
  for (const candidate of result.candidates ?? [])
    console.error(`    ${candidate}`)
  if (result.remainingCandidates)
    console.error(`    ... ${result.remainingCandidates} more`)
}

export function presentCreate(result: CreateChangeResult): void {
  if (result.warning)
    console.warn(`  ${pc.yellow('Warning:')} ${result.warning}`)
  if (!result.ok)
    return presentFailure(result)
  const label = result.existed ? 'Using' : pc.green('Created')
  console.log(`  ${label}: ${result.changePath}`)
  if (result.existed)
    console.log(`  ${pc.dim('Unchanged focus.')} Run: rsp focus ${result.workRef}`)
  else
    console.log(`  ${pc.dim('focused via focus.d')} → ${result.workRef}`)
  console.log(`  ${pc.cyan('Next:')} fill proposal/spec/design first, then implement and complete the tasks\n`)
}

export function presentFocus(result: FocusResult): void {
  if (!result.ok) {
    if (result.kind === 'not-found')
      console.error(`  ${pc.red('Focus marker not found:')} ${result.message}`)
    else
      presentFailure({ kind: result.kind, message: result.message })
    return
  }
  const focused = result.action === 'focus'
  console.log(`  ${pc.green(focused ? 'Focused:' : 'Unfocused:')} ${result.workRef}`)
  console.log(`  ${pc.dim(focused ? 'focus.d' : 'focus.d cleared')} → ${result.workRef}`)
  console.log()
}

export function presentArchive(result: ArchiveChangeResult): void {
  if (!result.ok) {
    for (const warning of result.warnings ?? [])
      console.log(`  ${pc.yellow('⚠')} ${warning}`)
    if (result.kind === 'blocked')
      console.error(`  ${pc.red('Archive blocked:')} ${result.message}`)
    else
      presentFailure({ kind: result.kind, message: result.message })
    return
  }
  for (const warning of result.readinessWarnings)
    console.log(`  ${pc.yellow('⚠')} ${warning}`)
  if (result.readinessWarnings.length > 0)
    console.log(`  ${pc.dim('Archive will continue. Review the warnings above before treating this work as fully closed.')}\n`)
  const clearedMsg = result.focusCleared ? `  ${pc.dim('focus marker cleared')}\n` : ''
  console.log(`  ${pc.green('Archived:')} ${result.archiveName}\n${clearedMsg}`)
  for (const warning of result.cleanupWarnings)
    console.log(`  ${pc.yellow('⚠')} ${warning}`)
  if (result.cleanupWarnings.length > 0)
    console.log(`  ${pc.dim('Archive completed, but follow-up cleanup was only partially successful.')}\n`)
  if (result.git) {
    console.log(`  ${pc.cyan('Git delivery:')}\n`)
    console.log('    git status --short')
    console.log('    Inspect the complete archive transition; stage and commit only with separate Git authority.')
    console.log()
  }
}

export function presentArchiveDryRun(result: ReadyResult): void {
  console.error('  Deprecated: use `rsp ready <name>` for read-only archive readiness.')
  presentReady(result, { json: false, compact: false })
}

export function presentGroup(result: ChangeGroupResult): void {
  if (!result.ok)
    return presentFailure(result)
  if (result.action === 'create') {
    console.log(`  ${pc.green('Created Change Group:')} ${result.groupName}`)
    console.log(`  ${pc.dim('Unfocused Group Brief:')} ${result.path}`)
    console.log(`  ${pc.cyan('Next:')} fill the brief, then create direct child Changes with rsp create ${result.groupName}/<change>\n`)
  }
  else if (result.action === 'close') {
    console.log(`  ${pc.green('Closed Change Group:')} ${result.groupName}`)
    console.log(`  ${pc.dim('Archived Group Brief:')} ${result.archivePath}\n`)
    for (const warning of result.warnings)
      console.log(`  ${pc.yellow('⚠')} ${warning}`)
    if (result.warnings.length > 0)
      console.log(`  ${pc.yellow('Group close completed, but follow-up cleanup was only partially successful.')}\n`)
  }
  else {
    for (const warning of result.warnings)
      console.log(`  ${pc.yellow('⚠')} ${warning}`)
    console.log(`  ${pc.green('Reopened Change Group:')} ${result.groupName}`)
    console.log(`  ${pc.dim('retained archive')} → ${result.archivePath}`)
    console.log(`  ${pc.dim('unfocused Group Brief')} → ${result.path}`)
    console.log(`  ${pc.cyan('Next:')} run rsp reopen ${result.groupName}/<change> --reason <text> only for an incomplete archived child\n`)
  }
}

export function presentReopen(result: ReopenChangeResult): void {
  if (!result.ok)
    return presentFailure(result)
  console.log(`  ${pc.green('Reopened:')} ${result.workRef}`)
  console.log(`  ${pc.dim('retained archive')} → ${result.archivePath}`)
  console.log(`  ${pc.dim('focused via focus.d')} → ${result.workRef}`)
  console.log(`  ${pc.cyan('Next:')} refine the reopened Task and Verify evidence, then resolve the concern\n`)
  if (result.git) {
    console.log(`  ${pc.cyan('Git delivery:')}`)
    console.log('    git status --short')
    console.log('    Inspect the complete reopen transition; stage and commit only with separate Git authority.')
    console.log()
  }
}
