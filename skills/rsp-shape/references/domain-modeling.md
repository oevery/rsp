# Domain modeling (Shape design method)

Use this procedure only for a question about domain language, identity, lifecycle, invariants, relationships, or ownership.

Use authoritative context, Specs, code, tests and user language to resolve:

- Existing terms and contradictions; do not silently choose a conflicting source.
- Identity, owners, allowed transitions, invariants and relationships. Distinguish domain concepts from transport, storage, UI and helper representations.
- Observable lifecycle scenarios across creation, transitions, failure, cancellation, deletion and relevant scope boundaries, not type names alone.

Propose the smallest coherent model explaining the evidence. Check it against at least one edge case and one existing production consumer; separate evidence-forced conclusions from choices needing owner confirmation.

Return canonical terms, definitions, ownership and lifecycle implications, conflicts with current usage, alternatives, and unresolved owner decisions. Planned vocabulary may update only the authorized selected Change `Design`; flag possible current-fact or rationale destinations without writing them.
