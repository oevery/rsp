---
kind: "fix"
---

# Change: cached-token-reporting

## Proposal

- Outcome: exposed cached input tokens in evaluation reports and corrected the guide's outdated natural-correction validation status.
- Scope: report presentation, offline regression and evaluation guidance. Preserve historical reports and records; no new model/judge execution, Core/Commit, scoring, usage aggregation or label changes.

## Spec

Report cached input tokens separately from total input and output. When a retained executor stream is present, use root/descendant attribution and keep incomplete attribution unknown; otherwise use recorded native cached usage. Missing cached usage remains unknown, while an observed zero remains zero. Regrade cached tokens inherit the source execution and are not new executor usage. Cached usage is not a fee or savings estimate; do not add it to total input or compute a monetary/percentage benefit.

The guide must link the existing fixed-candidate natural-correction pair and retain the single-attempt, synthetic-history and no-matched-comparison limits.

### Acceptance
#### Scenario: Available and missing cached usage
- GIVEN fresh or regraded results with retained sessions or native usage
- WHEN a report is generated in a disposable job
- THEN cached tokens have the same provenance as executor usage; missing values remain unknown, zero stays zero, and verdicts/native records are unchanged.
#### Scenario: Historical evidence preservation
- GIVEN original jobs and reports
- WHEN existing evidence is inspected and a copied job is reported
- THEN originals remain byte-identical and the guide distinguishes observed bounded behavior from reliability or cost improvement.

## Design

Extend the existing report row through the existing session_usage result or native agent_result.n_cache_tokens. Do not change attribution or verdict calculation. Extend report regression controls for source selection, unknown/zero values and inherited usage; use a retained-job copy for real-record validation. The evaluation guide owns usage interpretation and evidence navigation; no product Spec or Decision Record delta is needed.

## Tasks

- [x] Updated report cached-token presentation and offline regression.
- [x] Corrected guide status and documented usage limits.
- [x] Verified affected behavior and preserved historical evidence.

- [x] Completed independent Code and Document review before authorized closeout.

## Verify

### Required
- [x] Independent review found no actionable issues.
- [x] Offline fresh/regrade/session/native/unknown/zero controls preserve verdicts and native bytes.
- [x] Retained-job copies expose cached usage while original records and reports remain unchanged.
- [x] Applicable code, lint, document and Change checks pass.
- [x] Protected rules, Skills, scoring and calibration inputs remain unchanged; no new model/judge execution.

Five focused methods passed. The first focused run exposed an incomplete synthetic
regrade source in the new test; its failure remains in focused.log. Supplying the
real temporary source record fixed the fixture without changing scoring. Tests
cover fresh/regrade provenance, session aggregation excluding unrelated sessions,
native fallback, observed zero and unavailable usage. Existing failure and unscored
report controls retain their verdicts and original-byte checks.

The full build/code suite passed all 77 tests in 14 files. Full lint, documentation,
named Change and diff checks passed. Only the report function changed among the
evaluation wrapper's 26 definitions; usage attribution and scoring are unchanged.

Reports generated only in copies of two retained jobs preserve all four trial
verdicts and correctly display their cached input totals. All 302 original files
and 300 copied native files remain unchanged; only the two copied summaries differ.
The broader preservation check matched 41,219 prior evidence files and 860 protected
Skill/rule/task/support/calibration files. The guide's source-identity statement
is backed by 41 captured Skill files and 40 task files matching current sources.

The [verification summary](../../tests/skills/reports/cached-token-reporting-20261017/verification-summary.json)
links the retained failure, passing checks, copy observations and preservation
records. These are reporting checks, not new model/judge acceptance, a regrade or
measured cost savings. Independent reviewer 01a1496e-78b9-7c00-9875-124d0e3296ab returned Code and
Document clean for the fixed four-file scope against 10d0f618. It checked source
selection, unknown/zero handling, inherited usage, unchanged scoring, the guide's
source identity and the four retained trial rows while reusing applicable checks.
The [review record](../../tests/skills/reports/cached-token-reporting-20261017/independent-review.json)
retains scope and limits; the original implementation summary remains unchanged.

## Blockers

- none
