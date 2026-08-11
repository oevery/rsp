import type {
  WebMarkdownBlock,
  WebMarkdownInline,
  WebMarkdownListItem,
  WebMarkdownProjection,
} from './model.js'
import type { WebRedactionContext } from './redaction.js'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { redactWebText } from './redaction.js'

const MAX_NESTING_DEPTH = 8
const MAX_LINK_CODE_POINTS = 1000
const SIMPLE_METAVARIABLES = new Set(['reason'])

type UnsupportedReason = 'html' | 'image' | 'unsafe-link' | 'syntax'

interface MarkdownNode {
  type: string
  value?: unknown
  depth?: unknown
  ordered?: unknown
  start?: unknown
  url?: unknown
  title?: unknown
  identifier?: unknown
  alt?: unknown
  lang?: unknown
  children?: unknown
}

interface MarkdownDefinition {
  url: string
  title: string | null
}

interface ProjectionState {
  bounded: boolean
  unsupported: boolean
  definitions: Map<string, MarkdownDefinition>
  context: WebRedactionContext
}

export function projectSafeMarkdown(
  source: string,
  context: WebRedactionContext = {},
): WebMarkdownProjection {
  const root = fromMarkdown(markdownBody(source)) as unknown as MarkdownNode
  const state: ProjectionState = {
    bounded: false,
    unsupported: false,
    definitions: collectDefinitions(root, context),
    context,
  }
  return {
    blocks: projectBlocks(childrenOf(root), 0, state),
    bounded: state.bounded,
    unsupported: state.unsupported,
  }
}

function projectBlocks(nodes: MarkdownNode[], depth: number, state: ProjectionState): WebMarkdownBlock[] {
  const blocks: WebMarkdownBlock[] = []
  for (const node of nodes) {
    if (node.type === 'definition')
      continue
    if (depth > MAX_NESTING_DEPTH) {
      state.bounded = true
      blocks.push(unsupportedBlock('syntax', state))
      break
    }
    const block = projectBlock(node, depth, state)
    if (block)
      blocks.push(block)
  }
  return blocks
}

function projectBlock(node: MarkdownNode, depth: number, state: ProjectionState): WebMarkdownBlock | null {
  switch (node.type) {
    case 'heading':
      return {
        type: 'heading',
        depth: boundedHeadingDepth(node.depth),
        children: projectInlines(childrenOf(node), depth, state),
      }
    case 'paragraph':
      return {
        type: 'paragraph',
        children: projectInlines(childrenOf(node), depth, state),
      }
    case 'list':
      return {
        type: 'list',
        ordered: node.ordered === true,
        start: Number.isSafeInteger(node.start) ? Number(node.start) : null,
        items: childrenOf(node).map(item => projectListItem(item, depth + 1, state)),
      }
    case 'blockquote':
      return {
        type: 'blockquote',
        blocks: projectBlocks(childrenOf(node), depth + 1, state),
      }
    case 'code':
      return {
        type: 'code',
        language: boundedOptionalText(node.lang, 80, state.context),
        value: redactWebText(stringValue(node.value), state.context),
      }
    case 'thematicBreak':
      return { type: 'thematic-break' }
    case 'html': {
      const metavariable = markdownMetavariable(node.value)
      if (metavariable) {
        return {
          type: 'paragraph',
          children: [{ type: 'inline-code', value: metavariable }],
        }
      }
      return unsupportedBlock('html', state)
    }
    case 'image':
    case 'imageReference':
      return unsupportedBlock('image', state)
    default:
      return unsupportedBlock('syntax', state)
  }
}

function projectListItem(node: MarkdownNode, depth: number, state: ProjectionState): WebMarkdownListItem {
  if (depth > MAX_NESTING_DEPTH) {
    state.bounded = true
    return {
      checked: null,
      blocks: [unsupportedBlock('syntax', state)],
    }
  }
  const blocks = projectBlocks(childrenOf(node), depth, state)
  return {
    checked: extractTaskMarker(blocks),
    blocks,
  }
}

function projectInlines(nodes: MarkdownNode[], depth: number, state: ProjectionState): WebMarkdownInline[] {
  const inlines: WebMarkdownInline[] = []
  for (const node of nodes) {
    if (depth > MAX_NESTING_DEPTH) {
      state.bounded = true
      inlines.push(unsupportedInline('syntax', [], state))
      break
    }
    const inline = projectInline(node, depth, state)
    if (inline)
      inlines.push(inline)
  }
  return inlines
}

