---
kind: "fix"
---

# Change: calibration-sample-selection

## Proposal

- Outcome: the calibration CLI now selects exact samples without a temporary driver or unrequested judge calls. Scope: evaluation wrapper, offline regression and guidance. No live executor/judge, scoring or candidate-label changes, retries, Core changes or remote delivery.

## Spec

Accept repeatable `calibrate --sample task--sample`. Without it, preserve task-wide selection. Select repeated names once. Optional `--task` constrains eligibility; unknown or out-of-task samples fail before creating jobs. Snapshot tasks must be exactly those owning selected samples; calibration metadata, prepared samples and native task paths must agree. Live authority and zero retries remain unchanged.

### Acceptance
#### Scenario: Exact sample selection
- GIVEN named samples from existing tasks
- WHEN calibration is prepared with live authority
- THEN only distinct selected samples are captured and submitted with original scripts, labels and rubrics.
#### Scenario: Invalid selection or missing authority
- GIVEN unknown or out-of-task samples, missing live permission or offline mode
- WHEN calibration is requested
- THEN no job is created or Harbor execution invoked.

## Design

Filter canonical sample IDs before snapshotting and derive their owning task subset. Reuse validation, oracle preparation and native execution. Offline tests enter through CLI parsing and replace only Docker/process execution boundaries. No new scheduler or grading path.

The evaluation guide owns the new maintainer-tool usage. Product workflow contracts
are unchanged; no Spec update or significant architectural Decision Record is needed.

## Tasks

- [x] Implement exact selection and rejection.
- [x] Add offline CLI and snapshot regression coverage.
- [x] Document usage and record validation.
- [x] Completed independent Code and Document review before closeout.

## Verify

### Required
- [x] Independent review of the fixed implementation and records is clean.
- [x] Exact/default selection, duplicate names, unknown/out-of-task rejection and live/offline gates pass offline.
- [x] Metadata, sample directories and native task sets match, and scripts, labels and rubrics remain unchanged.
- [x] Build, lint, code tests, schemas and document checks pass.
- [x] Original evidence, Skills, native tasks, scoring support and calibration samples remain unchanged; no real model/judge runs.

The full build/code suite passed (13 files, 75 tests), including the final CLI
selection controls and existing calibration/regrade coverage. Lint, all 41 native
schemas and document checks passed. The added tests use simulated native process
results; no executor model, semantic judge or Docker execution was invoked by them.
The standard full-suite noninteractive UI diagnostic is expected and the suite exited zero.

Preservation checks matched 40,926 prior evidence files and 860 protected files
covering Skills, rules, native tasks, verifier support and calibration samples.
HEAD and index are unchanged. Initial missing-option failures and a corrected
test-double group field remain recorded separately from passing checks.
[Verification summary](../../tests/skills/reports/calibration-sample-selection-20261017/verification-summary.json)
links logs and exact tested inputs. Live acceptance is not claimed.

Independent reviewer `01a148cb-fe9f-7b71-8f87-0b0dab8cd99f` returned `clean`
for both Code and Document perspectives on the fixed four-file target. It checked
selection, rejection, snapshot consistency and retained authority, reusing applicable
offline results. The [review record](../../tests/skills/reports/calibration-sample-selection-20261017/independent-review.json)
retains its scope and limits; the original implementation summary remains unchanged.

## Blockers

- none
