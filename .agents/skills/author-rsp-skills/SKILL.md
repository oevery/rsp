---
name: author-rsp-skills
description: Maintain RSP's own Skill candidates, source provenance and evaluation evidence. Use for a repository Skill Change or read-only corpus audit, not general project Skill authoring.
---

# Author RSP Skills

Audit an authored corpus or prepare one bounded RSP Skill candidate. Apply rsp-doc's Skill-authoring method with these RSP-only maintenance requirements. They do not govern ordinary project Skills or grant acceptance, Git, lifecycle or installation authority.

## Select mode and target

Require one explicit target package or authored corpus, then establish the authority for the selected mode:

- A report-only Pre-Change Audit is read-only, returns findings with `WorkRef: N/A`, and stops before candidate creation, repair, mutation or acceptance.
- Every other mode, including audit repair, requires one selected RSP Change and explicit artifact mutation authority.

Read nearest instructions and the selected Change when required. Preserve unrelated work; unresolved ownership, behavior or authority stops the affected work.

Choose one primary mode:

- `create`: a demonstrated capability has no owner.
- `revise`: an existing contract or workflow needs a bounded behavior change.
- `audit`: the target corpus needs structural, reachability, duplication, or clarity findings.
- `concise`: equivalent behavior should use less or clearer context.
- `adapt`: an accepted upstream mechanism is selected for local use.
- `evaluate`: a candidate needs task evidence, or an explicit comparative claim needs matched runs.

Select reading scope by mode:

- `audit` or whole-package `concise`: inspect complete selected packages, including UI metadata and references.
- Bounded `revise` or `adapt`: read the entrypoint, changed branch, direct callers, relevant tests and adopted research needed by the delta. Expand for shared rules, moved resources or uncertain closure.
- `create`: inspect existing neighboring owners. `evaluate`: read the selected case, candidate and execution inputs.

Do not preload unrelated branches; final metadata/resource validation covers every complete changed package.

Load only the selected reference: [authoring](references/authoring.md) for `create | revise | audit | adapt`, [concision](references/concision.md) for `concise`, or [evaluation](references/evaluation.md) for `evaluate`. For any authorized mutation, including audit repair, additionally load evaluation before completion when observable behavior changes. Report-only audits remain read-only.

## Preserve the contract

Before editing, identify trigger, inputs, authority, action, output, stops, verification and conditional loading. Change them only through an intentional delta in the selected Change. Keep one owner for each state, receipt, field and lifecycle transition.

Use host limits as constraints, never as the definition of quality. Words, lines, bytes, tokens, tool calls, and elapsed time are diagnostics. Do not pass a candidate because it is shorter or fail it because it is longer.

Use rsp-doc's Skill branch for descriptions, instructions, resources and concise expression. If unavailable, use the host's authoring guidance within the same boundary; do not install it implicitly.

## Work

1. Establish current evidence and, when mutation is authorized, the smallest candidate delta. Use the selected comparison baseline; pre-existing work is not part of that delta.
2. Apply the general authoring method to canonical package sources, not generated projections.
3. Preserve the declared suite's runtime resource closure; maintainer research and candidate evidence must not become installed dependencies.
4. When layout, reachability or repetition matters, use `node scripts/scan-skill-context.mjs --package <canonical-path>` from the repository root. Read [context diagnostics](references/authoring.md#context-diagnostics) for selection and interpretation; scan results are clues, not quality gates.
5. Reuse repository evaluation, security, packaging and behavior checks. Permitted inspection and writing methods may vary within the same goal, scope, authority, baseline and evidence boundary; observations establish no candidate acceptance. Do not duplicate checks in the Skill or substitute diagnostics for named required operations.
6. For tracked work, put the authorized candidate delta and approach in Proposal, Spec and Design; record outcomes, evidence, knowledge-update references and limits in Tasks, Verify and Blockers. Keep the durable-decision summary in the response. A report-only Pre-Change Audit returns findings to Core or the user without writing artifacts.

## Stop and return

Stop a report-only Pre-Change Audit before any artifact mutation or candidate acceptance. For tracked work, stop before accepting a candidate, independent review, Git delivery, archive, push, tag, release, publication, or installation unless the user separately authorizes the owning workflow. Also stop when provenance, license, containment, current behavior, or evidence explicitly required by the selected experiment is unresolved. Author self-checks cannot replace required independent review; recommendations for the next owner grant no authority.

Return: `WorkRef` (`N/A` for report-only Pre-Change Audit), `Mode`, `Target`, `Contract delta`, `Changed artifacts`, `Fresh verification`, `Diagnostics`, `Blockers`, and `Next owner`. Use natural language; include machine-readable output only when another tool consumes it.
