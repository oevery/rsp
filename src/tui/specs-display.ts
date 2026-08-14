import type { SpecsDirectoryNode, SpecsDocumentKind, SpecsSearchMatch } from '../specs/model.js'
import type { SpecsTreeProjection } from '../specs/projection.js'
import { truncateDisplay } from './display.js'

export type SpecsRootKind = 'specs' | 'decision-records'

interface SpecsDisplayRowBase {
  key: string
  path: string
  depth: number
}

export interface SpecsRootDisplayRow extends SpecsDisplayRowBase {
  type: 'root'
  rootKind: SpecsRootKind
  label: string
  expanded: boolean
}

export interface SpecsDirectoryDisplayRow extends SpecsDisplayRowBase {
  type: 'directory'
  name: string
  expanded: boolean
}

export interface SpecsDocumentDisplayRow extends SpecsDisplayRowBase {
  type: 'document'
  title: string
  summary: string | null
  kind: SpecsDocumentKind
}

export type SpecsTreeDisplayRow = SpecsRootDisplayRow | SpecsDirectoryDisplayRow | SpecsDocumentDisplayRow

export interface SpecsRootLabels {
  specs: string
  decisionRecords: string
}

const DEFAULT_ROOT_LABELS: SpecsRootLabels = {
  specs: 'Specs',
  decisionRecords: 'Decision Records',
}

export function flattenSpecsTree(
  projection: SpecsTreeProjection,
  expandedDirectoryKeys: ReadonlySet<string>,
  labels: SpecsRootLabels = DEFAULT_ROOT_LABELS,
): SpecsTreeDisplayRow[] {
  return [
    ...flattenRoot('specs', labels.specs, projection.tree, expandedDirectoryKeys),
    ...flattenRoot('decision-records', labels.decisionRecords, projection.decisionRecords, expandedDirectoryKeys),
  ]
}

export function formatSpecsTreeRow(row: SpecsTreeDisplayRow, width: number): string {
  const boundedWidth = Math.max(1, width)
  const indent = '  '.repeat(row.depth)
  if (row.type === 'root' || row.type === 'directory') {
    const marker = row.expanded ? '▾' : '▸'
    const label = row.type === 'root' ? row.label : row.name
    return truncateDisplay(`${indent}${marker} ${label}`, boundedWidth)
  }

  const kind = row.kind === 'decision-record' ? 'decision' : 'spec'
  const summary = row.summary ? ` — ${row.summary}` : ''
  return truncateDisplay(`${indent}• ${row.title} [${kind}]${summary}`, boundedWidth)
}

export function formatSpecsSearchRow(match: SpecsSearchMatch, width: number): string {
  const heading = match.heading ? ` · ${match.heading}` : ''
  return truncateDisplay(
    `[${match.kind}] ${match.path}:${match.line}${heading} — ${match.excerpt}`,
    Math.max(1, width),
  )
}

function flattenRoot(
  rootKind: SpecsRootKind,
  label: string,
  node: SpecsDirectoryNode,
  expandedDirectoryKeys: ReadonlySet<string>,
): SpecsTreeDisplayRow[] {
  const expanded = expandedDirectoryKeys.has(node.path)
  const root: SpecsRootDisplayRow = {
    type: 'root',
    rootKind,
    label,
    key: node.path,
    path: node.path,
    depth: 0,
    expanded,
  }
  return expanded ? [root, ...flattenDirectoryContents(node, 1, expandedDirectoryKeys)] : [root]
}

function flattenDirectoryContents(
  node: SpecsDirectoryNode,
  depth: number,
  expandedDirectoryKeys: ReadonlySet<string>,
): SpecsTreeDisplayRow[] {
  const directories = node.directories.flatMap((directory) => {
    const expanded = expandedDirectoryKeys.has(directory.path)
    const row: SpecsDirectoryDisplayRow = {
      type: 'directory',
      name: directory.name,
      key: directory.path,
      path: directory.path,
      depth,
      expanded,
    }
    return expanded
      ? [row, ...flattenDirectoryContents(directory, depth + 1, expandedDirectoryKeys)]
      : [row]
  })
  const documents: SpecsDocumentDisplayRow[] = node.documents.map(document => ({
    type: 'document',
    key: document.path,
    path: document.path,
    depth,
    title: document.title,
    summary: document.summary,
    kind: document.kind,
  }))
  return [...directories, ...documents]
}
