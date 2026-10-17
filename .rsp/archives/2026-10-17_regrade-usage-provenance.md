---
kind: "fix"
---

# Change: regrade-usage-provenance

## Proposal

- Outcome: evaluation reports distinguish inherited executor usage from current regrade duration.
- Scope: report presentation, offline regression and evaluation guidance. No model/judge calls, scoring changes, historical report replacement or remote delivery.

## Spec

Regrade rows retain available executor token counts but explicitly identify them as inherited source-execution usage, not new execution cost. Their duration belongs to the current regrade trial. Configuration identifies the inherited executor and the recorded source-trial reference; missing references or usage remain unknown. Fresh execution keeps its own usage/time attribution. Judge usage is excluded and absence of executor execution does not mean a free regrade. Verdicts, scores and native records remain unchanged.

### Acceptance
#### Scenario: Regrade with inherited usage
- GIVEN retained regrade artifacts with source_trial action regrade
- WHEN a report is generated in a disposable copy
- THEN executor tokens are labeled inherited, seconds are labeled current regrade duration, and the source reference is visible without changing verdicts or native bytes.
#### Scenario: Unknown usage and fresh execution
- GIVEN missing usage/source metadata or a fresh trial
- WHEN reporting
- THEN unknown values stay unknown and fresh execution is not labeled inherited.

## Design

Use the existing native source_trial action for presentation. Keep session_usage and verdict calculation unchanged; do not traverse or rewrite historical source trials. Test generated Markdown from disposable copies of retained results and small controls, with no native job execution.

The evaluation guide owns the reporting interpretation. Product workflow contracts
and architecture are unchanged; no Spec or Decision Record update is needed.

## Tasks

- [x] Add report usage/time/source attribution.
- [x] Add offline preserved-result and unknown/fresh controls.
- [x] Update guidance and validation record.
- [x] Completed independent Code and Document review before closeout.

## Verify

### Required
- [x] Independent review of the fixed implementation and records is clean.
- [x] Offline reporting distinguishes inherited usage, current regrade time and fresh execution without changing counts/verdicts.
- [x] Missing source and usage stay unknown; original results and reports are preserved.
- [x] Build, lint, code and affected document checks pass.
- [x] No real executor/judge runs or scoring-rule changes.

Four focused methods passed, followed by the full build/code suite (13 files,
75 tests), lint and affected document checks. Offline controls preserve successful,
failed and unscored verdicts, distinguish fresh execution, and retain unknown usage
and missing source references. The existing calibration/regrade regression passed.

A separate offline probe generated a new summary only inside a retained-result copy.
Both historical regrade trials retained their inherited token counts and current
28.6/27.6-second durations, with regrade-pass counts unchanged. All 161 original
job files and 160 copied native files stayed byte-identical; only the copied summary
changed. No regrade, executor or semantic judge was run.

Preservation checks matched 40,951 historical evidence files and 860 protected
Skill/rule/task/support/calibration files. HEAD and index stayed unchanged.
The two expected pre-fix assertion failures remain in focused-red.log.
[Verification summary](../../tests/skills/reports/regrade-usage-provenance-20261017/verification-summary.json)
links the tests, preserved-result probe and byte audits. This is report attribution
coverage, not measured savings, pricing or live model acceptance.

Independent reviewer `01a148d6-9bef-7891-a69d-f95b8583aad3` returned `clean`
for Code and Document on the fixed four-file target. It confirmed report-only
behavior changes, unchanged scoring/usage algorithms and matching source-trial
metadata, comparing original and copied native records while reusing applicable
tests. The [review record](../../tests/skills/reports/regrade-usage-provenance-20261017/independent-review.json)
retains its scope and limits; the implementation summary remains unchanged.

## Blockers

- none
