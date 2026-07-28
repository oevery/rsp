# Structural audit lenses

Load this reference only after the audit boundary and authority are fixed. Select the smallest relevant set of lenses; do not turn them into a completion checklist.

## Candidate selection in a broad boundary

When the user supplies a broad repository boundary without a narrower lead, use repeated changes, recurring defects, or cross-owner correction history only to select the smallest candidate behavior chain. Churn is navigation evidence, not a Finding. Inspect the current owners and reachable path before applying any lens, and return `clean` when the selected chain has no concrete structural downside.

## Ownership and sources of truth

Trace where important state or data is created, validated, mutated, persisted, recovered, and consumed. Look for competing writers, duplicated authority, or a lifecycle whose transitions are split across owners that cannot enforce the same invariants. A cache, projection, generated artifact, or test fixture is not automatically a competing source of truth. Report only when a reachable path can diverge and the divergence has a concrete consequence.

## Module and dependency direction

Start from a direct consumer and list what it must know about the provider: policy, representation, ordering, failure behavior, configuration, and lifecycle. Look for dependency direction that forces an owner to understand another module's internals, or a boundary that leaks enough decisions to amplify ordinary changes. An import, large module, circular-looking name, or missing interface is not sufficient; establish actual caller burden or invalid-state exposure.

For suspected shallow indirection, reason through removal before calling it redundant. If removal eliminates the apparent complexity, the layer may be pass-through. If required policy, invariants, or failure knowledge instead disperses into callers, the layer may be earning locality. Thinness alone proves neither result; retain a Finding only when the live chain also establishes a reachable trigger and concrete impact.

## Production-path reachability

Trace the smallest complete path from a real entry point to the behavior under examination. For an adapter, validator, normalizer, wrapper, or policy seam, name the direct production caller and its actual callee. Report a bypass only when the live consumer reaches a different path, and distinguish an unused seam from a seam used by another valid entry point. Do not treat API existence, registration, generated code, or an isolated passing test as proof of lifecycle integration.

## Change amplification and repeated knowledge

Use repository history only when it is available and necessary; otherwise trace one representative behavior across schemas, types, adapters, callers, configuration, tests, and documentation. Report amplification when one behavioral change requires independently maintained edits because ownership is fragmented. Similar text, generated output, deliberate boundary translation, and test fixtures are not duplication by themselves. Code reduction is never the objective.

## Verification mismatch

Map focused tests, assertions, or checks to the same production path and public behavior claimed by the implementation. Look for tests that exercise only an isolated seam while the live consumer bypasses it, or verification that cannot observe the relevant state transition or failure contract. Missing tests alone are not a structural finding; establish that existing evidence creates false confidence or leaves a material invariant unverified.

## Finding gate and ranking

Before retaining a finding, answer all of these from repository evidence:

1. What exact entry point, owner, caller, or artifact anchors it?
2. What reachable condition triggers the problem?
3. What realistic user, operator, data, or change-cost impact follows?
4. Which evidence confirms the full chain, and what remains unobserved?
5. What is the smallest next owner: a user decision, shaping question, or one bounded design question?

Discard the finding when any of the first three answers is speculative. Rank retained findings by impact and confidence, not ease of cleanup. Use P1 for a normal-path structural failure with significant correctness or data consequences, P2 for a meaningful edge or recurring change risk, and P3 only for a narrow actionable maintenance risk. Do not emit P0 from this general structural audit; route suspected critical security, safety, or data-loss work to the appropriate specialist or incident owner.
