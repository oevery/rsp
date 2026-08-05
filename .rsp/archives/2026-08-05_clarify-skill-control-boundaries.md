---
kind: "refactor"
---

# Change: clarify-skill-control-boundaries

## Proposal
- Outcome: Clarify Core, Shape, Manage, and Commit responsibility boundaries
- Why:
  - The current control flow is sound, but `OwnershipDisposition` mixes successful ownership resolution with Shape routing and stop reasons.
  - Core direct execution and Manage commit ownership use wording that can imply product mutation or exact Git execution belongs to the controller.
  - The generic term `owner` is overloaded across durable work, human decisions, and transient control handoff.
- Scope:
  - Clarify the canonical control model and default Skill contracts.
  - Remove the redundant `OwnershipDisposition` enum and express successful resolution as a ready `WorkOwner`.
  - Reserve Core mutation for RSP control-plane actions and route product mutation through Implement or a bounded Discipline fallback.
  - Assign commit eligibility and orchestration to Manage while retaining exact commit execution in `rsp-commit`.
  - Update contract tests and generated project Skill projections.
- Non-goals:
  - Changing Manage qualification, closeout policy, worker limits, or lifecycle authority.
  - Merging Core, Shape, or Manage, or adding persisted controller state.
  - Granting commit, push, publication, deployment, approval, or human-acceptance authority.

## Spec
### MODIFIED
- Requirement: Control outcomes distinguish durable work ownership from decision and execution handoffs.
  - `WorkOwner` means the selected Change or shallow Group; `DecisionOwner` means the human or authority source required for a material decision; `NextOwner` means the next control or execution capability.
  - Shape returns a ready `WorkOwner` to Core without a separate ownership enum.
  - Missing or non-ready ownership uses Core `RouteDisposition: shape`; managed frontier fog uses `StopDisposition: return-to-shape`.
- Requirement: Direct routing does not make Core a product implementer.
  - Core may directly mutate only RSP control-plane state within its existing authority.
  - Product mutation under a direct route belongs to Implement or the same bounded manual Discipline action.
- Requirement: Manage coordinates commit eligibility but does not execute the exact commit procedure.
  - Manage derives commit eligibility, timing, and the handoff envelope.
  - `rsp-commit` owns exact staging, message construction, one local commit, and post-commit observation.

### Acceptance
#### Scenario: Non-ready ownership routes without overlapping ownership states
- GIVEN Core cannot identify one shape-ready Change or shallow Group
- WHEN it derives the next route
- THEN it uses `RouteDisposition: shape` or a canonical stop without emitting `OwnershipDisposition: return-to-shape`

#### Scenario: Shape returns a durable work owner
- GIVEN Shape passes its ready gate
- WHEN it returns control
- THEN it identifies the ready `WorkOwner`, decisive evidence, `NextOwner: Core`, and fresh route derivation

#### Scenario: Direct product work has one execution owner
- GIVEN Core selects a bounded direct route
- WHEN the route includes product mutation
- THEN Implement or its bounded manual fallback executes the mutation while Core retains route derivation

#### Scenario: Commit responsibilities remain separate
- GIVEN a qualified Manage run derives an eligible local commit boundary
- WHEN commit work begins
- THEN Manage supplies the envelope and `rsp-commit` exclusively owns exact local commit execution

## Design
- Approach:
  - Remove `OwnershipDisposition` from the canonical control vocabulary and replace its successful case with explicit `WorkOwner` readiness evidence.
  - Keep `RouteDisposition`, `FrontierDisposition`, `StopDisposition`, `AcceptanceDisposition`, and `CloseoutEligibility` because each represents a distinct control phase.
  - Update authored Skills, normative Specs, and exact-string contract fixtures together.
- Boundaries:
  - Core remains the route and reroute owner.
  - Shape remains planning-only and always returns a ready WorkOwner to Core.
  - Manage remains the selected-goal controller and never absorbs required worker or Commit execution.
  - Change and Group remain the only durable work owners.
- Affected areas:
  - `.rsp/specs/skill-control-model.md` and `.rsp/specs/skill-system.md`
  - `skills/rsp`, `skills/rsp-shape`, `skills/rsp-manage`, and related references
  - Paired English and Simplified Chinese public Skills guidance
  - Skill contract tests and self-hosted generated projections
  - A fresh immutable Manage beta generation for the changed prompt identity
- Constraints:
  - Preserve all existing authority ceilings, fail-closed stops, and progressive-disclosure behavior.
  - Do not edit `.agents/skills/` directly.

## Tasks
- [x] Clarify the normative control vocabulary and module boundaries.
- [x] Update authored Core, Shape, Manage, and routing Skill text.
- [x] Update contract tests, confirm live symlink projections, retain a fresh Manage beta generation, and run project verification.

## Verify
- Automated:
  - [x] `node dist/cli.mjs check --focused` — passed; the focused Change is structurally valid.
  - [x] `mise exec -- pnpm run build` — passed; authored package sources compile and the generated CLI remains valid.
  - [x] `mise exec -- pnpm run lint` and `mise exec -- pnpm run typecheck` — passed; implementation and contract changes satisfy static checks.
  - [x] `mise exec -- pnpm run test` — passed: 55 files and 661 tests; Skill, beta-evidence, and control-model contracts remain coherent.
  - [x] `mise exec -- pnpm run docs:check` — passed: 7 bilingual page pairs and 29 Markdown files.
  - [x] `node scripts/managed-controller-beta.mjs run --model ocx/gpt-5.6-terra --effort high --output-root .cache/rsp-manage-beta-2026-08-05-control-boundaries --timeout-ms 600000` — passed; baseline and product satisfied the fixed pause-resume holdout with no unauthorized paths.
- Manual or environment:
  - [x] Independent read-only Verify receipt passed after one evidenced correction; `OwnershipDisposition` and prior Core/Commit wording have zero active-surface matches, and `WorkOwner`, `DecisionOwner`, and `NextOwner` are distinct.
  - [x] Final diff inspection confirms `.agents/skills/` remains a live symlink projection of authored `skills/` sources and no direct projection edit occurred.
- Coverage:
  - Normative model, authored Skills, public bilingual guidance, live project projections, exact-string behavior contracts, and a fresh immutable Manage beta generation.

## Blockers
- none
