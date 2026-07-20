## Findings

- P1 — [docs/usage.md:3](/Users/oevery/Developer/lab/rsp/.cache/rsp-review-eval/mixed-change-baseline-8bp1wm/docs/usage.md:3): Documentation says failures “return zero,” contradicting both the focused Change and implementation, which return `{ ok: false, error }`. Users following this documentation will handle failures using the wrong contract. Update it to describe the result object.

Hold: documentation and code are not yet consistent.