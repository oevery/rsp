---
kind: feature
---

# Change: managed-recovery-hardening/reopen-closed-change-groups

## Proposal
- Outcome: Reopen archived Change Groups explicitly
- Why:
  - `rsp reopen <group>/<child>` currently instructs callers to reopen a closed Group through a separate lifecycle operation, but no such operation exists and restored Group Briefs are rejected as identity reuse.
  - Fresh evidence can invalidate one archived child acceptance after the enclosing Group has closed; forcing a differently named corrective owner fragments the original evidence chain.
- Scope:
  - Add `rsp group reopen <group> --reason <text> [--from <archive-path>]` for one exact archived Group Brief.
  - Restore the same logical Group identity while retaining the selected archive and making Group completion unfinished before any child is reopened.
  - Align status, child reopen, documentation, Skills, Specs, decisions, and integration tests with the explicit two-step lifecycle.
- Non-goals:
  - Reusing a closed Group identity for a genuinely new effort.
  - Implicitly reopening children or dependents, choosing an archive generation automatically, or granting Git/external authority.

## Spec
<!-- <…> -->
### ADDED
- Requirement: Closed Group recovery is an explicit lifecycle operation
  - The command selects one archived Group Brief by canonical Group identity or exact `--from`, retains the archive, restores the Brief to its canonical open path, and appends an unchecked completion condition bound to the exact selected archive path and one-line reason.
  - A restored Brief represents continuation of the same logical Group, not a new generation or name reuse; existing archived children remain valid until individually reopened, and open children take current-state precedence.
  - Validation of archive inspection, identity, canonical sections, collision state, empty Group work/focus subtrees, evidence whose embedded source is one retained Brief path for the current Group, non-replayed reopen evidence, and target path completes before mutation; partial writes stay outside the inspected work tree and are rolled back.
  - Group reopen creates no focus marker and reopens no child or dependent. A caller separately runs `rsp reopen <group>/<child>` when exact child acceptance is incomplete.

### Acceptance
#### Scenario: Reopen one child after Group close
- GIVEN a completed Group whose Brief and direct children are archived
- WHEN an authorized caller reopens the exact Group Brief with a reason and then reopens one declared child
- THEN both selected archives remain unchanged, the Group is open with unfinished completion evidence, and the child is focused open work
- AND all untouched children remain archived without dependent or Git lifecycle effects

#### Scenario: Ambiguous or invalid Group history
- GIVEN multiple matching Group Brief archives, malformed canonical structure, incomplete archive inspection, an open Group collision, or an identity mismatch
- WHEN Group reopen is requested without sufficient exact valid selection
- THEN the command fails before creating or changing open Group state

## Design
- Approach:
  - Extend the Group command surface with a lock-protected restore operation that reuses safe archive inspection and the semantic document model.
  - Distinguish forbidden recreation of a completed identity from explicit restoration of one retained snapshot. Remove the status diagnostic only when the open Brief has active archive-bound evidence absent from every retained Brief snapshot; keep `group create` reuse forbidden.
- Boundaries:
  - Group reopen owns only the Brief lifecycle. Existing Change reopen continues to own executable child restoration and focus.
- Affected areas:
  - `src/commands/group.ts`, `src/cli.ts`, archive/work-ref and Group inspection helpers as needed
  - `test/integration.test.ts`, CLI help/routing tests, README, Core/Manage Skills and bundled fallback rules
  - `.rsp/specs/core-model.md`, `.rsp/specs/cli-contracts.md`, `.rsp/specs/skill-system.md`, and existing Group/reopen decisions
- Constraints:
  - Preserve archive immutability, `open | archived` as the complete state set, shallow Group identity, no-follow path safety, and failure atomicity.

## Tasks
- [x] Implement and register explicit Group reopen with exact archive selection, semantic validation, lock protection, and atomic publication from a disposable temporary file.
- [x] Update Group/status projection so supported restored Groups derive child state without permitting `group create` identity reuse.
- [x] Add integration and command-surface tests for success, ambiguity, malformed input, collisions, failure atomicity, and no implicit child/dependent/Git effects.
- [x] Reconcile public documentation, Core/Manage Skills, fallback rules, Specs, and lifecycle decisions.
- [x] Resolve the fixed review findings by moving temporary publication outside `changes/**`, rejecting non-empty Group work/focus subtrees, and making archive-bound reopen evidence non-replayable.
- [x] Resolve re-review by requiring each accepted evidence source path to belong exactly to the current Group's retained Brief path set.

## Verify
- Automated:
  - [x] Focused Group reopen/re-review regressions — 5 passed after the final correction; proves legitimate command evidence, replay rejection, current-Group retained-path binding, empty-subtree gates, identity safety, and two-step child recovery
  - [x] `mise exec -- pnpm vitest run test/history-query.test.ts test/tui/history-source.test.ts test/document-model.test.ts test/rsp-core-routing-contract.test.ts test/managed-controller-contract.test.ts` — 74 passed; proves archive-query, document-model, Core, and Manage contract compatibility
  - [x] `mise exec -- pnpm run build` and focused ESLint over changed TypeScript/test files — passed; proves package build and changed-surface lint compatibility
  - [x] `mise exec -- pnpm run lint` and `mise exec -- pnpm run test` — passed; 53 files / 618 tests prove repository-wide compatibility
  - [-] `mise exec -- pnpm run typecheck` — omitted as a passing gate because it reaches the pre-existing unrelated `test/issue-relationship.test.ts:56` Vitest matcher typing error in an untouched test; the project-required build/lint/test gates pass
- Manual or environment:
  - [x] `mise exec -- pnpm run release:package-check` — clean install valid for `@oevery/rsp@3.1.0-beta.4` with package SHA-256 `ee1c4b281992eaee0e800d979eb06d3ec01589dbc4fcbddec131113455f74f02`; the built-package surface plus retained two-child integration scenario prove distribution and lifecycle behavior
- Coverage:
  - No external host or provider is required; filesystem failure injection covers rollback where practical.

## Blockers
- none
