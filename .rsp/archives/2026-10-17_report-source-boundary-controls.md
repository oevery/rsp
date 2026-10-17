---
kind: "fix"
---

# Change: report-source-boundary-controls

## Proposal

- Outcome: keep comparison reports available when saved verifier directory traversal fails, validated by calibration/read-error controls.
- Scope: retained-job copies, diagnostic controls and evidence. Only the saved verifier discovery error boundary may change; no scoring/Core/Commit changes, dependency changes, lazy-loading adoption or model/judge execution.

## Spec

The report must retain other provenance and native results when verifier discovery fails. Calibration sample verifier inputs that
are identical, changed or missing yield matched, mismatched or unavailable,
respectively; absence of a Skill snapshot must remain unavailable. Inject file
read and directory traversal errors only at the filesystem boundary. The expected
report behavior is continued output with affected provenance unavailable. Retain
any exception and actual filesystem effects when that expectation is not met;
collecting a failing control is not evidence of a corrected implementation.

### Acceptance
#### Scenario: Calibration sample snapshots
- GIVEN copied retained calibration results and sibling task/sample inputs without Skills
- WHEN sample verifier content is unchanged, changed or missing
- THEN retain expected and actual provenance states without changing scores, labels or original files.
#### Scenario: Unavailable source reads
- GIVEN deterministic file-read or directory-traversal failure injection during reporting
- WHEN the existing report attempts to read saved provenance
- THEN record whether output completes and affected provenance is unavailable, preserving exceptions and any stale copied summary without presenting it as new output.

## Design

Use the retained two-sample calibration job 2026-10-16T16-28-56.108310Z.
Copy it and its sibling inputs into new directories. Invoke only report; forbid
Harbor execution. Keep original native references and verdicts. Inject
PermissionError on a selected read_bytes call and during iteration of one sample
verifier directory. This is filesystem fault injection, not host permission or
container acceptance. Preserve before/after hashes, output and failures per case.

## Tasks

- [x] Add and run the five bounded controls.
- [x] Retain calibration statuses, injected errors and report effects.
- [x] Verify original preservation and document findings and limits.
- [x] Guard verifier discovery and prechecks against filesystem errors.
- [x] Regress the five controls in fresh copies and run affected verification.

## Verify

### Required
- [x] Three calibration cases establish actual states and absent-Skill presentation.
- [x] Two fault controls establish completion or failure with actual side effects and exception evidence.
- [x] Original job, inputs, historical reports and protected implementation outside the authorized reader remain unchanged.
- [x] Diagnostic and document checks complete; unresolved report expectations remain explicit.

### Original diagnostic evidence (before correction)

The five controls ran once on copies of the retained two-sample job. Four meet
the report expectation: unchanged sample verifier inputs match, changed inputs
mismatch, missing input is unavailable, and an injected shared-support file read
failure leaves a usable report with support unavailable. All four reports show
Skills unavailable. Original calibration labels remain candidate, and both
recorded outcomes remain judge-calibration-match; the missed-finding sample's
raw reward 0 is preserved rather than recast as a new failed calibration.

The directory-iteration control does not meet the report expectation. Injected
PermissionError escapes the verifier-directory precheck at evaluate.py:121,
before the files helper exception boundary. Report generation aborts, leaving
the copied historical summary and all native files unchanged. That old summary
is explicitly marked as not newly generated. The probe exits 1; the full traceback,
injection target and actual effects remain in
[retained evidence](../../tests/skills/reports/report-source-boundaries-20261017/).
The [diagnosis](../../tests/skills/reports/report-source-boundaries-20261017/diagnosis.md)
separates this failure from the four successful controls.

The original job and inputs, 48,297 historical evidence files and 863 protected
inputs remain unchanged. The current evaluator, Core/Commit, scoring, labels,
dependencies and unadopted prototype were not modified. These are report-only
controls with deterministic filesystem fault injection, not real permission,
container or model acceptance. The directory-traversal failure was subsequently authorized for a minimal
correction. Original failed evidence remains immutable; new results use a separate
directory and do not replace this diagnostic outcome.

### Corrected report evidence

The minimal correction catches OSError around verifier directory discovery,
prechecks and collection. It leaves the verifier source unavailable on failure
and lets the remaining report finish. Only saved_comparison_sources changed
among evaluator functions; scoring, native comparison and verdict logic are intact.

The unchanged five-case probe ran once on fresh retained-job copies under
[report-source-boundary-fix-20261017](../../tests/skills/reports/report-source-boundary-fix-20261017/).
All five report expectations pass. Each report presents the two original
judge-calibration-match outcomes, with Skills unavailable. The injected traversal
failure now produces a new summary with only Task verifier inputs unavailable;
other sources match. Only copied summary.md files change, and original native
results, candidate labels and saved input bytes remain intact after reporting.

The original failure, traceback, old summary and diagnostic observations were
not replaced. Preservation checks match 49,484 prior evidence files and 862
protected inputs outside the authorized evaluator. The five-case probe is
byte-identical to its pre-correction version. A permanent regression uses a
synthetic negative calibration result with the same probe, and the focused
comparison regression also retains all eleven saved-source controls. These
checks do not execute a model, judge, verifier, container, resume or regrade.

The focused two-method regression passed, including the five calibration/read-error
controls and the eleven existing source comparison controls. Full build/code
validation passed 77 tests in 14 files, including the 47-method Harbor integration
suite. Full lint and document checks passed.

### Independent review and delivery

Independent code/document review returned clean. It traced CLI reporting through
the guarded verifier discovery and summary write; independently checked all five
reports, injection hits and unchanged native outcomes; and verified 2,376 review
artifacts, 49,484 historical artifacts and 862 protected inputs. The
[review record](../../tests/skills/reports/report-source-boundary-fix-20261017/independent-review.json)
retains attribution, reused checks and limits. No additional execution was needed.
Fault injection does not establish real OS permission or container acceptance.

The evaluation README owns the stable reporting guidance. No Core/Commit,
scoring or architectural contract changed, so no product Spec or Decision Record
update is needed. The user authorized archive and one local commit following the
clean review, without push. Original failures and superseded summaries remain
unchanged in their original evidence directories.

## Blockers

- none
