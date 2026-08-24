---
kind: "refactor"
---

# Change: skill-context-concision/release-acceptance-progressive-disclosure

## Proposal
- Outcome: The maintainer release-acceptance entrypoint selects one acceptance mode and loads only that mode's procedure.
- Why:
  - The current entrypoint always loads four mutually exclusive procedures, including a large provider-comparison and replay branch.
- Scope:
  - `.agents/skills/release-acceptance/SKILL.md`
  - New directly linked mode references under `.agents/skills/release-acceptance/references/`
  - Maintainer Skill contract tests
- Non-goals:
  - Change acceptance commands, scenario counts, evidence semantics, release authority, or provider-cost authorization.

## Spec
### MODIFIED
- Requirement: The entrypoint must retain mode classification, shared resource sequencing, provider-observation policy, failure handling, and external-action stops.
  - Each mutually exclusive mode procedure must be directly linked and loaded only after its trigger is established.

### Acceptance
#### Scenario: Deterministic acceptance does not load provider comparison
- GIVEN a general release-readiness decision without provider comparison authority
- WHEN the Skill selects deterministic acceptance
- THEN it loads only the deterministic procedure and preserves all existing deterministic gates.

#### Scenario: Provider comparison remains fail-closed
- GIVEN an explicitly authorized routing comparison
- WHEN the provider-comparison reference is loaded
- THEN baseline, candidate, replay, observability, identity, and failure boundaries remain equivalent.

## Design
- Approach:
  - Keep a concise four-mode selector in `SKILL.md`; move each complete procedure into one directly linked reference.
- Boundaries:
  - Classification precedes reference loading; references own mechanics, evidence interpretation, and mode-specific stops.
- Affected areas:
  - `.agents/skills/release-acceptance/`
  - `test/tooling/release-acceptance-skill.test.ts`
- Constraints:
  - Preserve exact commands and observable gates; create no new receipt or persisted state.

## Tasks
- [x] Create directly linked references for deterministic, behavior, comparison, and exact-candidate modes.
- [x] Reduce the entrypoint to classification and shared contracts.
- [x] Strengthen tests for direct reachability, conditional loading, and preserved semantic units.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/tooling/release-acceptance-skill.test.ts` — 3 tests passed; mode routing and provider-observation contracts remain intact.
  - [x] `node .agents/skills/author-rsp-skills/scripts/scan-skill-context.mjs` — all five package Markdown files are reachable; exact repeated prose remains one corpus-wide group.
### Optional
- Manual or environment:
  - [ ] Provider-backed campaign — omitted unless an exact release candidate and provider-cost authority exist.
- Coverage:
  - Entry point reduced from 1,578 to 403 words. Structure and semantic contracts passed; live provider behavior remains release-candidate evidence.

## Blockers
- none
