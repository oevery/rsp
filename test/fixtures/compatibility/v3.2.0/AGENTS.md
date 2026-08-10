# rsp-v3-2-published-fixture

<!-- rsp:begin -->
## RSP Entry

RSP tracks current work, stable specs, and archives under `.rsp/`.

Read in order:
1. Nearest `AGENTS.md` for project or module instructions.
2. Root `CONTEXT-MAP.md` if present, then the relevant nearest `CONTEXT.md`.
3. Use the project `rsp` Skill at `.agents/skills/rsp/SKILL.md`; hosts may load it through Skill discovery or read it directly. Only when it is absent or cannot be used, read `.rsp/rsp-rules.md` as the fallback protocol.
4. `.rsp/focus.d/`; for grouped work read the sibling Group Brief, then the explicitly selected focused Change.
5. Only the relevant Specs and Decision Records under the configured authoritative path.

If `.rsp/focus.d/` is empty and the user has not provided a concrete task, ask what to work on or suggest `npx -y @oevery/rsp create <name>` for tracked work.
Do not treat `.rsp/specs/` or `.rsp/changes/` as replacements for nearest `AGENTS.md` or `CONTEXT.md`.
<!-- rsp:end -->

