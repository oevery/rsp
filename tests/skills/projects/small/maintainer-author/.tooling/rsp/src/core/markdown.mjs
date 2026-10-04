// @ts-check
import { fromHtml } from 'hast-util-from-html'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { frontmatterFromMarkdown } from 'mdast-util-frontmatter'
import { gfmFromMarkdown } from 'mdast-util-gfm'
import { frontmatter } from 'micromark-extension-frontmatter'
import { gfm } from 'micromark-extension-gfm'

/** @typedef {import('mdast').Nodes} MarkdownNode */
/** @typedef {{ source: string, root: import('mdast').Root, start: number, end: number }} MarkdownDocument */
/** @typedef {string | MarkdownDocument} MarkdownInput */
/** @typedef {{ comments: ReturnType<typeof htmlComments>, maskedSource: string }} HtmlTokenAnalysis */

/** @type {WeakMap<import('mdast').Html, Map<string, HtmlTokenAnalysis>>} */
const htmlTokenAnalyses = new WeakMap()

/** @type {import('micromark-extension-frontmatter').Options} */
const matters = ['yaml', { type: 'yaml', fence: { open: '---', close: '...' } }]
const extensions = [gfm(), frontmatter(matters)]
const mdastExtensions = [gfmFromMarkdown(), frontmatterFromMarkdown(matters)]

/**
 * Parse once, or retain the existing source-positioned document/section view.
 * @param {MarkdownInput} input
 * @param {{ frontmatter?: boolean }} [options]
 * @returns {MarkdownDocument} The source and syntax tree, with the selected source range.
 */
export function parseMarkdown(input, options = {}) {
  if (typeof input !== 'string')
    return input
  const syntax = options.frontmatter === false
    ? { extensions: [gfm()], mdastExtensions: [gfmFromMarkdown()] }
    : { extensions, mdastExtensions }
  return { source: input, root: fromMarkdown(input, syntax), start: 0, end: input.length }
}

/**
 * @param {MarkdownNode} node
 * @param {(node: MarkdownNode) => void | boolean} visit
 */
export function walkMarkdown(node, visit) {
  if (visit(node) === false)
    return
  if ('children' in node) {
    for (const child of node.children)
      walkMarkdown(child, visit)
  }
}

/**
 * Exact authored spelling, not an AST reserialization.
 * @param {MarkdownInput} input
 * @param {MarkdownNode} node
 */
export function markdownNodeSource(input, node) {
  const { source } = parseMarkdown(input)
  return source.slice(node.position?.start.offset ?? 0, node.position?.end.offset ?? 0)
}

/** @param {MarkdownNode} node */
export function isMarkdownComment(node) {
  return node.type === 'html' && !readHtmlToken(node, node.value).maskedSource.trim()
}

/**
 * HTML tokens may contain both comments and visible text, or comment literals
 * inside attributes. Let the HTML syntax tree identify only actual comments.
 * @param {string} value
 * @returns {Array<{ start: number, end: number, topLevel: boolean }>} Comments relative to this HTML token.
 */
function htmlComments(value) {
  if (!value.includes('<!--'))
    return []
  /** @type {Array<{ start: number, end: number, topLevel: boolean }>} */
  const comments = []
  /** @param {import('hast').Nodes} node @param {boolean} topLevel */
  function visit(node, topLevel) {
    if (node.type === 'comment' && node.position)
      comments.push({ start: node.position.start.offset ?? 0, end: node.position.end.offset ?? value.length, topLevel })
    if ('children' in node)
      node.children.forEach(child => visit(child, node.type === 'root'))
  }
  visit(fromHtml(value, { fragment: true }), false)
  return comments
}

/**
 * Reuse each token analysis; normalized node values and authored source may differ.
 * @param {import('mdast').Html} node
 * @param {string} value
 * @returns {HtmlTokenAnalysis} Comment spans and comment-masked source for this token.
 */
function readHtmlToken(node, value) {
  let analyses = htmlTokenAnalyses.get(node)
  const cached = analyses?.get(value)
  if (cached)
    return cached
  const comments = htmlComments(value)
  const analysis = {
    comments,
    maskedSource: maskSourceRanges(value, comments.map(comment => [comment.start, comment.end]), 0, value.length),
  }
  if (!analyses) {
    analyses = new Map()
    htmlTokenAnalyses.set(node, analyses)
  }
  analyses.set(value, analysis)
  return analysis
}

/**
 * Actual top-level comments may share a Markdown HTML token with adjacent content.
 * @param {MarkdownInput} input
 */
export function markdownTopLevelComments(input) {
  const document = parseMarkdown(input)
  return document.root.children.flatMap((node) => {
    if (node.type !== 'html')
      return []
    const source = markdownNodeSource(document, node)
    const offset = node.position?.start.offset ?? document.start
    return readHtmlToken(node, source).comments.filter(comment => comment.topLevel).map(comment => ({
      start: offset + comment.start,
      end: offset + comment.end,
      source: source.slice(comment.start, comment.end),
    }))
  })
}

/**
 * @param {string} source
 * @param {Array<[number, number]>} ranges
 * @param {number} start
 * @param {number} end
 */
function maskSourceRanges(source, ranges, start, end) {
  let result = ''
  let offset = start
  for (const [from, until] of ranges.sort((a, b) => a[0] - b[0])) {
    result += source.slice(offset, from)
    result += source.slice(from, until).replace(/[^\r\n]/g, ' ')
    offset = until
  }
  return result + source.slice(offset, end)
}

/**
 * Human-readable node content; comments never contribute text.
 * @param {MarkdownNode} node
 * @returns {string} Readable content, excluding metadata and actual comments.
 */
