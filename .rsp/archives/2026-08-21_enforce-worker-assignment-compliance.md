---
kind: "fix"
---

# Change: enforce-worker-assignment-compliance

## Proposal
- Outcome: Provider acceptance fails closed when a required managed worker is not host-observed or its structured receipt reports work outside its Assignment, even when the final product result passes.
- Why:
  - The retained parallel provider evidence contained a worker that reported editing the shared Change and running the Manager-owned aggregate gate, but the aggregate report still classified compliance and boundary as passed.
- Scope:
  - Add worker-assignment policy to managed-controller cases.
  - Observe admitted worker dispatches from supported collaboration events.
  - Parse evaluation-required structured WorkerReceipts from settled worker messages and score assignment compliance separately from final-worktree correctness.
  - Surface receipt rejection and coordination recovery observations in provider reports.
- Non-goals:
  - Proving worker-local commands or diffs when the host exposes only a producer claim.
  - Optimizing provider token use or elapsed time.
  - Changing release, Git, archive, or publication authority.

## Spec
### MODIFIED
- Requirement: Worker-required managed-controller scenarios distinguish host observations, worker claims, Manager recovery, and final product correctness.
  - A successful collaboration dispatch with a non-empty receiver identity is host-observed.
  - Each declared worker Assignment has explicit allowed paths and commands plus Manager-only paths and commands.
  - A settled worker message used by evaluation contains one machine-readable WorkerReceipt correlated to its Assignment.
  - Missing, malformed, mismatched, or boundary-violating required receipts fail orchestration compliance without erasing a passing final product result.
  - Manager recovery is reported separately and never converts failed orchestration compliance to passed.
  - In release provider comparison, candidate worker compliance is a hard correctness gate; baseline worker compliance is diagnostic so a historical defect does not prevent candidate execution.
  - A baseline worker-compliance failure makes efficiency not comparable even when candidate correctness passes.

### Acceptance
#### Scenario: A worker reports Manager-owned actions
- GIVEN a two-worker parallel scenario with disjoint assignments and Manager-owned shared integration actions
- WHEN one settled WorkerReceipt reports a Manager-only path or command
- THEN product correctness may pass, orchestration compliance fails, the receipt is rejected, recovery remains observable, and the overall provider arm fails

#### Scenario: Host and producer dispatch counts disagree
- GIVEN a worker-required scenario
- WHEN the evaluation receipt claims the required dispatch count but supported host events do not observe it
- THEN routing topology is incomplete or failed rather than copied from the producer claim

#### Scenario: Both workers comply
- GIVEN two host-observed parallel worker invocations with correlated schema-valid receipts inside their assignments
- WHEN the Manager performs the shared integration action after settlement
- THEN orchestration compliance passes and existing product, boundary, and task-result gates remain decisive

#### Scenario: Historical baseline lacks compliant worker evidence
- GIVEN a baseline arm whose product result passes but whose host observations or WorkerReceipts fail worker compliance
- WHEN the paired release comparison runs
- THEN the baseline defect remains reported, the candidate arm still executes under a hard worker-compliance gate, and efficiency is not comparable

#### Scenario: Candidate lacks compliant worker evidence
- GIVEN a candidate arm whose product result passes but whose required worker evidence fails compliance
- WHEN the paired release comparison is summarized
- THEN candidate correctness and the overall provider verdict fail

## Design
- Approach:
  - Extend the managed-controller case manifest with evaluation-only worker Assignment policies; keep the runtime managed-exchange semantics unchanged except for allowing an explicitly requested JSON transport.
  - Project host lifecycle and settled WorkerReceipt claims from raw collaboration events into a dedicated worker-compliance observation.
  - Score worker compliance before the aggregate result and preserve separate product correctness and recovery facts.
  - Pass the explicit comparison arm into evaluation; use `diagnostic` enforcement only for baseline and `required` enforcement everywhere else.
  - Keep execution-eligible pairs separate from efficiency-comparable pairs so diagnostic baseline failures cannot produce token or latency comparisons.
- Boundaries:
  - `case.yaml` owns scenario policy; `managed-controller-eval.mjs` owns event projection and scoring; `release-provider-comparison.mjs` only aggregates and renders the resulting dimensions.
  - WorkerReceipt JSON remains an evaluation transport for the existing managed-exchange fields, not a second semantic receipt schema or durable RSP artifact.
- Affected areas:
  - `evaluation/managed-controller/holdout/managed-coordinated-parallel/case.yaml`
  - `scripts/managed-controller-eval.mjs` and its declarations
  - provider comparison projection and reports
  - managed-controller and release comparison contract tests
