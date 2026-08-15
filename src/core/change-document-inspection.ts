import type { CommandDiagnostic } from '../types.js'
import { parseFrontmatter } from './content.js'
import { CHANGE_DOCUMENT_SCHEMA, getDocumentSectionDefinitionByHeading, getDocumentSections, parseRspDocument } from './document-model.js'
import { IssueRelationshipError, parseIssueRelationships } from './issue-relationship.js'

export interface ChangeDocumentInspectionOptions {
  name: string
  validKinds: readonly string[]
  requiredSections: readonly string[]
}

const choosePlaceholderRe = /^<choose:/i

/** Inspect the persisted structure and metadata required by every ordinary Change consumer. */
export function inspectChangeDocument(
  content: string,
  options: ChangeDocumentInspectionOptions,
): CommandDiagnostic[] {
  const diagnostics: CommandDiagnostic[] = []
  let frontmatter = null

  try {
    frontmatter = parseFrontmatter(content)
  }
  catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    diagnostics.push({
      severity: 'error',
      code: 'invalid_frontmatter',
      message: `invalid YAML frontmatter (${message})`,
    })
  }

  if (!frontmatter && diagnostics.length === 0) {
    diagnostics.push({
      severity: 'error',
      code: 'missing_frontmatter',
      message: 'missing YAML frontmatter',
    })
  }

  const document = parseRspDocument(content, CHANGE_DOCUMENT_SCHEMA)
  for (const heading of options.requiredSections) {
    const definition = getDocumentSectionDefinitionByHeading(CHANGE_DOCUMENT_SCHEMA, heading)
    if (!definition)
      continue
    const sections = getDocumentSections(document, definition.id)
    const canonicalSections = sections.filter(candidate => candidate.canonical)
    if (canonicalSections.length === 0) {
      diagnostics.push({
        severity: 'error',
        code: 'missing_section',
        message: `missing "## ${heading}" section`,
      })
    }
    else if (sections.length !== 1) {
      diagnostics.push({
        severity: 'error',
        code: 'duplicate_section',
        message: `document must contain exactly one "## ${heading}" section; found ${sections.length}`,
      })
    }
  }

  if (frontmatter) {
    try {
      parseIssueRelationships(frontmatter)
    }
    catch (error) {
      diagnostics.push({
        severity: 'error',
        code: error instanceof IssueRelationshipError ? error.code : 'invalid_issue_metadata',
        message: error instanceof Error ? error.message : String(error),
      })
    }
    if (!('kind' in frontmatter)) {
      diagnostics.push({
        severity: 'error',
        code: 'missing_kind',
        message: 'missing frontmatter field: kind',
      })
    }
    else if (choosePlaceholderRe.test(String(frontmatter.kind))) {
      diagnostics.push({
        severity: 'error',
        code: 'placeholder_kind',
        message: `kind still uses the template placeholder; choose one of: ${options.validKinds.join(', ')}`,
      })
    }
    else if (!options.validKinds.includes(String(frontmatter.kind))) {
      diagnostics.push({
        severity: 'error',
        code: 'invalid_kind',
        message: `invalid kind "${frontmatter.kind}" (valid: ${options.validKinds.join(', ')})`,
      })
    }
  }

  const compatibleTitles = document.titleOccurrences.filter(title => title.identityCompatible)
  if (compatibleTitles.length === 0) {
    diagnostics.push({
      severity: 'error',
      code: 'missing_heading',
      message: 'missing "# Change:" heading',
    })
  }
  else if (document.titleOccurrences.length !== 1) {
    diagnostics.push({
      severity: 'error',
      code: 'duplicate_heading',
      message: `document must contain exactly one "# Change:" heading; found ${document.titleOccurrences.length}`,
    })
  }
  else if (compatibleTitles[0].value !== options.name) {
    diagnostics.push({
      severity: 'error',
      code: 'heading_mismatch',
      message: `# Change: heading "${compatibleTitles[0].value}" differs from change name`,
    })
  }

  return diagnostics
}
