---
kind: "refactor"
---

# Change: tighten-workspace-selection-revalidation

## Proposal
- Outcome: Make Workspace explicitly requested by default and give isolated work a visible, cleanup-safe terminal lifecycle.
- Why:
  - Core currently selects Workspace before route execution, while Manage may reach preparation after sibling work, dirty paths, or runtime constraints have changed.
  - The current contract stops on an invalid selection but does not make the common "selection reason disappeared" case an explicit Core revalidation and current-checkout fallback.
  - Provider harness isolation and RSP-owned Change or focus files can be mistaken for product isolation requirements even when one WorkRef and one writer remain.
  - The completed `streamline-managed-workspace-flow` delivery is patch-equivalent on `main` but still appears as one commit ahead, so operators cannot distinguish delivered residue from unlanded work.
  - Active Workspace recovery is hidden from default plain status, and prepare has no product-change handoff; automatic selection therefore creates more lifecycle friction than it removes.
- Scope:
  - Change generated, backfilled, legacy-missing, and self-host Workspace policy defaults from `auto` to `explicit`; retain `auto` only as an explicit advanced opt-in and `disabled` as a hard prohibition.
  - Require a current explicit Workspace request under the default policy and retain prepare-time freshness validation.
  - Derive a bounded mechanical delivery state that distinguishes unlanded commits from commits already patch-equivalent on the target branch.
  - Permit ordinary non-destructive disposal of a clean patch-equivalent Workspace and surface active Workspace recovery plus a concrete next action in default status.
  - Make the pre-mutation boundary explicit: Workspace does not migrate in-progress product changes, so a late switch must stop for owner-directed handoff.
  - Align implementation, Skills, Specs, fallback rules, configuration/CLI documentation, fixtures, and deterministic tests.
- Non-goals:
  - No automatic copying, stashing, committing, or deleting of source-checkout product changes.
  - No automatic disposal without an explicit cleanup/dispose action, no persisted semantic lifecycle state, and no fifth `WorkspaceSelection` field.
  - No change to Manage qualification, branch identity, commit, push, publication, or human-acceptance authority.

## Spec
### MODIFIED
- Requirement: Workspace selection is explicit by default.
  - Generated projects, valid legacy projects without a Workspace mapping, and conservative backfill resolve to `workspace.activation: explicit`.
  - `auto` remains an explicit advanced project opt-in; `disabled` continues to deny Workspace preparation.
  - Under `explicit`, Core produces a `WorkspaceSelection` only for a current request that names Workspace, worktree, isolated checkout, or equivalent isolation intent.
- Requirement: Workspace selection uses current evidence at the preparation boundary.
  - Core owns fresh selection derivation. If Manage is selected, it revalidates the request immediately before Workspace preparation and returns stale evidence to Core.
  - Workspace is pre-mutation infrastructure and never silently migrates in-progress source-checkout product changes.
- Requirement: The Workspace CLI remains a mechanical executor.
  - `rsp workspace prepare` validates ownership and prepares an already selected boundary; it does not decide whether product work semantically needs isolation.
- Requirement: Workspace delivery and recovery state are observable and actionable.
  - Status distinguishes `clean`, `unlanded`, and `landed-equivalent` delivery states using current Git evidence rather than commit ancestry alone.
  - A clean `landed-equivalent` Workspace is safe for ordinary dispose without `--discard`; dirty or genuinely unlanded work remains protected.
  - Default plain status surfaces every active Workspace without machine-specific paths and provides an inspect or dispose next action.

### Acceptance
#### Scenario: Ordinary work does not create a Workspace
- GIVEN the project uses generated or legacy-compatible defaults
- WHEN one task begins without a current explicit isolation request
- THEN Workspace policy resolves to `explicit` and execution stays in the current checkout

#### Scenario: Explicit isolation remains available
- GIVEN the user explicitly requests a Workspace or isolated worktree and policy is `explicit` or `auto`
- WHEN Core refreshes that request immediately before preparation
- THEN the four-field `WorkspaceSelection` may be forwarded to the mechanical prepare command

#### Scenario: A cherry-picked Workspace is recognized as delivered
- GIVEN every Workspace commit ahead of the target has a patch-equivalent commit on the target branch
- WHEN status or disposal observes the Workspace
- THEN delivery state is `landed-equivalent`, default status recommends ordinary dispose, and clean disposal succeeds without `--discard`

