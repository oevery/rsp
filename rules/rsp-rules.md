---
name: rsp-rules
description: Core RSP rules for Rules, Specs, and Plans driven development.
---

# RSP

RSP = Rules, Specs, Plans.

## Core structure

```text
.rsp/
├── rules/
├── specs/
├── features/
├── active.d/
├── archives/
└── config.yaml
```

## Managed boundaries

- `AGENTS.md` is partially managed. RSP owns only the `<!-- rsp:begin --> ... <!-- rsp:end -->` block.
- `specs/INDEX.md` is auto-generated. Rebuild it with `rsp specs-index` instead of editing it manually.
- `archives/INDEX.md` is auto-generated. Rebuild it with `rsp archive-index` instead of editing it manually.
- `design.md` is created by `rsp init` and then owned by the project.
- `project-rules.md` is optional.
- Keep durable architecture, boundaries, and cross-cutting technical constraints in `specs/design.md`.
- Keep stable workflow rules, validation expectations, and local operating constraints in `rules/project-rules.md`.

## Reading order

1. Read `AGENTS.md` for entrypoint guidance.
2. Read `active.d/` to find active features.
3. If `active.d/` is empty, ask the user what to work on or suggest `npx -y @oevery/rsp new <name>`.
4. Read the referenced `features/<name>.md`.
5. Read `rules/` for technical constraints.
6. Read `specs/design.md` and other project-level specs only when relevant to the current task.

## File creation rules

- `specs/design.md`: create by default with `rsp init`.
- `rules/project-rules.md`: create only when the project has durable local rules worth preserving.
- `rules/<name>.md`: create only for other durable rule sets.
- `specs/<name>.md`: create only when the new document has durable project-level value and does not duplicate `design.md`.
- `features/<name>.md`: create only for active work that should be tracked as a feature.
- Do not create files merely for completeness.

## Command-first creation

- Prefer RSP commands over direct file creation when creating new RSP-managed files.
- Use `rsp init` to scaffold the base RSP structure.
- Use `rsp add rules <name>` to create new durable rules files under `rules/`.
- Use `rsp add spec <name>` to create new durable project-level spec files under `specs/`.
- Use `rsp new <name>` to create new feature files under `features/`.
- Use `rsp close <name>` to move completed work into `archives/`.
- Direct file creation is acceptable only when no RSP command covers the target file.
- After a file is created by command, edit its contents in place as needed.

## Feature requirements

Every feature file should contain these sections:

- `## Spec`
- `## Plan`
- `## Tests`
- `## Blockers`

## Init constraints

- `rsp init` scaffolds project structure only. It must not create a feature file.
- `rsp init` should create `features/`, `active.d/`, `archives/`, and `specs/design.md` up front.
- `rsp init --agents-mode managed|skip|print` controls whether `AGENTS.md` is updated, skipped, or printed.
- `managed` should update only the managed AGENTS block.
- `skip` should leave `AGENTS.md` untouched.
- `print` should scaffold `.rsp/` and print the managed AGENTS block without writing it.

## Agent behavior

- Read `active.d/` first.
- Treat `AGENTS.md` as a navigation layer, not the long-term knowledge base.
- Preserve content outside the managed AGENTS block unless explicitly asked to change it.
- Keep project-wide design and durable context in `specs/design.md`.
- Keep stable local rules in `rules/project-rules.md` or another durable rules file only when needed.
- Use `rsp add rules project-rules` for the canonical optional project rules file.
- Do not push long-lived project knowledge back into `AGENTS.md`.
- `rsp doctor` is diagnostic only and must not mutate project files.

## Prohibitions

- Do not manually maintain `specs/INDEX.md` or `archives/INDEX.md`.
- Do not create `project-rules.md` by default when the project has no durable local rules.
- Do not use `AGENTS.md` as the long-term storage location for project design or rules.
- Do not create `specs` files that duplicate information already stored in `design.md` or durable rules files.
- Do not create placeholder or empty-shell files merely for completeness.
- Do not create new files under `.rsp/rules/`, `.rsp/specs/`, or `.rsp/features/` directly when an RSP command already exists for that file type.
- Do not create archive entries directly under `.rsp/archives/`; use `rsp close <name>`.
