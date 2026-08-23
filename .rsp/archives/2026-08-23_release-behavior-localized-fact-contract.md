---
kind: "fix"
---

# Change: release-behavior-localized-fact-contract

## Proposal
- Outcome: Keep required release facts as hard product-surface gates without treating localized final handoff wording as an English-only failure.
- Why:
  - A 2026-08-23 candidate preserved all three facts in `RELEASE.md` and expressed them semantically in Chinese final prose, but failed only because two English fragments were absent.
- Scope:
  - Reclassify English final-wording coverage as diagnostic while retaining the canonical migration token as a hard final gate and all facts as hard `RELEASE.md` gates.
- Non-goals:
  - Weakening the durable release-note contract, adding a semantic model judge, or changing behavior harness code.

## Spec
### ADDED
- Requirement: Material negative facts are hard-gated on the durable release artifact; localized final prose is not failed solely for omitting one English wording.
  - The canonical API migration remains a hard final-output token, while preferred English terminology remains diagnostic.

### Acceptance
#### Scenario: Localized handoff preserves the same facts
- GIVEN `RELEASE.md` contains the breaking removal, exact migration, and command-injection reason
- WHEN the final handoff states the same meaning in Chinese and retains the canonical migration code
- THEN product, boundary, and behavior gates pass while English narrative coverage remains diagnostic

## Design
- Approach:
  - Move `breaking` and `command injection` from hard `expected_output` and final-surface requirements to `narrative_output`.
- Boundaries:
  - Keep all three facts required in `RELEASE.md`; keep the exact migration code required in final output.
- Affected areas:
  - Material-negative-fact holdout contract and focused release behavior tests.
- Constraints:
  - Only this scenario contract identity changes; the shared harness and other matching scenario evidence remain reusable.

## Tasks
- [x] Correct the material-fact output classification.
- [x] Add deterministic contract coverage and verify repository compatibility.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/release/release-behavior-acceptance.test.ts` — passed 1 file / 14 tests; proves durable facts remain hard gates and English final wording is diagnostic.
  - [x] `mise exec -- pnpm run lint` and `mise exec -- pnpm run test` — passed lint, build, 88 test files, and 872 tests; prove compatibility.
  - [x] `node dist/cli.mjs check --focused --json` and `git diff --check` — passed with 0 errors and 0 warnings; prove structural convergence.
### Optional
- Manual or environment:
  - [ ] Targeted `material-negative-fact-control` provider rerun.
- Coverage:
  - The rerun proves one localized real-model handoff passes without weakening `RELEASE.md`.

## Blockers
- none

## Durable Decisions
- Current facts: No Spec update is needed; the fixture-local contract now follows the existing diagnostic-final-wording boundary.
- Lasting rationale: No Decision Record is needed; this removes an English-only false negative while preserving hard durable facts.
