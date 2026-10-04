import type { RootContent } from 'mdast'
import type { CheckboxCount, DeltaSections, Frontmatter, ScenarioBlock, VerifyCriticalitySummary } from '../types.js'
import type { ChangeSectionId, ParsedRspDocument } from './document-model.js'
import type { MarkdownInput } from './markdown.mjs'
import { CHANGE_DOCUMENT_SCHEMA, getDocumentSectionMarkdown, parseRspDocument } from './document-model.js'
import { markdownFrontmatter, markdownListItems, markdownNodeSource, markdownSection, markdownText, parseMarkdown, visibleMarkdownLines, walkMarkdown } from './markdown.mjs'
import { parseYamlDocument, yamlMapping } from './yaml.mjs'

type ChangeDocument = ParsedRspDocument<ChangeSectionId>
export interface CheckboxItem {
  state: ' ' | '/' | 'x' | '-'
  line: string
}

/** Parse validated YAML into a mapping, retaining Document parsing as the syntax owner. */
export function parseYamlText(text: string): Record<string, unknown> {
  return yamlMapping(parseYamlDocument(text))
}

/** Recognize the Markdown envelope before interpreting its YAML contents. */
export function parseFrontmatter(content: MarkdownInput): Frontmatter | null {
  const matter = markdownFrontmatter(content)
  return matter ? parseYamlText(matter.value) as Frontmatter : null
}

function checkboxItem(line: string): CheckboxItem | null {
  const marker = line.match(/^[-*+]\s+\[([ /x-])\]/i)
  return marker ? { state: marker[1].toLowerCase() as CheckboxItem['state'], line } : null
}

/** Only actual list-item markers count; literals and example blocks do not. */
export function collectCheckboxItems(content: MarkdownInput): CheckboxItem[] {
  return markdownListItems(content).flatMap(({ line }) => {
    const item = checkboxItem(line)
    return item ? [item] : []
  })
}

export function countCheckboxItems(items: CheckboxItem[]): CheckboxCount {
  const count: CheckboxCount = { todo: 0, progress: 0, done: 0, dropped: 0, total: items.length }
  for (const { state } of items) {
    if (state === ' ')
      count.todo++
    else if (state === '/')
      count.progress++
    else if (state === 'x')
      count.done++
    else
      count.dropped++
  }
  return count
}

export function countCheckboxes(content: MarkdownInput): CheckboxCount {
  return countCheckboxItems(collectCheckboxItems(content))
}

