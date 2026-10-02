# Module and seam design (Shape design method)

Use this procedure only for a question about an interface, caller complexity, adapter, test surface, or seam placement.

Before proposing a seam, trace the direct production consumer's complete call/data path and confirm it reaches the candidate owner. Then judge:

- Caller obligations: inputs, outputs, invariants, ordering, failures, configuration, cancellation and relevant performance constraints.
- Actual behavior/policy variation, not hypothetical interfaces or pass-through wrappers for symmetry.
- Credible placements by caller leverage, implementation locality, dependency direction, state ownership and a public surface usable by both callers and tests.

Recommend the smallest interface hiding meaningful complexity without moving domain ownership. State migration and compatibility consequences; implement nothing.

Return the proposed owner, seam, interface obligations, affected consumers, verification surface, alternatives, and unresolved owner decisions. Treat code sketches as explanatory output only; do not write production code.
