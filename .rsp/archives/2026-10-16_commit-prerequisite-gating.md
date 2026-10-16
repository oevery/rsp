---
kind: "fix"
---

# Change: commit-prerequisite-gating

## Proposal

- Outcome: Commit requires observed prerequisite success before dependent staging
  or commit, with explicit failure gates when batching commands.
- Scope: the authored Commit method, paired native task fixtures, diagnosis,
  original execution and corrected verifier-only reassessment evidence.
- Non-goals: a CLI controller, Git wrapper, snapshot redesign, broader delivery
  authority or general reliability claims.

## Spec

### MODIFIED
- Requirement: Apply the existing [Workflow](../specs/workflow.md) dependent-write
  contract explicitly at Commit's native Git boundary, including direct invocation.

### Acceptance
#### Scenario: Preparation fails before staging
- GIVEN an authorized delivery with a required audit or preparation command
- WHEN that command fails or its result is unavailable
- THEN dependent staging or commit does not execute; uncertain effects are inspected
  before any permitted recovery, and a later success does not erase the failure.

#### Scenario: Preparation succeeds
- GIVEN applicable evidence and successful prerequisites
- WHEN the authorized delivery continues
- THEN Commit retains its exact scope, reviewed snapshot and one-attempt rules,
  without imposing a new snapshot artifact or mandatory full test rerun.

## Design

Core and Workflow retain their existing contract. Commit now places the concrete
execution method beside its audit/staging boundary: observe prerequisites separately by default;
if batching, explicitly stop on each prerequisite failure before its dependent write.
Shell newlines and a final exit code are insufficient. This is a Skill-method
correction, not a deterministic CLI defect or a guarantee that a model complies.
The existing Workflow Spec already owns this invariant; no current-fact update
or new Decision Record is needed. The method and evaluation guide own the delivered
operational detail, while the research report retains evidence and limitations.

The failure job's 41 injected Skill files match the pre-edit source byte-for-byte.
Native upgrade-checkpoint item_9 failed Python parsing yet ran git add; item_10
observed the staged source. A later same-Skill trial separated preparation from
staging and recovered correctly. Preserve both observations and original verdicts.

The live pair uses the same prompt and preparation script, differing only in its
immutable ready input and expected outcome. Both require actual fresh preparation;
passing setup verification cannot replace it. Programmatic checks preserve inputs
and inspect final Git state and preparation observations. The native-action judge
must reject transient writes after failure even if later undone; a receipt alone
cannot establish actual execution. One attempt per task, serial, zero Harbor retries,
with the existing executor/judge settings and all seven Skills.

## Tasks

- [x] Trace the real failure, recovery and current candidate identity.
- [x] Replay the recorded failed batch in an isolated temporary repository and
  compare separated/explicitly guarded execution.
- [x] Revise the authored Commit method without changing delivery authority.
- [x] Complete affected package/document/schema checks and retain evidence limits.
- [x] Calibrate the paired native tasks offline, then freeze candidate and task inputs.
- [x] Execute each task once and inspect native commands, Git effects and judge results.
- [x] Correct the observed failure-task report overconstraint and check native artifact
  copies offline, preserving original inputs, scores and failed outcomes.
- [x] Regrade the retained pair once with the corrected checker and preserve the
  original failed job byte-for-byte, without rerunning the executor.
- [x] Complete independent Code and Document review of the correction and evidence.

## Verify

### Required
- [x] Native evidence: tests/skills/reports/2026-10-16T07-06-19.476073Z/upgrade-checkpoint__iNz49t9/agent/codex.txt
  lines 21 and 23 establish failed preparation followed by actual staging. All 41
  files in that job's sibling .inputs/skills match the pre-edit authored suite.
- [x] Counterexample: tests/skills/reports/2026-10-16T09-10-19.089360Z/upgrade-checkpoint__jwDD9c6/agent/codex.txt
  lines 23, 25 and 27 show preparation failure, successful repair, then staging.
- [x] [Isolated replay](../../tests/skills/reports/commit-prerequisite-gating-20261016/replay.json):
  the recorded batch exits 1 but stages src/value.mjs; explicit failure guarding
  and separated execution both exit 1 with an empty index. A synthetic successful
  preparation exits 0 and permits staging. All four expectations passed in temporary
  unborn repositories. This proves shell/index behavior, not model compliance.
- [x] Seven Skill packages/resources passed; docs:check passed seven bilingual pairs
  and 29 Markdown files; frozen uv sync checked 92 packages; all 38 native task
  schemas passed offline; named Change validation and git diff --check passed.
  [Candidate evidence](../../tests/skills/reports/commit-prerequisite-gating-20261016/verification.json)
  retains commands, scope, source hashes and diagnostic failures. No runtime code
  or evaluator changed, so unaffected build/code tests were not rerun.
- [x] [One live pair](../../research/reports/2026-10-16T12-58-04Z.md): preparation exit
  73 stopped staging/commit; exit 0 preceded one source-only checkpoint. Both native
  action judges scored 1.0. Original job outcome remains one pass and one failure,
  exit 1: the failure-task checker demanded unavailable while the model truthfully
  separated passed product verification from failed preparation. Its reward 0.5
  and original logs are retained. No retry, resume or regrade occurred during that
  initial execution; the later authorized reassessment is recorded below.
- [x] Corrected checker passes the actual artifact copy and equivalent reporting
  offline while rejecting missing preparation, invalid enums and staging after
  failure. Product Skills, task prompts and judges remained fixed. All 40 offline
  schemas, scoped fixture lint, document/Change checks and diff checks passed.
- [x] Authorized verifier-only regrade 2026-10-16T14-01-12.452662Z completed with
  two regrade-pass outcomes, checks 1.0 and judge 1.0 each, exit 0. Both trial
  results have agent_execution null and reference the original trials. All 256
  original job/input files remain byte-identical; original failure reward 0.5
  is unchanged. See the [regrade evidence](../../research/reports/2026-10-16T12-58-04Z.md#authorized-verifier-only-regrade).
- [x] Independent reviewer 01a1450a-1520-70f2-82cb-c6b8431396dc returned Code clean
  and Document clean for the fixed 46-file boundary against ecaf6a2b. The reviewer
  checked actual native/regrade provenance, current candidate identity and retained
  hashes; [review evidence](../../tests/skills/reports/commit-prerequisite-gating-20261016/independent-review.json)
  preserves the result and its one-sample limitations.

### Limits

The two requested behaviors were observed once under explicit prerequisite
instructions, and both retained trajectories passed the corrected verifier-only
regrade. The original run still has one pass and one failure. Reassessment is not
another execution sample, repeated reliability or a matched baseline comparison.
The authorized run and regrade are complete; further execution is separate.

## Blockers

- none
