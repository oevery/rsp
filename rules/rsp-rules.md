---
name: rsp-rules
description: Minimal fallback protocol for Rules, Specs, and Plans driven development.
---

# RSP fallback protocol

This file is the minimal fallback protocol for agents that cannot load the `rsp` skill. It is not the project instruction or design store.

## Entry

- Read nearest `AGENTS.md` and relevant `CONTEXT.md` before RSP work. Use root `CONTEXT-MAP.md` when present.
- Prefer the `rsp` skill for setup, focused work, readiness, repair, and durable review.
- If the `rsp` skill is unavailable, read this file before operating `.rsp/`.
- Treat `focus.d/` as the only current-focus source.
- If `focus.d/` is empty and the user has not provided a concrete task, ask what to work on or suggest `npx -y @oevery/rsp create <name>`.
- For grouped work, read the sibling Group Brief before the focused child Change. Then read only the relevant Specs and Decision Records under the configured authoritative path.

## Core

- Choose response language and artifact language independently. Localize response prose from the explicit request, scoped instructions, then conversation language; write authorized artifacts from the explicit request, scoped instructions, existing artifact language, then conversation language. Preserve canonical headings, WorkRefs, paths, commands, identifiers, and machine values.
- Write persistent artifact prose in domain, system, user, or operator language. Mention AI or agents only when they are real product actors, consumers, interface participants, or constraints; agent authorship, execution narration, or convenience for a hypothetical future agent is not durable content.
- `changes/` stores open work; `archives/` stores completed history; `specs/` stores stable current facts; the configured Decision Record path stores lasting rationale.
- Every Change is one Markdown file with explicit `kind` and the fixed `Proposal`, `Spec`, `Design`, `Tasks`, `Verify`, and `Blockers` sections.
- A Change is a convergent current-plan and final-evidence snapshot, not an append-only execution log. Keep Tasks aligned with current delivery and Verify limited to final decisive commands or scenarios, results, proven scope, omitted or unavailable coverage, and remaining risk. Replace superseded plans and evidence; retain an earlier failure only when it still explains a current blocker, coverage gap, or risk.
- In a Change `Blockers` section, `- requires \`<change-work-ref>\`: <reason>` declares an exact dependency on another executable Change. Other meaningful blocker prose remains external and is never inferred as a dependency.
- Executable Change identities are either `<change>` or `<group>/<change>`. Recursive work paths are unsupported.
- A Change Group is the only composite shape and requires at least two independent direct children. Its non-executable, non-focusable `<group>/brief` at `<group>/00-brief.md` owns shared scope, constraints, declared Slices, completion, durable outcomes, and blockers. Read it before a child; archive children independently and close only a derived-complete Group.
- A file and directory cannot claim the same work identity.
- Managed roots, Group prefixes, recursive Spec paths, and final managed files must be real directories or regular files as applicable. Initialization, repair, inspection, Spec-index work, and mutations use shared no-follow checks; symlinks, special entries, missing roots, and incomplete inspection fail closed.
- `status`, `check`, and `doctor` share work-tree, Change Group, and dependency inspection. They fail visibly on unsupported structure, membership mismatches, malformed or missing dependency targets, self-dependencies, and cycles. With no focus, status uses Group Brief declaration order and derived blockers to recommend the first executable slice.
- `status` derives blockers, exact edges and reasons, ready Changes, and stable waves without persisted graph or delivery state. Filtered views retain prerequisite context. Archived prerequisites resolve; invalid or incompletely inspected graphs fail closed.
- Parallel Changes in one Group follow the Brief `Slices` declaration order in plan output; unrelated work uses stable lexical ordering.
- A Group Brief blocker is inherited by its direct child Changes as an external blocker; it does not create inferred dependency edges.
- Persist only `open` and `archived`; readiness, blockers, verification, and next actions are derived.
- Ordinary implementation is the default after unexplained failures are ruled out. Use test-first only when authority requires it or a concrete risk makes pre-mutation failure materially safer. Retain a new test only when it protects observable behavior or a real boundary with distinct proportionate value; otherwise remove the temporary probe and use decisive final verification.
- This fallback does not emulate `rsp-manage`, even when project configuration selects automatic activation or local closeout. Invalid configuration grants nothing and remains visible. For an explicit managed request or an automatically eligible completion/continuation, resolve the smallest owner using ordinary Core rules: reuse one unambiguous selected ready Change, send tiny settled work direct without a synthetic Change, and shape only independently authorized planning artifacts for clear non-trivial work. Configuration grants no planning or product-mutation authority. Stop for material product, acceptance, interface, scope, mutation, or external-action decisions. Perform at most one ordinary Core or Discipline action, return its WorkRef and next action, and never dispatch, auto-continue successors, loop review corrections, archive, stage, commit, push, or persist controller state. Load the `rsp` and `rsp-manage` Skills when controller behavior is required.
- Route one explicit isolated domain, module/seam, or evidence-seeking question to `rsp-design` when available, or use a compact manual design pass. Without a selected Change, use report-only Pre-Change Design without inventing a WorkRef only when the question is already bounded; when outcome, scope, non-goals, acceptance, or decomposition remains materially unclear, route to Shape. With a selected Change, return evidence, alternatives, owner decisions, and any authorized planned-design update to the same WorkRef. Do not implement or write durable current truth from either mode.
- Route release documentation only for an explicit release operation with a confirmed identity or range and unfinished surfaces; no Release Change is required. Confirm identity only from explicit instruction or authoritative configuration. Until then stay version-neutral and do not mutate versioned surfaces. Keep ledgers transient; use an optional Release Change only for material decisions, coordination, recovery, blockers, or acceptance. This route grants no Git, publication, deployment, or approval authority.
- Do not infer current work from open Changes or filenames.
- Prefer RSP commands for deterministic setup, status, validation, repair, focus, Specs-index, history, and archive operations.

