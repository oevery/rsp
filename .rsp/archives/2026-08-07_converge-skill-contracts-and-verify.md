---
kind: "refactor"
---

# Change: converge-skill-contracts-and-verify

## Proposal
- Outcome: Converge shared Skill control contracts, clarify the Core/CLI Workspace boundary, and extract a narrow rsp-verify Discipline
- Why:
  - Public Skills currently repeat common control vocabulary and readiness/verification rules, increasing drift risk.
  - Workspace selection is intentionally an AI/Core decision, but the published CLI is a lower-level executor and the boundary is described more strictly than it can enforce.
  - Verification is currently a Manage-private lane, leaving direct execution without one reusable verification contract.
- Scope:
  - Define one owner for each shared control contract and remove non-owner full redefinitions while keeping installed Skills independently understandable.
  - Clarify that Core selects semantic isolation and the CLI validates only local infrastructure invariants and policy ceilings.
  - Add a narrow default `rsp-verify` Discipline Skill and package/install/test coverage for its result and authority contract.
  - Centralize the readiness projection used by `status`, `show`, and `ready`.
- Non-goals:
  - Do not add a second router, persisted handoff token, controller state, or generic runtime overlay.
  - Do not make the CLI infer Change readiness, Manage qualification, product acceptance, or publication authority.
  - Do not move Manage worker identity, dispatch limits, acceptance, or closeout ownership into `rsp-verify`.
  - Do not redesign existing Diagnose, TDD, Review, Commit, Workspace session, or Land behavior beyond contract wording and focused coverage.

## Spec
### MODIFIED
- Requirement: The published Skill suite has one runtime owner for each common control contract; non-owner Skills consume the invoking contract and describe only their phase-specific fields and boundaries.
  - Acceptance: contract terminology and enum values remain consistent across authored Skill sources, generated fallback, package inventory, and contract tests.
- Requirement: Workspace selection remains owned by Core while `rsp workspace` remains an explicit low-level infrastructure executor.
  - Acceptance: documentation distinguishes semantic selection from CLI execution, and the CLI does not gain readiness, routing, or product-acceptance inference.
- Requirement: Verification has one reusable Discipline contract.
  - Acceptance: `rsp-verify` is invocable with a selected WorkRef and declared verification boundary, is read-only, returns the canonical verification result set, and does not grant lifecycle, Git, publication, or acceptance authority.
- Requirement: Status, Show, and Ready expose the same readiness projection derived from the shared readiness calculation.
  - Acceptance: focused tests prove equivalent readiness fields and gate semantics across all three command surfaces.

### Acceptance
#### Scenario: Shared control contracts do not drift
- GIVEN the Core, Manage, Workspace, Verify, and fallback Skill sources
- WHEN the contract validation suite runs
- THEN each common enum and owner boundary has one authoritative definition and no stale full redefinition remains

#### Scenario: Workspace remains AI-selected and CLI-executed
- GIVEN an explicit `rsp workspace prepare <workref>` invocation
- WHEN the command runs
- THEN it enforces local identity, ownership, path, branch, and policy invariants without inventing Core routing or readiness decisions

#### Scenario: Direct verification uses the same contract as managed verification
- GIVEN a ready Change with a declared Required verification
- WHEN `rsp-verify` runs
- THEN it performs read-only verification and returns a bounded result with evidence and stop conditions

#### Scenario: Readiness projections stay equivalent
- GIVEN one Change with required, optional, blocker, and scenario states
- WHEN `status`, `show`, and `ready` inspect it
- THEN their readiness fields and completion-gate semantics agree

## Design
- Approach:
  - Keep `skill-control-model.md` as maintainer-facing canonical vocabulary, while Core and Manage remain the complete published owners of their respective contracts.
  - Add only phase-specific Verify content to `rsp-verify`; keep Manage-specific worker and acceptance metadata in `rsp-manage`.
  - Use a shared code-level readiness projection helper instead of rebuilding the same object in each command.
  - Update bilingual public documentation and package inventory from the same implementation boundary.
- Boundaries:
  - Protocol: canonical control vocabulary and ownership.
  - Core: route derivation and semantic Workspace selection.
  - Discipline: Verify execution and result reporting.
  - Controller: worker dispatch, independent verification, acceptance, lifecycle, and closeout.
  - Infrastructure: worktree/session/activity operations only.
- Affected areas:
  - `skills/rsp/SKILL.md`, `skills/rsp-manage/SKILL.md`, `skills/rsp-workspace/SKILL.md`, new `skills/rsp-verify/SKILL.md`
  - `rules/rsp-rules.md`, `.rsp/rsp-rules.md`, `.rsp/specs/skill-control-model.md`, public bilingual docs
  - `src/core/helpers.ts`, `src/status/*`, `src/commands/*`, package inventory and contract tests
- Constraints:
  - Installed Skills cannot depend on `.rsp/specs/**`.
  - CLI output must preserve canonical machine values and remain compatible with existing JSON contracts unless a focused change is required.
  - Existing WorkRefs, lifecycle states, Git boundaries, and publication boundaries remain unchanged.

## Tasks
- [x] Establish the canonical owner matrix and remove repeated full control-contract definitions from non-owner Skill prose.
- [x] Clarify Core-selected versus CLI-executed Workspace semantics in the Core, Workspace, fallback, and bilingual documentation.
- [x] Add `rsp-verify` to authored and packaged Skill inventories with read-only authority, result, evidence, and stop contracts.
- [x] Centralize the shared readiness projection and migrate `status`, `show`, and `ready`.
- [x] Add focused contract, integration, package-install, and readiness parity tests.
- [x] Run `rsp check --focused`, build, typecheck, lint, full tests, and clean-install package validation.

## Verify
### Required
- Automated:
  - [x] `node dist/cli.mjs check --focused --json` — passed with 0 errors and 0 warnings; proves the focused Change is structurally valid.
  - [x] `mise exec -- pnpm exec vitest run test/skill-contract.test.ts test/rsp-verify-skill-contract.test.ts test/rsp-workspace-skill-contract.test.ts test/managed-controller-contract.test.ts test/helpers.test.ts test/skills-inventory.test.ts test/skills-install.test.ts test/clean-install-check.test.ts --maxWorkers=2` — 8 files and 141 tests passed; proves owner boundaries, Verify authority/results, Workspace semantics, readiness projection, and package inventory.
  - [x] `mise exec -- pnpm run build` followed by `node dist/cli.mjs update` — passed; packaged the CLI and synchronized the generated fallback from `rules/rsp-rules.md`.
  - [x] `mise exec -- pnpm run typecheck` — passed; proves the shared readiness projection and command integration remain type-safe.
  - [x] `mise exec -- pnpm run lint` — passed after aligning the managed-controller fixture with repository YAML style.
  - [x] `mise exec -- pnpm run test` — 59 files and 715 tests passed after refreshing only the beta plan's current product-composition hash; retained historical evidence remained unchanged.
  - [x] `mise exec -- pnpm run release:package-check` — passed for `@oevery/rsp@3.2.0`; the clean package contains all 15 default Skills including `rsp-verify` and starts from a temporary installation.
### Optional
- Manual or environment:
  - [x] Inspected the authored Skills, generated fallback, package inventory, symlink projection, Specs, and bilingual docs — all name `rsp-verify` and preserve Core-selected versus CLI-executed Workspace boundaries.
- Coverage:
  - Real host scheduling, cross-platform process behavior, and authenticated external publication remain outside this Change.

## Blockers
- none
