# Manage orchestration beta: routing and review gates

- Identity: the `auto-multisurface-routing` baseline/product holdout ran on August 5, 2026 with model `ocx/gpt-5.6-terra`; the product composition hash was `8d7481e9859af6696b2283e75804cb027d089d1b42071ae4f41f2782fcff85ac`.
- Deterministic gate: all 19 current routing, authority, frontier, lane, fallback, and transient-state fixtures passed.
- Baseline: passed with 5 aggregate tool calls, 1 agent-observed verification round, 1 passing harness verification round, 129683 ms elapsed, and no unauthorized paths.
- Product: passed with 10 aggregate tool calls, 1 agent-observed verification round, 1 passing harness verification round, 337149 ms elapsed, and no unauthorized paths.
- Routing result: both variants reported automatic route `selected`, sequential dispatch, and passing `npm test`; the product run used the installed `rsp`, `rsp-manage`, and `rsp-implement` composition.
- Oracle correction: the exact raw runs were deterministically re-scored after allowing the two declared test surfaces and replacing negation-unsafe `archived`/`committed` substring bans. Both retained outputs then passed the corrected output and allowed-path contracts; no model output or worktree evidence was rewritten.
- Omissions: first-fix result is not emitted as a structured event, and worker dispatches cannot be distinguished from aggregate tool calls.
- Retention: prior retained evidence remains unchanged. This generation retains only `summary.json` and this cleaned report; provider/session identifiers, raw events, token data, and transient cache paths are not retained.
- Conclusion limits: this one-holdout comparison defines no numeric promotion threshold, grants no activation or release change, and supports no provider-general or real-host-general conclusion.
