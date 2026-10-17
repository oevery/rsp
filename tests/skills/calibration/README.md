# Judge calibration samples

Run these samples using the parent [evaluation guide](../README.md#calibrate-semantic-judging). Harbor and the task's original Reward Kit configuration perform all grading; this directory contains inputs and expected outcomes, not a second grading engine.

Each task directory contains named samples with two files:

- `sample.sh` transforms the native oracle solution in its disposable task workspace. An empty transformation is a reference sample.
- `expected.json` states the expected `checks` and `judge` component scores, rationale and label status. Both scores are binary.

`doc-export` covers reference and equivalent wording, unsafe recovery advice, unsupported validation claims and a protected-file violation despite correct documents. `shape-cache` covers a correct plan and plausible but wrong expiry/validation semantics. `review-staged` covers a supported finding, a fabricated finding and a missed staged defect reported clean using repaired working-file evidence. `structural-audit-control` supplies a grounded clean review whose limited test coverage is not itself a structural defect. This is representative coverage, not calibration of all semantic tasks.

The structural clean reference expects both components to accept it. The staged missed-finding sample expects both components to reject it; a zero reward on that sample is an expected match, not a failed repair. Ordinary regression tests execute the original oracle, sample transformation and deterministic verifier while preserving source and Git state. They also protect the observed distinction between passed product verification and unavailable delivery preparation in commit-prerequisite-failure. These offline tests do not call the semantic judge or confirm the candidate labels. The two added review samples each matched their expectations in [one targeted semantic calibration](../../../research/reports/2026-10-16T16-28-56Z.md), with no executor model or retry. Both labels remain candidate; this is separate from the historical nine-sample agreement and is not a reliability estimate.

All initial labels are author-proposed `candidate` expectations. A human should compare the task contract, sample artifacts and actual grading reasons before marking a label `human-reviewed`; never infer that status from agreement with another model. A disputed expectation may need task clarification, a rubric correction or a sample correction. Keep the original run and record the change through Git.

The [eleven-sample human review packet](../../../research/reports/2026-10-17T07-56-47Z.md)
places contracts, retained sample contents, candidate expectations and original
judge reasons together. It distinguishes nine original calibrations and their
regrades from the two later samples, documents input drift and evidence gaps,
and leaves every human disposition pending. It does not confirm or promote labels.

Repeated calibration observes judge variability on fixed artifacts. Repeated Agent execution observes task-solving variability. Neither passing code checks nor oracle/nop discrimination substitutes for these observations. The judge sees the resulting artifacts, not the sample scripts, expected scores or rationales.
