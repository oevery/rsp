import type { ParsedRspDocument } from './document-model.js'
import { parseFrontmatter } from './content.js'
import { CHANGE_DOCUMENT_SCHEMA, getDocumentSectionBody, GROUP_BRIEF_DOCUMENT_SCHEMA, parseRspDocument } from './document-model.js'

const PLACEHOLDER_SUMMARY = '<…>'

/** Derive a human-readable Change summary without changing WorkRef identity. */
export function extractChangeSummary(
  content: string,
  document: ParsedRspDocument<typeof CHANGE_DOCUMENT_SCHEMA.sections[number]['id']> = parseRspDocument(content, CHANGE_DOCUMENT_SCHEMA),
  options: { preservePlaceholder?: boolean } = {},
): string | null {
  try {
    const frontmatter = parseFrontmatter(content)
    const frontmatterSummary = meaningfulSummary(frontmatter?.summary, options)
    if (frontmatterSummary)
      return frontmatterSummary
  }
  catch {
    // Structural consumers own frontmatter diagnostics. Summary projection is
    // additive and must not replace those diagnostics with a read failure.
  }

  const proposalLines = getDocumentSectionBody(document, 'proposal').split('\n').map(line => line.trim())
  for (const field of ['Outcome', 'Summary']) {
    const prefix = `- ${field}:`
    for (const line of proposalLines) {
      const summary = line.startsWith(prefix) ? meaningfulSummary(line.slice(prefix.length), options) : null
      if (summary)
        return summary
    }
  }
  return null
}

/** Derive the first meaningful authored Goal item for a Change Group. */
export function extractGroupSummary(
  content: string,
  document: ParsedRspDocument<typeof GROUP_BRIEF_DOCUMENT_SCHEMA.sections[number]['id']> = parseRspDocument(content, GROUP_BRIEF_DOCUMENT_SCHEMA),
): string | null {
  for (const line of getDocumentSectionBody(document, 'goal').split('\n')) {
    const trimmed = line.trim()
    const summary = trimmed.startsWith('- ') || trimmed.startsWith('* ') ? meaningfulSummary(trimmed.slice(2)) : null
    if (summary)
      return summary
  }
  return null
}

function meaningfulSummary(value: unknown, options: { preservePlaceholder?: boolean } = {}): string | null {
  if (typeof value !== 'string')
    return null
  const summary = value.trim()
  return summary && (options.preservePlaceholder || summary !== PLACEHOLDER_SUMMARY) ? summary : null
}
