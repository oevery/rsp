# RSP: Rules, Specs, Plans

English | [简体中文](./README.zh-CN.md)

RSP = **Rules, Specs, Plans**. A lightweight AI-assisted workflow for project rules, specs, and feature plans.

## Quick start

```bash
npx -y @oevery/rsp init
npx -y @oevery/rsp doctor
```

Recommended bootstrap flow:

```bash
npx -y @oevery/rsp init --with-project-setup
# fill .rsp/features/project-setup.md
# fill .rsp/specs/design.md
npx -y @oevery/rsp doctor
```

## Core idea

- `rules/` stores durable constraints.
- `specs/` stores project-level design docs.
- `features/` stores active work.
- `active.d/` mirrors active features with empty marker files.
- `archives/` stores completed work.

```text
.rsp/
├── rules/
│   ├── rsp-rules.md
│   └── project-rules.md      # optional
├── specs/
│   ├── INDEX.md              # auto-generated
│   └── design.md
├── features/
│   └── <name>.md
├── active.d/
│   └── <name>
└── archives/
    └── INDEX.md              # auto-generated
```

## File ownership

- `AGENTS.md`: only the `<!-- rsp:begin --> ... <!-- rsp:end -->` block is managed by RSP.
- `.rsp/specs/INDEX.md`: auto-generated. Rebuild with `rsp specs-index`.
- `.rsp/archives/INDEX.md`: auto-generated. Rebuild with `rsp archive-index`.
- `.rsp/specs/design.md`: created by `rsp init`, then owned by the project.
- `.rsp/rules/project-rules.md`: optional; create only when the project has durable local rules.
- Keep durable architecture, boundaries, and cross-cutting technical constraints in `.rsp/specs/design.md`.
- Keep stable workflow rules, validation expectations, and local operating constraints in `.rsp/rules/project-rules.md`.

## AGENTS integration

Managed block example:

```md
<!-- rsp:begin -->
## RSP Entry

Read in order:
1. .rsp/rules/*.md
2. .rsp/specs/INDEX.md
3. .rsp/specs/design.md
4. .rsp/active.d/ and matching .rsp/features/*.md
<!-- rsp:end -->
```

`rsp init --agents-mode <mode>`:

- `managed`: insert/update the managed block in `AGENTS.md`.
- `skip`: scaffold `.rsp/` only.
- `print`: scaffold `.rsp/` and print the managed block.

## Skill

Use `skills/rsp/SKILL.md` for step-by-step setup, workflow, and auditing guidance. It is intended for on-demand loading rather than always-on core rules.

Example optional installation flow:

```bash
npx skills add oevery/rsp --skill rsp
```

This repository publishes a skill named `rsp` under `skills/rsp/`.

Then load the installed RSP skill only when you are adopting RSP, auditing setup, or reorganizing project-level rules/specs.

## Recommended workflow

New project:

1. `npx -y @oevery/rsp init`
2. Prefer `npx -y @oevery/rsp init --with-project-setup`, or run `rsp new project-setup` manually
3. Fill `.rsp/specs/design.md`
4. Use `rsp add spec <name>` only when a new durable project doc is needed
5. Use `rsp add rules project-rules` only when the project has stable local rules
6. Start work with `rsp new <name>`

Existing project with a rich `AGENTS.md`:

1. `npx -y @oevery/rsp init --agents-mode managed`
2. Keep the managed block thin
3. Move durable design into `.rsp/specs/design.md`
4. Use `rsp add spec <name>` or `rsp add rules <name>` only when needed

AI-assisted setup:

1. `npx -y @oevery/rsp init --agents-mode print --with-project-setup`
2. Let the AI adapt the managed block in `AGENTS.md`
3. Have the AI review and fill `.rsp/features/project-setup.md`
4. Have the AI fill `.rsp/specs/design.md`
5. Run `rsp doctor`

## CLI

```text
rsp init --agents-mode <mode>   Scaffold .rsp/ + AGENTS.md
rsp init --with-project-setup   Also create .rsp/features/project-setup.md
rsp add rules <name>            Create .rsp/rules/<name>.md
rsp add spec <name>             Create .rsp/specs/<name>.md and rebuild specs index
rsp new <name> [summary]        Create .rsp/features/<name>.md
rsp close <name>                Archive to .rsp/archives/ + update archive index
rsp status [--active|--blocked|--stale <days>]
                                 Show project status summary with optional filters
rsp check                       Validate feature files and dependency consistency
rsp deps [--mermaid|--focus <name>|--reverse <name>]
                                 Show dependency summary, graph, or focused view
rsp doctor                      Check setup health and common issues
rsp specs-index                 Rebuild specs INDEX.md
rsp archive-index               Rebuild archives INDEX.md
```

## Doctor

`rsp doctor` is read-only.

- Checks `.rsp/`, `rules/rsp-rules.md`, `specs/design.md`, `specs/INDEX.md`, `archives/INDEX.md`, and the managed `AGENTS.md` block.
- Verifies generated index signatures.
- Verifies `active.d` markers and `features/` are in sync.
- Exits non-zero when issues are found.

## Platform-agnostic

`.rsp/` is a plain file convention. It works with Kilo Code, Cursor, Claude Code, Cline, GitHub Copilot, or any assistant that reads project files. Requires Node.js 18+.
