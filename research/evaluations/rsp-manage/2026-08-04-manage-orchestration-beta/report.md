# Manage orchestration beta evidence

- Plan: the immutable `pause-resume` holdout compares `baseline` then `product`; the plan, holdout manifest, and base tree were hash-locked before execution.
- Execution: both variants ran on August 4, 2026 with `ocx/gpt-5.6-terra` and completed without timeout.
- Deterministic gate: all 17 routing, authority, frontier, lane, limit, fallback, and transient-state fixtures passed.
- Baseline observation: the direct route passed the output and recovery contracts, ran the fixture verification successfully, changed only allowed paths, used 5 aggregate tool calls, and stopped truthfully at receiver-device acceptance.
- Product observation: the managed route passed the same output and recovery contracts, ran the fixture verification successfully, changed only allowed paths, used 7 aggregate tool calls, and stopped truthfully at the same receiver-device acceptance boundary.
- Comparison: complete for this one holdout. First-fix result and worker dispatch count remain unavailable because the current event stream does not distinguish them from aggregate tool activity.
- Conclusion: deterministic compatibility and the bounded baseline/product comparison passed for this case. This evidence grants no activation change, promotion threshold, release action, provider-general claim, or real-host safety claim.
- Retention: only this aggregate report and sanitized summary are retained. Raw events, provider/session details, and disposable workspaces remain outside retained evaluation evidence.