- Constraints:
  - Do not infer worker-local facts unavailable from host events; label WorkerReceipt content as a producer claim.
  - Do not parse arbitrary prose.
  - Preserve current non-worker and legacy cases without manufacturing lifecycle observations.

## Tasks
- [x] Add structured worker Assignment policy and receipt transport to the parallel holdout.
- [x] Observe successful collaboration dispatch identities, settled receipts, and collaboration tool calls.
- [x] Score worker receipt schema, correlation, paths, commands, rejection, and recovery independently from product correctness.
- [x] Project worker compliance into provider comparison verdicts and reports.
- [x] Add deterministic regression coverage for compliant, violating, missing, and host-mismatch evidence.
- [x] Resolve the accepted P1 by continuing candidate execution after baseline-only worker noncompliance while prohibiting efficiency comparison.
- [x] Apply the same arm-aware correctness and efficiency policy in release evidence reuse and deterministic replay.
- [x] Fail candidate worker noncompliance directly even when persisted dimensions are inconsistent or enforcement is mislabeled.

## Verify
### Required
- Automated:
  - [x] `mise exec -- pnpm exec vitest run test/evaluation/managed-controller-contract.test.ts test/release/release-provider-comparison.test.ts test/release/release-provider-evidence-check.test.ts` — passed: 3 files, 128 tests; proves event projection, arm-specific enforcement, direct candidate failure gating, replay, evidence reuse, and efficiency comparability
  - [x] `mise exec -- pnpm run build` — passed; proves declarations and generated CLI compile
  - [x] `mise exec -- pnpm run lint` — passed; proves repository static policy
  - [x] `mise exec -- pnpm run test` — passed: 87 files, 911 tests; proves full deterministic regression coverage
### Optional
- Manual or environment:
  - [ ] Provider-backed rerun — omitted because it requires separate provider-cost authorization; the changed parallel contract and harness invalidate the retained passed report for release reuse
- Coverage:
  - Required worker compliance, host/producer separation, recovered violation semantics, and unchanged ordinary scenarios.
  - The six-scenario matrix plan remains complete at eight pairs. Current harness identity is `1da539dfbd6a9f2a8ee6eab28e338632925593b906245993d3ec7cd73f37eb7e`. Offline rescoring of retained parallel raw evidence observes two candidate dispatches and rejects both legacy arms for missing structured WorkerReceipts; baseline additionally lacks host-observed dispatches.

## Blockers
- none

## Review Resolution
- Finding 1 `[P1] Baseline worker-compliance enforcement prevents candidate evidence`: accepted. The comparison now passes an explicit arm policy, treats baseline worker compliance as diagnostic, keeps candidate enforcement required, and excludes any worker-noncompliant scenario from efficiency comparison.
- Finding 2 `[P1] Release evidence and replay still reject baseline diagnostic dimensions`: accepted. Both consumers now use the same arm-aware correctness helper as comparison summary, validate the not-comparable efficiency policy, and preserve worker compliance fields during replay.
- Finding 3 `[P1] Candidate worker failure can be hidden behind inconsistent passed dimensions`: accepted. Shared correctness now rejects every worker failure directly unless it is the explicit baseline diagnostic case; evidence reuse and replay cover mislabeled candidate enforcement with passed dimensions.
- Fixed scope: `scripts/managed-controller-eval.mjs`, `scripts/managed-controller-eval.d.mts`, `scripts/release-provider-comparison.mjs`, `scripts/release-provider-evidence-check.mjs`, and their focused contract tests.
- Re-review: clean. Code and Document pipelines found no remaining actionable issue across evaluator, comparison summary, deterministic replay, release evidence reuse, tests, and this Change.

## Durable Decision
- Current facts: No current-fact update needed
- Current-fact target: N/A
- Facts to write: The maintainer evaluator, holdout contract, generated report projection, and regression tests are the direct owners of this behavior; the project design Spec already assigns evaluation to maintainer tooling and verification.
- Decision Record: No Decision Record needed
- Decision Record target: N/A
- Rationale to write: candidate compliance remains the release acceptance gate; baseline compliance is diagnostic because historical defects must remain visible without preventing candidate evidence, and any such defect invalidates efficiency comparability.
- Archive ready: yes; required deterministic verification and fresh fixed-scope re-review are complete. Provider-backed rerun remains an explicitly optional, separately authorized cost boundary.
