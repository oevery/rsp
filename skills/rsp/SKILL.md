---
name: rsp
description: Use this skill when adopting, operating, auditing, or repairing an RSP project and its .rsp structure.
---

# RSP Skill

Use this skill when you are actively operating on an RSP project: initializing RSP, deciding how to update `AGENTS.md`, adding durable rules/specs, starting or closing features, or auditing the setup.

## Load this skill when

- the user wants to adopt RSP in an existing project
- the user wants to organize project-level design or rules under `.rsp/`
- the user wants to audit or repair RSP structure
- the user wants to start, close, or review an RSP-managed feature

## Decision guide

If the project has no `.rsp/` yet:

1. Run `npx -y @oevery/rsp init`
2. Choose `--agents-mode`:
   - `managed`: the project already uses `AGENTS.md` and should gain a thin managed RSP block
   - `skip`: do not modify `AGENTS.md`
   - `print`: print the managed block for manual or AI-assisted insertion
 3. Create `rsp new project-setup` to capture project bootstrap facts, boundaries, and initial decisions
 4. Fill `features/project-setup.md`
 5. Fill `specs/design.md`
 6. Run `rsp doctor`

If the project already has `.rsp/`:

1. Check `AGENTS.md`
2. Check `active.d/`
3. Check `specs/design.md`
4. If the project still lacks a durable bootstrap feature, create `rsp new project-setup`
5. Run `rsp doctor` before making structural changes when the setup looks inconsistent

## Command-first workflow

Prefer RSP commands over direct file creation when they already cover the target file type:

- `rsp init`
- `rsp add rules <name>`
- `rsp add spec <name>`
- `rsp new <name>`
- `rsp close <name>`
- `rsp specs-index`
- `rsp archive-index`
- `rsp doctor`

Direct file creation is acceptable only when no RSP command covers the target file.

## AGENTS handling

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

Rules:

- preserve content outside the managed block unless explicitly asked to change it
- do not move long-lived project design or rules back into `AGENTS.md`
- keep the managed block thin; use `.rsp/` for durable content

## File placement guide

- `specs/design.md`: project-wide design, boundaries, and durable context
- `rules/project-rules.md`: canonical optional file for stable local validation steps, workflow restrictions, and other long-lived local operating constraints
- `rules/<name>.md`: other durable rule sets
- `specs/<name>.md`: additional durable project-level documents only when they do not duplicate `design.md`
- `features/<name>.md`: active work only
- `archives/`: completed work only, via `rsp close <name>`

## Feature expectations

Every feature file should contain:

- `## Spec`
- `## Plan`
- `## Tests`
- `## Blockers`

Minimal template:

```markdown
---
status: draft
priority: medium
depends-on:
  - <other-feature-name>
tags:
  - backend
---
# Feature: <name>

## Spec
- Summary: <one-line>
- Requirements:
  - <verifiable item>
- Constraints:
  - <binding constraint>

## Plan
- [ ] Phase 1: <name>
  - [ ] <task>

## Tests
- [ ] <test file or scenario>

## Blockers
-
```

## Project setup workflow

Use this when adopting RSP into a repository or when the project lacks a durable bootstrap feature:

1. Create `rsp new project-setup`
2. Capture the project's purpose, boundaries, inputs, outputs, and platform constraints in the feature spec
3. Move durable architecture facts and cross-cutting technical constraints into `.rsp/specs/design.md`
4. Move stable validation rules, workflow constraints, and local operating constraints into `.rsp/rules/project-rules.md` when they are long-lived
5. Keep `project-setup` open until the initial project model is settled, then start normal feature work

## Audit workflow

When auditing an RSP project:

1. Check whether `.rsp/` exists
2. Check whether `AGENTS.md` contains the managed block
3. Check whether `specs/design.md` exists
4. Check whether `specs/INDEX.md` and `archives/INDEX.md` still contain generated signatures
5. Check whether `active.d/` markers and `features/` files are in sync
6. Prefer repairing structure with RSP commands instead of editing generated files manually

## Refresh guidance

- If rules or skill content changed, a new session or explicit reload is the safest way to ensure they are applied.
- `AGENTS.md` can act as an entrypoint, but it does not guarantee live hot-reload in every agent tool.
- If strict adherence matters after changing rules, prefer a fresh session and reread `AGENTS.md` plus `.rsp/rules/*.md`.

## Environment-specific optimization

If RTK is available, prefix RSP commands with `rtk`.

Examples:

- `rtk rsp status`
- `rtk rsp new auth/login`
- `rtk rsp check`
- `rtk rsp archive-index`
- `rtk rsp specs-index`
