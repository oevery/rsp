# RSP: Rules, Specs, Plans

English | [简体中文](./README.zh-CN.md)

RSP = **Rules, Specs, Plans**. A lightweight AI-assisted workflow for durable project knowledge and single-file change tracking.

## Quick start

```bash
npx -y @oevery/rsp init
npx -y @oevery/rsp doctor
```

Recommended bootstrap flow:

```bash
npx -y @oevery/rsp init --with-project-setup
# fill .rsp/changes/project-setup.md
# fill .rsp/specs/design.md
npx -y @oevery/rsp doctor
```

## Core idea

- `rules/` stores durable constraints.
- `specs/` stores project-level source-of-truth docs.
- `changes/` stores open work in a single-file format.
- `focus.d/` mirrors current focused changes with empty marker files.
- `archives/` stores completed work.

```text
.rsp/
├── rules/
│   ├── rsp-rules.md
│   └── project-rules.md      # optional
├── specs/
│   ├── INDEX.md              # auto-generated
│   └── design.md
├── changes/
│   └── <name>.md
├── focus.d/
│   └── <name>
└── archives/
    └── INDEX.md              # auto-generated
```

## Concepts

- `specs/` describes durable project facts and current agreed design.
- `changes/` captures open work, including features, fixes, refactors, docs, ops, and research.
- A change is always a single Markdown file with explicit sections for proposal, spec, design, tasks, verification, and blockers.
- Completed changes move to `archives/`, while durable outcomes should be reflected in `specs/` or `rules/` before archiving.
- Durable outcomes mean stable facts only. Do not promote task history, debugging notes, or one-off implementation context into `specs/` or `rules/`.
- Change `Spec` delta markers (`### ADDED`, `### MODIFIED`, `### REMOVED`) are planning aids only. `rsp archive` does not automatically merge them into durable specs or rules. Durable writeback remains an explicit semantic decision.
- `rsp check` performs deterministic hygiene checks. It warns about unfinished template placeholders and unresolved clarification markers, but those warnings do not replace the semantic durable-update decision.

## File ownership

- `AGENTS.md`: only the `<!-- rsp:begin --> ... <!-- rsp:end -->` block is managed by RSP.
- `.rsp/specs/INDEX.md`: auto-generated index of additional spec files beyond `design.md`. Rebuild with `rsp update`.
- `.rsp/archives/INDEX.md`: auto-generated. Rebuild with `rsp update`.
- `.rsp/specs/design.md`: created by `rsp init`, then owned by the project.
- `.rsp/rules/project-rules.md`: optional; create only when the project has durable local rules.
- Keep durable architecture, boundaries, and cross-cutting technical constraints in `.rsp/specs/design.md`.
- Treat `.rsp/specs/INDEX.md` as a directory for additional spec files; it does not list `design.md`.
- Keep stable workflow rules, validation expectations, and local operating constraints in `.rsp/rules/project-rules.md`.

## AGENTS integration

Managed block example:

```md
<!-- rsp:begin -->
## RSP Entry

RSP keeps durable rules, specs, and current work under `.rsp/`.
Treat AGENTS.md as navigation only; keep durable rules and design in `.rsp/`.

Read in order:
1. .rsp/rules/rsp-rules.md
2. .rsp/focus.d/
3. matching .rsp/changes/*.md for the focused entries
4. .rsp/specs/design.md
5. .rsp/specs/INDEX.md
6. only the relevant additional .rsp/rules/*.md and .rsp/specs/*.md files

If `.rsp/focus.d/` is empty, ask what to work on or suggest `npx -y @oevery/rsp create <name>`.
If your agent supports Agent Skills, load `rsp` for setup, repair, and durable-decision tasks.
<!-- rsp:end -->
```

`rsp init --agents-mode <mode>`:

- `managed`: create `AGENTS.md` when needed and insert/update the managed block.
- `print`: initialize normally and also print the resulting `AGENTS.md` content.

## Skill

Use `skills/rsp/SKILL.md` for step-by-step setup, workflow, and auditing guidance. It is intended for on-demand loading rather than always-on core rules.

Reading guidance:

- `README.md`: human-oriented overview and examples
- `.rsp/rules/rsp-rules.md`: canonical rules source
- `skills/rsp/SKILL.md`: operational guide for applying those rules with an agent

Surface matrix:

| Surface | Primary audience | Role |
|---|---|---|
| `README.md` | Humans | Overview, onboarding, examples |
| `.rsp/rules/rsp-rules.md` | Agents | Canonical normative rules source |
| `skills/rsp/SKILL.md` | Agents | Operational guide for applying the rules |
| `AGENTS.md` | Humans and agents | Navigation entrypoint into the right files |

