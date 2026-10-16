---
kind: "research"
---

# Change: review-calibration-coverage

## Proposal

- Outcome: the observed delivery-report false rejection is covered by ordinary
  regression tests; two additional review samples matched their candidate
  component expectations in one targeted semantic calibration.
- Scope: existing evaluation_contract.py regression tests, two sample directories
  under the existing calibration corpus, and its documentation.
- Non-goals: new native tasks, product Skill/checker/rubric changes, executor-model
  runs, unselected judge calls, new scoring machinery or human label confirmation.
  The authorized judge experiment ran once per new sample without automatic retry
  and retained all outcomes.

## Spec

No product contract or scoring-rule delta. Samples follow existing task contracts
and separate deterministic checks from task-defined semantic judging.

### Acceptance
#### Scenario: Product verification passes but delivery preparation fails
- GIVEN the existing commit-prerequisite-failure fixture and real preparation exit 73
- WHEN the preserved report truthfully distinguishes passed verification from blocked delivery
- THEN its corrected checker accepts the report and still rejects missing preparation,
  unsupported status values and actual staging after failure.

#### Scenario: Review calibration controls
- GIVEN the existing structural-audit-control and review-staged tasks
- WHEN their oracle output is followed by the new sample transformation
- THEN the correct clean control preserves scope and passes programmatic checks,
  while the staged false-clean control preserves scope and fails programmatic checks.
- AND semantic expectations remain candidate labels; offline checks establish no
  actual judge verdict or human-reviewed status.

## Design

The existing outcome-fixture test now includes the already-fixed preparation
failure case, exercising actual setup, oracle and checker boundaries. This guards
against the previously observed verification-field overconstraint without testing
Skill prose or duplicating the checker implementation.

The correct-clean sample reuses structural-audit-control's oracle. The added
review-staged sample mistakes the repaired working file for the reviewed
index and omits the actual staged defect. An existing reference sample supplies
its correct finding counterpart. Task workspaces, baselines, prompts and rubrics
remain unchanged. A bounded offline sample test uses the original verifiers and
checks source and Git-index preservation. Expected labels remain local author
candidates, not adopted human ground truth. No product contract or significant
design choice changed, so no Spec or Decision Record update is needed.

## Tasks

- [x] Extend ordinary regression coverage for the observed report false rejection.
- [x] Add the two candidate review-calibration samples and their offline checks.
- [x] Update calibration navigation and distinguish offline, semantic and label evidence.
- [x] Run affected checks and preserve existing candidate/input evidence.
- [x] Run only the two new samples once with the fixed judge and retain all results.
- [x] Complete independent review of regression coverage, samples and records.

## Verify

### Required
- [x] Two focused test methods passed through real fixture setup, oracle/sample
  execution and deterministic verifiers. Both unavailable and passed product-check
  reports remain valid when preparation blocks delivery; missing/contradictory
  preparation, invalid status and unauthorized staging remain rejected.
- [x] Complete Harbor offline integration passed (one Vitest wrapper, 43.70s);
  all 40 native schemas and document checks passed. Scoped lint exited 0 with
  one warning that Python is not configured for ESLint; the Python suite actually
  executed. Named Change and diff checks passed.
- [x] 831 pre-existing protected files were compared: only calibration README
  changed. Product Skills, task definitions/rubrics and all nine existing sample
  scripts/labels remain unchanged. All 2,138 selected prior evidence files match.
  HEAD/index are unchanged. [Verification summary](../../tests/skills/reports/judge-calibration-coverage-20261017/verification-summary.json)
  links retained logs and records the exact local scope.

- [x] Authorized job 2026-10-16T16-28-56.108310Z ran only the two new samples,
  one attempt each, deterministic oracle only, no executor model and zero Harbor
  retries. Clean received checks/judge 1/1; missed-finding received the expected
  0/0. Both are calibration matches, not two successful task-solving executions.
  Original zero reward and assertion failure remain preserved. Both labels stay
  candidate. [Result report](../../research/reports/2026-10-16T16-28-56Z.md) links
  native scores, exact selection, frozen inputs and preservation checks.
- [x] Independent reviewer 01a145a6-bd13-7b11-b787-95d888daa25e returned Code clean
  and Document clean for the nine-file boundary against 963c222c. The review
  checked the actual regression, candidate labels, oracle-only selection, native
  scores and preservation hashes, reusing applicable tests. [Review evidence](../../tests/skills/reports/judge-calibration-coverage-20261017/independent-review.json)
  retains the verdict and its limits; it is not human label confirmation.

The corpus now contains eleven samples. The new clean/missed-finding expectations
remain candidate labels. The two observed semantic matches do not confirm human
ground truth or general judge reliability. No product rule, checker or rubric was
tuned during the experiment. No additional run, regrade or resume was performed.
The user separately authorized archive and one local commit after clean independent
review, with no push; the results grant no further execution or label authority.

## Blockers

- none
