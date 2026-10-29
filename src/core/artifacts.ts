import type { IssueRelationship } from '../types.js'
import type { SelectedRuntime } from './project-version.js'
import { CHANGE_DOCUMENT_SCHEMA, renderDocumentSectionHeading, renderDocumentTitle } from './document-model.js'
import { markdownTopLevelComments } from './markdown.mjs'
import { exactInvocation, SOURCE_INVOCATION } from './project-version.js'

const RSP_AGENTS_BEGIN = '<!-- rsp:begin -->'
const RSP_AGENTS_END = '<!-- rsp:end -->'

/** Generate a change file content from the built-in single-file template. */
export function generateChangeContent(name: string, summary = '', kind?: string, options: { issues?: IssueRelationship[] } = {}): string {
  const placeholder = '<…>'
  const proposalSummary = summary || placeholder
  const issueFrontmatter = renderIssueFrontmatter(options.issues ?? [])

  if (name === 'project-setup') {
    return `---
kind: ops
${issueFrontmatter}---

${renderDocumentTitle(CHANGE_DOCUMENT_SCHEMA, 'project-setup')}

${changeSectionHeading('proposal')}
- Outcome: ${proposalSummary}
- Why:
  - ${placeholder}
- Scope:
  - ${placeholder}
- Non-goals:
  - ${placeholder}

${changeSectionHeading('spec')}
### ADDED
- Requirement: ${placeholder}
  - ${placeholder}

### Acceptance
#### Scenario: ${placeholder}
- GIVEN ${placeholder}
- WHEN ${placeholder}
- THEN ${placeholder}

${changeSectionHeading('design')}
- Approach:
  - ${placeholder}
- Boundaries:
  - ${placeholder}
- Affected areas:
  - .rsp/specs/design.md
  - CONTEXT.md
  - AGENTS.md
- Durable outcome targets:
  - Current facts: ${placeholder}
  - Lasting rationale: ${placeholder}
- Constraints:
  - ${placeholder}

${changeSectionHeading('tasks')}
- [ ] .rsp/specs/design.md: ${placeholder}
- [ ] CONTEXT.md: ${placeholder}
- [ ] AGENTS.md: ${placeholder}

${changeSectionHeading('verify')}
### Required
- Automated:
  - [ ] rsp doctor — proves: ${placeholder}
### Optional
- Manual or environment:
  - [ ] ${placeholder}
- Coverage:
  - ${placeholder}

${changeSectionHeading('blockers')}
- none
`
  }

  const frontmatterKind = kind ?? '<choose: feature | fix | refactor | docs | ops | research>'
  const template = getChangeTemplateByKind(kind)
  return `---
kind: "${frontmatterKind}"
${issueFrontmatter}---

${renderDocumentTitle(CHANGE_DOCUMENT_SCHEMA, name)}

${changeSectionHeading('proposal')}
- Outcome: ${proposalSummary}
- Why:
  - ${template.why}
- Scope:
  - ${template.scope}
- Non-goals:
  - ${template.nonGoals}

${changeSectionHeading('spec')}
${template.specSection}

### Acceptance
${template.acceptanceSection}

${changeSectionHeading('design')}
- Approach:
  - ${template.approach}
- Boundaries:
  - ${placeholder}
- Affected areas:
  - ${template.affectedArea1}
  - ${template.affectedArea2}
- Constraints:
  - ${template.constraints}

${changeSectionHeading('tasks')}
- [ ] ${template.task}

${changeSectionHeading('verify')}
### Required
- Automated:
  - [ ] ${template.automatedVerify} — proves: ${placeholder}
### Optional
- Manual or environment:
  - [ ] ${template.manualVerify}
- Coverage:
  - ${placeholder}

${changeSectionHeading('blockers')}
- none
`
}

function renderIssueFrontmatter(issues: IssueRelationship[]): string {
  if (issues.length === 0)
    return ''
  return `issues:\n${issues.map(issue => `  - url: ${JSON.stringify(issue.url)}\n    relation: ${issue.relation}`).join('\n')}\n`
}

