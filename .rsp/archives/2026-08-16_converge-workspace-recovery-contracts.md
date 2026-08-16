---
kind: "fix"
---

# Change: converge-workspace-recovery-contracts

## Proposal
- Outcome: Unify Workspace delivery semantics, pre-mutation safeguards, actionable status, and bounded stale-record recovery.
- Why:
  - `deliveryState: clean` currently means only that no commit is ahead of the target, so ordinary status can render the contradictory combination `clean · dirty`.
  - `cleanupReady` is derived once for direct Workspace observation and then narrowed again for global status when activities are active, allowing two public status surfaces to disagree.
  - Direct `rsp workspace status` plain output omits delivery state, cleanup readiness, and the next safe action even though JSON and global status expose them.
  - The pre-mutation handoff is a Skill contract only; the low-level prepare command can still be called after source-checkout product mutation and copies only RSP owner control files.
  - Invalid or mechanically orphaned registry entries fail closed but have no bounded report-first recovery command.
- Scope:
  - Replace ambiguous Workspace delivery vocabulary with one commit-delivery model and derive ordinary-dispose readiness exactly once.
  - Align direct and global status projections, plain output, next actions, docs, and tests.
  - Add a mechanical dirty-source preflight to prepare with one explicit acknowledgement for semantically reviewed unrelated source changes.
  - Add a report-first prune operation that mutates only mechanically proven orphan residue under explicit apply authority.
  - Synchronize Skills, Specs, fallback guidance, bilingual docs, fixtures, and deterministic tests.
- Non-goals:
  - No return to automatic Workspace selection, no automatic migration or stashing of product changes, and no inference that source dirty paths belong to a WorkRef.
  - No automatic repair of live, dirty, unlanded, ambiguously owned, or path-present worktrees.
  - No persisted semantic lifecycle, new WorkspaceSelection field, remote action, archive, commit, or publication authority.

## Spec
### MODIFIED
- Requirement: Workspace delivery and cleanup use one canonical mechanical projection.
  - `deliveryState` describes commit delivery only and uses non-conflicting values rather than worktree-cleanliness language.
  - `cleanupReady` has one owner and one meaning across direct status, global status, JSON, and plain presentation.
- Requirement: Workspace preparation makes the pre-mutation boundary observable.
  - Prepare rejects source-checkout product dirty paths by default while allowing selected RSP owner-control paths.
  - An explicit acknowledgement may continue only after the caller has established that remaining source dirty paths are unrelated; it grants no semantic selection or product-migration authority.
- Requirement: Direct status is actionable.
  - Plain `rsp workspace status` shows delivery state, dirty state, active activities, cleanup readiness, and the exact inspect or dispose next action without requiring JSON.
- Requirement: Orphan recovery remains report-first and fail-closed.
  - The command reports observed record, branch, registered worktree, cache path, activity, and lease facts before mutation.
  - Apply removes only residue whose absence and ownership can be mechanically proven; every live, present, dirty, unlanded, or ambiguous case is preserved.

### Acceptance
#### Scenario: Dirty worktree is not called clean
- GIVEN a Workspace has no commits ahead of its target and has uncommitted paths
- WHEN direct or global status is rendered
- THEN the delivery label describes commits without contradicting the dirty worktree state and cleanup remains blocked

#### Scenario: Status surfaces agree
- GIVEN one recorded Workspace with any registered activity state
- WHEN direct Workspace status and global status inspect it
- THEN both expose the same delivery state and cleanup readiness while separately reporting active activities

#### Scenario: Late prepare stops before copying control files
- GIVEN source-checkout product paths are dirty
- WHEN prepare is invoked without an explicit reviewed-dirty acknowledgement
- THEN it fails before creating a worktree, branch, record, or copied RSP owner state and reports the bounded dirty paths

#### Scenario: Reviewed unrelated dirty work can be isolated explicitly
- GIVEN Core or a human has established that source dirty product paths are unrelated to the selected WorkRef
- WHEN prepare is invoked with explicit acknowledgement
- THEN normal mechanical ownership checks continue without claiming semantic proof or copying product changes

#### Scenario: Direct status gives the safe next action
- GIVEN a healthy recorded Workspace
- WHEN `rsp workspace status <work-ref>` is rendered as plain text
- THEN it shows the canonical state and either an inspect or ordinary dispose command

#### Scenario: Orphan pruning is bounded
- GIVEN an exact WorkRef whose expected registry residue is present but its branch, registered worktree, cache path, and live activities are absent
- WHEN prune runs without apply and then with explicit apply
- THEN the first call reports only and the second removes only the exact stale record and owned stale leases

#### Scenario: Ambiguous recovery is preserved
- GIVEN a malformed record or any matching branch, worktree, cache path, live activity, dirty path, or unlanded commit remains
- WHEN prune is requested
- THEN it refuses mutation and reports the blocking mechanical evidence

