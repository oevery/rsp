---
kind: "refactor"
---

# Change: tighten-post-workspace-skill-contracts

## Proposal
- Outcome: Make the post-Workspace Skill control surface unambiguous by reporting the repository's canonical live Skill projections accurately and giving Manage's controller-only topology a distinct name from Core's direct route.
- Why:
  - The self-hosted checkout intentionally exposes authored Skills through exact relative symlinks, but `rsp skills list` reports every projection as `divergent`, obscuring real content drift and making force-replacement guidance unsafe for maintainers.
  - Core's non-managed `RouteDisposition: direct` and Manage's controller-only `direct` topology use the same token for different phases, making logs, fixtures, and human readback unnecessarily ambiguous.
- Scope:
  - Recognize only an exact symlink from an installed Skill path to that packaged Skill's canonical authored directory as `unchanged` during read-only inventory.
  - Preserve mutation-time rejection of every symlinked install destination.
  - Rename Manage's bounded controller-only topology from `direct` to `control-action` across its runtime owner, maintainer Specs, public documentation, and contract fixtures.
  - Reconcile the durable published-suite count and inventory projection contract after Workspace removal.
  - Retain a fresh provider-backed evaluation identity for the materially changed `rsp-manage` contract.
- Non-goals:
  - No general symlink installation support, symlink traversal during mutation, new inventory status value, Workspace replacement, Manage routing change, or Git delivery.

## Spec
### MODIFIED
- Requirement: Skill inventory distinguishes a canonical live source projection from actual divergence without weakening install safety.
  - A target symlink is `unchanged` only when its resolved identity exactly equals the packaged Skill source directory; every other symlink remains `divergent` in inventory and unsupported for installation.
- Requirement: Core route and Manage topology values are lexically distinct.
  - `RouteDisposition: direct` remains the non-managed Core route.
  - `control-action` is the Manage topology for one bounded Manager-owned control action.

### Acceptance
#### Scenario: Canonical self-hosted projections are current
- GIVEN a project Skill path is an exact symlink to the matching packaged Skill source directory
- WHEN `rsp skills list --json` inspects the project
- THEN that Skill is reported as `unchanged` without changing the symlink

#### Scenario: Arbitrary symlinks remain unsafe
- GIVEN a project Skill path is a symlink to any other directory
- WHEN inventory or installation inspects the project
- THEN inventory reports `divergent` and installation refuses the destination without writing through it

#### Scenario: Managed control topology is not confused with direct routing
- GIVEN Core selected Manage for a ready owner
- WHEN Manage performs one bounded controller-owned control action
- THEN its topology is `control-action`, while `direct` remains exclusively the Core non-managed route token

## Design
- Approach:
  - Keep inventory's special case identity-based and read-only by comparing resolved target and packaged source directories before ordinary tree comparison.
  - Keep install preflight unchanged so symlink destinations still fail closed.
  - Replace only the canonical Manage topology token and its exact contract surfaces, not ordinary prose describing direct Core routing.
- Boundaries:
  - Inventory owns read-only status; installation owns mutation safety.
  - Core owns `RouteDisposition`; Manage owns execution topology.
- Affected areas:
  - `src/commands/skills.ts` and Skill inventory/install tests.
  - Manage Skill, Skill Specs, bilingual public Skill guides, managed-controller fixture, and routing contract tests.
- Constraints:
  - Preserve the existing `missing | unchanged | divergent` JSON contract and exact-symlink dogfood layout.
  - Do not follow or mutate arbitrary project symlinks.

## Tasks
- [x] Add focused inventory coverage for exact source projections and unrelated symlinks.
- [x] Update inventory classification without weakening install-time symlink rejection.
- [x] Rename the Manager-owned topology to `control-action` in all current normative and public surfaces.
- [x] Add contract coverage proving `direct` remains the Core route and is no longer a Manage topology value.
- [x] Run focused and full project verification and record decisive evidence.
- [x] Reconcile the durable distribution and repository-layering Specs with the current twelve-default-plus-one-optional suite and canonical projection behavior.
- [x] Run the current managed-controller beta through one provider path under a new immutable evaluation identity and retain only bounded evidence.
- [x] Rerun final repository verification after durable facts and retained evidence converge.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/skills-install.test.ts test/project-skill-dogfood.test.ts test/rsp-core-routing-contract.test.ts test/managed-controller-contract.test.ts --maxWorkers=1` — 4 files and 92 tests passed; proves the inventory and control-vocabulary contracts.
  - [x] `node scripts/managed-controller-beta.mjs contract` and `mise exec -- pnpm exec vitest run test/managed-controller-beta-contract.test.ts --maxWorkers=1` — the current product-composition lock was refreshed without modifying retained evidence, and 14 beta contract tests passed.
  - [x] `mise exec -- pnpm run build`, `mise exec -- pnpm run typecheck`, `mise exec -- pnpm run lint`, `mise exec -- pnpm run docs:check`, and `VITEST_MAX_WORKERS=1 mise exec -- pnpm run test` — build, typecheck, lint, 7 bilingual page pairs and 30 Markdown files, plus 71 files and 794 tests passed; proves project-wide compatibility.
  - [x] `mise exec -- node dist/cli.mjs skills list --json` — all 13 self-hosted canonical Skill projections reported `unchanged`.
  - [x] `node scripts/managed-controller-beta.mjs run --model combo/gpt-5.6-terra --effort high --timeout-ms 600000 --output-root .cache/rsp-manage-beta-2026-08-16-control-action-combo` — baseline and product passed the same `auto-multisurface-routing` output, boundary, changed-path, and verification contracts with one observed worker dispatch each and no unauthorized paths. Retained bounded evidence: `research/evaluations/rsp-manage/2026-08-16-manage-control-action-vocabulary/`.
  - [x] `node scripts/managed-controller-beta.mjs contract` and `mise exec -- pnpm exec vitest run test/managed-controller-beta-contract.test.ts test/managed-controller-contract.test.ts test/rsp-core-routing-contract.test.ts test/skills-install.test.ts --maxWorkers=1` — current retained-evidence locks and 4 files / 104 tests passed after the new generation became canonical.
  - [x] Final convergence rerun: `mise exec -- pnpm run build`, `mise exec -- pnpm run typecheck`, `mise exec -- pnpm run lint`, `mise exec -- pnpm run docs:check`, and `VITEST_MAX_WORKERS=1 mise exec -- pnpm run test` — build, typecheck, lint, 7 bilingual page pairs and 30 Markdown files, plus 71 files and 794 tests passed after the durable Specs, retained evaluation locks, and paired getting-started guidance reached their final state.
  - [x] Fresh fixed-scope re-review of `HEAD` versus the complete Change-owned worktree — Code `clean`, Document `clean`, no actionable findings; the review confirmed both accepted P2 corrections, canonical projection/install boundaries, distinct Core/Manage vocabulary, retained provider-evidence hashes, and the final verification record.
### Optional
- Manual or environment:
  - [ ] Additional provider/model or real-host evaluation — optional because one bounded provider path is required and no provider-general claim is made.
- Coverage:
  - Deterministic tests cover exact projection identity, arbitrary symlink refusal, canonical token ownership, current docs, fixtures, and the hash-locked beta plan.
  - Required coverage includes one fresh provider-backed beta generation because the published `rsp-manage` instruction contract and CalVer changed materially; additional providers and real-host generality remain outside this Change.
  - The retained provider run explicitly records the structured Trigger dimension as `not-observed`; required final-output evidence, compliance, boundary, task result, verification, changed paths, and unauthorized-path checks passed for both variants.

## Blockers
- none
