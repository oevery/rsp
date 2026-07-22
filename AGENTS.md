# rsp

<!-- rsp:begin -->
## RSP Entry

RSP tracks current work, stable specs, and archives under `.rsp/`.

Read in order:
1. Nearest `AGENTS.md` for project or module instructions.
2. Root `CONTEXT-MAP.md` if present, then the relevant nearest `CONTEXT.md`.
3. The `rsp` skill; if unavailable, read `.rsp/rsp-rules.md` as the fallback protocol.
4. `.rsp/focus.d/`; for grouped work read the sibling Group Brief, then the explicitly selected focused Change.
5. Only the relevant Specs and Decision Records under the configured authoritative path.

If `.rsp/focus.d/` is empty and the user has not provided a concrete task, ask what to work on or suggest `npx -y @oevery/rsp create <name>` for tracked work.
Do not treat `.rsp/specs/` or `.rsp/changes/` as replacements for nearest `AGENTS.md` or `CONTEXT.md`.
<!-- rsp:end -->

## Project Development

- Bundled assets in the repository root are the authored package sources.
- Edit `rules/rsp-rules.md`, build the CLI, then run `node dist/cli.mjs update` to sync the self-hosted `.rsp/rsp-rules.md` fallback.
- Validate implementation changes with `mise exec -- pnpm run build`, `mise exec -- pnpm run lint`, and `mise exec -- pnpm run test`.
- Keep tests focused on observable behavior and public command output rather than duplicated generated content.

## Project Skill Dogfooding

- Use the repository-discovered `rsp`, `rsp-shape`, `rsp-design`, `rsp-implement`, `rsp-diagnose`, `rsp-tdd`, `rsp-review`, `rsp-address-review`, and `rsp-release-docs` Skills for matching work in this checkout.
- These entries are live projections of the authored package sources under `skills/`; edit the authored source, not `.agents/skills/`.
- Keep overlapping global engineering workflow Skills disabled in the maintainer environment while dogfooding so RSP capability gaps remain visible. Codex currently supports Skill disablement in user config, not project `.codex/config.toml`; do not add a misleading project-local disable list.

## Maintainer Research

For upstream preparation, source distillation, or cross-source model synthesis, load the repo-local `distill-upstream` skill. Keep research under `research/`; promote selected recommendations through a normal RSP change.
