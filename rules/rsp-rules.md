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

- Choose response language and artifact language independently. Localize human-facing response headings, labels, explanations, and conclusions according to the requested response language, response-specific project instructions, then conversation language. Write artifact prose according to the requested artifact language, artifact-specific project instructions, existing artifact language, then conversation language. Preserve canonical RSP artifact headings, WorkRef values, paths, commands, identifiers, and machine-consumed values. Response-only Continuation and Durable Decision labels are not artifact headings; a technical token may appear in parentheses but cannot replace the localized label.
- `changes/` stores open work; `archives/` stores completed history; `specs/` stores stable current facts; the configured Decision Record path stores lasting rationale.
- Every Change is one Markdown file with explicit `kind` and the fixed `Proposal`, `Spec`, `Design`, `Tasks`, `Verify`, and `Blockers` sections.
- In a Change `Blockers` section, `- requires \`<change-work-ref>\`: <reason>` declares an exact dependency on another executable Change. Other meaningful blocker prose remains external and is never inferred as a dependency.
- Executable Change identities are either `<change>` or `<group>/<change>`. Recursive work paths are unsupported.
- A Change Group is the only composite work shape. Use it only when at least two independently executable direct child Changes share one goal or completion contract.
- `<group>/brief`, physically stored as `<group>/00-brief.md`, owns Goal, Scope, Shared Constraints, Slices, Completion Conditions, Durable Outcomes, and Blockers. Every direct child must be declared by `Slices`, and every declared slice must be open or archived.
- A Group Brief is not executable or focusable. Read it before a grouped child, archive children independently, and use `rsp group close <group>` only after derived completion passes. Archived Group identities cannot be reopened.
- A file and directory cannot claim the same work identity.
- `changes/` must exist as a real directory. Existing `focus.d/`, `archives/`, and direct group prefixes must also be real directories; symlinks, missing open-work roots, and incomplete inspection fail closed.
- Initialization, repair, status inspection, Spec creation, and index generation use the same no-follow managed-path rules; recursive Specs may use only real directories and regular files.
- Final managed files, including the project `AGENTS.md`, focus markers, fallback/config files, indexes, and placeholders, must be regular files rather than symlinks or special entries.
- `status`, `check`, and `doctor` share work-tree, Change Group, and dependency inspection. They fail visibly on unsupported structure, membership mismatches, malformed or missing dependency targets, self-dependencies, and cycles. With no focus, status uses Group Brief declaration order and derived blockers to recommend the first executable slice.
- `status` derives dependency edges with their reasons, ready Changes, blockers, and stable execution waves from exact blocker references. Archived prerequisites resolve automatically; incomplete dependency or archive inspection fails closed and marks open Changes blocked for readiness; no graph file or delivery state is persisted; and Group Briefs are not dependency targets.
- Parallel Changes in one Group follow the Brief `Slices` declaration order in plan output; unrelated work uses stable lexical ordering.
- A Group Brief blocker is inherited by its direct child Changes as an external blocker; it does not create inferred dependency edges.
- Persist only `open` and `archived`; readiness, blockers, verification, and next actions are derived.
- Route one isolated domain, module/seam, or evidence-seeking design question to `rsp-design` when available, or use a compact manual design pass. Return evidence, alternatives, owner decisions, and any authorized planned-design update to the same selected Change; do not implement or write durable current truth from that pass.
- Route release documentation only when the selected Change explicitly owns a confirmed release identity or range and still has unfinished changelog, release-note, or migration work. Select `rsp-release-docs` when available, or use the same evidence-led manual fallback; lifecycle stage, completed implementation, and archive readiness alone are insufficient. This route never grants commit, tag, push, release creation, publication, deployment, or approval authority.
- Do not infer current work from open Changes or filenames.
- Prefer RSP commands for deterministic setup, status, validation, repair, focus, index, and archive operations.

## Durable review

- Route artifacts by semantic owner: planned future design stays in the selected Change; implemented stable current facts go to the smallest authoritative Spec or, with explicit authority, project-owned context/instructions; lasting rationale is judged independently for the configured Decision Record path; temporary continuation stays in the response unless a path is explicitly authorized.
- Project-owned `CONTEXT.md` owns stable navigation or scoped current context, while project-owned `AGENTS.md` owns stable operating instructions. Preserve their conventions and never treat RSP as their owner.
- Before archive, decide independently whether current facts need a Spec or scoped-instruction update and whether lasting rationale needs a Decision Record.
- Decision Records are for hard-to-reverse choices with real tradeoffs; they do not duplicate current facts.
- Change Spec deltas are planning aids and are never promoted automatically into Specs or Decision Records.
- Keep task history, debugging notes, and transient execution state out of Specs and Decision Records.
- Generated indexes and archives are not current-truth owners.

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
