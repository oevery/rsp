---
name: rsp
description: RSP workflow for Rules, Spec, and Plan driven development.
---

# RSP

RSP = Rules, Spec, Plan.

Use this skill when a project manages active work through `.ai/` context files.

## When to use

- When starting an AI-assisted project and you need structured feature lifecycle management.
- When you want to keep implementation aligned with business intent through explicit `spec` and `plan` files.
- When you need to archive completed features for later AI retrieval and few-shot reuse.
- When you want semantic checkboxes in `plan` files to reduce multi-agent write conflicts.

## What this skill enforces

- `rules` define stable technical constraints and architecture conventions.
- `spec` defines the current business truth.
- `plan` tracks execution progress and remaining work.
- Rules answer `how`; specs answer `what`; plans answer `when` and `what is left`.
- Keep the current feature context small, explicit, and easy to reload.

## Semantic checkboxes

Use semantic checkboxes in `plan` files and execution checklists:

- `[ ]` = todo
- `[/]` = in progress
- `[-]` = dropped
- `[x]` = done and verified

Guidelines:

- Use `[/]` to signal active ownership and reduce multi-agent write conflicts.
- Use `[x]` only after validation, not after implementation only.

## Detect the project mode

Use this order:

1. If `AGENTS.md` declares a mode, trust it.
2. If `.ai/spec.md` or `.ai/plan.md` exists, treat the project as Mode B.
3. If `.ai/specs/` or `.ai/plans/` exists, treat the project as Mode A.
4. If nothing exists yet, default to Mode B unless the user asks for parallel or multi-branch workflows.

## Mode B: lean single-feature flow

Recommended for solo work and linear iteration.

```text
my-project/
|-- AGENTS.md
`-- .ai/
    |-- archive/
    |-- rules.md
    |-- spec.md
    `-- plan.md
```

Guidelines:

- Keep exactly one active feature in `.ai/spec.md` and `.ai/plan.md`.
- Update `.ai/spec.md` when the business requirement changes.
- Update `.ai/plan.md` as work progresses.
- Archive completed work into `.ai/archive/YYYY-MM-DD_feature-name/` even in Mode B.
- After archiving, reset `.ai/spec.md` and `.ai/plan.md` as the next active workspace.
- Suggest a commit after archive when the project uses git, but do not auto-commit.

Risk:

- This mode is weak for parallel branches because the same files will conflict.

## Mode A: structured multi-feature flow

Recommended for teams, large projects, or parallel branches.

```text
 .ai/
|-- rules/
|-- specs/
|-- plans/
`-- archive/
```

Guidelines:

- Split active business definitions into `.ai/specs/<feature>.md`.
- Split active execution plans into `.ai/plans/<feature>_plan.md`.
- Keep archives grouped by feature event, not by file type.

Preferred archive shape:

```text
.ai/archive/
`-- YYYY-MM-DD_feature-name/
    |-- spec.md
    |-- plan.md
    `-- notes.md
```

Reason:

- A feature bundle preserves intent and execution history in one place.
- This is better for later review, retrieval, and few-shot reuse.

## Standard workflow

### New project

1. Run `/init-rsp`.
2. Create `AGENTS.md` and declare the chosen mode.
3. Fill `.ai/rules.md` or `.ai/rules/*.md` with stable technical conventions only.
4. Use semantic checkboxes in all plan checklists.

### New feature

1. Run `/new-feature <name>`.
2. Write or refine the business definition in `spec`.
3. Write or refine the execution checklist in `plan`.

### During implementation

1. Re-read `spec` before changing behavior.
2. Update `plan` when phases or checklists change.
3. If implementation reveals a requirement mismatch, update `spec` explicitly instead of silently diverging.

### Feature completion

1. Confirm code matches `spec`.
2. Confirm `plan` reflects completed work.
3. Run `/close-feature <name>`.
4. Mode B: archive the active files, then reset them for the next feature.
5. Mode A: move the active feature files into a feature bundle.
6. Suggest a commit after archive if the project uses git.

## Commands

| Command | Purpose | Mode |
|---|---|---|
| `/init-rsp` | Initialize project context | A/B |
| `/new-feature <name>` | Start active feature context | A/B |
| `/close-feature <name>` | Archive and close active feature | A/B |

## AGENTS.md template

```markdown
# Project Overview
[One-line project summary]

## Collaboration Mode
This project uses **Mode B**:
- `.ai/rules.md` stores stable technical rules.
- `.ai/spec.md` stores the current feature definition.
- `.ai/plan.md` stores progress and remaining work.
- `.ai/archive/` stores completed feature bundles.
- After delivery, archive the active files and reset them for the next feature.
- Use `/init-rsp` to bootstrap, `/new-feature` to start work, `/close-feature` to archive.
```

## Anti-patterns

- Do not put business rules into `rules.md`.
- Do not put technical conventions into `spec.md`.
- Do not keep multiple "current feature" specs in Mode B.
- Do not archive by file type such as `archive/specs/` and `archive/plans/`.
- Do not let `spec.md` grow into a permanent knowledge base.

## Integration requirements

For the full workflow, the host Kilo setup should provide:

1. Instruction loading for:
   - `./.ai/rules.md`
   - `./.ai/rules/*.md`
   - `./.ai/spec.md`
   - `./.ai/specs/*.md`
   - `./.ai/plan.md`
   - `./.ai/plans/*.md`
   - `./.ai/archive/**/*.md`
2. Edit permissions for `spec`, `plan`, and archive paths.
3. Companion commands such as `/init-rsp`, `/new-feature`, and `/close-feature`.
