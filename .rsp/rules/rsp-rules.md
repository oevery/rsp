---
name: rsp-rules
description: Core RSP rules for Rules, Specs, and Plans driven development.
---

# RSP

This file is the canonical RSP rules source.

## Scope

- Paths in this file are relative to the project root unless stated otherwise.
- These rules are tool-agnostic and apply even when the agent does not support skills.
- If the agent supports Agent Skills, load the `rsp` skill for initialization, audit or repair, and durable-decision tasks.

## Read order

1. Read `AGENTS.md`.
2. Read `.rsp/rules/rsp-rules.md` in full.
3. Read `focus.d/`.
4. If `focus.d/` is empty, ask the user what to work on or suggest `npx -y @oevery/rsp create <name>`.
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
- Use an RSP command first when an RSP command already covers the action.
- Do not infer current work from `changes/` alone.
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

- Use `npx -y @oevery/rsp init` to scaffold the base RSP structure.
- Use `npx -y @oevery/rsp add rules <name>` to create a durable rules file.
- Use `npx -y @oevery/rsp add spec <name>` to create a durable spec file.
- Use `npx -y @oevery/rsp create <name>` to create an open change.
- Use `npx -y @oevery/rsp create <name> --lite` only for small, straightforward changes; the six required sections still apply.
- Use `npx -y @oevery/rsp focus <name>` to foreground an existing open change.
- Use `npx -y @oevery/rsp unfocus <name>` to remove an open change from the current focus set.
- Use `npx -y @oevery/rsp archive <name>` to archive a completed change.
- Use `npx -y @oevery/rsp archive --dry-run <name>` or `rsp ready <name>` to preview archive readiness without moving files.
- Use `npx -y @oevery/rsp show <name|--focused> --json` for machine-readable change context and readiness signals.
- Use `npx -y @oevery/rsp check [--focused]` to validate change structure and surface deterministic hygiene warnings such as unfinished template placeholders or unresolved clarification markers.
- Use `npx -y @oevery/rsp update` to refresh bundled rules, repair the managed `AGENTS.md` block, and rebuild generated indices.
- Use `npx -y @oevery/rsp doctor` for diagnostics only.
- Use `npx -y @oevery/rsp doctor --fix` only for safe deterministic repairs such as refreshing bundled rules, repairing the managed AGENTS block, and rebuilding generated indices.
- If RTK is available, you may prefix RSP commands with `rtk`.
- Do not use `npx -y @oevery/rsp create <name>` to re-focus an existing change.
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
- `rsp ready` and `rsp show` readiness fields separate deterministic signals from semantic review. Deterministic readiness does not replace durable-update judgment.
- `rsp ready --json` and `rsp show --json` may include durable-review guidance, but it is advisory only and never performs spec or rule writeback.
- Make a durable-update decision before `npx -y @oevery/rsp archive <name>`.
- Change `Spec` delta markers (`### ADDED`, `### MODIFIED`, `### REMOVED`) are planning aids only. `rsp archive` does not automatically merge them into `.rsp/specs/` or `.rsp/rules/`.
- If `Blockers` still contains a real blocker, set `Archive ready: no`.
- If the change produced durable knowledge that has not been written to `specs/` or `rules/`, set `Archive ready: no`.
- If `Verify` is incomplete but there is no active blocker and no missing durable update, treat archive readiness as a judgment call.
- A durable update should contain stable facts only, not task history, debugging notes, or one-off implementation context.
- Default to no spec writeback unless the change produced project-level durable knowledge that future work must reread.

## Prohibitions

- Do not create placeholder or empty-shell files merely for completeness.
- Do not create archive entries directly under `.rsp/archives/`; use `npx -y @oevery/rsp archive <name>`.
- Do not create spec files that duplicate `specs/design.md` or another durable file.
- Do not create a catch-all summary file like `specs/changes.md`.
- Do not create supplementary files alongside a single change file.
- Do not promote archive history, temporary troubleshooting notes, or task-by-task execution logs into `specs/` or `rules/`.
