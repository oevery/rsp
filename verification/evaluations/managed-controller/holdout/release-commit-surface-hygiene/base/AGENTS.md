# Fixture rules

- Use only project-installed Skills and `node __RSP_CLI_MJS__` for RSP commands; the harness replaces this token with the current compiled `dist/cli.mjs` path. Never use global `rsp` or `npx`.
- English Conventional Commits are required. One local commit is authorized after verification.
- Archive, push, tag, publication, amend, and rebase are denied.
