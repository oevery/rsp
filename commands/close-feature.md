---
description: Close RSP active feature
agent: plan
---
Close the active feature in the `RSP` workflow.

## Inputs

- `$1`: feature name for archive bundle naming

Ask for the feature name only when it cannot be inferred from the current spec or file layout.

## Detect the mode

Determine the mode using the `RSP` rules and the current `.ai/` files.

## Mode B

1. Read `.ai/spec.md` and `.ai/plan.md`.
2. Confirm the feature is complete.
3. Resolve the feature name.
4. Get the date with `!`rtk date +%Y-%m-%d`.
5. Create `.ai/archive/YYYY-MM-DD_<name>/`.
6. Copy the active files into that directory as `spec.md` and `plan.md`.
7. Reset `.ai/spec.md` with:

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

8. Reset `.ai/plan.md` with:

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

9. Leave placeholders in place unless the user already knows the next feature.

10. If the project uses git, suggest committing archived context and related code, but do not commit automatically.

## Mode A

1. Resolve the feature name.
2. Get the date with `!`rtk date +%Y-%m-%d`.
3. Create `.ai/archive/YYYY-MM-DD_<name>/`.
4. Move the active spec and plan into that directory as `spec.md` and `plan.md`.
5. Keep the archive grouped by feature bundle, not by file type.
6. If the project uses git, suggest committing archived context and related code, but do not commit automatically.

## Finish

- Confirm the final archive location.
- Confirm active files were reset or moved.
- Summarize what was archived.
