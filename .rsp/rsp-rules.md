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
- Read focused Changes, only the relevant Specs, and only relevant Decision Records under the configured authoritative path.

## Core

- `changes/` stores open work; `archives/` stores completed history; `specs/` stores stable current facts; the configured Decision Record path stores lasting rationale.
- Every Change is one Markdown file with explicit `kind` and the fixed `Proposal`, `Spec`, `Design`, `Tasks`, `Verify`, and `Blockers` sections.
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
