# Assessment contracts and calibration

Use the task's request, nearest instructions and business authority to define success. Reference solutions demonstrate one acceptable result; their private names, error details and structure are not additional requirements. The [coverage matrix](matrices/evaluation.md) selects complementary tasks. The [execution guide](README.md) owns commands, input snapshots and execution authority.

## Assign each judgment to evidence

| Question | Evidence and assessment |
| --- | --- |
| Does the implementation meet its public contract? | Execute behavior and relevant side effects: values, state transitions, output bytes, wire writes, historical Git reads and preserved inputs. |
| Is a requested machine-readable report usable? | Parse its declared types and required fields. Permit extra fields and ordering variations unless a consumer explicitly prohibits them. |
| Is the explanation correct and sufficient? | Judge meaning against source and observed actions, including conditions, negation, uncertainty and scope. Do not require reference wording. |
| Was a required action actually performed within authority? | Inspect attributable native actions and effects. A final file, agent-written receipt or verifier execution alone may not establish execution or order. |
| Is evidence unavailable? | Retain the missing input or exception. Declared host/verifier files are checked before scoring; a broken grader, unavailable judge or missing native evidence is not an exercised product failure. |

Exact checks are appropriate for a required protocol field, boolean, public enum, selected WorkRef, approved commit boundary or independently trusted digest. Retain those boundaries. Report schemas should be the smallest usable contract for the question; do not add fields merely to make a preferred answer easier to recognize.

Workspace preservation compares against trusted setup state captured before agent execution, not cross-version digest tables or post-execution agent receipts. This initial state describes what must remain unchanged; it cannot define business correctness. Keep behavioral expectations and calibration labels independent. Missing trusted initial state makes grading unavailable, not a model failure.

For owner-decision, currentCheck.status is nonempty outcome text, not an enum. Deterministic checks validate its shape and the current snapshot independently; the existing native-evidence criterion judges successful agent execution and truthful reporting. Equivalent success descriptions are allowed. Failed, unavailable or unexecuted agent checks cannot satisfy that criterion, and a later verifier pass cannot substitute for agent actions. Missing required native evidence remains unavailable. An offline deterministic pass establishes neither status meaning nor execution attribution.

In prepared owner-decision calibration, runner-owned context identifies Oracle's maintained reference/sample execution as the candidate actor. Its separate subprocess recorder is supplied before verifier execution; stdout and workspace receipts cannot select or replace that origin. This supports action-criterion calibration, not a claim of native Codex decisions or Skill behavior. An observed empty recorder differs from a missing host artifact: the former records no check, the latter leaves grading unavailable. Losing stderr alone does not invalidate a surviving independent execution record. See the [separate wording and source selections](calibration/README.md#separate-owner-decision-questions); they retain existing labels and introduce no agent-facing format gate.

