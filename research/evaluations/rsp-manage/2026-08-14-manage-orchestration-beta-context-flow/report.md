# Manage orchestration beta: focused context flow

- Identity: the `auto-multisurface-routing` baseline/product holdout ran on August 14, 2026 with model `combo/gpt-5.6-terra`, high reasoning effort, an isolated provider-only user context, and product composition hash `b7b0871abce0ea7e591585d7bae9170ff16d16f2a8c2756121bf0b23991363da`.
- Isolation: each variant used a fresh temporary `HOME`/`CODEX_HOME` containing only the authentication file plus command-line model-catalog and gateway routing; user memory, plugins, MCP servers, user Skills, and global rules were not loaded, and the temporary home was deleted after the run.
- Deterministic gate: all 21 current controller contracts passed.
- Baseline: passed with 6 aggregate tool calls, 2 agent-observed verification rounds, one passing harness verification round, 107621 ms elapsed, and no unauthorized paths.
- Product: passed with 8 aggregate tool calls, 2 agent-observed verification rounds, one passing harness verification round, 146161 ms elapsed, and no unauthorized paths.
- Routing result: both variants reported automatic route `selected`, sequential dispatch, and passing `npm test`; the product run used the installed `rsp`, `rsp-manage`, and `rsp-implement` composition.
- Comparison: complete only for this one holdout. The retained aggregate does not distinguish worker dispatch count or first-fix result from general tool activity, so both remain explicit omissions; the result is not a token or latency improvement claim.
- Retention: every earlier generation remains unchanged historical evidence. This generation retains only `summary.json` and this report; raw events, authentication, gateway details, provider/session identifiers, token data, and disposable workspace paths are not retained.
- Conclusion limits: this one-holdout result defines no numeric promotion threshold, grants no activation or release change, and supports no provider-general or real-host-general conclusion.
