# Document Review

Apply this pipeline to semantic documents. Review their claims and usability as authority; do not apply code-style or test-coverage rules.

## Classify the document

Classify by content before path:

- **Requirements or Change:** intended outcome, scope, scenarios, constraints, and blockers.
- **Implementation plan:** technical approach, executable slices, dependencies, verification, and completion conditions.
- **Spec:** stable current facts, boundaries, defaults, and invariants.
- **Decision Record or ADR:** lasting rationale, alternatives, tradeoffs, and consequences.
- **Explanatory or user documentation:** accurate explanation of current behavior and operation.

If one document mixes roles, report the ownership ambiguity when it creates conflicting truth or makes later use unreliable.

## Axes

1. **Authority and traceability.** Identify the document's owner and upstream/downstream authorities. Check that claims, requirements, and decisions can be traced without inventing missing sources.
2. **Coherence.** Find internal contradictions, conflicts with relevant code/current facts, inconsistent terms, and incompatible cross-document claims.
3. **Completeness and ambiguity.** Find missing conditions, unresolved choices disguised as decisions, undefined terms, unverifiable completion, and gaps that force an implementer or user to guess.
4. **Feasibility.** For plans, verify that named paths, interfaces, sequencing, migration/safety needs, and verification steps are plausible against the repository. Do not demand implementation detail from requirements-only documents.
5. **Scope and concision.** Identify scope leakage, duplicate authority, unrelated requirements, or verbosity that hides a concrete contract. Concision is not deletion for its own sake.

## Mixed-change checks

- Compare user/explanatory documentation with the behavior changed in Code scope.
- Keep stable facts in Specs and rationale in Decision Records; do not recommend copying one into the other.
- When Code and Document evidence prove the same defect, provide the document evidence to synthesis instead of emitting a duplicate finding.

## Finding discipline

- Anchor findings to the smallest heading, paragraph, requirement, or decision entry.
- Distinguish missing authority from an actual contradiction.
- Do not auto-fix semantic content, decide unresolved product choices, or rewrite prose merely for taste.
- Prefer a question or blocked result when owner judgment is required.

## Pipeline result

- `issues_found`: at least one actionable Document finding.
- `clean`: Document scope was reviewed and no actionable finding remains.
- `skipped`: no Document artifacts were in the fixed scope.
- `blocked`: Document scope or required authority could not be fixed.
