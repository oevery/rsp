# Implementation and test restraint Skill evaluation

- Identity: the `auto-multisurface-routing` baseline/product holdout ran on August 17, 2026 with model `combo/gpt-5.6-terra`, high reasoning effort, and product composition hash `a1d4735ee12700fc8912e81959e515ccf942d42ac99a8f706c6c8e3064f39fb5`.
- Change under evaluation: `implementation-test-restraint-skills` adds pre-mutation boundary and permanent-test admission to `rsp-implement`; the other revised Skills are covered by their focused deterministic contracts and are not installed in this Managed Controller composition.
- Deterministic gate: all 33 current managed-controller contracts passed before provider execution.
- Baseline: completed the bounded output, boundary, changed-path, and harness verification contracts with 10 aggregate tool calls, one agent-observed verification round, one passing harness verification round, 167389 ms elapsed, and no unauthorized paths.
- Product: completed the same bounded contracts with 10 aggregate tool calls, no agent-observed verification round, one passing harness verification round, 426308 ms elapsed, and no unauthorized paths.
- Structured-observation limitation: neither run emitted a structured trigger, correction count, first-fix result, worker dispatch count, or worker lifecycle counts and ordering. Those measurements remain unavailable rather than inferred from narrative output.
- Interpretation: baseline and product both reached `contract-passed` with complete comparison and passing compliance, boundary, task-result, output-contract, and harness checks. Tool, time, token, and missing intermediate-observation measurements are diagnostic only and support no performance ranking.
- Retention: this generation retains only `summary.json` and this report. Raw events, authentication, gateway details, provider/session identifiers, stderr, and disposable workspace paths remain under ignored `.cache/` and are not retained.
- Conclusion limits: one model path and one holdout establish neither provider-general nor real-host-general behavior, define no numeric promotion threshold, and grant no activation, release, Git, push, publication, archive, or commit authority.
