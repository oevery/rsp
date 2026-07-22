---
name: rsp-shape
description: Shape or rigorously challenge unclear non-trivial work into one executable RSP Change or a justified shallow Change Group without implementing it.
license: MIT
metadata:
  author: oevery
  version: "2026.07.22"
---

# RSP Shape

Shape intent into existing RSP owners. Do not implement the shaped work.

## Establish the boundary

Read the user request, nearest project instructions and context, the RSP core skill or fallback protocol, the selected Change and sibling Group Brief, then only the Specs, decisions, code, tests, and commands needed to settle the shape.

A request to shape, create, or refine a named or selected Change grants authority to those work artifacts unless the user says no-edit; general design advice does not. If the project create command necessarily focuses the new Change, preserve the exact prior focus and restore it immediately unless the user also requested selection. Shaping grants no other authority to change focus, implement, archive, edit durable truth, or mutate Git. Preserve unrelated work.

Return the request directly to implementation when it is tiny and concrete or the selected Change is already ready. Do not rewrite settled work for style or completeness.

## Resolve material ambiguity

Inspect the repository before asking. Ask only for an owner decision whose answer can change behavior, data, interfaces, compatibility, safety, ownership, migration, or acceptance. Ask the smallest useful question set and write only authorized answers into the Change.

Read [deep clarification](references/deep-clarification.md) when the user explicitly asks for rigorous challenge, normal shaping leaves a high-risk decision whose dependent choices remain unresolved, or one bounded domain, module/seam, or evidence-seeking design question must return to Shape. Prefer the installed `rsp-design` capability for that RSP-tracked design question; otherwise return its compact manual fallback against the same WorkRef.

Never invent a product decision. When a material choice or mutation authority remains unresolved, leave the work open and report the single highest-impact blocker.

## Choose the owner

Read [complex shaping](references/complex-shaping.md) before choosing the owner when material clarification needs more than one round, several direct slices share one completion contract, or independently closable owners converge on terminal delivery.

Prefer one ordinary Change. Use a shallow Group only when at least two direct children are independently implementable, verifiable, focusable, and archivable while sharing one goal or completion contract. A shared completion contract gates Group closure, not each child's archive unless that child declares the dependency. Keep membership in Brief `Slices`, exact prerequisites in child `Blockers`, and derived readiness in CLI output. Do not create another hierarchy or tracker.

Follow the core RSP protocol for exact Change and Group structure. Keep one observable outcome per Change:

- `Proposal`: outcome, scope, and non-goals;
- `Spec`: observable requirements and acceptance scenarios;
- `Design`: affected boundaries, constraints, and settled choices;
- `Tasks`: executable implementation steps;
- `Verify`: evidence capable of proving the outcome;
- `Blockers`: exact dependencies and unresolved external decisions, or `none`.

## Apply the Shape Ready gate

A Change is ready only when:

- outcome, non-goals, and acceptance are concrete;
- product and mutation authority are settled;
- affected boundaries and material constraints are known;
- no hidden assumption can change implementation or acceptance;
- Tasks are executable without performing them;
- Verify can prove the result and Blockers are truthful;
- one Change or a justified shallow Group is the smallest sufficient owner.

After an authorized mutation, run the project-provided focused RSP check when available. Return the owning WorkRef, changed artifacts, observed validation, and either the next implementation action or one blocker. Do not use a fixed response token when plain language is clearer.
