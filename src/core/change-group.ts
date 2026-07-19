import type { ChangeGroupSliceOutput, ChangeGroupStatusOutput, CommandDiagnostic } from '../types.js'
import type { ArchiveTreeInspection, ExecutableWorkRef, FocusTreeInspection, GroupedChangeRef, ResolveWorkRefOptions, WorkTreeInspection } from './work-ref.js'
import { readFile } from 'node:fs/promises'
import { dirname, join, relative } from 'node:path'

import { ARCHIVES_DIR } from './config.js'
import { countCheckboxes, extractSection, hasMeaningfulBlockers, normalizeLogicalPath, parseFrontmatter } from './helpers.js'
import { inspectArchiveTree, inspectFocusTree, inspectWorkTree, resolveWorkRef, WorkRefError } from './work-ref.js'

export const GROUP_BRIEF_SECTIONS = ['Goal', 'Scope', 'Shared Constraints', 'Slices', 'Completion Conditions', 'Durable Outcomes', 'Blockers'] as const

export interface ChangeGroupInspection {
  groups: ChangeGroupStatusOutput[]
  diagnostics: CommandDiagnostic[]
}

/** Resolve one executable Change and enforce Group Brief ownership at the command seam. */
export async function resolveExecutableChange(name: string, options: Omit<ResolveWorkRefOptions, 'executable'> = {}): Promise<ExecutableWorkRef> {
  const ref = resolveWorkRef(name, { ...options, executable: true })
  if (ref.kind === 'group-change')
    await requireDeclaredGroupSlice(ref)
  return ref
}

/** Render the fixed single-file contract for one shallow Change Group. */
export function generateGroupBriefContent(name: string, goal = ''): string {
  return `---
kind: group
---

# Change Group: ${name}

## Goal
- ${goal || '<what shared outcome this group must deliver>'}

## Scope
- <what is coordinated by this group>

## Shared Constraints
- <constraint shared by every child Change>

## Slices
- \`${name}/<change>\`: <independently executable boundary>

## Completion Conditions
- [ ] <end-to-end condition beyond individual child verification>

## Durable Outcomes
- <stable fact, scoped instruction, or Decision Record target; use none when unnecessary>

## Blockers
- none
`
}