/** Preserve classification and source spelling without concatenating/reparsing evidence. */
export function collectVerifyCheckboxes(content: MarkdownInput): {
  required: CheckboxItem[]
  optional: CheckboxItem[]
  unclassified: CheckboxItem[]
  legacy: boolean
} {
  const document = parseMarkdown(content)
  const buckets: Record<'required' | 'optional' | 'unclassified', CheckboxItem[]> = { required: [], optional: [], unclassified: [] }
  let current: keyof typeof buckets = 'unclassified'
  let sawClassificationHeading = false
  walkMarkdown(document.root, (node) => {
    if (node.type === 'blockquote' || node.type === 'footnoteDefinition')
      return false
    if (node.type === 'heading' && node.depth === 3 && node.position?.start.column === 1) {
      const heading = markdownNodeSource(document, node).match(/^###\s+(Required|Optional)\s*$/i)
      if (heading) {
        current = heading[1].toLowerCase() as 'required' | 'optional'
        sawClassificationHeading = true
      }
    }
    if (node.type === 'listItem') {
      const line = markdownNodeSource(document, node).split(/\r?\n/, 1)[0].trim()
      const item = checkboxItem(line)
      if (item)
        buckets[current].push(item)
    }
  })
  return { ...buckets, legacy: buckets.unclassified.length > 0 || !sawClassificationHeading }
}

export function summarizeVerifyCheckboxes(buckets: ReturnType<typeof collectVerifyCheckboxes>): VerifyCriticalitySummary {
  return {
    required: countCheckboxItems([...buckets.required, ...buckets.unclassified]),
    optional: countCheckboxItems(buckets.optional),
    unclassified: countCheckboxItems(buckets.unclassified),
    legacy: buckets.legacy,
  }
}

export function openCheckboxLines(items: CheckboxItem[]): string[] {
  return items.filter(item => item.state === ' ' || item.state === '/').map(item => item.line)
}

export function getOpenCheckboxes(content: MarkdownInput): string[] {
  return openCheckboxLines(collectCheckboxItems(content))
}

function changeDocument(content: string | ChangeDocument): ChangeDocument {
  return typeof content === 'string' ? parseRspDocument(content, CHANGE_DOCUMENT_SCHEMA) : content
}

export function hasMeaningfulBlockerBody(body: MarkdownInput): boolean {
  return readBlockerEntries(body).length > 0
}

/** Read semantic lines using the full parse context, retaining inline-code literals. */
export function getVisibleBodyLines(body: MarkdownInput): string[] {
  return visibleMarkdownLines(body)
}

export function hasMeaningfulBlockers(content: string | ChangeDocument): boolean {
  return hasMeaningfulBlockerBody(getDocumentSectionMarkdown(changeDocument(content), 'blockers'))
}

function isEmptyBlockerLine(line: string): boolean {
  const normalized = line.trim()
  return /^none[.。]?$/i.test(normalized) || /^[-*]\s*(?:none[.。]?)?$/i.test(normalized)
}

export type BlockerEntry
  = | { kind: 'dependency', line: string, text: string, name: string, reason: string }
    | { kind: 'external' | 'malformed-dependency', line: string, text: string }

const REQUIRES_RE = /^[-*]\s+requires\s+`([^`]+)`:[ \t]*(\S.*)$/i

/** Local declarations only; consumers own current dependency state and historical evidence. */
export function readBlockerEntries(input: MarkdownInput): BlockerEntry[] {
  const document = parseMarkdown(input)
  const entries: BlockerEntry[] = []
  const nodeLines = (node: RootContent, start = node.position!.start.offset!) => getVisibleBodyLines(
    markdownSection(document, [node], start, node.position!.end.offset!),
  )
  const text = (line: string) => line.replace(/^[-*]\s+/, '').trim()
  const appendExternal = (lines: string[]) => {
    for (const line of lines) {
      if (!isEmptyBlockerLine(line))
        entries.push({ kind: 'external', line, text: text(line) })
    }
  }
  const visit = (node: RootContent) => {
    if (node.type === 'code')
      return
    if (node.type !== 'list') {
      appendExternal(nodeLines(node))
      return
    }
    for (const item of node.children) {
      for (const [index, child] of item.children.entries()) {
        if (child.type === 'list' || child.type === 'code') {
          visit(child)
          continue
        }
        const lines = nodeLines(child, index === 0 ? item.position!.start.offset! : child.position!.start.offset!)
        if (index === 0 && child.type === 'paragraph') {
          const line = lines[0] ?? ''
          const dependency = line.match(REQUIRES_RE)
          if (dependency) {
            entries.push({ kind: 'dependency', line, text: text(line), name: dependency[1], reason: dependency[2] })
            lines.shift()
          }
          else if (/^[-*]\s+requires\b/i.test(line)) {
            entries.push({ kind: 'malformed-dependency', line, text: text(line) })
            lines.shift()
          }
        }
        appendExternal(lines)
      }
    }
  }
  document.root.children.forEach(visit)
  return entries
}

export function detectDeltaSections(content: string | ChangeDocument): DeltaSections {
  const body = getDocumentSectionMarkdown(changeDocument(content), 'spec')
  const labels = new Set(body.root.children.filter(node => node.type === 'heading' && node.depth === 3).map(node => markdownText(node).trim().toUpperCase()))
  return { added: labels.has('ADDED'), modified: labels.has('MODIFIED'), removed: labels.has('REMOVED') }
}

/** Scenarios and steps are real headings and list items, never examples or comments. */
export function parseScenarios(content: MarkdownInput): ScenarioBlock[] {
  const document = parseMarkdown(content)
  const scenarios: ScenarioBlock[] = []
  let scenario: ScenarioBlock | null = null
  for (const node of document.root.children) {
    if (node.type === 'heading' && node.depth <= 4) {
      const title = markdownText(node)
      scenario = (node.depth === 3 || node.depth === 4) && /^Scenario:\s*\S/i.test(title)
        ? { heading: title.slice(title.indexOf(':') + 1).trim(), steps: [] }
        : null
      if (scenario)
        scenarios.push(scenario)
      continue
    }
    if (scenario && node.type === 'list') {
      for (const item of node.children) {
        const line = markdownNodeSource(document, item).split(/\r?\n/, 1)[0].trim()
        const step = line.replace(/^[-*+]\s+/, '')
        if (/^(?:GIVEN|WHEN|THEN|AND|BUT)\b/i.test(step))
          scenario.steps.push(step)
      }
    }
  }
  return scenarios.filter(item => item.steps.length > 0)
}
