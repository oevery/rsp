---
name: rsp-design
description: Resolve one material domain-model, module/seam, or evidence-seeking design question before a Change or for an explicit or focused RSP Change without implementing production behavior or writing durable project truth.
license: MIT
metadata:
  author: oevery
  version: "2026.07.26.1"
---

# RSP Design

Resolve one design question. Do not implement it.

## Establish the question and authority

State one explicit bounded design question. Read project authority and the smallest relevant Specs, decisions, code, tests, callers, and runtime evidence.

Choose one ownership mode:

- **Pre-Change Design:** use when no Change is selected and the request already contains one bounded design question. Remain report-only and return to the user. If outcome, scope, non-goals, acceptance, or decomposition remains materially unclear, return the request to Shape instead of creating an implicit planning owner. Do not invent a WorkRef, continuation, or artifact.
- **Tracked Design:** require an explicit WorkRef or exactly one unambiguous focus marker. Read the selected Change and sibling Group Brief, then return the result to the same WorkRef.

Stop on an ambiguous question, evidence boundary, owner intent, authorized-write owner, or required mutation authority. Never invent product intent.

## Load one design mode

Load only the reference matching the question:

- Read [domain modeling](references/domain-modeling.md) for vocabulary, identity, lifecycle, invariants, relationships, or ownership.
- Read [module and seam design](references/module-seams.md) for interface obligations, caller complexity, adapters, test surfaces, or seam placement.
- Read [reversible exploration](references/reversible-exploration.md) only when a material conclusion depends on unobserved behavior and a cheap safe probe can provide it.

Separate evidence-driven conclusions from owner choices. Compare one credible alternative when alternatives exist; do not manufacture options when evidence or authority forces the conclusion.

## Preserve artifact ownership

Default to report-only. Pre-Change Design never mutates artifacts. In Tracked Design, when the user or project explicitly authorizes updating the selected Change, write settled planned design only under its `Design` section. Do not write Specs, Decision Records, `CONTEXT.md`, `AGENTS.md`, production code, lifecycle state, focus, archives, or Git state. Identify possible durable current facts or rationale only as artifact-routing candidates for the Core durable review.

An exploration additionally requires explicit disposable-code authority and the cleanup contract in its reference. A design request alone grants neither production mutation nor external side-effect authority.

## Return the bounded result

Follow Core's response-versus-artifact language boundary: use the requested language for natural prose, while any authorized `Design` update follows the selected Change's language and canonical headings. Do not use a technical token alone as a response label; retain it only in parentheses after a localized label. Return these semantic fields:

- ownership mode, selected WorkRef when tracked, and exact question;
- inspected evidence and material gaps;
- recommendation and evidence-driven reasoning;
- credible alternatives and tradeoffs;
- unresolved owner decisions;
- artifact routing and any authorized Change update;
- smallest next action.

Pre-Change results return to the user; name Shape as the smallest next action only when accepted work needs an executable owner. Tracked results return to Shape or the user against the same WorkRef. Do not create parallel state, recursively invoke another Skill, implement, review, archive, stage, commit, push, publish, deploy, or approve.
