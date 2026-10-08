# Judge calibration samples

Run these samples using the parent [evaluation guide](../README.md#calibrate-semantic-judging). Harbor and the task's original Reward Kit configuration perform all grading; this directory contains inputs and expected outcomes, not a second grading engine.

Each task directory contains named samples with two files:

- `sample.sh` transforms the native oracle solution in its disposable task workspace. An empty transformation is a reference sample.
- `expected.json` states the expected `checks` and `judge` component scores, rationale and label status. Both scores are binary.

`doc-export` covers reference and equivalent wording, unsafe recovery advice, unsupported validation claims and a protected-file violation despite correct documents. `shape-cache` covers a correct plan and plausible but wrong expiry/validation semantics. `review-staged` covers a supported finding and a fabricated finding with valid report structure. This is representative coverage, not calibration of all semantic tasks.

All initial labels are author-proposed `candidate` expectations. A human should compare the task contract, sample artifacts and actual grading reasons before marking a label `human-reviewed`; never infer that status from agreement with another model. A disputed expectation may need task clarification, a rubric correction or a sample correction. Keep the original run and record the change through Git.

Repeated calibration observes judge variability on fixed artifacts. Repeated Agent execution observes task-solving variability. Neither passing code checks nor oracle/nop discrimination substitutes for these observations. The judge sees the resulting artifacts, not the sample scripts, expected scores or rationales.
