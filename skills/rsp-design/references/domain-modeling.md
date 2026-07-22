# Domain modeling

Use this procedure only for a question about domain language, identity, lifecycle, invariants, relationships, or ownership.

1. Collect the project's existing terms from its authoritative context, Specs, code, tests, and user language. Record contradictions rather than silently choosing one source.
2. Trace concrete scenarios across creation, transition, failure, cancellation, deletion, and relevant scope boundaries. Prefer observable lifecycle evidence over type names alone.
3. Identify each concept's identity, owner, allowed transitions, invariants, and relationships. Distinguish a domain concept from a transport shape, persistence record, UI label, or implementation helper.
4. Propose the smallest coherent vocabulary and ownership model that explains the evidence. Test it against at least one edge case and one existing production consumer.
5. Separate conclusions forced by evidence from product choices that require owner confirmation.

Return canonical terms, definitions, ownership and lifecycle implications, conflicts with current usage, alternatives, and unresolved owner decisions. Planned vocabulary may update only the authorized selected Change `Design`; flag possible current-fact or rationale destinations without writing them.
