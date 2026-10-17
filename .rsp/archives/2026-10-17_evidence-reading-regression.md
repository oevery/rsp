---
kind: "research"
---

# Change: evidence-reading-regression

## Proposal

- Outcome: validated two bounded ways to avoid unnecessary evidence reads and check
  reruns without weakening required verification: source-attributed stop/continuation
  evidence selection and first-call check exit-code attribution.
- Scope: one retained interruption trajectory, the existing correction check,
  offline positive/negative controls, evaluation guidance and a research record.
- Non-goals: new model/judge execution, replay of captured calls, Core or other Skill
  changes, task/rubric changes, runtime instrumentation, weakened worker independence,
  automatic retries or remote delivery.

## Spec

No product contract delta. Required independent checking remains required; a
selected evidence packet cannot replace its original native records or wider review.
The evaluation guide owns the diagnostic guidance. No stable product contract or
significant architectural decision changed, so no Spec or Decision Record update is needed.

### Acceptance
#### Scenario: Select decisive recovery observations
- GIVEN retained native parent and child trajectories and their actual artifacts
- WHEN required identity, partial effects, command exit, worker completion and
  continuation observations are selected with source locations and hashes
- THEN the original stop-before-continuation sequence is reconstructible without
  dumping complete trajectories into context.
- AND missing exit/completion, premature dispatch or mismatched identity is rejected;
  a worker-written stopped receipt alone is insufficient.
#### Scenario: Attribute the check exit on its first execution
- GIVEN passing and failing copies of the existing expiry fixture and a succeeding
  following Git-status command
- WHEN the check is executed separately with its own command/result
- THEN both success and failure are unambiguous after one execution per required role,
  while the original semicolon batch can mask failure with the last command's exit.
- AND offline role labels do not claim native worker independence or future model behavior.

## Design

Use a bounded field selection from retained native events; retain file, line and
SHA256 provenance and omit rule bodies/unrelated context. Positive and negative
controls test only the selected evidence obligations. Preserve full original logs
and final evidence files, and record selection size as bytes, not a token-cost claim.
Exercise the existing real check in disposable workspaces using original failing
source and the preserved repaired source. Record exit codes separately for the
implementation/reviewer roles; do not change the independent-execution contract.
No generic evidence framework, host adapter or runtime tool is introduced.

## Tasks

- [x] Extract and validate the source-attributed recovery evidence selection.
- [x] Verify first-call exit attribution on actual passing/failing fixture checks.
- [x] Run applicable offline checks and preserve all original evidence and limits.
- [x] Completed the requested independent Code and Document review before authorized closeout.

## Verify

### Required
- [x] Independent review of the fixed implementation and records is clean.
- [x] Selected fields match original bytes and establish the required order;
  missing, mismatched or premature evidence fails the bounded controls.
- [x] Mixed-batch failure masking is reproduced; isolated check results distinguish
  success/failure with one check per required role and no repair/retry of the check.
- [x] Build/lint/code/document checks pass; original records, product Skills and
  native tasks remain unchanged, with no new model or judge execution.

All 18 selected observations and six artifact values match their original sources.
The 23,815-byte packet reconstructs the bounded causal sequence; the full three
sessions (711,164 bytes) remain retained. Seven negative evidence controls reject
missing native observations, failed command exit, wrong identity and premature
continuation; self-reported receipts do not fill those gaps.

Both original-failing and retained-repaired source variants were exercised with the
unchanged real check. The semicolon batch returns zero in both cases; separate
check results are respectively 1 and 0 for each required role, followed by Git status
zero. Each separated role executes one check without retry; the mixed control is
an additional disclosed diagnostic execution, and role labels are not native workers.

Four focused tests passed, followed by full build/code validation (13 files, 75 tests),
final lint and document/Change checks. Initial lint diagnostics and expected failing
check outputs remain retained. The [verification summary](../../tests/skills/reports/evidence-reading-20261017/verification-summary.json)
links logs, provenance checks and preservation evidence. The [research record](../../research/reports/2026-10-17T06-38-29Z.md)
distinguishes byte-size and local-process observations from unmeasured model cost or
behavior. No product rule, native task, judge or runtime adapter was changed.

Independent reviewer `01a14899-a88a-7c31-989b-9de63d609515` returned `clean` for
the five-file fixed target, checking original source attribution and retained process
receipts while reusing applicable test evidence. The [review record](../../tests/skills/reports/evidence-reading-20261017/independent-review.json)
retains scope and limits; the original implementation summary remains unchanged.

## Blockers

- none
