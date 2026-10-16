---
kind: "research"
---

# Change: validate-natural-correction-continuation

## Proposal

- Outcome: correction-natural and correction-continue each passed once against
  fixed candidate ca5b6a68571bf0d259f9e81b353f1ce596222ee5, with native collaboration
  and preservation evidence retained.
- Scope: existing native tasks, current executor/judge settings, immutable input
  capture and preserved execution evidence. The user authorized one attempt per
  task with no automatic retries and retention of failures.
- Non-goals: product/fixture/judge corrections, new interruption-recovery scenarios,
  comparative performance or reliability claims, regrade or resume.

## Spec

No product contract delta. Existing [Workflow](../specs/workflow.md) authority and
independent-review obligations remain unchanged.

### Acceptance
#### Scenario: Bounded one-attempt observation
- GIVEN the fixed current Skills and two existing task definitions
- WHEN each task executes once, serially, with zero Harbor retries
- THEN retain native results and captured inputs, distinguish product/task failures
  from unavailable evidence, and inspect actual worker, check and wait attribution.

#### Scenario: Honest continuation evidence
- GIVEN correction-continue's explicitly synthetic prior ineffective correction
- WHEN interpreting the result
- THEN preserve its prior count and evidence limits; claim neither a freshly executed
  prior correction nor real host interruption/resume coverage.

## Design

The existing Harbor wrapper and seven-Skill configuration supplied the run.
Unchanged schema/offline calibration evidence was reused and actual image bytes
were verified before execution. Source and settings stayed fixed; old and new
job/input artifacts remain preserved without retry, resume, regrade or result
rewriting. Native parent/child evidence was inspected alongside programmatic checks
and semantic scores. No product correction was indicated or implemented.

This experiment changes evidence, not a product contract or lasting design choice;
no Spec or Decision Record update is needed. The research report owns the result
and its limits, while original native jobs own execution and grading evidence.

## Tasks

- [x] Freeze current candidate, selected tasks, configuration and environment identity.
- [x] Run each selected task once and preserve all native results and failures.
- [x] Inspect attribution, checks, waits, continuation decisions and source preservation.
- [x] Record bounded conclusions and any unresolved verification gap.
- [x] Complete the requested independent review of the final records and evidence.

## Verify

### Required
- [x] Actual image/source agreement: existing linux/arm64 image matched current
  package/support bytes. All 1,388 tracked source files, 88 injected files and
  dependency lock matched after execution.
- [x] Job 2026-10-16T14-23-01.588819Z retained exactly one attempt per task,
  concurrency one and zero Harbor retries. Both passed checks 1.0 and judge 1.0;
  process exit 0. No failed, unscored or executor-error trial; no resume/regrade.
- [x] Native parent/child records establish a real implementation worker, a distinct
  fresh read-only reviewer, executed checks and parent waits for each task.
  Continuation dispatches preserve one prior synthetic correction and do not reset
  the count. [Result report](../../research/reports/2026-10-16T14-23-01Z.md) links
  actual records and separates observed behavior from interpretation.
- [x] All 1,519 prior evidence files remain unchanged; 234 new native job/input
  files are retained. HEAD/index unchanged. Product, fixture and judge inputs
  were not modified. Report/Change consistency is checked before returning.
- [x] Independent reviewer 01a14526-5556-7e13-a098-bada1bf89963 returned Document
  clean with no actionable findings, confirming native attribution, counts,
  preservation and bounded conclusions. [Review evidence](../../tests/skills/reports/natural-continuation-20261016/independent-review.json)
  retains the verdict, scope and reused-check limits.

### Limits

Each task ran once under explicit repository acceptance rules. Supplied prior
history is not real interruption/resume evidence. These observations show no
product defect requiring correction, but prove neither general reliability nor
fully unprompted delegation. The user separately authorized archive and one local
commit after clean independent review, with no push. The evidence grants no
additional experiment or product-correction authority.

## Blockers

- none
