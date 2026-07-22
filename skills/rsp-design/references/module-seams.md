# Module and seam design

Use this procedure only for a question about an interface, caller complexity, adapter, test surface, or seam placement.

1. Trace the direct production consumer and the smallest complete call/data path before proposing a seam. Confirm the live path reaches the candidate owner.
2. List what callers must know: inputs, outputs, invariants, ordering, failures, configuration, cancellation, and relevant performance constraints.
3. Locate where behavior or policy actually varies. Do not add an interface for hypothetical variation or wrap an existing pass-through for symmetry.
4. Compare credible placements by caller leverage, implementation locality, dependency direction, state ownership, and whether callers and tests can use the same public surface.
5. Recommend the smallest interface that hides meaningful complexity while preserving domain ownership. State migration or compatibility consequences without implementing them.

Return the proposed owner, seam, interface obligations, affected consumers, verification surface, alternatives, and unresolved owner decisions. Treat code sketches as explanatory output only; do not write production code.
