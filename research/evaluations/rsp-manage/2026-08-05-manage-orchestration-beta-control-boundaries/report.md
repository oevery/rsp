# Manage orchestration beta: control responsibility boundaries

- Identity: the `pause-resume` baseline/product holdout ran on August 5, 2026 with model `ocx/gpt-5.6-terra`; the product composition hash was `ff9d3e73086d7067fa2c65f8e569a369266ea15d6a70d3971665ca84d8c2be41`.
- Deterministic gate: all 19 current routing, authority, frontier, lane, fallback, and transient-state fixtures passed.
- Baseline: passed with 8 aggregate tool calls, 1 agent-observed verification round, and 116236 ms elapsed.
- Product: passed with 6 aggregate tool calls, 1 agent-observed verification round, and 231695 ms elapsed.
- Boundaries: both variants passed output, recovery, harness verification, and allowed-path contracts with no unauthorized paths. Receiver-device acceptance remained explicitly unavailable and still requires human intervention after automated work.
- Comparison: complete only for this one holdout. First-fix result and worker dispatch count remain unavailable because the retained aggregate cannot distinguish them from tool activity.
- Retention: the earlier `2026-08-04-manage-orchestration-beta` and `2026-08-04-manage-orchestration-beta-control-model` generations remain unchanged historical evidence. This generation retains only `summary.json` and this report; raw events, CLI usage or token data, provider/session identifiers, and disposable workspace paths are not retained.
- Conclusion limits: this result grants no activation or release change and supports no provider-general or real-host-general conclusion.