export function markdownText(node) {
  if (node.type === 'yaml')
    return ''
  if (node.type === 'html')
    return readHtmlToken(node, node.value).maskedSource
  if (node.type === 'image' || node.type === 'imageReference')
    return node.alt ?? ''
  if ('value' in node)
    return node.value
  if ('children' in node) {
    const separator = ['root', 'list', 'listItem', 'blockquote'].includes(node.type) ? '\n' : ''
    return node.children.map(child => markdownText(child)).filter(Boolean).join(separator)
  }
  return node.type === 'break' ? '\n' : ''
}

/**
 * Preserve source positions when selecting an already parsed section.
 * @param {MarkdownDocument} document
 * @param {import('mdast').RootContent[]} nodes
 * @param {number} start
 * @param {number} end
 * @returns {MarkdownDocument} A section retaining its parent source and absolute positions.
 */
export function markdownSection(document, nodes, start, end) {
  return { source: document.source, root: { type: 'root', children: nodes }, start, end }
}

/**
 * Mask non-semantic ranges and empty container syntax, preserving offsets and line endings.
 * @param {MarkdownInput} input
 * @param {{ includeCode?: boolean }} [options]
 */
export function visibleMarkdownSource(input, options = {}) {
  const document = parseMarkdown(input)
  /** @type {Set<MarkdownNode>} */
  const visibleNodes = new Set()
  /** @param {MarkdownNode} node @returns {boolean} */
  function markVisibleContent(node) {
    if (node.type === 'yaml' || (node.type === 'code' && !options.includeCode))
      return false
    let visible = false
    if (node.type === 'image' || node.type === 'imageReference' || node.type === 'footnoteReference')
      visible = true
    else if (node.type === 'html')
      visible = !isMarkdownComment(node)
    else if ('value' in node)
      visible = Boolean(node.value.trim())
    else if ('children' in node)
      visible = node.children.map(markVisibleContent).some(Boolean)
    if (visible)
      visibleNodes.add(node)
    return visible
  }
  // Formatting markers alone do not fill a section or declare a blocker.
  markVisibleContent(document.root)
  /** @type {Array<[number, number]>} */
  const ranges = []
  walkMarkdown(document.root, (node) => {
    if (!visibleNodes.has(node)) {
      const start = Math.max(document.start, node.position?.start.offset ?? document.start)
      const end = Math.min(document.end, node.position?.end.offset ?? document.end)
      if (end > start)
        ranges.push([start, end])
      return false
    }
    if (node.type === 'html') {
      const nodeStart = node.position?.start.offset ?? document.start
      for (const comment of readHtmlToken(node, markdownNodeSource(document, node)).comments)
        ranges.push([nodeStart + comment.start, nodeStart + comment.end])
      return false
    }
  })
  return maskSourceRanges(document.source, ranges, document.start, document.end)
}

/** @param {MarkdownInput} input */
export function visibleMarkdownLines(input) {
  return visibleMarkdownSource(input).split(/\r?\n/).map(line => line.trim()).filter(Boolean)
}

/**
 * Actual Markdown list items, with raw protocol spelling and source location.
 * @param {MarkdownInput} input
 */
export function markdownListItems(input) {
  const document = parseMarkdown(input)
  /** @type {Array<{ node: import('mdast').ListItem, line: string }>} */
  const items = []
  walkMarkdown(document.root, (node) => {
    if (node.type === 'blockquote' || node.type === 'footnoteDefinition')
      return false
    if (node.type === 'listItem') {
      const source = markdownNodeSource(document, node)
      items.push({ node, line: source.split(/\r?\n/, 1)[0].trim() })
    }
  })
  return items
}

/**
 * The Markdown envelope owns recognition; YAML owns its contents.
 * @param {MarkdownInput} input
 */
export function markdownFrontmatter(input) {
  const document = parseMarkdown(input)
  const node = document.root.children[0]
  if (node?.type !== 'yaml' || node.position?.start.offset !== 0)
    return null
  const raw = markdownNodeSource(document, node)
  const lines = raw.split(/\r?\n/)
  if (lines[0] !== '---' || !['---', '...'].includes(lines.at(-1) ?? ''))
    return null
  let end = node.position.end.offset ?? raw.length
  if (document.source.slice(end, end + 2) === '\r\n')
    end += 2
  else if (document.source[end] === '\n')
    end++
  return { node, value: node.value, end }
}

/**
 * Inline and reference navigation, excluding code and comment examples.
 * @param {MarkdownInput} input
 * @param {{ includeDefinitions?: boolean }} [options]
 */
export function markdownLinks(input, options = {}) {
  const document = parseMarkdown(input)
  /** @type {Map<string, string>} */
  const definitions = new Map()
  walkMarkdown(document.root, (node) => {
    if (node.type === 'definition' && !definitions.has(node.identifier))
      definitions.set(node.identifier, node.url)
  })
  /** @type {string[]} */
  const urls = []
  walkMarkdown(document.root, (node) => {
    if (node.type === 'link' || node.type === 'image' || (options.includeDefinitions && node.type === 'definition')) {
      urls.push(node.url)
    }
    else if (node.type === 'linkReference' || node.type === 'imageReference') {
      const url = definitions.get(node.identifier)
      if (url)
        urls.push(url)
    }
  })
  return urls
}

/**
 * Search prose tokens without interpreting comments or code as instructions.
 * @param {MarkdownInput} input
 */
export function markdownProse(input) {
  const document = parseMarkdown(input)
  /** @type {Array<{ value: string, line: number }>} */
  const fragments = []
  walkMarkdown(document.root, (node) => {
    if (node.type === 'text' || node.type === 'html')
      fragments.push({ value: markdownText(node), line: node.position?.start.line ?? 1 })
  })
  return fragments
}
