---
name: rsp-rules
description: RSP rules for Rules, Spec, and Plan driven development.
---

# RSP

RSP = Rules, Specs, Plans.

## Structure

```text
.rsp/
├── rules/                    # technical constraints, long-lived
├── specs/                    # project-level architecture (optional)
├── features/                 # active features
│   ├── <name>.md             # or <domain>/<name>.md for grouping
├── active.d/                 # active feature markers
│   └── <name>                # empty marker file, mirrors features/
├── archive/
│   ├── INDEX.md              # auto-generated index
│   └── YYYY-MM-DD_<name>.md
```

## File roles

- `rules/` — stable technical constraints, coding conventions, architecture decisions. One or more files, split by domain (e.g., `frontend.md`, `api.md`). Do not put business requirements here.
- \`specs/\` — project-level architecture and design reference. Use for cross-cutting concerns, system diagrams, ADRs. Per-feature details go in \`features/\`.
- `features/<name>.md` — a complete feature definition, optionally grouped by domain subdirectory (e.g., `features/auth/login.md`). Contains YAML frontmatter, `## Spec` (what), `## Plan` (how), `## Tests`, and optional `## Notes`.
- `active.d/` — active feature tracking. Mirrors the `features/` directory structure (e.g., `active.d/payments/checkout`). Each file is an empty marker; the file path is the source of truth. All features in `active.d/` are considered active.

## Reading order

1. Read `active.d/` to find active features.
2. If multiple entries exist, ask which to focus on.
3. If empty, ask the user or suggest `rsp new <name>`.
4. Read the referenced `features/<name>.md`.
5. Read `rules/` for technical constraints.
6. Optionally read \`specs/\` for architecture context and \`config.yaml\` for customized statuses/priorities.

## Token optimization

If [RTK (Token Killer)](https://kilo.ai) is available in the environment, prefix all `rsp` commands with `rtk` (e.g. `rtk rsp status`, `rtk rsp new`, `rtk rsp check`, `rtk rsp deps`) to reduce token consumption. RTK is detected by availability in `$PATH`.

## Semantic checkboxes

Use in all checklists (Requirements, Plan, Tests):

- `[ ]` = todo.
- `[/]` = in progress.
- `[-]` = dropped.
- `[x]` = done and verified.
- Use `[/]` to signal active ownership.
- Use `[x]` only after validation.

## Feature file template

```markdown
---
status: draft                # draft | ready | in-progress | blocked | done
priority: medium             # low | medium | high | critical
depends-on:                  # optional: features this depends on
  - <other-feature-name>
tags:                        # optional: categorization
  - backend
---
# Feature: <name>

## Spec
- Summary: <one-line>
- Requirements:
  - [ ] <verifiable item>
- Constraints:
  - <binding constraint>

## Plan
- [ ] Phase 1: <name>
  - [ ] <task>
- [ ] Phase 2: <name>

## Tests
- [ ] <test file or scenario>

## Notes (optional)
- <design decisions discovered during implementation>

## Blockers
-
```

## Evolution rules

- If requirements change during implementation, update `## Spec` explicitly — do not silently diverge.
- If the scope grows beyond the original spec, consider closing the current feature and starting a new one (`close` then `new`).
- Complex features may split into sub-features using subdirectories (`features/parent/child.md`).
- After closing a feature, update or regenerate `archive/INDEX.md` via `rsp archive-index`.

## Parallel features (always on)

All features in `active.d/` are tracked as active by default. Parallelism is inherent:

- `rsp new` always creates an entry in `active.d/`.
- `rsp close` removes the entry from `active.d/`.
- When `active.d/` has a single entry, that is the primary focus. When multiple entries exist, AI should ask the user which to focus on.

## Agent behavior

- Read `active.d/` first. If empty, ask what to work on. Also read `AGENTS.md` for project context.
- **`rsp init`**: scaffold `.rsp/` + `AGENTS.md`. Detects project name from package.json.
  - Post-init: confirm created paths, suggest `rsp new`, `rsp status`, `rsp deps`.
- **`rsp new <name> [summary]`**: create `.rsp/features/<name>.md`. Name is kebab-case, supports subdirectories (`auth/login`). Optional one-line summary.
  - After creation: confirm file exists, confirm `active.d/` marker was created.
- **`rsp close <name>`**: archive to `.rsp/archive/YYYY-MM-DD_<name>.md`. Mirror subdirectory structure in archive.
  - After archive: suggest `git add .rsp/archive/… && git commit`.
  - Runs `rsp check` automatically if the feature had dependents.
- **`rsp check`**: validate feature file integrity (frontmatter, sections, dependencies, cycles).
- **`rsp deps`**: inspect dependency relationships before large refactors.
- **`rsp status`**: view project dashboard at any time.
- For cross-cutting or dependent features, add `depends-on:` in frontmatter.
- Update the feature file as work progresses. Check off tasks and tests.
- Before finishing, confirm code matches `## Spec` and `## Plan` reflects reality.

> **Token tip**: If [RTK](https://kilo.ai) is installed, prefix shell commands with `rtk` (e.g. `rtk rsp status`) to reduce token consumption.
