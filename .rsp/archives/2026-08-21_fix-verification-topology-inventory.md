---
kind: fix
---

# Change: fix-verification-topology-inventory

## Proposal
- Outcome: Remove nonexistent evaluation datasets from the verification topology contract
- Why:
  - `test/architecture/verification-topology.test.ts` fails in a clean checkout because its expected top-level evaluation inventory includes two directories that Git has never tracked.
- Scope:
  - Remove `rsp-implement-behavior` and `skill-shape` from the expected evaluation directory inventory.
  - Re-run the topology test and full repository suite, then refresh the blocked downstream Change evidence.
- Non-goals:
  - Creating empty placeholder directories or inventing missing datasets.
  - Changing evaluation ownership, Vitest collection, or any existing dataset content.
  - Mixing this correction into `orthogonalize-discipline-receipts`.

## Spec
### MODIFIED
- Requirement: The verification topology inventory matches the reusable evaluation dataset directories tracked by Git.
  - The contract lists only directories present in a clean checkout.
  - Absent historical or proposed dataset names are not represented by empty placeholders.

### Acceptance
#### Scenario: Clean checkout evaluation inventory
- GIVEN the evaluation tree from commit `e0dd5ea` plus the current protocol migration
- WHEN the verification topology architecture test enumerates top-level dataset directories
- THEN its expected list exactly matches the directories present in the checkout

## Design
- Approach:
  - Delete only the two stale expected strings from the architecture assertion.
- Boundaries:
  - Git tree evidence, not local empty directories, defines the repository inventory.
- Affected areas:
  - `test/architecture/verification-topology.test.ts`.
  - This Change and the downstream verification evidence in `orthogonalize-discipline-receipts`.
- Constraints:
  - Preserve all current protocol-migration edits and unrelated dirty paths.

## Tasks
- [x] Align the architecture inventory assertion with the tracked evaluation tree.
- [x] Run focused and full verification, then complete fixed-scope review.
- [x] Refresh the downstream Change blocker and verification evidence without merging ownership.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/architecture/verification-topology.test.ts` — 1 file / 4 tests passed; proves: the clean-checkout evaluation inventory contract passes.
  - [x] `mise exec -- pnpm run test` — 87 files / 913 tests passed; proves: the topology correction restores the complete repository suite with the in-progress protocol migration.
  - [x] `git diff --check` — passed; proves: the combined worktree patch has no whitespace errors.
  - [x] `node dist/cli.mjs check --focused --json` — passed with only expected `delta_markers_found` info diagnostics; proves: both selected Changes remain structurally valid.
### Optional
- Manual or environment:
  - [x] none required
- Coverage:
  - The focused architecture test protects the corrected inventory; the full suite proves the downstream Change is no longer blocked.
  - Fixed-scope review against `e0dd5ea` is clean for both Code and Document pipelines.

## Blockers
- none
