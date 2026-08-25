---
kind: "refactor"
---

# Change: simplify-managed-continuation

## Proposal
- Outcome: Simplify Core and Manage continuation routing
- Why:
  - The current Skill contracts still describe a broad transient handoff and treat `manage.activation: auto` as controller selection only, so a clear implementation request without a ready Change can stop at Shape instead of continuing.
  - Core, Manage, Shape, and leaf Skills repeat routing and state language, increasing context cost and creating return-path leakage.
  - The repository already has durable Change/Group artifacts and response-only ControlOutcome semantics; a second runtime context or persisted controller is unnecessary.
- Scope:
  - Make `rsp` own initial route derivation and boundary rerouting only.
  - Make `rsp-manage` own same-owner continuation, evidence acceptance, review convergence, closeout qualification, and eligible Commit orchestration.
  - Let `manage.activation: auto` complete an authorized Shape → Manage route without requiring a second user request, while preserving authority ceilings.
  - Replace broad handoff/envelope language with minimal transient references and re-read authoritative Change/Group/config evidence at requalification checkpoints.
  - Update authored Skills, stable Specs, documentation, and focused contract tests; audit the fallback safety kernel without making it emulate Manage.
- Non-goals:
  - Do not add a persisted GoalEnvelope, controller record, event ledger, runtime protocol, or new focus/state store.
  - Do not let Manage create, focus, reshape, or silently requalify a durable owner.
  - Do not change push, publication, approval, human-acceptance, worker identity, or host lifecycle authority.
  - Do not change the existing CLI configuration shape or exact local Git transport.

## Spec
### MODIFIED
- Requirement: Core owns outer route and boundary rerouting
  - Core derives one initial route and receives boundary-changing results from Manage or a Discipline. Same-owner implementation, verification, review, and bounded correction remain inside Manage.
- Requirement: Automatic activation can complete the managed acquisition path
  - With `manage.activation: auto`, a clear authorized non-tiny completion request without a ready WorkOwner may route through Shape, return the ready owner to Core, and continue into Manage without another user request. Configuration selects the automatic route; it does not itself grant product, planning, Git, remote, publication, approval, or human-acceptance authority.
- Requirement: Runtime coordination remains transient and minimal
  - No new persisted controller or unified context object is introduced. Handoffs carry only the current WorkRef/Group reference, bounded next action, authority pointer, and decisive result; authoritative facts are reread from Change/Group, Specs, config, checkout, and fresh evidence.
- Requirement: Manage returns to Core only on a real boundary
  - A change in owner identity, WorkRef topology, requested route, declared behavior, acceptance, public interface, scope, mutation authority, or external-action authority returns evidence to Core. Ordinary same-owner receipts do not.

### Acceptance
#### Scenario: Auto activation continues after Shape
- GIVEN `manage.activation: auto`, an authorized clear non-tiny completion request, and no ready WorkOwner
- WHEN Core derives the managed route
- THEN Shape creates the smallest sufficient owner, returns it to Core, and the same request continues into Manage without a repeated user instruction
- AND no product, Git, remote, publication, approval, or human-acceptance authority is inferred from configuration alone

#### Scenario: Same-owner evidence stays in Manage
- GIVEN a selected Manage goal whose owner, topology, scope, behavior, acceptance, and authority remain unchanged
- WHEN Implement, Diagnose, Verify, Review, or Resolve Findings returns evidence
- THEN Manage re-reads only the authoritative facts needed by the checkpoint and continues or stops within its own bounds
- AND Core route selection is not repeated merely because a receipt arrived

#### Scenario: Boundary change returns to Core
- GIVEN a selected Manage goal
- WHEN evidence changes owner identity, topology, route, behavior, acceptance, interface, scope, or authority
- THEN Manage stops further mutation and returns the evidence to Core
- AND Core decides whether to continue, Shape, ask the owner, or stop

## Design
- Approach:
  - Keep the existing response-only `ControlOutcome`; do not add a new receipt family or durable context type.
  - Rewrite Core and managed-routing guidance around two paths: same-owner continuation inside Manage and boundary-changing requalification through Core.
  - Change auto activation from “selection only” to “automatic route completion when the current request independently authorizes planning and product work”; preserve fail-closed authority checks.
  - Keep Shape as the owner creator and return ready WorkOwner to Core; Core immediately rederives the route and may select Manage.
  - Add semantic contract cases for no-owner auto routing, explicit activation, same-owner continuation, boundary reroute, and closeout ceiling differences.
- Boundaries:
  - `rsp`: initial routing, owner/boundary checks, rerouting, and outer response contract.
  - `rsp-shape`: durable Change/Group creation or refinement only.
  - `rsp-manage`: selected-goal loop, evidence acceptance, review convergence, closeout, and Commit orchestration.
  - Leaf Skills: one bounded action and evidence; no recursive routing.
  - `rsp-commit`: exact local Git delivery after Manage determines the delivery boundary.
- Affected areas:
  - `skills/rsp/SKILL.md`, `skills/rsp/references/managed-routing.md`, `skills/rsp-manage/SKILL.md`, `skills/rsp-shape/SKILL.md`, and linked control/closeout references.
  - `rules/rsp-rules.md`, `.rsp/specs/skill-control-model.md`, `.rsp/specs/skill-system.md`, paired Skill documentation, and semantic contract tests.
- Constraints:
  - Edit authored package sources and regenerate projections/fallbacks through the repository workflow.
  - Preserve existing WorkRef, Change, Group, Focus, closeout, and local Commit semantics except for the stated auto-routing behavior.
  - Keep all process state response-only or host-transient; do not introduce a second source of truth.

## Tasks
- [x] Audit current Core/Manage/Shape contracts and identify stale “selection only” and broad-envelope wording.
- [x] Update authored Skills and linked references for minimal handoff and boundary checkpoints.
- [x] Update stable Specs and paired documentation; confirm the fallback safety kernel remains intentionally non-managing.
- [x] Add focused contract coverage for automatic Shape → Manage continuation and boundary rerouting.
- [x] Build projections and run focused checks, typecheck, lint, and relevant tests.

## Verify
### Required
- Automated:
  - [x] Focused Core/Manage/Shape/control-model contract tests — 4 files / 32 tests passed; assisted-loop plus Shape contracts 2 files / 11 tests passed; managed-controller and provider comparison contracts 3 files / 80 tests passed — proves: route ownership, automatic acquisition, same-owner continuation, and boundary return semantics.
  - [x] `mise exec -- pnpm run build` and `node dist/cli.mjs check --focused --json` — build passed; focused Change check reported 0 errors / 0 warnings — proves: package build and focused Change validity.
  - [x] `mise exec -- pnpm run typecheck` and `mise exec -- pnpm run lint` — both passed — proves: source and authored Skill consistency.
  - [x] `git diff --check` — passed — proves: diff hygiene.
### Optional
- Manual or environment:
  - [x] Read final Core/Manage/Shape/commit boundaries for leakage and authority regressions; no new persisted context, controller record, recursive leaf routing, or external-authority expansion was introduced.
- Coverage:
  - No provider replay or host-worker benchmark; runtime coordination remains host-transient and token reduction is not a completion claim.

## Blockers
- none
