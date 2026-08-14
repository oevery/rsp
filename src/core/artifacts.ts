import type { IssueRelationship } from '../types.js'
import { CHANGE_DOCUMENT_SCHEMA, renderDocumentSectionHeading, renderDocumentTitle } from './document-model.js'

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
  return renderDocumentSectionHeading(CHANGE_DOCUMENT_SCHEMA, sectionId)
}

/** Render the managed RSP block for AGENTS.md. */
export function renderRspAgentsBlock(): string {
  return `${RSP_AGENTS_BEGIN}
## RSP Entry

RSP tracks current work, stable specs, and archives under \`.rsp/\`.

Read in order:
1. Nearest \`AGENTS.md\` for project or module instructions.
2. Root \`CONTEXT-MAP.md\` if present, then the relevant nearest \`CONTEXT.md\`.
3. Use the project \`rsp\` Skill at \`.agents/skills/rsp/SKILL.md\`; hosts may load it through Skill discovery or read it directly. Only when it is absent or cannot be used, read \`.rsp/rsp-rules.md\` as the fallback protocol.
4. \`.rsp/focus.d/\`; marker paths select work, while optional bounded Markdown content is recovery guidance only. For grouped work read the sibling Group Brief, then the explicitly selected focused Change.
5. Only the relevant Specs and Decision Records under the configured authoritative path.

If \`.rsp/focus.d/\` is empty and the user has not provided a concrete task, ask what to work on or suggest \`npx -y @oevery/rsp create <name>\` for tracked work.
Do not treat \`.rsp/specs/\` or \`.rsp/changes/\` as replacements for nearest \`AGENTS.md\` or \`CONTEXT.md\`.
${RSP_AGENTS_END}`
}

/** Update AGENTS.md with the managed RSP block while preserving user content. */
export function upsertRspAgentsBlock(content: string): { content: string, changed: boolean } {
  const block = renderRspAgentsBlock()
  const managedRe = /<!-- rsp:begin -->[\s\S]*?<!-- rsp:end -->/
  if (managedRe.test(content)) {
    const next = content.replace(managedRe, block)
    return { content: next, changed: next !== content }
  }
  const trimmed = content.trimStart()
  const next = trimmed ? `${block}\n\n${trimmed}` : `${block}\n`
  return { content: next, changed: true }
}

export function hasRspAgentsBlock(content: string): boolean {
  return content.includes(RSP_AGENTS_BEGIN) && content.includes(RSP_AGENTS_END)
}

export function generateDesignContent(projectName: string): string {
  const placeholder = '<…>'
  return `# Project Design: ${projectName}

## Purpose
- ${placeholder}

## Stable Facts
- ${placeholder}

## Boundaries
- In scope:
  - ${placeholder}
- Out of scope:
  - ${placeholder}

## Structure
- ${placeholder}

## Constraints
- ${placeholder}
`
}

export function generateSpecContent(name: string): string {
  const title = name.split(/[-/]/g).filter(Boolean).map(part => part.charAt(0).toUpperCase() + part.slice(1)).join(' ')
  const placeholder = '<…>'
  return `# ${title}

## Purpose
- ${placeholder}

## Stable Facts
- ${placeholder}

## Boundaries
- In scope:
  - ${placeholder}
- Out of scope:
  - ${placeholder}

## Constraints
- ${placeholder}
`
}
