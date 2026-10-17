---
kind: "research"
---

# Change: resume-snapshot-boundary-controls

## Proposal

- Outcome: establish offline controls for unchanged recovery, saved-task drift and saved-Skill drift through the existing RSP backup and Harbor native resume/lock path.
- Scope: test fixtures, regression, evaluation guidance and retained evidence. No recovery implementation, Core/Commit, scoring, dependency or model/judge changes; the lazy-loading prototype remains unadopted.

## Spec

Unchanged input permits the remaining trial to execute once through a local execution stand-in. Changed task or Skill content must be rejected by native lock comparison before dispatch to that stand-in. Selected failed trials may already have been removed by native resume; the RSP sibling backup must preserve their original bytes and prior job metadata. Successful trial bytes and the old lock must remain intact. Record actual job-level changes even on refusal; do not infer that a rejected resume has no filesystem effects.

### Acceptance
#### Scenario: Unchanged saved inputs
- GIVEN one preserved successful trial and one failed trial
- WHEN the existing wrapper resumes the failed trial with unchanged saved inputs
- THEN native recovery completes through the local execution boundary once and original failed evidence is backed up without changing the successful trial.
#### Scenario: Task or Skill snapshot drift
- GIVEN the same job with one saved task or Skill modified afterward
- WHEN recovery enters native resume
- THEN lock mismatch rejects further execution; the failed trial and job metadata remain in the sibling backup and actual refusal effects are retained.

## Design

Use the installed native Job, job locks, queue and CLI resume function. Replace only external image/environment readiness and the model/container trial execution boundary with local stand-ins. The wrapper's process boundary invokes the actual native command function in-process. Keep lock generation, comparison, deletion and backup logic real. Synthetic trial outcomes establish recovery control flow, not executor behavior or native container acceptance.

## Tasks

- [x] Add the three native-lock recovery controls.
- [x] Retain failure backups, success-preservation and refusal effects.
- [x] Run affected offline validation and document limits.

## Verify

### Required
- [x] Unchanged recovery dispatches only the pending trial once; task/Skill drift dispatches none.
- [x] Failed trial/job backup bytes and successful trial bytes are preserved; native effects and exceptions are observed.
- [x] Focused, applicable integration and document checks pass.
- [x] Original evidence and protected inputs remain unchanged, with no model/judge or prototype adoption.

### Observed evidence

The targeted method passed all three controls, and the full Harbor integration
entry passed with all 45 Python methods retained. Full lint and document checks
passed. Evidence is retained under
[resume-snapshot-controls-20261017](../../tests/skills/reports/resume-snapshot-controls-20261017/).
The focused run uses temporary directories; the separate retained diagnostic run
keeps complete synthetic jobs, saved inputs, failure backups, native exception
logs and per-case observation.json files under cases/none, cases/task and cases/skill.

- Unchanged inputs: exit 0; only failed-task dispatched once; both task results
  present and the summary reports two passes. The old failed trial was replaced;
  job result.json and summary.md changed.
- Task and Skill drift: each exits 1 with native FileExistsError for a lock
  mismatch; zero resume dispatches. Each failed trial was removed before refusal,
  and summary.md changed to report one incomplete task. Job config.json,
  result.json, job.log and lock.json remained unchanged in these observations.
- All controls: the successful trial is byte-identical; the original failed trial
  and prior config/result/lock/summary/job.log are byte-identical in the sibling
  attempt backup. Saved-input mutations remain visible, without repair or retry.
- Preservation audit: all 42,363 prior evidence files and 860 protected inputs
  match their initial hashes. Core/Commit, evaluator/scoring, task definitions,
  dependencies and the unadopted prototype were not changed.

The seed failure is a real local subprocess exit 7 represented as a synthetic
RuntimeError; resumed success uses a synthetic reward. Native Job, queue, lock
comparison and CLI resume run normally, while external readiness and trial
execution are replaced. The CLI function is called in-process through the
wrapper process adapter. Synthetic live flags exercise authorization handling;
no real model, judge, container or verifier runs. These results establish the
recovery controls, not real execution acceptance or a fresh CLI process test.

No recovery implementation correction is indicated by these controls. A native
refusal has observable filesystem effects, but the existing wrapper preserves
the failed evidence and the native lock prevents subsequent trial execution.
The evaluation README now makes this distinction explicit. Prior build and
unaffected code coverage from cached-token-reporting are reused; this turn reruns
the affected Harbor integration boundary.

### Independent review and delivery boundary

The independent code/document review returned clean. It traced native deletion,
lock checking and queue submission, and independently recomputed successful
trial, failed backup and metadata hashes in all three retained cases. The
[review record](../../tests/skills/reports/resume-snapshot-controls-20261017/independent-review.json)
records coverage and limits; original validation logs and observations remain
unchanged. No implementation correction was required.

The evaluation README owns the durable recovery guidance. No Core/Commit,
scoring contract or lasting architectural decision changed, so no Spec or
Decision Record update is needed. This completes the bounded offline controls;
real execution acceptance remains outside their scope. The user authorized
archive and one local commit after the clean review, without push.

## Blockers

- none
