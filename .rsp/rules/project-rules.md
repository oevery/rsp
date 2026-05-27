---
name: project-rules
description: Project-specific rules for @oevery/rsp
---

# Project Rules

## Scope
- Bundled RSP assets in the repository root are the source for generated project-local RSP files.
- When changing core RSP rules, edit `rules/rsp-rules.md` first, then run `node dist/cli.mjs update` or `rsp update` to sync `.rsp/rules/rsp-rules.md`.
- Do not manually edit `.rsp/rules/rsp-rules.md` for bundled rule changes; treat it as generated from `rules/rsp-rules.md`.
- Do not put temporary debugging steps here.

## Validation
- `pnpm run build`
- `pnpm run lint`
- `pnpm run test`

## Conventions
- Keep tests focused on observable behavior and command outputs. Do not add tests that merely lock duplicated generated content in `.rsp/` against bundled root assets.