function getChangeTemplateByKind(kind?: string) {
  const placeholder = '<…>'
  const delta = kind === 'feature' || kind === 'research' || kind === undefined ? 'ADDED' : 'MODIFIED'
  return {
    why: placeholder,
    scope: placeholder,
    nonGoals: placeholder,
    specSection: `### ${delta}\n- Requirement: ${placeholder}\n  - ${placeholder}`,
    acceptanceSection: `#### Scenario: ${placeholder}\n- GIVEN ${placeholder}\n- WHEN ${placeholder}\n- THEN ${placeholder}`,
    approach: placeholder,
    affectedArea1: placeholder,
    affectedArea2: placeholder,
    constraints: placeholder,
    task: placeholder,
    automatedVerify: placeholder,
    manualVerify: placeholder,
  }
}

function changeSectionHeading(sectionId: typeof CHANGE_DOCUMENT_SCHEMA.sections[number]['id']): string {
  const guidance = {
    proposal: 'State the intended outcome, why it matters, scope, and non-goals; do not narrate execution.',
    spec: 'Describe the contract delta and acceptance conditions, referencing affected existing Specs; do not copy the full baseline or implementation steps.',
    design: 'Explain the approach, responsibility boundaries, and necessary tradeoffs; keep simple changes brief and avoid repeating requirements or tasks.',
    tasks: 'List checkable work and mark completion only after outcomes exist; prescribe order only where correctness, safety, or migration requires it.',
    verify: 'Connect acceptance to verification methods; after execution retain actual results, gaps, and limits, not command transcripts.',
    blockers: 'Name unresolved decisions or dependencies that prevent progress; use none when there are no blockers.',
  }
  return `${renderDocumentSectionHeading(CHANGE_DOCUMENT_SCHEMA, sectionId)}
<!-- ${guidance[sectionId]} -->`
}

/** Render the managed RSP block for AGENTS.md. */
export function renderRspAgentsBlock(runtime: SelectedRuntime): string {
  const { version } = runtime
  const selection = runtime.mode === 'source'
    ? `This RSP development checkout explicitly selects source mode through \`.rsp/source\`. Build the current source with \`mise exec -- pnpm run build\`, then use \`${SOURCE_INVOCATION} <command>\` from this checkout for every CLI operation. Skill examples use \`rsp\` as shorthand for this local invocation. Do not substitute a registry package, global CLI or another checkout, even when its version matches. Package version metadata is not source identity; retain the commit, uncommitted diff and build inputs for candidate evidence. Authorized \`update\` reconciles this checkout's managed environment from its local source and keeps source mode; it does not select a published version.`
    : `This project pins RSP \`${version}\` in \`.rsp/version\`. For every CLI operation use \`${exactInvocation(version)} <command>\` (or a verified executable of that exact version). Skill examples use \`rsp\` as shorthand for this selected invocation. Never substitute \`@latest\`, a version range, or an unverified global CLI. Package fetching requires authority; if unavailable, report the gap. Only an authorized upgrade uses a deliberately selected target CLI with \`update\`; it updates the complete managed environment. Notices grant no upgrade authority.`
  return `${RSP_AGENTS_BEGIN}
## RSP Entry

RSP tracks current work, stable specs, and archives under \`.rsp/\`.

Use supplied or confirmed paths; discover only missing paths or applicable ancestor instructions, without overlapping whole-tree scans:
1. Nearest \`AGENTS.md\` for project or module instructions.
2. Root \`CONTEXT.md\` if present, then the relevant nearest \`CONTEXT.md\` for domain language, relationships, and navigation. If a legacy \`CONTEXT-MAP.md\` remains, retain its relevant context and use Core's context-migration branch; discovery alone does not authorize migration.
3. Establish the request's scope, authority and existing owner. A clear bounded request selecting one capability with sufficient owner facts loads that project Skill directly from \`.agents/skills/\`, without a Core or Focus preflight. For tracked work read the selected Change; for grouped work read its sibling Group Brief first. Read only relevant Specs and Decision Records under the configured authoritative path.
4. Load \`rsp\` at \`.agents/skills/rsp/SKILL.md\` for unresolved routing or ownership, actual cross-capability coordination, or lifecycle operations. Read \`.rsp/focus.d/\` only when needed to resolve or recover the owner; marker paths are open-work candidates and optional bounded Markdown is recovery guidance, not authority. An explicit WorkRef or the user's mentioned Change selects first; otherwise use current status and dependency evidence.

Direct capability invocation does not make tracked work untracked. Preserve existing Changes, required tracking prerequisites, Group dependencies, independent review and permission boundaries; missing prerequisites stop dependent work. Skills are the only workflow: hosts may discover them or read them directly, but a missing or unusable required Skill stops dependent work and must be reported as an incomplete installation. Do not use retired Rules or install implicitly.
Do not treat \`.rsp/specs/\` or \`.rsp/changes/\` as replacements for nearest \`AGENTS.md\` or \`CONTEXT.md\`.

${selection}
${RSP_AGENTS_END}`
}

