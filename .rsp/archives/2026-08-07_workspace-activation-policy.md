---
kind: "feature"
---

# Change: workspace-activation-policy

## Proposal
- Outcome: Let each RSP project explicitly allow automatic workspace isolation, require an explicit workspace request, or disable RSP-managed worktrees.
- Why:
  - Workspace isolation is currently selected from runtime signals without a project-level policy ceiling.
  - Projects with incompatible filesystem, platform, submodule, environment, or security constraints need a durable machine-readable opt-out instead of relying only on prose instructions.
- Scope:
  - Add `workspace.activation: auto | explicit | disabled` to `.rsp/config.yaml`.
  - Generate and backfill `workspace.activation: auto` so existing behavior remains the canonical default.
  - Fail closed to `disabled` when configuration is invalid while preserving `auto` for legacy valid configs that have not yet been updated.
  - Expose the effective workspace policy through status JSON and verbose plain status.
  - Make Core honor the policy before selecting workspace isolation.
  - Update authoritative Specs, fallback rules, Skills, bilingual configuration/workspace documentation, and regression tests.
- Non-goals:
  - Configuring workspace paths, branch prefixes, target branches, resource ids, environment materialization, cleanup, discard, or project-specific commands.
  - Making workspace isolation a persisted execution state or granting workspace, mutation, Git, cleanup, or external authority.
  - Requiring worktree isolation for every task.

## Spec
### ADDED
- Requirement: Project workspace activation policy
  - `workspace.activation: auto` permits Core to select isolation only from the existing material signals.
  - `workspace.activation: explicit` permits isolation only when the user explicitly requests it for the current work.
  - `workspace.activation: disabled` prevents RSP workspace selection even when ordinary isolation signals are present.
  - The generated and backfilled default is `auto`; a valid legacy config without `workspace` resolves to `auto`, while invalid configuration resolves to `disabled`.
  - Status JSON exposes the effective activation value and verbose plain status displays it.
  - Configuration is a policy ceiling and never grants product mutation, workspace creation, cleanup, Git, or external authority.

### Acceptance
#### Scenario: generated and upgraded configuration
- GIVEN a new project or a valid existing config without a `workspace` mapping
- WHEN `rsp init` or `rsp update` reconciles configuration defaults
- THEN it writes `workspace.activation: auto` without changing explicit project values or custom comments

#### Scenario: explicit-only workspace policy
- GIVEN `workspace.activation: explicit`
- WHEN ordinary parallel-work, dirty-worktree, or runtime-boundary signals exist without an explicit workspace request
- THEN Core does not select workspace isolation

#### Scenario: disabled workspace policy
- GIVEN `workspace.activation: disabled`
- WHEN isolation signals or an explicit workspace request exist
- THEN Core stops workspace selection at the project-policy boundary without preparing a worktree

#### Scenario: status and invalid configuration
- GIVEN a valid workspace policy or an invalid project config
- WHEN status is inspected
- THEN JSON and verbose plain output expose the effective policy, and invalid configuration fails closed to `disabled`

## Design
- Approach:
  - Add a small `WorkspacePolicy` type and resolver parallel to the existing Manage policy.
  - Extend config generation, validation, parsing, conservative backfill, status snapshot/view/JSON, and verbose presentation.
  - Keep stable worktree path, branch, record, activity, landing, and disposal mechanics unchanged.
  - Update Core routing text so policy is checked before the existing four-signal isolation decision.
- Boundaries:
  - `.rsp/config.yaml` owns the durable project policy ceiling.
  - Core owns policy-aware isolation selection; `rsp-workspace` still operates only after selection.
  - The CLI owns deterministic parsing, effective-policy projection, and mechanical workspace commands, not semantic selection.
- Affected areas:
  - `src/core/config.ts`, status types/projections/presentation, and configuration tests.
  - `skills/rsp`, `skills/rsp-workspace`, fallback rules, Specs, and bilingual documentation.
- Constraints:
  - Preserve current `auto` behavior for valid legacy projects.
  - Invalid configuration must not permit workspace mutation.
  - Do not add configurable paths, branch names, cleanup defaults, or project execution schemas.

## Tasks
- [x] Add workspace policy types, defaults, validation, parsing, reconciliation, and effective resolution.
- [x] Expose effective workspace activation in status JSON and verbose plain output.
- [x] Make Core, Workspace Skill, and the direct `workspace prepare` command honor `auto | explicit | disabled`.
- [x] Update authoritative Specs, generated fallback, bilingual docs, and focused regression tests.
- [x] Run focused tests, build, typecheck, lint, full tests, docs checks, and release package validation.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/config.test.ts test/status/status-boundary.test.ts test/status/plain-dense.test.ts test/rsp-core-routing-contract.test.ts test/rsp-workspace-skill-contract.test.ts test/skill-contract.test.ts` — 6 files and 76 tests passed; proves: config lifecycle, fail-closed resolution, status projection, and Skill routing contracts.
  - [x] `mise exec -- pnpm exec vitest run test/workspace.test.ts` — passed; proves: disabled policy blocks direct workspace preparation before creating a branch or record.
  - [x] `UPDATE_STATUS_ORACLES=1 mise exec -- pnpm exec vitest run test/status/status-cli-equivalence.test.ts` — passed; proves: the additive workspace status field is reflected in the frozen CLI equivalence oracle.
  - [x] `mise exec -- pnpm exec vitest run test/managed-controller-beta-contract.test.ts test/status/status-cli-equivalence.test.ts` — 2 files and 12 tests passed; proves: retained beta composition and status output contracts remain valid.
  - [x] `mise exec -- pnpm run release:check` — 58 files and 711 tests passed; docs build, typecheck, lint, package inventory, and clean-install validation passed.
### Optional
- Manual or environment:
  - [x] Ran `node dist/cli.mjs update`; it backfilled `workspace.activation: auto` and synchronized the self-hosted fallback.
  - [x] Inspected `node dist/cli.mjs status --json` and `node dist/cli.mjs status --verbose`; both expose effective Workspace activation.
- Coverage:
  - Configuration and routing contracts are covered; no new worktree mechanics or platform-specific process behavior is introduced.

## Blockers
- none