/** Derive Change Group projections from the authoritative brief and open child Changes. */
export async function inspectChangeGroups(options: { workTree?: WorkTreeInspection, archiveTree?: ArchiveTreeInspection, focusTree?: FocusTreeInspection } = {}): Promise<ChangeGroupInspection> {
  const workTree = options.workTree ?? await inspectWorkTree()
  const archiveTree = options.archiveTree ?? await inspectArchiveTree()
  const focusTree = options.focusTree ?? await inspectFocusTree()
  const diagnostics: CommandDiagnostic[] = []
  const groups: ChangeGroupStatusOutput[] = []
  const archivedSlicesByGroup = new Map<string, Set<string>>()
  const archivedGroups = new Set<string>()
  const openGroupNames = new Set(workTree.briefs.map(brief => brief.group))

  for (const path of archiveTree.files) {
    const archivePath = normalizeLogicalPath(relative(ARCHIVES_DIR, path))
    const archiveGroup = archivePath.includes('/') ? archivePath.split('/')[0] : null
    if (!archiveGroup || !openGroupNames.has(archiveGroup))
      continue
    try {
      const content = await readFile(path, 'utf-8')
      const heading = content.match(/^# Change:\s+(\S+)\s*$/m)
      if (heading?.[1]?.includes('/')) {
        const identity = heading[1]
        if (!new RegExp(`^${escapeRegExp(archiveGroup)}/[a-z0-9-]+$`).test(identity)) {
          diagnostics.push({
            severity: 'error',
            code: 'group_archive_identity_mismatch',
            change: archiveGroup,
            path,
            message: `archived Change identity ${identity} does not belong to archive group ${archiveGroup}`,
          })
        }
        else {
          const groupSlices = archivedSlicesByGroup.get(archiveGroup) ?? new Set<string>()
          groupSlices.add(identity)
          archivedSlicesByGroup.set(archiveGroup, groupSlices)
        }
      }
      if (new RegExp(`^# Change Group:\\s+${escapeRegExp(archiveGroup)}\\s*$`, 'm').test(content))
        archivedGroups.add(archiveGroup)
    }
    catch (error) {
      diagnostics.push({
        severity: 'error',
        code: 'group_archive_read_failed',
        change: archiveGroup,
        path,
        message: error instanceof Error ? error.message : String(error),
      })
    }
  }

  for (const brief of workTree.briefs) {
    let content: string
    try {
      content = await readFile(brief.path, 'utf-8')
    }
    catch (error) {
      diagnostics.push({
        severity: 'error',
        code: 'group_brief_read_failed',
        change: brief.group,
        path: brief.path,
        message: error instanceof Error ? error.message : String(error),
      })
      continue
    }

    const parsed = parseGroupBrief(brief.group, content)
    diagnostics.push(...parsed.diagnostics.map(diagnostic => ({ ...diagnostic, path: brief.path })))
    if (archivedGroups.has(brief.group)) {
      diagnostics.push({
        severity: 'error',
        code: 'group_identity_reopened',
        change: brief.group,
        path: brief.path,
        message: `archived Change Group cannot be reopened: ${brief.group}`,
      })
    }
    for (const diagnostic of archiveTree.diagnostics.filter((item) => {
      if (item.code === 'invalid_archive_root')
        return true
      const archivePath = normalizeLogicalPath(relative(ARCHIVES_DIR, item.path))
      return archivePath === brief.group || archivePath.startsWith(`${brief.group}/`)
    })) {
      diagnostics.push({
        severity: 'error',
        code: diagnostic.code,
        change: brief.group,
        path: diagnostic.path,
        message: diagnostic.message,
      })
    }
    for (const diagnostic of focusTree.diagnostics.filter(item => item.input.startsWith(`${brief.group}/`))) {
      diagnostics.push({
        severity: 'error',
        code: 'group_focus_invalid',
        change: brief.group,
        path: diagnostic.path,
        message: `invalid focus for ${diagnostic.input}: ${diagnostic.message}`,
      })
    }
    const openChildren = new Set(workTree.changes.filter(ref => ref.group === brief.group).map(ref => ref.name))
    const archivedSlices = archivedSlicesByGroup.get(brief.group) ?? new Set<string>()
    const slices: ChangeGroupSliceOutput[] = parsed.slices.map((slice) => {
      const state: ChangeGroupSliceOutput['state'] = openChildren.has(slice.name)
        ? 'open'
        : archivedSlices.has(slice.name)
          ? 'archived'
          : 'missing'
      return { ...slice, state }
    })
    const focusedNames = new Set(focusTree.markers.map(marker => marker.name))
    for (const slice of slices.filter(slice => slice.state !== 'open' && focusedNames.has(slice.name))) {
      diagnostics.push({
        severity: 'error',
        code: 'group_focus_invalid',
        change: brief.group,
        path: focusTree.markers.find(marker => marker.name === slice.name)?.path,
        message: `invalid focus for ${slice.name}: focused group slice is not open`,
      })
    }
    const declared = new Set(slices.map(slice => slice.name))
    for (const child of [...openChildren].filter(name => !declared.has(name)).sort()) {
      diagnostics.push({
        severity: 'error',
        code: 'group_child_undeclared',
        change: brief.group,
        path: brief.path,
        message: `open child Change is not declared by the Group Brief: ${child}`,
      })
    }
    for (const child of [...archivedSlices].filter(name => !declared.has(name)).sort()) {
      diagnostics.push({
        severity: 'error',
        code: 'group_archived_child_undeclared',
        change: brief.group,
        path: brief.path,
        message: `archived child Change is not declared by the Group Brief: ${child}`,
      })
    }
    for (const slice of slices.filter(slice => slice.state === 'missing')) {
      diagnostics.push({
        severity: 'error',
        code: 'group_slice_missing',
        change: brief.group,
        path: brief.path,
        message: `declared group slice is neither open nor archived: ${slice.name}`,
      })
    }

    const warnings = parsed.diagnostics.filter(diagnostic => diagnostic.severity === 'warning').map(diagnostic => diagnostic.message)
    const readyToClose = diagnostics.every(diagnostic => diagnostic.change !== brief.group || diagnostic.severity !== 'error')
      && slices.length >= 2
      && slices.every(slice => slice.state === 'archived')
      && parsed.completion.total > 0
      && parsed.completion.done === parsed.completion.total
      && !parsed.blockers

    groups.push({
      name: brief.group,
      path: normalizeLogicalPath(brief.path),
      slices,
      completion: parsed.completion,
      blockers: parsed.blockers,
      readyToClose,
      warnings,
    })
  }

  groups.sort((left, right) => left.name.localeCompare(right.name))
  return { groups, diagnostics }
}

/** Require a grouped Change identity to be declared by its sibling Group Brief. */
export async function requireDeclaredGroupSlice(ref: GroupedChangeRef): Promise<void> {
  const briefPath = join(dirname(ref.path), 'brief.md')
  let content: string
  try {
    content = await readFile(briefPath, 'utf-8')
  }
  catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    throw new WorkRefError('work_tree_read_failed', `unable to read Group Brief ${briefPath}: ${message}`, ref.name)
  }
  const parsed = parseGroupBrief(ref.group, content)
  const errors = parsed.diagnostics.filter(diagnostic => diagnostic.severity === 'error')
  if (errors.length > 0) {
    throw new WorkRefError(
      'invalid_group_brief',
      `Change Group "${ref.group}" brief is invalid: ${errors.map(error => error.message).join('; ')}`,
      ref.name,
    )
  }
  if (!parsed.slices.some(slice => slice.name === ref.name)) {
    throw new WorkRefError(
      'group_child_undeclared',
      `grouped Change is not declared by ${ref.group}/brief: ${ref.name}`,
      ref.name,
    )
  }
}

