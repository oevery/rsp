---
kind: "research"
---

# Change: rsp-review-cost-gate-calibration

## Proposal
- Summary: Calibrate rsp-review context-cost gates with three fresh repeated paired matrices
- Why:
  - Candidate `2026.07.20.5` passes all eight quality fixtures, but a single matrix passes median overhead at 10.57% while failing maximum overhead at 62.74%.
  - Prior matrices show large baseline inspection variance, so one paired ratio is insufficient to distinguish persistent Skill cost from model/provider noise.
- Scope:
  - Add a maintainer-only calibration path that runs three fresh complete baseline/candidate matrices after the method is frozen.
  - Compute each case's three paired cumulative-input overhead ratios and take their median.
  - Apply the existing 30% global-median and 50% per-case limits to those per-case medians.
  - Retain normalized calibration metadata and an evidence-backed pass/fail recommendation.
- Non-goals:
  - Editing the candidate, changing quality fixtures, lowering thresholds, publishing/promoting the Skill, or treating provider billing as equivalent to reported cumulative input.

## Spec
<!-- Describe what finding or decision must be captured. Implementation notes belong in ## Design. -->
### ADDED
- Requirement: repeated paired cost estimator
  - Calibration uses exactly three new repetitions with the same candidate, fixture, harness, model, effort, provider source, sandbox, and timeout.
  - For each case and repetition, paired overhead is `(candidate_input / baseline_input - 1) × 100`; the case estimate is the median of its three ratios.
  - The aggregate estimate is the median of the eight case estimates and must be at most 30%; every case estimate must be at most 50%.
- Requirement: calibration integrity
  - Any failed run, timeout, mutation, missing usage, or identity drift fails calibration instead of dropping a sample.
  - The three matrices used for calibration are created after this method is declared; previously observed matrices are not reused.

### Acceptance
#### Scenario: repeated cost passes
- GIVEN three complete fixed-identity matrices
- WHEN every case median is at most 50% and their aggregate median is at most 30%
- THEN the candidate passes the context-cost gate and can proceed to a separate promotion Change

#### Scenario: unstable or incomplete evidence fails closed
- GIVEN a run times out, mutates, lacks usage, or changes an input identity
- WHEN calibration aggregates evidence
- THEN it returns failed and identifies the invalid sample without substituting earlier data

## Design
- Approach:
  - Extend the existing evaluation harness with a narrow `calibrate` command rather than a general benchmark framework.
  - Reuse the existing serial matrix runner and normalized run metadata, aggregate deterministic input metrics, and keep raw events ignored.
  - Freeze the harness after focused tests, execute one three-repetition calibration, audit its identities and samples, and retain a concise report.
- Affected areas:
  - `scripts/rsp-review-eval.mjs`, `scripts/rsp-review-eval.d.mts`, and `test/skill-behavior.test.ts`
  - `research/evaluations/rsp-review/<date>-cost-calibration/`
- Constraints:
  - Candidate hash remains `399619e81e40cd16a29bf64a88bb7ca214410097a7d3d61adb927a28dc47c69c`.
  - Use default user provider, `gpt-5.6-terra`, `low`, read-only sandbox, and 180-second per-run timeout.
  - Do not inspect or persist provider credentials.

## Tasks
- [x] Finalize the proposal, spec, and design details for this change
- [x] Implement and test deterministic three-repetition calibration aggregation
- [x] Freeze the harness and execute 48 fresh runs
- [x] Audit identities, operational integrity, paired samples, and thresholds
- [x] Retain the calibration report and promotion/optimization recommendation
- [x] Verify the result and update any required durable specs or scoped instructions

## Verify
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/skill-behavior.test.ts`
  - [x] `mise exec -- pnpm run build`
  - [x] `mise exec -- pnpm run typecheck`
  - [x] `mise exec -- pnpm run lint`
  - [x] `mise exec -- pnpm run test`
  - [x] `node dist/cli.mjs check --focused`
- Manual:
  - [x] Confirm exactly three new matrices and 48 runs share one candidate/fixture/harness identity and contain usage without mutation or timeout
  - [x] Recompute case and aggregate medians independently from retained calibration metadata
- Durable updates:
  - [x] Decide whether this change produced durable knowledge that belongs in `.rsp/specs/` or stable instructions that belong in the nearest project-owned `AGENTS.md`
  - [x] If yes, write only stable facts to the smallest correct target file before archive; do not promote task history, debugging notes, or one-off implementation context

## Blockers
- none
