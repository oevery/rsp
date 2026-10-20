---
kind: fix
summary: Integrate ownership, reuse and trustworthy-test judgments into existing implementation and review rules.
---

# Change: implementation-quality-guidance

## Proposal
Make ordinary implementation and standalone Code Review apply the existing ownership and complexity principles more directly. Clarify that test arrangements must establish their claimed conditions, preserve meaningful internal collaboration and keep scenario-defining details readable.

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
The quality judgments reside in [Implement](../../skills/rsp-implement/SKILL.md) and [Code Review](../../skills/rsp-review/references/code-review.md). They refine existing ownership, boundary admission, test-value and simplicity rules. Structural-review and Shape retain their existing architecture responsibilities; corpus wording refinements belong to [skill-expression-convergence](2026-10-20_skill-expression-convergence.md).

The original candidate used baseline `37b7ec059b91a0605c5e80106d512cc7b006dd34`. Upstream learning was `model-only`: local instructions were written independently, with no imported text, code or workflow. The [prior research](../../research/reports/2026-10-19T06-05-36Z.md#primary-upstream-practices-and-their-limits) and [source observations](../../tests/skills/reports/implementation-quality-local-20261020T020336Z/sources.json) retain exact source identities, retrieved bytes and reuse limits. These include Matt Pocock `24fe0ef7737efae15c87225755e9f6f5965e4888`, Superpowers `bb92a77741419a4ab5f06e711a283343f1ada0c3`, Google review/unit-testing captures, Google's test-doubles chapter, Sandi Metz and Superpowers issue 2092.

Issue 2092 is an external fixture-failure report, not a local result or adopted rule. Google's book declares CC BY-NC-ND 4.0; no licensed asset was adapted and other reuse rights were not assumed. The change introduces no universal mock ban, fixture requirement, abstraction quota, automatic TDD or mandatory mutation testing. Existing workflow and instruction-design contracts remain its stable owners.

## Tasks
- [x] Integrated semantic ownership, reuse and caller-knowledge judgments into the existing implementation and simplicity rules, retaining distinct responsibilities and useful encapsulation.
- [x] Refined test-value judgments for uncertain arrangements, practical real collaboration and readable setup; retained necessary substitutes, contract-relevant interactions and sufficient existing evidence.
- [x] Validated the candidate locally and preserved source provenance, twelve author contrasts, original check outcomes and their limits.

## Verify
### Required
- [x] Original candidate checks passed for all seven published packages, lint, site documentation and 47 offline native Harbor task schemas. Three affected Markdown files parsed; eight local links and three anchors resolved. Change validation had zero errors or warnings. Both packages had no unreachable Markdown; metadata, headings, resource links and mechanism admission were preserved.
- [x] Twelve static author contrasts covered ownership, forced reuse, useful encapsulation, real/substituted collaboration, effective arrangements, readable setup and contract-relevant effects. Source-grounded, hypothetical and externally reported examples remain distinguished in the original evidence.
- [x] Reused final package/resource, lint and affected-document results after 63 unchanged Skill/Spec input hashes and original logs matched. Site checks and 47 offline task-schema results remain applicable after 37 and 981 respective inputs and original logs matched. Changed records are excluded from this reuse and checked separately.
- [x] Record-convergence checks passed: affected-file lint, Change validation (six records, zero errors/warnings), whitespace, and three Markdown records with 18 local links and four anchors. Frontmatter, six canonical sections and Spec/acceptance bytes are preserved. The other 1,633 tracked inputs, 457 original evidence files, HEAD, index and Focus remain unchanged.

Original candidate evidence: `tests/skills/reports/implementation-quality-local-20261020T020336Z/`. It retains the source observations, author scenarios, preservation comparison and initial host invocation errors. Those errors preceded successful evidence setup and establish neither product defects nor passing checks.

Record-convergence evidence: `tests/skills/reports/change-record-convergence-local-20261020T060830Z/`. Original reports retain their baselines, candidate patches, observations, failures and verdicts. The new evidence binds record checks and reused results to the final inputs.

Focused live evidence: [native job 2026-10-20T06-27-41.315819Z](../../tests/skills/reports/2026-10-20T06-27-41.315819Z/summary.md) executed the current seven-Skill suite on eight frozen tasks, once each, at concurrency one. All six code-quality tasks and the structural preservation control scored 1.0 in both deterministic and semantic components. They exercised transaction/recovery protection, receiver-owned protocol simplification, mixed-protocol preservation, Git identity reuse and necessary external digest validation.

The structural defect task in that original job remains failed at 0.5: semantic judgment accepted the ownership bypass, numeric consequence and coverage gap, but its deterministic report contract scored 0. The report put explanatory text in bypass and an array in entrypoint; the task had not explicitly declared the latter field as a single string. The first exact path-matching assertion failed before later example/citation checks. Its original report, check failure and grading reasons remain unchanged. That job had no task retries, resumes, regrades or supplemental runs. Preparation evidence, including the rejected stale image and successful rebuild, is retained under `tests/skills/reports/quality-live-preparation-20261020T062402Z/`; native sibling `.inputs` retains execution inputs.

Separately authorized report-contract follow-up: [native job 2026-10-20T07-41-23.685845Z](../../tests/skills/reports/2026-10-20T07-41-23.685845Z/summary.md) ran structural-audit once with the clarified path-field contract and separate format/identity diagnostics. Reward, deterministic checks and both semantic criteria scored 1.0; the submitted fields were single repository-relative paths, and the numeric example, citations and read-only boundary passed. All 41 Skill files, executor settings and image matched the original run; only the task instruction and checker changed. No task retry, resume, regrade or further supplement followed. Local preparation, comparison and preservation evidence is under `tests/skills/reports/structural-report-live-20261020T074001Z/`.

Limits: original static checks and author interpretations establish structure and local consistency only. The original eight-task run retains seven full scores and one failure; the separate one-task pass does not replace it. Neither experiment establishes full eight-task acceptance under the new contract, a causal Skill improvement, reliability, expression equivalence, larger-repository/device behavior or independent human acceptance. Historical live verdicts remain bound to their own inputs.

## Blockers
None
