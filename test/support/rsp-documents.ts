export function renderChange(name: string, extra = '') {
  return `---
kind: feature
---

# Change: ${name}

## Proposal
- Summary: ${name} summary
- Why:
  - because
- Scope:
  - ship ${name}
- Non-goals:
  - none

## Spec
### ADDED
- Requirement: ${name}
  - ${name} behavior

### Acceptance
#### Scenario: ${name}
- GIVEN a project
- WHEN ${name} runs
- THEN it works

## Design
- Approach:
  - implementation details
- Affected areas:
  - src/${name}.ts
- Constraints:
  - keep it small

## Tasks
- [ ] implement ${name}

## Verify
- Automated:
  - [ ] run tests
- Manual:
  - [ ] smoke test ${name}
- Durable updates:
  - [ ] decide whether this change produced durable knowledge for .rsp/specs/ or stable instructions for the nearest project-owned AGENTS.md
  - [ ] if yes, update the smallest correct target before archive

## Blockers
- none
${extra}`
}

export function renderGeneratedIndexMetadata(indexType: 'specs' | 'archives') {
  const title = indexType === 'specs' ? 'Specs Index' : 'Archive Index'
  const sourceDir = indexType === 'specs' ? '.rsp/specs' : '.rsp/archives'

  return `---
title: ${title}
summary: ${indexType === 'specs' ? 'Additional project-level specs beyond design.md.' : 'Completed RSP changes.'}
kind: generated-index
index_type: ${indexType}
source_dir: ${sourceDir}
entry_count: 0
---

# ${title}
`
}

export function renderGroupBrief(group: string, slices: string[], options: { complete?: boolean, blockers?: string } = {}) {
  const sliceLines = slices.map(name => `- \`${name}\`: independently executable ${name.split('/').at(-1)} slice`).join('\n')
  return `---
kind: group
---

# Change Group: ${group}

## Goal
- Ship ${group}

## Scope
- Coordinate the declared slices

## Shared Constraints
- Keep every slice independently verifiable

## Slices
${sliceLines}

## Completion Conditions
- [${options.complete ? 'x' : ' '}] End-to-end behavior is verified

## Durable Outcomes
- none

## Blockers
- ${options.blockers ?? 'none'}
`
}
