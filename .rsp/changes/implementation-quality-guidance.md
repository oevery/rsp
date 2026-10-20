---
kind: fix
summary: Integrate ownership, reuse and trustworthy-test judgments into existing implementation and review rules.
---

# Change: implementation-quality-guidance

## Proposal
Make ordinary implementation and standalone Code Review apply the existing ownership and complexity principles more directly. Clarify that test arrangements must establish their claimed conditions, preserve meaningful internal collaboration and keep scenario-defining details readable.

The user authorized this bounded Skill revision and local validation, with no commit. Integrate the judgments into existing rules and retain their conditions and counterexamples. Do not add a workflow, mandatory report field, blanket test-first policy, test quota, whole-repository audit, live model execution, installation or lifecycle delivery.

## Spec
### MODIFIED
- Requirement: Within the authorized implementation/review boundary, prefer existing semantic owners, keep rules and invariants coherent, and reduce caller knowledge and change dispersion. Similar code with different responsibilities may remain separate; reuse must not force unrelated flags or speculative interfaces. Judge understanding and change cost rather than file size or layer count.
- Requirement: Existing test-value judgments consider whether scenario-dependent arrangements actually establish the claimed condition. Use targeted inspection or a probe when uncertain, not an assertion or executed mutation for every test. Prefer practical, fast, deterministic real collaborators while allowing a necessary substitute to establish the scenario. Keep important inputs and assertions visible; share incidental setup when it improves clarity.
- Requirement: Preserve sufficient-existing-evidence admission, independent expectations, consumer outcomes, contract-relevant interactions, risk-selected test-first work and the existing scope/finding gates. Follow the existing [workflow ownership](../specs/workflow.md#capability-ownership) and [instruction design](../specs/writing-quality.md#instruction-and-resource-design) contracts; add no phase, resource or required reporting format.

### Acceptance
#### Scenario: Coherent ownership without forced abstraction
- GIVEN a rule already owned by a production module, superficially similar code with a different responsibility, or a wrapper hiding a real lifecycle constraint
- WHEN the changed implementation or review applies the existing boundary and simplicity judgments
- THEN repeated business knowledge is avoided, independent responsibilities can remain separate, and useful encapsulation is assessed by its actual caller obligations rather than size or reuse count.
#### Scenario: Trustworthy arrangements without universal extra checks
- GIVEN a platform-dependent fixture, injected failure or concurrent condition, and a contrasting simple deterministic input
- WHEN the test's observable consequence and evidence gap are assessed
- THEN uncertainty about the arrangement is resolved proportionately, real collaboration and necessary substitutes remain valid choices, and no per-test precondition assertion, permanent test or mutation run is imposed.
#### Scenario: Readable tests with meaningful effects
- GIVEN test helpers that hide important scenario inputs, a useful shared resource fixture, and a contract requiring zero writes or ordering
- WHEN the existing test-value judgment applies
- THEN scenario-defining facts remain visible, useful setup reuse is retained, and required interaction effects and sufficient existing evidence stay protected.

## Design
Revise only the existing boundary/test paragraphs in `skills/rsp-implement/SKILL.md` and test-value/simplicity judgments in `skills/rsp-review/references/code-review.md`, against clean baseline `37b7ec059b91a0605c5e80106d512cc7b006dd34`. The existing structural-review and Shape references already own the detailed architecture lenses; leave them unchanged. Preserve headings, metadata, links, routing, authority, stops, mechanism admission and the previous comment refinement.

Mode is `revise`; upstream learning is `model-only`, with independently written local instructions and no imported text, code or workflow. The [prior research](../../research/reports/2026-10-19T06-05-36Z.md#primary-upstream-practices-and-their-limits) retains Matt Pocock commit `24fe0ef7737efae15c87225755e9f6f5965e4888`, `skills/engineering/codebase-design/SKILL.md`, and Superpowers commit `bb92a77741419a4ab5f06e711a283343f1ada0c3`, `skills/test-driven-development/writing-good-tests.md`. Existing Google review/unit-testing captures are `quality-google-review@20261019T061403349Z` and `quality-google-unit-testing@20261019T061403392Z`.

Supplemental primary material retrieved on 2026-10-20 is retained with URLs, times and original bytes in [source observations](../../tests/skills/reports/implementation-quality-local-20261020T020336Z/sources.json): Google test doubles chapter 13, Sandi Metz's The Wrong Abstraction, and Superpowers issue 2092. The issue is an open reported fixture failure, not an adopted upstream rule or local execution result. Google's book states CC BY-NC-ND 4.0; no licensed asset is adapted, and reuse rights for the other web material are not assumed. Do not transfer universal mock bans, full-structure fixture requirements, fixed abstraction counts, automatic TDD or mandatory mutation testing.

Use existing package, lint, documentation and offline task checks plus contrasting author scenarios. These establish local structure and consistency only; do not attribute historical live verdicts to the revised candidate. This Change leaves the previous quality-judgment and research records intact.

## Tasks
- [x] Integrated ownership, semantic reuse and caller-knowledge judgments into the existing implementation and simplicity rules, with exceptions for distinct responsibilities and useful encapsulation.
- [x] Refined existing test-value rules for uncertain scenario establishment, practical real collaboration and readable setup; retained necessary substitutes, interaction effects and sufficient existing evidence.
- [x] Completed local package/document/offline checks and twelve contrasting author scenarios, preserving scope and historical evidence.

## Verify
### Required
- [x] All seven Skill packages passed metadata/resource validation; lint and site documentation passed, including seven bilingual page pairs and 29 Markdown files. All 47 native Harbor task schemas passed offline. No agent or judge executed.
- [x] Three affected Markdown files parsed, with eight local links and three heading anchors resolving. Change validation passed with zero errors or warnings. Both affected packages have no unreachable Markdown; the only repeated prose is the unchanged standalone work-model notice. Existing Skill headings, metadata, resource links and mechanism admission are unchanged.
- [x] Twelve author contrasts cover meaningful versus forced reuse, useful encapsulation with one caller, maintainable internal structure, real versus substituted collaboration, valid versus ineffective arrangements, readable setup, and preserved evidence/interaction rules. Protocol and noise controls provide source-grounded positive examples; hypothetical examples and the externally reported BOM failure are labeled. These are static interpretations, not executed Skill behavior or independent acceptance.
- [x] Preservation comparison matched 1,630 of 1,632 tracked baseline files; only the two intended Skill files differ. The new Change is untracked. Original focus content, HEAD and index are unchanged; previous records, evaluation definitions, candidate manifests and historical evidence were not rewritten. Initial host invocation errors are retained in the author record and precede successful evidence setup; they are not product or check failures.

Evidence belongs under `tests/skills/reports/implementation-quality-local-20261020T020336Z/`. No model execution, semantic judging or independent review is part of this local-only scope.

## Blockers
None for the authorized local candidate. Behavioral effectiveness remains unverified; the Change stays open.
