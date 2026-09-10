# Fixture rules

- Use only project-installed Skills and `node __RSP_CLI_MJS__` for RSP commands; the harness replaces this token with the current compiled `dist/cli.mjs` path. Never use global `rsp` or `npx`.
- Release-note finalization, Change evidence updates, and verification are authorized; product code is already accepted and read-only.
- Commit, archive, push, tag, publication, and compatibility shims are denied.
