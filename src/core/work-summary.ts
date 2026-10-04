import type { ParsedRspDocument } from './document-model.js'
import type { MarkdownDocument } from './markdown.mjs'
import { parseFrontmatter } from './content.js'
import { CHANGE_DOCUMENT_SCHEMA, getDocumentSectionMarkdown, GROUP_BRIEF_DOCUMENT_SCHEMA, parseRspDocument } from './document-model.js'
import { markdownListItems, visibleMarkdownSource } from './markdown.mjs'

const PLACEHOLDER_SUMMARY = '<…>'

/** Derive a human-readable Change summary without changing WorkRef identity. */
export function extractChangeSummary(
  content: string,
  document: ParsedRspDocument<typeof CHANGE_DOCUMENT_SCHEMA.sections[number]['id']> = parseRspDocument(content, CHANGE_DOCUMENT_SCHEMA),
  options: { preservePlaceholder?: boolean } = {},
): string | null {
  try {
    const frontmatter = parseFrontmatter(document.markdown)
    const frontmatterSummary = meaningfulSummary(frontmatter?.summary, options)
    if (frontmatterSummary)
      return frontmatterSummary
  }
  catch {
    // Structural consumers own frontmatter diagnostics. Summary projection is
    // additive and must not replace those diagnostics with a read failure.
  }

  const proposalLines = visibleSummaryItemLines(getDocumentSectionMarkdown(document, 'proposal'))
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
  for (const line of visibleSummaryItemLines(getDocumentSectionMarkdown(document, 'goal'))) {
    const trimmed = line.trim()
    const summary = trimmed.startsWith('- ') || trimmed.startsWith('* ') ? meaningfulSummary(trimmed.slice(2)) : null
    if (summary)
      return summary
  }
  return null
}

/** Project actual list items from masked source without rewriting inline-code literals. */
function visibleSummaryItemLines(document: MarkdownDocument): string[] {
  const source = visibleMarkdownSource(document)
  return markdownListItems(document).map(({ node }) => source
    .slice(node.position!.start.offset! - document.start, node.position!.end.offset! - document.start)
    .split(/\r?\n/, 1)[0]
    .trim())
}

function meaningfulSummary(value: unknown, options: { preservePlaceholder?: boolean } = {}): string | null {
  if (typeof value !== 'string')
    return null
  const summary = value.trim()
  return summary && (options.preservePlaceholder || summary !== PLACEHOLDER_SUMMARY) ? summary : null
}
