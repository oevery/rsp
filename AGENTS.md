# rsp

<!-- rsp:begin -->
## RSP Entry

RSP keeps durable rules, specs, and current work under `.rsp/`.
Treat AGENTS.md as navigation only; keep durable rules and design in `.rsp/`.

Read in order:
1. .rsp/rules/rsp-rules.md
2. .rsp/focus.d/
3. matching .rsp/changes/*.md for the focused entries
4. .rsp/specs/design.md
5. .rsp/specs/INDEX.md
6. only the relevant additional .rsp/rules/*.md and .rsp/specs/*.md files

If `.rsp/focus.d/` is empty and the user has not provided a concrete task, ask what to work on or suggest `npx -y @oevery/rsp create <name>` for tracked work.
If your agent supports Agent Skills, load `rsp` for setup, repair, and durable-decision tasks.
<!-- rsp:end -->

## Maintainer Research

For upstream preparation, source distillation, or cross-source model synthesis, load the repo-local `distill-upstream` skill. Keep research under `research/`; promote selected recommendations through a normal RSP change.
