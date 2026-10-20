# Code-quality baseline matrix

This exploratory matrix investigates the current complete seven-Skill suite before any Skill revision. It contains three independently rewritten local case patterns, each paired with a preservation control. It is not a replay of private conversations, a hardware acceptance test or a comparison against the historical Skills used in those sessions.

| Native task | Business distinction | Required evidence |
| --- | --- | --- |
| `quality-noise-repair` | A setting includes ACK and readback; ambiguous ACK correlation needs explicit reconnect recovery. | Correct transaction ordering and recovery; actual retained tests protect those consequences. |
| `quality-noise-control` | The same transaction and recovery guarantees already hold. | Preserve correct behavior and useful tests; do not invent a product defect or remove reconnect protection. |
| `quality-protocol-simplify` | One receiver owns one protocol for every registered handset. | Remove per-handset protocol machinery while retaining multiple IDs, broadcast, targeting, encoding and rejection before sends. |
| `quality-protocol-control` | Deployed handsets on one receiver actually use different protocols. | Preserve advertised protocol grouping and wire behavior; current verification of unchanged code need not add permanent tests. |
| `quality-capture-simplify` | Git repository, requested revision and selected paths own source identity. | Remove the redundant derived identity and proof sidecar; capture historical bytes and use Git for full-repository differences. |
| `quality-artifact-control` | External release bytes have an independently trusted expected digest. | Reject mismatched bytes before overwriting the destination; preserve valid binary bytes and digest metadata. |

The source patterns are the user-selected receiver noise adaptation, HT46 protocol simplification and the local research capture mechanism. Names, contracts and code here are synthetic and deliberately bounded. The mixed-protocol and external-artifact controls are counterexamples to blanket simplification, not claims about those original products. A passing case cannot establish whole-project or real-device quality.

## Acceptance and calibration

Neutral prompts direct the agent to the business contract, authorized write scope and existing check. Pressure cases initially pass that check despite a real gap. Preservation controls are intended to start correct; calibration must challenge that assumption. Assessment files expose findings, consequences, actual evidence and limits.

Deterministic checks judge public outcomes, relevant side effects, historical Git behavior, preserved inputs and Git state, and execute the retained acceptance command. Error class/message is unrestricted where the contract specifies only rejection and effects. Semantic judgment separately assesses contract/scope, regression value and evidence/restraint using the actual source/test corpus prepared before scoring. Report status and findings count do not establish correctness: findings may include positive observations. Full-score acceptance requires both deterministic and semantic components to score one; `threshold = 1` retains material boundaries, while native aggregation keeps partial scores and per-dimension reasons visible. Skill reads, source strings, code size, test count and hash count are diagnostics.

The noise tasks explicitly retain whole-transaction and recovery regression protection. Other useful test suggestions are not automatically mandatory. For unchanged behavior, grounded source inspection or executed focused probes may be sufficient current verification. A new permanent-test obligation needs an explicit requirement or a material gap tied to behavior changed by the task, with its consequence and maintenance cost considered. Named calibration targets prevent unrelated failures from hiding a missed criterion; they do not introduce wording or source-text gates.

Before live execution, calibrate reference solutions, correct alternatives, targeted behavior regressions and preservation controls without containers or model calls:

```sh
mise exec -- python tests/code/tooling/code_quality_matrix.py
mise exec -- uv run --frozen --project tests/skills python tests/skills/evaluate.py check --task quality-noise-repair --task quality-noise-control --task quality-protocol-simplify --task quality-protocol-control --task quality-capture-simplify --task quality-artifact-control
```

The calibration is also part of the repository code suite. It includes early recovery-release rejection, report-shape variants, equivalent rejection details and retained-test placement. Reference mutants run only against selected private behavior probes offline: they no longer award retained-test quality for unrelated failures. Insufficient retained regression protection belongs to semantic judging, with a separate 1/0 calibration sample. These checks cannot establish semantic-judge calibration or agent success. Native schema checks establish structure only.
The local regression suite also rejects quarantine release after an invalid recovery observation and partial sends before mixed-target rejection. It accepts reordered independent protocol groups while retaining a duplicate-packet negative control. Both noise tasks and both protocol tasks exercise the applicable rejection boundaries.