## Design
- Approach:
  - Resolve the delivery/readiness vocabulary first, then align presenters and actions, then add prepare preflight, and finally add bounded prune recovery.
  - Protect each phase with focused observable tests before production mutation.
  - Canonical `deliveryState` values are `landed | landed-equivalent | unlanded`: `landed` means no Workspace commit remains ahead by ancestry, `landed-equivalent` means ahead commits are patch-equivalent on the target, and `unlanded` means at least one ahead patch is absent.
  - `cleanupReady` means ordinary dispose is mechanically data-loss-safe: no dirty paths and no unlanded commit. Registered activities remain a separate count because ordinary dispose already owns stopping them; direct and global status consume the same observation without narrowing it.
  - Direct status renders delivery, dirty paths, active activity count, cleanup readiness, and a next action. A cleanup-ready Workspace recommends ordinary dispose and discloses that registered activities will be stopped; all other states recommend inspect.
  - New prepare rejects bounded source-checkout dirty paths outside the exact selected Change, focus marker, and sibling Group Brief before creating a branch, worktree, record, or copied owner state. `--allow-dirty-source` is an explicit acknowledgement that a prior semantic owner review found those paths unrelated; it neither migrates paths nor proves isolation selection. Resume of an already registered Workspace does not repeat source preflight because it copies no owner state.
  - New `rsp workspace prune <work-ref> [--apply]` derives a response-only disposition: `healthy | prune-ready | quarantine-ready | blocked`. Default invocation reports exact record, expected branch, registered worktree, expected cache path, activity, and lease observations without mutation.
  - `prune-ready` requires a valid exact record, no branch, no registered worktree, no cache path, and no live recorded activity; apply releases only leases whose ownership metadata is valid and then removes the exact record. `quarantine-ready` applies only to a regular non-symlink exact hashed record that cannot be parsed while the expected branch, worktree, and cache path are all absent; apply atomically renames it into a Git-common quarantine directory and never claims lease cleanup. Every other case is `blocked`.
- Boundaries:
  - Workspace session owns mechanical observations and cleanup eligibility; status and presenters consume that projection without redefining it.
  - Core and humans retain semantic ownership classification; CLI accepts only an explicit acknowledgement when dirty-source review has already happened.
  - Prune owns only exact local registry/cache/worktree/branch residue and never infers Change acceptance or delivery.
- Affected areas:
  - Workspace types/session, commands, CLI parsing/presentation, global status, landing cleanup, and safety tests.
  - Core/Manage/Workspace Skills, Specs, fallback rules, bilingual CLI/configuration guidance, and frozen output or beta composition fixtures.
- Constraints:
  - Preserve stable branch/cache identity, structured JSON errors, bounded output, symlink/path-containment checks, process identity, lease ownership, and exact Git safety.
  - Recovery defaults to no mutation and requires explicit apply authority; destructive discard remains separate.

## Tasks
- [x] Settle and record the canonical delivery/readiness vocabulary and prune/preflight seam.
- [x] Add focused RED tests for non-conflicting status, single-source cleanup readiness, actionable direct status, dirty-source prepare refusal/acknowledgement, and bounded prune.
- [x] Implement the canonical observation and direct/global status alignment.
- [x] Implement dirty-source prepare preflight and explicit reviewed-dirty acknowledgement.
- [x] Implement report-first orphan prune with strict apply gates and structured errors.
- [x] Align Skills, Specs, fallback rules, bilingual docs, and deterministic fixtures.
- [x] Synchronize generated fallback content and run focused plus repository verification.
- [x] Record decisive evidence, omissions, and remaining risks.

## Verify
### Required
- Automated:
  - [x] Focused Workspace lifecycle, safety, JSON error, status presentation, CLI contract, and Skill contract tests — focused runs passed, including 26 tests across the final direct Workspace/Skill slice.
  - [x] `mise exec -- pnpm run build`, `mise exec -- pnpm run typecheck`, `mise exec -- pnpm run lint`, `mise exec -- pnpm run docs:check`, and `mise exec -- pnpm run test` — build, typecheck, lint, and 7 bilingual documentation pairs passed; the full repository run passed 75 files and 829 tests.
  - [x] `node dist/cli.mjs update`, `node dist/cli.mjs check --focused --json`, and `git diff --check` — generated fallback is synchronized, focused validation passes, and patch hygiene is clean.
### Optional
- Manual or environment:
  - [ ] Provider-backed routing comparison — optional because deterministic CLI and Skill contracts own acceptance.
- Coverage:
  - Deterministic tests cover local Git/worktree/registry/process fixtures. They do not claim provider-general semantic classification or automatic migration of product changes.
  - Prune coverage includes report-first valid orphan cleanup, malformed-record quarantine, and refusal while branch/worktree/cache resources remain present.
  - Provider-backed routing comparison remains omitted by design and does not block deterministic acceptance.

## Blockers
- none
