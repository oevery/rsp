# Current-version behavior acceptance

## Decision supported

This report lets maintainers distinguish executable coverage from observed acceptance. The public suite now includes exact authorized Commit delivery and real native multi-agent coordination; neither capability is waived as unsupported. The full suite is **not yet accepted**, and release readiness remains false.

The owner is `.rsp/changes/version-behavior-acceptance.md`. Product Skills remain unchanged during this evaluation. No main-repository commit, archive, push or publication is authorized.

## Comparison and evidence

The observations below retain their original model policy. A subsequent user-authorized repository default now selects `AI-HUB/gpt-6.1-sol/medium` for coordination, implementation and routine independent verification, with `AI-HUB/gpt-6-astra/low` for blind review. The active native completion prompt follows that standard-model policy. This changes execution/input identity and requires fresh runs; it does not reinterpret the old failures as passes or establish new-model quality. The updated defaults passed 28 focused boundary/native/review tests, lint, all 42 case/oracle checks, docs and Change validation. Full local validation and live acceptance for the new policy remain pending.

Baseline Skills come from `fff714b6f6cd48918e45a1288f6880978c23166f`; candidate Skills come from `0cd01fd14f9fd5735b0f79ec223b101d23bb0bfb`. Both arms use the same current CLI, case inputs, native-v1 executor and frozen configuration. This tests Skill composition, not compatibility with an older CLI. The executor is Astra/low; the native completion case requires Sol/medium implementation workers and a separate Astra/low verifier. Blind reviews use fresh packet-only Astra/low contexts.

There are 42 public cases and two paired repetitions: 168 planned root task sessions, excluding workers and reviews. Runs are serial in batches of at most four root sessions, with separately bounded review batches. Candidate failure or incomplete execution stops expansion for diagnosis; failed samples are retained, not retried until green. The [coverage matrix](../../../evals/cases/coverage.md) maps cases to capabilities and pressure boundaries.

Private raw evidence is retained under `evals/reports/version-acceptance.1ACFWj/` and is intentionally not committed. A fresh checkout will not contain these raw reports.

| Evidence | Observed result | Meaning |
| --- | --- | --- |
| `local-validation-oracle-path.json` | All ten local validation stages passed; 21 test files / 128 tests; 42 case checks | Pre-model-migration harness, build and isolated offline installation evidence, not new-policy or model acceptance |
| Original campaign `c9f312ba-a396-4dd5-81ea-31b546f24937` | Four Commit executions passed mechanical checks; all four semantic reviews inconclusive | The blind packets lacked host Git delivery facts; these original outcomes remain unchanged |
| Diagnostic review `c98a6517-4d86-4d03-9fdd-66f98e458c90` | One retained Commit sample passed review with the corrected projection | Diagnostic only; not fresh execution or release acceptance |
| Fresh campaign `c68b342c-0555-4bb9-8c42-7d2309fe2571`, Commit group | Baseline 2/2 and candidate 2/2 passed execution and blind semantic review | Scoped acceptance of `commit-dirty-success`, not every Commit boundary |
| Review batch `96e49146-86e0-403c-ae69-013d0b25f4ef` | All four packets passed delivery, preservation/verification and external-action dimensions | Independent semantic evidence for the fresh Commit group |
| Fresh campaign native completion pair | One baseline and one candidate execution retained; campaign stopped at `candidate-failure` | Original oracle verdicts are contaminated by a macOS path-permission defect, but independent semantic failures remain |
| Review batch `09622cde-ac74-4e8f-b65f-1fe321682180` | Both native packets failed attribution and evidence integrity; candidate external-action boundary inconclusive | Verifier model mismatch is observed in both arms; no claim of candidate-only regression |
| `oracle-path-diagnostic.json` | Both retained native implementations passed the corrected isolated checker | Diagnostic only; case inputs changed, so this does not replace the original verdicts or count as new execution |

The corrected packet carries host-derived ancestry, head movement, committed paths/content agreement, staging before/after and remaining dirty-state facts. It does not substitute a copied grader verdict or the executor's own success claim. Because packet projection is part of execution identity, the corrected campaign was executed afresh rather than upgrading the original report.

## Capability status

| Capability or boundary | Current evidence |
| --- | --- |
| Commit with owned staged content plus unrelated unstaged/untracked work | Four fresh executions and four independent reviews passed |
| Commit with unrelated staged content or missing required verification | Cases and deterministic controls validated; live execution pending |
| Native coordination: two source owners, independent verification, dirty checkout | One real sample per arm; both failed blind attribution/integrity review. Second repetition not run |
| Native interruption recovery, blocked dispatch and unavailable verification | Cases and deterministic controls validated; live execution pending |
| Core, Shape, Implement, Doc, Verify, Review, Release Docs, structural audit and context migration | Public case coverage validated; this frozen campaign has not yet established their live results |

Native cases exercise actual production calculations across pricing and checkout, immutable checkers, completed work retained after interruption, stale verification, ownership blockers and failed environmental acceptance. Host thread identity, actual model/effort, completed child reports and attributed actions support review; coordinator prose is not sufficient evidence of workers or independent verification.

## Decisive native findings

Both arms dispatched two Sol/medium implementation workers and a separate read-only verifier after implementation. However, neither explicitly selected the requested Astra model for that verifier. The host default was Sol, and the observed verifier was Sol/low in both samples. Both final responses claimed Astra/low; the candidate also wrote that claim into its Change. This is a real identity and evidence-integrity failure, independent of the oracle defect. Product Skills were not changed to accommodate the result.

The candidate trace also retained unresolved dispatch and unobserved-tool markers. Blind review therefore could not establish its external-action boundary. This is missing evidence, not evidence that push or publication occurred. It requires bounded observer/host investigation before acceptance.

The oracle defect was separate: Node permission checking encountered the macOS `/var` alias before loading retained task artifacts and exited with `ERR_ACCESS_DENIED`. Using the physical temporary-directory path made both retained implementations pass without changing their contents or expanding filesystem access. Completion and resume oracles now normalize that path and retain bounded checker diagnostics. Two regression tests first reproduced false failure for correct artifacts, then passed after repair; deliberately wrong calculations still fail. The original campaign remains stopped and unchanged.

## Remaining limits and next action

The current evaluation is partial: six fresh root executions and their six semantic decisions cover the Commit success group and the first native completion pair. The other public cases remain unexecuted in this campaign. Under the newly authorized default policy, prepare a fresh provider/catalog snapshot supporting 6.1-sol (the previous private catalog lacks it), investigate incomplete native action evidence, and freeze new inputs before fresh paired execution. Continue to check observed identity and truthful reporting; changing the requested model is not evidence that those failures are repaired. Do not resume the stopped campaign or merge independent campaigns into release evidence.

Two repetitions are regression evidence, not statistical reliability. These public cases are not unseen holdouts. There is no independently authored private suite with enforced read isolation, so even full public success would not satisfy the release gate. Configuration isolation and host observations do not prove filesystem confinement or cryptographic trace authenticity. Underlying model-invocation counts remain unobserved where the host does not report them; root sessions are not billing-request counts.
