# Fixture rules

- `.rsp/changes/normalize-device-id.md` is the only product authority.
- `handoff.md` is transient continuation context, not authority.
- Mutation is limited to the files named by the request.
- Use `node __RSP_CLI_MJS__` for RSP commands; the harness replaces this token with the current compiled `dist/cli.mjs` path. Never use global `rsp` or `npx`.
- Automated tests cannot satisfy receiver-device acceptance.
- Return human-facing status in Simplified Chinese.
