---
kind: "research"
---

# Change: interruption-recovery-fixture

## Proposal

- Outcome: The new native Harbor scenario generates partial effects during execution, pauses
the writer, observes cessation and resumes the same correction without repeating
effects or losing evidence. Offline controls and one fixed-candidate live attempt
passed, with failures retained and no task retry. The delivery includes the task,
regression coverage, evaluation guidance and result record. Product Skill changes,
broader experiments and cross-session claims remain outside this scope.

## Spec

No product contract delta; exercise the existing coordinated recovery contract.

### Acceptance
#### Scenario: Resume an actually interrupted writer
- GIVEN a native worker starts a real process that appends the first output row,
  records correction count one and waits for an external stop signal
- WHEN the parent pauses the process, observes its command exit and awaits the
  original worker's completion before dispatching a fresh continuation worker
- THEN the continuation preserves the first row and stop evidence, appends only
  the remaining row and completes the same correction with count one.
- AND premature continuation, duplicate effects, missing stop evidence, reset
  counts and changes to user files or Git state fail deterministic controls.
- AND offline oracle execution establishes process/fixture behavior only; native
  worker attribution, settlement and action order require separately authorized
  real execution and semantic judging.

## Design

Use one task-local Python writer with begin/pause/resume operations and an exclusive
writer lock. The first phase blocks after its partial write until signalled. Pause
retains partial output, state and events after lock release; the host must separately
observe process-command and native-worker completion. Resume completes the same
correction using retained state. The helper owns only this deterministic workload,
not RSP recovery policy or model worker lifecycle. It has no automatic restart.

Use existing snapshot preservation and Reward Kit paths. Offline tests execute real
subprocesses and original verification, including negative mutations. A native-action
judge requires distinct actual worker sessions and causal stop-before-resume evidence;
self-authored receipts alone are insufficient. Keep execution logs under ignored
reports, with no new evaluation framework or global configuration. The evaluation
guide owns scenario usage and evidence limits. No product contract or significant
design decision changed, so no Spec or Decision Record update is needed.

## Tasks

- [x] Add the bounded task, writer, oracle and deterministic/native-action verifiers.
- [x] Add offline lifecycle and negative controls and document the evidence boundary.
- [x] Run affected validation and retain failures and unverified live limits.
- [x] Run the separately authorized single live attempt and retain native outcomes.
- [x] Complete independent review of the fixture, offline controls and live records.

## Verify

### Required
- [x] Real offline subprocess: partial write exists while writer is alive; premature
  resume fails; pause releases writer and process exits; resume preserves evidence
  and completes exactly once with correction count one.
- [x] Original verifier accepts the oracle and rejects untouched, duplicate-write,
  missing-evidence, reset-count and user/Git preservation violations.
- [x] Full offline integration, native schemas, applicable lint/build/code and
  documentation checks pass; these offline checks call no semantic judge or model.

The two focused methods passed. Their controls observed a real blocked writer,
rejected premature resume without effects, stopped and awaited the process, and
preserved partial evidence through completion. Restart and second resume were
rejected without repeated output. Ten deterministic negative outcomes were retained
in the focused log; they are expected controls, not execution errors. A separate
offline oracle received reward 1.0 with semantic not-run, retaining its workspace,
process log and original PID/event/snapshot files.

Build and the full code suite passed (11 test files, 69 tests, including the Harbor
offline wrapper); lint, 41 native task schemas, document and named Change checks
passed. Python parsing and shell syntax checks passed. The full test log contains
the exercised noninteractive-UI diagnostic, with final suite exit zero. Preparation
read/template errors remain separate from passing checks. See the
[verification summary](../../tests/skills/reports/interruption-recovery-20261017/verification-summary.json)
and its retained logs and oracle artifacts.

- [x] The authorized fixed-candidate live job 2026-10-16T17-31-06.682194Z passed
  once, checks/judge 1/1, one attempt and zero Harbor retries. Native records
  confirm writer PID 205 stopped, original command session exited zero and the
  first worker completed before fresh-worker dispatch. Continuation invoked resume
  once, preserved partial output and evidence, and retained correction count one.
  Two Python preparation/inspection syntax failures and an early missing-artifact
  read remain in the original trajectories. No additional run, resume, regrade or
  product correction was performed. [Live result](../../research/reports/2026-10-16T17-31-06Z.md)
  links frozen inputs, native observations and preservation of 40,696 prior and
  159 new evidence files.
- [x] Independent reviewer 01a145cc-34e6-72f3-a025-a534800cc5d2 returned Code clean
  and Document clean for the 22-file boundary against 733b5345. It checked native
  ordering, retained evidence, offline coverage and report accuracy, reusing
  applicable tests without new execution. [Review record](../../tests/skills/reports/interruption-recovery-20261017/independent-review.json)
  retains the verdict and limits.

The live result covers cooperative process cessation plus normal native-worker
completion and fresh-worker continuation. Forced model cancellation, cross-session
recovery, desktop-host equivalence and repeated reliability remain unverified.
The user authorized archive and one local commit after clean independent review,
with no push. These actions do not extend the live acceptance boundary.

## Blockers

- none
