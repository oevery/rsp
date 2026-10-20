---
kind: fix
summary: Clarify independent test expectations and useful comments within existing Skill judgments.
---

# Change: quality-judgment-clarity

## Proposal
Refine the existing test and comment judgments in Implement, Review and Doc. Tests should derive expectations independently of the computation being tested; comments should preserve useful information that nearby code does not make clear. Replace overlapping expressions rather than add a workflow, reporting field or format gate.

The user authorized these two refinements and local verification only. Preserve mechanism admission, risk-selected test-first work, existing task/checker/rubric definitions, candidate labels and historical evaluation records. No live model execution, regrade, Git delivery, installation or closure is authorized.

## Spec
<!-- Describe the contract delta and acceptance conditions, referencing affected existing Specs; do not copy the full baseline or implementation steps. -->
### MODIFIED
- Requirement: Existing test-value judgments derive expected outcomes from the agreed contract or an independent example rather than repeat the tested computation. Error details and interaction counts or order are fixed only when the contract needs them; otherwise rejection and its effects are sufficient. Merely re-proving a covered forwarding hop is insufficient; a single final-message assertion can establish the agreed consumer outcome. This adds no permanent-test obligation, report field or preferred assertion syntax.
- Requirement: Existing comment checks retain accurate constraints, rationale or usage information that nearby code does not make clear, and remove restatement that adds no useful information. API inputs, returns, failures and usage, and behavior-affecting annotations retain their current ownership. No comment quota, required section or independent writing pass is added.

### Acceptance
#### Scenario: Independent expectations without incidental constraints
- GIVEN a test of an agreed behavior or failure contract
- WHEN its expectations are assessed under the existing test-value judgment
- THEN the expectation has a contract or independent example basis, while contract-equivalent errors and wrappers remain acceptable, a single final-message assertion can prove the agreed consumer outcome, and required zero-write, no-replay or ordering guarantees remain protected.
#### Scenario: Information-bearing comments without a template
- GIVEN an API comment, an explanation of a non-obvious constraint or a restatement of nearby operations
- WHEN the existing comment check applies
- THEN required contract and useful explanatory information is preserved, uninformative narration can be removed, and neither a fixed wording nor a new writing workflow is required.

## Design
Replace the existing permanent-test bullets and ordinary-comment checks in the canonical Skill sources. Keep Review and Doc usable on their own, and align the ordinary-comment statement in the [writing-quality Spec](../specs/writing-quality.md#artifact-differences). Preserve descriptions, triggers, inputs, authority, output, stops, resource links and conditional loading. Keep Implement's mechanism-admission paragraph byte-identical.

The accepted P2 finding identifies lost scope in Implement's interaction sentence. Restore the covered-hop limitation and distinguish it from a final-message assertion proving the consumer outcome. The existing protocol-control tests supply static positive examples through ReceiverSession.send, encode and wire.send; contrast a hypothetical hop-only assertion with no evidence of that outcome. Preserve the original eight-case author record and add the correction evidence separately.

Use the selected [test and comment recommendations](../../research/reports/2026-10-19T06-05-36Z.md#recommendations-without-changing-skills) as model-only provenance. That report retains the Google testing/review captures and the pinned Superpowers test guidance, including source identities and reuse limits. Write local wording independently; import no upstream text, code or workflow. The prior evaluation's real implementation omission and evaluator failures remain their original observations, not proof of this candidate's effectiveness.

Use existing package, document and offline schema checks, plus author inspection of contrasting contract and comment cases. Do not introduce tests that assert Skill wording. Local checks cannot establish model behavior, discovery, reliability or independent acceptance; older live runs remain evidence for their unchanged historical Skill inputs.

## Tasks
- [x] Refined independent test expectations in the existing Implement and Review judgments, replacing the shared-constant shorthand with contract and independent-example reasoning. Contract-relevant error details and interaction effects remain protected.
- [x] Refined existing comment checks in Implement, Review, Doc and the writing-quality Spec without adding a section, flow, output field or required comment form.
- [x] Completed local checks and preservation comparisons, retaining candidate-bound limits.
- [x] Corrected the accepted P2 interaction limitation: only re-proving a covered forwarding hop is insufficient; a single final-message assertion can suffice for the agreed consumer outcome. Added final-message versus covered-hop static contrasts and completed local checks.

## Verify
### Required
- [x] P2 correction checks: all seven Skill packages passed metadata/resource validation; lint, two affected Markdown files/six local links/two heading anchors, focused Change validation and diff whitespace checks passed. Existing headings and resource links are unchanged. The prior site documentation, context reachability and 47 offline task-schema results remain applicable to their unchanged inputs; these do not establish this Skill candidate's model behavior.
- [x] P2 static contrasts retain the eight initial cases and add two source-grounded final-message positives plus one explicitly hypothetical covered-hop negative. The real protocol-control tests exercise ReceiverSession.send through encode to wire.send and compare final target/protocol/content outcomes in a single assertion. The contrast concerns the observed consumer consequence, without a count quota or blanket interaction ban. No new executable test, semantic judge or independent re-review ran. All 111,904 protected existing files match the correction snapshot, including the original author record, other uncommitted refinements, 29 candidate manifests and historical evidence. Mechanism admission, Skill metadata, task/checker/rubric sources, HEAD and index remain unchanged. Correction evidence is under tests/skills/reports/quality-interaction-local-20261020T012859Z/.
- [x] Initial candidate checks: all seven Skill packages passed metadata/resource validation; lint and site documentation checks passed. The five affected Markdown files parsed, with 15 local links and seven heading anchors resolving. All 47 native task schemas passed offline; no behavior or semantic judgment ran. Focused Change validation reported zero errors or warnings.
- [x] Initial author inspection covered eight contrasting cases: independent results; contract constants/properties; equivalent failures; required interaction effects; sufficient existing evidence; useful rationale versus narration; complex-code explanation and flexible comment form; and API/annotation ownership. These are static interpretations, not executed agent tests or independent review; they omitted the final-message single-assertion case identified by Review. Context diagnostics found no unreachable Markdown in the three changed packages; the shared work-model notice remains useful standalone guidance, not an automatic duplication defect.
- [x] Initial preservation comparison: all 111,884 protected existing files match the pre-edit snapshot, including the 29 candidate manifests, task/checker/rubric definitions, historical evidence and previous work records. Implement's mechanism-admission paragraph and Skill metadata are byte-identical. HEAD, index and previous focus markers are unchanged; only this new Change's focus marker was added.

Local evidence is under tests/skills/reports/quality-judgment-local-20261020T011031Z/. The initial offline-schema command was stopped by sandbox access to the existing uv cache; its failed log is retained separately from the successful authorized retry. No real model execution, regrade or historical acceptance update occurred. These checks establish local structure and author consistency, not improved model behavior or general reliability.

## Blockers
None for the authorized local candidate. Behavioral effectiveness and independent review remain unestablished; no live run is required or authorized for this local-only scope. The Change stays open.
