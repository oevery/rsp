---
kind: "feature"
---

# Change: 3-0-skill-readiness/close-review-resolution-handoff

## Proposal
- Summary: Add a host-neutral review-resolution capability that disposes fixed findings, corrects accepted findings under explicit authority, requires verification and re-review, and returns a recoverable handoff when interrupted.
- Why:
  - `rsp-review` intentionally stops at a report, while the installed suite previously left users to improvise how findings are accepted, disputed, corrected, re-verified, and resumed across context boundaries.
- Scope:
  - Publish `rsp-address-review` as the bounded owner of finding disposition and authorized correction.
  - Define a host-neutral artifact-scoped handoff that points back to existing authorities and can be revalidated on recovery.
  - Add package and behavioral contract coverage and document the stable product surface.
- Non-goals:
  - Changing the report-only behavior of `rsp-review` or the general implementation contract of `rsp-implement`.
  - Adding an autonomous retry loop, controller state, host thread dependency, Git delivery, publication, or new RSP lifecycle state.

## Spec
<!-- Describe observable behavior and requirements. Implementation notes belong in ## Design. -->
### ADDED
- Requirement: Every fixed review Finding receives one evidence-backed disposition before mutation.
  - The only dispositions are `accepted`, `rejected`, and `needs-clarification`; rejected and unclear findings do not authorize edits.
- Requirement: Accepted findings complete only through an authorized bounded correction, fresh verification, and fresh fixed-scope report-only re-review.
  - A failed or unavailable check, remaining finding, new finding, or unresolved clarification prevents a completion claim and cannot trigger an automatic retry loop.
- Requirement: Interrupted review resolution returns a recoverable artifact-scoped handoff.
  - The handoff contains authority and scope pointers, dispositions, changed artifacts, verification and re-review state, pending inputs, and one next action; it is revalidated on recovery and never becomes hidden project state.

### Acceptance
#### Scenario: accepted and disputed findings are resolved without changing reviewer ownership
- GIVEN a fixed `rsp-review` report containing actionable, disproved, and ambiguous Findings for one selected Change
- WHEN the user authorizes review resolution and only the accepted correction is inside mutation scope
- THEN `rsp-address-review` records `accepted`, `rejected`, and `needs-clarification` dispositions with evidence, edits only for the accepted Finding, runs fresh verification, requests a fixed-scope report-only re-review, and returns a handoff for anything still pending

#### Scenario: resolution resumes from a handoff after worktree drift
- GIVEN an earlier Review Resolution Handoff and a changed current worktree
- WHEN resolution resumes
- THEN the capability reopens the authoritative pointers, checks current scope and drift, marks stale verification pending, and continues only the named authorized pass

## Design
- Approach:
  - Add one concise canonical Skill because finding disposition plus correction/re-review ownership is distinct from both report-only review and general Change implementation.
  - Keep the handoff as a returned Markdown contract that is persisted only at an explicitly authorized path; authoritative RSP artifacts remain the source of truth.
  - Enforce portability, authority, disposition, verification, re-review, recovery, and no-hidden-state boundaries through deterministic contract tests.
- Affected areas:
  - `skills/rsp-address-review/SKILL.md`
  - `test/rsp-address-review-contract.test.ts`
  - `test/skill-contract.test.ts`
  - `README.md`
  - `.rsp/specs/design.md`
- Constraints:
  - `rsp-review` remains report-only and does not modify files; the resolver does not modify the original report to manufacture a clean result.
  - Canonical behavior cannot require host threads, subagents, hooks, proprietary resume features, or persistent controller state.
  - Git, publication, deployment, approval, deletion, and external actions remain separately authorized.

## Tasks
- [x] Finalize the proposal, spec, and design details for this change
- [x] Publish `rsp-address-review` with disposition, correction, verification, re-review, and recovery contracts
- [x] Add portable package and hard-boundary contract tests
- [x] Update README and durable design truth for the fifth published Skill

## Verify
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/rsp-address-review-contract.test.ts test/skill-contract.test.ts` — 2 files and 8 tests passed
  - [x] `mise exec -- pnpm run lint` — repository lint passed after sibling fixtures converged
  - [x] `node dist/cli.mjs check` — all 4 open Change files valid
- Manual:
  - [x] Inspected the canonical Skill against a fixed mixed-finding walkthrough: each Finding receives exactly one disposition, only accepted Findings reach mutation, failed verification stops closure, re-review remains a separate report-only checkpoint, and recovery reopens authority and marks stale evidence pending
  - Note: the sibling `validate-assisted-engineering-loop` fresh-context end-to-end run remains a Group completion gate, not an archive condition or claimed result of this slice
- Durable updates:
  - [x] Decide whether this change produced durable knowledge that belongs in `.rsp/specs/` or stable instructions that belong in the nearest project-owned `AGENTS.md`
  - [x] Record the published Skill and stable resolution/handoff boundaries in `.rsp/specs/design.md`; no scoped instruction update is required

## Blockers
- none
