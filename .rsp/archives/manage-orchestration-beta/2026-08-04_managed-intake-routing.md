---
kind: "feature"
---

# Change: manage-orchestration-beta/managed-intake-routing

## Proposal
- Outcome: Route every non-small requested goal through a transient Manage Intake under `manage.activation: auto`, so Core can distinguish a ready owner from shaping, owner, and out-of-goal returns without widening authority or bypassing specialist routes.
- Why:
  - Current automatic routing can discover that a selected owner is absent or not ready, but it blends owner resolution, Shape, and managed execution too closely.
  - A no-mutation intake gives non-small requests one consistent entry point while retaining direct treatment for genuinely small work and established specialist disciplines.
- Scope:
  - Define the Core-to-Manage Intake contract and four intake outcomes: `ready`, `needs-shape`, `needs-owner`, and `out-of-goal`.
  - Under `manage.activation: auto`, send non-small requested goals to Intake before Shape or managed execution; under `explicit`, do so only for an explicitly managed request.
  - Preserve direct/specialist bypasses for tiny settled work, fixed-scope Review, release operations, and isolated Pre-Change Design.
  - Return `needs-shape` to Core, invoke Shape serially under independently granted artifact authority, and re-run preflight and qualification after Shape returns a ready owner.
- Non-goals:
  - Do not add a `manage.intake` configuration, persistent intake record, controller ledger, worker dispatch, planning mutation, product mutation, lifecycle action, Git action, or external action to Intake.
  - Do not let Core retain a decision frontier, resolve factual unknowns, classify execution discovery, or plan a Change directly.

## Spec
### ADDED
- Requirement: activation selects the bounded intake path
  - `manage.activation: explicit` selects Manage Intake only when the user explicitly requests managed handling.
  - `manage.activation: auto` selects Manage Intake for every requested completion or continuation that is not a direct/specialist exception and does not satisfy the complete small-work exclusion: one owner, one local seam, one mutation pass, one decisive check, no managed lifecycle coordination, and no ready successor.
  - Invalid or missing configuration continues to fail closed to `explicit` activation; automatic selection grants controller choice only, never planning, mutation, lifecycle, Git, publication, deployment, approval, or human-acceptance authority.
- Requirement: Intake is transient and returns a single owner state
  - Intake reads the requested goal, current selection, current status, relevant owner artifacts, authority envelope, and dirty-path evidence without focusing another owner or mutating any durable or product state.
  - Intake returns exactly one of `ready`, `needs-shape`, `needs-owner`, or `out-of-goal` with decisive evidence and the next owner. It creates no Task, Blocker, worker envelope, frontier, ticket, run record, or synthetic WorkRef.
  - `ready` identifies one selected shape-ready Change or shallow Group and then enters ordinary Manage qualification. `needs-shape` returns to Core for Shape. `needs-owner` returns the one highest-impact material owner decision. `out-of-goal` stops for topology or authority resolution.
- Requirement: Shape is a serial return route, not an Intake capability
  - Core invokes Shape only after `needs-shape` and only when current request or nearer authority independently permits RSP planning-artifact mutation.
  - Shape keeps its normal authority and readiness gates. After it returns a ready owner, Core re-reads status and reruns Intake/preflight and Manage qualification before execution.

### Acceptance
#### Scenario: automatic routing does not bypass shaping
- GIVEN `manage.activation: auto` and a requested non-small goal that lacks a shape-ready owner
- WHEN Core derives the next route
- THEN it selects no-mutation Manage Intake, receives `needs-shape`, invokes Shape only with independently granted artifact authority, and requalifies the returned ready owner before any managed execution

#### Scenario: specialist and tiny routes remain direct
- GIVEN a tiny settled request, a fixed-scope Review, a release operation, or an isolated material design question
- WHEN Core derives the next route under either activation mode
- THEN it preserves the existing direct or specialist route without Intake, worker dispatch, or controller artifact

#### Scenario: an unresolved owner choice remains an owner stop
- GIVEN Intake finds that behavior, acceptance, interface, scope, mutation authority, external action, or human choice is materially unresolved
- WHEN it resolves the requested goal
- THEN it returns `needs-owner` with one required owner input and performs no planning or product mutation

## Design
- Approach:
  - Keep `rsp` a thin policy gateway: after Review, release, Design, and tiny-work exceptions it chooses direct work, a specialist discipline, or Manage Intake.
  - Move owner readiness resolution into the first stage of `rsp-manage`. Intake uses the existing preflight evidence but has no worker or execution responsibilities.
  - Treat Intake's outcome as response-only control flow. Core consumes `needs-shape`; Shape owns topology/planning mutation; Core then repeats routing from fresh evidence.
- Boundaries:
  - `skills/rsp/SKILL.md` owns route order and the Shape return. `skills/rsp/references/managed-routing.md` owns policy qualification. `skills/rsp-manage/SKILL.md` owns transient Intake behavior and only starts execution after `ready`.
  - The selected Change or shallow Group remains the only durable work owner. Existing `rsp-shape`, `rsp-review`, `rsp-release-docs`, and `rsp-design` boundaries remain unchanged.
- Affected areas:
  - `skills/rsp/SKILL.md`, `skills/rsp/references/managed-routing.md`, and `skills/rsp-manage/SKILL.md`
  - `rules/rsp-rules.md`, generated fallback synchronization, and Core/Manage routing contract tests
- Constraints:
  - Do not add an activation sub-switch or persist Intake observations.
  - Core never classifies `fog`, `evidence-needed`, or runtime owner decisions; those belong only to the execution frontier after a `ready` owner is confirmed.
  - Preserve dirty-worktree ownership checks and fail closed when authority, owner identity, or readiness evidence is insufficient.

## Tasks
- [x] Define the direct/specialist exceptions and `explicit`/`auto` Intake selection in Core and managed-routing policy.
- [x] Implement transient Intake return envelopes and Core handling for `ready`, `needs-shape`, `needs-owner`, and `out-of-goal`.
- [x] Route `needs-shape` through existing Shape authority, then re-read status and requalify before execution.
- [x] Synchronize authored fallback rules and update focused routing fixtures without adding persistent control-plane state.

## Verify
- Automated:
  - [x] Focused Core and Manage routing contract tests — `mise exec -- pnpm exec vitest run test/rsp-core-routing-contract.test.ts test/skill-runtime-context-contract.test.ts test/assisted-loop.test.ts` passed 25 tests across 3 files; proves deterministic activation, direct/specialist exceptions, four Intake outcomes, no-mutation Intake, and Shape requalification.
  - [x] Fallback synchronization check — `mise exec -- pnpm run build`, `node dist/cli.mjs update`, and byte comparison of `rules/rsp-rules.md` with `.rsp/rsp-rules.md` passed; proves the self-hosted fallback preserves the authored routing contract.
- Manual or environment:
  - [x] Inspect status and focused output for representative tiny, Review, Release, isolated Design, ambiguous non-small, and ready managed cases — route-order contracts cover specialist and ready paths; assisted-loop fixtures cover tiny, `needs-shape`, and `needs-owner`; `rsp status --json` confirms the focused owner is ready and dependent successors remain waiting.
- Coverage:
  - Does not prove execution-frontier classification, worker isolation, correction convergence, or beta outcome; those remain owned by dependent child Changes.

## Blockers
- none