#### Scenario: Genuinely unlanded or dirty work remains protected
- GIVEN at least one Workspace commit has no target patch equivalent or the worktree is dirty
- WHEN status or disposal observes the Workspace
- THEN delivery state remains `unlanded` or cleanup remains blocked and no ordinary disposal loses work

#### Scenario: Late isolation does not split product ownership silently
- GIVEN product changes for the selected WorkRef already exist in the source checkout
- WHEN isolation is considered after mutation began
- THEN the Skills stop before prepare and require an explicit owner-directed handoff instead of copying only RSP control files and continuing

## Design
- Approach:
  - Add focused config, lifecycle, status, and Skill contract tests and observe RED before production edits.
  - Keep configuration semantics small: change only the default to `explicit`, retaining the three existing values.
  - Extend mechanical observations with one derived delivery state from `git cherry`; persist no new lifecycle state.
  - Reuse ordinary dispose when all ahead commits are patch-equivalent, while preserving dirty and unlanded refusal.
  - Show bounded active Workspace summaries in default status and prepend the smallest recovery action without exposing machine paths.
  - Strengthen Core/Manage/Workspace prose around explicit request and pre-mutation handoff.
  - Synchronize authored fallback rules through the normal build and update path.
- Boundaries:
  - Core owns explicit semantic selection and fallback; Manage owns selected-goal timing and validation; Workspace and CLI own mechanical preparation, observation, and disposal only.
  - Git evidence owns `deliveryState`; it does not imply Change acceptance, lifecycle closeout, or Git authority.
  - `WorkspaceSelection` remains response-only with exactly four fields. Workspace observations remain separate.
- Affected areas:
  - Config defaults/reconciliation, Workspace session observation/disposal, status projections/presentation, and focused tests.
  - `skills/rsp`, `skills/rsp-manage`, `skills/rsp-workspace`, Specs, authored fallback, and bilingual configuration/CLI guidance.
- Constraints:
  - Preserve conditional Skill loading, compact Skill bodies, stable branch/path identity, and exact authority ceilings.
  - Do not add a semantic runtime controller, auto-migrate product changes, or infer acceptance from patch equivalence.

## Tasks
- [x] Add focused tests for the explicit default, patch-equivalent terminal state, safe disposal, default recovery visibility, and late-handoff boundary; observe RED.
- [x] Change generated, legacy-compatible, backfilled, and self-host Workspace defaults to `explicit`.
- [x] Derive and project Workspace delivery state, allow clean patch-equivalent disposal, and add default recovery actions.
- [x] Align Skills, Specs, fallback rules, and bilingual docs with explicit selection and pre-mutation handoff.
- [x] Synchronize generated fallback content and run focused plus repository verification.
- [x] Record final decisive evidence, omissions, and remaining risk.

## Verify
### Required
- Automated:
  - [x] Focused config, Workspace lifecycle/status, Core/Workspace Skill, and managed-controller contracts — `vitest` passed 7 files and 78 tests; targeted final presentation regression passed 2 files and 13 tests.
  - [x] `mise exec -- pnpm run build`, `mise exec -- pnpm run typecheck`, `mise exec -- pnpm run lint`, `mise exec -- pnpm run docs:check`, and `mise exec -- pnpm run test` — build, typing, lint, and 7 bilingual documentation pairs passed; the final full run passed 75 files and 824 tests.
  - [x] `node dist/cli.mjs update`, `node dist/cli.mjs check --focused --json`, and `git diff --check` — generated fallback is synchronized, focused check reports zero errors and warnings, and patch hygiene passes.
### Optional
- Manual or environment:
  - [ ] Provider-backed route comparison — optional because deterministic policy and lifecycle behavior own acceptance; run only for a later `auto` release-candidate decision.
- Coverage:
  - Local deterministic contracts must cover configuration, Git patch-equivalence, status, disposal, and prompt boundaries. They do not claim provider-general routing quality, automatic product-change migration, or live parallel-runtime independence.
  - The existing `streamline-managed-workspace-flow` registry entry is observed as clean `landed-equivalent` with `cleanupReady: true`; default plain status exposes it and recommends ordinary dispose without performing cleanup.
  - Provider-backed route comparison remains omitted by design and does not block deterministic acceptance.

## Blockers
- none
