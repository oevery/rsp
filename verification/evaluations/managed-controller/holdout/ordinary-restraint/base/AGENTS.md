# Fixture rules

- `.rsp/changes/format-label.md` is the only product authority.
- This is one small, tightly scoped implementation slice.
- Use `node __RSP_CLI_MJS__` for RSP commands; the harness replaces this token with the current compiled `dist/cli.mjs` path. Never use global `rsp` or `npx`.
- Return human-facing status in Simplified Chinese.