## Durable review

- Route artifacts by semantic owner: planned future design stays in the selected Change; implemented stable current facts go to the smallest authoritative Spec or, with explicit authority, project-owned context/instructions; lasting rationale is judged independently for the configured Decision Record path; temporary continuation stays in the response unless a path is explicitly authorized.
- Project-owned `CONTEXT.md` owns stable navigation or scoped current context, while project-owned `AGENTS.md` owns stable operating instructions. Preserve their conventions and never treat RSP as their owner.
- Before archive, decide independently whether current facts need a Spec or scoped-instruction update and whether lasting rationale needs a Decision Record.
- Before archive, compress the Change to its final outcome, current design, completed delivery tasks, final decisive verification, and unresolved risks. Keep RED/GREEN/REFACTOR cycles, temporary probes, command transcripts, and step-by-step review corrections in the response instead of the Change or Archive.
- After required durable updates, Core recommends explicit archive before final Git delivery. Ordinary work requires separate Git and release authority; fallback Core never executes archive, stage, commit, push, or publication.
- When loaded Core or qualified Manage has already derived one authorized RSP-owned commit boundary, prefer the `rsp-commit` Skill for exact staging, repository-consistent structured message construction, one local commit, and complete post-commit observation. If that Skill alone is unavailable, loaded Core may provide its equivalent bounded manual action against the same owner; this minimal fallback still grants and executes no Git action.
- Decision Records are for hard-to-reverse choices with real tradeoffs; they do not duplicate current facts.
- Change Spec deltas are planning aids and are never promoted automatically into Specs or Decision Records.
- Keep task history, debugging notes, and transient execution state out of Specs and Decision Records.
- Generated local Specs `00-index.md` files and archives are not current-truth owners. Use each index only to discover direct child Specs and child Spec directories; authoritative Archive Markdown is queried directly without a generated Archive Index.

## Continuation and conflicts

- When execution stops with accepted work remaining, return one compact continuation with the semantic fields `WorkRef`, `Authority`, `Current state`, `Changed artifacts`, `Fresh verification`, `Blockers`, and `Next action`. Keep this field order, but localize the human-facing title and labels to the response language without changing referenced artifact prose or canonical technical values. Reopen its authority pointers, inspect drift, and refresh verification before resuming; it is not durable truth or a second state store.
- Write a continuation file only when explicitly authorized. Never persist hidden handoff or controller state.
- If an active merge, rebase, or cherry-pick conflict intersects authorized implementation, inspect the exact operation and conflicted paths, then compare base/ours/theirs semantics in that operation. Resolve only evidenced in-scope content while preserving unrelated work.
- Stop on unrelated user work, an unresolved product decision, incomplete side/base evidence, or scope beyond the WorkRef. Name the exact conflict and required owner input; do not choose a side, stage a resolution, continue or abort the Git operation, commit, or infer any Git authority.
- After an authorized working-tree resolution, rerun affected checks and return the continuation. Conflict-resolution authority alone does not grant Git continuation or delivery.

## Safety

- Do not create RSP-managed files directly when a command owns the operation.
- Do not create archive entries directly; use `npx -y @oevery/rsp archive <name>`.
- Do not modify content outside the managed RSP block in `AGENTS.md` unless explicitly requested.
- Archive reports warnings but does not grant commit, push, publication, deletion, or external approval authority.
