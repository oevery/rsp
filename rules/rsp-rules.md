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

- `changes/` stores open work; `archives/` stores completed history; `specs/` stores stable current facts; the configured Decision Record path stores lasting rationale.
- Every Change is one Markdown file with explicit `kind` and the fixed `Proposal`, `Spec`, `Design`, `Tasks`, `Verify`, and `Blockers` sections.
- Executable Change identities are either `<change>` or `<group>/<change>`. Recursive work paths are unsupported.
- A Change Group is the only composite work shape. Use it only when at least two independently executable direct child Changes share one goal or completion contract.
- `<group>/brief` owns Goal, Scope, Shared Constraints, Slices, Completion Conditions, Durable Outcomes, and Blockers. Every direct child must be declared by `Slices`, and every declared slice must be open or archived.
- A Group Brief is not executable or focusable. Read it before a grouped child, archive children independently, and use `rsp group close <group>` only after derived completion passes. Archived Group identities cannot be reopened.
- A file and directory cannot claim the same work identity.
- `changes/` must exist as a real directory. Existing `focus.d/`, `archives/`, and direct group prefixes must also be real directories; symlinks, missing open-work roots, and incomplete inspection fail closed.
- Initialization, repair, status inspection, Spec creation, and index generation use the same no-follow managed-path rules; recursive Specs may use only real directories and regular files.
- Final managed files, including the project `AGENTS.md`, focus markers, fallback/config files, indexes, and placeholders, must be regular files rather than symlinks or special entries.
- `status`, `check`, and `doctor` share work-tree and Change Group inspection and fail visibly on unsupported structure or membership mismatches.
- Persist only `open` and `archived`; readiness, blockers, verification, and next actions are derived.
- Do not infer current work from open Changes or filenames.
- Prefer RSP commands for deterministic setup, status, validation, repair, focus, index, and archive operations.

## Durable review

- Before archive, decide independently whether current facts need a Spec or scoped-instruction update and whether lasting rationale needs a Decision Record.
- Decision Records are for hard-to-reverse choices with real tradeoffs; they do not duplicate current facts.
- Change Spec deltas are planning aids and are never promoted automatically into Specs or Decision Records.
- Keep task history, debugging notes, and transient execution state out of Specs and Decision Records.
- Generated indexes and archives are not current-truth owners.

## Safety

- Do not create RSP-managed files directly when a command owns the operation.
- Do not create archive entries directly; use `npx -y @oevery/rsp archive <name>`.
- Do not modify content outside the managed RSP block in `AGENTS.md` unless explicitly requested.
- Archive reports warnings but does not grant commit, push, publication, deletion, or external approval authority.