The [owner-decision baseline and adjustment triggers](calibration/README.md#owner-decision-baseline-and-adjustment-triggers) record the converged root-cause judgment and retained regression evidence. Oracle negatives are evaluator controls, not observed Codex execution failures. A truthfully reported failed attempt remains distinct from fabricated success even when both fail the existing successful-check criterion. This disposition adds no scoring item or format requirement.

Use format parsers for formats. Workspace evidence references accept relative or /app/ paths, optionally with a one-based line, line:column or inclusive line range; L-prefixed line numbers are accepted. Locations must resolve inside the workspace, exist and stay in range. This tolerance does not permit missing files, escaped paths or invented evidence. Malformed required JSON remains a report-contract failure; no general prose-to-JSON inference or silent repair is performed.

Do not infer correctness from a report status, finding count, source token, command spelling, Skill read or completion keyword. The same finding can be expressed as one combined item or several clearly linked observations. Preserve a meaningful distinction between observations and independent defects. An empty findings list is required when the task explicitly defines findings as defects and no defect exists; it is not a universal convention.

## Judge sufficient quality

Accept alternative implementations, test placement, command wrappers and explanations when they meet the same contract. Error type, wording, internal call count or order needs exact matching only when a real consumer or agreed behavior requires it. For example, forbidden wire writes and no-replay guarantees are observable side effects; an arbitrary exception message is not.
For the mixed-protocol fixture, independent protocol groups may be sent in either order. Compare their contents without imposing group order or discarding duplicate packets. Recovery and rejected mixed-target requests still require their declared state and zero-write effects. These are evaluator behavior boundaries, not additional permanent-test obligations for the evaluated agent.

Fail a quality dimension for a concrete material problem and explain the consequence with evidence. Do not demand an exemplary architecture or writing style. A missing dedicated test does not itself prove a product defect. Conversely, a passing smoke check does not prove its omitted boundary.
An unchanged correct test that exposes a current product defect remains valuable; its failed execution does not by itself make the test bad.

The quality tasks separate contract/scope, regression value and evidence/restraint. Existing sufficient tests may remain unchanged. Assess the actual retained corpus, not a fixed filename, test count or mutant-kill total. A correct implementation with insufficient requested regression protection may pass deterministic behavior checks and fail semantic test-value assessment; report both components.

Distinguish present verification from durable regression protection. For unchanged behavior, grounded source inspection or executed focused probes can be sufficient under the task contract; do not require each probe to become a permanent test. A missing permanent test blocks only an explicit task protection requirement or a concrete material gap tied to behavior changed by the task. Explain the observable consequence, limits of existing protection and proportionate retention cost. Otherwise record a useful addition as a non-blocking recommendation. The noise tasks explicitly require retained transaction/recovery protection; the mixed-protocol preservation task permits current verification without adding tests. Harmful test changes and removal of required existing protection remain material problems.

Full acceptance still requires all applicable dimensions to pass. A material authority violation, fabricated execution or missing behavior cannot be compensated by other quality scores. Native partial scores and per-criterion reasons remain useful diagnostics; changing the explanation's style alone is not a reason to fail a dimension. Counts, tokens, elapsed time and reading observations remain diagnostics unless the task has an explicit resource contract.

## Calibrate before trusting a grader

Start from real task failures, false rejections, suspected false acceptances and correct alternate outcomes. Compare the retained prompt, contract, artifacts, trajectory and grading reason; do not assume either the reference answer or original judge is correct. Classify the cause as task ambiguity, verifier defect, semantic disagreement, execution defect or missing evidence before choosing a repair.

For an affected criterion, exercise a correct reference, a materially different correct alternative and a consequential negative where they resolve the actual uncertainty. Harmless transformations should preserve acceptance; changing a requirement's meaning or observable effect should not. Do not build an exhaustive synonym list or require a fixed number of controls per task.

Isolate a negative control's intended property. Whole-reference replacement can introduce unrelated differences, so any resulting failure does not establish coverage of the named regression. The noise fixtures now use reference mutants only offline, selecting the relevant private behavior probe. They do not award retained-test quality for killing those mutants. Executing the retained acceptance command still checks whether the submitted tests actually run and pass.

For a sample targeting a named semantic criterion, use optional `expected_criteria` alongside component expectations. A match requires that criterion's native score to match too; another failing dimension cannot substitute. A missing or errored target is unscored. Compare declared criterion names and binary scores, without matching free-form reasons or requiring every unrelated dimension to have a fixed label. Keep component-only historical expectations valid and identify their narrower scope. The invalid-observation calibration from the eighteen-sample run already missed contract/scope but matched through a test-value failure; that recorded component match did not establish detection of the publication defect.

The quality verifier prepares its source-evidence packet before Reward Kit starts deterministic and semantic scoring, avoiding a producer/judge race. The packet includes actual source/test paths and nested helpers. It is evidence for these bounded fixtures, not a new identity, grading engine or promise of unlimited context. Native actions supply execution evidence separately. Rebuild the evaluation image when its baked support changes before any later native job.

Use the existing calibration corpus and offline code suite. Author-proposed semantic expectations remain candidate labels: another model's agreement or successful offline checks do not promote them to human ground truth. Ask a human to resolve genuinely disputed expectations with the task, artifact and judge reason together. Fixed reserve cases can guard against regressions, but familiar historical cases are not blind holdouts.

## Preserve interpretation

Keep original jobs, captured inputs, artifacts, scores and labels. A grader repair changes current acceptance; it does not rewrite historical model behavior. Offline checks of new fixtures are neither a new agent execution nor a historical regrade. Actual regrading and live execution use the existing entrypoints under their own authority.

Inspect component results and tested boundaries before aggregate scores. Distinguish report-contract failure from demonstrated product failure and unavailable grading. Keep failed and incomplete trials visible when comparing runs. A changed task or grader breaks a matched Skill comparison even if models and settings are unchanged.

These choices apply the outcome, alternate-solution and human-calibration guidance retained in the [upstream investigation](../../research/reports/2026-10-19T06-05-36Z.md#primary-upstream-practices-and-their-limits); that dated reading is not a claim about current upstream branch tips or measured local effectiveness.
