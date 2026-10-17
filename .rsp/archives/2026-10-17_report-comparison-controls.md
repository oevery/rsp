---
kind: "fix"
---

# Change: report-comparison-controls

## Proposal

- Outcome: show matched, mismatched and unavailable saved provenance in comparison reports, with Skill variation and recorded execution identity shown separately.
- Scope: comparison report presentation, offline controls, guidance and retained observations. No scoring, Core/Commit or dependency changes; no model/judge execution or lazy-loading adoption.

## Spec

The comparison report adds saved-input provenance states. Control expectations come from retained source bytes:
shared support, dependency lock, image identity and task verifier inputs. Missing
required evidence is unavailable, not a match. Skill content is a separate
candidate dimension; a difference alone must not be labelled an incompatible
experiment. Keep these states separate from retained native execution identity. Matched bytes
do not establish snapshot completeness or agreement with execution-time inputs.
Different file inventories remain unavailable because loss and deliberate file
changes cannot be distinguished. Preserve original verdicts.

### Acceptance
#### Scenario: Source evidence controls
- GIVEN copies with unchanged, changed or missing provenance
- WHEN the current report compares their retained outcomes
- THEN report the expected three-state classifications without changing historical reports or recorded execution identity.
#### Scenario: Separate Skill variation
- GIVEN otherwise matching sources and changed or missing Skill content
- WHEN the same comparison is observed
- THEN distinguish the Skill evidence status separately and retain original verdicts and source records.

## Design

Copy one retained two-task job and its inputs. Vary one source dimension at a
time, or remove it, with a separate changed/missing Skill pair. Hash selected
relative file inventories rather than absolute snapshot locations. Diagnostic
classification remains the independent fixture expectation, not a replacement grader.
Call only the existing report function, with execution forbidden at the wrapper
boundary. Preserve native result bytes and every generated comparison.

## Tasks

- [x] Add and run source/Skill comparison controls.
- [x] Retain actual report output, classification gaps and original evidence.
- [x] Check diagnostic code and reconcile the evidence record.
- [x] Add saved-source report presentation and separate recorded execution identity.
- [x] Validate the revised report against all eleven controls and applicable regressions.

## Verify

### Required
- [x] Identical copied inputs match; changed inputs mismatch; missing inputs remain unavailable; Skills stay separate.
- [x] Actual reports and original native verdicts are retained; any missing report distinction is disclosed.
- [x] Original reports and protected inputs outside the authorized report boundary remain unchanged; no models, judges or prototype adoption.
- [x] Applicable offline and document checks pass.

### Initial diagnostic evidence (before the reporting correction)

Eleven controls completed: one unchanged source, changed/missing controls for
four source dimensions, and a separate changed/missing Skill pair. Diagnostic
expectations distinguish matched, mismatched and unavailable, but all eleven
actual comparison sections were identical. At that stage the report checked native
recorded task checksums and executor settings; it retains its manual provenance
caveat and does not claim complete comparability. Saved support, lock, image,
verifier and Skill distinctions were a report coverage gap, not a scoring failure.

The source is the retained two-task natural-correction job
2026-10-16T14-23-01.588819Z. Copies retain original native references, checksums
and verdicts; mutations affect only copied saved inputs after execution. Each
report still presents the same two original passes. Eleven reports are not
22 executions, new acceptance or regrades. Copied native files except the new
summary remain byte-identical, and original job/input records remain unchanged.

The [diagnostic record](../../tests/skills/reports/report-comparison-controls-20261017/diagnosis.md)
and per-case observations retain classifications, relative input hashes, full
reports and preservation checks. The initial parser failure and original script
remain retained; the corrected probe completed without repeating completed cases.
The evaluation guide documents the standalone offline command and its boundary.
The original diagnostic evidence remains unchanged. The user subsequently
authorized report presentation correction and validation against the eleven
controls; scoring and native execution remain outside this correction.

### Reporting correction

The report now separates Saved snapshot comparison from Recorded execution
comparison. Shared support, dependency lock, image identity and task verifier
inputs each show matched, mismatched or unavailable. Saved Skill content has its
own state and is explicitly a candidate dimension. Existing native checksum and
executor-setting checks are unchanged; no verdict or execution record is rewritten.

Snapshot states describe the currently retained sibling inputs only. Matching
bytes cannot authenticate original execution or prove complete capture. Missing,
unreadable or different file inventories remain unavailable, including intentional
file-set changes that cannot be distinguished from evidence loss. The image state
compares the saved identity string, not a new container inspection.

All eleven retained-input controls now assert displayed states against their
independent fixture expectations and preserve the recorded-execution comparison.
Each copy still presents the same two original passes. A focused two-method run
also covers legacy jobs without saved inputs and the previous native checksum/model
comparison limits. Original pre-correction controls, outputs and parser failure
remain unchanged. New evidence is under
[report-comparison-display-20261017](../../tests/skills/reports/report-comparison-display-20261017/).

The preservation audit matches all 45,439 prior evidence files and 862 protected
inputs outside the authorized evaluator. AST comparison confirms report is the
only modified existing evaluator function; two saved-source display helpers were
added. No scoring, Core/Commit, installed dependency or prototype was changed.

The full build/code suite passed 77 tests in 14 files, including the expanded
46-method Harbor integration suite. Full lint and document checks passed.

### Independent review and delivery

Independent code/document review returned clean, verifying the three-state
presentation, separate Skill dimension, execution-identity caveat, eleven actual
control reports and native-file preservation. It independently checked 5,688
review evidence files and the 45,439-file historical manifest without changes.
The [review record](../../tests/skills/reports/report-comparison-display-20261017/independent-review.json)
retains attribution and coverage. It reused passing checks; permission read
failures and calibration sample branches received no new runtime validation.
No claim of original-execution authentication or complete capture follows.

The evaluation README owns the durable comparison guidance. No Core/Commit,
scoring or architecture contract changed, so no product Spec or Decision Record
update is needed. The user authorized archive and one local commit after the
clean review, without push. Original diagnostic and implementation evidence,
including the parser failure, remain unchanged.

## Blockers

- none
