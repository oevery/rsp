---
name: author-rsp-skills
description: Author, revise, audit, semantically condense, adapt, or evaluate repository RSP Skills. Use for a selected RSP Change that changes a Skill contract, package, progressive resources, context shape, upstream-derived mechanism, or current-versus-candidate evidence; do not use for ordinary product implementation or publication alone.
---

# Author RSP Skills

Prepare one bounded Skill candidate and return evidence. The selected RSP Change owns the work; this Skill does not grant review, Git, archive, installation, or publication authority.

## Select mode and target

Require one explicit target package or authored corpus plus artifact mutation authority. Read the nearest instructions, selected Change, target `SKILL.md`, directly linked resources, relevant tests, and accepted research named by the Change. Preserve unrelated work and stop when the owner, behavioral gap, or authority is unresolved.

Choose one primary mode:

| Mode | Use when | Load |
| --- | --- | --- |
| `create` | a demonstrated capability has no owner | [authoring](references/authoring.md) |
| `revise` | an existing contract or workflow needs a bounded behavior change | [authoring](references/authoring.md) |
| `audit` | the target corpus needs structural, reachability, duplication, or clarity findings | [authoring](references/authoring.md) |
| `concise` | equivalent behavior should use less or clearer context | [concision](references/concision.md) |
| `adapt` | an accepted upstream mechanism is selected for local use | [authoring](references/authoring.md) |
| `evaluate` | current and candidate behavior need comparison | [evaluation](references/evaluation.md) |

Load only the selected reference. Load [evaluation](references/evaluation.md) additionally before completing `create`, `revise`, `concise`, or `adapt` when observable behavior changes.

## Preserve the contract

Name the candidate's trigger, inputs, authority, action, output, stop, verification, and conditional-loading behavior before editing. Any intentional change to one of these belongs in the selected Change; otherwise preserve it. Keep one owner for each state, receipt, field, and lifecycle transition.

Use host limits as constraints, never as the definition of quality. Words, lines, bytes, tokens, tool calls, and elapsed time are diagnostics. Do not pass a candidate because it is shorter or fail it because it is longer.

## Work

1. Establish current evidence and the smallest candidate delta.
2. Create new packages with the host's canonical Skill initializer; edit authored sources, not generated projections.
3. Keep the entrypoint focused on routing, authority, action, stop, and return. Put low-frequency procedures in directly linked references and deterministic work in scripts.
4. Run `node .agents/skills/author-rsp-skills/scripts/scan-skill-context.mjs` for corpus diagnostics when package layout, reachability, repetition, or context shape matters.
5. Reuse repository evaluation, security, packaging, and behavior checks. Do not duplicate their implementations inside the Skill.
6. Update only the selected Change's Tasks, Verify evidence, Durable Decisions, and Blockers after outcomes exist.

## Stop and return

Stop before accepting a candidate, independent review, Git delivery, archive, push, tag, release, publication, or installation unless the user separately authorizes the owning workflow. Also stop when provenance, license, containment, current behavior, or required holdout evidence is unresolved.

Return: `WorkRef`, `Mode`, `Target`, `Contract delta`, `Changed artifacts`, `Fresh verification`, `Diagnostics`, `Blockers`, and `Next owner`. Use natural language; include machine-readable output only when another tool consumes it.
