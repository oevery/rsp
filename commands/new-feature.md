---
description: Start RSP feature context
agent: plan
---
Start a new feature in the `RSP` workflow.

## Inputs

- `$1`: feature name in kebab-case
- `$2`: optional one-line summary

If the name is missing, ask for it. If the summary is missing, infer it from context when possible; otherwise ask once.

## Detect the mode

Determine the mode using the `RSP` rules and the current `.ai/` files.

## Mode B

Work in `.ai/spec.md` and `.ai/plan.md`.

Create `.ai/` if needed, then write:

```markdown
# Current Feature

## Summary
<One-line summary>

## Acceptance Criteria
- [ ] <Todo>
- [ ] <Todo>

## Constraints
- <Constraint>
```

to `.ai/spec.md`, and write:

```markdown
# Execution Plan

## Status Legend
- [ ] Todo
- [/] In Progress
- [-] Dropped
- [x] Done and verified

## Phases
- [ ] Analysis
- [ ] Implementation
- [ ] Validation

## Blockers
None
```

to `.ai/plan.md`.

Replace placeholder values such as `<One-line summary>`, `<Todo>`, and `<Constraint>` with content for the current feature.

## Mode A

Create these files if needed:

- `.ai/specs/<name>.md`
- `.ai/plans/<name>_plan.md`

Use the same inline templates as Mode B.

## Finish

- Confirm the files exist.
- Summarize the chosen mode and created paths.
- Use semantic checkboxes in any plan checklist that gets added later.
- If rules are missing, recommend `/init-rsp`.
