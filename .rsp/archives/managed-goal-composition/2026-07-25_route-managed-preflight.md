---
kind: "fix"
---

# Change: managed-goal-composition/route-managed-preflight

## Proposal
- Outcome: Route unshaped managed goals through owner resolution.
- Why:
  - Core applies the Manage eligibility gate before its no-owner Shape route, so a clear managed-completion request stops merely because no focused ready Change exists.
- Scope:
  - Resolve the smallest sufficient owner before Manage qualification.
  - Treat an explicit managed-completion request as authority to create in-scope RSP planning artifacts unless the user requests no edits.
  - Route tiny settled work directly, clear non-trivial work through Shape, and material ambiguity to one Shape owner decision.
- Non-goals:
  - Do not grant lifecycle, Git, publication, deployment, approval, or human-acceptance authority.
  - Do not make managed routing implicit.

## Spec
### MODIFIED
- Requirement: managed requests resolve an owner before eligibility is evaluated.
  - Existing unambiguous ready owners are reused.
  - Tiny settled work returns to direct engineering without a synthetic Change or controller artifacts.
  - Clear non-trivial work with no sufficient owner invokes Shape and continues after the resulting Change or Group is ready.
  - Material product, acceptance, selection, or scope ambiguity stops at Shape with the highest-impact owner decision.

### Acceptance
#### Scenario: a clear managed goal has no Change
- GIVEN an explicit managed-completion request whose non-trivial outcome, scope, authority, and acceptance are sufficiently clear
- AND no existing Change owns the work
- WHEN Core derives the next action
- THEN it invokes Shape to create the smallest sufficient owner and re-evaluates Manage without requiring another authorization round

#### Scenario: owner intent remains material
- GIVEN an explicit managed-completion request with a decision that can change behavior or acceptance
- WHEN repository evidence cannot settle that decision
- THEN Shape asks the smallest highest-impact owner question
- AND no implementation or controller artifact is created

## Design
- Approach:
  - Move managed owner resolution before the focused-ready eligibility test in Core and its fallback protocol.
  - Keep Manage responsible for executing ready owners, not for inventing product decisions or shaping artifacts itself.
- Boundaries:
  - Core owns preflight and routing; Shape owns durable owner selection; Manage owns eligible execution.
- Affected areas:
  - `skills/rsp/SKILL.md`, `rules/rsp-rules.md`, and focused routing fixtures.
- Constraints:
  - No bare create/focus stop when the request supplies clear in-scope artifact authority.
  - Existing review, release, diagnosis, TDD, and durable-decision precedence remains intact.

## Tasks
- [x] Reorder Core and fallback managed routing around an explicit owner-resolution preflight.
- [x] Add deterministic clear, ambiguous, and tiny no-owner routing coverage.

## Verify
- Automated:
  - [x] `mise exec -- pnpm vitest run test/rsp-core-routing-contract.test.ts test/assisted-loop.test.ts` (2 files, 10 tests passed) — proves: owner resolution precedes Manage qualification without weakening authority boundaries.
- Manual or environment:
  - [x] Inspected the final Skill/fallback route against the observed no-Change interruption — proves: a clear managed request now authorizes in-scope Shape artifacts and requalification without a redundant round.
- Coverage:
  - Actual model composition is covered by the Group completion scenario; this child retains deterministic routing contracts.

## Blockers
- none
