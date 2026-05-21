---
name: rsp-rules
description: RSP rules for Rules, Spec, and Plan driven development.
---

# RSP

RSP = Rules, Spec, Plan.

Use `.ai/rules`, `.ai/spec`, and `.ai/plan` as the active development context.

## File roles

- `rules` define stable technical constraints and conventions.
- `spec` defines the current business truth.
- `plan` tracks execution state and remaining work.
- Keep business rules out of `rules`.
- Keep technical conventions out of `spec`.

## Semantic checkboxes

- Use semantic checkboxes in `plan` files and execution checklists.
- `[ ]` = todo.
- `[/]` = in progress.
- `[-]` = dropped.
- `[x]` = done and verified.
- Use `[/]` to signal active ownership and reduce concurrent edit conflicts.
- Use `[x]` only after validation.

## Mode detection

- If `AGENTS.md` declares a mode, follow it.
- If `.ai/spec.md` or `.ai/plan.md` exists, treat the project as Mode B.
- If `.ai/specs/` or `.ai/plans/` exists, treat the project as Mode A.
- If nothing exists yet, default to Mode B unless the user wants parallel or multi-branch work.

## Mode B

- Active files: `.ai/spec.md`, `.ai/plan.md`.
- Use one active feature at a time.
- Keep `.ai/archive/` even in Mode B.
- After delivery, archive `spec.md` and `plan.md` into `.ai/archive/YYYY-MM-DD_feature-name/`, then reset the active files for the next feature.
- Do not rely on clearing files alone as historical storage.

## Mode A

- Active files: `.ai/specs/*.md`, `.ai/plans/*.md`.
- Archive completed work into `.ai/archive/YYYY-MM-DD_feature-name/`.
- Archive by feature bundle, not by file type.

## Agent behavior

- Suggest `/init-rsp` when the project is missing `.ai/` directory or context files.
- Suggest `/new-feature <name>` when starting a new feature.
- Re-read `spec` before changing behavior.
- Update `plan` when phases, checklist state, or scope changes.
- If implementation changes the requirement, update `spec` explicitly.
- Before finishing a feature, ensure code matches `spec` and `plan` reflects reality.
- Suggest `/close-feature <name>` for completion and archive flows.
- Keep active `spec` files concise and focused on the current feature.
