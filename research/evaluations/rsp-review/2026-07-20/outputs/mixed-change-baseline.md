## Findings

- P1 — [docs/usage.md:3](/Users/oevery/Developer/lab/rsp/.cache/rsp-review-eval/mixed-change-baseline-NL6zuj/docs/usage.md:3): The documentation says failures “return zero,” but `run()` now returns `{ ok: false, error: 'failed' }`. This will lead callers to handle the result as a number rather than inspect `ok`/`error`. Document the result object and its failure fields instead.

The implementation itself matches the focused Change. No tests were present to validate the new return contract.
