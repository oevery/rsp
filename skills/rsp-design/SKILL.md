---
name: rsp-design
description: Resolve one material domain-model, module/seam, or evidence-seeking design question for an explicit or unambiguously focused RSP Change without implementing production behavior or writing durable project truth.
license: MIT
metadata:
  author: oevery
  version: "2026.07.22.1"
---

# RSP Design

Resolve one design question and return the result to its existing RSP owner. Do not implement the result.

## Establish the question and authority

Require an explicit WorkRef or exactly one unambiguous focus marker. Read the nearest project instructions and context, the RSP core Skill or fallback protocol, the selected Change and sibling Group Brief, then the smallest relevant Specs, decisions, code, tests, callers, and runtime evidence.

State the single material question before analysis. If the WorkRef, question, required evidence, owner intent, or mutation authority is missing or ambiguous, stop with the smallest blocker. Never invent product intent.

## Load one design mode

Load only the reference matching the question:

- Read [domain modeling](references/domain-modeling.md) for vocabulary, identity, lifecycle, invariants, relationships, or ownership.
- Read [module and seam design](references/module-seams.md) for interface obligations, caller complexity, adapters, test surfaces, or seam placement.
- Read [reversible exploration](references/reversible-exploration.md) only when a material conclusion depends on unobserved behavior and a cheap safe probe can provide it.

Keep evidence-driven conclusions separate from choices only the owner can make. Compare at least one credible alternative when alternatives exist; do not manufacture options for a conclusion forced by evidence or authority.

## Preserve artifact ownership

Default to report-only. When the user or project explicitly authorizes updating the selected Change, write settled planned design only under its `Design` section. Do not write Specs, Decision Records, `CONTEXT.md`, `AGENTS.md`, production code, lifecycle state, focus, archives, or Git state. Identify possible durable current facts or rationale only as artifact-routing candidates for the Core durable review.

An exploration additionally requires explicit disposable-code authority and the cleanup contract in its reference. A design request alone grants neither production mutation nor external side-effect authority.

## Return the bounded result

Use the requested language, then project or existing-artifact language, then conversation language. Return these semantic fields in natural prose:

- selected WorkRef and exact question;
- inspected evidence and material gaps;
- recommendation and evidence-driven reasoning;
- credible alternatives and tradeoffs;
- unresolved owner decisions;
- artifact routing and any authorized Change update;
- smallest next action.

Return to Shape or the user against the same WorkRef. Do not create parallel state, recursively invoke another Skill, implement, review, archive, stage, commit, push, publish, deploy, or approve.
