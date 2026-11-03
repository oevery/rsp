import type { MarkdownInput } from '../core/markdown.mjs'
import { createHash } from 'node:crypto'
import { realpath } from 'node:fs/promises'
import { isAbsolute, relative, resolve } from 'node:path'
import { inspectRspConfig } from '../core/config.js'
import { markdownText, parseMarkdown, walkMarkdown } from '../core/markdown.mjs'
import { readCurrentDocument } from '../specs/query.js'
import { selectArchitecture } from './selection.js'

export { selectArchitecture } from './selection.js'

export interface ArchitectureNode { id: string, title: string, description: string, parent?: string }
export interface ArchitectureRelation { id: string, source: string, target: string, type: string, description: string }
export interface ArchitectureView { id: string, title: string, node: string, include: string[] }
export interface ArchitectureBinding { node: string, file: string, headings?: string[], scope: 'node' | 'subtree' }
export interface ArchitectureModel { schemaVersion: 1, nodes: ArchitectureNode[], relations: ArchitectureRelation[], views: ArchitectureView[], bindings: ArchitectureBinding[] }
export interface Heading { title: string, depth: number, anchor: string, hierarchy: string[] }
export interface BindingReference extends ArchitectureBinding { origin: string, inherited: boolean, anchor?: string }
export interface ArchitectureResult {
  configured: boolean
  source: { root: string, file: string, revision: string }
  selection: { kind: 'full' | 'node' | 'view', id?: string }
  nodes: (ArchitectureNode & { boundary: boolean, bindings: BindingReference[] })[]
  relations: ArchitectureRelation[]
  views: ArchitectureView[]
  documents: string[]
  diagnostics: { code: string, message: string, file?: string }[]
}
export const ARCHITECTURE_FILE = '.rsp/architecture.json'
export const MAX_CONTENT_BYTES = 16 * 1024 * 1024
export const digest = (value: string | Uint8Array) => createHash('sha256').update(value).digest('hex')

export function projectPath(file: string): string {
  if (!file || isAbsolute(file) || file.includes('\\') || file.split('/').some(part => !part || part === '.' || part === '..') || file.includes('\0'))
    throw new Error(`Unsafe project-relative path: ${file}`)
  if (file.split('/').some(part => part === '.git' || part === 'node_modules'))
    throw new Error(`Private/runtime path is not readable: ${file}`)
  return file
}

export async function readProjectFile(root: string, file: string): Promise<string> {
  projectPath(file)
  return (await readCurrentDocument(resolve(root, file), root, file, MAX_CONTENT_BYTES)).content
}

function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Architecture entries must be objects')
  return value as Record<string, unknown>
}
function text(value: unknown, field: string): string {
  if (typeof value !== 'string' || !value.trim())
    throw new Error(`Architecture ${field} must be a non-empty string`)
  return value
}
function strings(value: unknown, field: string): string[] {
  if (!Array.isArray(value))
    throw new Error(`Architecture ${field} must be an array`)
  return value.map(item => text(item, field))
}
function collection(value: unknown, field: string): Record<string, unknown>[] {
  if (!Array.isArray(value))
    throw new Error(`Architecture ${field} must be an array`)
  return value.map(object)
}
function unique(items: { id: string }[], field: string) {
  if (new Set(items.map(item => item.id)).size !== items.length)
    throw new Error(`Duplicate architecture ${field} identity`)
}
export function parseArchitecture(content: string): ArchitectureModel {
  const value = object(JSON.parse(content))
  if (value.schemaVersion !== 1)
    throw new Error(`Unsupported architecture schemaVersion: ${String(value.schemaVersion)}`)
  const nodes = collection(value.nodes, 'nodes').map(node => ({ id: text(node.id, 'node.id'), title: text(node.title, 'node.title'), description: text(node.description, 'node.description'), ...(node.parent === undefined ? {} : { parent: text(node.parent, 'node.parent') }) }))
  const relations = collection(value.relations, 'relations').map(edge => ({ id: text(edge.id, 'relation.id'), source: text(edge.source, 'relation.source'), target: text(edge.target, 'relation.target'), type: text(edge.type, 'relation.type'), description: text(edge.description, 'relation.description') }))
  const views = collection(value.views, 'views').map(view => ({ id: text(view.id, 'view.id'), title: text(view.title, 'view.title'), node: text(view.node, 'view.node'), include: strings(view.include, 'view.include') }))
  const bindings = collection(value.bindings, 'bindings').map((binding): ArchitectureBinding => {
    const file = projectPath(text(binding.file, 'binding.file'))
    if (!/\.md$/i.test(file))
      throw new Error('Architecture bindings must reference Markdown files')
    const scope = binding.scope ?? 'node'
    if (scope !== 'node' && scope !== 'subtree')
      throw new Error('Architecture binding.scope must be node or subtree')
    const headings = binding.headings === undefined ? undefined : strings(binding.headings, 'binding.headings')
    if (headings?.length === 0)
      throw new Error('Omit headings for a whole-file binding')
    return { node: text(binding.node, 'binding.node'), file, ...(headings ? { headings } : {}), scope }
  })
  unique(nodes, 'node')
  unique(relations, 'relation')
  unique(views, 'view')
  const ids = new Set(nodes.map(node => node.id))
  const requireNode = (id: string) => {
    if (!ids.has(id))
      throw new Error(`Missing architecture node: ${id}`)
  }
  for (const node of nodes) {
    const visited = new Set([node.id])
    let parent = node.parent
    while (parent !== undefined) {
      requireNode(parent)
      if (visited.has(parent))
        throw new Error(`Architecture hierarchy cycle: ${parent}`)
      visited.add(parent)
      parent = nodes.find(node => node.id === parent)!.parent
    }
  }
  relations.forEach((edge) => {
    requireNode(edge.source)
    requireNode(edge.target)
  })
  views.forEach((view) => {
    requireNode(view.node)
    view.include.forEach(requireNode)
  })
  bindings.forEach(binding => requireNode(binding.node))
  return { schemaVersion: 1, nodes, relations, views, bindings }
}