/** Return whether the one-way Group lifecycle already archived this identity. */
export async function hasArchivedGroupBrief(group: string): Promise<boolean> {
  const archiveTree = await inspectArchiveTree()
  if (archiveTree.diagnostics.length > 0) {
    const diagnostic = archiveTree.diagnostics[0]
    throw new WorkRefError(diagnostic.code, diagnostic.message, diagnostic.input)
  }
  const groupPrefix = `${group}/`
  for (const path of archiveTree.files) {
    if (!normalizeLogicalPath(relative(ARCHIVES_DIR, path)).startsWith(groupPrefix))
      continue
    let content: string
    try {
      content = await readFile(path, 'utf-8')
    }
    catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      throw new WorkRefError('work_tree_read_failed', `unable to inspect archived Change Group identity at ${path}: ${message}`, group)
    }
    if (new RegExp(`^# Change Group:\\s+${escapeRegExp(group)}\\s*$`, 'm').test(content))
      return true
  }
  return false
}

function parseGroupBrief(group: string, content: string): {
  slices: Array<{ name: string, boundary: string }>
  completion: { done: number, total: number }
  blockers: boolean
  diagnostics: CommandDiagnostic[]
} {
  const diagnostics: CommandDiagnostic[] = []
  let frontmatter
  try {
    frontmatter = parseFrontmatter(content)
  }
  catch (error) {
    diagnostics.push({ severity: 'error', code: 'group_frontmatter_invalid', change: group, message: error instanceof Error ? error.message : String(error) })
  }
  if (frontmatter?.kind !== 'group')
    diagnostics.push({ severity: 'error', code: 'group_kind_invalid', change: group, message: 'Group Brief frontmatter must declare kind: group' })
  if (!new RegExp(`^# Change Group:\\s+${escapeRegExp(group)}\\s*$`, 'm').test(content))
    diagnostics.push({ severity: 'error', code: 'group_heading_mismatch', change: group, message: `Group Brief heading must be: # Change Group: ${group}` })

  for (const section of GROUP_BRIEF_SECTIONS) {
    if (!extractSection(content, section))
      diagnostics.push({ severity: 'error', code: 'group_section_missing', change: group, message: `Group Brief missing required section: ${section}` })
  }

  const slices: Array<{ name: string, boundary: string }> = []
  const seen = new Set<string>()
  for (const line of extractSection(content, 'Slices').split('\n')) {
    const trimmed = line.trim()
    const identity = trimmed.match(/^-\s+`(\S+)`/)
    if (!identity || identity[1].includes('<'))
      continue
    const suffix = trimmed.slice(identity[0].length).trim()
    if (![':', '—', '-'].includes(suffix[0])) {
      diagnostics.push({ severity: 'error', code: 'group_slice_invalid', change: group, message: `group slice requires an identity and boundary: ${trimmed}` })
      continue
    }
    const name = identity[1]
    const boundary = suffix.slice(1).trim()
    if (!boundary) {
      diagnostics.push({ severity: 'error', code: 'group_slice_invalid', change: group, message: `group slice requires a boundary: ${name}` })
      continue
    }
    if (!new RegExp(`^${escapeRegExp(group)}/[a-z0-9-]+$`).test(name) || name === `${group}/brief`) {
      diagnostics.push({ severity: 'error', code: 'group_slice_invalid', change: group, message: `invalid direct child identity in Group Brief: ${name}` })
      continue
    }
    if (seen.has(name)) {
      diagnostics.push({ severity: 'error', code: 'group_slice_duplicate', change: group, message: `duplicate group slice: ${name}` })
      continue
    }
    seen.add(name)
    slices.push({ name, boundary: boundary.trim() })
  }
  if (slices.length < 2)
    diagnostics.push({ severity: 'warning', code: 'group_slices_incomplete', change: group, message: 'Change Group must declare at least two direct child slices' })

  const completion = countCheckboxes(extractSection(content, 'Completion Conditions'))
  if (completion.total === 0)
    diagnostics.push({ severity: 'warning', code: 'group_completion_missing', change: group, message: 'Change Group must declare at least one completion condition' })

  return {
    slices,
    completion: { done: completion.done + completion.dropped, total: completion.total },
    blockers: hasMeaningfulBlockers(content),
    diagnostics,
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
