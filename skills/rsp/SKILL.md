---
name: rsp
description: Use this skill when initializing RSP, operating an existing .rsp project, auditing or repairing .rsp state, or deciding whether a change needs durable updates before archive.
license: MIT
metadata:
  author: oevery
  version: "2026.07.20.1"
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
6. When auditing manually, verify `.rsp/`, managed roots, and nested Spec parents are real directories; the project `AGENTS.md`, managed markers, fallback/config files, indexes, and placeholders are regular files; `AGENTS.md` has the managed block; `specs/design.md` and the configured Decision Record directory exist; every group has one valid brief with matching direct children; work and archive trees are flat or one group level; and `focus.d/` markers match executable Changes.
7. Treat `doctor --fix` `fixed` entries as actual filesystem changes. An empty `fixed` array or `No safe fixes needed.` means the repair pass changed nothing.
8. Do not use repair commands for semantic decisions such as stale focus removal, durable updates, or archive readiness.

### Focused work

1. Follow the managed `AGENTS.md` read order: nearest instructions, relevant context, this skill or fallback protocol, focus, optional sibling Group Brief, selected Change, then relevant Specs and Decision Records.
2. Treat only `focus.d/` markers as current RSP work; do not treat unfocused files in `changes/` as current work unless the user explicitly asks or you run `npx -y @oevery/rsp focus <name>`.
3. Resolve executable Change names as either `<change>` or one direct `<group>/<change>` child. Require a real `changes/` root and real existing `focus.d/`, `archives/`, and group prefixes; reject symlinks, incomplete inspection, deeper paths, and file/directory identity collisions.
4. Use a Change Group only for at least two independently executable Changes sharing one goal or completion contract. Create it with `npx -y @oevery/rsp group create <group> [goal]`, then replace the brief placeholders and declare every direct child identity and boundary under `Slices` before creating children.
5. Treat logical `<group>/brief`, physically stored as `<group>/00-brief.md`, as non-executable and non-focusable. For grouped work, read it before the selected child Change. Its `Slices` declaration order guides navigation; a Brief blocker is inherited as an external blocker by every direct child without creating edges. Archive children independently, then close only the brief with `npx -y @oevery/rsp group close <group>` when all group gates pass.
6. Declare an exact prerequisite only as `- requires \`<change-work-ref>\`: <reason>` under the dependent Change's `Blockers`. Targets must be executable Changes, not Group Briefs. Keep external blockers as ordinary prose and never infer an edge from them.
7. Use `npx -y @oevery/rsp status --json` as the derived dependency view. Read `plan.ready`, `plan.edges`, `plan.blocked`, and `plan.waves`; each edge contains `requires`, `reason`, and `state`. Do not create or maintain a separate graph or copy live delivery state into a Group Brief. Archived prerequisites resolve without rewriting the dependent Change, while incomplete archive inspection produces no ready plan.
8. Read the focused change before editing code.
9. If a focused change is missing an explicit `kind`, repair the frontmatter before continuing.
10. Run `npx -y @oevery/rsp check --focused` before treating focused work as ready; resolve dependency errors, placeholders, or clarification warnings when they represent real unfinished content.
11. Treat `rsp check` warnings as deterministic hygiene signals, not as the durable-update decision.
12. Use `npx -y @oevery/rsp create <name> --lite` only when the user explicitly wants RSP tracking for a small, straightforward change.
13. Convert actionable `## Tasks` checkboxes into your agent-local task tracker when one is available.
14. Keep implementation sequential by default; parallelize only independent read-only discovery or mechanical checks.
15. Update `## Tasks`, `## Verify`, and any invalidated `## Proposal`, `## Spec`, or `## Design` content in the same working session as implementation facts change.
16. Keep temporary debugging notes, task history, and command transcripts out of `specs/` and project-owned `AGENTS.md` instructions.

### Pre-archive durable decision

