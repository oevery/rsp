---
kind: "refactor"
---

# Change: skill-governance-gap-closure/reconcile-skill-governance-research

## Proposal
- Outcome: Make the accepted Skill governance models accurately describe the current routing and security gate implementation state while preserving their historical decision context.
- Why:
  - The current models still label deterministic routing evaluation and Skill security preflight as deferred even though both mechanisms and their accepted archives now exist.
- Scope:
  - Reconcile current status in `research/models/skill-quality-and-governance.md`, `research/models/rsp-capability-coverage.md`, `research/models/INDEX.md`, and `research/models/upstream-acceptance-decision.md`.
  - Link current status to the accepted routing and security archives where the model already owns implementation-state summaries.
- Non-goals:
  - No rewrite of upstream source reports, original recommendation provenance, or the decisions that were correct when first recorded.
  - No new governance mechanism or product behavior.

## Spec
### MODIFIED
- Requirement: Current implementation summaries shall identify deterministic routing evaluation and Skill security preflight as implemented.
  - Historical recommendation tables may retain their original disposition only when an explicit reconciliation note distinguishes that past decision from current state.
- Requirement: The four governance model surfaces shall not contradict one another about the current Q2 and Q4 status.

### Acceptance
#### Scenario: Later implementation reconciles an earlier defer decision
- GIVEN an accepted model recorded a mechanism as deferred at the time of source distillation
- WHEN the mechanism is later implemented and archived independently
- THEN the model preserves the historical disposition and separately records the current implemented status with evidence

## Design
- Approach:
  - Add or update bounded current-status sections instead of rewriting historical recommendation rows.
  - Use the accepted archives as the implementation evidence and keep current facts in the model summaries that already own them.
- Boundaries:
  - Research models summarize current adoption; upstream reports remain immutable inputs and archives remain historical implementation evidence.
- Affected areas:
  - `research/models/skill-quality-and-governance.md`
  - `research/models/rsp-capability-coverage.md`
  - `research/models/INDEX.md`
  - `research/models/upstream-acceptance-decision.md`
- Constraints:
  - Do not imply Q2 or Q4 was implemented at the earlier acceptance-decision date.

## Tasks
- [x] Inspect the four model roles and the accepted routing/security archives.
- [x] Reconcile current status without rewriting historical provenance.
- [x] Run research/model consistency checks and inspect the exact diff.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm run docs:check`, focused stale-status search, `node dist/cli.mjs check`, and scoped `git diff --check` — passed; proves: changed durable artifacts remain structurally valid, links remain valid, and only explicitly historical Q2/Q4 defer statements remain.
  - [x] `mise exec -- pnpm run release:acceptance` — passed on 2026-08-20: 9/9 stages, 86/86 test files, 860/860 tests, and packed installed-package workflows. Report: `.cache/release-acceptance/20260820T003524262Z-a8fc9ba4ff-36544/report.md`.
  - [x] Fixed-scope Document review — clean; historical dispositions, current implementation facts, archive links, and cross-model consistency were checked with no findings.
### Optional
- Manual or environment:
  - [x] Reviewed the final wording against the two accepted archives; current implementation dates and historical acceptance-time dispositions remain distinct.
- Coverage:
  - This Change proves model reconciliation only; it does not revalidate the routing or security implementation itself.

## Blockers
- none
