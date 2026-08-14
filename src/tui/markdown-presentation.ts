import type { List, ListItem, PhrasingContent, RootContent } from 'mdast'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { gfmFromMarkdown } from 'mdast-util-gfm'
import { gfm } from 'micromark-extension-gfm'
import { displayWidth } from './display.js'

export interface MarkdownSpan {
  text: string
  bold?: boolean
  italic?: boolean
  underline?: boolean
  dim?: boolean
  code?: boolean
  color?: 'cyan' | 'yellow' | 'gray'
}

export interface MarkdownLine {
  spans: MarkdownSpan[]
}

export interface MarkdownViewport {
  lines: MarkdownLine[]
  start: number
  end: number
  total: number
  hasPrevious: boolean
  hasNext: boolean
}

type SpanStyle = Omit<MarkdownSpan, 'text'>

const EMPTY_LINE: MarkdownLine = { spans: [{ text: '' }] }
const graphemeSegmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })

export function markdownLineText(line: MarkdownLine): string {
  return line.spans.map(span => span.text).join('')
}

export function projectMarkdownLines(content: string, width: number): MarkdownLine[] {
  const root = fromMarkdown(sanitizeMarkdown(stripFrontmatter(content)), { extensions: [gfm()], mdastExtensions: [gfmFromMarkdown()] })
  const logical: MarkdownLine[] = []
  root.children.forEach((node, index) => {
    if (index > 0 && logical.length > 0 && markdownLineText(logical.at(-1)!) !== '')
      logical.push(EMPTY_LINE)
    logical.push(...projectBlock(node, 0, Math.max(1, width)))
  })
  if (logical.length === 0)
    logical.push(EMPTY_LINE)
  return logical.flatMap(line => wrapStyledLine(line, Math.max(1, width)))
}

export function projectMarkdownViewport(
  content: string,
  options: { width: number, height: number, offset?: number },
): MarkdownViewport {
  const lines = projectMarkdownLines(content, options.width)
  return projectMarkdownLineViewport(lines, options)
}

export function projectMarkdownLineViewport(
  lines: MarkdownLine[],
  options: { height: number, offset?: number },
): MarkdownViewport {
  const capacity = Math.max(0, options.height)
  const maxStart = Math.max(0, lines.length - capacity)
  const start = Math.min(Math.max(0, options.offset ?? 0), maxStart)
  const visible = lines.slice(start, start + capacity)
  const end = start + visible.length
  return {
    lines: visible,
    start,
    end,
    total: lines.length,
    hasPrevious: start > 0,
    hasNext: end < lines.length,
  }
}

function stripFrontmatter(content: string): string {
  return content.replace(/^---\r?\n[\s\S]*?\r?\n(?:---|\.\.\.)\r?\n/u, '')
}

function sanitizeMarkdown(value: string): string {
  let result = ''
  for (let index = 0; index < value.length; index++) {
    const code = value.charCodeAt(index)
    if (code === 27 && value[index + 1] === '[') {
      index += 2
      while (index < value.length) {
        const sequenceCode = value.charCodeAt(index)
        if (sequenceCode >= 64 && sequenceCode <= 126)
          break
        index++
      }
      continue
    }
    if ((code < 32 && code !== 9 && code !== 10 && code !== 13) || code === 127)
      continue
    result += code === 9 ? '  ' : value[index]
  }
  return result
}

function projectBlock(node: RootContent, depth: number, width: number): MarkdownLine[] {
  switch (node.type) {
    case 'heading': {
      const marker = node.depth === 1 ? '◆ ' : node.depth === 2 ? '◇ ' : '• '
      return inlineLines(node.children, { bold: true, color: 'cyan' }, marker)
    }
    case 'paragraph':
      return inlineLines(node.children)
    case 'blockquote':
      return node.children.flatMap((child, index) => {
        const lines = projectBlock(child, depth, width)
        if (index > 0)
          lines.unshift(EMPTY_LINE)
        return lines.map(line => prependLine(line, '│ ', { dim: true, italic: true }))
      })
    case 'code':
      return (node.value || '').split('\n').map(value => ({
        spans: [{ text: `  ${value}`, code: true, color: 'yellow' }],
      }))
    case 'thematicBreak':
      return [{ spans: [{ text: '─'.repeat(12), dim: true, color: 'gray' }] }]
    case 'list':
      return projectList(node, depth, width)
    case 'table':
      return projectTable(node, width)
    case 'html':
      return [metavariableLine(node.value) ?? { spans: [{ text: node.value, dim: true }] }]
    default:
      return 'children' in node
        ? inlineLines(node.children.filter((child): child is PhrasingContent => isPhrasing(child)))
        : []
  }
}

