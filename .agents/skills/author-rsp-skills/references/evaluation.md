# Evaluation

Use evidence proportional to the candidate's behavioral risk. Structure-only edits may need deterministic validation; routing, authority, procedure, or output changes need behavior comparison.

## Compose existing owners

1. Validate package metadata and resource paths with the host validator and repository contract tests.
2. Run `scripts/skill-security-preflight.mjs` when scripts, permissions, egress, dependencies, MCP metadata, or release candidacy make security relevant.
3. Use `scripts/skill-candidate-evaluation.mjs` for current-versus-candidate behavior. Do not create a second receipt schema.
4. Keep Trigger, Compliance, Boundary, and task result separate. Record nullable corrections, first-fix result, worker dispatches, tool calls, elapsed time, and tokens as observations, not inferred facts.
5. Use exact text assertions only for stable protocol values, paths, enums, or critical denials. For replaceable prose, assert semantic units, headings, links, ownership, and forbidden authority, then add a representative negative mutation that weakens a route, owner, stop, or denial and must fail.

## Candidate comparison

- Bind current and candidate to exact identities and the same acceptance contract.
- Use one to three unseen cases when behavior changes: a positive task, a close negative or collision case when routing matters, and a pressure case when authority matters.
- Fail closed on missing dimensions or identity mismatches. A task success cannot waive a trigger, compliance, or boundary failure.
- Prefer the candidate only when required dimensions do not regress. Cost improvements may support a decision but never replace behavioral evidence.

Evaluation produces evidence, not promotion authority. Independent review, acceptance, Git delivery, and publication remain separate actions.
