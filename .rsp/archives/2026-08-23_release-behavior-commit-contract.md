---
kind: "fix"
---

# Change: release-behavior-commit-contract

## Proposal
- Outcome: Make the commit-surface behavior holdout accept repository-valid scoped or unscoped Conventional Commit subjects while retaining substantive message and residue gates.
- Why:
  - A real candidate completed the task and created a clean `feat:` commit but failed only because the fixture demanded an unnecessary `display-name` scope.
- Scope:
  - Broaden the subject pattern and add deterministic coverage for both accepted forms and invalid subjects.
- Non-goals:
  - Removing the English, `feat`, body-bullet, trailer, local-commit, or residue requirements.

## Spec
### MODIFIED
- Requirement: Commit acceptance follows the fixture repository's actual Conventional Commit authority rather than one invented scope spelling.
  - Both `feat: ...` and `feat(display-name): ...` are valid; non-`feat`, malformed, or non-English subjects still fail.

### Acceptance
#### Scenario: Valid unscoped feature commit
- GIVEN a completed fixture task with the required body and WorkRef trailer
- WHEN the local commit subject is `feat: normalize display name whitespace`
- THEN the subject contract passes and residue, task-result, and boundary gates decide acceptance

## Design
- Approach:
  - Replace the mandatory-scope regex with one optional exact scope and test representative accepted and rejected subjects.
- Boundaries:
  - Keep message quality based on observable repository convention, not fewer checks.
- Affected areas:
  - Commit-surface holdout manifest and focused release behavior tests.
- Constraints:
  - The failed 2026-08-23 report remains diagnostic and is not rewritten.

## Tasks
- [x] Correct the commit subject contract and add focused regression coverage.
- [x] Run focused and repository verification.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/release/release-behavior-acceptance.test.ts` — passed 1 file / 14 tests; proves scoped and unscoped valid subjects plus malformed rejection.
  - [x] `mise exec -- pnpm run lint` and `mise exec -- pnpm run test` — passed lint, build, 88 test files, and 872 tests; proves repository compatibility.
  - [x] `node dist/cli.mjs check --focused --json` and `git diff --check` — passed with 0 errors and 0 warnings; proves the converged correction is structurally clean.
### Optional
- Manual or environment:
  - [ ] Targeted `commit-release-surface-leakage` provider rerun.
- Coverage:
  - The targeted rerun covers commit-surface behavior only; other scenario reports remain independently identity-bound.

## Blockers
- none

## Durable Decisions
- Current facts: No Spec update is needed; the fixture-local contract now matches its existing English Conventional Commit authority.
- Lasting rationale: No Decision Record is needed; this removes an unsupported scope constraint while preserving substantive message gates.