function projectList(list: List, depth: number, width: number): MarkdownLine[] {
  return list.children.flatMap((item, index) => projectListItem(item, depth, list.ordered ? (list.start ?? 1) + index : null, width))
}

function projectListItem(item: ListItem, depth: number, ordinal: number | null, width: number): MarkdownLine[] {
  const indent = '  '.repeat(depth)
  const childLines = item.children.flatMap((child, index) => {
    const lines = projectBlock(child, depth + 1, width)
    if (index > 0 && child.type !== 'list')
      lines.unshift(EMPTY_LINE)
    return lines
  })
  const first = childLines[0] ?? EMPTY_LINE
  const parsedTask = taskMarker(first)
  const task = typeof item.checked === 'boolean'
    ? { marker: item.checked ? '☑ ' : '☐ ', line: first }
    : parsedTask
  const marker = task?.marker ?? (ordinal === null ? '• ' : `${ordinal}. `)
  const firstLine = prependLine(task?.line ?? first, `${indent}${marker}`, { color: task ? 'cyan' : undefined })
  return [firstLine, ...childLines.slice(1).map(line => prependLine(line, `${indent}  `))]
}

function taskMarker(line: MarkdownLine): { marker: string, line: MarkdownLine } | null {
  const text = markdownLineText(line)
  const match = text.match(/^\[([ x])\]\s+/iu)
  if (!match)
    return null
  return {
    marker: match[1]?.toLowerCase() === 'x' ? '☑ ' : '☐ ',
    line: sliceLine(line, match[0].length),
  }
}

function inlineLines(children: PhrasingContent[], style: SpanStyle = {}, prefix = ''): MarkdownLine[] {
  const spans = children.flatMap(child => projectInline(child, style))
  const lines = splitSpansAtNewlines(spans)
  if (prefix && lines.length > 0)
    lines[0] = prependLine(lines[0]!, prefix, style)
  return lines
}

function projectInline(node: PhrasingContent, inherited: SpanStyle): MarkdownSpan[] {
  switch (node.type) {
    case 'text':
      return [{ text: node.value, ...inherited }]
    case 'html':
      return metavariableSpan(node.value, inherited) ?? [{ text: node.value, ...inherited, dim: true }]
    case 'inlineCode':
      return [{ text: node.value, ...inherited, code: true, color: 'cyan' }]
    case 'break':
      return [{ text: '\n', ...inherited }]
    case 'strong':
      return node.children.flatMap(child => projectInline(child, { ...inherited, bold: true }))
    case 'emphasis':
      return node.children.flatMap(child => projectInline(child, { ...inherited, italic: true }))
    case 'delete':
      return node.children.flatMap(child => projectInline(child, { ...inherited, dim: true }))
    case 'link':
      return [
        ...node.children.flatMap(child => projectInline(child, { ...inherited, underline: true, color: 'cyan' })),
        { text: ` (${node.url})`, ...inherited, dim: true },
      ]
    case 'image':
      return [{ text: node.alt ? `[image: ${node.alt}]` : '[image]', ...inherited, dim: true }]
    default:
      return 'children' in node
        ? node.children.flatMap(child => projectInline(child, inherited))
        : []
  }
}

