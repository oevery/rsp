# Fixture rules

- Use only project-installed Skills and `node __RSP_CLI_MJS__` for RSP commands; the harness replaces this token with the current compiled `dist/cli.mjs` path. Never use global `rsp` or `npx`.
- Modify only the focused Change, ready-state persistence, and existing test.
- Commit, archive, push, tag, and publication are denied.
