---
kind: "feature"
---

# Change: support-reopening-archived-change

## Proposal
- Outcome: Allow an archived Change to resume under the same WorkRef without losing archive evidence
- Why:
  - Managed closeout can archive work before a later real run exposes that the original acceptance or implementation was incomplete.
  - Creating a differently named follow-up fragments one logical correction across multiple owners and loses the converged Change context.
- Scope:
  - Add an explicit CLI operation that restores one exact archived executable Change as open work under the same WorkRef.
  - Preserve the selected archive as historical evidence, focus the restored Change, and make the reopened concern unfinished.
  - Re-derive dependency state correctly when one WorkRef has both open work and historical archives.
  - Support flat Changes and children of an open Change Group.
- Non-goals:
  - Reopening a closed Change Group or its Group Brief.
  - Cascading reopen into archived dependents.
  - Rewriting Git history, commits, tags, releases, or published artifacts.
  - Automatically deciding whether a concern belongs to the old Change instead of a corrective successor.

## Spec
<!-- Describe observable behavior and requirements. Implementation notes belong in ## Design. -->
### ADDED
- Requirement: reopen one archived executable Change
  - `rsp reopen <work-ref> --reason <text>` restores the uniquely matching archive to the canonical open-work path without removing or modifying the archive.
  - The restored Change keeps its original content and gains one unchecked Task and one unchecked Verify item describing the reason, so deterministic archive readiness is no until the concern is resolved.
  - The command focuses the restored Change without clearing unrelated focus markers.
- Requirement: select archive history safely
  - When a WorkRef has multiple archives, reopening by WorkRef fails with bounded exact-path candidates instead of selecting the newest implicitly.
  - `--from <archive-path>` selects one exact inspected archive, and the selected archive identity must match the positional WorkRef.
  - Missing, malformed, unsupported, or incompletely inspected archive history fails without creating open work or focus state.
- Requirement: preserve current-work authority
  - An existing open Change at the target WorkRef is never overwritten.
  - When a WorkRef is both open and archived, status and dependency projections treat it as open current work while retaining its archive history.
- Requirement: keep group and delivery boundaries explicit
  - A grouped child may reopen only while its Group Brief is open and declares that child.
  - A child of a closed Group fails with guidance rather than reopening the Group implicitly.
  - Reopen changes only RSP lifecycle files; Git delivery remains separately authorized.

### Acceptance
#### Scenario: uniquely archived Change is reopened
- GIVEN one valid archive exists for a WorkRef and no open Change uses that WorkRef
- WHEN the user runs `rsp reopen <work-ref> --reason <text>`
- THEN the archive remains unchanged
- AND an open focused Change is restored under the same WorkRef
- AND the reopened reason produces unfinished Task and Verify evidence

#### Scenario: archive selection is ambiguous
- GIVEN multiple valid archives exist for the same WorkRef
- WHEN the user reopens by WorkRef without `--from`
- THEN the command fails with bounded exact archive-path candidates
- AND no open Change or focus marker is created

#### Scenario: open work wins over historical state
- GIVEN an open Change and one or more archives share a WorkRef
- WHEN status or dependency planning is derived
- THEN the WorkRef is current open work rather than a resolved archived prerequisite

#### Scenario: closed Group child is rejected
- GIVEN a grouped child archive whose Group Brief is also archived
- WHEN the user attempts to reopen the child
- THEN the command fails with explicit closed-Group guidance
- AND it does not reopen any Group artifact

## Design
- Approach:
  - Reuse strict archive-history inspection and exact record selection instead of resolving archive filenames independently.
  - Under the RSP lock, validate the destination WorkRef and Group Brief, derive reopened content, create the open file exclusively, then create its focus marker with rollback on partial failure.
  - Keep archive snapshots immutable; repeated archive after correction naturally creates the existing date/suffix history sequence.
  - Give open WorkRefs precedence over matching archived identities in dependency node projection.
- Boundaries:
  - CLI lifecycle boundary: the user explicitly requests reopen; Manage may invoke it only within separately derived lifecycle authority.
  - Archive history remains historical evidence and never becomes current truth merely because it is selected.
- Affected areas:
  - `src/commands/reopen.ts`, `src/cli.ts`, and CLI argument types
  - `src/history/`, `src/core/dependency-plan.ts`, and focused integration tests
  - authored RSP Skill and fallback rule lifecycle guidance
- Constraints:
  - Preserve the two derived lifecycle locations `open` and `archived`; do not add a persisted controller state.
  - Never mutate or delete an archive, overwrite open work, follow symlinks outside managed roots, or silently choose among multiple archives.
  - Keep the operation forward-only with respect to Git and external delivery.

## Tasks
- [x] Implement strict archive selection and atomic reopen/focus behavior.
- [x] Make open work authoritative over same-WorkRef archive history in dependency and status projections.
- [x] Add CLI routing, user guidance, and authored Skill/fallback lifecycle rules.
- [x] Add focused tests for success, ambiguity, exact selection, collision, grouped boundaries, managed paths, and dependency re-blocking.
- [x] Write stable lifecycle and CLI facts to the owning Specs and retain the archive-snapshot rationale in `reopen-preserves-archive-snapshots.md`.

## Verify
- Automated:
  - [x] `mise exec -- pnpm run build` — bundled CLI includes the new command.
  - [x] `mise exec -- pnpm run typecheck` — command, history, and CLI contracts compose.
  - [x] `mise exec -- pnpm run lint` — authored implementation and tests meet repository rules.
  - [x] `mise exec -- pnpm run test` — 50 test files and 568 tests passed; reopen behavior and the existing CLI lifecycle remain compatible.
  - [x] `node scripts/native-design-composition-eval.mjs --run-real` — all 16 gates passed under immutable review-fix run `device-discovery-boundary-reopen-archived-change-review-fix-2026-07-27` for exact package SHA-256 `c95466420f8d06be722d19d26965d8ec845f9384293686982887c125336a0a19`; the prior immutable run remains as pre-correction evidence.
  - [x] `node scripts/managed-controller-eval.mjs run commit-message-quality product --model gpt-5.6-terra --effort medium --output-root .cache/rsp-manage-eval/reopen-archived-change` plus retained-evidence replay — passed with one exact-scope local commit, three fixture tests, clean worktree, and unchanged remote refs; retained as `2026-07-27-product-commit-message-quality-reopen-archived-change`.
  - [x] `mise exec -- node dist/cli.mjs check --focused` — the converged Change satisfies the RSP artifact contract.
- Manual or environment:
  - [x] The built-CLI integration fixture exercised create, archive, reopen, completion, and rearchive; both archive snapshots remained and focus cleared after the second archive.
- Coverage:
  - Closed Group reopening and automatic dependent-archive invalidation are explicitly out of scope.

## Blockers
- none
