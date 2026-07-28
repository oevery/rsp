---
kind: "fix"
---

# Change: harden-adoption-routing/gate-qualified-closeout

## Proposal
- Outcome: Manage closeout presets remain dormant unless Core selected and qualified Manage for the current continuation.
- Why:
  - An adoption run declined Manage and still interpreted `manage.closeout: lifecycle` as authority for Core to archive.
- Scope:
  - Add an explicit qualified-Manage gate to Core, Manage, durable review, Specs, and a regression scenario.
- Non-goals:
  - Do not change `manual | lifecycle | local` meanings after Manage qualifies.

## Spec
<!-- Describe expected correct behavior. Implementation notes belong in ## Design. -->
### MODIFIED
- Requirement: closeout presets are controller-scoped.
  - If Manage was declined, unavailable, or never selected for the current continuation, Core only advises lifecycle action and must not execute archive or commit from project policy.
  - Qualified Manage may apply the configured ceiling after durable review and clean-boundary checks.

### Acceptance
#### Scenario: lifecycle policy without qualified Manage
- GIVEN `activation: auto`, `closeout: lifecycle`, and a continuation for which Manage is declined
- WHEN Tasks and verification pass
- THEN Core reports archive readiness and the explicit next action
- AND no archive command is executed from the preset

## Design
- Approach:
  - State the dormant-until-qualified invariant at every closeout entry and lock it with a retained product-style fixture/contract assertion.
- Boundaries:
  - Lifecycle authority only; deterministic readiness remains unchanged.
- Affected areas:
  - `skills/rsp/SKILL.md`, `skills/rsp-manage/SKILL.md`, and their closeout references
  - `.rsp/specs/skill-system.md` and managed-controller contract coverage
- Constraints:
  - Preserve lifecycle closeout for actually qualified Manage and keep Git authority separate.

## Tasks
- [x] Add the qualified-controller invariant and regression coverage.

## Verify
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/managed-controller-contract.test.ts test/rsp-core-routing-contract.test.ts` — 48/49 passed; the focused Core/Manage closeout and composition contracts pass, while one unrelated retained `rsp-commit` replay rejects the intentionally changed Core composition hash as designed.
- Manual or environment:
  - [x] Read Core, managed routing, durable review, Manage, and the Skill System Spec as one route — declined, unavailable, or unselected Manage leaves presets dormant; after current-continuation qualification, existing `manual | lifecycle | local` behavior remains.
- Coverage:
  - Host-level denial remains host-owned.
  - Retained composition evidence is immutable and now stale for the changed Core hash; a new retained run belongs to the final integrated prompt boundary rather than this focused Change.

## Blockers
- none
