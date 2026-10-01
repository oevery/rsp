---
kind: "feature"
---

# Change: skill-authoring-capability

## Proposal

- Outcome: Unify repository-document and Skill writing under rsp-doc, with a shared quality contract and separate read-only Review. Make guidance concise and actionable without losing facts, useful context or authority boundaries.

## Spec

### MODIFIED

- Requirement: rsp-doc owns README, CONTEXT, Spec, Change, technical-document and Skill writing/self-checks. Skill authoring uses an internal conditional method, not a separate package or Core/Manage branch.
- Requirement: [writing-quality](../specs/writing-quality.md) owns the adopted contract. Doc and Review carry standalone execution guidance without a runtime dependency on this repository's Spec.
- Requirement: writing preserves substantive qualifiers, author voice and authority. Steps include prerequisites, actions and success signals; useful summaries, causal explanation and purpose-required evidence remain.
- Requirement: Review checks agreed expression requirements as contracts. Executable Skills use Code; semantic documents use Document. Review stays read-only; self-checks do not establish independent acceptance.
- Requirement: distribution contains eight default Skills plus optional structural audit. Doc remains installed through its canonical projection.

### Acceptance

#### Scenario: Create a Skill through Doc

- GIVEN a Chinese request, English artifact configuration and an absent target package
- WHEN Doc uses its Skill method
- THEN it creates a minimal English package at the requested location, preserves other files and reports in Chinese without installing or publishing.

#### Scenario: Produce usable concise writing

- GIVEN useful summaries, substantive qualifiers and necessary operating evidence alongside filler
- WHEN Doc revises the artifact
- THEN readers can find information, understand conditions, act or judge compliance, and identify unknowns without losing useful context or following unnecessary link chains.

#### Scenario: Review agreed writing quality

- GIVEN explicit expression requirements and a fixed artifact set
- WHEN Review checks the artifact's actual role
- THEN it reports evidenced contract violations without inventing personal style rules or editing files.

## Design

Use one Doc entrypoint with conditional methods for human documents, agent-facing guidance and Skill packages. Keep language resolution, factual checks and self-checks common. Maintainer author-rsp-skills retains local Change, provenance, candidate and evaluation obligations.

Expression follows reader purpose: state correct behavior directly; use contrasts for real misconceptions, numbering for necessary order, bullets for peers and connected prose for useful causes. Preserve stable symbol meanings and sparse fixed-mapping Skill tables. Keep useful local context alongside one authoritative contract.

Model-only sources:

- [Matt R8–R10](../../research/upstreams/matt-skills/c55ee46073ed923f86ce59a5eb3b6d895095d1b7.md): conditional navigation, Skill mechanics and completion.
- [Writing guides R1–R3](../../research/upstreams/writing-guides/2026-09-30.md): result-oriented expression, semantic economy and artifact-sensitive quality.

## Tasks

- [x] Establish the quality contract and unified Doc methods.
- [x] Align Review, maintainer guidance, distribution and usage documentation.
- [x] Cover Skill creation/revision, human-document writing and read-only review with semantic cases.
- [x] Complete implementation checks and record evidence and limits.

## Verify

### Required

Recorded implementation verification:

- [x] Build, lint, typecheck and code regression tests passed; authored and generated fallback agreed.
- [x] Package tests, metadata/resource validation, security checks and documentation checks passed.
- [x] Focused cases and the full suite passed offline validation.
- [x] Inventory contained eight default Skills and one optional audit, with Doc included by default; canonical projection and active-name checks passed.
- [x] Change structure and diff checks passed.

### Limits

Live style, selection and task-quality improvements have not been tested. Static/offline checks and author self-checks do not establish independent acceptance or measured benefit.

## Blockers

- none
