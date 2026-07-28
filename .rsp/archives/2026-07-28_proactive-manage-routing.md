---
kind: "fix"
---

# Change: proactive-manage-routing

## Proposal
- Outcome: Make automatic Manage routing reliably select non-small continuations and make qualified Manage delegate implementation work without increasing unsafe parallelism.
- Why:
  - Recent runs still reduced Manage eligibility to parallel slices, failed to requalify work after a small route expanded, or selected Manage while the controller performed the entire implementation itself.
  - The existing "prospectively long" criterion is correct but too underspecified to produce consistent automatic routing.
- Scope:
  - Define concrete prospective signals and a narrow direct-work exclusion for `manage.activation: auto`.
  - Require fresh qualification at every later-turn mutation that expands a prior report, design, tiny, or small route.
  - Require at least one bounded worker dispatch for qualified implementation when the host supports workers, while keeping overlapping paths, shared resources, and dependent verification sequential.
  - Keep route selection and serial/parallel reasoning observable in the response contract.
  - Update authored Skills, fallback rules, stable Specs, and contract tests.
- Non-goals:
  - Do not make every ready Change managed.
  - Do not infer planning, mutation, lifecycle, Git, push, publication, deployment, approval, or human-acceptance authority.
  - Do not require parallel dispatch or create controller state.
  - Do not change CLI configuration values or status JSON.

## Spec
### MODIFIED
- Requirement: Automatic Manage qualification is biased toward bounded coordination for non-small continuation.
  - A selected ready Change qualifies when independent slices, interruption recovery, or prospective execution signals show more than one bounded phase or authority surface.
  - Prospective signals include implementation plus integration/review/lifecycle work, cross-module or cross-process mutation, real-host/provider/hardware verification, bounded finding convergence, and a clear ready successor.
  - Direct execution remains appropriate only when the work is one owner, one local seam, one mutation pass, one decisive check, and has no managed lifecycle or successor coordination.
  - Under automatic activation, a selected ready completion or continuation that fails any one direct-work condition qualifies as non-small; no middle case remains unclassified.
- Requirement: Later-turn routing is not sticky.
  - Before mutation, a report, design, tiny, or small route is requalified when the authorized objective expands into any prospective signal.
- Requirement: Qualified Manage delegates implementation without forcing concurrency.
  - When workers are available and authorized implementation remains, Manage dispatches at least one worker with a complete owner envelope.
  - Shared paths, generated outputs, lockfiles, integration state, real hosts, and hardware resources remain sequential unless an isolated workspace and verification boundary are established.
  - Core retains owner resolution, evidence acceptance, integration verification, review convergence, lifecycle, and Git decisions.
- Requirement: Routing remains auditable.
  - The response states whether Manage was selected or declined, the decisive qualification or exclusion, and whether dispatch is parallel or sequential when applicable.

### Acceptance
#### Scenario: A coupled continuation spans multiple execution phases
- GIVEN automatic activation, one selected ready Change, and authorized implementation followed by integration verification and review
- WHEN Core qualifies the prospective continuation
- THEN it selects Manage even when no slices can run in parallel

#### Scenario: A previously small route expands
- GIVEN a prior report, design, tiny, or small route
- WHEN a later authorized mutation adds cross-module work, real-host verification, review convergence, lifecycle delivery, or a ready successor
- THEN Core establishes or reuses the owner and performs fresh Manage qualification before mutation

#### Scenario: Qualified work shares mutation or environment resources
- GIVEN qualified Manage and available workers
- WHEN implementation paths or verification resources overlap
- THEN Manage dispatches at least one worker sequentially and does not infer parallel safety

#### Scenario: Work is genuinely one-step
- GIVEN one owner, one local seam, one mutation pass, one decisive check, and no successor or lifecycle coordination
- WHEN automatic routing evaluates the work
- THEN it declines Manage and returns the exact Core or Discipline action

#### Scenario: Work falls between an obvious signal and one-step direct execution
- GIVEN automatic activation and one selected ready completion or continuation
- WHEN no separate prospective signal is obvious but at least one direct-work condition is false
- THEN Core classifies the work as non-small and selects Manage

## Design
- Approach:
  - Replace the vague positive-only long-work wording with explicit prospective signals plus a conjunctive direct-work exclusion.
  - Add a worker-use floor for qualified implementation and keep the existing maximum dispatch and retry ceilings.
  - Preserve conservative concurrency by separating delegation from parallel dispatch.
  - Extend semantic contract tests instead of testing incidental prose layout.
- Boundaries:
  - `rsp` owns requalification and route reporting.
  - `managed-routing.md` owns automatic qualification and serial/parallel selection.
  - `rsp-manage` owns worker delegation and controller/worker separation.
  - Fallback rules describe the route but still never emulate Manage.
- Affected areas:
  - `skills/rsp/**`, `skills/rsp-manage/SKILL.md`, and `rules/rsp-rules.md`
  - `.rsp/specs/skill-system.md` and contract tests
- Constraints:
  - Keep automatic selection separate from every authority grant.
  - Keep tiny direct work cheap and synthetic-artifact free.
  - Do not treat elapsed time or message count as qualification evidence.
  - Edit authored Skill sources and regenerate the self-hosted fallback after the build.

## Tasks
- [x] Tighten Core and managed-routing qualification and later-turn requalification contracts.
- [x] Require bounded worker delegation for qualified implementation while preserving sequential overlap rules.
- [x] Update fallback and stable Skill-system facts.
- [x] Extend contract coverage for proactive qualification, route observability, and serial worker dispatch.
- [x] Rebuild, sync the self-hosted fallback, and run focused plus full validation.

## Verify
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/managed-controller-contract.test.ts test/rsp-core-routing-contract.test.ts` — passed, 2 files and 55 tests; proves: authored Core/Manage/fallback/Spec contracts encode proactive qualification and worker boundaries.
  - [x] `mise exec -- pnpm run build` — passed; proves: authored package builds before fallback synchronization.
  - [x] `mise exec -- node dist/cli.mjs update` — passed and updated `.rsp/rsp-rules.md`; proves: the self-hosted generated fallback is synchronized from authored rules.
  - [x] `mise exec -- pnpm run lint` — passed; proves: source and test style remains valid.
  - [x] `mise exec -- pnpm run test` — passed, 52 files and 597 tests; proves: the complete package behavior remains compatible.
  - [x] `mise exec -- node dist/cli.mjs check --focused` — passed; proves: the Change remains structurally complete.
  - [x] `git diff --check` — passed; proves: edited text has no whitespace errors.
- Manual or environment:
  - [x] Inspected the final Skill wording: automatic selection uses prospective non-small signals and the conjunctive direct-work exclusion; parallel dispatch still requires isolated mutation and verification resources.
- Coverage:
  - No provider evaluation is required because this Change tightens deterministic shipped contracts; retained live-host evidence is not overwritten.

## Blockers
- none
