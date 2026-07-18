---
name: rsp
description: Use this skill when initializing RSP, operating an existing .rsp project, auditing or repairing .rsp state, or deciding whether a change needs durable updates before archive.
license: MIT
metadata:
  author: oevery
  version: "2026.07.18.1"
---

# RSP Skill

Load this skill when you need to initialize RSP, operate `.rsp/`, audit or repair RSP state, or make a durable-update decision before archive.

This skill is the preferred operational guide. `.rsp/rsp-rules.md` is the only runtime fallback protocol when this skill is unavailable; old projects migrate to it with `rsp update`.

Prefer exact file paths, exact commands, and exact durable facts over vague summaries.

## When to use

- Use for RSP setup, repair, focused RSP work, and pre-archive durable decisions.
- Use when a user explicitly asks to adopt, inspect, or operate the RSP workflow.

## When not to use

- Do not load for general coding tasks unrelated to `.rsp/`.
- Do not load when the repository does not use RSP and the user did not ask to adopt it.
- Do not create an RSP change for a simple current-session task unless the user explicitly wants RSP tracking.
- Do not treat this skill or the fallback protocol as a replacement for nearest project `AGENTS.md` instructions or relevant module `CONTEXT.md`.

## Workflows

### Setup or repair

1. Initialize with `npx -y @oevery/rsp init [--agents-mode managed|print] [--with-project-setup]`.
2. `--with-project-setup` creates and focuses `changes/project-setup.md`; otherwise create it with `npx -y @oevery/rsp create project-setup` only when explicit bootstrap tracking is still needed.
3. Fill the bootstrap change if it exists, write durable architecture facts to `.rsp/specs/design.md`, and keep stable scoped operating instructions in the nearest project-owned `AGENTS.md`.
4. For diagnostics, run `npx -y @oevery/rsp doctor`.
5. For safe deterministic repairs, run `npx -y @oevery/rsp doctor --fix` or `npx -y @oevery/rsp update`.
6. When auditing manually, verify `.rsp/` exists, `AGENTS.md` has the managed block, `specs/design.md` exists, generated indexes are intact, and `focus.d/` markers match `changes/` files.
7. Treat `doctor --fix` `fixed` entries as actual filesystem changes. An empty `fixed` array or `No safe fixes needed.` means the repair pass changed nothing.
8. Do not use repair commands for semantic decisions such as stale focus removal, durable updates, or archive readiness.

### Focused work

1. Follow the managed `AGENTS.md` read order: nearest instructions, relevant context, this skill or fallback protocol, focus, selected Change, then relevant Specs.
2. Treat only `focus.d/` markers as current RSP work; do not treat unfocused files in `changes/` as current work unless the user explicitly asks or you run `npx -y @oevery/rsp focus <name>`.
3. Read the focused change before editing code.
4. If a focused change is missing an explicit `kind`, repair the frontmatter before continuing.
5. Run `npx -y @oevery/rsp check --focused` before treating focused work as ready; resolve placeholder or clarification warnings when they represent real unfinished content.
6. Treat `rsp check` warnings as deterministic hygiene signals, not as the durable-update decision.
7. Use `npx -y @oevery/rsp create <name> --lite` only when the user explicitly wants RSP tracking for a small, straightforward change.
8. Convert actionable `## Tasks` checkboxes into your agent-local task tracker when one is available.
9. Keep implementation sequential by default; parallelize only independent read-only discovery or mechanical checks.
10. Update `## Tasks`, `## Verify`, and any invalidated `## Proposal`, `## Spec`, or `## Design` content in the same working session as implementation facts change.
11. Keep temporary debugging notes, task history, and command transcripts out of `specs/` and project-owned `AGENTS.md` instructions.

### Pre-archive durable decision

1. Run `npx -y @oevery/rsp check --focused` for focused work, or `npx -y @oevery/rsp check` when reviewing all open changes.
2. Run `npx -y @oevery/rsp show --focused --json` or `npx -y @oevery/rsp ready <name> --json` to collect readiness, warnings, context paths, and `durableReview` guidance.
3. Treat `durableReview.candidateTargets` as advisory context for likely writable durable files, not as permission to edit generated indexes or bundled core rules.
4. Treat `Spec` delta markers (`### ADDED`, `### MODIFIED`, `### REMOVED`) as planning aids only; do not merge them automatically.
5. Read only the current change plus relevant `specs/`, nearest project-owned `AGENTS.md`, and code files needed for the semantic decision.
6. Produce the durable decision output before archiving.

## Durable decision

Return exactly one decision:

- `No durable update needed`
- `Update existing spec or scoped instruction`
- `Create a new durable spec` only when the knowledge is project-level, reusable, and does not fit `specs/design.md`, an existing spec, or a scoped project instruction

Prefer `No durable update needed` when no concrete stable fact is worth rereading in future sessions.

Write a durable update only when one of these is true:

- the change altered stable system behavior
- the change changed a project boundary, default, or constraint
- future agents or developers would likely make mistakes without the fact
- the fact is worth rereading in later sessions as durable project knowledge

Choose the smallest correct target:

- project-wide design, boundaries, defaults, and durable context -> `.rsp/specs/design.md`
- stable project or module operating instructions -> nearest project-owned `AGENTS.md`, only with authority to edit its non-managed content
- an additional reusable project-level spec -> `.rsp/specs/<name>.md`

Do not choose generated indexes, `.rsp/rsp-rules.md`, or the managed RSP block in `AGENTS.md` as ordinary durable writeback targets.

Prefer `.rsp/specs/design.md` or an existing durable file before creating a new spec file.

Write stable facts, not narrative history, task-by-task notes, temporary debugging history, or archive-only detail. If you cannot identify concrete durable facts, do not invent them.

## Output template

Use this exact format:

```md
## Durable Decision
- Decision: <No durable update needed | Update existing spec or scoped instruction | Create a new durable spec>
- Target: <path or N/A>
- Why:
  - <reason>
- Facts to write:
  - <durable fact>
- Archive ready: <yes | no>
```

Short example:

```md
## Durable Decision
- Decision: Update existing spec or scoped instruction
- Target: .rsp/specs/design.md
- Why:
  - The change introduced a stable default that future agents must follow.
- Facts to write:
  - Default API retries are capped at 3 attempts.
- Archive ready: no
```

Rules for the output:

- `Target` must be a concrete file path when the decision is not `No durable update needed`.
- `Facts to write` must contain durable facts, not task history or debugging notes.
- If real blockers remain or a required durable update is not yet written, `Archive ready` must be `no`.
- If no durable update is missing and remaining verify risk is consciously accepted, `Archive ready` may be `yes`.
- Do not use CLI warning text as a substitute for semantic durable-update judgment.
- CLI `archiveReady: judgment` means the skill or a human must decide; it is not automatic approval.
