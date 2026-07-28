---
kind: "feature"
---

# Change: harden-adoption-routing/rederive-scope-escalation

## Proposal
- Outcome: Direct engineering rederives RSP routing before later mutation when a multi-turn task materially expands beyond its original tiny/small boundary.
- Why:
  - A small icon assessment grew into cross-platform assets, runtime repair, installer diagnostics, real-host packaging, and delivery without ever gaining a Change owner.
- Scope:
  - Add a continuation-time scope-escalation trigger and focused multi-turn routing coverage.
- Non-goals:
  - Do not force a Change for ordinary follow-ups that remain tiny/small, or persist transcript chronology.

## Spec
<!-- Describe observable behavior and requirements. Implementation notes belong in ## Design. -->
### ADDED
- Requirement: direct routes are rederived at mutation boundaries.
  - Before acting on a later user continuation, Core rechecks objective, affected boundaries, validation, lifecycle, and dirty owner state.
  - Material expansion into cross-module implementation, multiple acceptance surfaces, repeated production-path correction, real-host validation, or lifecycle delivery routes through a sufficient Change and fresh Manage qualification.

### Acceptance
#### Scenario: assessment grows into cross-platform delivery
- GIVEN a direct report-only or small task with no Change
- WHEN later turns authorize cross-module implementation plus real-host packaging or repeated production-path corrections
- THEN Core establishes or reuses the smallest sufficient WorkRef before further mutation
- AND reruns Manage qualification without treating the earlier direct route as sticky

## Design
- Approach:
  - Add one compact rederive rule to Core and managed routing, backed by a behavior-oriented multi-turn fixture or contract test.
- Boundaries:
  - Routing only; the continuation remains transient and product authority does not expand.
- Affected areas:
  - `skills/rsp/SKILL.md`
  - `skills/rsp/references/managed-routing.md` and routing evaluation/contract coverage
- Constraints:
  - Trigger from prospective scope/risk, not elapsed time or number of chat messages alone.

## Tasks
- [x] Add scope-escalation rederivation and its focused regression scenario.

## Verify
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/rsp-core-routing-contract.test.ts` — 13/13 passed; proves later-turn material expansion establishes/reuses a sufficient WorkRef and requalifies Manage while unchanged tiny/small follow-ups stay direct.
  - [x] `mise exec -- pnpm exec vitest run test/managed-controller-contract.test.ts test/rsp-core-routing-contract.test.ts` — 49/50 passed; all current routing assertions passed, and only the immutable retained `rsp-commit` composition hash replay rejected the intentionally changed authored `rsp` Skill identity. Retained evidence was not mutated.
- Manual or environment:
  - [x] Reviewed the prospective trigger against the observed icon and two-file frontend sessions — cross-platform assets, runtime/installer corrections, real-host packaging, and lifecycle delivery escalate; an unchanged bounded two-file frontend correction remains direct.
- Coverage:
  - No provider-specific live replay is required for the portable rule.

## Blockers
- none
