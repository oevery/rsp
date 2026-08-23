---
kind: "fix"
---

# Change: skill-context-optimization-followup/release-behavior-typecheck-baseline

## Proposal
- Outcome: The release behavior acceptance harness has complete declarations and strict test typing, and its protected commit surfaces are scored from the actual Git metadata shape.
- Why:
  - Clean HEAD `818ab30` reproduces 14 TypeScript errors because two release behavior modules lack declarations and their consumers consequently lose type information.
- Scope:
  - Add or complete the declaration surfaces for release behavior acceptance/evidence, correct the resulting strict typing defects, and align commit body/trailer scoring with the declared runtime metadata.
- Non-goals:
  - Changing provider execution, candidate policy, release identity, or the current Skill optimization contracts beyond the accepted protected-surface scoring correction.

## Spec
### MODIFIED
- Requirement: Every imported release behavior harness module exposes the runtime contract required by strict TypeScript consumers.
  - The declaration must match current runtime exports, nullable/optional behavior, managed holdout fields, and failure contracts without widening to `any`.

### Acceptance
#### Scenario: Repository typecheck covers release behavior acceptance
- GIVEN the current release behavior runtime modules and tests
- WHEN `pnpm run typecheck` checks the repository
- THEN the harness imports and consumers pass strict typing and protected commit surfaces use the declared runtime metadata shape

## Design
- Approach:
  - Derive declarations from the actual `.mjs` exports and existing managed-controller types, make the smallest consumer corrections required by truthful nullability, and correct the commit surface projection exposed by that contract check.
- Boundaries:
  - Prefer `.d.mts` declarations beside runtime modules; do not rewrite runtime code solely for typing.
- Affected areas:
  - `scripts/release-behavior-acceptance.d.mts` and `scripts/release-behavior-evidence-check.d.mts`
  - `scripts/managed-controller-eval.d.mts` and `scripts/release-behavior-acceptance.mjs`
  - `test/release/release-behavior-acceptance.test.ts`
- Constraints:
  - Preserve provider execution, exact error semantics, candidate identities, and retained evidence while failing protected commit surfaces on forbidden body or trailer text.

## Tasks
- [x] Map runtime exports and existing declaration dependencies.
- [x] Add the smallest truthful declarations and strict consumer corrections.
- [x] Correct protected commit body/trailer scoring and add focused regression coverage.
- [x] Run focused release behavior tests, typecheck, build, lint, and serial full tests.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/release/release-behavior-acceptance.test.ts --reporter=dot --no-file-parallelism` — passed 1 file / 14 tests; proves runtime/declaration compatibility and failure contracts.
  - [x] `mise exec -- pnpm exec vitest run test/release/release-behavior-acceptance.test.ts test/release/release-provider-comparison.test.ts test/evaluation/managed-controller-contract.test.ts --reporter=dot --no-file-parallelism` — passed 3 files / 76 tests after review correction pass 2; proves commit body/trailer residue reaches the behavior dimension through the real metadata shape.
  - [x] `mise exec -- pnpm run typecheck` — passed; the 14-error clean-HEAD baseline is resolved without `any` escape hatches.
  - [x] `mise exec -- pnpm run build` — passed.
  - [x] `mise exec -- pnpm run lint` — passed.
  - [x] `mise exec -- pnpm run skills:security-check` — passed 38 files with 0 findings.
  - [x] `mise exec -- pnpm exec vitest run test/release/release-provider-comparison.test.ts --reporter=dot --no-file-parallelism` — passed 1 file / 37 tests after refreshing the candidate composition and default holdout identity locks.
  - [x] `mise exec -- pnpm exec vitest run --no-file-parallelism --reporter=dot` — passed 89 files / 880 tests after review corrections.
  - [x] `git diff --check` — passed after final writeback.
### Optional
- Manual or environment:
  - [ ] none
- Coverage:
  - Clean HEAD `818ab30` reproduced the same 14 errors, confirming the typecheck defect was pre-existing. The correction adds declarations for the two runtime modules, extends the existing managed holdout declaration with its real release-behavior and evaluation metadata surfaces, narrows test consumers through explicit presence checks, and fixes protected commit scoring to consume `body` plus `trailers[{key,value}]`.

## Blockers
- none
