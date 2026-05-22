# RSP

RSP (Rules, Spec, Plan) — a lightweight AI-assisted development workflow.

AI behavior for this project is defined in `.rsp/rules/rsp-rules.md`. Read that file first for the full workflow, agent behavior, and tree format.

## Key directories

- `.rsp/rules/` — technical constraints and coding conventions
- `.rsp/features/` — feature definitions (spec + plan + tests)
- `.rsp/active.d/` — currently active features (path = feature name)
- `.rsp/archive/` — completed features

## Quick commands

- `rsp init` — scaffold or update `.rsp/` + `AGENTS.md`
- `rsp new <name> [summary]` — start a new feature
- `rsp close <name>` — archive a completed feature
- `rsp status` — view project dashboard
- `rsp check` — validate feature files
