import type { Frontmatter, IssueRelation, IssueRelationship } from '../types.js'

const ISSUE_RELATIONS = new Set<IssueRelation>(['relates', 'closes'])
const ISSUE_FIELDS = new Set(['url', 'relation'])

export class IssueRelationshipError extends Error {
  constructor(readonly code: string, message: string) {
    super(message)
    this.name = 'IssueRelationshipError'
  }
}

/** Parse and normalize the optional issue relationships owned by one Change. */
export function parseIssueRelationships(frontmatter: Frontmatter | null): IssueRelationship[] {
  if (!frontmatter || !('issues' in frontmatter))
    return []
  if (!Array.isArray(frontmatter.issues))
    throw new IssueRelationshipError('invalid_issue_shape', 'frontmatter field "issues" must be a list')

  const seen = new Set<string>()
  return frontmatter.issues.map((value, index) => {
    if (!isPlainObject(value))
      throw new IssueRelationshipError('invalid_issue_shape', `issues[${index}] must be a mapping with url and relation`)
    const fields = Object.keys(value)
    const unsupported = fields.filter(field => !ISSUE_FIELDS.has(field))
    if (unsupported.length > 0)
      throw new IssueRelationshipError('unsupported_issue_field', `issues[${index}] contains unsupported field(s): ${unsupported.sort().join(', ')}`)
    if (fields.length !== 2 || !('url' in value) || !('relation' in value))
      throw new IssueRelationshipError('invalid_issue_shape', `issues[${index}] must contain exactly url and relation`)
    if (typeof value.url !== 'string')
      throw new IssueRelationshipError('invalid_issue_url', `issues[${index}].url must be an absolute http or https URL`)
    if (typeof value.relation !== 'string' || !ISSUE_RELATIONS.has(value.relation as IssueRelation))
      throw new IssueRelationshipError('unsupported_issue_relation', `issues[${index}].relation must be relates or closes`)

    const url = normalizeIssueUrl(value.url, `issues[${index}].url`)
    if (seen.has(url))
      throw new IssueRelationshipError('duplicate_issue_url', `issues contains duplicate normalized URL: ${url}`)
    seen.add(url)
    return { url, relation: value.relation as IssueRelation }
  })
}

/** Validate and normalize one issue relationship supplied by rsp create. */
export function createIssueRelationship(url: string, relation: string = 'relates'): IssueRelationship {
  return parseIssueRelationships({ issues: [{ url, relation }] })[0]
}

function normalizeIssueUrl(raw: string, label: string): string {
  if (raw.trim() !== raw || raw === '')
    throw new IssueRelationshipError('invalid_issue_url', `${label} must be an absolute http or https URL without surrounding whitespace`)
  let parsed: URL
  try {
    parsed = new URL(raw)
  }
  catch {
    throw new IssueRelationshipError('invalid_issue_url', `${label} must be an absolute http or https URL`)
  }
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:')
    throw new IssueRelationshipError('invalid_issue_url', `${label} must use http or https`)
  if (!parsed.hostname)
    throw new IssueRelationshipError('invalid_issue_url', `${label} must include a host`)
  if (parsed.username || parsed.password)
    throw new IssueRelationshipError('unsafe_issue_url', `${label} must not contain credentials`)
  if (parsed.hash)
    throw new IssueRelationshipError('unsafe_issue_url', `${label} must not contain a fragment`)
  return parsed.toString()
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}
