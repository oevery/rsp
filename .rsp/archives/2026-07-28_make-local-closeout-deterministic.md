---
kind: "fix"
---

# Change: make-local-closeout-deterministic

## Proposal
- Outcome: Qualified `local` Manage closeout deterministically creates one terminal local commit for a clean non-small boundary without imposing a Change-to-commit cardinality model.
- Why:
  - Current `eligibility`, `may justify`, and `explicit delivery` wording let the same clean terminal Group be interpreted as either auto-commit or advisory-only.
  - Encoding recovery, reopen, and terminal commit counts as a new protocol would solve the ambiguity by adding conflicting complexity.
- Scope:
  - Make the qualified `local` terminal route mandatory after the existing exact-owner, lifecycle, verification, clean-boundary, and denial gates.
  - State minimally that Change granularity follows observable outcome and shared acceptance/rollback boundaries, not commit count; each Commit invocation still creates exactly one commit.
  - Align stable Specs, Manage/Core guidance, user-facing closeout documentation, config comments, and focused contracts.
- Non-goals:
  - Do not add commit-count state, new config enums, automatic push/publication, or new recovery/reopen cardinality rules.
  - Do not change `rsp-commit` execution semantics or split Changes merely to match Git commits.

## Spec
<!-- Describe observable behavior and requirements. Implementation notes belong in ## Design. -->
### MODIFIED
- Requirement: qualified `local` terminal closeout is deterministic.
  - After lifecycle closeout, a non-small terminal Change or Group with one exact owned boundary, fresh decisive verification, and no nearer denial routes once to `rsp-commit`.
  - Small terminal work still defaults to no commit; an ambiguous, mixed, stale, or denied boundary stops without staging and reports that boundary.
- Requirement: Change and commit boundaries remain distinct without a cardinality protocol.
  - Shape keeps one observable outcome sharing acceptance, review, archive, and rollback boundaries in one Change, regardless of how many Git checkpoints its lifecycle may require.
  - Each `rsp-commit` invocation creates exactly one commit for its already-derived boundary; existing recovery and reopen rules remain independent exceptions rather than a new count model.

### Acceptance
#### Scenario: qualified local terminal Group
- GIVEN Core selected and qualified Manage for a non-small Group, effective closeout is `local`, every child and the Group are closed, verification is fresh, and the remaining diff is one clean exact owned boundary
- WHEN Manage derives terminal Git delivery
- THEN it routes that boundary once to `rsp-commit` without requiring the user to repeat `commit`
- AND it does not infer push or publication authority

#### Scenario: semantic Change boundary
- GIVEN one cohesive outcome shares acceptance, focused verification, review, archive, and rollback boundaries
- WHEN Shape derives the smallest owner
- THEN it keeps one Change without splitting it to enforce one Change per commit
- AND Commit still creates exactly one commit per invocation

## Design
- Approach:
  - Replace subjective terminal delivery language with one positive route and existing stop gates; keep recovery wording separate.
  - Add one concise Change-versus-commit boundary statement at the stable Spec/Shape seam rather than duplicating a cardinality table across Skills.
- Boundaries:
  - Prompt-level routing, stable workflow truth, and contract tests only; no CLI runtime or persisted controller state.
- Affected areas:
  - `skills/{rsp-manage,rsp-shape}/SKILL.md` and `skills/rsp/references/{managed-routing,durable-review}.md`
  - `.rsp/specs/{skill-system,core-model}.md`, README/config guidance, and focused contract tests
- Constraints:
  - Preserve lifecycle/Git separation, exact staging, terminal-small no-commit behavior, fallback non-execution, and explicit push/publication authority.

## Tasks
- [x] Make qualified `local` terminal commit routing deterministic after existing gates.
- [x] Clarify the semantic Change boundary without adding commit-count state or duplicated exception matrices.
- [x] Align documentation/config wording and focused contracts, then sync and verify the authored package.

## Verify
- Automated:
  - [x] `mise exec -- pnpm run build`, `mise exec -- pnpm run lint`, and `mise exec -- pnpm vitest run --maxWorkers=1` pass; 50 files and 573 tests prove the integrated package behavior.
  - [x] Focused Manage/Core/Shape/config contracts pass (302 tests), `cmp -s rules/rsp-rules.md .rsp/rsp-rules.md`, `git diff --check`, and `node dist/cli.mjs check --focused` pass.
- Manual or environment:
  - [x] Inspected the final prose path from qualified `local` Group closeout to one `rsp-commit` invocation; Change granularity remains semantic and no commit-count state or exception matrix was introduced.
- Coverage:
  - No new provider replay; retained real-host evidence remains immutable and current composition drift is reported by existing evaluation gates.

## Blockers
- none
