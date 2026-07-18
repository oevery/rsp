---
description: Close the current change and archive it when ready
---
Inspect readiness with:

`npx -y @oevery/rsp check --focused --verbose`

`npx -y @oevery/rsp show --focused --json`

Then:
1. Summarize deterministic issues
2. If the `rsp` skill is available, load it for the durable decision
3. Produce a durable decision based on the current focused change, relevant `.rsp/specs/`, nearest project instructions, and required code context
4. If a durable update is needed, update the relevant `.rsp/specs/*.md` or authorized nearest `AGENTS.md` content first
5. Identify the exact focused change name from `show --focused --json`
6. Only when the same focused change is ready, archive it with:

`npx -y @oevery/rsp archive <focused-change-name>`

The durable decision must use this exact template:

```md
## Durable Decision
- Decision: <No durable update needed | Update existing spec or scoped instruction | Create a new durable spec>
- Target: <path or N/A>
- Why:
  - <reason>
- Facts to write:
  - <durable fact>
- Archive ready: <yes | no>
```

Constraints:
- Treat `rsp check` warnings as deterministic hygiene signals
- Do not treat CLI warnings as a substitute for the durable decision
- `Target` must be a concrete file path when the decision is not `No durable update needed`
- `Facts to write` must contain stable facts only, not task history, debugging notes, or archive-only detail
- Do not use generated indexes, `.rsp/rsp-rules.md`, or the managed AGENTS block as ordinary durable writeback targets
- If there is no focused change, say so clearly and stop instead of choosing an open change yourself
- Do not archive a `$1` argument that differs from the focused change you reviewed