/** Update AGENTS.md with the managed RSP block while preserving user content. */
export function upsertRspAgentsBlock(content: string, runtime: SelectedRuntime): { content: string, changed: boolean } {
  const block = renderRspAgentsBlock(runtime)
  const span = rspAgentsBlockSpan(content)
  if (span) {
    const next = content.slice(0, span.start) + block + content.slice(span.end)
    return { content: next, changed: next !== content }
  }
  const next = content ? `${block}\n\n${content}` : `${block}\n`
  return { content: next, changed: true }
}

export function hasRspAgentsBlock(content: string): boolean {
  return rspAgentsBlockSpan(content) !== null
}

function rspAgentsBlockSpan(content: string): { start: number, end: number } | null {
  let start: number | undefined
  for (const comment of markdownTopLevelComments(content)) {
    if (comment.source === RSP_AGENTS_BEGIN && start === undefined)
      start = comment.start
    if (comment.source === RSP_AGENTS_END && start !== undefined)
      return { start, end: comment.end }
  }
  return null
}

export function generateDesignContent(projectName: string): string {
  const placeholder = '<…>'
  return `# Project Design: ${projectName}

## Purpose
<!-- Define the system's purpose and consumers, not the current change. -->
- ${placeholder}

## Boundaries
<!-- Define system responsibilities, exclusions, and responsibility handoffs. -->
- In scope:
  - ${placeholder}
- Out of scope:
  - ${placeholder}

## Contracts
<!-- State current architectural obligations and invariants that must survive implementation changes. -->
- ${placeholder}

## Structure
<!-- Describe stable ownership and dependency direction; leave repository navigation to CONTEXT.md. -->
- ${placeholder}

## Constraints
<!-- Record necessary technical, security, protocol, or compatibility limits; link lasting rationale rather than duplicating it. -->
- ${placeholder}
`
}

export function generateSpecContent(name: string): string {
  const title = name.split(/[-/]/g).filter(Boolean).map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
  const placeholder = '<…>'
  return `# ${title}

## Purpose
<!-- Define the capability, its consumers, and its value; do not describe this change. -->
- ${placeholder}

## Boundaries
<!-- Define responsibilities, exclusions, and handoffs to other capabilities. -->
- In scope:
  - ${placeholder}
- Out of scope:
  - ${placeholder}

## Contracts
<!-- State current behavior, inputs and outputs, invariants, and failure semantics by capability, not internal implementation steps. -->
- ${placeholder}

## Scenarios
<!-- Clarify key cross-boundary, failure, or ambiguous behavior with a few examples; omit when unnecessary and keep test execution results in the Change. -->
- ${placeholder}

## Constraints
<!-- Record necessary technical, protocol, security, or compatibility limits; do not repeat behavior requirements or decision rationale. -->
- ${placeholder}
`
}
