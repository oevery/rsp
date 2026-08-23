---
kind: "fix"
---

# Change: separate-readiness-from-first-fix

## Proposal
- Outcome: Preserve a passed implementation result when an unauthorized RSP migration blocks only post-verification readiness inspection
- Why:
  - A fresh `auto-multisurface-routing` candidate completed the requested product change, independent verification, and `npm test`, then changed `first_fix_result` to `failed` because an additional `rsp show --focused --json` command required `rsp update`.
  - The fixture forbids unrelated mutation, so running `rsp update` would exceed authority; treating that lifecycle/readiness limitation as an implementation failure makes provider evidence untruthful.
- Scope:
  - Revise the published `rsp` Skill durable-writeback contract so migration-required readiness inspection remains separate from implementation verification and first-fix evidence.
  - Keep lifecycle closeout fail-closed when `show` or `ready` cannot run without an unauthorized update.
  - Add deterministic semantic coverage and fresh provider evidence for the affected multisurface scenario.
- Non-goals:
  - Weakening `rsp update` authorization, project compatibility checks, archive readiness, or commit gates.
  - Treating arbitrary failed verification as passed.
  - Changing provider scoring, fixture requirements, or retrying model failures as infrastructure contamination.

## Spec
### MODIFIED
- Requirement: Implementation verification and post-verification readiness inspection remain distinct evidence boundaries.
  - Once declared implementation checks and required independent verification pass, a later `show` or `ready` failure caused solely by a required but unauthorized `rsp update` does not change the implementation result or `first_fix_result`.
  - The migration requirement remains visible as a lifecycle/readiness limitation and prevents archive or commit closeout until resolved under separate authority.
- Requirement: The Skill never runs `rsp update` merely to obtain readiness evidence unless repository repair or migration mutation is explicitly authorized.

### Acceptance
#### Scenario: Migration-required readiness does not rewrite implementation evidence
- GIVEN required implementation and independent verification passed
- AND `rsp show` or `rsp ready` reports that the project requires `rsp update`
- WHEN update authority is absent
- THEN the implementation and first-fix result remain passed, readiness is reported unavailable or incomplete, and no update, archive, or commit occurs

#### Scenario: Real implementation verification failure still fails
- GIVEN a declared implementation or independent verification check fails
- WHEN the result is recorded
- THEN implementation remains failed regardless of readiness availability

## Design
- Approach:
  - Co-locate the distinction in `skills/rsp/references/durable-review.md`, where the post-verification inspection is required.
  - State the narrow migration-required condition, preserve the failed-closeout result, and explicitly prohibit folding it into implementation or first-fix evidence.
  - Bump the published `rsp` Skill content version and add semantic contract assertions rather than fixture-specific branching.
- Boundaries:
  - This does not make readiness optional before archive; it only preserves the already observed implementation result.
  - Any failed declared implementation check, invalid Change evidence, or non-migration inspection failure retains its ordinary failure semantics.
- Affected areas:
  - `skills/rsp/SKILL.md` and `skills/rsp/references/durable-review.md`.
  - `test/evaluation/managed-controller-contract.test.ts`, `test/architecture/documentation-contract.test.ts`, and the beta candidate-composition identity in `evaluation/managed-controller/beta/manage-orchestration-beta.yaml`.
- Constraints:
  - Edit authored Skill sources, not the `.agents/skills/` projection.
  - Preserve the current trigger, authority, output, conditional-loading, and closeout contracts outside this one evidence-boundary correction.

## Tasks
- [x] Revise the durable-writeback evidence boundary and bump the `rsp` Skill content version.
- [x] Add deterministic semantic coverage for migration-required readiness separation and fail-closed closeout.
- [x] Refresh exact Skill-version and beta candidate-composition identities without changing the existing three-pair sampling catalog.
- [x] Run deterministic verification and a fresh three-pair `auto-multisurface-routing` provider comparison.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/evaluation/managed-controller-contract.test.ts test/skills/rsp-core-routing-contract.test.ts` — passed as part of 5 focused files and 154 tests; proves Skill semantics and package routing remain valid.
  - [x] `mise exec -- pnpm run typecheck`, `mise exec -- pnpm run build`, `mise exec -- pnpm run lint`, and `mise exec -- pnpm run test` — passed: 87 files and 914 tests; proves repository integration remains green.
  - [x] `git diff --check` and focused RSP check — passed with zero errors and zero warnings; proves patch and Change structure remain valid.
### Optional
- Manual or environment:
  - [x] Fresh `release:provider-compare -- --case auto-multisurface-routing --repetitions 3 --baseline-ref v3.2.0 --model combo/gpt-5.6-terra --effort medium --timeout-ms 900000` — passed on August 21, 2026: three eligible pairs, no contamination or replacement, candidate correctness and topology passed, and all three candidate receipts retained `first_fix_result: passed` with exactly two worker dispatches.
- Coverage:
  - Deterministic semantic tests own the durable evidence boundary; provider execution owns model compliance under the affected multisurface scenario.

## Blockers
- none
