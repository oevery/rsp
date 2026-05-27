---
name: rsp
description: Use this skill when initializing RSP in a repository, operating an existing .rsp project, auditing or repairing .rsp state, or deciding whether a change needs durable updates before archive.
compatibility:
  agents:
    - any agent that supports the Agent Skills format
  requirements:
    - Node.js 18+
    - local filesystem read/write access
    - shell access for `rsp` or `npx -y @oevery/rsp`
  optional_requirements:
    - network access for first-run `npx` installation or skill refresh
metadata:
  author: oevery
  version: 2.0.3
---

# RSP Skill

Load this skill when you need to initialize RSP, operate an existing RSP project, audit or repair `.rsp/`, or decide whether a change needs durable updates before archive.

This skill operationalizes the rules in `.rsp/rules/rsp-rules.md`. Always load and follow those rules first.

Prefer exact file paths, exact commands, and exact durable facts over vague summaries.

## When to use

- Use this skill when a repository already contains `.rsp/` and the task is to operate within that workflow.
- Use this skill when adopting RSP in a repository that does not yet have `.rsp/`.
- Use this skill when the task is to audit or repair `.rsp/`, `AGENTS.md`, generated indices, or focus markers.
- Use this skill when deciding whether a completed change needs durable updates before archive.

## When not to use

- Do not load this skill for general coding tasks unrelated to `.rsp/`.
- Do not use this skill as a substitute for reading `.rsp/rules/rsp-rules.md` during a focused RSP task.
- Do not use this skill when the repository does not use RSP and the user did not ask to adopt it.

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
3. Run `npx -y @oevery/rsp check --focused` before treating a focused change as ready; resolve unfinished template placeholder and clarification-marker warnings when they indicate real unfinished content.
4. If an existing open change should become current work, use `npx -y @oevery/rsp focus <name>`.
5. Do not treat unfocused files in `changes/` as current work unless the user explicitly asks for them or you first run `npx -y @oevery/rsp focus <name>`.

Use `npx -y @oevery/rsp create <name> --lite` for small, straightforward work where the full template would add noise. The lite template keeps the same six required sections and still requires a durable-update decision before archive.

### Implement a focused change

1. Read the focused change before editing code.
2. Convert each actionable `## Tasks` checkbox into your agent-local task tracker when one is available.
3. Keep at most one implementation task actively in progress unless the user explicitly asks for parallel work.
4. When a task is completed in code, update the corresponding checkbox in the change file in the same working session.
5. If implementation findings invalidate the proposal, spec, or design, update the relevant section before continuing rather than leaving chat-only context.
6. After validation, update `## Verify` checkboxes with the exact commands or manual checks actually completed.
7. Do not write temporary debugging notes, task history, or command transcripts into `specs/` or `rules/`; keep them in the change file only when they are needed for the open work.

### Audit or repair

1. Check that `.rsp/` exists.
2. Check that `AGENTS.md` contains the managed RSP block.
3. Check that `specs/design.md` exists.
4. Check that `specs/INDEX.md` and `archives/INDEX.md` are still generated files.
   `specs/INDEX.md` should list only additional spec files beyond `specs/design.md`.
5. Check that `focus.d/` markers and `changes/` files are in sync.
6. If generated indices, bundled rules, or the managed AGENTS block drift, run `npx -y @oevery/rsp doctor --fix` or `npx -y @oevery/rsp update`.
7. Do not use `doctor --fix` as a semantic repair tool; it does not remove stale focus markers, edit config semantics, rename archive files, or decide durable updates.

## Expected outputs

- exact file paths to read or update
- exact RSP commands to run
- a single durable-decision result in the required template when evaluating archive readiness

**Delta markers are planning aids, not merge triggers.** Change `Spec` sections use `### ADDED`, `### MODIFIED`, and `### REMOVED` markers as lightweight planning scaffolds. `rsp archive` does **not** automatically merge those sections into `.rsp/specs/` or `.rsp/rules/`. Durable writeback remains an explicit semantic decision — never implied by delta marker presence.

**Pre-archive inspection.** Use `rsp ready <name>` or `rsp archive --dry-run <name>` to preview deterministic archive readiness (incomplete tasks, verify items, blockers, missing scenarios) without moving the change or clearing focus. Use `rsp show <name|--focused> --json` for machine-readable change context including path, kind, progress, blockers, scenario count, readiness signals, and recommended context paths. Treat `deterministic`, `semantic`, and `archiveReady` as guidance fields: deterministic signals come from the file structure, while semantic durable-update review still belongs to the skill or a human reviewer.

**Durable review guidance.** When `rsp ready --json` or `rsp show --json` includes `durableReview`, use its decision options and candidate targets to produce the durable decision output. Treat the guidance as advisory context only: do not auto-merge delta specs, and do not write durable files unless the semantic review identifies stable facts.

**Change hygiene inspection.** Use `rsp check [--focused]` to validate change structure and surface deterministic hygiene warnings. Placeholder and clarification warnings mean the change may still contain unfinished template text or unresolved questions; they are not a substitute for the semantic durable-update decision.

## Trigger examples

- "Set up RSP in this repository."
- "Repair the broken .rsp state in this project."
- "Check whether this change needs spec or rule writeback before archive."
- "Audit the RSP setup and tell me what is missing."

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
