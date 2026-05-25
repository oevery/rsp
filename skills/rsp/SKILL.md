---
name: rsp
description: Use this skill when adopting, operating, auditing, or repairing an RSP project and its .rsp structure.
---

# RSP Skill

Load this skill when you need to initialize RSP, operate an existing RSP project, audit or repair `.rsp/`, or decide whether a change needs durable updates before archive.

This skill operationalizes the rules in `.rsp/rules/rsp-rules.md`. Always load and follow those rules first.

Prefer exact file paths, exact commands, and exact durable facts over vague summaries.

## Workflow

### Adopt or initialize

1. Use one of these commands:
   - `npx -y @oevery/rsp init --agents-mode managed`
   - `npx -y @oevery/rsp init --agents-mode print`
   - `npx -y @oevery/rsp init --with-project-setup --agents-mode managed`
   - `npx -y @oevery/rsp init --with-project-setup --agents-mode print`
2. If the repository still needs an explicit bootstrap change and you did not use `--with-project-setup`, run `npx -y @oevery/rsp create project-setup`.
3. Fill `changes/project-setup.md`.
4. Set an explicit `kind` in the change frontmatter.
5. Write durable architecture, boundaries, defaults, and constraints into `specs/design.md`.
6. Write stable local workflow or validation rules into `rules/project-rules.md` only when they are long-lived.
7. Run `npx -y @oevery/rsp doctor`.

### Operate an existing project

1. Follow the read order in `.rsp/rules/rsp-rules.md`.
2. If a focused change is missing an explicit `kind`, repair the frontmatter before continuing.
3. If an existing open change should become current work, use `npx -y @oevery/rsp focus <name>`.
4. Do not treat unfocused files in `changes/` as current work unless the user explicitly asks for them or you first run `npx -y @oevery/rsp focus <name>`.

### Audit or repair

1. Check that `.rsp/` exists.
2. Check that `AGENTS.md` contains the managed RSP block.
3. Check that `specs/design.md` exists.
4. Check that `specs/INDEX.md` and `archives/INDEX.md` are still generated files.
   `specs/INDEX.md` should list only additional spec files beyond `specs/design.md`.
5. Check that `focus.d/` markers and `changes/` files are in sync.
6. If generated indices or the managed AGENTS block drift, run `npx -y @oevery/rsp update`.

## Durable decision

Before `npx -y @oevery/rsp archive <name>`:

1. Read the current change.
2. Read only the relevant `specs/` and `rules/` files.
3. Inspect code only if needed.
4. Return exactly one decision:

- `No durable update needed`
- `Update existing spec or rule`
- `Create a new durable spec` only when the knowledge is truly project-level, reusable, and does not fit `specs/design.md`, an existing spec, or a rule file

Write a durable update only when one of these is true:

- the change altered stable system behavior
- the change changed a project boundary, default, or constraint
- future agents or developers would likely make mistakes without the fact
- the fact is worth rereading in later sessions as durable project knowledge

When unsure whether a fact is truly durable, prefer `No durable update needed` over speculative promotion.

Default to no spec writeback unless the change produced project-level durable knowledge that future work must reread.

Do not write these into `specs/` or `rules/`:

- temporary debugging history
- task-by-task execution notes
- one-off implementation context
- archive-only historical detail
- a catch-all summary file like `specs/changes.md`

Choose the smallest correct target:

- project-wide design, boundaries, defaults, and durable context -> `specs/design.md`
- stable local workflow or validation rules -> `rules/project-rules.md`
- another durable rule set -> `rules/<name>.md`
- an additional reusable project-level spec -> `specs/<name>.md`

Prefer `specs/design.md` or an existing durable file before creating a new spec file.

When writing the durable update:

- write stable facts, not narrative history
- prefer concrete facts and boundaries over summaries like "implemented X" or "investigated Y"
- if you cannot identify a concrete durable target or concrete durable facts, do not invent them

Set archive readiness like this:

- If `Blockers` still contains a real blocker, set `Archive ready: no`.
- If a durable update is required but not yet written, set `Archive ready: no`.
- If no durable update is missing and the remaining `Verify` risk is consciously accepted, set `Archive ready: yes`.
- Do not use CLI warning text as a substitute for semantic durable-update judgment.

## Output template

Use this exact format:

```md
## Durable Decision
- Decision: <No durable update needed | Update existing spec or rule | Create a new durable spec>
- Target: <path or N/A>
- Why:
  - <reason>
- Facts to write:
  - <durable fact>
- Archive ready: <yes | no>
```

Minimal example:

```md
## Durable Decision
- Decision: Update existing spec or rule
- Target: .rsp/specs/design.md
- Why:
  - The change introduced a stable default and boundary that future work must follow.
- Facts to write:
  - Default API retries are capped at 3 attempts.
  - Background sync stops retrying after a permanent authentication failure.
- Archive ready: no
```

Rules for the output:

- `Target` must be a concrete file path when the decision is not `No durable update needed`.
- `Facts to write` must contain durable facts, not task history or debugging notes.
- If the decision requires a durable update that is not yet written, `Archive ready` must be `no`.

## Refresh guidance

- After rule or skill changes, prefer a fresh session and reread `AGENTS.md` plus `.rsp/rules/*.md`.
