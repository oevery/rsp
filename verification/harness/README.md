# Harness

Adapters execute declared local boundaries and collect host observations: exit code, stdout/stderr, timeout, duration, workspace status, changed paths, artifacts, errors, and sanitized provenance. Scenario manifests provide inputs and expected oracles; they never provide host-observed events.

The local harness has three explicit boundaries:

- local — repository-local command or package boundary; this can be verified when the command succeeds and evidence is complete.
- disposable-project — release/fixture acceptance; it requires an actual acceptance command, not plan output or fixture existence.
- fake-provider — deterministic provider contract only; usage is explicit and real_provider remains false.

No executable agent/Skill runtime or host worker adapter is available in this local-only campaign. Those cases remain unverified even when their package or fixture inspection command succeeds. Real provider execution is fail-closed.