Humans should usually start with `README.md`; agents should treat `.rsp/rules/rsp-rules.md` as normative.

When this README shows `rsp <command>`, it assumes the command is already available in your environment. Otherwise use `npx -y @oevery/rsp <command>`.

Example optional installation flow:

```bash
npx skills add oevery/rsp
```

This repository publishes a skill named `rsp` under `skills/rsp/`.

`rsp update` refreshes project-local RSP files only. If you use the published RSP skill, refresh it separately after upgrading:

```bash
npx skills add oevery/rsp
```

## Work Model

```text
open → archived
```

Directory roles are intentionally single-purpose:

- `changes/`: open changes
- `focus.d/`: currently focused changes
- `archives/`: completed history

Inside `open`, typical work includes:

- `create`: create and scope a change.
- `focus` / `unfocus`: decide which open change is currently foregrounded.
- Edit the change file directly — fill sections, mark tasks, write design decisions.
- Review whether durable updates are needed before archive.

`archive` moves completed work into history. Archive never blocks — it warns but leaves the final decision to the agent or human.

Agents should treat only entries in `focus.d/` as current work. Unfocused files in `changes/` are still open, but should not be treated as the current target unless the user explicitly asks for them or they are re-focused.

The durable update decision (whether the change produced knowledge that belongs in `.rsp/specs/` or `.rsp/rules/`) is a semantic choice made by the RSP skill or a human reviewer.

`rsp ready` and `rsp show` expose both deterministic readiness and semantic-review signals. Deterministic readiness comes from checkboxes, blockers, and scenarios; semantic review remains required for durable-update decisions.

## Recommended workflow

New project:

1. `npx -y @oevery/rsp init`
2. Prefer `npx -y @oevery/rsp init --with-project-setup`, or run `rsp create project-setup` manually
3. Fill `.rsp/specs/design.md`
4. Use `rsp add spec <name>` only when a new durable project doc is needed
5. Use `rsp add rules project-rules` only when the project has stable local rules
6. Start work with `rsp create <name>`
7. If you want an existing open change to become current work, use `rsp focus <name>`
8. Use `rsp unfocus <name>` when you want to remove a change from the current focus set
9. Edit the change file directly to implement the work and mark tasks complete
10. Use the RSP skill or a human review to decide whether durable updates are needed
11. Finish with `rsp archive <name>`

Existing project with a rich `AGENTS.md`:

1. `npx -y @oevery/rsp init`
2. Keep the managed block thin
3. Move durable design into `.rsp/specs/design.md`
4. Use `rsp add spec <name>` or `rsp add rules <name>` only when needed

AI-assisted setup:

1. `npx -y @oevery/rsp init --agents-mode print --with-project-setup`
2. Keep the managed block as generated and adapt only the surrounding human-owned content if needed
3. Have the AI review and fill `.rsp/changes/project-setup.md`
4. Have the AI fill `.rsp/specs/design.md`
5. Run `rsp doctor`

## CLI

```text
rsp init --agents-mode <mode>   Scaffold .rsp/ and ensure AGENTS.md contains the RSP entry block
rsp init --with-project-setup   Also create .rsp/changes/project-setup.md
rsp update                      Refresh rules, repair the AGENTS block, and rebuild indices after upgrade
rsp add rules <name>            Create .rsp/rules/<name>.md
rsp add spec <name>             Create .rsp/specs/<name>.md and rebuild specs index
rsp create <name> [summary]     Create .rsp/changes/<name>.md
rsp focus <name>                Mark an open change as currently focused
rsp unfocus <name>              Remove an open change from the current focus set
rsp archive <name>              Archive to .rsp/archives/ + update archive index
rsp archive --dry-run <name>    Preview archive readiness without moving the change
rsp ready <name> [--json] [--verbose]
                                  Preview archive readiness (same as archive --dry-run)
rsp show <name|--focused> [--json] [--verbose]
                                  Show change context with readiness signals and context paths
rsp status [--focused|--blocked|--stale <days>] [--json] [--verbose]
                                  Show project status summary with focus-aware filters
rsp check [--focused] [--json] [--verbose]
                                  Validate change files and lightly lint template/scenario structure
rsp doctor [--json] [--verbose]
                                  Check setup health and common issues
```

For exact rules, use `.rsp/rules/rsp-rules.md`. For operational durable-decision guidance, use `skills/rsp/SKILL.md`.

## Platform-agnostic

`.rsp/` is a plain file convention. It works with Kilo Code, Cursor, Claude Code, Cline, GitHub Copilot, or any assistant that reads project files. Requires Node.js 18+.
