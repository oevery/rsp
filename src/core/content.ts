import type { CheckboxCount, DeltaSections, Frontmatter, ScenarioBlock, VerifyCriticalitySummary } from '../types.js'
import { parse } from 'yaml'
import { CHANGE_DOCUMENT_SCHEMA, getDocumentSectionBody, parseRspDocument } from './document-model.js'

/** Parse a YAML document into a plain object. */
export function parseYamlText(text: string): Record<string, unknown> {
  const parsed = parse(text)
  if (parsed === null || parsed === undefined)
    return {}
  if (typeof parsed !== 'object' || Array.isArray(parsed))
    throw new Error('YAML document must be a mapping/object')
  return parsed as Record<string, unknown>
}

/** Parse YAML from a list of lines. */
export function parseYamlLines(lines: string[]): Record<string, unknown> {
  return parseYamlText(lines.join('\n'))
}

/** Parse YAML frontmatter from change file content. */
export function parseFrontmatter(content: string): Frontmatter | null {
  const m = content.match(/^---\r?\n([\s\S]*?)\r?\n(?:---|\.\.\.)\r?\n/)
  if (!m)
    return null
  return parseYamlText(m[1]) as Frontmatter
}

/** Count semantic checkboxes ([ ], [/], [x], [-]) in content. */
export function countCheckboxes(content: string): CheckboxCount {
  const todo = (content.match(/\[ \]/g) || []).length
  const progress = (content.match(/\[\/\]/g) || []).length
  const done = (content.match(/\[x\]/g) || []).length
  const dropped = (content.match(/\[-\]/g) || []).length
  return { todo, progress, done, dropped, total: todo + progress + done + dropped }
}

/** Classify Verify checkbox items while keeping legacy Changes fail-closed. */
export function classifyVerifyCheckboxes(sectionText: string): VerifyCriticalitySummary {
  const buckets = collectVerifyCheckboxLines(sectionText)
  return {
    required: countCheckboxes([...buckets.required, ...buckets.unclassified].join('\n')),
    optional: countCheckboxes(buckets.optional.join('\n')),
    unclassified: countCheckboxes(buckets.unclassified.join('\n')),
    legacy: buckets.legacy,
  }
}

export function collectVerifyCheckboxLines(sectionText: string): {
  required: string[]
  optional: string[]
  unclassified: string[]
  legacy: boolean
} {
  const required: string[] = []
  const optional: string[] = []
  const unclassified: string[] = []
  let current: 'required' | 'optional' | 'unclassified' = 'unclassified'
  let sawClassificationHeading = false

  for (const line of sectionText.split('\n')) {
    const heading = line.match(/^###\s+(Required|Optional)\s*$/i)
    if (heading) {
      current = heading[1].toLowerCase() as 'required' | 'optional'
      sawClassificationHeading = true
      continue
    }
    if (!/^- \[[ /x-]\]/i.test(line.trim()))
      continue
    if (current === 'required')
      required.push(line)
    else if (current === 'optional')
      optional.push(line)
    else
      unclassified.push(line)
  }

  return { required, optional, unclassified, legacy: unclassified.length > 0 || !sawClassificationHeading }
}

/** Filter checkbox todo lines from a section body. */
export function getOpenCheckboxes(sectionText: string): string[] {
  return sectionText
    .split('\n')
    .map(line => line.trim())
    .filter(line => /^- \[[ /]\]/.test(line))
}

/** Extract normalized semantic lines from Blockers, excluding well-formed Markdown HTML comments. */
export function extractBlockerLines(content: string): string[] {
  const document = parseRspDocument(content, CHANGE_DOCUMENT_SCHEMA)
  return normalizeBlockerBody(getDocumentSectionBody(document, 'blockers'))
}

/** Return true when one already-indexed Blockers body contains a real blocker entry. */
export function hasMeaningfulBlockerBody(body: string): boolean {
  return hasMeaningfulBlockerLines(normalizeBlockerBody(body))
}

function normalizeBlockerBody(body: string): string[] {
  return body.replace(/<!--[\s\S]*?-->/g, '').split('\n').map(line => line.trim()).filter(Boolean)
}

/** Return true when the Blockers section contains a real blocker entry. */
export function hasMeaningfulBlockers(content: string): boolean {
  return hasMeaningfulBlockerLines(extractBlockerLines(content))
}

/** Return true when one normalized Blockers line is an unambiguous empty sentinel. */
export function isEmptyBlockerLine(line: string): boolean {
  const normalized = line.trim()
  return /^none[.。]?$/i.test(normalized) || /^[-*]\s*(?:none[.。]?)?$/i.test(normalized)
}

/** Return true when normalized Blockers-section lines contain a real blocker entry. */
export function hasMeaningfulBlockerLines(lines: string[]): boolean {
  if (lines.length === 0)
    return false
  return lines.some(line => !isEmptyBlockerLine(line))
}

/** Detect lightweight delta markers under the Spec section. */
export function detectDeltaSections(content: string): DeltaSections {
  const document = parseRspDocument(content, CHANGE_DOCUMENT_SCHEMA)
  const body = getDocumentSectionBody(document, 'spec')
  return {
    added: /^###\s*ADDED/im.test(body),
    modified: /^###\s*MODIFIED/im.test(body),
    removed: /^###\s*REMOVED/im.test(body),
  }
}

/** Parse structured Given/When/Then scenario blocks from change content. */
export function parseScenarios(content: string): ScenarioBlock[] {
  const scenarios: ScenarioBlock[] = []
  // eslint-disable-next-line regexp/no-super-linear-backtracking
  const regex = /^#{3,4}\s*Scenario:\s*(.+)$/gim
  let match
  // eslint-disable-next-line no-cond-assign
  while ((match = regex.exec(content)) !== null) {
    const heading = match[1].trim()
    const startPos = match.index + match[0].length
    const restContent = content.slice(startPos)
    const nextSection = restContent.match(/^#{3,4}\s/m)
    const block = nextSection ? restContent.slice(0, nextSection.index) : restContent
    const steps = block.split('\n')
      .map(s => s.trim())
      .filter(s => s.startsWith('-') && /GIVEN|WHEN|THEN|AND|BUT/i.test(s))
      .map(s => s.replace(/^[-*]\s*/, ''))
    if (steps.length > 0)
      scenarios.push({ heading, steps })
  }
  return scenarios
}
