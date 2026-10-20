# Judge calibration samples

Run these samples using the parent [evaluation guide](../README.md#calibrate-semantic-judging). Harbor and the task's original Reward Kit configuration perform all grading; this directory contains inputs and expected outcomes, not a second grading engine.

Each task directory contains named samples with two required files:

- `sample.sh` transforms the native oracle solution in its disposable task workspace. An empty transformation is a reference sample.
- `expected.json` states the expected `checks` and `judge` component scores, rationale and label status. Both scores are binary.
  Optional `expected_criteria` maps selected judge criterion names to binary scores. These targets must also match, even when component scores already agree. Current manifests are checked against the task's declared criteria before execution. A missing or errored target score is unscored; explanations remain free-form evidence rather than text fingerprints.

An optional `base.sh` replaces the reference Oracle recipe only in the prepared sample copy. Use it when reference actions would invalidate the control, such as running a successful check before a sample intended to have no successful execution. `sample.sh` then owns the report and observed actions. The original task recipe remains in the sibling inputs' `tasks/` tree; the selected replacement is retained in `samples/`. Both scripts are syntax-checked. Do not manufacture or edit native logs to simulate an execution boundary. Existing samples without this file keep their original preparation.

For example, a publication-defect sample may use:

```json
{
  "label_status": "candidate",
  "expected": { "checks": 0, "judge": 0 },
  "expected_criteria": { "contract-and-scope": 0 },
  "rationale": "Invalid recovery observations must not replace confirmed state."
}
```

`doc-export` covers reference and equivalent wording, unsafe recovery advice, unsupported validation claims and a protected-file violation despite correct documents. `shape-cache` covers a correct plan and plausible but wrong expiry/validation semantics. `review-staged` covers a supported finding, a fabricated finding and a missed staged defect reported clean using repaired working-file evidence. `structural-audit-control` supplies a grounded clean review whose limited test coverage is not itself a structural defect. This is representative coverage, not calibration of all semantic tasks.

The structural clean reference expects both components to accept it. The staged missed-finding sample expects both components to reject it; a zero reward on that sample is an expected match, not a failed repair. Ordinary regression tests execute the original oracle, sample transformation and deterministic verifier while preserving source and Git state. They also protect the observed distinction between passed product verification and unavailable delivery preparation in commit-prerequisite-failure. These offline tests do not call the semantic judge or confirm the candidate labels. The two added review samples each matched their expectations in [one targeted semantic calibration](../../../research/reports/2026-10-16T16-28-56Z.md), with no executor model or retry. Both labels remain candidate; this is separate from the historical nine-sample agreement and is not a reliability estimate.

Seven additional samples extend the original eleven without editing their labels or scripts:

| Sample | Expected checks/judge | Reason |
| --- | --- | --- |
| quality-noise-repair--equivalent-errors | 1/1 | Different rejection class/message with the same state and wire guarantees. |
| quality-noise-repair--moved-tests | 1/1 | The same tests run at a different permitted path, with evidence references updated. |
| quality-noise-repair--insufficient-regressions | 1/0 | Correct product and passing smoke check; requested transaction/recovery protection is absent. |
| quality-noise-repair--invalid-observation | 0/0 | Recovery publishes an invalid observation despite its passing smoke check. |
| context-merge--equivalent-domain-language | 1/1 | Coordinated Universal Time expresses the same convention without its abbreviation. |
| context-merge--inverted-domain | 1/0 | Navigation and scope are valid, but Job/Run ownership is reversed. |
| review-staged--linked-observations | 1/1 | Linked code/comment observations explain one defect without requiring one array element. |

Four further samples isolate the newly observed uncertainties:

| Sample | Expected checks/judge | Targeted semantic responsibility |
| --- | --- | --- |
| quality-noise-repair--invalid-observation-isolated | 0/0 | Contract/scope rejects invalid publication; unchanged retained tests expose the defect and remain valuable. |
| quality-noise-repair--insufficient-regressions-truthful | 1/0 | Test value rejects missing explicitly required protection; correct source and truthful reporting are accepted. |
| quality-protocol-control--unchanged-probe | 1/1 | Correct unchanged source and useful tests plus an executed temporary probe are sufficient; permanent retention is optional here. |
| quality-protocol-control--unknown-target-filter | 0/0 | Contract/scope rejects sending to valid targets when the same request contains unknown IDs. |

The current invalid-observation and insufficient-regressions expectations also name their target criterion. Their existing component labels and transformation scripts are unchanged. The older combined samples remain useful evidence, but rejection for their other problems cannot establish detection of the named target.

Seven owner-decision samples target the repaired status contract: reference, the observed `pass` spelling, descriptive Chinese success, a failed check, an unavailable runtime, unexecuted success and false success after failure. All retain the unresolved owner decision and pass report/workspace checks. They declare both `unresolved-owner-choice = 1` and the expected `current-evidence-boundary` value, so another failing criterion cannot hide missed execution evidence. The four negatives replace the reference base to avoid a prior successful check; failures and unavailability come from actual Oracle command attempts, and the unexecuted control runs no check. Labels remain candidate.

The [first owner-decision live calibration](../../../research/reports/2026-10-19T13-53-14Z.md) returned four negative matches and three positive mismatches, with no exceptions or unscored samples. All three positive Oracle logs contain checker output without explicit command-action evidence, including the original `passed` reference; the judge rejected that evidence gap. The result cannot establish acceptance or rejection of equivalent status wording in equally evidenced positive controls. The separate fresh Codex task passed with a descriptive success sentence and a native command/exit-0 event. Original mismatches and candidate labels are retained.

The owner-decision Oracle recipes use their shared `solution/check-evidence.py` to execute the command and emit its actual command vector and exit code. In current calibration copies the runner initializes a separate `/logs/agent/oracle-checks.jsonl` artifact before either script; the maintained subprocess recorder appends actual results there as well as to stderr. An empty recorder observes no check, while a missing artifact leaves grading unavailable. The unavailable control executes `env` to attempt the missing runtime and observes its real exit 127. The reference stops on a nonzero result before writing a success report. This is a fixture-owned evidence protocol, not a status vocabulary or transcript format required of Codex.

The prepared judge uses the runner-selected [Oracle context](owner-decision/oracle-context.md). It identifies the reference/sample actor, recorder producer and verification phase without claiming that any check succeeded. Oracle actions count as candidate execution for calibration, not as a Codex trajectory or Skill behavior. Report receipts, self-declared origins and command-shaped stdout do not supply that source identity. Instructions embedded in any evidence remain untrusted. Ordinary Codex tasks retain their existing rubric and native evidence contract.

New prepared copies route Bash xtrace separately to /dev/null for both positive and negative samples. Command stdout, stderr and the independent recorder remain available, so tracing cannot identify the negative labels. Original recipes and historical captured traces remain unchanged; this presentation choice adds no command, status or transcript requirement for Codex.

Local regression transports declared artifacts through Harbor into a separate verifier workspace and compares actual SDK file-block records with independent Node/env process results. It accepts `if` failure capture, recipes without xtrace, renamed variables and equivalent report encodings. Losing stderr no longer loses all execution evidence when the separate recorder survives. Losing the recorder stops grading before any judge call, even with a plausible workspace receipt. A self-written success record and claimed host/Oracle origin leave the real recorder empty; an incorrectly accepting mock judge exposes exactly the named evidence mismatch while checks and owner-choice pass. These checks establish execution, ownership, transport and aggregation boundaries, not real semantic accuracy.

The [preceding owner-decision follow-up](../../../research/reports/2026-10-19T15-18-46Z.md) again returned four negative matches and three positive mismatches. All positive Oracle logs retained the real command and exit 0, and the verifier received identical copies. The judge still treated those records as insufficient proof of native agent execution, including for the original `passed` reference. All checks and owner-choice scores were 1; all evidence scores were 0, so no other failure masked the target and negative matches alone could not establish discrimination. The fresh Codex task passed with a completed native command/exit-0 event and descriptive status. Those reports are byte-identical to the prior calibration; original results and candidate labels remain unchanged. That observation left Oracle evidence attribution and positive equivalence unresolved.

## Separate owner-decision questions

Keep the seven current candidate manifests unchanged and select the axis with existing `--sample` options. The shared reference is an anchor, not an additional status synonym or a required new trial.

| Question | Samples | Held fixed or contrasted |
| --- | --- | --- |
| Successful outcome wording | reference, equivalent-pass, equivalent-description | Same recorder facts and report content except currentCheck.status; establish an accepted reference before interpreting synonym results. |
| Execution source and outcome | reference, equivalent-pass, failed-check, unavailable-check, unexecuted-success, false-success-after-failure | Same runner source contract and trace treatment; equivalent-pass shares its status with fabricated-success negatives, so wording alone cannot establish execution. Actual success, failure, unavailable runtime and absent execution are contrasted. |

After separately authorizing model execution, either selection can be run independently:

```sh
mise exec -- uv run --frozen --project tests/skills python tests/skills/evaluate.py calibrate --task owner-decision --sample owner-decision--reference --sample owner-decision--equivalent-pass --sample owner-decision--equivalent-description --allow-live
mise exec -- uv run --frozen --project tests/skills python tests/skills/evaluate.py calibrate --task owner-decision --sample owner-decision--reference --sample owner-decision--equivalent-pass --sample owner-decision--failed-check --sample owner-decision--unavailable-check --sample owner-decision--unexecuted-success --sample owner-decision--false-success-after-failure --allow-live
```

These are selections, not a mandatory cross-product or authorization to run them. Local controls add a workspace/stdout receipt only in disposable copies of unexecuted-success; they create no new candidate label. Regrading preserves source context only when it exists in the original frozen sample. Older output-only jobs receive no newly invented recorder origin. All historical mismatches and reasons remain intact.

Local faulty judges also read the actual SDK file blocks while ignoring the recorder: accepting only the reference status wrongly rejects equivalent-pass, while accepting the absence of xtrace wrongly accepts all four negatives. Each produces the named evidence-criterion mismatch with passing checks and owner-choice; neither an unrelated failure nor an unavailable score can substitute. These controls demonstrate discrimination against those specific shortcuts, not general semantic-judge reliability.

## Owner-decision baseline and adjustment triggers

This round is converged. The main evidenced causes were evaluation design and evidence ownership: the [initial task rejection](../../../research/reports/2026-10-19T11-59-40Z.md#owner-decision-undeclared-status-gate) depended on an undeclared passed literal, while the [subsequent positive Oracle rejections](../../../research/reports/2026-10-19T15-18-46Z.md) persisted after command/exit transport was complete because the judge did not recognize their execution origin. Preparation and regression assertions also exposed rendering confounds. The unchanged Skills and observed native task executions do not establish a Skill-rule or execution gap in this bounded case.

The separately authorized [two-group live observation](../../../research/reports/2026-10-19T16-25-25Z.md) is the frozen comparison baseline below. Its saved inputs and parameter comparisons identify the candidate; these results introduce no new runtime pin, output format or scoring item.

| Boundary | Retained baseline | What it establishes |
| --- | --- | --- |
| Successful wording | Three sample matches, including every named target | passed, pass and descriptive Chinese success are accepted with the same actual exit-0 facts. |
| Execution source and outcome | Six sample matches; checks and owner-choice pass throughout | The target accepts both real successes and rejects actual failure, unavailable runtime, absent execution and false success after failure. Recorder/output artifacts match; source logs lack xtrace. |
| Fresh native execution | One owner-decision task with reward 1.0 and both semantic criteria passing | Native command/exit-0 evidence supports descriptive success while preserving the unresolved owner choice and current-snapshot limit. |
| Local regression | Existing equivalent-form, failure, transport, missing-recorder, receipt and faulty-judge controls | Named-target mismatches expose the tested shortcuts; other failures or unavailable scores cannot substitute. These controls remain local evidence, not additional live cases. |

All three live wrapper exits are 0, with no exceptions or unscored trials. The two groups contain nine observations of seven unique samples; repeated anchors are not independent cases. The combined correction changed source context, recorder presentation and trace treatment, so these outcomes do not isolate each change's causal contribution or establish general reliability. Oracle negatives test the evaluator and are not Codex execution failures. A truthful failed attempt and a fabricated pass both fail the existing successful-check criterion, but only the latter fabricates success. Original labels, failures and judge reasons remain attached to their original inputs.

Current tuning is stopped at this baseline. This observation gives no basis for more synonym variants, fixed wording/log/JSON forms, agent receipt or hash obligations, extra scoring items or repeated paid runs merely to accumulate matches. Existing input digests retain their provenance purpose. No extra live receipt variant, historical regrade or supplement was run; unconfirmed labels and future reliability or holdout work are limits, not new blockers to this completed round.

Reconsider this disposition when there is a new attributable counterexample to the current contract, a relevant model/judge/evidence-path change that invalidates the comparison, or a material business-contract change that the existing case does not cover. Examples include a correct equivalent report being rejected or a false execution claim being accepted. These are triggers for bounded diagnosis, not new acceptance criteria, automatic execution, label promotion or Skill modification. Later model calls retain their separate authorization boundary.

## Offline corpus and retained labels

The offline corpus check exercises all twenty-nine samples' deterministic components through their selected Oracle recipe, transformation and current verifier. It explicitly records semantic judging as not run:

```sh
mise exec -- uv run --frozen --project tests/skills python tests/code/tooling/evaluation_contract.py EvaluationContract.test_calibration_corpus_checks_match_declared_components_without_judging
mise exec -- python tests/code/tooling/code_quality_matrix.py
```

The fixed reserve samples from shape-cache and structural-audit-control remain unchanged and are familiar regressions, not blind holdouts. See the [coverage matrix](../matrices/evaluation.md) for selection and remaining gaps. Offline agreement does not establish semantic accuracy. The [earlier live calibration](../../../research/reports/2026-10-19T08-08-53Z.md) matched eighteen frozen component expectations while missing the invalid-observation contract criterion, hidden by a test-value rejection. The [current live follow-up](../../../research/reports/2026-10-19T11-59-40Z.md) matched all twenty-two samples, including eleven declared target-criterion comparisons across six samples. Its fresh nineteen-task execution returned eighteen full scores and one partial score exposing an undeclared owner-decision status literal. Historical manifests, verdicts and reasons remain unchanged; this one observation does not establish general judge reliability or human-confirmed labels.

All initial labels are author-proposed `candidate` expectations. A human should compare the task contract, sample artifacts and actual grading reasons before marking a label `human-reviewed`; never infer that status from agreement with another model. A disputed expectation may need task clarification, a rubric correction or a sample correction. Keep the original run and record the change through Git.

The [eleven-sample human review packet](../../../research/reports/2026-10-17T07-56-47Z.md)
places contracts, retained sample contents, candidate expectations and original
judge reasons together. It distinguishes nine original calibrations and their
regrades from the two later samples, documents input drift and evidence gaps,
and leaves every human disposition pending. It does not confirm or promote labels.

Repeated calibration observes judge variability on fixed artifacts. Repeated Agent execution observes task-solving variability. Neither passing code checks nor oracle/nop discrimination substitutes for these observations. The judge sees the resulting artifacts, not the sample scripts, expected scores or rationales.