function projectTable(node: Extract<RootContent, { type: 'table' }>, width: number): MarkdownLine[] {
  const rows = node.children.map(row => row.children.map(cell => markdownLineText(inlineLines(cell.children)[0] ?? EMPTY_LINE)))
  const headers = rows[0] ?? []
  const values = rows.slice(1)
  const columnWidths = headers.map((header, index) => Math.max(displayWidth(header), ...values.map(row => displayWidth(row[index] ?? ''))))
  const wideWidth = columnWidths.reduce((sum, value) => sum + value, 0) + Math.max(0, columnWidths.length - 1) * 3
  if (wideWidth <= width) {
    return rows.map((row, rowIndex) => ({
      spans: row.flatMap((value, index) => {
        const padded = value + ' '.repeat(Math.max(0, columnWidths[index]! - displayWidth(value)))
        return [
          { text: padded, bold: rowIndex === 0 },
          ...(index < row.length - 1 ? [{ text: ' │ ', dim: true } satisfies MarkdownSpan] : []),
        ]
      }),
    }))
  }
  return values.flatMap((row, rowIndex) => [
    ...(rowIndex > 0 ? [EMPTY_LINE] : []),
    ...headers.map((header, index) => ({ spans: [{ text: `${header}: `, bold: true }, { text: row[index] ?? '' }] })),
  ])
}

function metavariableLine(value: string): MarkdownLine | null {
  const spans = metavariableSpan(value)
  return spans ? { spans } : null
}

function metavariableSpan(value: string, inherited: SpanStyle = {}): MarkdownSpan[] | null {
  const match = value.match(/^<([a-z][a-z0-9]*(?:-[a-z0-9]+)+|reason)>$/u)
  return match ? [{ text: match[1]!, ...inherited, code: true, color: 'cyan' }] : null
}

function isPhrasing(node: RootContent): node is PhrasingContent {
  return !['blockquote', 'code', 'heading', 'list', 'thematicBreak'].includes(node.type)
}

function splitSpansAtNewlines(spans: MarkdownSpan[]): MarkdownLine[] {
  const lines: MarkdownLine[] = [{ spans: [] }]
  for (const span of spans) {
    const parts = span.text.split('\n')
    parts.forEach((part, index) => {
      if (index > 0)
        lines.push({ spans: [] })
      if (part)
        lines.at(-1)!.spans.push({ ...span, text: part })
    })
  }
  return lines.map(line => line.spans.length > 0 ? line : EMPTY_LINE)
}

function prependLine(line: MarkdownLine, text: string, style: SpanStyle = {}): MarkdownLine {
  return { spans: [{ text, ...style }, ...line.spans] }
}

function sliceLine(line: MarkdownLine, codeUnits: number): MarkdownLine {
  let remaining = codeUnits
  const spans: MarkdownSpan[] = []
  for (const span of line.spans) {
    if (remaining >= span.text.length) {
      remaining -= span.text.length
      continue
    }
    spans.push({ ...span, text: span.text.slice(remaining) })
    remaining = 0
  }
  return { spans: spans.length > 0 ? spans : [{ text: '' }] }
}

function wrapStyledLine(line: MarkdownLine, width: number): MarkdownLine[] {
  if (markdownLineText(line) === '')
    return [EMPTY_LINE]
  const lines: MarkdownLine[] = [{ spans: [] }]
  let currentWidth = 0
  for (const span of line.spans) {
    for (const { segment: character } of graphemeSegmenter.segment(span.text)) {
      const characterWidth = displayWidth(character)
      if (currentWidth > 0 && currentWidth + characterWidth > width) {
        lines.push({ spans: [] })
        currentWidth = 0
      }
      appendSpan(lines.at(-1)!, { ...span, text: character })
      currentWidth += characterWidth
    }
  }
  return lines.map(item => item.spans.length > 0 ? item : EMPTY_LINE)
}

function appendSpan(line: MarkdownLine, span: MarkdownSpan): void {
  const previous = line.spans.at(-1)
  if (previous && sameSpanStyle(previous, span))
    previous.text += span.text
  else
    line.spans.push(span)
}

function sameSpanStyle(left: MarkdownSpan, right: MarkdownSpan): boolean {
  return left.bold === right.bold
    && left.italic === right.italic
    && left.underline === right.underline
    && left.dim === right.dim
    && left.code === right.code
    && left.color === right.color
}