function projectInline(node: MarkdownNode, depth: number, state: ProjectionState): WebMarkdownInline | null {
  switch (node.type) {
    case 'text':
      return { type: 'text', value: redactWebText(stringValue(node.value), state.context) }
    case 'emphasis':
      return { type: 'emphasis', children: projectInlines(childrenOf(node), depth + 1, state) }
    case 'strong':
      return { type: 'strong', children: projectInlines(childrenOf(node), depth + 1, state) }
    case 'inlineCode':
      return { type: 'inline-code', value: redactWebText(stringValue(node.value), state.context) }
    case 'break':
      return { type: 'break' }
    case 'link':
      return projectLink(node, depth, state)
    case 'linkReference': {
      const definition = state.definitions.get(normalizeIdentifier(node.identifier))
      return definition
        ? projectLink({ ...node, url: definition.url, title: definition.title }, depth, state)
        : unsupportedInline('syntax', projectInlines(childrenOf(node), depth + 1, state), state)
    }
    case 'html': {
      const metavariable = markdownMetavariable(node.value)
      if (metavariable)
        return { type: 'inline-code', value: metavariable }
      return unsupportedInline('html', [], state)
    }
    case 'image':
    case 'imageReference': {
      const alt = boundedOptionalText(node.alt, 300, state.context)
      return unsupportedInline('image', alt ? [{ type: 'text', value: alt }] : [], state)
    }
    default:
      return unsupportedInline('syntax', projectInlines(childrenOf(node), depth + 1, state), state)
  }
}

function projectLink(node: MarkdownNode, depth: number, state: ProjectionState): WebMarkdownInline {
  const children = projectInlines(childrenOf(node), depth + 1, state)
  const href = safeLink(node.url, state.context)
  if (!href)
    return unsupportedInline('unsafe-link', children, state)
  return {
    type: 'link',
    href,
    title: boundedOptionalText(node.title, 300, state.context),
    children,
  }
}

function safeLink(value: unknown, context: WebRedactionContext): string | null {
  if (typeof value !== 'string')
    return null
  const candidate = value.trim()
  if (redactWebText(candidate, context) !== candidate)
    return null
  const href = sliceCodePoints(candidate, MAX_LINK_CODE_POINTS)
  if (!href || href !== candidate || hasControlCharacter(href))
    return null
  try {
    const parsed = new URL(href)
    if (!['http:', 'https:', 'mailto:'].includes(parsed.protocol))
      return null
    if ((parsed.protocol === 'http:' || parsed.protocol === 'https:') && (parsed.username || parsed.password))
      return null
    return href
  }
  catch {
    return null
  }
}

function collectDefinitions(
  root: MarkdownNode,
  context: WebRedactionContext,
): Map<string, MarkdownDefinition> {
  const definitions = new Map<string, MarkdownDefinition>()
  for (const node of childrenOf(root)) {
    if (node.type !== 'definition')
      continue
    const identifier = normalizeIdentifier(node.identifier)
    const url = typeof node.url === 'string' ? node.url : ''
    if (identifier && url) {
      definitions.set(identifier, {
        url,
        title: boundedOptionalText(node.title, 300, context),
      })
    }
  }
  return definitions
}

function extractTaskMarker(blocks: WebMarkdownBlock[]): boolean | null {
  const first = blocks[0]
  if (first?.type !== 'paragraph')
    return null
  const text = first.children[0]
  if (text?.type !== 'text')
    return null
  const marker = /^\[([ x])\]\s+/iu.exec(text.value)
  if (!marker)
    return null
  text.value = text.value.slice(marker[0].length)
  return marker[1]?.toLowerCase() === 'x'
}

function unsupportedBlock(reason: UnsupportedReason, state: ProjectionState): WebMarkdownBlock {
  state.unsupported = true
  return { type: 'unsupported', reason }
}

function unsupportedInline(
  reason: UnsupportedReason,
  children: WebMarkdownInline[],
  state: ProjectionState,
): WebMarkdownInline {
  state.unsupported = true
  return { type: 'unsupported', reason, children }
}

function childrenOf(node: MarkdownNode): MarkdownNode[] {
  return Array.isArray(node.children) ? node.children as MarkdownNode[] : []
}

function boundedHeadingDepth(value: unknown): 1 | 2 | 3 | 4 | 5 | 6 {
  return Number.isSafeInteger(value) && Number(value) >= 1 && Number(value) <= 6
    ? Number(value) as 1 | 2 | 3 | 4 | 5 | 6
    : 1
}

function boundedOptionalText(
  value: unknown,
  limit: number,
  context: WebRedactionContext,
): string | null {
  if (typeof value !== 'string' || value.length === 0)
    return null
  return sliceCodePoints(redactWebText(value, context), limit)
}

function stringValue(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function normalizeIdentifier(value: unknown): string {
  return typeof value === 'string' ? value.trim().toLowerCase() : ''
}

function sliceCodePoints(value: string, limit: number): string {
  return [...value].slice(0, limit).join('')
}

function hasControlCharacter(value: string): boolean {
  return [...value].some((character) => {
    const codePoint = character.codePointAt(0) ?? 0
    return codePoint <= 0x1F || codePoint === 0x7F
  })
}

function markdownBody(source: string): string {
  const frontmatter = source.match(/^---\r?\n[\s\S]*?\r?\n(?:---|\.\.\.)(?:\r?\n|$)/u)
  return frontmatter ? source.slice(frontmatter[0].length) : source
}

function markdownMetavariable(value: unknown): string | null {
  if (typeof value !== 'string')
    return null
  const match = /^<([a-z][a-z0-9]*(?:-[a-z0-9]+)*)>$/u.exec(value)
  if (!match)
    return null
  const name = match[1]!
  return name.includes('-') || SIMPLE_METAVARIABLES.has(name) ? value : null
}
