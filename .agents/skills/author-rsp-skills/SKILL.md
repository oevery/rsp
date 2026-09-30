---
name: author-rsp-skills
description: Maintain RSP's own Skill candidates, source provenance and evaluation evidence. Use for a repository Skill Change or read-only corpus audit, not general project Skill authoring.
---

# Author RSP Skills

Audit one authored corpus or prepare one bounded RSP Skill candidate. These maintainer requirements supplement rsp-doc's Skill-authoring branch; they do not apply to ordinary project Skills. Report-only Pre-Change Audit needs no WorkRef. RSP candidates and repairs require a selected Change and explicit mutation authority; this method grants no acceptance, Git, lifecycle or installation authority.

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

Use rsp-doc's Skill branch for descriptions, instructions, resources and concise expression. If unavailable, use the host's authoring guidance within the same boundary; do not install it implicitly.

## Work

1. Establish current evidence and, when mutation is authorized, the smallest candidate delta.
2. Apply the general authoring method to canonical package sources, not generated projections.
3. Preserve each standalone package's runtime closure; maintainer research and candidate evidence must not become installed dependencies.
4. Run `node .agents/skills/author-rsp-skills/scripts/scan-skill-context.mjs` for corpus diagnostics when package layout, reachability, repetition, or context shape matters.
5. Reuse repository evaluation, security, packaging, and behavior checks. Do not duplicate their implementations inside the Skill.
6. For tracked work, update only the selected Change's Tasks, Verify evidence, Durable Decisions, and Blockers after outcomes exist. A report-only Pre-Change Audit writes no artifact and returns its findings to Core or the user for the planning decision.

## Stop and return

Stop a report-only Pre-Change Audit before any artifact mutation or candidate acceptance. For tracked work, stop before accepting a candidate, independent review, Git delivery, archive, push, tag, release, publication, or installation unless the user separately authorizes the owning workflow. Also stop when provenance, license, containment, current behavior, or evidence explicitly required by the selected experiment is unresolved.

Return: `WorkRef` (`N/A` for report-only Pre-Change Audit), `Mode`, `Target`, `Contract delta`, `Changed artifacts`, `Fresh verification`, `Diagnostics`, `Blockers`, and `Next owner`. Use natural language; include machine-readable output only when another tool consumes it.
