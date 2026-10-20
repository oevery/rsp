---
kind: fix
summary: Clarify independent test expectations and useful comments within existing Skill judgments.
---

# Change: quality-judgment-clarity

## Proposal

Refine the existing test and comment judgments in Implement, Review and Doc. Expected results come from the agreed contract or independent examples; comments retain useful information that nearby code does not explain. Integrate these judgments without a new workflow, report field or format gate.

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

The canonical Implement and Code Review test-value clauses distinguish independent expectations, covered forwarding hops and final-message assertions proving a consumer outcome. Contract-relevant zero-write, no-replay, ordering and failure effects remain protected. Mechanism admission, task definitions, rubrics and calibration labels were outside this candidate.

Implement, Review and Doc retain useful constraints, rationale and usage in comments. The corresponding stable clause is in [writing quality](../specs/writing-quality.md#artifact-differences). API contracts and behavior-affecting annotations keep their existing owners.

Provenance is model-only: independently written local guidance follows the selected [test/comment recommendations](../../research/reports/2026-10-19T06-05-36Z.md#recommendations-without-changing-skills), which retain exact sources and reuse limits. No upstream text, code or workflow was imported. Later [implementation-quality guidance](../archives/2026-10-20_implementation-quality-guidance.md) and [expression convergence](../archives/2026-10-20_skill-expression-convergence.md) preserve these refinements under separate candidate boundaries.

## Tasks

- [x] Replaced the shared-constant shorthand with contract/independent-example expectations while retaining contract-relevant error and interaction effects.
- [x] Refined comment judgments in Implement, Review, Doc and the writing Spec without a comment quota, new section or required form.
- [x] Corrected the accepted P2 scope loss: re-proving a covered forwarding hop is insufficient, while one final-message assertion can establish the agreed consumer outcome; retained static positive and negative contrasts.
- [x] Completed local package, document and preservation checks with candidate-bound evidence.

## Verify

### Required
- [x] Initial checks passed for all seven published packages, lint, site documentation, 47 offline native schemas, focused Change validation and whitespace. Five Markdown files, 15 local links and seven anchors passed; metadata, mechanism admission and protected inputs matched the original snapshot.
- [x] The P2 correction passed seven-package validation, lint, focused Change/whitespace checks and two Markdown files with six links/two anchors. Unchanged site, reachability and offline-schema inputs retained their earlier results; no fresh execution of those checks was claimed.
- [x] Static author inspection retained the eight initial cases and the correction contrasts: two real protocol-control final-message positives and one explicitly hypothetical covered-hop negative. The initial cases omitted that single-assertion distinction; the correction and its evidence remain separate from the original author record.

Original evidence: [initial candidate](../../tests/skills/reports/quality-judgment-local-20261020T011031Z/) and [interaction correction](../../tests/skills/reports/quality-interaction-local-20261020T012859Z/). Their baselines, preservation inventories and original logs remain unchanged. The initial offline-schema invocation failed on sandbox access to the existing uv cache; its failed log is separate from the successful retry.

Limits: these are local structure and author-consistency checks. No candidate model run, semantic judge or independent re-review was performed; behavioral improvement and reliability remain unestablished. Historical evaluations and later suite executions retain their own Skill inputs.

Record-convergence evidence: [local comparison](../../tests/skills/reports/change-record-guidance-local-20261020T085348Z/). The original records, Spec/acceptance bytes and evidence remain retained; this record-only revision does not regrade earlier results.

## Blockers

None
