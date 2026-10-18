---
kind: "refactor"
summary: "Narrow recovery reference loading while retaining resume safeguards"
---

# Change: narrow-recovery-reference-loading

## Proposal

Separate same-session worker continuation from Capsule-specific loading in the two recovery references. The rule-loading follow-up in research/reports/2026-10-18T10-37-23Z.md identifies broad triggers, not a proven token saving. Limit product edits to coordination-recovery.md and focus-continuation.md; preserve existing candidates and historical inputs. No Core/Commit entrypoint, scoring, task, model execution, adoption or release change.

## Spec

### MODIFIED

- Requirement: Same-session worker continuation alone does not require Focus/Capsule content. Recovery still establishes authority, drift, evidence applicability, safe replay and native cessation before dispatch.
- Requirement: A needed durable recovery snapshot, actual Capsule inspection/replacement or portable continuation handoff still reaches the existing Focus contract. Cross-session/device recovery retains current authority, state, conflicting resources and host qualification checks.
- Existing workflow ownership and recovery constraints in .rsp/specs/workflow.md remain binding.

### Acceptance

#### Scenario: Direct same-session worker continuation
- GIVEN no Capsule operation or portable handoff is needed
- WHEN a worker resumes after observed cessation
- THEN recovery and coordination supply required safeguards without loading Capsule-only format.

#### Scenario: Capsule and cross-session recovery
- GIVEN a real Capsule operation, portable handoff or cross-session recovery
- WHEN the applicable recovery branch is selected
- THEN existing format, provenance, authority, drift, evidence and replay checks remain reachable; no worker summary substitutes for host evidence.

## Design

Narrow the two reference triggers. Expose same-session safety checks directly on the recovery path, retaining their current Focus occurrence for callers using that branch. Preserve the portable handoff contract and cross-session safeguards. No new shared file, runtime wrapper, prompt candidate or exact-prose test. Current-fact writeback: existing .rsp/specs/workflow.md already requires obligation-based loading and .rsp/specs/work-model.md makes Capsules conditional; neither is stale. No new Decision Record is warranted for this reversible trigger clarification. The existing research retains the prior observations; the authored references own the changed method.

## Tasks

- [x] Revise only the two authored reference files.
- [x] Trace direct continuation, actual Capsule and cross-session paths statically.
- [x] Run package/resource, document and relevant offline checks; retain limits.

## Verify

### Required

- [x] Static reading-path audit: direct continuation avoids Capsule-only content; actual Capsule and cross-session paths preserve safeguards.
- [x] Skill package check, context reachability diagnostic, lint and docs check.
- [x] Existing evidence-reading regression and selected offline task schema checks; no model or judge execution.
- [x] Independent Document/Skill review of the exact references and reading paths: clean; evidence in tests/skills/reports/recovery-loading-review-20261018T132850Z/independent-review.json.

Results: all Required offline checks passed. Evidence: tests/skills/reports/recovery-loading-offline-20261018T132136Z/. Static paths were author-inspected and subsequently independently reviewed as clean. Review reused unchanged offline checks; schema logs establish two valid tasks without naming them, so no broader coverage is claimed. Package check passed for seven packages; all 15 Core Markdown resources are reachable. Four existing evidence-reading tests and two task schemas passed; lint and docs passed. Historical records and frozen inputs remain unchanged. Model loading and token effects remain unverified.

### Optional

- Real-model loading behavior and cost effect remain unverified and are not authorized in this stage. Static results cannot establish behavioral acceptance.

## Blockers

- none