## Completed native experiment boundary

The completed baseline selected one Codex job, six tasks, one attempt each, concurrency one, the zero-task-retry policy and unchanged seven-Skill selection. Executor and judge routing remain in native configuration. Its command, retained for reproduction only and granting no new execution authority, was:

```sh
mise exec -- uv run --frozen --project tests/skills python tests/skills/evaluate.py run --task quality-noise-repair --task quality-noise-control --task quality-protocol-simplify --task quality-protocol-control --task quality-capture-simplify --task quality-artifact-control --attempts 1 --concurrency 1 --agent codex --allow-live
```

Freeze tasks, rubrics and selected Skills before this command. Native sibling `.inputs` owns the captured inputs; do not add another identity registry. Retain original failures, missing scores and infrastructure errors. No automatic retries, resumes, regrades or supplemental live runs are authorized. Existing judge formatting retries remain a separate implementation detail.

Inspect deterministic checks, semantic reasons, native execution and actual source changes separately. Record whether a failure reflects a rule gap, execution failure, fixture ambiguity or unavailable infrastructure. One observation per task cannot establish reliability or Skill causality. A future candidate comparison needs separate authority and matched execution. Keep raw records under ignored `tests/skills/reports/` and selected conclusions in a dated `research/reports/` document.

## Initial baseline and later fixture corrections

The [2026-10-19 baseline report](../../../research/reports/2026-10-19T04-59-01Z.md) records the one authorized job: four full scores and two partial scores, with all six semantic judgments passing and no execution exceptions. The two partial scores exposed incorrect assumptions in the original fixture and report gates. Original native verdicts and sibling inputs are unchanged.

After that job, the noise control was corrected to serialize refresh, retain quarantine until recovery succeeds and enforce valid levels. Its visible and private checks and reference repair cover those boundaries. Report gates validate structure instead of hardcoding the planned disposition or number of observations; judging claimed defects remains semantic. Retained-test discrimination follows tools/check.mjs rather than assuming all regressions stay in one file. These corrections initially had offline evidence only.

The user separately authorized one [corrected-matrix follow-up](../../../research/reports/2026-10-19T06-05-36Z.md) with unchanged models/settings and Skills. It returned five full scores and one partial score, with six semantic passes and no exceptions. The partial score exposed an undocumented error-message requirement. A diagnostic also found that the full-implementation mutants can fail for an unrelated error-type difference, so killing them alone does not prove the intended regression is protected. These remaining grader issues are recommendations for later correction; the frozen tasks and native verdicts were not changed or regraded. The recorded command grants no additional run.

The later [evaluation-contract adjustment](../../../research/reports/2026-10-19T07-06-28Z.md) repairs those graders and adds offline calibration. A separately authorized [live validation](../../../research/reports/2026-10-19T08-08-53Z.md) then matched all eighteen calibration expectations and returned four full and two partial scores on these six quality tasks. One partial score exposes an actual invalid-recovery publication that the semantic judge missed; the other concerns whether unchanged mixed-protocol code needed an additional permanent test despite executed temporary verification. Both native failures remain recorded. Thirteen additional affected/reserved tasks passed. Earlier reports and saved inputs retain their original scores. Follow the [assessment contract](../assessment.md) and [coverage matrix](evaluation.md) for grading responsibility and limits.

The subsequent [criterion-calibrated follow-up](../../../research/reports/2026-10-19T11-59-40Z.md) matched all twenty-two samples and their declared target criteria, then passed all six quality tasks with the same Skills, models and parameters. Noise repair validated refresh observations before publication; mixed-protocol preservation kept source and tests unchanged and passed with executed temporary probes. Across all nineteen tasks, eighteen received full scores; owner-decision retained a 0.5 failure caused by an undeclared status literal. No grader or Skill was changed during the run, and no historical result was regraded. One run supports these observed distinctions, not reliability or Skill causality.
