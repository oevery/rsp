---
kind: "refactor"
---

# Change: skill-context-concision/release-docs-finalization-progressive-disclosure

## Proposal
- Outcome: Draft and audit release-document work no longer loads exact-candidate finalization procedure.
- Why:
  - Exact-candidate details are branch-specific and already have a publication lifecycle owner.
- Scope:
  - `skills/rsp-release-docs/SKILL.md`
  - `skills/rsp-release-docs/references/publication-lifecycle.md`
  - Release Docs contract tests
- Non-goals:
  - Change release identity, ledger projection, credentials, publication authority, or reconciliation behavior.

## Spec
### MODIFIED
- Requirement: The entrypoint must retain finalization/reconciliation branch selection and load publication lifecycle before exact-candidate work.
  - Exact-candidate inventory, consistency, release-commit, readiness, and handoff procedure must live in the publication lifecycle reference.

### Acceptance
#### Scenario: Draft release prose
- GIVEN a version-neutral or confirmed draft without publication handoff
- WHEN Release Docs builds the ledger and surfaces
- THEN exact-candidate finalization detail remains unloaded.

#### Scenario: Finalize publication candidate
- GIVEN a confirmed identity, range, completed implementation closeout, and exact clean candidate
- WHEN Release Docs selects finalization
- THEN it loads publication lifecycle and preserves all readiness and authority boundaries.

## Design
- Approach:
  - Keep the reference trigger in the entrypoint and move the remaining exact-candidate paragraphs beside the existing finalization gate.
- Boundaries:
  - General release evidence and surface projection remain eager; publication-only checks remain conditional.
- Affected areas:
  - `skills/rsp-release-docs/`
  - `test/skills/rsp-release-docs-skill-contract.test.ts`
- Constraints:
  - Preserve credential handling and explicit external-action denials in the entrypoint.

## Tasks
- [x] Move exact-candidate finalization procedure into publication lifecycle.
- [x] Keep entrypoint routing and output handoff concise.
- [x] Update tests to assert ownership in the selected reference.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/skills/rsp-release-docs-skill-contract.test.ts` — 7 tests passed; finalization remains checkable and conditionally owned.
  - [x] `node .agents/skills/author-rsp-skills/scripts/scan-skill-context.mjs` — all five package Markdown files remain reachable.
### Optional
- Manual or environment:
  - [ ] Live publication reconciliation — unavailable without an explicit release operation and external authority.
- Coverage:
  - Entry point reduced from 1,147 to 1,051 words. Static release contracts and the full suite passed; no public release action is part of this Change.

## Blockers
- none
