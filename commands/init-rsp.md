---
description: Init RSP project context
agent: plan
---
Initialize a project for the `RSP` workflow.

## Choose the mode

Use `$1` if provided. Otherwise ask the user to choose:

- **Mode B (recommended)**: one active feature at a time using `.ai/rules.md`, `.ai/spec.md`, `.ai/plan.md`, `.ai/archive/`
- **Mode A**: parallel or team workflows using `.ai/rules/`, `.ai/specs/`, `.ai/plans/`, `.ai/archive/`

## Setup

Create `.ai/` if needed, then create:

- `.ai/archive/`

## Write files

### Mode B

- Write `.ai/rules.md` with:

```markdown
# Rules

## Coding
- 

## Architecture
- 

## Tooling
- 
```

- Write `.ai/spec.md` with:

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

- Write `.ai/plan.md` with:

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

### Mode A

- Create `.ai/rules/`, `.ai/specs/`, `.ai/plans/`, `.ai/archive/`
- Write `.ai/rules/frontend.md` with:

```markdown
# Frontend Rules

## UI
- 

## State
- 

## Tooling
- 
```

- Write `.ai/rules/backend.md` with:

```markdown
# Backend Rules

## API
- 

## Data
- 

## Tooling
- 
```

## Finish

Tell the user to:

1. Fill the rules files with stable technical conventions.
2. Create `AGENTS.md` and declare the chosen mode.
3. Use semantic checkboxes in plan files.
4. Run `/new-feature <name>` to start the first feature.
