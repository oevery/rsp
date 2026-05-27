---
name: rsp-rules
description: Core RSP rules for Rules, Specs, and Plans driven development.
---

# RSP

This file is the canonical RSP rules source.

## Scope

- RSP directory paths such as `changes/`, `focus.d/`, `specs/`, and `rules/` are relative to `.rsp/`; project-root files such as `AGENTS.md` are named explicitly.
- These rules are tool-agnostic and apply even when the agent does not support skills.
- If the agent supports Agent Skills, load the `rsp` skill for initialization, audit or repair, and durable-decision tasks.
- Keep this file compact because it is the always-read canonical truth source; put operational procedure in the RSP skill and explanatory detail in README or design docs.

## Read order

1. Read `AGENTS.md`.
2. Read `.rsp/rules/rsp-rules.md` in full.
3. Read `focus.d/`.
4. If `focus.d/` is empty and the user has not provided a concrete task, ask what to work on or suggest `npx -y @oevery/rsp create <name>` for tracked work.
5. Read each `changes/<name>.md` file marked in `focus.d/`.
6. Read `specs/design.md` and `specs/INDEX.md`.
   `specs/INDEX.md` lists only additional spec files beyond `specs/design.md`.
7. Read only the relevant additional `rules/` and `specs/` files.

## Core rules

- Treat `rules/` as the canonical rules source.
- Treat `focus.d/` as the only current-focus source.
- Treat `changes/` as open work.
- Treat `archives/` as completed history.
- Treat each change as a single `.md` file under `changes/`. Do not create multi-file change bundles or supplementary files alongside a change.
- RSP uses only two lifecycle states: `open` (in `changes/`) and `archived` (in `archives/`). Do not introduce intermediate states such as "in review" or "verified".
- Keep every change file in the fixed six-section structure.
- Prefer an RSP command when it clearly covers deterministic setup, status, validation, repair, index, focus, or archive operations.
- Do not infer current work from `changes/` alone.
- When no focus exists, status and show commands may suggest next actions, but they must not infer current work from open changes.
- Do not treat `AGENTS.md` as the long-term rules or design store.
- Do not redefine the core change structure through project config.

## File ownership

- Manage only the `<!-- rsp:begin --> ... <!-- rsp:end -->` block in `AGENTS.md`.
- Do not modify content outside the managed AGENTS block unless the user explicitly asks for it.
- Do not edit `specs/INDEX.md` or `archives/INDEX.md` manually; use `npx -y @oevery/rsp update`.
- Treat `specs/design.md` as the durable design file. Prefer sections: `Purpose`, `Stable Facts`, `Boundaries`, `Constraints`.
- Treat all `specs/<name>.md` as durable-truth documents. Use the same section structure as `specs/design.md`.
- Treat `rules/project-rules.md` as the durable local-rules file.
- Create `rules/project-rules.md` only when the project has stable local rules worth keeping.
- Create or update `specs/` only for durable project-level facts that are stable, reusable, and worth rereading in later sessions.
- Prefer updating `specs/design.md` or an existing durable file before creating a new spec file.
- Create a new `specs/<name>.md` only when the knowledge forms a distinct durable project topic that does not fit `specs/design.md` or an existing durable file.
- Write stable facts to the smallest correct durable file. Do not duplicate the same fact across multiple durable files without a clear long-term reason.

## Command rules

- Use RSP commands for deterministic setup, status, validation, repair, index, focus, and archive operations.
- Use `rsp create` only for explicitly tracked open work; use `rsp create --lite` only when that tracked work is small and straightforward.
- Use `rsp doctor --fix` only for safe deterministic repairs. Treat `fixed` output entries as actual filesystem changes, not attempted checks.
- If RTK is available, you may prefix RSP commands with `rtk`.
- Do not use `rsp create <name>` to re-focus an existing change.
- Do not create RSP-managed files directly when an RSP command already exists for that file type.

## Change rules

Every change file must contain:

- an explicit `kind` field in frontmatter
- `## Proposal`
- `## Spec`
- `## Design`
- `## Tasks`
- `## Verify`
- `## Blockers`

Do not leave `kind` unresolved.

Do not leave built-in template placeholders or unresolved clarification markers in a change once the details are known. `rsp check` reports these as warnings because they are deterministic hygiene signals, not semantic archive decisions.

If a section does not apply, keep it and write `- none` or `- not needed: <reason>`.

## Archive gate

- `rsp archive <name>` never blocks. It warns but always completes the move.
- `rsp ready` and `rsp show` expose deterministic readiness and advisory durable-review guidance; they never perform spec or rule writeback.
- Make a durable-update decision before archive. Set `Archive ready: no` when real blockers remain or required durable updates are missing.
- Change `Spec` delta markers (`### ADDED`, `### MODIFIED`, `### REMOVED`) are planning aids only and are never auto-merged.
- Durable updates should contain stable facts only. Default to no spec writeback unless future work must reread the fact.

## Prohibitions

- Do not create placeholder or empty-shell files merely for completeness.
- Do not create archive entries directly under `.rsp/archives/`; use `npx -y @oevery/rsp archive <name>`.
- Do not create spec files that duplicate `specs/design.md` or another durable file.
- Do not create a catch-all summary file like `specs/changes.md`.
- Do not create supplementary files alongside a single change file.
- Do not promote archive history, temporary troubleshooting notes, or task-by-task execution logs into `specs/` or `rules/`.