export function documentHeadings(content: MarkdownInput): Heading[] {
  const result: Heading[] = []
  const stack: { title: string, depth: number }[] = []
  const counts = new Map<string, number>()
  const anchors = new Set<string>()
  walkMarkdown(parseMarkdown(content).root, (node) => {
    if (node.type !== 'heading')
      return
    const title = markdownText(node)
    while (stack.length && stack.at(-1)!.depth >= node.depth) stack.pop()
    stack.push({ title, depth: node.depth })
    const base = title.toLowerCase().replace(/[^\p{L}\p{N}\s_-]/gu, '').replace(/\s/g, '-') || 'section'
    let count = counts.get(base) ?? 0
    let anchor = count ? `${base}-${count}` : base
    while (anchors.has(anchor)) anchor = `${base}-${++count}`
    counts.set(base, count + 1)
    anchors.add(anchor)
    result.push({ title, depth: node.depth, anchor, hierarchy: stack.map(item => item.title) })
  })
  return result
}
export function resolveHeading(headings: Heading[], hierarchy: string[]): Heading {
  const matches = headings.filter(heading => hierarchy.length <= heading.hierarchy.length && hierarchy.every((title, i) => title === heading.hierarchy[heading.hierarchy.length - hierarchy.length + i]))
  if (matches.length !== 1)
    throw new Error(`${matches.length ? 'Ambiguous' : 'Missing'} chapter: ${hierarchy.join(' > ')}`)
  return matches[0]!
}

export async function queryArchitecture(options: { root?: string, node?: string, view?: string } = {}): Promise<ArchitectureResult> {
  if (options.node !== undefined && !options.node.trim())
    throw new Error('--node requires a non-empty ID')
  if (options.view !== undefined && !options.view.trim())
    throw new Error('--view requires a non-empty ID')
  if (options.node && options.view)
    throw new Error('--node and --view are mutually exclusive')
  const root = await realpath(resolve(options.root ?? process.cwd()))
  const config = await inspectRspConfig(root)
  if (config.issues.length)
    throw new Error(config.issues.join('; '))
  let content: string
  try {
    content = await readProjectFile(root, ARCHITECTURE_FILE)
  }
  catch (error) {
    // Only absence of the fixed artifact is a not-configured result.
    const { lstat } = await import('node:fs/promises')
    try {
      await lstat(resolve(root, ARCHITECTURE_FILE))
    }
    catch (missing) {
      if ((missing as NodeJS.ErrnoException).code === 'ENOENT')
        return { configured: false, source: { root, file: ARCHITECTURE_FILE, revision: '' }, selection: { kind: 'full' }, nodes: [], relations: [], views: [], documents: [], diagnostics: [{ code: 'not_configured', message: `Architecture is not configured: ${ARCHITECTURE_FILE}` }] }
    }
    throw error
  }
  const model = parseArchitecture(content)
  const selection: ArchitectureResult['selection'] = options.node ? { kind: 'node', id: options.node } : options.view ? { kind: 'view', id: options.view } : { kind: 'full' }
  const { selected, visible, relations } = selectArchitecture(model, selection)
  const diagnostics: ArchitectureResult['diagnostics'] = []
  const chapterMaps = new Map<string, Heading[]>()
  const sourceInputs = [content, JSON.stringify(config.config)]
  for (const file of new Set(model.bindings.map(binding => binding.file))) {
    try {
      const body = await readProjectFile(root, file)
      chapterMaps.set(file, documentHeadings(body))
      sourceInputs.push(file, body)
    }
    catch (error) {
      diagnostics.push({ code: 'document_unavailable', file, message: (error as Error).message })
    }
  }
  const nodes = model.nodes.filter(node => visible.has(node.id)).map((node) => {
    const ancestors = new Set<string>()
    let parent = node.parent
    while (parent) {
      ancestors.add(parent)
      parent = model.nodes.find(node => node.id === parent)?.parent
    }
    const bindings = model.bindings.filter(binding => binding.node === node.id || (binding.scope === 'subtree' && ancestors.has(binding.node))).map((binding): BindingReference => {
      const reference = { ...binding, origin: binding.node, inherited: binding.node !== node.id }
      if (!binding.headings || !chapterMaps.has(binding.file))
        return reference
      try {
        return { ...reference, anchor: resolveHeading(chapterMaps.get(binding.file)!, binding.headings).anchor }
      }
      catch (error) {
        diagnostics.push({ code: 'chapter_unresolved', file: binding.file, message: (error as Error).message })
        return reference
      }
    })
    return { ...node, boundary: !selected.has(node.id), bindings }
  })
  return { configured: true, source: { root, file: ARCHITECTURE_FILE, revision: digest(sourceInputs.join('\0')) }, selection, nodes, relations, views: model.views.filter(view => selection.kind === 'full' || view.id === options.view || selected.has(view.node)), documents: [...new Set(nodes.flatMap(node => node.bindings.map(binding => binding.file)))], diagnostics }
}

export function isWithin(root: string, target: string): boolean {
  const path = relative(root, target)
  return path !== '..' && !path.startsWith('../') && !isAbsolute(path)
}
