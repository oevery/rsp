# Shared verification tools

`local-execution.mjs` records deterministic process, artifact and workspace evidence. `evaluate.mjs` discovers and runs one explicitly selected behavior or workflow case through the existing provider adapter in `scripts/managed-controller-eval.mjs`. `provider-outcome.mjs` separates execution from acceptance using observed evidence.

Keep behavior and workflow execution on the same adapter. Fake executable and observation tests belong in `verification/tests/harness/`. No global registry or synthetic model judge is needed.
