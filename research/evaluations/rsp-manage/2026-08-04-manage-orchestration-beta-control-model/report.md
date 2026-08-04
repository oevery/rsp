# Manage orchestration beta: canonical control model

- Identity: the `pause-resume` baseline/product holdout ran on August 4, 2026 with model `ocx/gpt-5.6-terra`; the product composition hash was `ee2e26aee295ea182add2102d928f016e58685cd3e53d3447d92f13268688b76`.
- Deterministic gate: all 19 current routing, authority, frontier, lane, fallback, and transient-state fixtures passed.
- Baseline: passed with 7 aggregate tool calls, 2 agent-observed verification rounds, and 176774 ms elapsed.
- Product: passed with 11 aggregate tool calls, 3 agent-observed verification rounds, and 501178 ms elapsed.
- Boundaries: both variants passed output, recovery, harness verification, and allowed-path contracts with no unauthorized paths. Receiver-device acceptance remained explicitly unavailable and still requires human intervention after automated work.
- Comparison: complete only for this one holdout. First-fix result and worker dispatch count remain unavailable because the retained aggregate cannot distinguish them from tool activity.
- Retention: the earlier `2026-08-04-manage-orchestration-beta` generation remains unchanged historical evidence. This generation retains only `summary.json` and this report; raw events, CLI usage or token data, provider/session identifiers, and disposable workspace paths are not retained.
- Conclusion limits: this result grants no activation or release change and supports no provider-general or real-host-general conclusion.
