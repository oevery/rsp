import type { Definition, Nodes } from 'mdast'
import type { ArchitectureResult } from '../architecture/model.js'
import { Buffer } from 'node:buffer'
import { extname, posix, resolve } from 'node:path'
import { digest, documentHeadings, isWithin, MAX_CONTENT_BYTES, projectPath, readProjectFile } from '../architecture/model.js'
import { parseMarkdown, walkMarkdown } from '../core/markdown.mjs'
import { readCurrentDocument } from '../specs/query.js'

const escape = (value: string) => value.replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', '\'': '&#39;' })[char]!)
const imageTypes: Record<string, string> = { '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif', '.webp': 'image/webp' }
function permitted(model: ArchitectureResult, file: string) {
  projectPath(file)
  const parts = file.split('/')
  if (parts.some(part => /^(?:secrets?|credentials?|private)(?:[._-]|$)|^id_(?:rsa|dsa|ecdsa|ed25519)(?:[._-]|$)/i.test(part)))
    return false
  // RSP's authored documents live in a hidden directory; other hidden content
  // is never exposed merely because a Markdown link points to it.
  const rspDocument = file.startsWith('.rsp/specs/') || model.documents.some(document => document.startsWith('.rsp/') && isWithin(posix.dirname(document), file))
  return parts.every((part, index) => !part.startsWith('.') || (index === 0 && part === '.rsp' && rspDocument))
}
function localTarget(model: ArchitectureResult, source: string, value: string, image: boolean) {
  if (!value || value.startsWith('#') || /^[a-z][\w+.-]*:|^(?:\/|\\)/i.test(value))
    return undefined
  try {
    const decoded = decodeURIComponent(value.split(/[?#]/)[0]!)
    const target = posix.normalize(posix.join(posix.dirname(source), decoded))
    return permitted(model, target) && (image ? imageTypes[extname(target).toLowerCase()] : /\.md$/i.test(target)) ? target : undefined
  }
  catch {
    return undefined
  }
}
function definitionsIn(document: ReturnType<typeof parseMarkdown>) {
  const definitions = new Map<string, Definition>()
  walkMarkdown(document.root, (node) => {
    if (node.type === 'definition' && !definitions.has(node.identifier.toLowerCase()))
      definitions.set(node.identifier.toLowerCase(), node)
  })
  return definitions
}
/**
 * Bindings are entry points, not directory grants. Recompute link reachability
 * from current safe Markdown so deleted links revoke access without an ACL cache.
 */
async function authorizedContent(root: string, model: ArchitectureResult, file: string, image = false): Promise<string | undefined> {
  if (!permitted(model, file) || !(image ? imageTypes[extname(file).toLowerCase()] : /\.md$/i.test(file)))
    throw new Error('Unregistered/unsupported document or image')
  if (!image && model.documents.includes(file))
    return readProjectFile(root, file)
  const pending = [...model.documents]
  const scheduled = new Set(pending)
  const visited = new Set<string>()
  let bytes = 0
  while (pending.length) {
    const current = pending.shift()!
    if (visited.has(current) || !permitted(model, current))
      continue
    visited.add(current)
    let content: string
    try {
      content = await readProjectFile(root, current)
    }
    catch (error) {
      if (current === file)
        throw error
      continue
    }
    if (!image && current === file)
      return content
    bytes += Buffer.byteLength(content)
    if (bytes > MAX_CONTENT_BYTES)
      throw new Error('Document authorization exceeds the Markdown inspection limit')
    const document = parseMarkdown(content)
    const definitions = definitionsIn(document)
    let found = false
    walkMarkdown(document.root, (node) => {
      const isImage = node.type === 'image' || node.type === 'imageReference'
      const value = node.type === 'link' || node.type === 'image' ? node.url : node.type === 'linkReference' || node.type === 'imageReference' ? definitions.get(node.identifier.toLowerCase())?.url : undefined
      const target = value && localTarget(model, current, value, isImage)
      if (!target)
        return
      if (image && isImage && target === file)
        found = true
      if (!isImage && !scheduled.has(target)) {
        scheduled.add(target)
        pending.push(target)
      }
    })
    if (found)
      return undefined
  }
  throw new Error('Document or image is not reachable from an architecture binding')
}
export async function readAsset(root: string, model: ArchitectureResult, file: string) {
  await authorizedContent(root, model, file, true)
  const path = resolve(root, file)
  const current = await readCurrentDocument(path, root, file, MAX_CONTENT_BYTES, true)
  return { type: imageTypes[extname(file).toLowerCase()]!, content: current.data!, revision: digest(current.data!) }
}
export async function renderDocument(root: string, model: ArchitectureResult, file: string) {
  const content = (await authorizedContent(root, model, file))!
  const document = parseMarkdown(content)
  const headings = documentHeadings(document)
  const definitions = definitionsIn(document)
  let headingIndex = 0
  function url(value: string, image = false): string | undefined {
    if (value.startsWith('#'))
      return image ? undefined : escape(value)
    if (/^[a-z][\w+.-]*:/i.test(value))
      return !image && /^(?:https?:|mailto:)/i.test(value) ? escape(value) : undefined
    if (value.startsWith('//') || value.startsWith('/'))
      return undefined
    try {
      const parsed = new URL(value, 'http://document.local/')
      const target = localTarget(model, file, value, image)
      if (!target)
        return undefined
      if (image)
        return escape(target)
      return `/?${escape(new URLSearchParams({ file: target, ...(parsed.hash ? { anchor: decodeURIComponent(parsed.hash.slice(1)) } : {}) }).toString())}`
    }
    catch {
      return undefined
    }
  }
  function render(node: Nodes): string {
    const children = () => 'children' in node ? node.children.map(render).join('') : ''
    switch (node.type) {
      case 'root': return children()
      case 'text': return escape(node.value)
      case 'heading': return `<h${node.depth} id="${escape(headings[headingIndex++]!.anchor)}">${children()}</h${node.depth}>`
      case 'paragraph': return `<p>${children()}</p>`
      case 'strong': return `<strong>${children()}</strong>`
      case 'emphasis': return `<em>${children()}</em>`
      case 'delete': return `<del>${children()}</del>`
      case 'inlineCode': return `<code>${escape(node.value)}</code>`
      case 'code': return node.lang === 'mermaid'
        ? `<figure data-rsp-mermaid><pre><code>${escape(node.value)}</code></pre></figure>`
        : `<pre><code>${escape(node.value)}</code></pre>`
      case 'blockquote': return `<blockquote>${children()}</blockquote>`
      case 'list': return node.ordered ? `<ol start="${node.start ?? 1}">${children()}</ol>` : `<ul>${children()}</ul>`
      case 'listItem': return `<li>${node.checked === null || node.checked === undefined ? '' : node.checked ? '☑ ' : '☐ '}${children()}</li>`
      case 'table': {
        const rows = node.children.map((row, index) => `<tr>${row.children.map((cell, column) => {
          const tag = index === 0 ? 'th' : 'td'
          const align = node.align?.[column] ?? 'left'
          return `<${tag}${index === 0 ? ' scope="col"' : ''} style="text-align:${align}">${cell.children.map(render).join('')}</${tag}>`
        }).join('')}</tr>`)
        return `<table><thead>${rows[0] ?? ''}</thead><tbody>${rows.slice(1).join('')}</tbody></table>`
      }
      case 'break': return '<br>'
      case 'thematicBreak': return '<hr>'
      case 'link':
      case 'linkReference': {
        const value = node.type === 'link' ? node.url : definitions.get(node.identifier.toLowerCase())?.url
        const href = value === undefined ? undefined : url(value)
        if (!href && value && !/^[a-z][\w+.-]*:|^[/\\#]/i.test(value)) {
          try {
            const target = posix.normalize(posix.join(posix.dirname(file), decodeURIComponent(value.split(/[?#]/)[0]!)))
            if (permitted(model, target) && /\.(?:[cm]?[jt]sx?|vue|svelte|py|rs|go|java|kt|c|cpp|h|hpp|cs|sh|json|ya?ml|toml)$/i.test(target)) {
              const fragment = new URL(value, 'http://document.local/').hash
              const locator = `${target}${/^#L\d+(?:-L\d+)?$/.test(fragment) ? fragment : ''}`
              return `${children()} <button type="button" data-source-locator="${escape(locator)}"><span data-rsp-reading-status="copySource">Copy source path</span>: <code>${escape(locator)}</code></button>`
            }
          }
          catch { /* Invalid local paths remain unavailable. */ }
        }
        return href ? `<a href="${href}" rel="noopener noreferrer"${/^https?:/i.test(href) ? ' target="_blank"' : ''}>${children()}</a>` : `${children()}<span data-rsp-reading-status="unavailableLink"> (unavailable link)</span>`
      }
      case 'image': {
        const path = url(node.url, true)
        return path ? `<img data-asset="${path}" alt="${escape(node.alt ?? '')}">` : `<span>${escape(node.alt ?? '')}<span data-rsp-reading-status="unsupportedImage"> (external/unsupported image)</span></span>`
      }
      case 'imageReference': {
        const definition = definitions.get(node.identifier.toLowerCase())
        const path = definition && url(definition.url, true)
        return path ? `<img data-asset="${path}" alt="${escape(node.alt ?? '')}">` : `<span>${escape(node.alt ?? '')}<span data-rsp-reading-status="unsupportedImage"> (external/unsupported image)</span></span>`
      }
      default: return ''
    }
  }
  return { file, revision: digest(content), headings, html: render(document.root) }
}