1. Run `npx -y @oevery/rsp check --focused` for focused work, or `npx -y @oevery/rsp check` when reviewing all open changes.
2. Run `npx -y @oevery/rsp show --focused --json` or `npx -y @oevery/rsp ready <name> --json` to collect readiness, warnings, context paths, and `durableReview` guidance.
3. Treat `durableReview.factCandidateTargets` and `durableReview.decisionRecordsPath` as advisory routing context, not as permission to edit generated indexes or invent a Decision Record filename.
4. Treat `Spec` delta markers (`### ADDED`, `### MODIFIED`, `### REMOVED`) as planning aids only; do not merge them automatically.
5. Read only the current Change, relevant Specs and Decision Records, nearest project-owned `AGENTS.md`, and code files needed for the semantic decision.
6. Produce the durable decision output before archiving.

## Durable decision

Choose one current-fact decision and one rationale decision independently.

Current facts:

- `No current-fact update needed`
- `Update existing spec or scoped instruction`
- `Create a new durable spec` only when the knowledge is project-level, reusable, and does not fit `specs/design.md`, an existing spec, or a scoped project instruction

Rationale:

- `No Decision Record needed`
- `Create or update a Decision Record`

Prefer no update on either axis when there is no concrete stable fact or lasting rationale worth rereading.

Write a durable update only when one of these is true:

- the change altered stable system behavior
- the change changed a project boundary, default, or constraint
- future agents or developers would likely make mistakes without the fact
- the fact is worth rereading in later sessions as durable project knowledge

Create or update a Decision Record only when the choice is hard to reverse, would be surprising without context, and reflects a real tradeoff. Decision Records own rationale, alternatives, tradeoffs, and consequences; Specs own what is currently true.

Choose the smallest correct target:

- project-wide design, boundaries, defaults, and durable context -> `.rsp/specs/design.md`
- stable project or module operating instructions -> nearest project-owned `AGENTS.md`, only with authority to edit its non-managed content
- an additional reusable project-level spec -> `.rsp/specs/<name>.md`
- lasting rationale -> one exact Markdown file under `durableReview.decisionRecordsPath`

Do not choose generated indexes, `.rsp/rsp-rules.md`, or the managed RSP block in `AGENTS.md` as ordinary durable writeback targets.

Prefer `.rsp/specs/design.md` or an existing durable file before creating a new spec file.

Write stable facts or lasting rationale, not narrative history, task-by-task notes, temporary debugging history, or archive-only detail. Do not duplicate current facts into a Decision Record or rationale into a Spec. If you cannot identify concrete durable content, do not invent it.

## Output template

Use this exact format:

```md
## Durable Decision
- Current facts: <No current-fact update needed | Update existing spec or scoped instruction | Create a new durable spec>
- Current-fact target: <exact file path or N/A>
- Facts to write:
  - <durable fact or none>
- Decision Record: <No Decision Record needed | Create or update a Decision Record>
- Decision Record target: <exact file path or N/A>
- Rationale to write:
  - <lasting rationale or none>
- Archive ready: <yes | no>
```

Short example:

```md
## Durable Decision
- Current facts: Update existing spec or scoped instruction
- Current-fact target: .rsp/specs/design.md
- Facts to write:
  - Default API retries are capped at 3 attempts.
- Decision Record: No Decision Record needed
- Decision Record target: N/A
- Rationale to write:
  - none
- Archive ready: no
```

Rules for the output:

- Each target must be an exact file path when its decision requires an update; `durableReview.decisionRecordsPath` is a directory, not the final target.
- `Facts to write` must contain durable facts, not task history or debugging notes.
- `Rationale to write` must contain lasting rationale, alternatives, tradeoffs, or consequences, not a duplicate of current facts.
- If real blockers remain or a required fact or rationale update is not yet written, `Archive ready` must be `no`.
- If neither axis has a missing update and remaining verify risk is consciously accepted, `Archive ready` may be `yes`.
- Do not use CLI warning text as a substitute for semantic durable-update judgment.
- CLI `archiveReady: judgment` means the skill or a human must decide; it is not automatic approval.
