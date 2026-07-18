---
description: Continue work on the current or selected change
---
Inspect RSP status with:

`npx -y @oevery/rsp status --verbose`

`npx -y @oevery/rsp show --focused --verbose`

Then continue with the following rules:
1. If there is exactly one focused change, continue working on it directly
2. If there are multiple focused changes, tell the user to choose one from the focused set
3. If there is no focused change, show `nextActions` and guide the user to focus an existing open change or use `rsp:start`

Before implementation:
1. Read the target change
2. Read nearest `AGENTS.md`, relevant `CONTEXT.md`, the `rsp` skill or `.rsp/rsp-rules.md` fallback, focused work, and only relevant Specs
3. Summarize the current phase, blockers, and next actions
4. If implementation is needed, keep code changes and change-file updates in sync

Constraints:
- Do not infer current work from `.rsp/changes/`
- Treat `focus.d/` as the only current focus truth source
- If the change is missing an explicit `kind`, fix the frontmatter before continuing
