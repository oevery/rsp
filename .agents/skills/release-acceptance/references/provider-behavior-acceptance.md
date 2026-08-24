# Provider behavior acceptance

Load this reference only when release-relevant Skill behavior changed and provider cost is authorized. This is the default provider-backed release gate. It is deliberately short and correctness-first: ten candidate runs plus two baseline calibration runs cover final-artifact residue, commit or release surface residue, required negative facts, shared-channel and imagined-state test restraint, and one direct-routing smoke.

1. Preview with `mise exec -- pnpm run release:behavior-check -- --plan --json --baseline-ref v<previous-version> --model <model> --effort <effort> --provider <provider>`. Require exactly ten candidate runs, two baseline calibration runs, serial fail-fast execution, exact Skill, fixture, contract, and harness identities, and the intended model settings.
2. Run the same command without `--plan` only after provider cost is authorized and the candidate Skill composition is frozen. Candidate hard failures stop the campaign. A baseline model or behavior failure remains diagnostic and does not stop candidate sampling; a harness failure stops because it invalidates the observation.
3. Require every candidate run to pass task result, compliance, boundary, scenario behavior, and applicable structured-route dimensions. Treat token usage, elapsed time, tool calls, baseline outcomes, and all baseline/candidate deltas as diagnostics only; they never change the verdict.
4. Retain only sanitized aggregate JSON and Markdown reports. Raw prompts, sessions, events, workspaces, and machine paths remain local diagnostics. Reuse exact matching scenario evidence; rerun only missing or stale scenarios with `--case <case>`.

The scenario contracts use concrete observable surfaces and host evidence. Scenario-specific text checks protect known leakage and required-fact boundaries, but do not claim universal semantic detection or model generality.
