# Document review

Load this reference only when the fixed reviewed artifacts make the Document pipeline applicable.

Classify each document by its semantic role: requirement/Change, implementation plan, Spec, Decision Record/ADR, or explanatory/user documentation. Then check:

1. Authority and traceability of claims and decisions.
2. Internal and cross-artifact coherence, including current implementation facts.
3. Completeness and ambiguity: undefined terms, unverifiable completion, and choices disguised as decisions. Report an unresolved product, operational, rollback, migration, or completion choice as an ambiguity Finding when no authority resolves it; ask for owner judgment and mark a dependent result blocked only when the choice prevents coherent review.
4. Feasibility of named paths, interfaces, sequencing, safety, migration, and executable verification, at the detail appropriate to the document role.
5. Scope and concision: scope leakage, duplicate authority, unrelated requirements, or verbosity hiding a contract.

Before the Document verdict, enumerate every unresolved choice in each changed document. Any unresolved product, operational, rollback, migration, ownership, or completion choice must either have resolving authority or produce an ambiguity Finding; do not stop after finding other defects.

Anchor Findings to the smallest heading or claim. Do not apply code-style or test-coverage rules to semantic documents, auto-fix meaning, or rewrite prose for taste.
