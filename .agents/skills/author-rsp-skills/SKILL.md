---
name: author-rsp-skills
description: Author, revise, audit, semantically condense, adapt, or evaluate repository RSP Skills. Use for a report-only Pre-Change Audit or a selected RSP Change that changes a Skill contract, package, progressive resources, context shape, upstream-derived mechanism, or current-versus-candidate evidence; do not use for ordinary product implementation or publication alone.
---

# Author RSP Skills

Audit one explicit authored corpus or prepare one bounded Skill candidate and return evidence. A report-only Pre-Change Audit may run without inventing a WorkRef; every candidate or repair remains owned by a selected RSP Change. This Skill does not grant artifact mutation, candidate acceptance, review, Git, archive, installation, or publication authority.

## Select mode and target

Require one explicit target package or authored corpus. A report-only Pre-Change Audit requires read-only authority, returns findings with `WorkRef: N/A`, and stops before candidate creation, repair, mutation, or acceptance. Every other mode, plus an audit repair, requires one selected RSP Change and explicit artifact mutation authority. Read the nearest instructions, the selected Change when required, target `SKILL.md`, directly linked resources, relevant tests, and accepted research named by the Change. Preserve unrelated work and stop when the owner, behavioral gap, or authority is unresolved.

Choose one primary mode:

- `create`: a demonstrated capability has no owner.
- `revise`: an existing contract or workflow needs a bounded behavior change.
- `audit`: the target corpus needs structural, reachability, duplication, or clarity findings.
- `concise`: equivalent behavior should use less or clearer context.
- `adapt`: an accepted upstream mechanism is selected for local use.
- `evaluate`: current and candidate behavior need comparison.

Load only the selected reference: [authoring](references/authoring.md) for `create | revise | audit | adapt`, [concision](references/concision.md) for `concise`, or [evaluation](references/evaluation.md) for `evaluate`. Load evaluation additionally before completing `create`, `revise`, `concise`, or `adapt` when observable behavior changes.

## Preserve the contract

Name the candidate's trigger, inputs, authority, action, output, stop, verification, and conditional-loading behavior before editing. Any intentional change to one of these belongs in the selected Change; otherwise preserve it. Keep one owner for each state, receipt, field, and lifecycle transition.

Use host limits as constraints, never as the definition of quality. Words, lines, bytes, tokens, tool calls, and elapsed time are diagnostics. Do not pass a candidate because it is shorter or fail it because it is longer.

## Work

1. Establish current evidence and, when mutation is authorized, the smallest candidate delta.
2. Create new packages with the host's canonical Skill initializer; edit authored sources, not generated projections.
3. Keep the entrypoint focused on routing, authority, action, stop, and return. Put low-frequency procedures in directly linked references and deterministic work in scripts.
4. Run `node .agents/skills/author-rsp-skills/scripts/scan-skill-context.mjs` for corpus diagnostics when package layout, reachability, repetition, or context shape matters.
5. Reuse repository evaluation, security, packaging, and behavior checks. Do not duplicate their implementations inside the Skill.
6. For tracked work, update only the selected Change's Tasks, Verify evidence, Durable Decisions, and Blockers after outcomes exist. A report-only Pre-Change Audit writes no artifact and returns its findings to Core or the user for the planning decision.

## Stop and return

Stop a report-only Pre-Change Audit before any artifact mutation or candidate acceptance. For tracked work, stop before accepting a candidate, independent review, Git delivery, archive, push, tag, release, publication, or installation unless the user separately authorizes the owning workflow. Also stop when provenance, license, containment, current behavior, or required holdout evidence is unresolved.

Return: `WorkRef` (`N/A` for report-only Pre-Change Audit), `Mode`, `Target`, `Contract delta`, `Changed artifacts`, `Fresh verification`, `Diagnostics`, `Blockers`, and `Next owner`. Use natural language; include machine-readable output only when another tool consumes it.
